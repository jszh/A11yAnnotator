#!/usr/bin/env node
// Headless DYNAMIC / behavioral driver (v3) for the parallel skills evaluation.
//
// Exercises the page in the agent's own browser so behavioral skills get a REAL
// verdict, and captures per-element appearance + keyboard-focused screenshots.
// Navigation is suppressed (request-abort + click/submit preventDefault) so a
// probe can't unload the page; a reload "recovery net" navigates back if the page
// ever drifts off its URL.
//
// Per-element coverage (the core of v3): for every sampled element we do a LOCAL
// keyboard Tab walk AND a LOCAL screen-reader walk *around the element* — go ~5
// stops before it, then ~15 forward — so every target is actually reached by real
// keyboard and by the SR cursor (not just the first N on the page), capturing its
// genuine focus indicator (visual diff), its position in focus/reading order, and
// what the SR voices in context.
//
// Also: global tab-walk (traps/overall order), activation (click + Enter/Space)
// with context/navigation + live-region/VSR announcement capture, focus-RETURN
// after a modal closes, arrow-key probing for composite widgets, hover→Esc/hover-
// persistence (1.4.13), and a page-level form error-on-submit probe (3.3.1/3.3.3).
//
// Noscript pages: their own JS blanks the SSR DOM on hydration (verified: 0/21
// elements survive scripted), so they are served noscript. CSS-driven things (Tab
// order, focus indicators, hover) still work; click-triggered app announcements
// cannot fire → reported scriptsDisabled, those sub-verdicts stay PARTIAL.
//
// Usage: node scripts/drive-page.js --file "<saved file>" --shotdir <dir> [--xpaths f.json] [--maxtab 50]

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const A = require('./lib/a11y-eval.js'); // shared pure helpers (see HARNESS-ISSUES.md)

const ROOT = path.join(__dirname, '..');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = process.env.PORT ? +process.env.PORT : 3001;
const BASE = process.env.A11Y_BASE || `http://127.0.0.1:${PORT}`;
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : d; };
const has = (n) => args.includes('--' + n);

const FILE = opt('file');
if (!FILE) { console.error('need --file'); process.exit(2); }
const SETTLE = parseInt(opt('settle', '1400'), 10);
// T13: raise the default global tab-walk cap (was 50 — missed deep elements on
// large pages) and bound it by a wall-clock budget instead.
const MAXTAB = parseInt(opt('maxtab', '120'), 10);
const TABWALK_BUDGET_MS = parseInt(opt('tabwalk-budget', '20000'), 10);
const SHOTDIR = opt('shotdir', '/tmp');
const PAD = 10;
const sleep = ms => new Promise(r => setTimeout(r, ms));

function isNoscriptFlagged(file) {
  try {
    const pj = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/pages.json'), 'utf8'));
    const list = Array.isArray(pj) ? pj : pj.pages;
    return !!(list || []).find(p => p.file === file && p.noscript);
  } catch (e) { return false; }
}
const NOSCRIPT = has('noscript') ? true : has('scripts') ? false : isNoscriptFlagged(FILE);

function loadXpaths() {
  if (has('xpaths')) {
    const arr = JSON.parse(fs.readFileSync(opt('xpaths'), 'utf8'));
    return arr.map(x => (typeof x === 'string' ? x : x.xpath)).filter(Boolean);
  }
  const ss = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/samples-saved.json'), 'utf8'));
  const entry = ss['saved/' + FILE];
  if (!entry || !entry.sampled) return [];
  const out = [];
  for (const lm of Object.keys(entry.sampled)) for (const el of entry.sampled[lm]) out.push(el.xpath);
  return out;
}

(async () => {
  try { fs.mkdirSync(SHOTDIR, { recursive: true }); } catch (e) {}
  const xpaths = loadXpaths();
  const out = { file: FILE, noscript: NOSCRIPT, scriptsDisabled: NOSCRIPT, maxTab: MAXTAB, problems: [] };
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try { const _bc = await browser.target().createCDPSession(); await _bc.send('Browser.setDownloadBehavior', { behavior: 'deny' }); } catch (e) {}
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
    page.on('pageerror', () => {});
    // T1/T8: CDP session for forced :focus-visible probing (deterministic ring read).
    const cdp = await page.createCDPSession();
    try { await cdp.send('DOM.enable'); await cdp.send('CSS.enable'); } catch (e) {}
    let guardNav = false;
    await page.setRequestInterception(true);
    page.on('request', req => {
      try { if (guardNav && req.isNavigationRequest() && req.frame() === page.mainFrame()) req.abort('aborted'); else req.continue(); }
      catch (e) { try { req.continue(); } catch (_) {} }
    });
    const mkUrl = (ns) => BASE + '/assets/saved/' + encodeURIComponent(FILE) + '?offline=1' + (ns ? '&noscript=1' : '');
    let serveNoscript = NOSCRIPT;
    let url = mkUrl(serveNoscript);

    async function injectHelpers() {
      await page.evaluate(() => {
        window.__getXPath = function (e) {
          if (!e || !e.tagName) return '';
          if (e === document.body) return '/html/body';
          if (e === document.documentElement) return '/html';
          var ns = e.namespaceURI, isHtml = !ns || ns === 'http://www.w3.org/1999/xhtml';
          var t = isHtml ? e.tagName.toLowerCase() : e.tagName, idx = 1, sib = e.previousElementSibling;
          while (sib) { if (sib.tagName === e.tagName) idx++; sib = sib.previousElementSibling; }
          return window.__getXPath(e.parentElement) + (isHtml ? '/' + t + '[' + idx + ']' : "/*[local-name()='" + t + "'][" + idx + ']');
        };
        if (!window.__navGuardInstalled) {
          document.addEventListener('click', function (e) { const a = e.target && e.target.closest && e.target.closest('a[href]'); if (a) e.preventDefault(); }, true);
          window.addEventListener('submit', function (e) { e.preventDefault(); }, true);
          window.__navGuardInstalled = true;
        }
      }).catch(() => {});
      // T14: hide third-party cookie/consent overlays so they don't darken every
      // screenshot, trap Tab, or pollute the forms inventory.
      out.consentHidden = await page.evaluate((selectors) => {
        let n = 0;
        for (const sel of selectors) { let els; try { els = document.querySelectorAll(sel); } catch (e) { continue; } for (const el of els) { el.style.setProperty('display', 'none', 'important'); n++; } }
        return n;
      }, A.CONSENT_SELECTORS).catch(() => 0);
      try {
        await page.evaluate(async (u) => { const mod = await import(u); window.__vsr = mod.virtual; }, `${BASE}/virtual-sr.js`);
        await page.evaluate(async () => { try { await window.__vsr.start({ container: document.body }); } catch (e) {} });
        return true;
      } catch (e) { return false; }
    }
    async function reloadPage() {
      guardNav = false;
      // T9: stop the virtual SR cleanly before navigating so it doesn't carry a
      // stale cursor / re-emit the document-root phrase after the reload.
      try { await page.evaluate(async () => { try { await window.__vsr.stop(); } catch (e) {} }); } catch (e) {}
      await page.goto(url, { waitUntil: 'load', timeout: 45000 }).catch(() => {});
      if (SETTLE) await sleep(Math.min(SETTLE, 900));
      await injectHelpers(); guardNav = true;
    }
    // ADAPTIVE serving: ~3 of the 13 noscript-flagged pages (Quizlet/Gymshark/H&M)
    // actually survive hydration. For a noscript-flagged page, try scripted first;
    // if the sampled DOM survives (≥50% xpaths resolve, body non-trivial), drive it
    // scripted so click-triggered announcements CAN fire. Else fall back to noscript.
    out.noscriptFlagged = NOSCRIPT;
    // Of the 13 noscript-flagged pages, exactly 3 survive scripted hydration (proven
    // empirically: Quizlet 20/20, Gymshark 19/21, H&M 13/21); the other 10 blank
    // their DOM AND can wedge the renderer/shared server if scripted. So serve those
    // 3 scripted (real announcements) by NAME, and never scripted-probe the rest.
    const SCRIPTED_SURVIVORS = ['Quizlet', 'Gymshark', 'H&M'];
    if (NOSCRIPT && !has('noscript') && SCRIPTED_SURVIVORS.some(s => FILE.includes(s))) {
      serveNoscript = false; out.adaptiveScripted = true; url = mkUrl(false);
    }
    out.scriptsDisabled = serveNoscript;
    await page.goto(url, { waitUntil: 'load', timeout: 45000 }).catch(e => { out.problems.push('goto: ' + e.message); });
    if (SETTLE) await sleep(SETTLE);
    out.vsr = await injectHelpers();
    if (!out.vsr) out.problems.push('vsr inject failed');
    guardNav = true;

    async function diffPct(b64a, b64b) {
      if (!b64a || !b64b) return null;
      return page.evaluate(async (a, b) => {
        async function load(s) { const i = new Image(); i.src = 'data:image/png;base64,' + s; try { await i.decode(); } catch (e) { return null; } return i; }
        const ia = await load(a), ib = await load(b); if (!ia || !ib) return null;
        if (ia.naturalWidth !== ib.naturalWidth || ia.naturalHeight !== ib.naturalHeight) return -1;
        const w = ia.naturalWidth, h = ia.naturalHeight;
        const c1 = document.createElement('canvas'); c1.width = w; c1.height = h; const x1 = c1.getContext('2d'); x1.drawImage(ia, 0, 0);
        const c2 = document.createElement('canvas'); c2.width = w; c2.height = h; const x2 = c2.getContext('2d'); x2.drawImage(ib, 0, 0);
        const d1 = x1.getImageData(0, 0, w, h).data, d2 = x2.getImageData(0, 0, w, h).data;
        let diff = 0; for (let i = 0; i < d1.length; i += 4) diff += Math.abs(d1[i] - d2[i]) + Math.abs(d1[i + 1] - d2[i + 1]) + Math.abs(d1[i + 2] - d2[i + 2]);
        return +(100 * diff / (d1.length / 4 * 3 * 255)).toFixed(2);
      }, b64a, b64b);
    }
    async function clipOf(xp) {
      return page.evaluate((x, pad) => {
        const el = document.evaluate(x, document, null, 9, null).singleNodeValue; if (!el) return null;
        const b = el.getBoundingClientRect(); if (b.width === 0 || b.height === 0) return { zero: true };
        // element must actually be within the viewport, else a clamped clip would
        // screenshot an empty corner (the blank-shot bug). Require its centre in view.
        const cx = b.x + b.width / 2, cy = b.y + b.height / 2;
        if (cx < 0 || cx > innerWidth || cy < 0 || cy > innerHeight) return { offScreen: true };
        const x0 = Math.max(0, Math.floor(b.x - pad)), y0 = Math.max(0, Math.floor(b.y - pad));
        const x1 = Math.min(innerWidth, Math.ceil(b.right + pad)), y1 = Math.min(innerHeight, Math.ceil(b.bottom + pad));
        return { x: x0, y: y0, width: Math.max(1, x1 - x0), height: Math.max(1, y1 - y0), inViewport: true };
      }, xp, PAD);
    }
    const speechNow = async () => out.vsr ? await page.evaluate(async () => { try { return await window.__vsr.lastSpokenPhrase() || null; } catch (e) { return null; } }).catch(() => null) : null;

    // T12: luma stats of a base64 PNG crop → detect black/blank video frames so a
    // black-on-black diff=0 isn't mistaken for "no focus indicator".
    async function frameStats(b64) {
      if (!b64) return null;
      return page.evaluate(async (s) => {
        const i = new Image(); i.src = 'data:image/png;base64,' + s; try { await i.decode(); } catch (e) { return null; }
        const w = i.naturalWidth, h = i.naturalHeight; const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        const ctx = cv.getContext('2d'); ctx.drawImage(i, 0, 0); const d = ctx.getImageData(0, 0, w, h).data;
        let sum = 0, sum2 = 0, dark = 0, n = 0;
        for (let k = 0; k < d.length; k += 4) { const l = 0.299 * d[k] + 0.587 * d[k + 1] + 0.114 * d[k + 2]; sum += l; sum2 += l * l; if (l <= 20) dark++; n++; }
        const mean = sum / n, std = Math.sqrt(Math.max(0, sum2 / n - mean * mean));
        return { meanLuma: +mean.toFixed(1), stdLuma: +std.toFixed(1), darkFraction: +(dark / n).toFixed(3) };
      }, b64).catch(() => null);
    }

    // T1/T8: deterministic focus-ring read. Force :focus-visible via CDP and measure
    // the computed outline + a fresh screenshot diff — independent of the flaky
    // tab-walk shot (which often captures the wrong region → false diff=0 = false
    // "no ring"). This is the authoritative ring signal.
    async function forcedFocusRing(xp) {
      try {
        const located = await page.evaluate(x => { const el = document.evaluate(x, document, null, 9, null).singleNodeValue; if (!el) return false; try { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); } catch (e) {} if (el.scrollIntoView) el.scrollIntoView({ block: 'center', inline: 'center' }); return true; }, xp);
        if (!located) return null;
        await sleep(80);
        const clip = await clipOf(xp); const inV = !!(clip && clip.inViewport);
        await cdp.send('DOM.getDocument', { depth: -1 }).catch(() => {});
        const sr = await cdp.send('DOM.performSearch', { query: xp }).catch(() => null);
        let nodeId = null;
        if (sr && sr.resultCount > 0) { const r = await cdp.send('DOM.getSearchResults', { searchId: sr.searchId, fromIndex: 0, toIndex: 1 }).catch(() => null); nodeId = r && r.nodeIds && r.nodeIds[0]; }
        const readOutline = () => page.evaluate(x => { const el = document.evaluate(x, document, null, 9, null).singleNodeValue; if (!el) return null; const c = getComputedStyle(el); return { outline: c.outlineStyle + ' ' + c.outlineWidth + ' ' + c.outlineColor, boxShadow: (c.boxShadow && c.boxShadow !== 'none') ? c.boxShadow.slice(0, 60) : 'none' }; }, xp).catch(() => null);
        const outlineUnforced = await readOutline(); // H1: unfocused computed, for focus-dependence
        const before = inV ? await page.screenshot({ clip, encoding: 'base64' }).catch(() => null) : null;
        let forced = false;
        if (nodeId) { try { await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['focus', 'focus-visible'] }); forced = true; } catch (e) {} }
        await sleep(60);
        const outlineForced = await readOutline();
        const after = (inV && forced) ? await page.screenshot({ clip, encoding: 'base64' }).catch(() => null) : null;
        if (nodeId && forced) { try { await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] }); } catch (e) {} }
        const forcedDiffPct = (before && after) ? await diffPct(before, after) : null;
        const blankFrame = before ? A.isBlankFrame(await frameStats(before)) : false;
        return {
          cropValid: inV && !blankFrame, forced, forcedDiffPct, blankFrame,
          unfocusedOutline: outlineUnforced && outlineUnforced.outline, unfocusedBoxShadow: outlineUnforced && outlineUnforced.boxShadow,
          focusedOutline: outlineForced && outlineForced.outline, focusedBoxShadow: outlineForced && outlineForced.boxShadow,
        };
      } catch (e) { return { error: e.message }; }
    }

    // Resolve an xpath to a puppeteer ElementHandle for TRUSTED pointer/click input.
    async function locateHandle(xp) {
      try {
        const h = await page.evaluateHandle((x) => document.evaluate(x, document, null, 9, null).singleNodeValue, xp);
        const el = h.asElement(); if (!el) { await h.dispose().catch(() => {}); return null; }
        return el;
      } catch (e) { return null; }
    }

    // ---------- GLOBAL TAB-WALK (traps / overall order / off-screen) ----------
    out.tabWalk = { stops: [], trapDetected: false, offScreenStops: 0, noOutlineStops: 0 };
    await page.evaluate(() => { try { document.activeElement && document.activeElement.blur(); } catch (e) {} });
    const seen = new Map(); let prevKey = null, repeat = 0; const tw0 = Date.now();
    for (let i = 0; i < MAXTAB; i++) {
      if (Date.now() - tw0 > TABWALK_BUDGET_MS) { out.tabWalk.budgetExceeded = true; break; }
      await page.keyboard.press('Tab'); await sleep(22);
      const st = await page.evaluate(() => {
        const el = document.activeElement; if (!el || el === document.body || el === document.documentElement) return { none: true };
        const cs = getComputedStyle(el); const b = el.getBoundingClientRect();
        return { xpath: window.__getXPath(el), tag: el.tagName.toLowerCase(), text: (el.innerText || el.textContent || '').trim().slice(0, 36), outlineOrShadow: (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || (cs.boxShadow && cs.boxShadow !== 'none'), inViewport: b.bottom > 0 && b.top < innerHeight && b.right > 0 && b.left < innerWidth && b.width > 0 && b.height > 0 };
      }).catch(() => ({ none: true }));
      if (st.none) { if (i > 0) break; else continue; }
      st.speech = await speechNow();
      if (st.speech && A.isVsrNoisePhrase(st.speech)) st.speech = null; // T9/H3: don't carry root/noise phrases
      if (!st.outlineOrShadow) out.tabWalk.noOutlineStops++;
      if (!st.inViewport) out.tabWalk.offScreenStops++;
      seen.set(st.xpath, (seen.get(st.xpath) || 0) + 1);
      out.tabWalk.stops.push(st);
      // C3: a TRAP is "Tab does not advance focus" (same element repeating consecutively),
      // NOT normal wraparound (revisiting an element after cycling the page). Confirm a
      // suspected trap with Shift+Tab — if focus escapes backward, it isn't a trap.
      if (st.xpath === prevKey) {
        repeat++;
        if (repeat >= 3) {
          const before = st.xpath;
          await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift'); await sleep(22);
          const escaped = await page.evaluate((b) => { const el = document.activeElement; return !el || el === document.body || window.__getXPath(el) !== b; }, before).catch(() => false);
          if (!escaped) { out.tabWalk.trapDetected = true; out.tabWalk.trapXpath = before; break; }
          repeat = 0; // Shift+Tab escaped → not a trap; keep walking
        }
      } else repeat = 0;
      prevKey = st.xpath;
    }
    out.tabWalk.count = out.tabWalk.stops.length;

    // ---------- PASS A: appearance + LOCAL tab walk + LOCAL SR walk (per element) ----------
    out.elements = [];
    let idx = 0;
    for (const xp of xpaths) {
      idx++;
      const rec = { xpath: xp, idx };
      const readInfo = () => page.evaluate((x) => {
        const el = document.evaluate(x, document, null, 9, null).singleNodeValue; if (!el) return null;
        const tag = el.tagName.toLowerCase(); const role = el.getAttribute('role');
        const iTags = ['a', 'button', 'input', 'select', 'textarea', 'summary', 'details'];
        const iRoles = ['link', 'button', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'tab', 'checkbox', 'radio', 'switch', 'slider', 'textbox', 'combobox', 'option', 'spinbutton'];
        const compositeRoles = ['tab', 'menuitem', 'menuitemradio', 'menuitemcheckbox', 'option', 'radio', 'slider', 'spinbutton'];
        const ti = el.getAttribute('tabindex');
        const focusable = (ti !== null && +ti >= 0) || (iTags.includes(tag) && !el.disabled) || el.isContentEditable;
        return { tag, role, tabindex: ti, focusable, isInteractive: iTags.includes(tag) || iRoles.includes(role) || (ti !== null && +ti >= 0) || el.hasAttribute('onclick'), isComposite: compositeRoles.includes(role), hasTooltipCue: !!(el.getAttribute('title') || el.getAttribute('aria-describedby')) };
      }, xp).catch(() => null);
      let info = await readInfo();
      if (!info) {
        // T6: re-locate once after a short settle — the DOM can drift between the
        // collect load and this drive load (lazy/hydrated content).
        await sleep(250);
        info = await readInfo();
        if (info) out.problems.push('relocated after retry: el' + idx);
      }
      if (!info) { rec.notFound = true; out.elements.push(rec); continue; }
      Object.assign(rec, { tag: info.tag, role: info.role, tabindex: info.tabindex, focusable: info.focusable, isInteractive: info.isInteractive, isComposite: info.isComposite });

      // appearance shot (unfocused baseline)
      await page.evaluate((x) => { const el = document.evaluate(x, document, null, 9, null).singleNodeValue; if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center', inline: 'center' }); }, xp).catch(() => {});
      await sleep(80);
      await page.evaluate(() => { try { document.activeElement && document.activeElement.blur && document.activeElement.blur(); } catch (e) {} }).catch(() => {});
      const baseClip = await clipOf(xp);
      let baseB64 = null;
      if (baseClip && baseClip.inViewport) { try { baseB64 = await page.screenshot({ clip: baseClip, encoding: 'base64' }); fs.writeFileSync(path.join(SHOTDIR, 'el' + idx + '.png'), Buffer.from(baseB64, 'base64')); rec.appearanceShot = path.join(SHOTDIR, 'el' + idx + '.png'); } catch (e) { rec.shotError = e.message; } }
      else if (baseClip && baseClip.zero) rec.appearanceZeroSize = true;
      else if (baseClip && baseClip.offScreen) rec.appearanceOffScreen = true; // couldn't bring into viewport → no valid shot (honest, not a blank)

      // ---- LOCAL TAB WALK: position ~5 focusables before target, Tab forward, reach it ----
      if (info.isInteractive) {
        const pos = await page.evaluate((x) => {
          const sel = 'a[href],button,input,select,textarea,summary,details,[tabindex],[contenteditable="true"]';
          const all = [...document.querySelectorAll(sel)].filter(el => { const s = getComputedStyle(el); const b = el.getBoundingClientRect(); return s.visibility !== 'hidden' && s.display !== 'none' && (el.getAttribute('tabindex') !== '-1') && (b.width > 0 || b.height > 0); });
          const target = document.evaluate(x, document, null, 9, null).singleNodeValue; if (!target) return { gone: true };
          let ti = all.indexOf(target);
          if (ti < 0) { const inner = target.querySelector && target.querySelector(sel); if (inner) ti = all.indexOf(inner); }
          if (ti < 0) return { positioned: false, targetIndex: ti };
          // C3: when the target IS the first focusable (ti===0), focusing all[startIdx]
          // would focus the target then immediately Tab OFF it → falsely "unreachable".
          // Instead blur and let the first Tab land on it.
          const startIdx = ti > 0 ? Math.max(0, ti - 5) : -1;
          if (startIdx >= 0 && all[startIdx]) { try { all[startIdx].focus(); } catch (e) {} }
          else { try { document.activeElement && document.activeElement.blur(); } catch (e) {} }
          return { positioned: true, targetIndex: ti, startIdx, total: all.length };
        }, xp).catch(() => ({ error: true }));
        const tabStops = []; let reachedAt = -1, focusB64 = null;
        if (pos && pos.positioned) {
          for (let k = 0; k < 18; k++) {
            await page.keyboard.press('Tab'); await sleep(22);
            const st = await page.evaluate((x) => {
              const el = document.activeElement; if (!el || el === document.body) return { none: true };
              const t = document.evaluate(x, document, null, 9, null).singleNodeValue;
              const cs = getComputedStyle(el); const b = el.getBoundingClientRect();
              const isT = !!t && (el === t || (t.contains && t.contains(el)) || (el.contains && el.contains(t)));
              return { xpath: window.__getXPath(el), isTarget: isT, outlineOrShadow: (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || (cs.boxShadow && cs.boxShadow !== 'none'), inViewport: b.bottom > 0 && b.top < innerHeight && b.width > 0 && b.height > 0 };
            }, xp).catch(() => ({ none: true }));
            if (st.none) break;
            st.speech = await speechNow();
            tabStops.push({ xpath: st.xpath, isTarget: st.isTarget, outlineOrShadow: st.outlineOrShadow, inViewport: st.inViewport, speech: st.speech });
            if (st.isTarget && reachedAt < 0) {
              reachedAt = k;
              // authentic real-keyboard focus shot at the target
              const c2 = await clipOf(xp);
              if (c2 && c2.inViewport && baseB64 && baseClip && baseClip.inViewport && c2.x === baseClip.x && c2.y === baseClip.y && c2.width === baseClip.width && c2.height === baseClip.height) {
                try { focusB64 = await page.screenshot({ clip: c2, encoding: 'base64' }); fs.writeFileSync(path.join(SHOTDIR, 'el' + idx + '_focus.png'), Buffer.from(focusB64, 'base64')); } catch (e) {}
              }
              break; // stop once we've captured the target focused
            }
          }
        }
        const computed = await page.evaluate((x) => { const el = document.evaluate(x, document, null, 9, null).singleNodeValue; if (!el) return null; const cs = getComputedStyle(el); return { outline: cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor, boxShadow: (cs.boxShadow && cs.boxShadow !== 'none') ? cs.boxShadow.slice(0, 60) : 'none' }; }, xp).catch(() => null);
        const dp = (baseB64 && focusB64) ? await diffPct(baseB64, focusB64) : null;
        // T1/T8/T12: authoritative forced :focus-visible probe + crop-validity +
        // black-frame guard, combined by the shared focusRingDecision.
        const forced = await forcedFocusRing(xp);
        const baseBlank = baseB64 ? A.isBlankFrame(await frameStats(baseB64)) : false;
        const cropValidTab = !!(baseB64 && focusB64) && !baseBlank;
        // H1: real-keyboard pixel change is primary; focus-DEPENDENCE comes from the
        // forced probe's unfocused-vs-forced computed outline/shadow (an always-on
        // outline/shadow has unfocused == focused → not counted). Forced diff = corrob.
        const decision = A.focusRingDecision({
          realTabDiffPct: dp, realTabCropValid: cropValidTab,
          unfocusedOutline: forced && forced.unfocusedOutline, focusedOutline: forced && forced.focusedOutline,
          unfocusedBoxShadow: forced && forced.unfocusedBoxShadow, focusedBoxShadow: forced && forced.focusedBoxShadow,
          forcedDiffPct: forced && forced.forcedDiffPct,
        });
        rec.localTabWalk = { positioned: !!(pos && pos.positioned), targetIndexInFocusables: pos && pos.targetIndex, reachedByTab: reachedAt >= 0, stopsToReach: reachedAt, stops: tabStops };
        rec.focusIndicator = {
          present: decision.present,                      // TRI-STATE: true | false | null(=PARTIAL)
          indicatorPresent: decision.present === true,    // back-compat boolean
          basis: decision.basis, focusDependentComputed: decision.focusDependentComputed,
          realTabDiffPct: dp, realTabCropValid: cropValidTab,
          forcedFocusVisibleDiffPct: forced && forced.forcedDiffPct, forcedCropValid: forced && forced.cropValid,
          unfocusedOutline: forced && forced.unfocusedOutline, focusedOutline: forced && forced.focusedOutline,
          computedOutline: computed && computed.outline, computedBoxShadow: computed && computed.boxShadow,
          baseBlankFrame: baseBlank,
          method: cropValidTab ? 'real-keyboard-diff' : ((forced && typeof forced.forcedDiffPct === 'number') ? 'forced-focus-visible' : 'indeterminate'),
          focusShot: focusB64 ? path.join(SHOTDIR, 'el' + idx + '_focus.png') : null,
        };
        await page.evaluate(() => { try { document.activeElement && document.activeElement.blur(); } catch (e) {} }).catch(() => {});
      }

      // ---- LOCAL SR WALK: land on target, go back 5, then 15 forward ----
      if (out.vsr) {
        rec.srWalk = await page.evaluate(async (x) => {
          const t = document.evaluate(x, document, null, 9, null).singleNodeValue; if (!t) return { gone: true };
          const vsr = window.__vsr; const stops = [];
          try {
            t.dispatchEvent(new FocusEvent('focusin', { bubbles: true })); await new Promise(r => setTimeout(r, 0));
            for (let i = 0; i < 5; i++) { try { await vsr.previous(); } catch (e) { break; } }
            let prevSp = null; // H3: detect sticky/stale lastSpokenPhrase (unchanged across stops)
            for (let i = 0; i < 16; i++) {
              try { await vsr.next(); } catch (e) { break; }
              const n = vsr.activeNode; if (!n) break;
              const el = n.nodeType === 1 ? n : n.parentElement;
              const isT = !!el && (el === t || (t.contains && t.contains(el)) || (el.contains && el.contains(t)));
              let sp = null; try { sp = await vsr.lastSpokenPhrase() || null; } catch (e) {}
              const stale = sp !== null && sp === prevSp; prevSp = sp;
              stops.push({ xpath: el ? window.__getXPath(el) : null, speech: stale ? null : sp, rawSpeech: sp, stale, isTarget: isT });
            }
          } catch (e) { return { error: e.message, stops }; }
          const ti = stops.findIndex(s => s.isTarget);
          return { stops, reachedBySR: ti >= 0, targetSpeech: ti >= 0 ? stops[ti].speech : null };
        }, xp).catch(() => null);
        // H3: drop root/noise phrases (node-side filter) and recompute targetSpeech.
        if (rec.srWalk && Array.isArray(rec.srWalk.stops)) {
          for (const s of rec.srWalk.stops) if (s.speech && A.isVsrNoisePhrase(s.speech)) s.speech = null;
          const tgt = rec.srWalk.stops.find(s => s.isTarget);
          rec.srWalk.targetSpeech = tgt ? tgt.speech : null;
        }
      }
      out.elements.push(rec);
    }

    // ---------- PASS B: activation / focus-return / arrow-keys / hover (MUTATING) ----------
    const NATIVE = ['a', 'button', 'input', 'select', 'textarea', 'summary', 'details'];
    for (const rec of out.elements) {
      if (rec.notFound || !rec.isInteractive) continue;
      const xp = rec.xpath; const native = NATIVE.includes(rec.tag);
      // C3 ISOLATION: reload to a clean page before each element's mutating probes so
      // a previous element's non-navigation mutation can't contaminate this one.
      await reloadPage();
      const handle = await locateHandle(xp);
      if (!handle) { rec.passBNotFound = true; continue; }

      // HOVER → 1.4.13 — TRUSTED pointer move + TRUSTED Escape (C3).
      const cue = await page.evaluate((x) => { const el = document.evaluate(x, document, null, 9, null).singleNodeValue; return el ? !!(el.getAttribute('title') || el.getAttribute('aria-describedby')) : false; }, xp).catch(() => false);
      if (cue) {
        const tipCount = () => page.evaluate(() => document.querySelectorAll('[role=tooltip],.tooltip,[data-tooltip-visible]').length).catch(() => 0);
        const box = await handle.boundingBox().catch(() => null);
        if (box) {
          const before = await tipCount();
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await sleep(320);
          const onHover = await tipCount(); await sleep(1200);
          const persists = (await tipCount()) >= onHover && onHover > before;
          await page.keyboard.press('Escape'); await sleep(150);
          const afterEsc = await tipCount();
          rec.hover = { tooltipAppearsOnHover: onHover > before, persistentWhileHovered: persists, dismissibleByEsc: onHover > before && afterEsc < onHover, method: 'trusted-pointer' };
          await page.mouse.move(2, 2); // move pointer away
        }
      }

      // KEYBOARD — native presumption gate (C3 refinement) vs TRUSTED Enter/Space.
      const pre = await page.evaluate((x) => { const el = document.evaluate(x, document, null, 9, null).singleNodeValue; if (!el) return null; const ti = el.getAttribute('tabindex'); return { disabled: !!el.disabled || el.getAttribute('aria-disabled') === 'true', tabindexEff: ti !== null ? +ti : null, roleOverride: ['a', 'button', 'input', 'select', 'textarea', 'summary', 'details'].includes(el.tagName.toLowerCase()) && !!el.getAttribute('role') }; }, xp).catch(() => null);
      if (native) {
        const presumable = pre && !pre.disabled && (pre.tabindexEff === null || pre.tabindexEff >= 0) && !pre.roleOverride && !(rec.localTabWalk && rec.localTabWalk.reachedByTab === false);
        rec.keyboard = { native: true, presumed: !!presumable, operable: presumable ? true : null, note: presumable ? 'native + preconditions hold → presumed keyboard operable' : 'native but a precondition is in question (tabindex<0 / disabled / role override / not Tab-reached) — exercise on live page' };
      } else {
        // focus then press real keys (trusted)
        await page.evaluate((x) => { const el = document.evaluate(x, document, null, 9, null).singleNodeValue; if (el) try { el.focus(); } catch (e) {} }, xp).catch(() => {});
        const vsig = () => page.evaluate(() => { const m = document.querySelector('main') || document.body; return location.href + '|' + (m.innerText || '').trim().slice(0, 120) + '#' + m.childElementCount + '|' + document.querySelectorAll('[role=dialog],[role=alertdialog],dialog[open]').length + '|' + (document.activeElement ? window.__getXPath(document.activeElement) : ''); }).catch(() => '');
        const vBefore = await vsig();
        await page.keyboard.press('Enter'); await sleep(220);
        const vEnter = await vsig(); const respEnter = vEnter !== vBefore;
        await page.keyboard.press('Space'); await sleep(220);
        const vSpace = await vsig(); const respSpace = vSpace !== vEnter;
        rec.keyboard = { native: false, respondedToEnter: respEnter, respondedToSpace: respSpace, respondedToKeyboard: respEnter || respSpace, destructive: vSpace !== vBefore, method: 'trusted-keys' };
        if (rec.keyboard.destructive) { await reloadPage(); await locateHandle(xp); }
      }

      // ARROW-KEY probe for composite widgets — TRUSTED arrow keys.
      if (rec.isComposite) {
        const SIGFN = "(function(){return (document.activeElement?window.__getXPath(document.activeElement):'')+'|'+document.querySelectorAll('[aria-selected=\"true\"],[aria-checked=\"true\"]').length+'|'+[...document.querySelectorAll('[aria-selected=\"true\"]')].map(function(n){return (n.textContent||'').slice(0,12)}).join(',')})()";
        const before = await page.evaluate((x, sf) => { const el = document.evaluate(x, document, null, 9, null).singleNodeValue; if (!el) return null; try { el.focus(); } catch (e) {} return eval(sf); }, xp, SIGFN).catch(() => null);
        if (before !== null) {
          await page.keyboard.press('ArrowRight'); await sleep(140);
          await page.keyboard.press('ArrowDown'); await sleep(140);
          const after = await page.evaluate((sf) => eval(sf), SIGFN).catch(() => null);
          rec.arrowKeys = { respondsToArrows: after !== null && after !== before, method: 'real-keys' };
        } else rec.arrowKeys = { gone: true };
      }

      // T2/C3: keyboard-operability signal — now WITH focusable so the operable:false
      // branch is reachable (custom widget, focusable:false, not Tab-reached => false).
      if (!native) {
        rec.keyboardSignal = A.keyboardOperabilitySignal({
          role: rec.role, tabindex: rec.tabindex,
          reachedByTab: rec.localTabWalk && rec.localTabWalk.reachedByTab,
          respondedToSyntheticKey: rec.keyboard && rec.keyboard.respondedToKeyboard,
          respondsToArrows: rec.arrowKeys && rec.arrowKeys.respondsToArrows,
          focusable: rec.focusable,
        });
      }

      // ACTIVATION — TRUSTED click (ElementHandle.click); falls back to a flagged
      // synthetic click only if the real click can't be dispatched (covered/off-screen).
      const speechBefore = await speechNow();
      await page.evaluate((x) => {
        const el = document.evaluate(x, document, null, 9, null).singleNodeValue; if (!el) { window.__act = null; return; }
        const link = el.closest && el.closest('a[href]');
        const viewSig = () => { const m = document.querySelector('main') || document.body; return (m.innerText || '').trim().slice(0, 160) + '#' + m.childElementCount; };
        window.__act = {
          trigger: el, navTo: link ? { href: link.getAttribute('href'), newTab: link.getAttribute('target') === '_blank' } : null,
          before: { href: location.href, title: document.title, view: viewSig(), active: document.activeElement, expanded: el.getAttribute('aria-expanded'), pressed: el.getAttribute('aria-pressed'), dialogs: document.querySelectorAll('[role=dialog],[role=alertdialog],dialog[open]').length, liveText: [...document.querySelectorAll('[aria-live],[role=status],[role=alert],[role=log],output')].map(n => (n.textContent || '').trim()).join('||') },
          mut: [], viewSig,
        };
        const obs = new MutationObserver(ms => { for (const m of ms) { let t = m.target; if (t && t.nodeType === 3) t = t.parentElement; if (t && t.closest && t.closest('[aria-live],[role=status],[role=alert],[role=log],output')) window.__act.mut.push((t.textContent || '').trim().slice(0, 80)); } });
        obs.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['aria-expanded', 'aria-pressed', 'aria-hidden'] });
        window.__actObs = obs;
      }, xp).catch(() => {});
      let clickMethod = 'trusted', clickErr = null;
      try { await handle.click({ delay: 8 }); } catch (e) { clickErr = e.message; try { await page.evaluate((x) => { const el = document.evaluate(x, document, null, 9, null).singleNodeValue; if (el) el.click(); }, xp); clickMethod = 'synthetic-fallback'; } catch (e2) { clickMethod = 'failed'; } }
      await sleep(450);
      const activate = await page.evaluate(async () => {
        const a = window.__act; if (!a) return { gone: true };
        if (window.__actObs) window.__actObs.disconnect();
        const el = a.trigger; const viewSig = a.viewSig;
        const after = { href: location.href, title: document.title, view: viewSig(), active: document.activeElement, expanded: el.getAttribute('aria-expanded'), pressed: el.getAttribute('aria-pressed'), dialogs: document.querySelectorAll('[role=dialog],[role=alertdialog],dialog[open]').length, liveText: [...document.querySelectorAll('[aria-live],[role=status],[role=alert],[role=log],output')].map(n => (n.textContent || '').trim()).join('||') };
        const b = a.before;
        const res = {
          navTo: a.navTo,
          focusMoved: b.active !== after.active, focusMovedTo: after.active && after.active !== document.body ? window.__getXPath(after.active) : null,
          urlChanged: b.href !== after.href, titleChanged: b.title !== after.title, viewChanged: b.view !== after.view,
          contextChange: b.href !== after.href || b.title !== after.title || b.view !== after.view,
          expandedChanged: b.expanded !== after.expanded ? (b.expanded + '→' + after.expanded) : null,
          pressedChanged: b.pressed !== after.pressed ? (b.pressed + '→' + after.pressed) : null,
          dialogOpened: after.dialogs > b.dialogs, liveRegionChanged: b.liveText !== after.liveText, liveMutations: [...new Set(a.mut)].filter(Boolean).slice(0, 5),
        };
        if (res.dialogOpened) res.modal = { focusMovedIntoDialog: !!([...document.querySelectorAll('[role=dialog],[role=alertdialog],dialog[open]')].pop() || {}).contains && [...document.querySelectorAll('[role=dialog],[role=alertdialog],dialog[open]')].pop().contains(document.activeElement), afterDialogs: after.dialogs };
        return res;
      }).catch(e => ({ error: e.message }));
      if (activate) { activate.clicked = clickMethod !== 'failed'; activate.clickMethod = clickMethod; activate.clickErr = clickErr; }
      // FOCUS RETURN after modal — TRUSTED Escape, then a close control via handle.
      if (activate && activate.dialogOpened && activate.modal) {
        await page.keyboard.press('Escape'); await sleep(250);
        let closed = await page.evaluate((n) => document.querySelectorAll('[role=dialog],[role=alertdialog],dialog[open]').length < n, activate.modal.afterDialogs).catch(() => false);
        if (!closed) { const ch = await locateHandle(xp + ''); const closeH = await page.evaluateHandle(() => { const d = [...document.querySelectorAll('[role=dialog],[role=alertdialog],dialog[open]')].pop(); return d ? d.querySelector('[aria-label*="close" i],[class*="close" i],[data-dismiss],button') : null; }).then(h => h.asElement()).catch(() => null); if (closeH) { try { await closeH.click(); } catch (e) {} await sleep(250); } }
        activate.modal.closedByEscapeOrButton = await page.evaluate((n) => document.querySelectorAll('[role=dialog],[role=alertdialog],dialog[open]').length < n, activate.modal.afterDialogs).catch(() => false);
        activate.modal.focusReturnedToTrigger = await page.evaluate((x) => { const el = document.evaluate(x, document, null, 9, null).singleNodeValue; return document.activeElement === el; }, xp).catch(() => false);
      }
      if (out.vsr && activate && !activate.gone) { const sa = await speechNow(); activate.vsrAnnouncement = A.meaningfulAnnouncement(sa, speechBefore); activate.vsrRaw = sa; }
      rec.activate = activate;
    }

    // ---------- FORM error-on-submit probe (3.3.1 / 3.3.3) ----------
    out.forms = [];
    const formCount = await page.evaluate(() => document.querySelectorAll('form').length).catch(() => 0);
    for (let fi = 0; fi < Math.min(formCount, 4); fi++) {
      const alive = await page.evaluate(() => location.href).catch(() => null);
      if (alive !== url) await reloadPage();
      const fres = await page.evaluate(async (fi) => {
        const form = document.querySelectorAll('form')[fi]; if (!form) return null;
        const fields = [...form.querySelectorAll('input,select,textarea')].filter(f => !['hidden', 'submit', 'button'].includes(f.type));
        // T15: skip forms with no visible editable fields (cookie/hidden/modal/0-field
        // forms) — submitting them yields meaningless "nativeValidationOnly" results.
        const visibleFields = fields.filter(f => { const s = getComputedStyle(f); const b = f.getBoundingClientRect(); return s.visibility !== 'hidden' && s.display !== 'none' && (b.width > 0 || b.height > 0); });
        if (visibleFields.length === 0) return { skipped: true, reason: 'no visible editable fields (cookie/hidden/modal form)', fields: fields.length };
        const before = { invalids: form.querySelectorAll('[aria-invalid="true"]').length, alerts: form.querySelectorAll('[role=alert]').length, errTextLen: (form.innerText || '').length, live: [...document.querySelectorAll('[aria-live],[role=alert],[role=status]')].map(n => (n.textContent || '').trim()).join('||') };
        const submit = form.querySelector('[type=submit],button:not([type=button])');
        try { if (submit) submit.click(); else form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); } catch (e) {}
        await new Promise(r => setTimeout(r, 500));
        const after = { invalids: form.querySelectorAll('[aria-invalid="true"]').length, alerts: form.querySelectorAll('[role=alert]').length, errTextLen: (form.innerText || '').length, live: [...document.querySelectorAll('[aria-live],[role=alert],[role=status]')].map(n => (n.textContent || '').trim()).join('||') };
        // C2: capture the NATIVE constraint-validation evidence — a non-empty
        // validationMessage (UA text) and focus-to-invalid-field mean 3.3.1 is MET,
        // even without ARIA. submitBlocked = the form did not submit (still on page).
        const invalidNow = visibleFields.filter(f => f.willValidate && f.checkValidity && !f.checkValidity());
        const nativeMessages = invalidNow.map(f => (f.validationMessage || '').trim()).filter(Boolean);
        const ae = document.activeElement;
        const focusOnInvalid = !!ae && invalidNow.includes(ae);
        const submitBlocked = invalidNow.length > 0; // a field is invalid → native UA blocks submit
        return {
          fields: fields.length, hasRequired: fields.some(f => f.required || f.getAttribute('aria-required') === 'true'),
          submitBlocked, invalidFieldCount: invalidNow.length,
          validationMessages: nativeMessages.slice(0, 5), nativeTextIdentification: nativeMessages.length > 0,
          focusMovedToInvalidField: focusOnInvalid,
          ariaInvalidSet: after.invalids > before.invalids, alertAppeared: after.alerts > before.alerts,
          errorTextGrew: after.errTextLen > before.errTextLen + 3, errorAnnouncedLive: after.live !== before.live,
          // C2: native validation MEETS 3.3.1 unless there's literally no text identification anywhere.
          noTextIdentificationAtAll: nativeMessages.length === 0 && after.errTextLen <= before.errTextLen + 3 && after.alerts === before.alerts,
          // legacy field kept for back-compat; do NOT derive 3.3.1 from it alone.
          nativeValidationOnly: after.invalids === before.invalids && after.alerts === before.alerts && after.errTextLen <= before.errTextLen + 3,
        };
      }, fi).catch(() => null);
      if (fres) out.forms.push(fres);
      if (fres && !fres.skipped) await reloadPage(); // no submit happened for skipped forms → no reload needed
    }

    try { await page.evaluate(async () => { try { await window.__vsr.stop(); } catch (e) {} }); } catch (e) {}
  } finally {
    await browser.close();
  }
  console.log(JSON.stringify(out));
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
