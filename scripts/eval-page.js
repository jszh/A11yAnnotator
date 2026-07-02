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
// page-location resolution is centralized in scripts/lib/asset-paths.js (one place to relocate fixtures).
const { assetPath, assetUrlUnder } = require('./lib/asset-paths.js');
const { collectTables } = require('./v3/lib/collect-tables.js'); // Tier-0 #4: per-<table> relationship facts for 1.3.1
const { collectLists } = require('./v3/lib/collect-lists.js');   // TT gap G1: per-list semantics (1.3.1 / TT 10.D)
function pageDigest(file) {
  try { return 'sha256:' + crypto.createHash('sha256').update(fs.readFileSync(assetPath(file))).digest('hex'); }
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

    const url = assetUrlUnder(BASE, FILE) + '?offline=1' + (NOSCRIPT ? '&noscript=1' : '');
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
      const xpathOf = (el) => {  // hoisted ABOVE the heading map (#2): a const arrow is in the TDZ until here
        if (!el || el.nodeType !== 1) return null;
        const parts = [];
        for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
          let i = 1; for (let s = n.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === n.tagName) i++;
          parts.unshift(n.tagName.toLowerCase() + '[' + i + ']');
        }
        return '/' + parts.join('/');
      };
      const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role=heading]')].filter(h => !inConsent(h)).map(h => ({
        tag: h.tagName.toLowerCase(),
        level: h.getAttribute('aria-level') || (/^H([1-6])$/.test(h.tagName) ? h.tagName[1] : null),
        text: txt(h), empty: txt(h).length === 0,
        xpath: xpathOf(h),  // #2 parity: so the CDP pass below can source the authoritative accessible name
        // S7 (RCA R7) parity: heading accessible NAME + aria-hidden. `name` is a heuristic FALLBACK here —
        // overwritten by the CDP-computed name below (so an <img alt> heading no longer reads as '').
        name: (h.getAttribute('aria-label') || txt(h)),
        ariaHidden: h.getAttribute('aria-hidden') === 'true' || !!h.closest('[aria-hidden="true"]'),
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
      // coverage #16 (dangling-IDREF): page-wide id → trimmed-text-LENGTH, so build-v3 can resolve
      // aria-labelledby/aria-describedby IDREFs deterministically without live-DOM access (a dangling
      // ref ⇒ id absent from this map; an empty target ⇒ length 0). Capped to bound the artifact.
      const pageIds = {}; { let n = 0; for (const e of document.querySelectorAll('[id]')) { const id = e.getAttribute('id'); if (!id || Object.prototype.hasOwnProperty.call(pageIds, id)) continue; pageIds[id] = (e.textContent || '').trim().length; if (++n >= 4000) break; } }
      // coverage #12 (group-label/fieldset, F82/H71): every <fieldset> / role=group|radiogroup, with
      // whether it carries an accessible GROUP NAME (a non-empty <legend>, aria-label, or a RESOLVED
      // aria-labelledby) and how many form controls it owns. build-v3 flags a group that owns ≥2 controls
      // but has NO accessible name. (Implicit radio-name grouping without a container is FP-prone and is
      // left to a rubric — only an EXPLICIT group container is judged here.)
      const grpSel = 'fieldset,[role=group],[role=radiogroup]';
      const ctlSel = 'input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset]),select,textarea,[role=checkbox],[role=radio],[role=switch],[role=spinbutton],[role=combobox],[role=listbox],[role=textbox],[role=slider]';
      const fieldsets = [...document.querySelectorAll(grpSel)].filter(g => !inConsent(g)).slice(0, 60).map(g => {
        const legend = g.tagName.toLowerCase() === 'fieldset' ? g.querySelector(':scope > legend') : null;
        const legendText = legend ? (legend.textContent || '').trim() : '';
        const ariaLabel = (g.getAttribute('aria-label') || '').trim();
        const lb = g.getAttribute('aria-labelledby');
        const labelledbyText = lb ? lb.split(/\s+/).map(id => { const t = document.getElementById(id); return t ? (t.textContent || '').trim() : ''; }).join(' ').trim() : '';
        // count only DIRECT controls — a control whose NEAREST group ancestor is g (not a nested inner
        // group). Otherwise a nameless STRUCTURING wrapper around legended inner fieldsets would false-fire
        // the group-label detector (adversarial verify #2).
        const directControls = [...g.querySelectorAll(ctlSel)].filter(c => c.closest(grpSel) === g);
        const controlCount = directControls.length;
        // how many of the direct controls are radio/checkbox — a group NAME is the primary way AT users learn
        // what such CHOICES belong to (a group of individually-labeled text fields is less name-dependent).
        const radioCheckboxCount = directControls.filter(c => { const t = (c.getAttribute('type') || '').toLowerCase(), r = (c.getAttribute('role') || '').toLowerCase(); return t === 'radio' || t === 'checkbox' || r === 'radio' || r === 'checkbox'; }).length;
        return {
          xpath: xpathOf(g), tag: g.tagName.toLowerCase(), role: g.getAttribute('role') || null,
          hasLegend: !!legend, legendText: legendText.slice(0, 80), ariaLabel: ariaLabel.slice(0, 80),
          labelledbyText: labelledbyText.slice(0, 80), controlCount, radioCheckboxCount,
        };
      });
      return {
        title: document.title, lang: document.documentElement.getAttribute('lang') || null,
        headings, landmarkCount: landmarks.length, landmarks: landmarks.slice(0, 40),
        hasMain: landmarks.some(l => l.tag === 'main' || l.role === 'main'),
        hasNav: landmarks.some(l => l.tag === 'nav' || l.role === 'navigation'),
        listStyleNone, liveRegions, pageIds, fieldsets,
      };
    });
    // Tier-0 #4: per-<table> relationship facts (shared self-contained extractor); folded into structure for the
    // 1.3.1 info-relationships JUDGMENT. Read-only; degrades to [] on any failure.
    try { out.structure.tables = await page.evaluate(collectTables); } catch (e) { out.structure.tables = []; }
    // TT gap G1: per-list semantics (real ul/ol/dl + visually-apparent faux lists) for the 1.3.1 JUDGMENT.
    try { out.structure.lists = await page.evaluate(collectLists); } catch (e) { out.structure.lists = []; }
    // #2 parity: source heading accessible NAMES from the CDP-computed AX node (same machinery as the element
    // loop below) — the in-page heuristic returns '' for an <h2><img alt="Foo"></h2> heading; CDP gives "Foo".
    // Falls back to the heuristic name when a node can't resolve. Mirrors act-page-collect.js's heading CDP pass.
    for (const h of (out.structure.headings || [])) {
      if (!h || !h.xpath) continue;
      try {
        const ev = await cdp.send('Runtime.evaluate', { expression: `(function(){var r=document.evaluate(${JSON.stringify(h.xpath)},document,null,9,null);return r.singleNodeValue;})()`, returnByValue: false });
        if (!ev || !ev.result || !ev.result.objectId) continue;
        const { node } = await cdp.send('DOM.describeNode', { objectId: ev.result.objectId });
        if (!node) continue;
        const { nodes } = await cdp.send('Accessibility.getAXNodeAndAncestors', { backendNodeId: node.backendNodeId });
        const ax = nodes && nodes[0];
        const nm = ax && ax.name && ax.name.value;
        if (typeof nm === 'string') h.name = nm;
      } catch (e) { /* keep the heuristic name */ }
    }

    // ---- axe (CACHED full run) ----
    try {
      // AXE-PARITY (DEFERRED-TODO item C): eval-page's element xpaths are EXTERNAL (loadXpaths), so the scheme
      // can't be matched by string. TAG each obligation element's node with its v3 xpath, then the axe run maps
      // its CSS-selector targets back to that xpath by DOM-node IDENTITY (scheme-agnostic) — so build-v3's
      // axe-promotion matches an axe violation to its obligation. (SVG-namespaced nodes won't tag until the
      // separate SVG-xpath fix — DEFERRED-TODO/analysis — lands; non-SVG works today.)
      try { await page.evaluate((xps) => { for (const xp of xps) { try { const n = document.evaluate(xp, document, null, 9, null).singleNodeValue; if (n && n.setAttribute) n.setAttribute('data-v3-xp', xp); } catch (e) {} } }, elements.map((e) => e.xpath)); } catch (e) {}
      await page.addScriptTag({ path: path.join(ROOT, 'axe.min.js') });
      const axeOut = await page.evaluate(async () => {
        const cfg = {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
          rules: { 'target-size': { enabled: true }, 'aria-roledescription': { enabled: true }, 'label-content-name-mismatch': { enabled: true } },
          resultTypes: ['violations', 'incomplete'], // incomplete = axe's needs-review priors (surfaced as review-tier, never a decision)
        };
        const r = await axe.run(document, cfg);
        // GUARD (adversarial review): axe `target` is a per-frame-boundary array; a depth>1 target is a node in a
        // CHILD frame, and querySelecting its last selector against the TOP document would miss OR mis-resolve to a
        // DIFFERENT top-level node with the same selector → a wrong-but-plausible xpath. Return null for cross-frame
        // targets (degrade to a shadow cssTarget signal, never mis-attribute). The identity match is exact only for
        // single-frame (depth-1) targets — which is all the corpus produces today (axe is injected top-frame-only).
        const xpOf = (target) => { try { if (Array.isArray(target) && target.length > 1) return null; const sel = Array.isArray(target) ? target[0] : target; const el = sel ? document.querySelector(sel) : null; return el && el.getAttribute ? el.getAttribute('data-v3-xp') : null; } catch (e) { return null; } };
        const map = (arr) => (arr || []).map(v => ({
          id: v.id, impact: v.impact, help: v.help, wcag: (v.tags || []).filter(t => /^wcag\d/.test(t)),
          nodes: v.nodes.map(n => ({ target: n.target, xpath: xpOf(n.target), html: (n.html || '').slice(0, 160) })),
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
        // ITEM 9 (parity with act-page-collect): 1.4.13 content-on-hover + 2.4.11 focus-not-obscured. Memoize the
        // page-level overlay list + tooltip ids on `window` (this evaluate runs per-element on the SAME page, so it
        // is computed ONCE). underOverlay: a top-anchored wide/tall sticky/fixed overlay a focusable can scroll
        // under (the oracle additionally gates on focusable). hasHoverContent: controls/describes a tooltip/popover
        // (popovertarget / aria-describedby|aria-controls → [role=tooltip]/[popover]); native `title` is EXEMPT.
        if (!window.__v3ovl) {
          const ov = [];
          for (const o of document.querySelectorAll('body *')) {
            const ocs = getComputedStyle(o);
            if ((ocs.position === 'fixed' || ocs.position === 'sticky') && ocs.display !== 'none' && ocs.visibility !== 'hidden' && parseFloat(ocs.opacity) !== 0) {
              const orc = o.getBoundingClientRect();
              if (orc.width >= window.innerWidth * 0.5 && orc.height >= 16 && orc.top <= 8) ov.push({ top: orc.top, bottom: orc.bottom, left: orc.left, right: orc.right });
            }
          }
          const tt = new Set(); for (const t of document.querySelectorAll('[role=tooltip],[popover]')) if (t.id) tt.add(t.id);
          window.__v3ovl = ov; window.__v3tt = tt;
        }
        const underOverlay = window.__v3ovl.some((ov) => b.x < ov.right && b.x + b.width > ov.left && b.y >= ov.bottom - 2);
        let hasHoverContent = r.hasAttribute('popovertarget');
        if (!hasHoverContent) for (const a of ['aria-describedby', 'aria-controls']) { const v = r.getAttribute(a); if (v) { for (const id of v.split(/\s+/)) if (window.__v3tt.has(id)) { hasHoverContent = true; break; } } if (hasHoverContent) break; }
        // Item 11 (4.1.3 parity): a status/live-region container.
        const _alive = (r.getAttribute('aria-live') || '').toLowerCase();
        const liveRegion = _alive === 'polite' || _alive === 'assertive' || /^(status|alert|log|progressbar|marquee|timer)$/.test(r.getAttribute('role') || '');
        // Item 14d (2.2.2 parity): looping/>5s CSS animation, <marquee>, or autoplay media without controls.
        const autoMotion = r.tagName.toLowerCase() === 'marquee'
          || (cs.animationName && cs.animationName !== 'none' && (cs.animationIterationCount === 'infinite' || parseFloat(cs.animationDuration) > 5))
          || ((r.tagName.toLowerCase() === 'video' || r.tagName.toLowerCase() === 'audio') && r.hasAttribute('autoplay') && !r.hasAttribute('controls'));
        // #9 fix (TT 4.1.2 2.D parity): a carousel/slideshow whose content auto-rotates on a timer (Bootstrap's
        // data-ride/data-bs-ride="carousel") — distinct from autoMotion (the animation itself, 2.2.2) and liveRegion
        // (an aria-live container, 4.1.3); narrowly scoped to the known carousel-library marker.
        const autoUpdatingContent = r.hasAttribute('data-ride') && /carousel|slider|slideshow/i.test(r.getAttribute('data-ride') || '')
          || r.hasAttribute('data-bs-ride') && /carousel|slider|slideshow/i.test(r.getAttribute('data-bs-ride') || '');
        // Item 10 (1.2.x media parity): a <video>/<audio> + its <track> children.
        const _mtag = r.tagName.toLowerCase();
        const isMedia = _mtag === 'video' || _mtag === 'audio';
        let mediaInfo = null;
        if (isMedia) {
          const tracks = [...r.querySelectorAll('track')];
          const kinds = tracks.map((t) => (t.getAttribute('kind') || 'subtitles').toLowerCase());
          const cap = tracks.find((t) => /^(captions|subtitles)$/.test((t.getAttribute('kind') || 'subtitles').toLowerCase()));
          mediaInfo = { mediaTag: _mtag, hasControls: r.hasAttribute('controls'), trackKinds: kinds, hasCaptionsTrack: !!cap, captionsTrackEmpty: !!cap && !(cap.getAttribute('src') || '').trim(), hasDescriptionsTrack: kinds.includes('descriptions') };
        }
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
        // DECORATIVE-MARKING conflict (Tier-0 #5, e88epe — parity with act-page-collect): an image removed from the
        // a11y tree (aria-hidden on self/ancestor / role=presentation|none / empty alt) that still RENDERS meaningful
        // pixels is the barrier the adequacy rubric kept missing (it saw the author alt + a logo crop and cleared).
        const _ariaHidden = r.getAttribute('aria-hidden') === 'true' || !!r.closest('[aria-hidden="true"]');
        const _presentational = roleAttr === 'presentation' || roleAttr === 'none';
        const _emptyAlt = tag === 'img' && r.getAttribute('alt') === '';
        const removedFromA11yTree = _ariaHidden || _presentational || _emptyAlt;
        const hiddenMechanism = _ariaHidden ? 'aria-hidden' : _presentational ? ('role-' + roleAttr) : _emptyAlt ? 'empty-alt' : null;
        const ariaHiddenWithName = _ariaHidden && (((r.getAttribute('alt') || '') + ' ' + (r.getAttribute('aria-label') || '') + ' ' + (r.getAttribute('title') || '')).trim().length > 0);
        const _isImg = (tag === 'img' || tag === 'svg' || tag === 'canvas' || roleAttr === 'img');
        const svgLiveText = tag === 'svg' && !!r.querySelector('text, tspan') && (r.textContent || '').trim().length > 0; // S7 (R7, 0va7u6) parity
        const renderedVisible = _isImg && b.width >= 8 && b.height >= 8; // S3 (R3): SIZE/visibility only — not "meaningful" (parity with act-page-collect)
        // DECORATIVE-CONFLICT (Tier-0 #5, e88epe 2 & 3 — parity with act-page-collect): explicitly hidden (aria-hidden /
        // role=presentation|none) yet author-NAMED and RENDERED → mint the gated 1.1.1 alt-adequacy obligation (oracle).
        // A bare alt="" image (no author name) is NOT a conflict — genuinely decorative; needs vision, not enumeration.
        const _authorName = ((r.getAttribute('alt') || '') + ' ' + (r.getAttribute('aria-label') || '') + ' ' + (r.getAttribute('title') || '')).trim();
        const decorativeConflict = (_ariaHidden || _presentational) && _authorName.length > 0 && renderedVisible === true;
        // S3 (RCA R3): nearby text for the REDUNDANCY judgment (parity). Redundant-with-adjacent-text ⇒ decorative; unique ⇒ barrier if removed.
        const _txt = (e) => (e && (e.innerText || e.textContent) || '').replace(/\s+/g, ' ').trim();
        const nearbyText = !_isImg ? undefined : (function () {
          const bits = [];
          const fig = r.closest('figure'); if (fig) { const cap = fig.querySelector('figcaption'); if (cap) bits.push(_txt(cap)); }
          if (r.parentElement) bits.push(_txt(r.parentElement));
          for (const sib of [r.previousElementSibling, r.nextElementSibling]) if (sib) bits.push(_txt(sib));
          return [...new Set(bits.filter(Boolean))].join(' | ').replace(/\s+/g, ' ').trim().slice(0, 300) || undefined;
        })();
        // COMPLEX-IMAGE hint (Item 7b, parity): a data-bearing image (figure / role=figure / aria-describedby) owes
        // long-description-completeness; a bare logo/icon gets alt-adequacy only.
        const complexImageHint = (tag === 'img' || tag === 'svg' || tag === 'canvas' || roleAttr === 'img') && (!!r.closest('figure') || roleAttr === 'figure' || r.hasAttribute('aria-describedby'));
        // C8 glyph-substitution predicate: the element's OWN direct text (not descendants) carries an icon-font/PUA
        // codepoint or a Cyrillic/Greek-mixed-with-Latin homoglyph — the glyph-text-alternative family + runner.
        let _ownTxt = ''; for (const _n of r.childNodes) if (_n.nodeType === 3) _ownTxt += _n.textContent;
        const hasGlyphText = [..._ownTxt].some((ch) => { const c = ch.codePointAt(0); return (c >= 0xE000 && c <= 0xF8FF) || (c >= 0xF0000 && c <= 0xFFFFD) || (c >= 0x100000 && c <= 0x10FFFD); }) || (/[Ѐ-ӿͰ-Ͽ]/.test(_ownTxt) && /[a-zA-Z]/.test(_ownTxt));
        // C8 multipart-field-grouping predicate: this is one of ≥2 short (maxlength≤6) inputs in a shared
        // fieldset/group/form — a split field (date DD/MM/YYYY, card groups, code digits) — the multipart family.
        const splitFieldGroup = (() => {
          if ((tag !== 'input' && tag !== 'select')) return false;
          const ml = parseInt(r.getAttribute('maxlength'), 10); if (!(Number.isFinite(ml) && ml <= 6)) return false;
          const grp = r.closest('fieldset, [role=group], form, div'); if (!grp) return false;
          return [...grp.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button]), select')].filter((i) => { const m = parseInt(i.getAttribute('maxlength'), 10); return Number.isFinite(m) && m <= 6; }).length >= 2;
        })();
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
        const interactiveRoles = ['link', 'button', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'tab', 'checkbox', 'radio', 'switch', 'slider', 'textbox', 'combobox', 'searchbox', 'option', 'spinbutton']; // 'searchbox' added for bg-gate parity with act-page-collect (R2 G2-1)
        const formTags = ['input', 'select', 'textarea'];
        const formRoles = ['textbox', 'combobox', 'checkbox', 'radio', 'switch', 'slider', 'spinbutton', 'searchbox'];
        // TT gaps G2/G3 (1.1.1, parity with act-page-collect.js): a meaningful CSS background-image (TT 7.C) + a
        // CAPTCHA widget (TT 7.D). IDENTICAL hard gates to the synthetic collector so the fact is the same on both
        // paths — url() bg, rendered box, no text, no accessible name, not aria-hidden/presentational, not an <img>,
        // and interactive OR icon-sized. The rubric judges informational-vs-decorative / the multi-modal question.
        const _bgi = cs.backgroundImage || '';
        // RESOLVE aria-labelledby to text (parity with act-page-collect) — a dangling labelledby must not mask a barrier.
        const _lblText = (r.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean).map((id) => { const t = document.getElementById(id); return t ? (t.textContent || '') : ''; }).join(' ');
        const _accName = ((tag === 'img' ? (r.getAttribute('alt') || '') : '') + ' ' + (r.getAttribute('aria-label') || '') + ' ' + _lblText + ' ' + (r.getAttribute('title') || '')).trim();
        const _interactiveLocal = interactiveTags.includes(tag) || interactiveRoles.includes(roleAttr) || (r.getAttribute('tabindex') !== null && +r.getAttribute('tabindex') >= 0) || r.hasAttribute('onclick');
        // SIZE is a meaning proxy — defer informational-vs-decorative to the rubric (parity with act-page-collect):
        // nominate any non-tracking-pixel bg that is NOT a full-bleed backdrop; interactive nominated at any size.
        const _fullBleed = b.width >= (innerWidth || 1280) * 0.8 && b.height >= (innerHeight || 800) * 0.5;
        const _bgCandidate = b.width >= 16 && b.height >= 16 && !_fullBleed;
        const backgroundImageMeaningful = /url\(/i.test(_bgi) && !_ariaHidden && !_presentational && !_isImg
          && (r.innerText || r.textContent || '').trim().length === 0 && _accName.length === 0 && b.width > 0 && b.height > 0 && (_interactiveLocal || _bgCandidate);
        const backgroundImageUrl = backgroundImageMeaningful ? ((_bgi.match(/url\(["']?([^"')]+)["']?\)/i) || [])[1] || null) : null;
        // TIGHTENED, token-based captcha detection (R2 G3-1, parity with act-page-collect `_isCaptchaEl`): provider
        // signals OR captcha/turnstile as a LEADING class/id token segment (not a buried substring); title only on iframe.
        const _capTok = (s) => (s || '').toLowerCase().split(/\s+/).some((t) => /^(g-recaptcha|h-captcha|cf-turnstile|(re|h)?captcha|turnstile)(-|$)/.test(t));
        const isCaptcha = r.hasAttribute('data-sitekey')
          || /recaptcha|hcaptcha|captcha|turnstile/.test((r.getAttribute('src') || '').toLowerCase())
          || _capTok(r.getAttribute('class')) || _capTok(r.getAttribute('id'))
          || (tag === 'iframe' && /captcha|turnstile/.test((r.getAttribute('title') || '').toLowerCase()));
        return {
          tag, roleAttr, ariaLabel: r.getAttribute('aria-label'), ariaLabelledby: r.getAttribute('aria-labelledby'),
          ariaDescribedby: r.getAttribute('aria-describedby'), alt: r.getAttribute('alt'), href: r.getAttribute('href'), // href: Item 14a (2.4.4 same-name index)
          title: r.getAttribute('title'), placeholder: r.getAttribute('placeholder'),
          required: r.hasAttribute('required') || r.getAttribute('aria-required') === 'true',
          ariaInvalid: r.getAttribute('aria-invalid'),
          hasOnclick: r.hasAttribute('onclick'),
          text: (r.innerText || r.textContent || '').trim().slice(0, 120), tabindex: r.getAttribute('tabindex'),
          box: { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) },
          color: cs.color, ownBg: cs.backgroundColor, ownBgImage: cs.backgroundImage,
          effBg, effBgImage, bgWalkCrossedOverlay, textInChildDiffColor,
          display: cs.display, cursor: cs.cursor, inSentence, inlineCandidate: cs.display === 'inline', uaControl, transformed, clipped, cornerRadius, squareFits, targetNeighbors,
          states, tabindexEffective, roleOverridesNative, obscured,
          fontSize: cs.fontSize, fontWeight: cs.fontWeight,
          outlineStyle: cs.outlineStyle, outlineWidth: cs.outlineWidth, outlineColor: cs.outlineColor,
          boxShadow: cs.boxShadow,
          isInteractive: interactiveTags.includes(tag) || interactiveRoles.includes(roleAttr) || (r.getAttribute('tabindex') !== null && +r.getAttribute('tabindex') >= 0) || r.hasAttribute('onclick'),
          // #4 parity: passive-container-vs-operable-control facts for the 2.1.1 judgment.
          ownsInteractiveDescendants: !!r.querySelector('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"]),[role=button],[role=link],[role=menuitem],[role=checkbox],[role=switch],[role=tab],[role=radio]'),
          hasKeyHandler: r.hasAttribute('onkeydown') || r.hasAttribute('onkeyup') || r.hasAttribute('onkeypress'),
          isFormField: formTags.includes(tag) || formRoles.includes(roleAttr),
          isImage: tag === 'img' || tag === 'svg' || tag === 'canvas' || roleAttr === 'img',
          iframeSrc: (tag === 'iframe' || tag === 'frame') ? (r.getAttribute('src') || '') : undefined, // 4.1.2 (4b1c6c): same-name iframe purpose-equivalence (parity with act-page-collect)
          removedFromA11yTree, hiddenMechanism, ariaHiddenWithName, decorativeConflict, renderedVisible, nearbyText, svgLiveText, // Tier-0 #5 (e88epe) + S3 (R3) + S7 (R7)
          complexImageHint, // Item 7b: gate long-description-completeness to data-bearing images
          hasGlyphText, splitFieldGroup, // C8 small-signal applicability predicates (glyph-text-alternative / multipart-field-grouping)
          underOverlay, hasHoverContent, // Item 9: un-dead 2.4.11 focus-not-obscured + 1.4.13 content-on-hover
          liveRegion, // Item 11: 4.1.3 status-message family
          isMedia, mediaInfo, // Item 10: 1.2.x media family
          autoMotion, // Item 14d: 2.2.2 motion-control family
          autoUpdatingContent, // #9 fix: 4.1.2 auto-update-notification family
          backgroundImageMeaningful, backgroundImageUrl, isCaptcha, // TT gaps G2/G3 (1.1.1)
          // 2.1.2 focus-trap risk (coverage audit) — parity with act-page-collect so the widened gate fires on real pages too.
          focusRisk: r.hasAttribute('onblur') || r.hasAttribute('onfocus') || r.hasAttribute('onfocusout')
            || !!r.closest('[role=dialog],dialog,[aria-modal=true],[role=menu],[role=listbox],[role=grid],[role=tablist],[class*=modal i],[class*=overlay i],[class*=dialog i],[class*=popup i],[class*=lightbox i]'),
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
          // coverage #23/#14: the element's OWN event listeners. Pointer-activation handlers added via
          // addEventListener are invisible to the static DOM snapshot (which only sees inline on* attrs),
          // so a keyboard-orphan (a div wired clickable by JS) cannot be seen without this. DOMDebugger
          // needs the runtime objectId; best-effort (catch ⇒ field simply absent, never a false negative).
          try {
            const elr = await cdp.send('DOMDebugger.getEventListeners', { objectId: ev.result.objectId, depth: 0 });
            const types = [...new Set((elr.listeners || []).map(l => String(l.type)))];
            rec.listenerTypes = types;
            rec.pointerActivationListener = types.some(t => ['click', 'mousedown', 'mouseup', 'pointerdown', 'pointerup', 'dblclick'].includes(t));
            rec.keyListener = types.some(t => ['keydown', 'keyup', 'keypress'].includes(t));
          } catch (e) { /* getEventListeners unavailable for this node — leave the listener fields unset */ }
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
              rec.axName = A.coerceAxName(ax.name && ax.name.value); // '' (resolved-empty) vs null (unresolved) — see coerceAxName / review #43
              // T12: a video/audio that can't load offline yields the browser's
              // fallback string as the AX name — flag it as NOT author-supplied.
              if (A.isMediaErrorName(rec.axName)) { rec.mediaErrorName = true; rec.axNameAuthorSupplied = false; }
              rec.inTree = !ax.ignored;
              rec.ignoredByModal = (ax.ignoredReasons || []).some(r => r && (r.name === 'activeModalDialog' || r.name === 'inertSubtree')); // #3 guard parity
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
