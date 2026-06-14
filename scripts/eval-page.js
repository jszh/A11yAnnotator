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
const A = require('./lib/a11y-eval.js'); // shared pure helpers (see HARNESS-ISSUES.md)

const ROOT = path.join(__dirname, '..');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = process.env.PORT ? +process.env.PORT : 3001;
const BASE = process.env.A11Y_BASE || `http://127.0.0.1:${PORT}`;
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : d; };
const has = (n) => args.includes('--' + n);

const FILE = opt('file');
if (!FILE) { console.error('need --file "<saved file name>"'); process.exit(2); }
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
    const arr = JSON.parse(fs.readFileSync(opt('xpaths'), 'utf8'));
    return arr.map(x => (typeof x === 'string' ? x : x.xpath)).filter(Boolean);
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
  const out = { file: FILE, noscript: NOSCRIPT, collectedAt: null, elementCount: elements.length, problems: [] };
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
      let n = 0; const matched = [];
      for (const sel of selectors) {
        let els = [];
        try { els = [...document.querySelectorAll(sel)]; } catch (e) { continue; }
        for (const el of els) { el.setAttribute('data-a11yeval-consent-hidden', '1'); el.style.setProperty('display', 'none', 'important'); n++; }
        if (els.length) matched.push(sel);
      }
      return { count: n, selectors: matched };
    }, A.CONSENT_SELECTORS).catch(() => ({ count: 0, selectors: [] }));

    // ---- page-level structure (one evaluate) ----
    out.structure = await page.evaluate(() => {
      const txt = el => (el.textContent || '').trim().slice(0, 60);
      const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role=heading]')].map(h => ({
        tag: h.tagName.toLowerCase(),
        level: h.getAttribute('aria-level') || (/^H([1-6])$/.test(h.tagName) ? h.tagName[1] : null),
        text: txt(h), empty: txt(h).length === 0,
      }));
      const lmSel = 'header,nav,main,aside,footer,[role=banner],[role=navigation],[role=main],[role=complementary],[role=contentinfo],[role=search],[role=region],[role=form]';
      const landmarks = [...document.querySelectorAll(lmSel)].map(l => ({
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
      out.axe = await page.evaluate(async () => {
        const cfg = {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
          rules: { 'target-size': { enabled: true }, 'aria-roledescription': { enabled: true }, 'label-content-name-mismatch': { enabled: true } },
          resultTypes: ['violations'],
        };
        const r = await axe.run(document, cfg);
        return r.violations.map(v => ({
          id: v.id, impact: v.impact, help: v.help, wcag: (v.tags || []).filter(t => /^wcag\d/.test(t)),
          nodes: v.nodes.map(n => ({ target: n.target, html: (n.html || '').slice(0, 160) })),
        }));
      });
    } catch (e) { out.problems.push('axe: ' + e.message); out.axe = []; }

    // ---- per-element AX + DOM/style (CDP name/role authoritative) ----
    out.elements = [];
    for (const el of elements) {
      const rec = { xpath: el.xpath, landmark: el.landmark, sampledRole: el.sampledRole, sampledName: el.sampledName };
      // DOM + computed style snapshot
      const dom = await page.evaluate((xp) => {
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
        // T3: nearest OTHER interactive target's centre-to-centre distance (for the
        // 2.5.8 spacing exception). Bounded scan of visible clickable targets.
        const myCx = b.x + b.width / 2, myCy = b.y + b.height / 2;
        let nearestTargetCenterDist = null;
        if (b.width > 0 && b.height > 0) {
          const tsel = 'a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button],[role=link],[role=tab],[role=menuitem],[role=checkbox],[role=radio],[onclick]';
          let best = Infinity;
          for (const t of document.querySelectorAll(tsel)) {
            if (t === r || r.contains(t) || t.contains(r)) continue;
            const tb = t.getBoundingClientRect(); if (tb.width === 0 || tb.height === 0) continue;
            const ts = getComputedStyle(t); if (ts.visibility === 'hidden' || ts.display === 'none') continue;
            const d = Math.hypot((tb.x + tb.width / 2) - myCx, (tb.y + tb.height / 2) - myCy);
            if (d < best) best = d;
          }
          nearestTargetCenterDist = best === Infinity ? null : +best.toFixed(1);
        }
        const tag = r.tagName.toLowerCase();
        const roleAttr = r.getAttribute('role');
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
          // pure `inline` only (text-flow, line-height-constrained) qualifies for the
          // 2.5.8 inline exception — inline-block/-flex can be standalone targets.
          display: cs.display, isInline: cs.display === 'inline',
          nearestTargetCenterDist,
          fontSize: cs.fontSize, fontWeight: cs.fontWeight,
          outlineStyle: cs.outlineStyle, outlineWidth: cs.outlineWidth, outlineColor: cs.outlineColor,
          boxShadow: cs.boxShadow,
          isInteractive: interactiveTags.includes(tag) || interactiveRoles.includes(roleAttr) || (r.getAttribute('tabindex') !== null && +r.getAttribute('tabindex') >= 0) || r.hasAttribute('onclick'),
          isFormField: formTags.includes(tag) || formRoles.includes(roleAttr),
          isImage: tag === 'img' || tag === 'svg' || tag === 'canvas' || roleAttr === 'img',
        };
      }, el.xpath).catch(e => ({ _err: e.message }));

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

      // T3: target-size (2.5.8) WITH the standard exceptions, computed by the
      // harness so the agent doesn't re-derive a naive box<24 rule.
      if (dom.box) {
        rec.targetSize = A.evalTargetSize(dom.box, {
          isInline: dom.isInline,
          display: dom.display,
          nearestTargetCenterDist: dom.nearestTargetCenterDist,
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
              rec.axName = ax.name && ax.name.value || null;
              // T12: a video/audio that can't load offline yields the browser's
              // fallback string as the AX name — flag it as NOT author-supplied.
              if (A.isMediaErrorName(rec.axName)) { rec.mediaErrorName = true; rec.axNameAuthorSupplied = false; }
              rec.inTree = !ax.ignored;
              rec.focusable = getProp('focusable') || false;
              rec.ignoredReasons = (ax.ignoredReasons || []).map(r => r.name);
            }
          }
        }
      } catch (e) { rec.axError = e.message; }

      out.elements.push(rec);
    }
  } finally {
    await browser.close();
  }
  console.log(JSON.stringify(out));
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
