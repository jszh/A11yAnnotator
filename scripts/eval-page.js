#!/usr/bin/env node
// One-shot per-page collector for the parallel skills evaluation.
//
// Loads a saved snapshot ONCE in its own headless browser (the agent's "own
// browser instance"), then in that single session returns everything the 10
// skills need as static inputs, so the agent never has to re-launch a browser
// per element:
//   - axe-core (full WCAG 2.0/2.1/2.2 A/AA + best-practice + target-size,
//     aria-roledescription, label-content-name-mismatch) — the CACHED axe run,
//     with violations indexed by node target so the agent can attribute each
//     violation to a specific element.
//   - page-level structure: title, lang, heading tree, landmark inventory,
//     list-style:none-strips-role count, live-region inventory.
//   - per sampled element: CDP-computed role + accessible name (authoritative,
//     same source as /ax-node), inTree/ignoredReasons, DOM attrs (aria-label/
//     labelledby/alt/text/tabindex), box, computed color/effective-bg/outline,
//     exact solid-bg contrast, and skill-routing flags (isInteractive,
//     isFormField, isImage, needsPixelContrast).
//
// Pages are served by the already-running annotator server on :3001 (static
// bytes only — this script does its own CDP AX, so it does NOT touch the
// server's shared AX browser). noscript serving auto-detected from pages.json,
// exactly like verify-finding.js.
//
// Usage (run from project dir):
//   node scripts/eval-page.js --file "<saved file name>" [--xpaths /tmp/xp.json]
//     --xpaths : JSON file containing an array of xpath strings. If omitted, the
//                element list is read from assets/samples-saved.json for --file.
//
// Output: a single JSON object on stdout (the cached bundle). Read-only.

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const A = require('./lib/a11y-eval.js'); // shared pure helpers (see HARNESS-ISSUES.md)

const ROOT = path.join(__dirname, '..');
// R2.9-D (R2.8 self-audit #2): a sha256 of the served page SOURCE. The collector and the
// driver each compute it from the same on-disk file; build-results requires the two to
// MATCH, so a stale drive from a CHANGED page version (same file name, edited content) is
// rejected — run-id + freshness alone can't catch an in-place edit. Returns null if
// unreadable (then the digest gate is inert; identity/run/freshness still apply). NOTE: a
// fully-fabricating agent that writes BOTH artifacts can echo any digest — this binds the
// REAL collector↔driver pair, not a forged one (documented limit, RESULT-CONTRACT.md).
function pageDigest(file) {
  try { return 'sha256:' + crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, 'assets/saved', file))).digest('hex'); }
  catch (e) { return null; }
}
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = process.env.PORT ? +process.env.PORT : 3001;
const BASE = process.env.A11Y_BASE || `http://127.0.0.1:${PORT}`;
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : d; };
const has = (n) => args.includes('--' + n);

const FILE = opt('file');
if (!FILE) { console.error('need --file "<saved file name>"'); process.exit(2); }
// R2.6-C: a per-run id shared with the driver of the SAME run (pass the SAME --run-id to
// eval-page and drive-page). build-results requires collect.runId === drive.runId, so a
// STALE drive from an earlier run (different id) cannot authorize this result. Auto-
// generated when omitted (then collect/drive differ → the gate forces a coordinated run).
const RUN_ID = opt('run-id') || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const SETTLE = parseInt(opt('settle', '1000'), 10);

function isNoscriptFlagged(file) {
  try {
    const pj = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/pages.json'), 'utf8'));
    const list = Array.isArray(pj) ? pj : pj.pages;
    return !!(list || []).find(p => p.file === file && p.noscript);
  } catch (e) { return false; }
}
const NOSCRIPT = has('noscript') ? true : has('scripts') ? false : isNoscriptFlagged(FILE);

// Resolve the element list: explicit --xpaths file, else samples-saved.json.
function loadXpaths() {
  if (has('xpaths')) {
    // The element loop consumes OBJECTS ({xpath,...}); wrap bare strings so the
    // --xpaths path matches the samples-saved.json path (this was a latent bug —
    // strings made every element resolve to el.xpath === undefined → notFound).
    const arr = JSON.parse(fs.readFileSync(opt('xpaths'), 'utf8'));
    return arr.map(x => (typeof x === 'string' ? { xpath: x } : x)).filter(e => e && e.xpath);
  }
  const ss = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/samples-saved.json'), 'utf8'));
  const key = 'saved/' + FILE;
  const entry = ss[key];
  if (!entry || !entry.sampled) return [];
  const out = [];
  for (const lm of Object.keys(entry.sampled)) {
    for (const el of entry.sampled[lm]) out.push({ xpath: el.xpath, landmark: el.landmark || lm, sampledRole: el.role, sampledName: el.name });
  }
  return out;
}

function contrast(rgb1, rgb2) {
  const L = ([r, g, b]) => { const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const a = L(rgb1), b = L(rgb2); const hi = Math.max(a, b), lo = Math.min(a, b);
  return +((hi + 0.05) / (lo + 0.05)).toFixed(2);
}
function parseRGB(s) {
  const m = (s || '').match(/rgba?\(([^)]+)\)/); if (!m) return null;
  const p = m[1].split(',').map(x => parseFloat(x.trim()));
  return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
}

(async () => {
  const elements = loadXpaths();
  const out = { file: FILE, runId: RUN_ID, pageDigest: pageDigest(FILE), noscript: NOSCRIPT, collectedAt: null, elementCount: elements.length, problems: [] };
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try { const _bc = await browser.target().createCDPSession(); await _bc.send('Browser.setDownloadBehavior', { behavior: 'deny' }); } catch (e) {}
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
    page.on('pageerror', () => {});
    const cdp = await page.createCDPSession();
    await cdp.send('Accessibility.enable');

    const url = BASE + '/assets/saved/' + encodeURIComponent(FILE) + '?offline=1' + (NOSCRIPT ? '&noscript=1' : '');
    await page.goto(url, { waitUntil: 'load', timeout: 45000 }).catch(e => { out.problems.push('goto: ' + e.message); });
    if (SETTLE) await new Promise(r => setTimeout(r, SETTLE));

    // ---- T14: neutralise third-party cookie/consent overlays so they don't inject
    // duplicate headings into the structure or pollute the axe run. Recorded for
    // transparency; the sampled elements themselves are never hidden by selector.
    out.consentHidden = await page.evaluate((selectors) => {
      const matched = [];
      // M2/R22-M1: EVALUATE the consent overlay's OWN controls BEFORE neutralising it —
      // and analyse it WHILE STILL VISIBLE (display:none would zero every child rect).
      // Only VISIBLE + actually-FOCUSABLE controls are counted (a hidden input is not a
      // user-facing 4.1.2 target). This inventory is STATIC/visible-only: the agent must
      // treat consent findings as PARTIAL until live keyboard / focus-trap behaviour is
      // exercised — it does not prove the overlay's reachability or trap.
      const analysis = { containers: 0, visibleControls: 0, unlabelledVisibleControls: 0, visibleHeadings: 0, hasDialogRole: false, basis: 'static-visible-only — PARTIAL until live keyboard/focus-trap behaviour is exercised' };
      // resolve aria-labelledby to a real non-empty target (a dangling idref is NOT a name).
      const named = el => {
        const lb = el.getAttribute('aria-labelledby');
        if (lb && lb.split(/\s+/).some(id => { const t = document.getElementById(id); return t && (t.textContent || '').trim(); })) return true;
        return !!((el.getAttribute('aria-label') || '').trim() || (el.textContent || '').trim() || el.getAttribute('title') || el.getAttribute('alt'));
      };
      const isVisible = el => { const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity || '1') === 0) return false; const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
      const isFocusableCtl = el => !el.disabled && el.getAttribute('aria-disabled') !== 'true' && el.getAttribute('tabindex') !== '-1' && el.getAttribute('aria-hidden') !== 'true';
      const allMatched = new Set(); // every matched container (any selector)
      const toHide = new Set();
      for (const sel of selectors) {
        let els = [];
        try { els = [...document.querySelectorAll(sel)]; } catch (e) { continue; }
        for (const el of els) { allMatched.add(el); toHide.add(el); }
        if (els.length) matched.push(sel);
      }
      // R2.3-A+: analyse only TOP-LEVEL containers — a matched container NESTED inside
      // another matched one would otherwise double-count (the parent's subtree already
      // includes the child's controls/headings). A multi-selector container counts once
      // because allMatched keys on element identity.
      const isNested = el => { for (let a = el.parentElement; a; a = a.parentElement) if (allMatched.has(a)) return true; return false; };
      const seenC = new Set();
      {
        for (const el of allMatched) {
          if (isNested(el) || seenC.has(el)) continue;
          seenC.add(el);
          analysis.containers++;
          if (el.getAttribute('role') === 'dialog' || el.getAttribute('role') === 'alertdialog') analysis.hasDialogRole = true;
          for (const c of el.querySelectorAll('a[href],button,input,select,textarea,[tabindex]')) { if (!isVisible(c) || !isFocusableCtl(c)) continue; analysis.visibleControls++; if (!named(c)) analysis.unlabelledVisibleControls++; }
          analysis.visibleHeadings += [...el.querySelectorAll('h1,h2,h3,h4,h5,h6,[role=heading]')].filter(isVisible).length;
        }
      }
      // neutralise AFTER analysis so the visibility checks above saw the live overlay.
      for (const el of toHide) { el.setAttribute('data-a11yeval-consent-hidden', '1'); el.style.setProperty('display', 'none', 'important'); }
      return { count: seenC.size, selectors: matched, consentState: analysis };
    }, A.CONSENT_SELECTORS).catch(() => ({ count: 0, selectors: [] }));

    // ---- page-level structure (one evaluate) ----
    out.structure = await page.evaluate(() => {
      const txt = el => (el.textContent || '').trim().slice(0, 60);
      // H4: exclude nodes inside a consent container we neutralised — display:none does
      // NOT stop querySelectorAll from returning them, so filter by ancestry explicitly.
      const inConsent = el => !!(el.closest && el.closest('[data-a11yeval-consent-hidden]'));
      const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role=heading]')].filter(h => !inConsent(h)).map(h => ({
        tag: h.tagName.toLowerCase(),
        level: h.getAttribute('aria-level') || (/^H([1-6])$/.test(h.tagName) ? h.tagName[1] : null),
        text: txt(h), empty: txt(h).length === 0,
      }));
      const lmSel = 'header,nav,main,aside,footer,[role=banner],[role=navigation],[role=main],[role=complementary],[role=contentinfo],[role=search],[role=region],[role=form]';
      const landmarks = [...document.querySelectorAll(lmSel)].filter(l => !inConsent(l)).map(l => ({
        tag: l.tagName.toLowerCase(), role: l.getAttribute('role') || null,
        label: l.getAttribute('aria-label') || null, labelledby: l.getAttribute('aria-labelledby') || null,
      }));
      const listStyleNone = [...document.querySelectorAll('ul,ol')].filter(l =>
        getComputedStyle(l).listStyleType === 'none' && !l.getAttribute('role') && l.querySelector('li')).length;
      const liveRegions = [...document.querySelectorAll('[aria-live],[role=status],[role=alert],[role=log],output')].map(r => ({
        tag: r.tagName.toLowerCase(), ariaLive: r.getAttribute('aria-live'), role: r.getAttribute('role'),
        empty: (r.textContent || '').trim().length === 0,
      }));
      return {
        title: document.title, lang: document.documentElement.getAttribute('lang') || null,
        headings, landmarkCount: landmarks.length, landmarks: landmarks.slice(0, 40),
        hasMain: landmarks.some(l => l.tag === 'main' || l.role === 'main'),
        hasNav: landmarks.some(l => l.tag === 'nav' || l.role === 'navigation'),
        listStyleNone, liveRegions,
      };
    });

    // ---- axe (CACHED full run) ----
    try {
      await page.addScriptTag({ path: path.join(ROOT, 'axe.min.js') });
      const axeOut = await page.evaluate(async () => {
        const cfg = {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
          rules: { 'target-size': { enabled: true }, 'aria-roledescription': { enabled: true }, 'label-content-name-mismatch': { enabled: true } },
          resultTypes: ['violations', 'incomplete'], // incomplete = axe's needs-review priors (surfaced as review-tier, never a decision)
        };
        const r = await axe.run(document, cfg);
        const map = (arr) => (arr || []).map(v => ({
          id: v.id, impact: v.impact, help: v.help, wcag: (v.tags || []).filter(t => /^wcag\d/.test(t)),
          nodes: v.nodes.map(n => ({ target: n.target, html: (n.html || '').slice(0, 160) })),
        }));
        return { violations: map(r.violations), incomplete: map(r.incomplete) };
      });
      out.axe = axeOut.violations;            // unchanged shape (array of decided violations)
      out.axeIncomplete = axeOut.incomplete;  // NEW: axe needs-review outcomes (surfaced as shadow review priors)
      out.axeRan = true; // R2.7-B: distinguish "axe ran clean" from "axe never ran" (fail-closed gate)
    } catch (e) { out.problems.push('axe: ' + e.message); out.axe = []; out.axeIncomplete = []; out.axeRan = false; }

    // R21-H2: measure the TRUE UA-default checkbox/radio size in an isolated iframe
    // (no page CSS), so a stylesheet that resizes all checkboxes can't masquerade as a
    // user-agent control. Done once; consumed by the per-element uaControl check.
    out.uaDefaults = await page.evaluate(() => {
      const f = document.createElement('iframe'); f.style.cssText = 'position:fixed;left:-9999px;width:50px;height:50px;border:0';
      document.body.appendChild(f); const d = f.contentDocument;
      d.body.innerHTML = '<input type="checkbox"><input type="radio">';
      const cb = d.body.children[0].getBoundingClientRect(), rb = d.body.children[1].getBoundingClientRect();
      const r = { checkbox: { w: Math.round(cb.width), h: Math.round(cb.height) }, radio: { w: Math.round(rb.width), h: Math.round(rb.height) } };
      f.remove(); return r;
    }).catch(() => null);

    // ---- per-element AX + DOM/style (CDP name/role authoritative) ----
    out.elements = [];
    for (const el of elements) {
      const rec = { xpath: el.xpath, landmark: el.landmark, sampledRole: el.sampledRole, sampledName: el.sampledName };
      // DOM + computed style snapshot
      const dom = await page.evaluate((xp, uaDefaults) => {
        const r = document.evaluate(xp, document, null, 9, null).singleNodeValue;
        if (!r) return null;
        const cs = getComputedStyle(r); const b = r.getBoundingClientRect();
        // effective background: walk ancestors until an opaque bg is found.
        // T11: if the walk crosses a positioned/transformed/overlaid ancestor the
        // chosen bg may NOT be what the element visually sits on (cards, overlays,
        // z-index) — flag so the agent prefers pixel-contrast.
        let bgEl = r, bg = cs.backgroundColor, bgImage = cs.backgroundImage;
        const isTransparent = c => !c || c === 'transparent' || /rgba\([^)]*,\s*0\s*\)/.test(c);
        let bgWalkCrossedOverlay = false;
        while (bgEl && isTransparent(getComputedStyle(bgEl).backgroundColor) && getComputedStyle(bgEl).backgroundImage === 'none') {
          const pcs = getComputedStyle(bgEl);
          if (bgEl !== r && (pcs.position === 'fixed' || pcs.position === 'absolute' || pcs.transform !== 'none' || (pcs.zIndex !== 'auto' && +pcs.zIndex > 0))) bgWalkCrossedOverlay = true;
          bgEl = bgEl.parentElement; if (!bgEl) break;
        }
        const effBg = bgEl ? getComputedStyle(bgEl).backgroundColor : null;
        const effBgImage = bgEl ? getComputedStyle(bgEl).backgroundImage : 'none';
        // T5: is the visible text in a child with a DIFFERENT colour than the
        // element's own computed colour? Then element-level contrastSolid is
        // misleading and pixel/child contrast is required.
        const childTextColors = new Set();
        for (const d of r.querySelectorAll('*')) {
          const hasOwnText = [...d.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
          if (hasOwnText) childTextColors.add(getComputedStyle(d).color);
        }
        const textInChildDiffColor = [...childTextColors].some(c => c !== cs.color);
        // C4: collect adjacent target RECTANGLES near this element so the 2.5.8
        // spacing exception can be evaluated with real circle-to-rect geometry
        // (not a center-distance proxy). Bounded to targets whose box is within
        // ~28px of this one (the 12px circle can only reach that far).
        const targetNeighbors = [];
        let inSentence = false;
        if (b.width > 0 && b.height > 0) {
          const tsel = 'a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button],[role=link],[role=tab],[role=menuitem],[role=checkbox],[role=radio],[role=switch],[role=spinbutton],[role=option],[role=menuitemcheckbox],[role=menuitemradio],[onclick]';
          const reach = 28;
          for (const t of document.querySelectorAll(tsel)) {
            if (t === r || r.contains(t) || t.contains(r)) continue;
            const tb = t.getBoundingClientRect(); if (tb.width === 0 || tb.height === 0) continue;
            const ts = getComputedStyle(t); if (ts.visibility === 'hidden' || ts.display === 'none') continue;
            // gap between the two boxes (0 if overlapping); keep only plausibly-intersecting
            const gx = Math.max(0, Math.max(tb.x - b.right, b.x - tb.right));
            const gy = Math.max(0, Math.max(tb.y - b.bottom, b.y - tb.bottom));
            if (gx <= reach && gy <= reach) targetNeighbors.push({ x: Math.round(tb.x), y: Math.round(tb.y), w: Math.round(tb.width), h: Math.round(tb.height) });
            if (targetNeighbors.length >= 64) break;
          }
          // C4/R2-H5 inline exception is SEMANTIC ("in a sentence"). Require display:inline
          // AND PROSE around the link: text in the block that is NOT inside other
          // interactive controls (a nav of links has ~no prose → inSentence stays false).
          if (cs.display === 'inline') {
            let blk = r.parentElement;
            while (blk && getComputedStyle(blk).display === 'inline') blk = blk.parentElement;
            if (blk) {
              const clone = blk.cloneNode(true);
              clone.querySelectorAll('a,button,input,select,textarea,summary,[role=link],[role=button],[role=menuitem],[role=tab]').forEach(n => n.remove());
              const prose = (clone.textContent || '').replace(/\s+/g, ' ').trim();
              // R21-H2: require sentence-like lowercase prose (two consecutive lowercase
              // words), not just any 15 non-control chars (all-caps nav labels are NOT a sentence).
              inSentence = prose.length >= 20 && /[a-z]{3,}\s+[a-z]{2,}/.test(prose);
            }
          }
        }
        // R22-H2: any element/ancestor transform with rotation/skew makes the axis-aligned
        // bbox an over-estimate; pure scale/translate keeps it rectangular. R2.3-A+:
        // an ancestor `clip-path` crops the target's hit area just as the element's own
        // does, so the clip check walks ancestors TOO (was element-only → a definite
        // pass on an ancestor-clipped target).
        let transformed = false, clipped = cs.clipPath !== 'none';
        for (let a = r; a; a = a.parentElement) {
          const acs = getComputedStyle(a);
          if (a !== r && acs.clipPath && acs.clipPath !== 'none') clipped = true;
          const t = acs.transform; if (!t || t === 'none') continue;
          const m = t.match(/matrix\(([^)]+)\)/); if (m) { const p = m[1].split(',').map(parseFloat); if (Math.abs(p[1]) > 0.001 || Math.abs(p[2]) > 0.001) { transformed = true; } }
          else if (/matrix3d|rotate|skew/.test(t)) { transformed = true; }
        }
        const cornerRadius = Math.max(parseFloat(cs.borderTopLeftRadius) || 0, parseFloat(cs.borderTopRightRadius) || 0, parseFloat(cs.borderBottomLeftRadius) || 0, parseFloat(cs.borderBottomRightRadius) || 0);
        // R22-H2: UA-Control exception requires the size to be UNMODIFIED by the author —
        // matching the default size is necessary but NOT sufficient. Require native
        // appearance (not appearance:none) and no transform too. Any author restyling that
        // could affect size/appearance disqualifies the definite exception.
        let uaControl = false;
        if (r.tagName.toLowerCase() === 'input' && (r.type === 'checkbox' || r.type === 'radio') && uaDefaults && uaDefaults[r.type]) {
          const def = uaDefaults[r.type]; const bw = Math.round(b.width), bh = Math.round(b.height);
          const nativeAppearance = !/^(none)$/.test(cs.appearance || cs.webkitAppearance || 'auto');
          uaControl = nativeAppearance && !transformed && Math.abs(bw - def.w) <= 2 && Math.abs(bh - def.h) <= 2;
        }
        const tag = r.tagName.toLowerCase();
        const roleAttr = r.getAttribute('role');
        // H7: AX/ARIA STATE collection (the name-role-STATE skill needs these).
        const stAttr = n => { const v = r.getAttribute(n); return v === null ? null : v; };
        const nativeTag = tag === 'input' ? (r.type || 'text') : tag;
        const states = {
          expanded: stAttr('aria-expanded'),
          pressed: stAttr('aria-pressed'),
          selected: stAttr('aria-selected'),
          checked: (r.type === 'checkbox' || r.type === 'radio') ? String(r.checked) : stAttr('aria-checked'),
          disabled: (r.disabled === true) ? 'true' : stAttr('aria-disabled'),
          current: stAttr('aria-current'),
          level: stAttr('aria-level'),
          valuetext: stAttr('aria-valuetext'),
          valuenow: stAttr('aria-valuenow'),
          required: (r.required === true) || stAttr('aria-required') === 'true',
          invalid: stAttr('aria-invalid'),
          readonly: (r.readOnly === true) || stAttr('aria-readonly') === 'true',
          hasPopup: stAttr('aria-haspopup'),
        };
        // effective tab order + role override + obscuring (point hit-test at centre)
        const tiAttr = r.getAttribute('tabindex');
        const tabindexEffective = tiAttr !== null ? +tiAttr : (['a', 'button', 'input', 'select', 'textarea', 'summary'].includes(tag) && !r.disabled ? 0 : null);
        const nativeInteractive = ['a', 'button', 'input', 'select', 'textarea', 'summary', 'details'].includes(tag);
        const roleOverridesNative = nativeInteractive && !!roleAttr;
        let obscured = false;
        if (b.width > 0 && b.height > 0) {
          const hx = Math.min(innerWidth - 1, Math.max(0, b.x + b.width / 2)), hy = Math.min(innerHeight - 1, Math.max(0, b.y + b.height / 2));
          const top = document.elementFromPoint(hx, hy);
          obscured = !!top && top !== r && !r.contains(top) && !top.contains(r);
        }
        // R2.4-D/R2.5-E: POSITIVELY prove a page-aligned 24×24 square fits ON the target —
        // densely hit-test (≈2px grid) the centred square; EVERY point must hit the target
        // or a descendant. The grid can only DISPROVE fit (a missed point ⇒ not solid), it
        // is never converted to a pass by evalTargetSize unless fully on-target. A ~2px step
        // catches realistic dead-strips/holes the old 5px grid missed. Off-viewport targets
        // are scrolled into view first (then scroll restored), so they are MEASURED rather
        // than silently falling back to flags. on-target excludes ANCESTORS (a point over an
        // ancestor means the target does not paint there).
        let squareFits = null;
        if (b.width >= 24 && b.height >= 24) {
          const sx0 = window.scrollX, sy0 = window.scrollY;
          try { r.scrollIntoView({ block: 'center', inline: 'center' }); } catch (e) {}
          const hb = r.getBoundingClientRect();
          const cx = hb.x + hb.width / 2, cy = hb.y + hb.height / 2;
          if (cx - 12 >= 0 && cy - 12 >= 0 && cx + 12 <= innerWidth && cy + 12 <= innerHeight) {
            // R2.6-E: sample the [-11,11] INTERIOR at 1px (avoid the razor ±12 edge where
            // elementFromPoint is ambiguous). A 1px step closes the 2px-grid Nyquist blind
            // spot — a non-target "comb"/strip with sub-2px teeth aligned between samples
            // can no longer read as fully on-target. Sub-1px gaps are physically irrelevant.
            let allOn = true;
            for (let dx = -11; dx <= 11 && allOn; dx += 1) { for (let dy = -11; dy <= 11; dy += 1) {
              const hit = document.elementFromPoint(cx + dx, cy + dy);
              if (!(hit && (hit === r || r.contains(hit)))) { allOn = false; break; }
            } }
            squareFits = allOn;
          }
          try { window.scrollTo(sx0, sy0); } catch (e) {}
        }
        const interactiveTags = ['a', 'button', 'input', 'select', 'textarea', 'summary', 'details'];
        const interactiveRoles = ['link', 'button', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'tab', 'checkbox', 'radio', 'switch', 'slider', 'textbox', 'combobox', 'option', 'spinbutton'];
        const formTags = ['input', 'select', 'textarea'];
        const formRoles = ['textbox', 'combobox', 'checkbox', 'radio', 'switch', 'slider', 'spinbutton', 'searchbox'];
        return {
          tag, roleAttr, ariaLabel: r.getAttribute('aria-label'), ariaLabelledby: r.getAttribute('aria-labelledby'),
          ariaDescribedby: r.getAttribute('aria-describedby'), alt: r.getAttribute('alt'),
          title: r.getAttribute('title'), placeholder: r.getAttribute('placeholder'),
          required: r.hasAttribute('required') || r.getAttribute('aria-required') === 'true',
          ariaInvalid: r.getAttribute('aria-invalid'),
          hasOnclick: r.hasAttribute('onclick'),
          text: (r.innerText || r.textContent || '').trim().slice(0, 120), tabindex: r.getAttribute('tabindex'),
          box: { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) },
          color: cs.color, ownBg: cs.backgroundColor, ownBgImage: cs.backgroundImage,
          effBg, effBgImage, bgWalkCrossedOverlay, textInChildDiffColor,
          display: cs.display, inSentence, inlineCandidate: cs.display === 'inline', uaControl, transformed, clipped, cornerRadius, squareFits, targetNeighbors,
          states, tabindexEffective, roleOverridesNative, obscured,
          fontSize: cs.fontSize, fontWeight: cs.fontWeight,
          outlineStyle: cs.outlineStyle, outlineWidth: cs.outlineWidth, outlineColor: cs.outlineColor,
          boxShadow: cs.boxShadow,
          isInteractive: interactiveTags.includes(tag) || interactiveRoles.includes(roleAttr) || (r.getAttribute('tabindex') !== null && +r.getAttribute('tabindex') >= 0) || r.hasAttribute('onclick'),
          isFormField: formTags.includes(tag) || formRoles.includes(roleAttr),
          isImage: tag === 'img' || tag === 'svg' || tag === 'canvas' || roleAttr === 'img',
        };
      }, el.xpath, out.uaDefaults).catch(e => ({ _err: e.message }));

      if (!dom) { rec.notFound = true; out.elements.push(rec); continue; }
      if (dom._err) { rec.error = dom._err; out.elements.push(rec); continue; }
      Object.assign(rec, dom);

      // exact solid-bg contrast when both fg and effective bg are opaque solids
      const fg = parseRGB(dom.color), bgc = parseRGB(dom.effBg);
      rec.fontPx = parseFloat(dom.fontSize);
      rec.needsPixelContrast = false;
      if (fg && bgc && bgc.a >= 0.999 && dom.effBgImage === 'none') {
        rec.contrastSolid = contrast([fg.r, fg.g, fg.b], [bgc.r, bgc.g, bgc.b]);
        // T4: correct WCAG large-text classification (18pt/14pt-bold), via shared lib.
        rec.contrastThreshold = A.contrastThresholdFor(rec.fontPx, dom.fontWeight);
        // T5/T11: the element-level solid contrast is unreliable if the visible text
        // lives in a differently-coloured child, or the bg walk crossed an overlay.
        if (dom.textInChildDiffColor || dom.bgWalkCrossedOverlay) {
          rec.needsPixelContrast = true;
          rec.contrastReliable = false;
          rec.contrastUnreliableReason = dom.textInChildDiffColor ? 'text in differently-coloured child' : 'bg walk crossed positioned/overlay ancestor';
        } else {
          rec.contrastReliable = true;
        }
      } else if (dom.text && dom.text.length) {
        // text present but bg is transparent / image / gradient → pixel sampling needed
        rec.needsPixelContrast = true;
        rec.contrastReliable = false;
      }

      // C4: target-size (2.5.8) with the NORMATIVE circle geometry + semantic inline
      // exception, computed by the harness so the agent doesn't re-derive box<24.
      if (dom.box) {
        rec.targetSize = A.evalTargetSize(dom.box, {
          inSentence: dom.inSentence, inlineCandidate: dom.inlineCandidate,
          uaControl: dom.uaControl, transformed: dom.transformed, clipped: dom.clipped, cornerRadius: dom.cornerRadius,
          squareFits: dom.squareFits,
          neighbors: dom.targetNeighbors,
        });
      }

      // CDP-computed AX role + name (authoritative; same path as /ax-node)
      try {
        const ev = await cdp.send('Runtime.evaluate', {
          expression: `(function(){var r=document.evaluate(${JSON.stringify(el.xpath)},document,null,9,null);return r.singleNodeValue;})()`,
          returnByValue: false,
        });
        if (ev.result && ev.result.objectId) {
          const { node } = await cdp.send('DOM.describeNode', { objectId: ev.result.objectId });
          if (node) {
            const { nodes } = await cdp.send('Accessibility.getAXNodeAndAncestors', { backendNodeId: node.backendNodeId });
            const ax = nodes && nodes[0];
            if (ax) {
              const getProp = name => { const p = (ax.properties || []).find(p => p.name === name); return p ? p.value.value : undefined; };
              rec.axRole = ax.role && ax.role.value || null;
              // PRESERVE an empty CDP name as '' (a name property that resolved to empty), distinct from
              // null (no name property / unresolved). The old `|| null` conflated them, which made the
              // ax-name-presence detector (build-v3.js, fires only on empty-STRING) unreachable on real
              // data. Downstream label-in-name checks gate on `trim().length > 0`, so '' behaves like null
              // there (no label-in-name) — only the empty-vs-unresolved distinction is restored.
              rec.axName = ax.name && ax.name.value != null ? String(ax.name.value) : null;
              // T12: a video/audio that can't load offline yields the browser's
              // fallback string as the AX name — flag it as NOT author-supplied.
              if (A.isMediaErrorName(rec.axName)) { rec.mediaErrorName = true; rec.axNameAuthorSupplied = false; }
              rec.inTree = !ax.ignored;
              rec.focusable = getProp('focusable') || false;
              rec.ignoredReasons = (ax.ignoredReasons || []).map(r => r.name);
              // H7: authoritative AX states from the computed accessibility node.
              rec.axStates = {
                checked: getProp('checked'), expanded: getProp('expanded'), pressed: getProp('pressed'),
                selected: getProp('selected'), disabled: getProp('disabled'), required: getProp('required'),
                invalid: getProp('invalid'), current: getProp('current'), level: getProp('level'),
                valuetext: getProp('valuetext'), readonly: getProp('readonly'), haspopup: getProp('haspopup'),
              };
            }
          }
        }
      } catch (e) { rec.axError = e.message; }

      out.elements.push(rec);
    }
  } finally {
    await browser.close();
  }
  // R2.8-D (R27-H2): stamp collectedAt at COMPLETION (not start) so the driver's start
  // (drivenAt) being >= collectedAt proves it ran after the collector FINISHED — i.e. it
  // could have used a completed collection, not merely started after the collector started.
  out.collectedAt = Date.now();
  console.log(JSON.stringify(out));
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
