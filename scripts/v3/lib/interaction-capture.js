'use strict';
// C1 — interaction-driven capture & diff. The harness reads only the RESTING state; a contrast/color cue that
// passes at rest can FAIL in :hover/:focus/:active/:checked, and a control's accessible name/state/value can go
// STALE after activation. The CDP state-forcing primitive already exists (CSS.forcePseudoState) but is not routed
// to re-MEASURE in the driven state. This module drives the state + re-measures + diffs.
const A = require('../../lib/a11y-eval.js');
const NT = require('./nontext-contrast-runner.js');

function measureColorFacts(sel) {
  const el = document.querySelector(sel); if (!el || el.nodeType !== 1) return null;
  const toRgba = (c) => { try { const cv = document.createElement('canvas'); cv.width = cv.height = 1; const x = cv.getContext('2d'); x.fillStyle = c; x.fillRect(0, 0, 1, 1); const d = x.getImageData(0, 0, 1, 1).data; return `rgba(${d[0]}, ${d[1]}, ${d[2]}, ${(d[3] / 255).toFixed(3)})`; } catch (e) { return c; } };
  const transp = (c) => { const m = /rgba?\(([^)]+)\)/.exec(c); if (!m) return false; const p = m[1].split(',').map((x) => parseFloat(x)); return p.length >= 4 && p[3] < 0.999; };
  const cs = getComputedStyle(el);
  let bgEl = el, bg = null, img = false;
  while (bgEl) { const b = getComputedStyle(bgEl); if (b.backgroundImage && b.backgroundImage !== 'none') { img = true; break; } const c = toRgba(b.backgroundColor); if (!transp(c)) { bg = c; break; } bgEl = bgEl.parentElement; }
  const beforeC = getComputedStyle(el, '::before').content;
  const afterC = getComputedStyle(el, '::after').content;
  const pseudoContent = (c) => c && c !== 'none' && c !== 'normal' && c !== '""' && c !== "''";
  return {
    fg: toRgba(cs.color), bg: img ? 'IMAGE' : (bg || 'rgba(255, 255, 255, 1.000)'),
    fontPx: parseFloat(cs.fontSize), fontWeight: cs.fontWeight,
    underline: /underline/.test(cs.textDecorationLine || ''),
    fontWeightBold: parseInt(cs.fontWeight, 10) >= 600,
    borderCue: ['Top', 'Right', 'Bottom', 'Left'].some((s) => parseFloat(cs['border' + s + 'Width']) > 0 && cs['border' + s + 'Style'] !== 'none'),
    iconCue: !!el.querySelector('svg, img, i[class], use, [class*=icon], [class*=check], [class*=tick]') || pseudoContent(beforeC) || pseudoContent(afterC),
    bgImageCue: cs.backgroundImage != null && cs.backgroundImage !== 'none',
  };
}

function textRatio(f) { const a = A.parseRGB(f.fg), b = A.parseRGB(f.bg); if (!a || !b || f.bg === 'IMAGE') return null; return A.contrastRatioRaw([a.r, a.g, a.b], [b.r, b.g, b.b]); }

async function resolveNode(cdp, selector) {
  try {
    const q = selector.startsWith('//') ? selector : selector;
    const { searchId, resultCount } = await cdp.send('DOM.performSearch', { query: q });
    if (!resultCount) return null;
    const { nodeIds } = await cdp.send('DOM.getSearchResults', { searchId, fromIndex: 0, toIndex: 1 });
    return nodeIds && nodeIds[0];
  } catch (e) { return null; }
}

async function runStateColor(page, { targetSelector, state, sc } = {}) {
  const rest = await page.evaluate(measureColorFacts, targetSelector).catch(() => null);
  if (!rest) return { decided: false, reason: 'not-found' };
  if (state === 'visited') return { decided: false, abstain: true, uncertainReason: ':visited cannot be forced/measured deterministically — defer to the rubric' };
  // Drive the state via REAL interaction (so getComputedStyle reflects it) — more reliable than CDP forcePseudoState.
  let active = false;
  try {
    if (state === 'hover') { await page.hover(targetSelector); }
    else if (state === 'focus' || state === 'focus-visible') { await page.focus(targetSelector); }
    else if (state === 'active') { await page.hover(targetSelector); await page.mouse.down(); active = true; }
    else if (state === 'checked') { await page.evaluate((s) => { const e = document.querySelector(s); if (e) { if ('checked' in e) e.checked = true; e.setAttribute('aria-checked', 'true'); } }, targetSelector); }
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(r)));
  } catch (e) { /* ignore */ }
  const inState = await page.evaluate(measureColorFacts, targetSelector).catch(() => null);
  // 1.4.11 state indicator = NON-text contrast (boundary/fill vs adjacent) — compose with C4's measurement while
  // the state is still active (do NOT use text contrast for a non-text indicator).
  let ntFacts = null;
  if (sc === '1.4.11') ntFacts = await page.evaluate(NT.collectNonTextFacts, targetSelector, { focusState: state === 'focus' || state === 'focus-visible' }).catch(() => null);
  if (active) await page.mouse.up().catch(() => {});
  if (!inState) return { decided: false, reason: 'measure-failed' };
  if (sc === '1.4.11') {
    const d = NT.disposeFromFacts(ntFacts, { focusState: state === 'focus' || state === 'focus-visible' });
    if (d.decided) return { decided: true, verdict: d.verdict, ratio: d.ratio, reason: 'non-text contrast in ' + state + ' state: ' + d.reason };
    if (d.exempt) return { decided: true, verdict: 'pass', reason: 'exempt in ' + state + ' state: ' + d.exemptReason };
    return { decided: false, abstain: true, uncertainReason: (d.uncertainReason || 'non-text contrast not decidable') + ' (' + state + ' state)' };
  }

  // 1.4.1 use-of-color: a link/cue distinguished ONLY by color (no underline/border/weight) in the relevant state.
  if (sc === '1.4.1') {
    // Use-of-color is fundamentally a perceptual/semantic judgment (does a cue ADEQUATELY + distinguishingly convey
    // the info?). C1 decides only the UNAMBIGUOUS color-only fail (NO non-color cue of any kind at rest or in-state),
    // and otherwise abstains with the in-state cue facts for the use-of-color rubric.
    const cue = (f) => f.underline || f.borderCue || f.fontWeightBold || f.iconCue || f.bgImageCue;
    // G183: a link/control with a 3:1 colour difference that GAINS a non-colour cue (e.g. an underline) on HOVER
    // and/or FOCUS is not colour-only. The manifest may have measured only 'rest', so drive hover + focus and check
    // the cue there too (an author-added underline; not the default focus ring, which `cue` deliberately ignores).
    let hoverCue = false, focusCue = false;
    try { await page.hover(targetSelector); await page.evaluate(() => new Promise((r) => requestAnimationFrame(r))); const h = await page.evaluate(measureColorFacts, targetSelector); if (h) hoverCue = cue(h); } catch (e) {}
    try { await page.focus(targetSelector); await page.evaluate(() => new Promise((r) => requestAnimationFrame(r))); const fo = await page.evaluate(measureColorFacts, targetSelector); if (fo) focusCue = cue(fo); } catch (e) {}
    if (cue(rest) || cue(inState) || hoverCue || focusCue) return { decided: false, abstain: true, uncertainReason: 'a potential non-colour cue (underline/border/weight/icon/background, incl. one appearing on hover/focus — G183) exists — whether it adequately conveys the info is a use-of-color judgment; defer to the rubric', facts: { rest, inState, hoverCue, focusCue } };
    return { decided: true, verdict: 'fail', reason: 'distinguished by COLOUR only — no underline/border/weight/icon/background cue at rest, hover, or focus' };
  }
  // 1.4.3 / 1.4.11 contrast in the driven state (worst of rest + state governs; image bg ⇒ abstain)
  if (inState.bg === 'IMAGE' || rest.bg === 'IMAGE') return { decided: false, abstain: true, uncertainReason: 'background is an image/gradient in this state — judge from pixels' };
  const rRest = textRatio(rest), rState = textRatio(inState);
  if (rRest == null || rState == null) return { decided: false, abstain: true, uncertainReason: 'unparseable colour in this state' };
  const worst = Math.min(rRest, rState);
  const th = sc === '1.4.11' ? 3.0 : (A.contrastThresholdFor ? A.contrastThresholdFor(inState.fontPx, inState.fontWeight) : 4.5);
  return { decided: true, verdict: worst >= th ? 'pass' : 'fail', ratioRest: +rRest.toFixed(2), ratioInState: +rState.toFixed(2), threshold: th, reason: 'worst-of-states contrast ' + worst.toFixed(2) + ':1 vs ' + th + ' (rest ' + rRest.toFixed(2) + ', ' + state + ' ' + rState.toFixed(2) + ')' };
}

// ---- dynamic name/role/value after activation ----
async function readNRV(page, selector) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel); if (!el) return null;
    const txt = (el.textContent || '').replace(/\s+/g, ' ').trim();
    const labelledby = el.getAttribute('aria-labelledby') ? el.getAttribute('aria-labelledby').split(/\s+/).map((i) => { const r = document.getElementById(i); return r ? r.textContent : ''; }).join(' ').replace(/\s+/g, ' ').trim() : '';
    // accessible name (simplified AccName): aria-label > labelledby > text > child img/svg alt-or-title > title.
    const img = el.querySelector('img[alt],svg[aria-label],svg>title'); const imgAlt = img ? (img.getAttribute('alt') || img.getAttribute('aria-label') || (img.tagName === 'TITLE' ? img.textContent : '') || '') : '';
    const name = el.getAttribute('aria-label') || labelledby || txt || imgAlt || el.getAttribute('title') || '';
    // name with state GLYPHS stripped — so a name that changed only because a ☐/▶ glyph in the TEXT changed does not
    // count as a genuine accessible-name update (that state belongs in an aria-state, not a glyph).
    const nameNoGlyph = name.replace(/[☐☑☒✓✗✔✖▶▼▲►◄●○■□◯◉⊕⊗⬤⏵⏸⏯▷◁▸▾▴▵]/g, '').replace(/\s+/g, ' ').trim();
    // native controls whose value/state the PLATFORM exposes + change-notifies automatically (4.1.2 satisfied natively).
    const tag = el.tagName.toLowerCase(); const type = (el.getAttribute('type') || '').toLowerCase();
    const nativeValueControl = (tag === 'input' && /^(range|number|date|time|datetime-local|month|week|color|checkbox|radio|file)$/.test(type)) || tag === 'select' || tag === 'progress' || tag === 'meter';
    const nativeVal = ('value' in el) ? String(el.value) : (('checked' in el) ? String(el.checked) : null);
    const vs = getComputedStyle(el);
    const visual = [vs.backgroundColor, vs.color, vs.transform, vs.outlineStyle, vs.fontWeight, vs.borderTopColor, vs.borderBottomColor, el.getAttribute('class') || '', el.getAttribute('aria-current') || '', el.getAttribute('aria-selected') || ''].join('|');
    return { name, nameNoGlyph, text: txt, nativeValueControl, nativeVal, pressed: el.getAttribute('aria-pressed'), expanded: el.getAttribute('aria-expanded'), checked: ('checked' in el ? String(el.checked) : el.getAttribute('aria-checked')), valuenow: el.getAttribute('aria-valuenow'), selected: el.getAttribute('aria-selected'), current: el.getAttribute('aria-current'), visual };
  }, selector).catch(() => null);
}

async function runDynamicNRV(page, { targetSelector, activation = 'click' } = {}) {
  const before = await readNRV(page, targetSelector); if (!before) return { decided: false, reason: 'not-found' };
  try {
    if (activation.startsWith('key:')) { const key = activation.slice(4); await page.evaluate((s) => { const e = document.querySelector(s); if (e && e.focus) e.focus(); }, targetSelector); await page.keyboard.press(key === 'Space' ? ' ' : key); }
    else { await page.evaluate((s) => { const e = document.querySelector(s); if (e) e.click(); }, targetSelector); }
    await page.evaluate(() => new Promise((r) => setTimeout(r, 80)));
  } catch (e) { /* ignore */ }
  const after = await readNRV(page, targetSelector); if (!after) return { decided: false, reason: 'after-read-failed' };
  // did the VISIBLE state change?
  const visibleChanged = before.text !== after.text || before.visual !== after.visual;
  const stateAttrChanged = before.pressed !== after.pressed || before.expanded !== after.expanded || before.checked !== after.checked || before.valuenow !== after.valuenow || before.selected !== after.selected || before.current !== after.current;
  // GENUINE accessible-name update = the glyph-stripped name changed (a real aria-label / alt change, not just a
  // ☐/▶ glyph flipping in the text — that state belongs in an aria-state).
  const nameUpdated = before.nameNoGlyph !== after.nameNoGlyph;
  const hasStateAttr = [before.pressed, before.expanded, before.checked, before.valuenow, before.selected, before.current].some((x) => x != null);
  // a NATIVE value/state control (range/number/select/checkbox/…) whose value changed: the PLATFORM exposes the value
  // and fires change notifications — 4.1.2 is satisfied natively, do NOT require an author aria-state to flip.
  const nativeValueChanged = before.nativeValueControl && before.nativeVal !== after.nativeVal;
  const stateGlyph = /[☐☑☒✓✗✔✖▶▼▲►◄●○■□◯◉⊕⊗⬤⏵⏸⏯▷◁▸▾▴▵]/.test((before.text || '') + (after.text || ''));
  if (!visibleChanged) return { decided: false, abstain: true, uncertainReason: 'no observable visible change on ' + activation + ' (activation not effective / change is elsewhere) — judge from a richer interaction', before, after };
  // PASS paths first (the platform / author exposed the change):
  if (nativeValueChanged) return { decided: true, verdict: 'pass', reason: 'native control — value/state is exposed and change-notified by the platform (4.1.2 satisfied natively)', before, after };
  if (stateAttrChanged) return { decided: true, verdict: 'pass', reason: 'aria-state flipped to track the activation', before, after };
  if (nameUpdated) return { decided: true, verdict: 'pass', reason: 'the accessible name genuinely updated (aria-label/alt) to track the change', before, after };
  // BARRIER paths (visible state changed, but nothing programmatic updated):
  if (stateGlyph) return { decided: true, verdict: 'fail', reason: 'the toggled state is conveyed by a text GLYPH only — no aria-state flipped and no name update (4.1.2 value not exposed)', before, after };
  if (hasStateAttr) return { decided: true, verdict: 'fail', reason: 'a control exposing an aria-state did NOT flip it on activation (stale/contradicting state)', before, after };
  return { decided: true, verdict: 'fail', reason: 'visible state changed but the accessible name + aria-state did NOT update (stale)', before, after };
}

module.exports = { runStateColor, runDynamicNRV, measureColorFacts, readNRV };
