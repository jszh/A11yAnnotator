'use strict';
// Harness 3.2 §11 — vision evidence capture. Produces the `visionByXpath` map the adjudicator threads
// (exactly like `transcriptByXpath`): xpath -> { 'element-crop', 'surrounding-region', 'viewport',
// 'viewport-320' } as base64 PNGs. This captures the STATIC crops from a loaded page (the collector
// context); the orchestrator's runLlm path calls captureVisionForUrl and threads the result.
//
// STATE PAIRS (the driver→visionByXpath bridge): `captureStateVision` drives the per-element transition a
// dynamic-state rubric declares and screenshots the SAME clip in two states, emitting `state-before`/
// `state-after`. FOCUS (2.4.7 / 2.4.11) forces :focus AND :focus-visible via CDP (so a keyboard-only ring
// still shows — mirroring drive-page.js's forcedFocusRing); HOVER (1.4.13) uses a REAL pointer move (fires
// CSS :hover AND JS mouseenter, which CDP forcing does not) with a wider clip so a tooltip rendered beside/
// below the trigger is captured. SUBMIT (3.3.1 / 3.3.3, Harness 3.3 D) fills the field invalid and submits
// WITHOUT navigating (mirroring form-error-probe), capturing the form region before/after so the error
// rubrics can read the surfaced message — the after-clip UNIONS the grown form so a message appended on
// submit is in-frame. Invalid submit mutates page state irreversibly, so each form subject is isolated on a
// fresh reload. `captureVisionForUrl` folds the pairs into the static map via `mergeVision` in ONE page
// load, so `runAdjudication` stays pure over `visionByXpath`.

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const { nsXPath } = require('./xpath-ns.js'); // namespace-agnostic resolve (Tier-0 #1) — fixes SVG/MathML subjects

// #10 fix: every `document.evaluate(x, document, ...)` call site in this file used the TOP-LEVEL `document`
// only — but act-page-collect.js namespaces an in-frame subject's xpath as `<frameXpath>>/<in-frame xpath>`
// (see its xpathOfInDoc/frame-traversal comments). A plain document.evaluate on a '>>'-bearing string throws
// an invalid-XPath-expression SyntaxError, silently swallowed by this file's blanket `.catch(() => {})`/
// `.catch(() => null)` wrappers — so every in-frame element got ZERO vision evidence (no element-crop, no
// surrounding-region), which then hit the adjudicator's required-evidence gate and abstained with NO verdict
// at all. Confirmed live on the DHS Trusted-Tester corpus: 3+ frameset-page cases (1.3.1 fields inside
// frame-main.html, 1.4.5 image-of-text inside an iframe) minted auto-PARTIAL obligations that never got a
// single rubric verdict. Mirrors the SAME resolver already proven in act-page-collect.js's resolveAx and
// cdp-tools.js's queryAxNode (split on '>>', descend same-origin contentDocument between segments, retry each
// segment with the local-name() SVG/MathML fallback) — injected once per page as `window.__v3ResolveXpath` so
// every one of this file's ~10 call sites can swap `document.evaluate(x, document, null, 9, null)
// .singleNodeValue` for `window.__v3ResolveXpath(x)` without duplicating the resolver ten times.
function installXpathResolver() {
  var nsFallback = function (s) {
    return s.split('/').map(function (p) {
      var m = p.match(/^([a-zA-Z][\w-]*)(\[[0-9]+\])?$/);
      return m ? '*[local-name()="' + m[1] + '"]' + (m[2] || '') : p;
    }).join('/');
  };
  var evalStep = function (doc, step) {
    var n = null;
    try { n = doc.evaluate(step, doc, null, 9, null).singleNodeValue; } catch (e) { n = null; }
    if (!n) { try { n = doc.evaluate(nsFallback(step), doc, null, 9, null).singleNodeValue; } catch (e) { n = null; } }
    return n;
  };
  window.__v3ResolveXpath = function (xpath) {
    var parts = xpath.split('>>');
    var doc = document, node = null;
    for (var i = 0; i < parts.length; i++) {
      if (!doc) return null;
      var n = evalStep(doc, parts[i]);
      if (!n) return null;
      node = n;
      if (i < parts.length - 1) { try { doc = node.contentDocument; } catch (e) { return null; } }
    }
    return node;
  };
  // #10b fix: an in-frame node's own getBoundingClientRect() is relative to ITS OWN document's viewport, NOT
  // the top-level page — so a naive rect straight off the resolved element clips the screenshot at the WRONG
  // coordinates (confirmed live: after #10's resolver fix alone, an in-frame button resolved successfully but
  // still produced zero element-crop/surrounding-region — the probe's inView check failed on garbage coords).
  // Re-walk the SAME '>>' chain, but at each frame BOUNDARY read the <frame>/<iframe> element's OWN rect
  // (measured in ITS PARENT's coordinate space, i.e. before descending into contentDocument) and accumulate —
  // summing consecutive frame-element offsets gives the final element's TOP-PAGE-relative position. Returns
  // null on any unresolvable segment (mirrors __v3ResolveXpath's fail-closed shape).
  // #10e fix: visibility:hidden/opacity:0/display:none set on an ANCESTOR (not the element itself) does not
  // change the element's OWN getComputedStyle() — CSS opacity/visibility do not report as "inherited" on a
  // child's computed style even though they visually suppress it (a whole subtree renders transparent/hidden).
  // The pre-#10e check (`getComputedStyle(el).opacity === 0`) missed this entirely, so an element inside a
  // hidden ancestor kept its real layout box and an in-viewport crop was taken of it — but since it paints
  // NOTHING, the screenshot shows whatever is UNDERNEATH (a differently-stacked sibling), not a blank/absent
  // result. Confirmed live: a Bootstrap-style crossfade carousel (`.slide{opacity:0} .slide.showing{opacity:1}`,
  // all slides absolutely stacked at the SAME position) — the inactive <li class="slide"> (opacity:0 on the
  // LIST ITEM, not the <img> inside it) let its <img alt="Wuthering Heights"> probe as visible with a real
  // box, and the resulting crop showed the ACTIVE slide's "Nineteen Eighty-Four" cover instead (same screen
  // region, different z-index layer). Walk from `el` to the document root checking EACH ancestor.
  var effectivelyVisible = function (el) {
    for (var a = el; a; a = a.parentElement) {
      var cs = getComputedStyle(a);
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.visibility === 'collapse' || parseFloat(cs.opacity) === 0) return false;
    }
    return true;
  };
  window.__v3EffectivelyVisible = effectivelyVisible;
  window.__v3ResolveXpathBox = function (xpath) {
    var parts = xpath.split('>>');
    var doc = document, node = null, offsetX = 0, offsetY = 0;
    for (var i = 0; i < parts.length; i++) {
      if (!doc) return null;
      var n = evalStep(doc, parts[i]);
      if (!n) return null;
      node = n;
      if (i < parts.length - 1) {
        var fr = n.getBoundingClientRect();
        offsetX += fr.left; offsetY += fr.top;
        try { doc = n.contentDocument; } catch (e) { return null; }
      }
    }
    if (!node || !node.getBoundingClientRect) return null;
    var r = node.getBoundingClientRect();
    return { left: r.left + offsetX, top: r.top + offsetY, width: r.width, height: r.height };
  };
  // the offset alone, reusable for a RELATED element in the same document as xpath's target (e.g. `.closest('form')`,
  // which lives in the identical frame but isn't itself reachable by re-resolving `xpath`).
  window.__v3FrameOffset = function (xpath) {
    var parts = xpath.split('>>');
    var doc = document, offsetX = 0, offsetY = 0;
    for (var i = 0; i < parts.length - 1; i++) {
      var n = evalStep(doc, parts[i]);
      if (!n) return { x: 0, y: 0 };
      var fr = n.getBoundingClientRect();
      offsetX += fr.left; offsetY += fr.top;
      try { doc = n.contentDocument; } catch (e) { return { x: 0, y: 0 }; }
    }
    return { x: offsetX, y: offsetY };
  };
}
// try/catch, not .catch() — a page mock lacking .evaluate (unit tests exercising ONLY the setViewport path)
// throws SYNCHRONOUSLY (`TypeError: page.evaluate is not a function`), which .catch() cannot intercept.
async function safeInstallResolver(page) { try { await page.evaluate(installXpathResolver); } catch (e) {} }

// SC → the per-element transition whose before/after a rubric for that SC needs. Exported so the
// orchestrator + a pure test share it. Form SCs drive a 'submit' (page-mutating ⇒ reload-isolated).
const STATE_TRANSITIONS = Object.freeze({ '2.4.7': 'focus', '2.4.11': 'focus', '1.4.13': 'hover', '3.3.1': 'submit', '3.3.3': 'submit' });

// Build the xpath -> transition plan from LLM subjects (first transition per xpath wins; deduped).
function buildStatePlan(subjects) {
  const plan = {};
  for (const s of subjects || []) { const t = s && STATE_TRANSITIONS[s.sc]; if (t && s.xpath && !plan[s.xpath]) plan[s.xpath] = t; }
  return plan;
}

// Capture the declared static crops for a set of element xpaths. opts: { states[], pad=24 }.
async function captureVision(page, xpaths, opts = {}) {
  await safeInstallResolver(page); // #10 fix: idempotent per-page setup for frame-qualified xpaths
  const want = new Set(opts.states || ['element-crop', 'surrounding-region', 'viewport', 'viewport-320']);
  const pad = Number.isFinite(opts.pad) ? opts.pad : 24;
  const shot = (clip) => require('./settle.js').robustScreenshot(page, clip ? { clip, encoding: 'base64' } : { encoding: 'base64' }); // retry-on-null under contention
  const out = {};

  // page-wide viewport crops are shared across all elements — capture once.
  let viewport = null, viewport320 = null;
  if (want.has('viewport')) viewport = await shot(null);
  if (want.has('viewport-320')) {
    // `page.viewport()` is null under defaultViewport:null (a real browser window). Measure the live size
    // so we ALWAYS restore — otherwise the page is left at 320px and EVERY later crop is silently corrupted.
    const orig = page.viewport();
    const cur = orig || await page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight })).catch(() => null);
    // #7b fix: a SECOND unguarded setViewport, structurally identical to captureVisionForUrl's #7 fix — this one
    // is even more dangerous because `want` DEFAULTS to ALL FOUR states (orchestrator.js never passes opts.states),
    // so this 320px resize runs on EVERY page's vision capture regardless of whether any subject on it actually
    // declared viewport-320 evidence. A throw here under tab contention still propagated out of captureVision ⇒
    // captureVisionForUrl ⇒ orchestrator's top-level .catch(() => ({})) — the exact whole-page vision collapse
    // #7 was built to prevent, just from a different call site. Confirmed live: a real DHS page (1.4.5
    // image-of-text, 402180-16) still showed 12 minted obligations / vision-stage timing / zero rubric verdicts
    // after #7 shipped — consistent with THIS call throwing instead. Retry once, then degrade to no 320p crop
    // (viewport320 stays null) rather than losing every OTHER element's element-crop/surrounding-region too.
    let resized = false;
    try { await page.setViewport({ width: 320, height: (cur && cur.height) || 800 }); resized = true; }
    catch (e) {
      await new Promise((r) => setTimeout(r, 200));
      try { await page.setViewport({ width: 320, height: (cur && cur.height) || 800 }); resized = true; } catch (e2) { resized = false; }
    }
    try {
      if (resized) { await require('./settle.js').awaitSettle(page); viewport320 = await shot(null); }
    } finally { if (cur && cur.width) await page.setViewport(cur).catch(() => {}); }
  }

  for (const xpRaw of xpaths) {
    const xp = nsXPath(xpRaw); // SVG/MathML-aware xpath for in-page document.evaluate; xpRaw stays the output key
    // scroll the target into view first — on a real page most sampled elements are BELOW THE FOLD, so
    // without this their element-crop is skipped (off-viewport) and the LLM gets no pixels (probe finding
    // on the corpus). scrollIntoView centres it; getBoundingClientRect is then viewport-relative and clips.
    await page.evaluate((x) => { const el = window.__v3ResolveXpath(x); if (el && el.scrollIntoView) try { el.scrollIntoView({ block: 'center', inline: 'center' }); } catch (e) { el.scrollIntoView(); } }, xp).catch(() => {});
    await require('./settle.js').awaitSettle(page); // gated V3_SETTLE_WAIT — settle the post-scroll reflow/repaint before the crop
    // probe returns { box } (box=null ⇒ the probe RAN and the element has no perceivable visual box); a THROW ⇒
    // .catch ⇒ null (the probe itself failed — a transient, NOT "non-visual"). This distinction lets the rubric gate
    // judge a genuinely-non-visual element text-only instead of silently abstaining (off-screen sr-only controls).
    const probe = await page.evaluate((x) => {
      const el = window.__v3ResolveXpath(x);
      if (!el || !el.getBoundingClientRect) return { box: null };
      // an AT-imperceivable element (visibility:hidden / opacity:0, on the element OR an ancestor — #10e fix)
      // keeps a layout box but a crop of it is either blank or shows whatever renders BEHIND it — a misleading
      // signal to the agent either way. Skip it (adversarial).
      if (!window.__v3EffectivelyVisible(el)) return { box: null };
      // #10b fix: TOP-PAGE-relative coords (not the element's own in-frame-local rect) via __v3ResolveXpathBox —
      // a plain el.getBoundingClientRect() here silently mis-clips (or entirely misses) an in-frame element.
      const r = window.__v3ResolveXpathBox(x);
      if (!r) return { box: null };
      // a DEGENERATE box (either dim < 6px — a collapsed layout artifact or a hairline element) yields a
      // near-blank crop that misleads the agent (corpus probe: Domino's 5x5, Amazon's 200x2 link). Skip
      // it — a <6px element is not a meaningful visual target anyway.
      if (!(r.width >= 6) || !(r.height >= 6)) return { box: null };
      return { box: { x: r.left, y: r.top, w: r.width, h: r.height, vw: window.innerWidth, vh: window.innerHeight, scrollX: window.scrollX, scrollY: window.scrollY } };
    }, xp).catch(() => null);
    const rect = probe && probe.box;
    const frames = {};
    let inView = false;
    if (rect) {
      // #10d fix: `page.screenshot({clip})` (CDP `Page.captureScreenshot`) takes DOCUMENT-relative coordinates,
      // but `getBoundingClientRect()` (via __v3ResolveXpathBox) is VIEWPORT-relative — the two are IDENTICAL
      // only when scrollY/scrollX are 0. Every below-the-fold element (the common case: scrollIntoView is
      // called specifically BECAUSE most sampled elements start off-screen) leaves the page scrolled, so the
      // clip silently captured the WRONG on-screen region — confirmed live on a real DHS Trusted-Tester page
      // (a 3-item book carousel, scrollY:323 after centering the target): the crop for an <img alt="The
      // Giving Three"> element showed a COMPLETELY DIFFERENT, unrelated carousel banner ("Nineteen Eighty-
      // Four") rendered at the SAME viewport-relative coordinates the target had used pre-scroll, near
      // document y:190 vs the target's real document y:628 — while `getBoundingClientRect()`, `elementFromPoint`,
      // and Puppeteer's own `ElementHandle.screenshot()` all agreed the DOM/layout were entirely correct. This
      // was NOT a rendering-timing race (reproduced deterministically, unaffected by an explicit settle floor)
      // — it was a coordinate-space mismatch. Clamp fully in VIEWPORT space (unaffected — clamping is about
      // what's currently visible on screen) but add the scroll offset ONLY when building the final clip handed
      // to `shot()`.
      const clip = (p) => {
        const x = Math.max(0, Math.min(rect.x - p, rect.vw - 1));
        const y = Math.max(0, Math.min(rect.y - p, rect.vh - 1));
        const width = Math.max(1, Math.min(rect.w + 2 * p, rect.vw - x));
        const height = Math.max(1, Math.min(rect.h + 2 * p, rect.vh - y));
        return { x: x + rect.scrollX, y: y + rect.scrollY, width, height };
      };
      inView = rect.x < rect.vw && rect.y < rect.vh && rect.x + rect.w > 0 && rect.y + rect.h > 0;
      if (inView && want.has('element-crop')) frames['element-crop'] = await shot(clip(2));
      if (inView && want.has('surrounding-region')) frames['surrounding-region'] = await shot(clip(pad));
    }
    if (viewport && want.has('viewport')) frames['viewport'] = viewport;
    if (viewport320 && want.has('viewport-320')) frames['viewport-320'] = viewport320;
    // NON-VISUAL: the probe RAN (probe != null) and the element has no perceivable box OR sits off-screen (no inView) —
    // its element-crop legitimately cannot exist. Flagged as a STRING so it survives mergeVision's string-only filter
    // and is never mistaken for a declared crop (it is not a vision state). probe===null (probe failed) is NOT flagged.
    const nonVisual = probe != null && (!rect || !inView);
    const clean = {};
    for (const [k, v] of Object.entries(frames)) if (typeof v === 'string' && v.length) clean[k] = v;
    if (nonVisual) clean.__nonVisual = '1';
    if (Object.keys(clean).length) out[xpRaw] = clean;
  }
  return out;
}

// Merge driver-captured state pairs (xpath -> { 'state-before', 'state-after' }) into a visionByXpath map.
function mergeVision(base, ...more) {
  const out = {};
  for (const src of [base, ...more]) {
    if (!src || typeof src !== 'object' || Array.isArray(src)) continue; // ignore non-map inputs (arrays → junk numeric keys)
    for (const [xp, frames] of Object.entries(src)) {
      out[xp] = out[xp] || {};
      for (const [state, data] of Object.entries(frames || {})) if (typeof data === 'string' && data.length) out[xp][state] = data;
    }
  }
  return out;
}

// Drive a per-element transition and capture its state-before/after PAIR. `plan` maps xpath -> 'focus' |
// 'hover'. Screenshots the SAME clip in both states so the diff is honest. Mirrors captureVision's
// visibility / min-dim / in-viewport guards; emits a frame map ONLY when BOTH shots exist (the rubric needs
// the pair). Page state is mutated (focus/hover) so this must run AFTER the static crops on a given page.
async function captureStateVision(page, plan, opts = {}) {
  const entries = Object.entries(plan || {});
  if (!entries.length) return {};
  await safeInstallResolver(page); // #10 fix: idempotent per-page setup for frame-qualified xpaths
  const out = {};
  let cdp = null;
  try { cdp = await page.createCDPSession(); await cdp.send('DOM.enable'); await cdp.send('CSS.enable'); } catch (e) { cdp = null; }
  const shot = (clip) => require('./settle.js').robustScreenshot(page, { clip, encoding: 'base64' }); // retry-on-null under contention
  const str = (s) => typeof s === 'string' && s.length > 0;
  // park the pointer FAR off-viewport (proven idle): (0,0) is a real hittable coordinate, so a prior hover
  // iteration that ended there could leave a fixed top-left element :hover and pollute the NEXT subject's
  // before-frame (adversarial finding). 10000,10000 is outside any viewport ⇒ nothing is :hover.
  const parkPointer = () => page.mouse.move(10000, 10000).catch(() => {});
  // #10d fix: same document-vs-viewport coordinate-space bug as captureVision (see its clip() comment) — CDP's
  // Page.captureScreenshot clip is DOCUMENT-relative, getBoundingClientRect is VIEWPORT-relative. All the clip
  // math below stays in viewport space (clamping against rc.vw/vh is legitimately about on-screen visibility);
  // `rc.scrollX`/`rc.scrollY` (present on every rect this function receives) are added ONLY at the final return.
  const clampClip = (rc, pad) => {
    const x0 = Math.max(0, Math.min(rc.x - pad, rc.vw - 1));
    const y0 = Math.max(0, Math.min(rc.y - pad, rc.vh - 1));
    const width = Math.max(1, Math.min(rc.w + 2 * pad, rc.vw - x0));
    const height = Math.max(1, Math.min(rc.h + 2 * pad, rc.vh - y0));
    return { x: x0 + (rc.scrollX || 0), y: y0 + (rc.scrollY || 0), width, height };
  };
  // a hover clip that actually CONTAINS the reveal: trigger ∪ measured revealed-node bbox (clamped), since a
  // fixed pad misses a tooltip/menu rendered far from the trigger (adversarial finding → false abstain).
  const unionClip = (rc, reveal, pad) => {
    if (!reveal) return clampClip(rc, pad);
    const x0 = Math.max(0, Math.min(rc.x, reveal.x0) - 8);
    const y0 = Math.max(0, Math.min(rc.y, reveal.y0) - 8);
    const x1 = Math.min(rc.vw, Math.max(rc.x + rc.w, reveal.x1) + 8);
    const y1 = Math.min(rc.vh, Math.max(rc.y + rc.h, reveal.y1) + 8);
    if (!(x1 > x0 && y1 > y0)) return clampClip(rc, pad);
    return { x: x0 + (rc.scrollX || 0), y: y0 + (rc.scrollY || 0), width: x1 - x0, height: y1 - y0 };
  };
  // resolve an xpath -> CDP nodeId (DOM.performSearch accepts XPath) for forcePseudoState (drive-page.js T1/T8).
  const nodeIdFor = async (xp) => {
    if (!cdp) return null;
    try {
      await cdp.send('DOM.getDocument', { depth: -1 });
      const sr = await cdp.send('DOM.performSearch', { query: xp });
      if (!sr || !sr.resultCount) return null;
      const r = await cdp.send('DOM.getSearchResults', { searchId: sr.searchId, fromIndex: 0, toIndex: 1 });
      return (r && r.nodeIds && r.nodeIds[0]) || null;
    } catch (e) { return null; }
  };
  const hoverSettle = Number.isFinite(opts.hoverSettleMs) ? opts.hoverSettleMs : 300; // ≥ a typical show-delay, < a typical auto-hide
  // SUBMIT (3.3.1 / 3.3.3, Harness 3.3 D): the form-region before/after around a real invalid submit. The
  // after-clip UNIONS the before-form-rect with the after-form-rect (the form grows when an error renders),
  // measured in the SAME scroll frame so the union is valid. Invalid submit is irreversible, so each form
  // subject runs on a fresh reload (focus/hover pairs are already captured + stored in `out`).
  const scrollFormIntoView = (xp) => page.evaluate((x) => { const el = window.__v3ResolveXpath(x); const form = el && el.closest && el.closest('form'); if (form && form.scrollIntoView) { try { form.scrollIntoView({ block: 'center', inline: 'center' }); } catch (e) { form.scrollIntoView(); } } }, xp).catch(() => {});
  const measureForm = (xp) => page.evaluate((x) => {
    const el = window.__v3ResolveXpath(x);
    const form = el && el.closest && el.closest('form');
    if (!form) return null;
    const cs = getComputedStyle(form); if (cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return null;
    const r = form.getBoundingClientRect();
    if (!(r.width >= 6) || !(r.height >= 6)) return null;
    // #10b fix: `form` is reached via `.closest()` on the resolved element, not by re-resolving the xpath, so
    // __v3ResolveXpathBox can't be reused directly — apply the SAME frame-chain offset (form lives in the same
    // document as `el`) on top of its own local rect.
    const off = window.__v3FrameOffset(x);
    return { x: r.left + off.x, y: r.top + off.y, w: r.width, h: r.height, vw: window.innerWidth, vh: window.innerHeight, scrollX: window.scrollX, scrollY: window.scrollY };
  }, xp).catch(() => null);
  const driveInvalidSubmit = (xp) => page.evaluate((x) => {
    const el = window.__v3ResolveXpath(x); if (!el) return false;
    const form = el.closest('form'); if (!form) return false;
    const type = (el.getAttribute('type') || '').toLowerCase();
    const required = el.required === true || el.getAttribute('aria-required') === 'true';
    if ('value' in el) { el.value = required ? '' : /^(email|url)$/.test(type) ? 'x' : /number/.test(type) ? 'abc' : ''; for (const ev of ['input', 'change', 'blur']) el.dispatchEvent(new Event(ev, { bubbles: true })); }
    const onSubmit = (e) => e.preventDefault();                          // never navigate — the page's own handler shows errors
    form.addEventListener('submit', onSubmit, true);
    try { const btn = form.querySelector('button[type="submit"],input[type="submit"],button:not([type])'); if (btn) btn.click(); else if (form.requestSubmit) form.requestSubmit(); else form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); } catch (e) {}
    form.removeEventListener('submit', onSubmit, true);
    return true;
  }, xp).catch(() => false);
  // union the before- and after-form rects (same scroll frame), padded + clamped — contains the message
  // wherever it rendered (above for a GOV.UK summary, below for an inline error).
  const unionFormClip = (r0, r1, pad) => {
    const x0 = Math.max(0, Math.min(r0.x, r1 ? r1.x : r0.x) - pad);
    const y0 = Math.max(0, Math.min(r0.y, r1 ? r1.y : r0.y) - pad);
    const x1 = Math.min(r0.vw, Math.max(r0.x + r0.w, r1 ? r1.x + r1.w : 0) + pad);
    const y1 = Math.min(r0.vh, Math.max(r0.y + r0.h, r1 ? r1.y + r1.h : 0) + pad);
    if (!(x1 > x0 && y1 > y0)) return clampClip(r0, pad);
    // #10d fix: document-relative (see clampClip) — r0/r1 are the SAME scroll frame (captureSubmitPair never
    // re-scrolls between them), so either's scrollX/scrollY is authoritative.
    return { x: x0 + (r0.scrollX || 0), y: y0 + (r0.scrollY || 0), width: x1 - x0, height: y1 - y0 };
  };
  const captureSubmitPair = async (xp) => {
    try { await page.reload({ waitUntil: 'load', timeout: opts.gotoTimeoutMs || 30000 }); } catch (e) {}
    // #10 fix: a navigation wipes the page's JS context, so window.__v3ResolveXpath/__v3FrameOffset (installed
    // ONCE at the top of captureStateVision) no longer exist post-reload — every window.__v3* call below would
    // throw (undefined is not a function), silently degrading to a null pair via the blanket .catch(() => null).
    await safeInstallResolver(page);
    await require('./settle.js').awaitSettle(page); // gated V3_SETTLE_WAIT
    await parkPointer();
    await scrollFormIntoView(xp);
    const r0 = await measureForm(xp); if (!r0) return null;
    const inView = r0.x < r0.vw && r0.y < r0.vh && r0.x + r0.w > 0 && r0.y + r0.h > 0; if (!inView) return null;
    const pad = Number.isFinite(opts.submitPad) ? opts.submitPad : 20;
    const before = await shot(clampClip(r0, pad)); if (!str(before)) return null;
    if (!(await driveInvalidSubmit(xp))) return null;
    await sleep(Number.isFinite(opts.submitSettleMs) ? opts.submitSettleMs : 150);
    const r1 = await measureForm(xp);                                   // SAME scroll frame (no re-scroll) ⇒ union is valid
    const after = await shot(unionFormClip(r0, r1, pad)); if (!str(after)) return null;
    return { 'state-before': before, 'state-after': after };
  };
  for (const [xpRaw, transition] of entries) {
    const xp = nsXPath(xpRaw); // SVG/MathML-aware xpath for the in-page resolves below; xpRaw stays the key
    if (transition === 'submit') { const pair = await captureSubmitPair(xp); if (pair) out[xpRaw] = pair; continue; }
    await parkPointer(); // RESET to a guaranteed-idle pointer BEFORE the before-frame (kills cross-subject hover leak)
    // a true IDLE before-state: blur whatever is focused, then bring the target into view.
    await page.evaluate((x) => { try { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); } catch (e) {} const el = window.__v3ResolveXpath(x); if (el && el.scrollIntoView) { try { el.scrollIntoView({ block: 'center', inline: 'center' }); } catch (e) { el.scrollIntoView(); } } }, xp).catch(() => {});
    const rect = await page.evaluate((x) => {
      const el = window.__v3ResolveXpath(x);
      if (!el || !el.getBoundingClientRect) return null;
      if (!window.__v3EffectivelyVisible(el)) return null; // #10e fix: ancestor-cascaded opacity:0/hidden — see captureVision's probe
      // #10b fix: top-page-relative coords — cx/cy feed a REAL page.mouse.move() below, which is meaningless
      // (or hits the wrong element) if computed from an in-frame-local rect.
      const r = window.__v3ResolveXpathBox(x);
      if (!r) return null;
      if (!(r.width >= 6) || !(r.height >= 6)) return null;
      // cx/cy stay VIEWPORT-relative (they feed a real page.mouse.move() below, which is a screen/input coordinate,
      // NOT a page.screenshot clip) — only x/y grow a scrollX/scrollY tag, consumed by clampClip/unionClip (#10d fix).
      return { x: r.left, y: r.top, w: r.width, h: r.height, vw: window.innerWidth, vh: window.innerHeight, scrollX: window.scrollX, scrollY: window.scrollY, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
    }, xp).catch(() => null);
    if (!rect) continue;
    const inView = rect.x < rect.vw && rect.y < rect.vh && rect.x + rect.w > 0 && rect.y + rect.h > 0;
    if (!inView) continue;
    const pad = transition === 'hover' ? (Number.isFinite(opts.hoverPad) ? opts.hoverPad : 96) : (Number.isFinite(opts.statePad) ? opts.statePad : 16);
    let before = null, after = null, focusPersisted = null; // #4 fix: null unless transition==='focus' actually checked it
    if (transition === 'focus') {
      const clip = clampClip(rect, pad); // a focus ring hugs the element
      before = await shot(clip);
      if (!str(before)) continue;
      await page.evaluate((x) => { const el = window.__v3ResolveXpath(x); if (el && el.focus) { try { el.focus({ preventScroll: true }); } catch (e) { try { el.focus(); } catch (_) {} } } }, xp).catch(() => {});
      // #4 fix: CONFIRM real focus actually PERSISTED before manufacturing a "focused" render. A synchronous
      // focus-stripping handler (onfocus="this.blur()", a scripted focus trap that redirects elsewhere, etc.)
      // reverts document.activeElement before we ever reach here — forcing the focus/focus-visible pseudo-state
      // regardless would fabricate a screenshot no real keyboard user would ever see (the DHS Trusted-Tester
      // 546353-13 miss: the rubric judged honestly, but on falsified evidence). Only force the pseudo-state —
      // needed because :focus-visible's own browser heuristic may not qualify a script-driven .focus() call even
      // when focus legitimately sticks — when persistence is CONFIRMED; otherwise capture the TRUE render, which
      // correctly shows no focus styling when none would ever appear to a real user.
      // #10b fix: `document.activeElement` is the TOP document's own active element — for an in-frame target
      // it would be the <frame>/<iframe> host element, never `el` itself, so this would ALWAYS report false
      // for an in-frame focus target. `el.ownerDocument` is the element's OWN document (its frame's document
      // for an in-frame node, the top document otherwise) — check activeElement against THAT.
      focusPersisted = await page.evaluate((x) => { const el = window.__v3ResolveXpath(x); return !!el && el.ownerDocument && el.ownerDocument.activeElement === el; }, xp).catch(() => false);
      const nodeId = await nodeIdFor(xpRaw); // CDP DOM.performSearch path — unchanged (uses the raw collector xpath)
      let forced = false;
      if (focusPersisted && nodeId) { try { await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['focus', 'focus-visible'] }); forced = true; } catch (e) {} }
      await sleep(60);
      after = await shot(clip);
      if (forced) { try { await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] }); } catch (e) {} }
      await page.evaluate(() => { try { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); } catch (e) {} }).catch(() => {});
    } else if (transition === 'hover') {
      // PROBE: hover, MEASURE where the reveal actually rendered, then un-hover — so before/after share a clip
      // that CONTAINS the revealed content wherever it sits (a fixed pad misses a far tooltip/menu).
      try { await page.mouse.move(rect.cx, rect.cy); } catch (e) {}
      await sleep(hoverSettle);
      const reveal = await page.evaluate((x) => {
        const trig = window.__v3ResolveXpath(x);
        if (!trig) return null;
        const cands = new Set();
        for (const a of ['aria-describedby', 'aria-controls', 'popovertarget']) for (const id of (trig.getAttribute(a) || '').split(/\s+/)) { if (id) { const e = document.getElementById(id); if (e) cands.add(e); } }
        for (const e of document.querySelectorAll('[role=tooltip],[popover],[role=menu],[role=listbox]')) cands.add(e);
        const vis = (e) => { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0 && r.top < window.innerHeight && r.left < window.innerWidth; };
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, found = false;
        for (const e of cands) { if (!vis(e)) continue; const r = e.getBoundingClientRect(); x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom); found = true; }
        return found ? { x0, y0, x1, y1 } : null;
      }, xp).catch(() => null);
      await parkPointer(); await sleep(30); // back to idle for an honest before-frame
      const clip = unionClip(rect, reveal, pad);
      before = await shot(clip);
      if (!str(before)) continue;
      try { await page.mouse.move(rect.cx, rect.cy); } catch (e) {}
      await sleep(hoverSettle);
      after = await shot(clip);
      await parkPointer();
    }
    // #4 fix: surface focusPersisted (transition==='focus' only; null shape elsewhere, unchanged) so a downstream
    // consumer can distinguish "no visible change because focus never stuck" from an ordinary weak-but-real ring.
    if (str(after)) out[xpRaw] = { 'state-before': before, 'state-after': after, ...(focusPersisted === null ? {} : { focusPersisted }) };
  }
  try { if (cdp) await cdp.detach(); } catch (e) {}
  return out;
}

// Launch a fresh browser, load `url`, and capture vision for `xpaths` — the production entry point the
// orchestrator/CLI calls so the adjudicator stays a pure function over `visionByXpath` (audit D11-1). When
// `opts.statePlan` (xpath -> transition) is given, also drives those transitions and folds the resulting
// state pairs into the static map — ONE page load for both (audit #1: the state-pair bridge).
async function captureVisionForUrl(url, xpaths, opts = {}) {
  // shares the run's ONE browser pool (opts.tabAllocator / opts.browser) when given; else launches its own.
  // Acquire-before-work ⇒ a queued tab's wait is NOT charged to the goto/capture deadlines (timer-pause).
  const { withLanePage } = require('./page-lease.js');
  return withLanePage(opts, async (page) => {
    // #7 fix: setViewport sends a raw CDP command and can throw ("Target closed"/"Protocol error") under real
    // concurrent-tab pressure (memory contention, a tab-allocator reap racing this lease) — the ONE unguarded call
    // in this function, unlike every other await here (goto/settle/screenshot all degrade to null/{} on failure).
    // Before this fix, that single throw propagated out of captureVisionForUrl entirely, and orchestrator.js's
    // top-level `.catch(() => ({}))` silently collapsed vision to EMPTY for the WHOLE page — every vision-requiring
    // rubric subject on that page then hit the required-evidence gate and abstained with ZERO LLM calls attempted,
    // not just this one setViewport call (confirmed: real 12/17/13-obligation pages went to 0 verdicts as a single
    // atomic failure, and reducing page-concurrency — less tab contention — made it disappear). Retry once (a
    // transient target hiccup often clears), then degrade to a best-effort continue rather than aborting the whole
    // page's vision — a wrong/default viewport still lets goto/screenshot produce SOMETHING for most elements,
    // which is strictly better than zero for every element.
    try {
      await page.setViewport({ width: opts.width || 1280, height: opts.height || 900 });
    } catch (e) {
      await new Promise((r) => setTimeout(r, 200));
      await page.setViewport({ width: opts.width || 1280, height: opts.height || 900 }).catch(() => {});
    }
    await page.goto(url, { waitUntil: 'load', timeout: opts.gotoTimeoutMs || 30000 }).catch(() => {});
    await require('./settle.js').awaitSettle(page); // gated V3_SETTLE_WAIT — settle fonts+layout before any screenshot
    const stat = await captureVision(page, xpaths, opts);          // static crops first (no page mutation)
    const pairs = opts.statePlan ? await captureStateVision(page, opts.statePlan, opts) : {}; // then driven pairs
    return mergeVision(stat, pairs);
  });
}

module.exports = { captureVision, captureStateVision, captureVisionForUrl, mergeVision, buildStatePlan, STATE_TRANSITIONS };
