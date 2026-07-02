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
    await page.evaluate((x) => { const el = document.evaluate(x, document, null, 9, null).singleNodeValue; if (el && el.scrollIntoView) try { el.scrollIntoView({ block: 'center', inline: 'center' }); } catch (e) { el.scrollIntoView(); } }, xp).catch(() => {});
    await require('./settle.js').awaitSettle(page); // gated V3_SETTLE_WAIT — settle the post-scroll reflow/repaint before the crop
    // probe returns { box } (box=null ⇒ the probe RAN and the element has no perceivable visual box); a THROW ⇒
    // .catch ⇒ null (the probe itself failed — a transient, NOT "non-visual"). This distinction lets the rubric gate
    // judge a genuinely-non-visual element text-only instead of silently abstaining (off-screen sr-only controls).
    const probe = await page.evaluate((x) => {
      const el = document.evaluate(x, document, null, 9, null).singleNodeValue;
      if (!el || !el.getBoundingClientRect) return { box: null };
      // an AT-imperceivable element (visibility:hidden / opacity:0) keeps a layout box but a crop of it is
      // a BLANK rectangle — a misleading "no visible content" signal to the agent. Skip it (adversarial).
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.visibility === 'collapse' || parseFloat(cs.opacity) === 0) return { box: null };
      const r = el.getBoundingClientRect();
      // a DEGENERATE box (either dim < 6px — a collapsed layout artifact or a hairline element) yields a
      // near-blank crop that misleads the agent (corpus probe: Domino's 5x5, Amazon's 200x2 link). Skip
      // it — a <6px element is not a meaningful visual target anyway.
      if (!(r.width >= 6) || !(r.height >= 6)) return { box: null };
      return { box: { x: r.left, y: r.top, w: r.width, h: r.height, vw: window.innerWidth, vh: window.innerHeight } };
    }, xp).catch(() => null);
    const rect = probe && probe.box;
    const frames = {};
    let inView = false;
    if (rect) {
      // clamp the clip fully inside the viewport (page.screenshot errors on an out-of-bounds clip).
      const clip = (p) => {
        const x = Math.max(0, Math.min(rect.x - p, rect.vw - 1));
        const y = Math.max(0, Math.min(rect.y - p, rect.vh - 1));
        return { x, y, width: Math.max(1, Math.min(rect.w + 2 * p, rect.vw - x)), height: Math.max(1, Math.min(rect.h + 2 * p, rect.vh - y)) };
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
  const out = {};
  let cdp = null;
  try { cdp = await page.createCDPSession(); await cdp.send('DOM.enable'); await cdp.send('CSS.enable'); } catch (e) { cdp = null; }
  const shot = (clip) => require('./settle.js').robustScreenshot(page, { clip, encoding: 'base64' }); // retry-on-null under contention
  const str = (s) => typeof s === 'string' && s.length > 0;
  // park the pointer FAR off-viewport (proven idle): (0,0) is a real hittable coordinate, so a prior hover
  // iteration that ended there could leave a fixed top-left element :hover and pollute the NEXT subject's
  // before-frame (adversarial finding). 10000,10000 is outside any viewport ⇒ nothing is :hover.
  const parkPointer = () => page.mouse.move(10000, 10000).catch(() => {});
  const clampClip = (rc, pad) => {
    const x0 = Math.max(0, Math.min(rc.x - pad, rc.vw - 1));
    const y0 = Math.max(0, Math.min(rc.y - pad, rc.vh - 1));
    return { x: x0, y: y0, width: Math.max(1, Math.min(rc.w + 2 * pad, rc.vw - x0)), height: Math.max(1, Math.min(rc.h + 2 * pad, rc.vh - y0)) };
  };
  // a hover clip that actually CONTAINS the reveal: trigger ∪ measured revealed-node bbox (clamped), since a
  // fixed pad misses a tooltip/menu rendered far from the trigger (adversarial finding → false abstain).
  const unionClip = (rc, reveal, pad) => {
    if (!reveal) return clampClip(rc, pad);
    const x0 = Math.max(0, Math.min(rc.x, reveal.x0) - 8);
    const y0 = Math.max(0, Math.min(rc.y, reveal.y0) - 8);
    const x1 = Math.min(rc.vw, Math.max(rc.x + rc.w, reveal.x1) + 8);
    const y1 = Math.min(rc.vh, Math.max(rc.y + rc.h, reveal.y1) + 8);
    return (x1 > x0 && y1 > y0) ? { x: x0, y: y0, width: x1 - x0, height: y1 - y0 } : clampClip(rc, pad);
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
  const scrollFormIntoView = (xp) => page.evaluate((x) => { const el = document.evaluate(x, document, null, 9, null).singleNodeValue; const form = el && el.closest && el.closest('form'); if (form && form.scrollIntoView) { try { form.scrollIntoView({ block: 'center', inline: 'center' }); } catch (e) { form.scrollIntoView(); } } }, xp).catch(() => {});
  const measureForm = (xp) => page.evaluate((x) => {
    const el = document.evaluate(x, document, null, 9, null).singleNodeValue;
    const form = el && el.closest && el.closest('form');
    if (!form) return null;
    const cs = getComputedStyle(form); if (cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return null;
    const r = form.getBoundingClientRect();
    if (!(r.width >= 6) || !(r.height >= 6)) return null;
    return { x: r.left, y: r.top, w: r.width, h: r.height, vw: window.innerWidth, vh: window.innerHeight };
  }, xp).catch(() => null);
  const driveInvalidSubmit = (xp) => page.evaluate((x) => {
    const el = document.evaluate(x, document, null, 9, null).singleNodeValue; if (!el) return false;
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
    return (x1 > x0 && y1 > y0) ? { x: x0, y: y0, width: x1 - x0, height: y1 - y0 } : clampClip(r0, pad);
  };
  const captureSubmitPair = async (xp) => {
    try { await page.reload({ waitUntil: 'load', timeout: opts.gotoTimeoutMs || 30000 }); } catch (e) {}
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
    await page.evaluate((x) => { try { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); } catch (e) {} const el = document.evaluate(x, document, null, 9, null).singleNodeValue; if (el && el.scrollIntoView) { try { el.scrollIntoView({ block: 'center', inline: 'center' }); } catch (e) { el.scrollIntoView(); } } }, xp).catch(() => {});
    const rect = await page.evaluate((x) => {
      const el = document.evaluate(x, document, null, 9, null).singleNodeValue;
      if (!el || !el.getBoundingClientRect) return null;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.visibility === 'collapse' || parseFloat(cs.opacity) === 0) return null;
      const r = el.getBoundingClientRect();
      if (!(r.width >= 6) || !(r.height >= 6)) return null;
      return { x: r.left, y: r.top, w: r.width, h: r.height, vw: window.innerWidth, vh: window.innerHeight, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
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
      await page.evaluate((x) => { const el = document.evaluate(x, document, null, 9, null).singleNodeValue; if (el && el.focus) { try { el.focus({ preventScroll: true }); } catch (e) { try { el.focus(); } catch (_) {} } } }, xp).catch(() => {});
      // #4 fix: CONFIRM real focus actually PERSISTED before manufacturing a "focused" render. A synchronous
      // focus-stripping handler (onfocus="this.blur()", a scripted focus trap that redirects elsewhere, etc.)
      // reverts document.activeElement before we ever reach here — forcing the focus/focus-visible pseudo-state
      // regardless would fabricate a screenshot no real keyboard user would ever see (the DHS Trusted-Tester
      // 546353-13 miss: the rubric judged honestly, but on falsified evidence). Only force the pseudo-state —
      // needed because :focus-visible's own browser heuristic may not qualify a script-driven .focus() call even
      // when focus legitimately sticks — when persistence is CONFIRMED; otherwise capture the TRUE render, which
      // correctly shows no focus styling when none would ever appear to a real user.
      focusPersisted = await page.evaluate((x) => { const el = document.evaluate(x, document, null, 9, null).singleNodeValue; return !!el && document.activeElement === el; }, xp).catch(() => false);
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
        const trig = document.evaluate(x, document, null, 9, null).singleNodeValue;
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
