// Harness 3.0 — experiment runners C1/C3/C4/C5/C6/C7/C8/C9 (plan docs/plans/V3-EXPERIMENTS-PLAN.md).
// Each follows the focus-visual-retry discipline: hydrate → real input → INDEPENDENT channels →
// withhold BOTH directions on any disagreement/uncertainty (INCONCLUSIVE → PARTIAL). Clearable
// experiments emit a universe-closing obligation (singleModeControl / statesInventoryClosed /
// backdropIsSolidUniform / escapeProvenForWidget) so a clear is only asserted on the decidable
// sub-domain; barrier-only experiments emit no NO_BARRIER_OBSERVED support at all.
'use strict';

const H = require('./run-experiments.js'); // shared helpers (tagByXpath, hydrate, reach, settle, …)
const NTC = require('./nontext-contrast-runner.js'); // C4: deterministic 1.4.11 non-text-contrast (collect in-page, dispose in Node)
const SS = require('./small-signals.js'); // C8: deterministic small signals (glyph 1.1.1, long-desc 1.1.1, multipart 4.1.2, f44 2.4.3)
const RV = require('./reveal-state-runner.js'); // C2: arrow-key composite-widget trap driver (2.1.2 mechanism keyboard-trap-escape never tests)

// Node-side relative-luminance + contrast ratio (mirrors the in-page WCAG formula). Used by the 1.4.3
// runner to compute the WORST-CASE rendered contrast (Harness 3.3 A1 / audit J.4): a clear must hold
// against the backdrop's contrast-REDUCING luminance extreme, not its mean — the mean hides a darker
// (or lighter) sub-region that can fail while the average passes. Robust to a few stray edge pixels via
// the 5th/95th-percentile extremes analyzeBackdrop returns.
const _lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
const _lum = (c) => 0.2126 * _lin(c.r) + 0.7152 * _lin(c.g) + 0.0722 * _lin(c.b);
const contrastRatio = (fg, bg) => { const l1 = _lum(fg), l2 = _lum(bg); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
// alpha-composite a (possibly translucent) source over an opaque backdrop (mirrors the in-page `over`).
const overBg = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a) });
// worst (minimum) contrast of the foreground against REAL backdrop pixels (luminance percentiles) — taking the
// min picks the contrast-reducing region for either text polarity.
// Fix B: when fg carries alpha < 1, RE-COMPOSITE the raw fg over EACH candidate backdrop before the ratio (a
// translucent glyph renders a DIFFERENT colour over each region — e.g. grey-α over white vs over black).
// PHANTOM-MEAN GUARD: candidates are ACTUAL pixel colours (p05/p25/p50/p75/p95), NEVER the arithmetic MEAN. The
// mean of a non-uniform backdrop is a synthetic luminance NO pixel has — for a hard-stop/bimodal backdrop it is a
// phantom mid-gray that, with a translucent glyph composited over it, fabricates a worst-case the text never
// experiences (false BARRIER); for opaque text it hides the dark extreme (false CLEAR). p25/p50/p75 catch the
// worst region for a translucent glyph over a SMOOTH gradient (mid-tones are real pixels there); on a hard-stop
// backdrop they collapse to the real modes, so no mid-gray is ever sampled.
const worstContrast = (fg, backdrop) => {
  const cands = [backdrop.p05, backdrop.p25, backdrop.p50, backdrop.p75, backdrop.p95].filter(Boolean);
  if (!cands.length) cands.push({ r: backdrop.r, g: backdrop.g, b: backdrop.b }); // only when no percentile pixels exist
  const translucent = Number.isFinite(fg.a) && fg.a < 1;
  return Math.min(...cands.map((c) => contrastRatio(translucent ? overBg(fg, c) : fg, c)));
};

// standard result envelope (same shape as the focus runner's finalize()).
function mk(request, experimentId, sc, outcome, applicabilityEvidence, { action, state = 'fresh-load', valid = false, measurement = {} } = {}) {
  return {
    claimId: request.candidateId, experimentId, targetXpath: request.targetXpath, sc,
    completed: true, valid, measurement, outcome, applicabilityEvidence,
    observationScope: { actionTargetRef: request.targetXpath, state, action, environment: request.environment || 'headless-chromium' },
  };
}

// =====================================================================================
// C3 — text-contrast-pixel → 1.4.3 (CLEAR over a flat opaque backdrop)
// =====================================================================================
// In-page: resolve effective fg (alpha-composited, incl. ancestor opacity) over the first opaque
// ancestor backdrop; detect non-uniform backdrops (image/gradient) which block the clear.
function measureContrast(marker) {
  const el = document.querySelector(`[data-v3-target="${marker}"]`);
  if (!el) return null;
  const cs = getComputedStyle(el);
  const rgba = (s) => { const m = String(s || '').match(/rgba?\(([^)]+)\)/i); if (!m) return null; const p = m[1].split(',').map((x) => parseFloat(x)); return { r: p[0], g: p[1], b: p[2], a: p.length >= 4 ? p[3] : 1 }; };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const over = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });

  // own non-whitespace text?
  let ownsText = false;
  for (const n of el.childNodes) if (n.nodeType === 3 && n.textContent.trim()) ownsText = true;
  const rect = el.getBoundingClientRect();
  const visible = cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0 && rect.width > 0 && rect.height > 0;
  // the actual rendered text INK extent — the union of the text node's client rects, which (unlike the
  // border-box) includes glyphs that OVERFLOW the element (audit V3R3 red-team: white-space:nowrap text
  // spilling onto a different canvas). Uniformity must be proven over the whole rendered run.
  let inkRect = rect;
  try {
    const range = document.createRange(); range.selectNodeContents(el);
    const rs = range.getClientRects();
    let l = Infinity, t = Infinity, rr = -Infinity, b = -Infinity, any = false;
    for (const q of rs) { if (q.width <= 0 || q.height <= 0) continue; any = true; l = Math.min(l, q.left); t = Math.min(t, q.top); rr = Math.max(rr, q.right); b = Math.max(b, q.bottom); }
    if (any && rr > l && b > t) inkRect = { left: l, top: t, right: rr, bottom: b, width: rr - l, height: b - t };
  } catch (e) { /* keep the border-box */ }
  // a PSEUDO-ELEMENT (::before/::after) background is invisible to BOTH document.elementsFromPoint and
  // document.querySelectorAll('*'), so a pseudo painted behind the text can hide a non-uniform backdrop
  // (audit V3R3 red-team). A generated pseudo with a visible background defeats the uniformity proof.
  const pseudoPaints = (node) => {
    for (const pe of ['::before', '::after']) {
      const pcs = getComputedStyle(node, pe); if (!pcs) continue;
      if (pcs.content === 'none' || pcs.content === 'normal' || pcs.content === '') continue; // not generated
      const pc = rgba(pcs.backgroundColor);
      if ((pc && pc.a > 0) || (pcs.backgroundImage && pcs.backgroundImage !== 'none')) return true;
    }
    return false;
  };

  // MIXED RUNS: a descendant element that owns text in a DIFFERENT colour means the element is not a
  // single contrast run; we cannot soundly clear it on the element's own colour (audit C2).
  let mixedRuns = false;
  for (const child of el.querySelectorAll('*')) {
    let childOwnsText = false; for (const n of child.childNodes) if (n.nodeType === 3 && n.textContent.trim()) childOwnsText = true;
    if (childOwnsText && getComputedStyle(child).color !== cs.color) { mixedRuns = true; break; }
  }

  // ancestor opacity chain (an ancestor opacity<1 composites the group → rendered contrast differs)
  let opacityChain = 1; for (let p = el; p; p = p.parentElement) { const o = parseFloat(getComputedStyle(p).opacity); if (!isNaN(o)) opacityChain *= o; }

  // backdrop: resolve the composited backdrop through the ACTUAL paint stack at a point
  // (document.elementsFromPoint), compositing every translucent layer down onto the first opaque
  // one and recording the OPAQUE BASE ELEMENT. A background-image / filter / blend / backdrop-filter
  // in any relevant layer makes the composition non-trivial.
  const colorEq = (x, y) => !!x && !!y && x.r === y.r && x.g === y.g && x.b === y.b;
  const rectContains = (R, t, tol) => R.left <= t.left + tol && R.top <= t.top + tol && R.right >= t.right - tol && R.bottom >= t.bottom - tol;
  // THE CANVAS FLOOR (Fix A): the colour painted UNDER everything when no DOM box paints an opaque
  // background at a point. It is NOT unconditionally white — CSS propagates the <html> background, or
  // (if <html> has none) the <body> background, to the viewport canvas. So a `body{background:#000}` page
  // has a BLACK canvas, not white. Resolve that propagated base; assume the CSS-standard white ONLY when
  // neither root paints. canvasHasPaint flags a root background-IMAGE (a non-uniform/unknown floor) so the
  // uniform CLEAR path is withheld (the rendered-pixel oracle still grounds the worst-case barrier).
  const WHITE = { r: 255, g: 255, b: 255, a: 1 };
  const rootCs = document.documentElement && getComputedStyle(document.documentElement);
  const bodyCs = document.body && getComputedStyle(document.body);
  const rootImg = !!(rootCs && rootCs.backgroundImage && rootCs.backgroundImage !== 'none');
  const bodyImg = !!(bodyCs && bodyCs.backgroundImage && bodyCs.backgroundImage !== 'none');
  const rootBg = rootCs ? rgba(rootCs.backgroundColor) : null;
  const bodyBg = bodyCs ? rgba(bodyCs.backgroundColor) : null;
  // The canvas takes <html>'s background; only if <html> paints NOTHING does <body>'s propagate. Resolve an
  // OPAQUE root colour as the floor; flag a root background-IMAGE (or a partly-translucent root over the
  // white default) as canvasHasPaint so the uniform CLEAR is withheld (an image floor is not uniform-clearable).
  let canvasFloor = WHITE, canvasHasPaint = rootImg;
  if (rootBg && rootBg.a === 1) canvasFloor = { r: rootBg.r, g: rootBg.g, b: rootBg.b, a: 1 };
  else if (rootBg && rootBg.a > 0) { canvasFloor = over(rootBg, WHITE); canvasHasPaint = true; }
  else if (!rootImg) { // <html> paints nothing → <body> background propagates to the canvas
    canvasHasPaint = bodyImg;
    if (bodyBg && bodyBg.a === 1) canvasFloor = { r: bodyBg.r, g: bodyBg.g, b: bodyBg.b, a: 1 };
    else if (bodyBg && bodyBg.a > 0) { canvasFloor = over(bodyBg, WHITE); canvasHasPaint = true; }
  }
  function resolveAt(px, py) {
    const stack = document.elementsFromPoint(px, py);
    const idx = stack.indexOf(el);
    // from the text element DOWN; if the element isn't in the hit stack, fall back to its ancestor chain.
    const below = idx >= 0 ? stack.slice(idx) : (() => { const a = []; for (let p = el; p; p = p.parentElement) a.push(p); return a; })();
    const layers = [], layerEls = [];
    let baseEl = null, hasImage = false, hasFilterBlend = false;
    for (const node of below) {
      const ncs = getComputedStyle(node);
      if (ncs.backgroundImage && ncs.backgroundImage !== 'none') hasImage = true;
      if ((ncs.filter && ncs.filter !== 'none') || (ncs.backdropFilter && ncs.backdropFilter !== 'none') || (ncs.mixBlendMode && ncs.mixBlendMode !== 'normal')) hasFilterBlend = true;
      const c = rgba(ncs.backgroundColor);
      if (c && c.a > 0) { layers.push(c); layerEls.push(node); }
      if (c && c.a === 1) { baseEl = node; break; }
    }
    if (!baseEl) {
      // Fix A — no opaque DOM box paints under this point: the propagated CANVAS floor (canvasFloor: the
      // <html>/<body>-propagated background, else white) is the base. Composite any translucent layers onto
      // it so text over a transparent region yields a computable backdrop. canvasHasPaint (a root bg-IMAGE)
      // is folded into hasImage so the uniform CLEAR is withheld; the worst-case barrier still runs against
      // the rendered-pixel oracle, so a wrong floor fails toward abstain, never toward a confident clear.
      let onFloor = canvasFloor;
      for (let i = layers.length - 1; i >= 0; i--) onFloor = over(layers[i], onFloor);
      return { baseEl: null, color: null, canvasColor: { r: onFloor.r, g: onFloor.g, b: onFloor.b, a: 1 }, hasImage: hasImage || canvasHasPaint, hasFilterBlend, layerEls };
    }
    let composed = layers[layers.length - 1];
    for (let i = layers.length - 2; i >= 0; i--) composed = over(layers[i], composed);
    return { baseEl, color: composed, hasImage, hasFilterBlend, layerEls };
  }

  // WHOLE-TEXT-RECT uniformity (audit V3R3-H1): a single centre sample cannot prove the backdrop is
  // uniform across the rendered run. Sample the centre + the four inset corners; the backdrop is
  // uniform ONLY when every sample resolves the SAME opaque base element and the SAME composited
  // colour, that base + every translucent layer fully CONTAINS the text rect, and — crucially — no
  // NON-ANCESTOR element paints a background intersecting the text rect (a sibling/overlay backdrop
  // a point sample can miss). A clearing verdict needs PROVEN uniformity; anything else ⇒ PARTIAL.
  let bg = null, hasImage = false, hasFilterBlend = false, uniformSamples = true;
  const samples = [];
  if (inkRect.width > 0 && inkRect.height > 0) {
    const ins = 1;
    const pts = [
      [inkRect.left + inkRect.width / 2, inkRect.top + inkRect.height / 2],
      [inkRect.left + ins, inkRect.top + ins], [inkRect.right - ins, inkRect.top + ins],
      [inkRect.left + ins, inkRect.bottom - ins], [inkRect.right - ins, inkRect.bottom - ins],
    ];
    for (const [px, py] of pts) { const s = resolveAt(px, py); samples.push(s); if (s.hasImage) hasImage = true; if (s.hasFilterBlend) hasFilterBlend = true; }
  } else uniformSamples = false;
  const center = samples[0] || null;
  if (center && center.color) bg = center.color;
  const base0 = center && center.baseEl;
  for (const s of samples) {
    if (!s || !s.baseEl || !s.color || s.baseEl !== base0 || !colorEq(s.color, bg)) { uniformSamples = false; break; }
  }
  let layersContainText = uniformSamples && !!base0;
  if (layersContainText) {
    for (const node of new Set([base0, ...((center && center.layerEls) || [])])) {
      if (!rectContains(node.getBoundingClientRect(), inkRect, 1)) { layersContainText = false; break; }
    }
  }
  // (B) GEOMETRIC enumeration — catches absolutely-positioned SIBLINGS / overlays (incl.
  // pointer-events:none) and PSEUDO-ELEMENT backdrops that point-sampling and the ancestor walk miss
  // (audit V3R3-H1 / R2-C3 + V3R3 red-team). el's and its ancestors' pseudos paint behind the text;
  // a non-ancestor with a visible background OR pseudo-background intersecting the ink rect is foreign.
  const isAncestorOfEl = (n) => { for (let p = el; p; p = p.parentElement) if (p === n) return true; return false; };
  const intersectsText = (R) => !(R.right <= inkRect.left || R.left >= inkRect.right || R.bottom <= inkRect.top || R.top >= inkRect.bottom);
  let pseudoPainter = false;
  for (let p = el; p; p = p.parentElement) { if (pseudoPaints(p)) { pseudoPainter = true; break; } }
  let foreignPainter = false;
  for (const node of document.querySelectorAll('*')) {
    if (node === el || el.contains(node) || isAncestorOfEl(node)) continue;
    const ncs = getComputedStyle(node);
    if (ncs.display === 'none' || ncs.visibility === 'hidden' || parseFloat(ncs.opacity) === 0) continue;
    const c = rgba(ncs.backgroundColor);
    const paints = (c && c.a > 0) || (ncs.backgroundImage && ncs.backgroundImage !== 'none') || pseudoPaints(node);
    if (paints && intersectsText(node.getBoundingClientRect())) { foreignPainter = true; break; }
  }

  // Fix A — DEFAULT-CANVAS FLOOR. When NO opaque DOM base resolved at ANY sample (the box and its whole
  // paint stack are transparent) AND nothing FOREIGN/pseudo paints under the run, the floor of the paint
  // stack is the propagated canvas (canvasFloor: the <html>/<body> background, else the CSS-standard white).
  // resolveAt already composited any translucent layers onto that floor into `canvasColor`, so use it as the
  // base — this ENABLES a computation (text over a transparent region, or over the transparent part of a
  // gradient) instead of abstaining. SOUNDNESS: this only sets a non-null backdrop so backgroundResolved is
  // true; it NEVER on its own clears, because the CLEAR path additionally requires backdropIsSolidUniform
  // (= uniformSamples && layersContainText && no image/filter/blend), set below ONLY for a genuinely uniform
  // canvas. A wrong floor assumption therefore fails toward abstain (the downstream pixelAgrees gate / the
  // non-uniform p05-p95 oracle), never toward a confident clear; the worst-case BARRIER measures the RAW fg
  // over the RENDERED pixels, not over the assumed floor.
  let onDefaultCanvas = false;
  if (!bg && samples.length && !foreignPainter && !pseudoPainter
      && samples.every((s) => s && !s.baseEl && s.canvasColor)) {
    const c0 = samples[0].canvasColor;
    const canvasUniform = samples.every((s) => colorEq(s.canvasColor, c0));
    bg = { r: c0.r, g: c0.g, b: c0.b, a: 1 };
    onDefaultCanvas = true;
    if (canvasUniform && !hasImage && !hasFilterBlend) {
      uniformSamples = true;     // every sample is the same default-canvas colour, no image/filter/blend
      layersContainText = true;  // the canvas (initial containing block) contains the whole run by definition
    } else {
      uniformSamples = false;    // a gradient/image floor is non-uniform → no CLEAR, worst-case path only
    }
  }

  // the RENDERED glyph fill — `-webkit-text-fill-color` overrides the painted ink while leaving
  // `color` unchanged (audit V3R4 red-team), so read the fill colour, not just `color`. (A pixel
  // foreground-agreement channel below additionally catches filter/blend ink overrides.)
  const fillRaw = cs.webkitTextFillColor && cs.webkitTextFillColor !== 'currentcolor' ? cs.webkitTextFillColor : cs.color;
  const fg = rgba(fillRaw);
  const sizePx = parseFloat(cs.fontSize) || 0;
  let weight = parseInt(cs.fontWeight, 10); if (isNaN(weight)) weight = cs.fontWeight === 'bold' ? 700 : 400;
  const isLarge = sizePx >= 24 || (sizePx >= 18.66 && weight >= 700);
  const threshold = isLarge ? 3.0 : 4.5;

  const foregroundResolved = !!fg && !mixedRuns; // a mixed-colour element has no single foreground
  const backgroundResolved = !!bg;
  // GLYPH EFFECT (audit §B5; ACT afw4f7 false barrier): a text-shadow paints a halo around the glyphs that
  // can PROVIDE the contrast (e.g. a white shadow on dark text over a mid-grey backdrop renders readable
  // at < 4.5:1 flat). The flat fg/bg model cannot account for it, so the runner must ABSTAIN rather than
  // barrier on the stripped-shadow ratio — it is not soundly computable. (filter/blend are already gated.)
  const hasGlyphEffect = typeof cs.textShadow === 'string' && cs.textShadow !== 'none' && cs.textShadow.trim() !== '';
  const backdropIsSolidUniform = backgroundResolved && uniformSamples && layersContainText && !foreignPainter && !pseudoPainter && !hasImage && !hasFilterBlend && opacityChain === 1;
  const contrastComputable = foregroundResolved && backgroundResolved && backdropIsSolidUniform && !mixedRuns && !hasGlyphEffect;
  let ratio = null, effFgColor = null;
  if (foregroundResolved && backgroundResolved) {
    const effFg = over(fg, bg);
    effFgColor = { r: Math.round(effFg.r), g: Math.round(effFg.g), b: Math.round(effFg.b) }; // the FG the ratio used
    if (contrastComputable) { const l1 = lum(effFg), l2 = lum(bg); ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); }
  }
  // 1.4.3 INAPPLICABILITY (ACT afw4f7 false barriers): contrast does not apply to text in a disabled
  // control, text inside a disabled CONTEXT (a `fieldset[disabled]` or `[aria-disabled=true]` ancestor),
  // or text that LABELS a disabled widget. The old check looked only at the element itself, so it
  // false-barriered the grey label of a disabled control. (A disabled control is removed from the
  // accessibility tree's interactive state — its text is incidental.)
  const labelsDisabledWidget = () => {
    try {
      if (el.id && document.querySelector(`[aria-labelledby~="${CSS.escape(el.id)}"][aria-disabled="true"], [aria-labelledby~="${CSS.escape(el.id)}"]:disabled`)) return true;
    } catch (e) {}
    if (el.tagName === 'LABEL') {
      const f = el.getAttribute('for');
      const c = f ? document.getElementById(f) : el.querySelector('input,select,textarea,[role="textbox"],[role="combobox"],[role="spinbutton"],[role="listbox"]');
      if (c && (c.disabled === true || c.getAttribute('aria-disabled') === 'true')) return true;
    }
    return false;
  };
  const disabled = el.disabled === true || el.getAttribute('aria-disabled') === 'true'
    || el.closest('[disabled],[aria-disabled="true"]') != null || labelsDisabledWidget();
  const ariaHidden = el.closest('[aria-hidden="true"]') != null;
  // 1.4.3 does NOT apply to text that does not express anything in a human language (ACT afw4f7 Passed
  // Example 6: a run of pure symbols/punctuation, e.g. "----====++++___***%%%@@@"). Decorative, not
  // meaningful text. Sound + narrow: exempt ONLY when the element's OWN text has NO Unicode letter or
  // number in ANY script — so a price/number/CJK/any worded run is still checked (no false clear).
  let ownText = ''; for (const n of el.childNodes) if (n.nodeType === 3) ownText += n.textContent;
  const trimmedOwn = ownText.trim();
  // ALSO non-language (ACT afw4f7 Passed Example 7): a SINGLE-letter visible glyph used as an ICON on a
  // widget whose accessible name is carried SEPARATELY (aria-label/aria-labelledby) and does NOT contain
  // the glyph — e.g. <button aria-label="Close">X</button>. The lone "X" is a decorative close icon, not
  // human-language text, so it carries no contrast requirement. Guarded TIGHT against a false clear: it
  // fires ONLY for a length-1 letter whose meaning is supplied by a separate name — a real word, an A–Z
  // index link whose name IS its own letter, or a lone letter with no aria name all stay checked.
  let accName = (el.getAttribute('aria-label') || '').trim();
  if (!accName) { const lb = (el.getAttribute('aria-labelledby') || '').trim(); if (lb) { for (const id of lb.split(/\s+/)) { const r = document.getElementById(id); if (r) accName += ' ' + (r.textContent || ''); } accName = accName.trim(); } }
  const singleCharIcon = [...trimmedOwn].length === 1 && /\p{L}/u.test(trimmedOwn) && accName.length > 0 && !accName.includes(trimmedOwn);
  const expressesLanguage = /[\p{L}\p{N}]/u.test(ownText) && !singleCharIcon;
  return {
    isTextNode: ownsText, textRendersVisible: visible && ownsText,
    foregroundResolved, backgroundResolved, backdropIsSolidUniform, contrastComputable,
    sizeClassResolved: sizePx > 0, notExemptText: !disabled && !ariaHidden && expressesLanguage,
    // SPECIFIC non-language exemption (a SUBSET of notExemptText=false): the rendered text is exempt from 1.4.3
    // because its OWN text expresses no human language — pure symbols/punctuation (afw4f7 Passed Ex6) or a
    // single-letter ICON named separately (Passed Ex7). Surfaced apart from notExemptText (which ALSO covers
    // disabled/aria-hidden, a different concern) so the orchestrator can SUBTRACT only THIS facet from the LLM
    // lane (the two flat-color FPs: 2845a840 "----===", eb4bfbbe <button aria-label=Close>X</button>). Real
    // language text — incl. the GT-fail afw4f7 examples — keeps expressesLanguage=true ⇒ false here ⇒ still judged.
    nonLanguageExempt: ownsText && visible && !expressesLanguage,
    ratio, threshold,
    bgColor: bg ? { r: Math.round(bg.r), g: Math.round(bg.g), b: Math.round(bg.b) } : null, // the backdrop the RATIO used
    fgColor: effFgColor, // the composited FOREGROUND the ratio used (vs rendered glyph ink)
    // RAW glyph fill incl. alpha (Fix B): a translucent fg must be RE-composited over EACH backdrop
    // candidate before the ratio (the single pre-composited effFgColor is wrong on a split/gradient
    // backdrop — it bakes in one backdrop). onDefaultCanvas flags that bg is the assumed canvas floor.
    fgRaw: fg ? { r: fg.r, g: fg.g, b: fg.b, a: fg.a } : null,
    onDefaultCanvas,
    signature: `${fillRaw}|${bg ? bg.r + ',' + bg.g + ',' + bg.b : 'na'}|${sizePx}|${weight}`,
  };
}

// in-page: the text INK clip (Range rects union) in viewport CSS px, clamped to the viewport — the
// region the backdrop must be uniform over (incl. overflow). null if not screenshot-capturable.
function inkClip(marker) {
  const el = document.querySelector(`[data-v3-target="${marker}"]`);
  if (!el) return null;
  let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity, any = false;
  try { const range = document.createRange(); range.selectNodeContents(el); for (const q of range.getClientRects()) { if (q.width <= 0 || q.height <= 0) continue; any = true; l = Math.min(l, q.left); t = Math.min(t, q.top); r = Math.max(r, q.right); b = Math.max(b, q.bottom); } } catch (e) { /* fall back */ }
  if (!any) { const rr = el.getBoundingClientRect(); l = rr.left; t = rr.top; r = rr.right; b = rr.bottom; }
  const vw = window.innerWidth, vh = window.innerHeight;
  if (r <= 0 || b <= 0 || l >= vw || t >= vh) return null;
  const x = Math.max(0, Math.floor(l)), y = Math.max(0, Math.floor(t));
  const w = Math.min(vw - x, Math.ceil(r - x)), h = Math.min(vh - y, Math.ceil(b - y));
  if (w < 2 || h < 2) return null;
  return { x, y, width: w, height: h };
}
// in-page: force ALL glyph fill in el's subtree to `color` (a sentinel, or 'transparent' to hide;
// '' removes the override). Restores afterward. text-shadow/caret are neutralised so only glyph ink
// is recoloured — the backdrop is unaffected.
function setGlyphColor(marker, color) {
  const id = 'v3-glyph-color';
  const ex = document.getElementById(id); if (ex) ex.remove();
  if (color) { const s = document.createElement('style'); s.id = id; s.textContent = `[data-v3-target="${marker}"], [data-v3-target="${marker}"] *{color:${color}!important;-webkit-text-fill-color:${color}!important;text-shadow:none!important;caret-color:transparent!important}`; document.head.appendChild(s); }
  return true;
}
// in-page: is the backdrop BEHIND THE GLYPHS a single uniform colour? Takes three equal-size base64
// PNGs of the same clip with the glyphs forced to two distinct SENTINEL colours and to transparent.
// GLYPH GEOMETRY is where the two sentinel shots differ (so even ORIGINALLY-INVISIBLE text — e.g.
// black-on-black — is located, which a shown-vs-hidden diff would miss); the backdrop is uniform iff
// the text-hidden shot is one colour across those glyph pixels (inline line-box leading, which the
// inline background does not paint, never pollutes the sample). The RENDERED backdrop is the only
// COMPLETE uniformity oracle — it captures SVG / canvas / img / ::first-line / shadow-DOM painters
// that CSS-property enumeration misses (audit V3R3 self-adversarial).
function analyzeBackdrop(sentAB64, sentBB64, hiddenB64) {
  const load = (s) => new Promise((res) => { if (!s) return res(null); const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = 'data:image/png;base64,' + s; });
  return Promise.all([load(sentAB64), load(sentBB64), load(hiddenB64)]).then(([a, b, hd]) => {
    if (!a || !b || !hd || a.naturalWidth !== b.naturalWidth || a.naturalWidth !== hd.naturalWidth || a.naturalHeight !== hd.naturalHeight) return { uniform: false };
    const w = a.naturalWidth, h = a.naturalHeight; if (!w || !h) return { uniform: false };
    const px = (img) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.drawImage(img, 0, 0); return x.getImageData(0, 0, w, h).data; };
    const da = px(a), db = px(b), dh = px(hd);
    // relative luminance (WCAG), to rank backdrop pixels and pick the contrast-reducing extreme.
    const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    const lumOf = (r, g, bl) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(bl);
    let minR = 255, minG = 255, minB = 255, maxR = 0, maxG = 0, maxB = 0, glyphPixels = 0, sumR = 0, sumG = 0, sumB = 0;
    const samples = []; // {L,r,g,b} for each BACKDROP-behind-glyph pixel (for luminance percentiles)
    for (let i = 0; i < da.length; i += 4) {
      const sentDelta = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2]));
      if (sentDelta <= 40) continue;             // backdrop pixel (unchanged between the two sentinels)
      glyphPixels++;
      const r = dh[i], g = dh[i + 1], bl = dh[i + 2]; // the BACKDROP colour behind this glyph pixel
      if (r < minR) minR = r; if (g < minG) minG = g; if (bl < minB) minB = bl;
      if (r > maxR) maxR = r; if (g > maxG) maxG = g; if (bl > maxB) maxB = bl;
      sumR += r; sumG += g; sumB += bl;
      samples.push({ L: lumOf(r, g, bl), r, g, b: bl });
    }
    const range = Math.max(maxR - minR, maxG - minG, maxB - minB);
    const n = glyphPixels || 1;
    // 5th / 95th-percentile backdrop colours BY LUMINANCE — the worst-case extremes the ratio must hold
    // against (audit J.4 residual). The percentile (not the absolute min/max) rejects a few stray edge
    // pixels the sentinel mask let through. The MEAN is still returned for the CSS-agreement check.
    samples.sort((x, y) => x.L - y.L);
    const at = (q) => { const s = samples[Math.min(samples.length - 1, Math.max(0, Math.round(q * (samples.length - 1))))]; return s ? { r: s.r, g: s.g, b: s.b } : null; };
    return {
      uniform: glyphPixels >= 8 && range <= 12, range, glyphPixels,
      r: Math.round(sumR / n), g: Math.round(sumG / n), b: Math.round(sumB / n), // representative MEAN (audit V3R4-H1)
      // REAL backdrop pixels at luminance percentiles (the worst-case ratio is measured over colours pixels
      // actually HAVE — see worstContrast's phantom-mean guard). p25/p50/p75 are added so a translucent glyph over
      // a SMOOTH gradient samples its real mid-tones; on a hard-stop backdrop they collapse to the real modes.
      p05: samples.length ? at(0.05) : null, p25: samples.length ? at(0.25) : null, p50: samples.length ? at(0.5) : null,
      p75: samples.length ? at(0.75) : null, p95: samples.length ? at(0.95) : null,
    };
  });
}

async function runTextContrastPixel(page, request) {
  const marker = String(request.candidateId || request.targetXpath);
  const o = { isTextNode: false, textRendersVisible: false, foregroundResolved: false, backgroundResolved: false, backdropIsSolidUniform: false, contrastComputable: false, sizeClassResolved: false, thresholdMet: false, thresholdFailed: false, notExemptText: false, nonLanguageExempt: false, measurementStable: false };
  const hydrationReady = await H.hydrate(page);
  const tagged = await page.evaluate(H.tagByXpath, request.targetXpath, marker).catch(() => false);
  if (!tagged) return mk(request, 'text-contrast-pixel', '1.4.3', o, {}, { action: 'measure-contrast' });
  const a = await page.evaluate(measureContrast, marker).catch(() => null);
  await H.settle(page);
  const b = await page.evaluate(measureContrast, marker).catch(() => null);

  // RENDERED-PIXEL backdrop channel: screenshot the ink region with glyph fill hidden; the backdrop
  // is genuinely uniform only if every captured pixel is one colour. A clear/barrier (anything that
  // needs a single computable contrast) requires BOTH the geometric channel AND this pixel channel
  // to agree the backdrop is uniform — closing SVG/canvas/pseudo painters enumeration cannot see.
  let pixelUniform = false, pixelAgrees = false, backdrop = null;
  if (a && a.textRendersVisible && a.foregroundResolved) {
    const clip = await page.evaluate(inkClip, marker).catch(() => null);
    if (clip) {
      const shot = async () => require('./settle.js').robustScreenshot(page, { clip, encoding: 'base64' });
      await page.evaluate(setGlyphColor, marker, '#ff00ff').catch(() => {});
      const sentA = await shot();
      await page.evaluate(setGlyphColor, marker, '#00ff00').catch(() => {});
      const sentB = await shot();
      await page.evaluate(setGlyphColor, marker, 'transparent').catch(() => {});
      const hidden = await shot();
      await page.evaluate(setGlyphColor, marker, '').catch(() => {});
      if (sentA && sentB && hidden) {
        const px = await page.evaluate(analyzeBackdrop, sentA, sentB, hidden).catch(() => null);
        backdrop = px;
        pixelUniform = !!(px && px.uniform);
        // the RATIO's backdrop colour (CSS paint stack) must AGREE with the rendered backdrop behind
        // the glyphs, or the ratio is computed against the wrong surface (audit V3R4-H1: white text
        // over a uniform white SVG resolves the black body for the ratio ⇒ false 21:1 clear). The
        // FOREGROUND override case (-webkit-text-fill-color) is handled in measureContrast (the ratio
        // reads the fill colour) and filter/blend by hasFilterBlend, so no pixel-fg channel is needed.
        const bgc = a.bgColor;
        pixelAgrees = !!(px && bgc && Math.abs(px.r - bgc.r) <= 16 && Math.abs(px.g - bgc.g) <= 16 && Math.abs(px.b - bgc.b) <= 16);
      }
    }
  }

  let renderedRatio = null;
  if (a && b) {
    const pixelOk = pixelUniform && pixelAgrees;
    const uniform = a.backdropIsSolidUniform && pixelOk;                 // both channels + colour agree
    const contrastComputable = a.contrastComputable && pixelOk;         // a.contrastComputable already ANDs the geometric channel
    Object.assign(o, { isTextNode: a.isTextNode, textRendersVisible: a.textRendersVisible, foregroundResolved: a.foregroundResolved, backgroundResolved: a.backgroundResolved, backdropIsSolidUniform: uniform, contrastComputable, sizeClassResolved: a.sizeClassResolved, notExemptText: a.notExemptText, nonLanguageExempt: a.nonLanguageExempt });
    o.measurementStable = a.signature === b.signature; // no color animation between reads
    // A1 (Harness 3.3): compute the ratio against the RENDERED backdrop's worst-case luminance extreme
    // (analyzeBackdrop mean + p05/p95), NOT the CSS-resolved a.ratio. The CSS ratio can clear a true
    // failure when the rendered backdrop differs within the ±16 agreement tolerance (audit B2), and the
    // mean alone hides a darker sub-region under range≤12 (audit J.4). pixelAgrees still gates
    // computability, so a >16 CSS/rendered disagreement abstains (INCONCLUSIVE), unchanged.
    // Fix B: prefer the RAW alpha-bearing fg so worstContrast re-composites a translucent glyph over each
    // backdrop candidate (the pre-composited a.fgColor baked in a single backdrop). Identical to a.fgColor
    // when the fg is opaque (alpha === 1).
    const fgForWorst = (a.fgRaw && Number.isFinite(a.fgRaw.a)) ? a.fgRaw : a.fgColor;
    if (contrastComputable && o.measurementStable && fgForWorst && backdrop) {
      renderedRatio = worstContrast(fgForWorst, backdrop);
      o.thresholdMet = renderedRatio >= a.threshold;
      o.thresholdFailed = renderedRatio < a.threshold;
    }
    // WORST-CASE BARRIER over a genuinely NON-UNIFORM backdrop (Tier-0 #2, LLM-routing analysis): the
    // uniform-gated `contrastComputable` above abstains on a split/gradient/photo backdrop (afw4f7: "Black hole
    // sun" #555 on a near-black photo ⇒ ~1.7:1; it dead-ended into the LLM, which false-cleared). But 1.4.3
    // requires EVERY text run to meet contrast, so when the WORST rendered region under the glyphs fails by a
    // CLEAR margin that is a SOUND barrier even without uniformity — the catalog's BARRIER_OBSERVED already does
    // NOT require backdropIsSolidUniform (only the CLEAR path does). GUARDS: (1) `!pixelUniform` — fire ONLY for a
    // genuinely non-uniform RENDERED backdrop (a photo/gradient), NOT a uniform backdrop that merely disagrees
    // with the CSS base by >16/channel (the B2 unknown-painter case, which must stay an abstention); (2) the fg +
    // bg must be resolved (an opaque resolved fg is backdrop-independent). We NEVER relax a CLEAR on a non-uniform
    // backdrop (a "might pass" stays INCONCLUSIVE → the rubric); only a clear FAIL is promoted.
    if (!o.thresholdFailed && !o.thresholdMet && o.measurementStable && !pixelUniform
        && a.foregroundResolved && a.backgroundResolved && fgForWorst && backdrop && Number.isFinite(a.threshold)) {
      // measured against the ACTUAL rendered backdrop (analyzeBackdrop p05/p95) with the raw fg re-composited
      // per candidate — so a default-white assumption (onDefaultCanvas) does NOT feed this barrier; it is
      // grounded in real pixels. The ≥0.5 margin below stays the only flip condition.
      const worst = worstContrast(fgForWorst, backdrop);
      // a ≥0.5 margin below threshold guards against a few anti-aliased boundary pixels at the worst extreme
      // (analyzeBackdrop hides the glyph fill, so it measures the BACKDROP; p05/p95 are robust to stray pixels).
      if (Number.isFinite(worst) && worst <= a.threshold - 0.5) {
        o.contrastComputable = true; // computable FOR A FAIL: the worst rendered region is measured and fails
        o.thresholdFailed = true;
        renderedRatio = worst;
      }
    }
    // non-uniform backdrop that does NOT clearly fail, or instability ⇒ neither met nor failed ⇒ INCONCLUSIVE
  }
  const valid = !!(a && b && o.textRendersVisible && o.measurementStable);
  return mk(request, 'text-contrast-pixel', '1.4.3', { ...o, hydrationReady }, { isTextNode: o.isTextNode, textRendersVisible: o.textRendersVisible, sizeClassResolved: o.sizeClassResolved }, { action: 'measure-contrast', valid, measurement: { ratio: renderedRatio, threshold: a && a.threshold, pixelUniform, pixelAgrees, range: backdrop && backdrop.range } });
}

// =====================================================================================
// C6 — field-label-probe → 3.3.2 (CLEAR for the label sub-claim)
// =====================================================================================
function measureFieldLabel(marker) {
  const el = document.querySelector(`[data-v3-target="${marker}"]`);
  if (!el) return null;
  const tag = el.tagName, role = el.getAttribute('role') || '';
  const isUserInputField = (tag === 'INPUT' && !/^(hidden|button|submit|reset|image)$/i.test(el.type || 'text')) || tag === 'SELECT' || tag === 'TEXTAREA' || /^(textbox|combobox|listbox|spinbutton|searchbox)$/.test(role);
  const cs = getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  const fieldRendered = cs.display !== 'none' && cs.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;

  const srOnly = (n) => { if (!n) return true; const s = getComputedStyle(n); const r = n.getBoundingClientRect(); if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) === 0) return true; if (r.width <= 1 && r.height <= 1) return true; if (/inset\(50%\)|rect\(0/.test(s.clip + s.clipPath)) return true; if (r.right < 0 || r.bottom < 0) return true; return false; };
  const txt = (n) => (n ? (n.textContent || '').trim() : '');

  // accessible name (placeholder EXCLUDED), with the visible-label node if any
  let name = '', labelNode = null;
  const lb = el.getAttribute('aria-labelledby');
  if (lb) { const parts = lb.split(/\s+/).map((id) => document.getElementById(id)).filter(Boolean); name = parts.map(txt).join(' ').trim(); labelNode = parts.find((n) => txt(n)); }
  if (!name) { const al = el.getAttribute('aria-label'); if (al && al.trim()) name = al.trim(); }
  if (!name && el.id) { const l = document.querySelector(`label[for="${CSS.escape(el.id)}"]`); if (l && txt(l)) { name = txt(l); labelNode = l; } }
  if (!name) { const wrap = el.closest('label'); if (wrap && txt(wrap)) { name = txt(wrap); labelNode = wrap; } }
  let fromTitleOnly = false;
  if (!name) { const t = el.getAttribute('title'); if (t && t.trim()) { name = t.trim(); fromTitleOnly = true; } }
  const placeholder = (el.getAttribute('placeholder') || '').trim();

  const programmaticNamePresent = name.length > 0;
  const nameOnlyFromPlaceholder = !programmaticNamePresent && placeholder.length > 0;
  const visibleLabelText = !!labelNode && !srOnly(labelNode) && !fromTitleOnly;

  // 3.3.2 does NOT require a PROGRAMMATIC association (that is 1.3.1) or an accessible name (4.1.2):
  // a sufficiently clear VISIBLE label/instruction can pass even if unassociated. So we also look for
  // visible labeling text near the field (a sibling/parent text node), and a barrier is asserted ONLY
  // when there is NO visible label or instruction anywhere (audit V3R2-H2).
  let nearbyVisibleText = false;
  const parent = el.parentElement;
  if (parent) for (const node of parent.childNodes) {
    if (node === el || (node.nodeType === 1 && node.contains && node.contains(el))) continue;
    if (node.nodeType === 3 && node.textContent.trim()) nearbyVisibleText = true;
    else if (node.nodeType === 1) { const ncs = getComputedStyle(node); if (ncs.display !== 'none' && ncs.visibility !== 'hidden' && (node.textContent || '').trim() && !srOnly(node)) nearbyVisibleText = true; }
  }

  return {
    isUserInputField, fieldRendered, programmaticNamePresent, visibleLabelText, nameOnlyFromPlaceholder, nearbyVisibleText,
    // barrier ⇔ no label or instruction at all (no name, no visible associated label, no nearby
    // visible labeling text). An unassociated-but-visible label ⇒ inconclusive, not a barrier.
    fieldLabelBarrier: isUserInputField && fieldRendered && !programmaticNamePresent && !visibleLabelText && !nearbyVisibleText,
  };
}

async function runFieldLabelProbe(page, request) {
  const marker = String(request.candidateId || request.targetXpath);
  const hydrationReady = await H.hydrate(page);
  const o = { isUserInputField: false, fieldRendered: false, hydrationReady, programmaticNamePresent: false, visibleLabelText: false, fieldLabelBarrier: false };
  const tagged = await page.evaluate(H.tagByXpath, request.targetXpath, marker).catch(() => false);
  if (!tagged) return mk(request, 'field-label-probe', '3.3.2', o, {}, { action: 'inspect-label' });
  const m = await page.evaluate(measureFieldLabel, marker).catch(() => null);
  if (m) Object.assign(o, { isUserInputField: m.isUserInputField, fieldRendered: m.fieldRendered, programmaticNamePresent: m.programmaticNamePresent, visibleLabelText: m.visibleLabelText, fieldLabelBarrier: m.fieldLabelBarrier });
  const valid = !!(m && o.isUserInputField && o.fieldRendered);
  return mk(request, 'field-label-probe', '3.3.2', o, { isUserInputField: o.isUserInputField, fieldRendered: o.fieldRendered }, { action: 'inspect-label', valid });
}

// =====================================================================================
// C6b — form-error-probe → 3.3.1 Error Identification (BARRIER-ONLY)
// =====================================================================================
// A BARRIER is a CONSTRAINED field (required/pattern/type) in a form that, when given invalid input
// and submitted, identifies NO error — neither the native browser validation (which would block +
// message) NOR a custom mechanism (aria-invalid + a referenced visible message, or a live alert).
// Clearing 3.3.1 (proving EVERY error condition is identified) is out of scope ⇒ barrier-only.
function probeFormError(marker) {
  const el = document.querySelector(`[data-v3-target="${marker}"]`);
  if (!el) return null;
  const tag = el.tagName, role = el.getAttribute('role') || '', type = (el.getAttribute('type') || '').toLowerCase();
  const isUserInputField = (tag === 'INPUT' && !/^(hidden|button|submit|reset|image)$/i.test(type || 'text')) || tag === 'SELECT' || tag === 'TEXTAREA' || /^(textbox|combobox|listbox|spinbutton|searchbox)$/.test(role);
  const cs = getComputedStyle(el), rect = el.getBoundingClientRect();
  const fieldRendered = cs.display !== 'none' && cs.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
  const form = el.closest('form');
  // G5 (TT 5.F, gap analysis): a field validated CLIENT-SIDE by a framework but carrying NO native HTML
  // constraint and not `required` was evaluated NOT-applicable, so a real JS-only "required/format" check was
  // skipped. Widen `required` to CLIENT-SIDE framework REQUIRED markers — each GUARANTEES a client-side rule
  // exists, so a non-surfaced error after the empty/invalid submit below is a genuine identification gap. A bare
  // `type=password` (or any field with NO client-side marker) is DELIBERATELY NOT widened: this probe
  // preventDefaults the submit and never navigates, so it cannot observe SERVER-side validation — treating every
  // password as constrained would FALSE-BARRIER the (correct, common) server-validated form. Only UNAMBIGUOUS
  // client-side REQUIRED markers qualify — each definitively means "required NOW". AMBIGUOUS markers are EXCLUDED
  // on purpose: a generic `data-validate`, an Aurelia `required.bind="expr"`, or an `ng-required="expr"` whose
  // expression may evaluate FALSE would FALSE-BARRIER a field that isn't actually required (the same invisibility
  // problem as server-side validation). ASP.NET `data-val-required`/`data-val-email` are boolean-by-PRESENCE (the
  // attribute value is the message); the others must read literal "true".
  const eqTrue = (v) => String(v || '').trim().toLowerCase() === 'true'; // tolerate "True"/" true " (adversarial review)
  // R2 G5-F2: the soft markers PROVE a rule was AUTHORED, not that a client validator is RUNNING. A server-validated-
  // only form can ship `data-val-*`/`ng-required` while its unobtrusive/framework script is absent or failed to load
  // — submitting then surfaces no client error and we would FALSE-BARRIER it (the same invisibility gap that keeps
  // bare type=password out). So honor the soft markers ONLY when an ACTIVE client validator is DETECTABLE (jQuery
  // Validate, Angular, or ASP.NET unobtrusive validation-message spans present); otherwise abstain (treat as
  // unconstrained → not-applicable). Native `required`/`pattern`/aria-required are browser-enforced and unaffected.
  const _clientValidatorActive = !!(window.jQuery && window.jQuery.validator) || !!window.angular
    || !!document.querySelector('[data-valmsg-for],.field-validation-valid,.field-validation-error,[ng-app],[data-ng-app]');
  const softRequired = _clientValidatorActive && (el.hasAttribute('data-val-required') // ASP.NET unobtrusive — presence = required
    || eqTrue(el.getAttribute('data-required'))                  // explicit boolean marker (Bootstrap/custom)
    || eqTrue(el.getAttribute('data-rule-required'))             // jQuery Validate
    || eqTrue(el.getAttribute('ng-required')));                  // Angular LITERAL only (expression-valued ⇒ ambiguous ⇒ excluded)
  const softEmail = _clientValidatorActive && el.hasAttribute('data-val-email'); // ASP.NET email validator — presence = client-side email rule
  const required = el.required === true || el.getAttribute('aria-required') === 'true' || softRequired;
  const hasConstraint = required || softEmail || el.hasAttribute('pattern') || /^(email|url|number|tel)$/.test(type) || el.hasAttribute('min') || el.hasAttribute('max') || el.hasAttribute('minlength');
  const fieldConstrained = !!(form && hasConstraint);
  // A DISABLED or READONLY field is NOT user-operable — it is excluded from HTML constraint validation and a user
  // can never put invalid input in it, so 3.3.1 error-identification does not apply. Without this guard the probe
  // blanks the value + submits and, seeing no error surface, reports a FALSE BARRIER (adversarial review, HIGH).
  const notOperable = el.disabled === true || el.readOnly === true || el.getAttribute('aria-disabled') === 'true';
  if (!isUserInputField || !fieldRendered || !fieldConstrained || notOperable) return { isUserInputField, fieldRendered, fieldConstrained: fieldConstrained && !notOperable, applicable: false, errorNotIdentified: false };

  // ---- error-surface detection (3.3.1: identification is AUTHOR-VISIBLE text, not only aria-wired) ----
  // The old channel only honoured a message reachable via aria-describedby/errormessage AND gated on
  // aria-invalid, OR any global live region. That FALSE-BARRIERED the dominant real-world patterns
  // (unreferenced inline error, sibling .error div, toast/snackbar, GOV.UK error summary, referenced
  // message without aria-invalid) and FALSE-CLEARED a real barrier whenever any unrelated live region
  // (e.g. a cart status) held text (gap-fill red-team fb1-6/fc1). We instead diff visible error surfaces
  // before/after the invalid-input+submit: an error is IDENTIFIED iff a visible, error-associated message
  // SURFACED as a result (newly created / shown / populated). The before/after diff stops a pre-existing
  // global status from masking a barrier; the association test stops an unrelated change from clearing it.
  const visibleText = (n) => {
    if (!n || n.nodeType !== 1) return '';
    const ncs = getComputedStyle(n);
    if (ncs.display === 'none' || ncs.visibility === 'hidden' || parseFloat(ncs.opacity) === 0) return '';
    const r = n.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return '';
    return (n.textContent || '').replace(/\s+/g, ' ').trim();
  };
  const ERR_CLASS = /(error|invalid|warn|danger|fail|required|alert|toast|snackbar|notif|flash)/i;
  // A2 → #16 (round-3 overfit audit): the ERR_TEXT/OK_TEXT English keyword pair is retired from the
  // DECISION entirely. A2 had already removed English ERR_TEXT + reddish() as barrier evidence, but the
  // remaining OK_TEXT co-gate still made the CREDIT side language-dependent: a non-English success toast
  // ('Gracias, formulario enviado') in a plain in-form <div> was credited via bare form.contains() as
  // customIdentifies=true — only the ENGLISH success list could exclude it, while the byte-equivalent
  // 'Thanks, submitted' was excluded. SC 3.3.1 is language-agnostic, so the verdict must not turn on the
  // message's language: association is now judged from MARKUP ONLY (referencesField / isLiveRegion /
  // errorStyled), and an in-form surface with NO error-association markup becomes an explicit ABSTAIN
  // (unassociatedSurface, below) whose text sample the LLM lane judges for meaning.
  const fieldId = el.id || '';
  const esc = (s) => (window.CSS && CSS.escape) ? CSS.escape(s) : String(s).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  const refSet = new Set(((el.getAttribute('aria-errormessage') || '') + ' ' + (el.getAttribute('aria-describedby') || '')).split(/\s+/).filter(Boolean));
  const isLiveRegion = (n) => { const r = (n.getAttribute('role') || '').toLowerCase(); const al = (n.getAttribute('aria-live') || '').toLowerCase(); return r === 'alert' || r === 'status' || al === 'assertive' || al === 'polite' || n.tagName === 'OUTPUT'; };
  // error-styled by MARKUP only (role / data / class / id). Colour is NOT a normative identification
  // signal and is not internationalised, so the reddish() fallback is dropped (audit B4 / A2).
  const errorStyled = (n) => {
    const r = (n.getAttribute('role') || '').toLowerCase();
    if (r === 'alert' || r === 'status') return true;
    if (n.hasAttribute('data-error') || n.getAttribute('aria-invalid') === 'true') return true;
    if (ERR_CLASS.test(n.getAttribute('class') || '')) return true;
    if (/error|invalid|alert|warn/i.test(n.id || '')) return true;
    return false;
  };
  const referencesField = (n) => {
    if (n.id && refSet.has(n.id)) return true;                       // the field points AT this node (describedby/errormessage)
    if (!fieldId) return false;
    try { const sel = `a[href="#${esc(fieldId)}"]`; if ((n.matches && n.matches(sel)) || (n.querySelector && n.querySelector(sel))) return true; } catch (e) {}  // summary links to the field
    return false;
  };
  const universe = () => {
    const set = new Set();
    if (form) for (const n of form.querySelectorAll('*')) set.add(n);
    for (const n of document.querySelectorAll('[role="alert"],[role="status"],[aria-live],output,[class*="error"],[class*="invalid"],[class*="alert"],[class*="warn"],[class*="danger"],[class*="toast"],[class*="snackbar"],[class*="notif"],[data-error]')) set.add(n);
    for (const id of refSet) { const n = document.getElementById(id); if (n) set.add(n); }
    if (fieldId) { try { for (const a of document.querySelectorAll(`a[href="#${esc(fieldId)}"]`)) { let p = a; for (let k = 0; k < 5 && p; k++) { set.add(p); p = p.parentElement; } } } catch (e) {} }
    return [...set];
  };

  // BEFORE the error condition: snapshot the PRISTINE visible text of every candidate surface, so an
  // error that surfaces on EITHER blur (below) or submit registers as a CHANGE — and a pre-existing,
  // unrelated live region (e.g. "3 items in your cart") that never changes is NOT mistaken for an error.
  const PRE = '__v3preText';
  for (const n of universe()) n[PRE] = visibleText(n);

  // make the field invalid (the error condition this constraint detects)
  const orig = ('value' in el) ? el.value : null;
  const origAriaInvalid = el.getAttribute('aria-invalid'); // R2 G5-F4: snapshot so the probe leaves no aria-invalid residue
  if ('value' in el) {
    el.value = required ? '' : (softEmail || /^(email|url)$/.test(type)) ? 'x' : /number/.test(type) ? 'abc' : '';
    for (const ev of ['input', 'change', 'blur']) el.dispatchEvent(new Event(ev, { bubbles: true }));
  }
  // native: would the browser BLOCK submit and show a message? (off when the form is novalidate)
  const willValidate = (typeof el.willValidate === 'boolean') ? el.willValidate : true;
  const nativeWouldBlock = !form.noValidate && willValidate && typeof el.checkValidity === 'function' && !el.checkValidity() && !!(el.validationMessage && el.validationMessage.length);
  // attempt submit WITHOUT navigating — the page's own submit handler shows errors by ANY mechanism
  const onSubmit = (e) => { e.preventDefault(); };
  form.addEventListener('submit', onSubmit, true);
  try {
    // R2 G5-F1: a native submit control fires the form's submit handler; but many SPA/JS forms validate on a
    // `type=button` / `role=button` click with NO submit control (requestSubmit then fires no listener → false
    // "no error"). Fall back to clicking such a validator button so its click-handler validation runs.
    const btn = form.querySelector('button[type="submit"],input[type="submit"],button:not([type])')
      || form.querySelector('button[type="button"],input[type="button"],[role="button"]');
    if (btn) btn.click();
    else if (form.requestSubmit) form.requestSubmit();
    else form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  } catch (e) { /* ignore */ }
  form.removeEventListener('submit', onSubmit, true);

  // AFTER: a freshly-SURFACED (new / shown / populated), visible, error-ASSOCIATED message identifies the
  // error — LANGUAGE-AGNOSTIC (A2/#16). Association is judged from MARKUP ONLY: the field references it
  // (describedby/errormessage/summary-link), it is a live region, or it is error-styled by MARKUP
  // (role/class/data/id — NOT colour). Bare `form.contains(n)` crediting is DROPPED (#16): a surfaced
  // in-form node with NO association markup could equally be a success/confirmation toast, and the only
  // thing that ever told those apart was the retired ENGLISH OK_TEXT list — a language-dependent verdict
  // on a language-agnostic SC ('Gracias, enviado' credited, 'Thanks, submitted' excluded). Such a surface
  // now records an explicit ABSTAIN (unassociatedSurface): customIdentifies stays FALSE (it is NOT proven
  // identification) but errorNotIdentified ALSO stays false — the surfaced text MAY be a legitimate
  // plain-text identification (confirmed on the b4-error-*-fb fixtures: a bare in-form <div id=msg> holding
  // a real Spanish/German/Japanese error message — structurally identical to the success toast), so a
  // barrier here would be a false positive. The sample rides the measurement so the LLM lane judges the
  // MEANING (checker-uncertainty-with-reasons). Bias toward NOT-barrier: any plausible identification ⇒
  // errorNotIdentified=false ⇒ PARTIAL (language/meaning deferred to the LLM/human lane), never a false BARRIER.
  let customIdentifies = false, errorSample = '', unassociatedSurface = '';
  for (const n of universe()) {
    const now = visibleText(n);
    if (!now) continue;
    const pre = (PRE in n) ? n[PRE] : '';                 // not in the pre-universe (newly created/styled) ⇒ pristine '' ⇒ surfaced
    if (pre === now) {                                    // unchanged surface
      // A pre-existing, STATIC message the field ITSELF references (aria-describedby/aria-errormessage)
      // and that is error-associated by markup (role/class/data/id) is already-identified — e.g. a number
      // field pre-populated with an invalid value whose referenced <span id="error"> describes it (ACT
      // 36b590 Passed Example 1). Credit it. An UNREFERENCED unchanged surface (a persistent cart status)
      // still falls through and is ignored, so a real barrier is not masked. (#16: the English OK_TEXT
      // co-gate is retired — the reference + error-markup association IS the language-agnostic credit.)
      if (n.id && refSet.has(n.id) && errorStyled(n)) { customIdentifies = true; errorSample = now.slice(0, 80); break; }
      continue;                                           // unchanged + unreferenced surface is not an error event
    }
    if (referencesField(n) || isLiveRegion(n) || errorStyled(n)) { customIdentifies = true; errorSample = now.slice(0, 80); break; }
    // #16 ABSTAIN channel: an in-form surface with no association markup — keep scanning (a later
    // markup-associated surface still credits), but remember the first sample for the abstain record.
    if (form && form.contains(n) && !unassociatedSurface) unassociatedSurface = now.slice(0, 80);
  }
  for (const n of universe()) { try { delete n[PRE]; } catch (e) {} }
  if (orig != null) { el.value = orig; } // restore
  // R2 G5-F4: undo any aria-invalid the page's validation set in reaction to the probe, so two fields probed on
  // one un-reloaded page (only the test harness does this; production reloads per attempt) can't contaminate.
  try { if (origAriaInvalid === null) el.removeAttribute('aria-invalid'); else el.setAttribute('aria-invalid', origAriaInvalid); } catch (e) {}
  // errorNotIdentified (the BARRIER flag) is true only when NOTHING plausibly surfaced: no native block, no
  // markup-associated message, AND no unassociated in-form surface (the abstain case must not read as barrier).
  return { isUserInputField, fieldRendered, fieldConstrained: true, applicable: true, errorNotIdentified: !(nativeWouldBlock || customIdentifies || unassociatedSurface), nativeWouldBlock, customIdentifies, unassociatedSurface: unassociatedSurface || null, errorSample };
}

async function runFormErrorProbe(page, request) {
  const marker = String(request.candidateId || request.targetXpath);
  const hydrationReady = await H.hydrate(page);
  const o = { isUserInputField: false, fieldRendered: false, fieldConstrained: false, hydrationReady, errorNotIdentified: false };
  const tagged = await page.evaluate(H.tagByXpath, request.targetXpath, marker).catch(() => false);
  if (!tagged) return mk(request, 'form-error-probe', '3.3.1', o, {}, { action: 'submit-invalid' });
  // #12b fix: probeFormError clicks the submit button (`btn.click()` inside the page.evaluate below) to
  // trigger the form's OWN submit handler — on a page whose error-identification mechanism is a native
  // window.alert()/confirm() (a real, observed DHS Trusted-Tester pattern, not hypothetical), that freezes
  // the page's JS realm until dismissed. With no listener registered here, this evaluate call hung
  // INDEFINITELY (confirmed live: 400+s before the run-trusted-tester.js worker was killed) — the SAME bug
  // class already fixed in vision-capture.js's captureStateVision (#12) and long-since handled in
  // run-instruments.js's own dialog listener, just not wired into THIS separate deterministic-experiment
  // call site. Dismiss immediately; this probe only needs whether an error surfaced in the DOM (below), not
  // the dialog's own text (vision-capture.js's fix owns capturing that, for the LLM-lane subjects).
  const onDialog = (d) => { d.dismiss().catch(() => {}); };
  page.on('dialog', onDialog);
  const m = await page.evaluate(probeFormError, marker).catch(() => null).finally(() => page.off('dialog', onDialog));
  if (m) Object.assign(o, { isUserInputField: m.isUserInputField, fieldRendered: m.fieldRendered, fieldConstrained: m.fieldConstrained, errorNotIdentified: m.errorNotIdentified });
  const valid = !!(m && m.applicable);
  // #16: `unassociatedSurface` (the abstain sample — an in-form message with NO error-association markup)
  // rides the measurement so the LLM lane can judge its MEANING; it is deliberately NOT an outcome flag
  // (never barrier evidence) and customIdentifies stays false for it.
  return mk(request, 'form-error-probe', '3.3.1', o, { isUserInputField: o.isUserInputField, fieldRendered: o.fieldRendered, fieldConstrained: o.fieldConstrained }, { action: 'submit-invalid', valid, measurement: m ? { nativeWouldBlock: m.nativeWouldBlock, customIdentifies: m.customIdentifies, unassociatedSurface: m.unassociatedSurface || null } : {} });
}

// =====================================================================================
// C8 — reflow-overflow-probe → 1.4.10 (BARRIER-ONLY, page-level @ 320×256)
// =====================================================================================
function measureReflow() {
  const se = document.scrollingElement || document.documentElement;
  const SLOP = 2;
  const horizontalScrollPresent = se.scrollWidth > se.clientWidth + SLOP;
  // locate visible, non-exempt overflow sources
  const vw = window.innerWidth;
  // The 1.4.10 "requires two-dimensional layout for usage or meaning" exception is a SEMANTIC
  // adjudication, not a proven property: th/caption are good SIGNALS of a data table but not proof
  // that 2D layout is required (audit V3R3-M2). This runner is BARRIER-ONLY, so a conservative
  // exemption can only suppress a barrier (a false negative we surface), never manufacture a clear.
  // `dataTableExemptionApplied` reports when this heuristic boundary was the reason an overflow
  // source was not counted, so "0 barriers" is never mistaken for "proven no reflow barrier".
  let dataTableExemptionApplied = false;
  // CELL GRANULARITY of the data-table exemption (Understanding 1.4.10: Note 2 exempts "data tables
  // (not individual cells)"; "each cell within a table would still need to meet this success criterion").
  // Before a TABLE/grid ancestor exempts an overflowing node inside one of ITS td/th cells, test whether
  // the overflow is CELL-INTRINSIC — prose forced onto one line (white-space:nowrap), an unbreakable long
  // token with no overflow-wrap escape, wrappable prose still wider than the WHOLE viewport (only a pinned
  // width does that), or an explicit min-width pin. Such overflow is the cell's own defect (confirmed on
  // capability two-d case-08: one cell's prose pinned to 800px), so the table's exemption must not cover
  // it — fall through, so the C33 scroller-affordance branch below can still apply to unbreakable strings.
  const cellIntrinsic = (el, p) => {
    const cell = el.closest && el.closest('td, th');
    if (!cell || !p.contains(cell) || p === el) return false;
    const c = getComputedStyle(el); const t = (el.textContent || '').trim();
    const prose = /\s/.test(t); const nowrap = (c.whiteSpace || '').indexOf('nowrap') >= 0;
    if (prose && nowrap) return true;
    const unbreakable = /\S{30,}/.test(t.replace(/\s+/g, ' ')) && !/(anywhere|break-word|break-all)/.test((c.overflowWrap || '') + ' ' + (c.wordBreak || ''));
    if (unbreakable) return true;
    if (prose && !nowrap && el.getBoundingClientRect().width > vw + SLOP) return true;
    return (parseFloat(c.minWidth) || 0) > vw + SLOP;
  };
  const isExempt = (el) => {
    for (let p = el; p; p = p.parentElement) {
      const tag = p.tagName, role = p.getAttribute && p.getAttribute('role');
      if (tag === 'MAP' || tag === 'SVG') return true;
      if (role && /^(table|grid|treegrid)$/.test(role) && !cellIntrinsic(el, p)) return true;
      if (tag === 'TABLE' && (p.querySelector('th, caption') || /^(table|grid|treegrid)$/.test(role || '')) && !cellIntrinsic(el, p)) { dataTableExemptionApplied = true; return true; }
      const ov = getComputedStyle(p).overflowX;
      if (ov === 'auto' || ov === 'scroll') {
        // G225 FIX (was: blanket exempt — passed carousels that strand panels off-screen). A scroll container is a
        // valid 2-D affordance ONLY if it is REACHABLE (keyboard-focusable, OR has working nav controls / tabs near
        // it), OR the overflowing content is an UNBREAKABLE string (a long URL/token that legitimately needs the
        // scroll, C33). An UNREACHABLE scroller stranding FLOWABLE content is a G225 barrier — do NOT exempt here
        // (fall through; a higher data-table/map ancestor may still exempt).
        const focusable = p.tabIndex >= 0;
        const scope = p.parentElement || p;
        const navReachable = [...scope.querySelectorAll('button, [role=button], a[href], [role=tab]')].some((b) => { const bc = getComputedStyle(b); return bc.display !== 'none' && bc.visibility !== 'hidden' && !b.disabled && b.getAttribute('aria-disabled') !== 'true' && b.getAttribute('aria-hidden') !== 'true' && (b.tabIndex == null || b.tabIndex >= 0); });
        const ecs = getComputedStyle(el);
        const unbreakable = /\S{30,}/.test((el.textContent || '').replace(/\s+/g, ' ')) && !/(anywhere|break-word|break-all)/.test((ecs.overflowWrap || '') + ' ' + (ecs.wordBreak || ''));
        if (focusable || navReachable || unbreakable) return true; // genuine affordance / C33
        // else: unreachable scroller stranding flowable content ⇒ G225 barrier ⇒ not exempt at this level
      }
    }
    return false;
  };
  let overflowSourceLocated = false, anyNonExempt = false, clipHidingDetected = false;
  const all = document.body ? document.body.querySelectorAll('*') : [];
  for (const el of all) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    if (r.right > vw + SLOP && r.left < vw) { // crosses the right edge while on-screen
      overflowSourceLocated = true;
      if (!isExempt(el)) anyNonExempt = true;
    }
    // invisible clipping: a wider-than-parent child under overflow-x:hidden
    if ((cs.overflowX === 'hidden' || cs.overflowX === 'clip') && el.scrollWidth > el.clientWidth + SLOP) clipHidingDetected = true;
  }
  // G225 (the bug fix's other half): an inner overflow-x:auto/scroll container whose content overflows
  // (scrollWidth > clientWidth) and is FLOWABLE (not a data table/map/code/figure or an unbreakable string) and
  // UNREACHABLE (not keyboard-focusable, no working nav controls / tabs) STRANDS content off-screen. The off-screen
  // panels never cross the viewport edge, so the loop above misses them — a horizontal-scroll barrier even when the
  // PAGE itself does not scroll (the scroller requires horizontal scrolling to reach the stranded content).
  const is2D = (el) => { const role = el.getAttribute && el.getAttribute('role'); return el.tagName === 'TABLE' || el.tagName === 'MAP' || el.tagName === 'SVG' || el.tagName === 'PRE' || el.tagName === 'CODE' || !!(role && /^(table|grid|treegrid|toolbar|application|img|figure)$/.test(role)); };
  let strandedScroller = false;
  for (const el of all) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    if (!/(auto|scroll)/.test(cs.overflowX)) continue;
    if (el.scrollWidth <= el.clientWidth + SLOP) continue;
    if (is2D(el)) continue;
    if (/\S{30,}/.test((el.textContent || '').replace(/\s+/g, ' ')) && el.children.length === 0) continue; // unbreakable string ⇒ C33 affordance
    const scope = el.parentElement || el;
    const reachable = el.tabIndex >= 0 || !!scope.querySelector('[role=tablist] [role=tab]')
      || [...scope.querySelectorAll('button,[role=button],a[href],[role=tab]')].some((b) => { const bc = getComputedStyle(b); return bc.display !== 'none' && bc.visibility !== 'hidden' && !b.disabled && b.getAttribute('aria-disabled') !== 'true' && b.getAttribute('aria-hidden') !== 'true' && (b.tabIndex == null || b.tabIndex >= 0); });
    if (!reachable) { strandedScroller = true; break; }
  }
  return {
    horizontalScrollPresent: horizontalScrollPresent || strandedScroller,
    overflowSourceLocated: overflowSourceLocated || strandedScroller,
    clipHidingDetected, dataTableExemptionApplied,
    allOverflowExemptOr2D: overflowSourceLocated && !anyNonExempt && !strandedScroller,
    overflowBarrierObserved: (horizontalScrollPresent && overflowSourceLocated && anyNonExempt) || strandedScroller,
    scrollWidth: se.scrollWidth, clientWidth: se.clientWidth,
  };
}

async function runReflowOverflowProbe(page, request) {
  await page.setViewport({ width: 320, height: 256, deviceScaleFactor: 1 }).catch(() => {});
  const viewportSet320 = await page.evaluate(() => window.innerWidth === 320).catch(() => false);
  const hydrationReady = await H.hydrate(page);
  const pageRenders = await page.evaluate(() => !!document.body && document.body.getBoundingClientRect().height > 0).catch(() => false);
  const o = { pageRenders, viewportSet320, hydrationReady, reflowSettled: false, horizontalScrollPresent: false, overflowSourceLocated: false, allOverflowExemptOr2D: false, clipHidingDetected: false, overflowBarrierObserved: false, noHorizontalScrollClear: false };
  const a = await page.evaluate(measureReflow).catch(() => null);
  await H.settle(page);
  const b = await page.evaluate(measureReflow).catch(() => null);
  if (a && b) {
    o.reflowSettled = a.scrollWidth === b.scrollWidth;
    Object.assign(o, { horizontalScrollPresent: a.horizontalScrollPresent, overflowSourceLocated: a.overflowSourceLocated, allOverflowExemptOr2D: a.allOverflowExemptOr2D, clipHidingDetected: a.clipHidingDetected });
    if (o.reflowSettled && viewportSet320 && hydrationReady) {
      o.overflowBarrierObserved = a.overflowBarrierObserved;
      o.noHorizontalScrollClear = !a.horizontalScrollPresent && !a.clipHidingDetected; // computed; registry never publishes it
    }
  }
  const valid = !!(a && b && viewportSet320 && o.reflowSettled);
  return mk(request, 'reflow-overflow-probe', '1.4.10', o, { pageRenders, viewportSet320 }, { action: 'reflow-320', state: 'viewport-320x256', valid, measurement: { scrollWidth: a && a.scrollWidth, dataTableExemptionApplied: !!(a && a.dataTableExemptionApplied) } });
}

// =====================================================================================
// C7 — focus-obscured-barrier → 2.4.11 (BARRIER-ONLY)
// =====================================================================================
function measureObscured(marker) {
  const el = document.querySelector(`[data-v3-target="${marker}"]`);
  if (!el) return null;
  el.scrollIntoView({ block: 'center', inline: 'center' });
  const r = el.getBoundingClientRect();
  const focusedRectResolved = r.width > 1 && r.height > 1 && r.top >= 0 && r.left >= 0 && r.bottom <= window.innerHeight && r.right <= window.innerWidth;
  if (!focusedRectResolved) return { focusedRectResolved: false, overlayLayerPresent: false, entirelyObscuredByAuthorContent: false, obscuringLayerOpaqueAndBlocking: false, notObscuredAfterScroll: false };
  const alphaOf = (s) => { const m = String(s || '').match(/rgba?\(([^)]+)\)/i); if (!m) return 1; const p = m[1].split(',').map((x) => parseFloat(x)); return p.length >= 4 ? p[3] : 1; };
  const effOpacity = (node) => { let e = 1; for (let p = node; p; p = p.parentElement) { const oo = parseFloat(getComputedStyle(p).opacity); if (!isNaN(oo)) e *= oo; } return e; };

  // "Entirely obscured" (2.4.11) is a UNIVERSAL claim over the whole component — a finite sample grid
  // can always miss a visible strip (audit V3R3-H2), and numeric z-index compared across stacking
  // contexts is not a valid paint order (audit V3R3-H3). So instead:
  //   (1) determine TRUE paint order via document.elementsFromPoint — which honours the stacking
  //       tree exactly. pointer-events:none overlays are skipped by hit-testing, so temporarily
  //       NEUTRALISE pointer-events on intersecting elements (paint is unaffected), then restore.
  //   (2) for each candidate that is PROVABLY OPAQUE (solid background-color α=1, full effective
  //       opacity, no rounded corners/clip/transform that could leave gaps) AND paints ABOVE the
  //       target (paint order between two elements is positionally invariant, so one hit-test point
  //       in the overlap decides it), take its border-box ∩ target rect as a covered rectangle.
  //   (3) the component is entirely obscured IFF the EXACT rectangle union of those covered rects
  //       leaves no remainder of the target rect (rectangle subtraction — not sampling).
  // Coverage tolerance is near-ZERO: any positive-area remainder is a visible strip of the focused
  // control and must defeat "entirely obscured" — a 0.5px tolerance treats a real ~0.4px strip (≈1
  // device px at Retina DPR) as covered, a false barrier (audit V3R3 red-team). EPS only absorbs
  // floating-point noise from getBoundingClientRect; a genuine sub-pixel gap is far larger.
  const EPS = 0.02;
  const intersect = (a, b) => { const x1 = Math.max(a.left, b.left), y1 = Math.max(a.top, b.top), x2 = Math.min(a.right, b.right), y2 = Math.min(a.bottom, b.bottom); return (x2 - x1 > EPS && y2 - y1 > EPS) ? { left: x1, top: y1, right: x2, bottom: y2 } : null; };
  // subtract rect c from rect base → up to 4 remaining rects (exact, no sampling).
  const subtract = (base, c) => {
    const i = intersect(base, c); if (!i) return [base];
    const out = [];
    if (i.top > base.top + EPS) out.push({ left: base.left, top: base.top, right: base.right, bottom: i.top });
    if (i.bottom < base.bottom - EPS) out.push({ left: base.left, top: i.bottom, right: base.right, bottom: base.bottom });
    if (i.left > base.left + EPS) out.push({ left: base.left, top: i.top, right: i.left, bottom: i.bottom });
    if (i.right < base.right - EPS) out.push({ left: i.right, top: i.top, right: base.right, bottom: i.bottom });
    return out;
  };
  // a 2D-identity or pure-translation transform keeps the painted area equal to the axis-aligned
  // border-box (so coverage geometry stays exact); rotate/skew/scale make getBoundingClientRect
  // over-claim and must stay excluded. This recovers genuine full covers using translateZ(0)/GPU
  // compositing hacks without risking a false barrier (audit V3R3 red-team recall miss).
  const axisAlignedTransform = (t) => {
    if (!t || t === 'none') return true;
    let m = t.match(/^matrix\(([^)]+)\)$/);
    if (m) { const v = m[1].split(',').map(parseFloat); return v[0] === 1 && v[1] === 0 && v[2] === 0 && v[3] === 1; }
    m = t.match(/^matrix3d\(([^)]+)\)$/);
    if (m) { const v = m[1].split(',').map(parseFloat); return v[0] === 1 && v[1] === 0 && v[2] === 0 && v[4] === 0 && v[5] === 1 && v[6] === 0 && v[8] === 0 && v[9] === 0 && v[10] === 1 && v[3] === 0 && v[7] === 0 && v[11] === 0 && v[15] === 1; }
    return false;
  };
  // getBoundingClientRect reflects ANCESTOR transforms too, so a rotate/skew on any ancestor makes a
  // child overlay's axis-aligned AABB over-claim its painted area — a false barrier (audit V3R3
  // self-adversarial). The WHOLE ancestor chain must be axis-aligned for the border-box to be exact.
  const chainAxisAligned = (node) => { for (let p = node; p; p = p.parentElement) if (!axisAlignedTransform(getComputedStyle(p).transform)) return false; return true; };
  // The candidate's EFFECTIVE painted rect = its border box, clipped by its OWN deprecated
  // `clip: rect(...)` (audit V3R4 red-team) and intersected with every clipping ANCESTOR's padding
  // box (overflow:hidden/clip/scroll/auto OR `contain` paint/strict/content — also a paint clip,
  // audit V3R4 red-team). getBoundingClientRect is the UNCLIPPED box, so an overlay clipped to part of
  // its width still over-claims coverage (audit V3R4-H2). A non-rectangular clip (clip-path / mask /
  // rounded overflow) cannot be reduced to a rect ⇒ return null ⇒ exclude.
  const containsPaint = (s) => /\b(paint|strict|content)\b/.test(s || '');
  const clipRectOf = (node, cs) => { // the element's own `clip: rect(t,r,b,l)` (positioned only) → absolute rect, or null
    if (!/^(absolute|fixed)$/.test(cs.position)) return null;
    const c = cs.clip; if (!c || c === 'auto' || c === 'none') return null;
    const m = c.match(/^rect\(([^)]+)\)$/i); if (!m) return null;            // unparseable ⇒ caller treats as can't-prove
    const parts = m[1].split(/[,\s]+/).filter(Boolean).map((v) => (v === 'auto' ? null : parseFloat(v)));
    if (parts.length !== 4) return null;
    const r0 = node.getBoundingClientRect();
    const [t, rt, b, l] = parts; // top,right,bottom,left offsets from the border-box origin (auto ⇒ edge)
    return { left: r0.left + (l == null ? 0 : l), top: r0.top + (t == null ? 0 : t), right: r0.left + (rt == null ? r0.width : rt), bottom: r0.top + (b == null ? r0.height : b) };
  };
  const clippedRect = (node) => {
    const cs0 = getComputedStyle(node);
    const r0 = node.getBoundingClientRect();
    let acc = { left: r0.left, top: r0.top, right: r0.right, bottom: r0.bottom };
    // the candidate's OWN `clip: rect(...)` (deprecated but still painted) clips its own box.
    if (cs0.clip && cs0.clip !== 'auto' && cs0.clip !== 'none') {
      const cr = clipRectOf(node, cs0); if (!cr) return null;                // a clip we can't reduce to a rect ⇒ exclude
      acc = { left: Math.max(acc.left, cr.left), top: Math.max(acc.top, cr.top), right: Math.min(acc.right, cr.right), bottom: Math.min(acc.bottom, cr.bottom) };
    }
    for (let p = node.parentElement; p; p = p.parentElement) {
      const pcs = getComputedStyle(p);
      const clipsOverflow = /(hidden|clip|scroll|auto)/.test(pcs.overflowX) || /(hidden|clip|scroll|auto)/.test(pcs.overflowY) || containsPaint(pcs.contain);
      const hasClipPath = (pcs.clipPath && pcs.clipPath !== 'none') || (pcs.webkitClipPath && pcs.webkitClipPath !== 'none');
      const hasMask = pcs.maskImage && pcs.maskImage !== 'none';
      if (hasClipPath || hasMask) return null;                              // non-rectangular clip ⇒ can't prove
      // an ancestor's OWN clip:rect also clips descendants — fold it in conservatively.
      if (pcs.clip && pcs.clip !== 'auto' && pcs.clip !== 'none') { const cr = clipRectOf(p, pcs); if (!cr) return null; acc = { left: Math.max(acc.left, cr.left), top: Math.max(acc.top, cr.top), right: Math.min(acc.right, cr.right), bottom: Math.min(acc.bottom, cr.bottom) }; }
      if (!clipsOverflow) continue;
      if (pcs.borderRadius && pcs.borderRadius !== '0px') return null;       // rounded overflow clip ⇒ can't prove
      const pr = p.getBoundingClientRect();
      const bl = parseFloat(pcs.borderLeftWidth) || 0, bt = parseFloat(pcs.borderTopWidth) || 0, brr = parseFloat(pcs.borderRightWidth) || 0, bb = parseFloat(pcs.borderBottomWidth) || 0;
      acc = { left: Math.max(acc.left, pr.left + bl), top: Math.max(acc.top, pr.top + bt), right: Math.min(acc.right, pr.right - brr), bottom: Math.min(acc.bottom, pr.bottom - bb) };
      if (acc.right <= acc.left || acc.bottom <= acc.top) return { left: 0, top: 0, right: 0, bottom: 0 }; // clipped away
    }
    if (acc.right <= acc.left || acc.bottom <= acc.top) return { left: 0, top: 0, right: 0, bottom: 0 };
    return acc;
  };

  // (1) neutralise pointer-events on intersecting elements so true paint order is observable.
  const restore = [];
  for (const node of document.querySelectorAll('*')) {
    if (getComputedStyle(node).pointerEvents !== 'none') continue;
    const nr = node.getBoundingClientRect();
    if (intersect(nr, r)) { restore.push([node, node.style.pointerEvents]); node.style.pointerEvents = 'auto'; }
  }
  let coveredRects = [];
  let candidatesConsidered = 0;
  try {
    // does `cand` (or a descendant) paint ABOVE the target at point (x,y)? Walk the true paint stack;
    // the first of {cand-subtree, target-subtree} encountered (topmost-first) wins — invariant in space.
    const aboveAt = (cand, x, y) => {
      const stack = document.elementsFromPoint(x, y);
      for (const n of stack) {
        if (n === cand || cand.contains(n)) return true;     // candidate paints on top here
        if (n === el || el.contains(n)) return false;        // target reached first ⇒ candidate is below
      }
      return false; // neither hit (clipped/covered by a third element) ⇒ cannot prove above ⇒ exclude
    };
    for (const node of document.querySelectorAll('*')) {
      if (node === el || el.contains(node) || node.contains(el)) continue;
      const cs = getComputedStyle(node);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const nr = clippedRect(node); if (!nr) continue;       // non-rectangular ancestor clip ⇒ exclude
      const ov = intersect(nr, r); if (!ov) continue;
      // PROVABLY opaque rectangle: solid background-color (α=1), full effective opacity, and a plain
      // axis-aligned box (no rounded corners / clip-path / transform / blend that could leave gaps).
      const solid = alphaOf(cs.backgroundColor) === 1 && effOpacity(node) >= 0.999
        && (cs.borderRadius === '0px' || cs.borderRadius === '') && (cs.clipPath === 'none' || cs.clipPath === '')
        && chainAxisAligned(node) && (cs.mixBlendMode === 'normal' || cs.mixBlendMode === '') && (cs.filter === 'none' || cs.filter === '');
      if (!solid) continue;
      candidatesConsidered++;
      if (aboveAt(node, ov.left + (ov.right - ov.left) / 2, ov.top + (ov.bottom - ov.top) / 2)) coveredRects.push(ov);
    }
  } finally {
    for (const [node, prev] of restore) node.style.pointerEvents = prev;
  }

  // (3) exact rectangle-union coverage: subtract every covered rect from the target; empty remainder
  // ⇒ entirely obscured. A 1px gap between overlays leaves a remainder ⇒ NOT entirely obscured.
  let remaining = [{ left: r.left, top: r.top, right: r.right, bottom: r.bottom }];
  for (const c of coveredRects) { const next = []; for (const base of remaining) for (const piece of subtract(base, c)) next.push(piece); remaining = next; if (!remaining.length) break; }
  const entirelyObscured = remaining.length === 0 && coveredRects.length > 0;
  return {
    focusedRectResolved: true,
    overlayLayerPresent: candidatesConsidered > 0,
    entirelyObscuredByAuthorContent: entirelyObscured,
    obscuringLayerOpaqueAndBlocking: entirelyObscured, // every covered rect is provably opaque by construction
    notObscuredAfterScroll: !entirelyObscured, // measured AFTER scrollIntoView; if still covered, the exception doesn't apply
  };
}

async function runFocusObscuredBarrier(page, request) {
  const marker = String(request.candidateId || request.targetXpath);
  const hydrationReady = await H.hydrate(page);
  const o = { targetIsFocusable: false, keyboardReachableInState: false, realKeyboardFocus: false, focusedRectResolved: false, overlayLayerPresent: false, entirelyObscuredByAuthorContent: false, obscuringLayerOpaqueAndBlocking: false, notObscuredAfterScroll: false, hydrationReady };
  const tagged = await page.evaluate(H.tagByXpath, request.targetXpath, marker).catch(() => false);
  if (!tagged) return mk(request, 'focus-obscured-barrier', '2.4.11', o, {}, { action: 'focus-then-hittest' });
  o.targetIsFocusable = await page.evaluate((m) => { const el = document.querySelector(`[data-v3-target="${m}"]`); if (!el) return false; el.focus(); const ok = document.activeElement === el; el.blur(); return ok; }, marker).catch(() => false);
  const reach = await H.realKeyboardReach(page, marker); const reached = reach.reached; // V3R6-MAXTAB: ring-walk, no fixed cap
  o.keyboardReachableInState = reached; o.realKeyboardFocus = reached;
  await H.settle(page);
  const m = await page.evaluate(measureObscured, marker).catch(() => null);
  if (m && reached) Object.assign(o, { focusedRectResolved: m.focusedRectResolved, overlayLayerPresent: m.overlayLayerPresent, entirelyObscuredByAuthorContent: m.entirelyObscuredByAuthorContent, obscuringLayerOpaqueAndBlocking: m.obscuringLayerOpaqueAndBlocking, notObscuredAfterScroll: m.notObscuredAfterScroll });
  const valid = !!(reached && o.focusedRectResolved);
  return mk(request, 'focus-obscured-barrier', '2.4.11', o, { targetIsFocusable: o.targetIsFocusable, keyboardReachableInState: o.keyboardReachableInState }, { action: 'focus-then-hittest', valid });
}

// =====================================================================================
// C5 — keyboard-trap-escape → 2.1.2 (CLEAR per-component)
// =====================================================================================
async function runKeyboardTrapEscape(page, request) {
  const marker = String(request.candidateId || request.targetXpath);
  const hydrationReady = await H.hydrate(page);
  const o = { targetIsFocusable: false, keyboardReachableInState: false, focusEnteredRegion: false, escapeProvenForWidget: false, trapProven: false, focusStaysInDocument: true, hydrationReady };
  const tagged = await page.evaluate(H.tagByXpath, request.targetXpath, marker).catch(() => false);
  if (!tagged) return mk(request, 'keyboard-trap-escape', '2.1.2', o, {}, { action: 'tab-into-then-escape' });
  o.targetIsFocusable = await page.evaluate((m) => { const el = document.querySelector(`[data-v3-target="${m}"]`); if (!el) return false; el.focus(); const ok = document.activeElement === el; el.blur(); return ok; }, marker).catch(() => false);

  // tag the containing region so we can detect "focus left the region". A3 (Harness 3.3): use the SHARED
  // class-aware selector from kbd-graph (TRAP_REGION_SEL) so a role-LESS `<div class=modal>` trap anchors
  // to the overlay, not collapsing to the input itself — which false-CLEARED the role-less trap the
  // detector catches (audit §D / L5). Also read the in-region focusable count to size the escape budget.
  const kg = require('./kbd-graph.js');
  const regionInfo = await page.evaluate((m, regSel, focSel) => {
    const el = document.querySelector(`[data-v3-target="${m}"]`); if (!el) return { focusableCount: 0 };
    const region = el.closest(regSel) || el;
    region.setAttribute('data-v3-region', m);
    const fs = [...region.querySelectorAll(focSel)].filter((f) => f.offsetParent !== null || getComputedStyle(f).position === 'fixed');
    return { focusableCount: fs.length };
  }, marker, kg.TRAP_REGION_SEL, kg.FOCUSABLE_SEL).catch(() => ({ focusableCount: 0 }));

  const reach = await H.realKeyboardReach(page, marker); const reached = reach.reached; // V3R6-MAXTAB
  o.keyboardReachableInState = reached; o.focusEnteredRegion = reached;
  if (!reached) return mk(request, 'keyboard-trap-escape', '2.1.2', o, { targetIsFocusable: o.targetIsFocusable, keyboardReachableInState: false }, { action: 'tab-into-then-escape', measurement: { reachTabs: reach.tabs, reachExhausted: reach.exhausted } });

  // probe state: in region? in document?
  const probe = (m) => {
    const a = document.activeElement;
    const region = document.querySelector(`[data-v3-region="${m}"]`);
    const inRegion = !!(a && region && region.contains(a));
    const inDoc = !!(a && a !== document.body && a.tagName !== 'IFRAME' && document.hasFocus());
    return { inRegion, inDoc, isTarget: !!(a && a.getAttribute && a.getAttribute('data-v3-target') === m) };
  };
  // A3: derive the escape budget from the in-region focusable count (+ margin), not a fixed 12 — a fixed
  // budget over-abstained (flipped a valid CLEAR to INCONCLUSIVE) at ≥13 in-region focusables, because a
  // well-behaved large region needs more than 12 Tabs to step past every focusable and exit. Floor at 12.
  const BUDGET = Math.max(12, regionInfo.focusableCount + 4);
  const TRAP_REFOCUS_SETTLE_MS = 180; // == kbd-graph REFOCUS_SETTLE_MS: covers a setTimeout/rAF async refocus + margin
  // forward Tab escape (re-reach first)
  let tabEscapes = false, cycledBackToStart = false, lost = false;
  for (let i = 0; i < BUDGET; i++) {
    await page.keyboard.press('Tab');
    await H.settle(page, TRAP_REFOCUS_SETTLE_MS); // let an async onblur/onfocusout self-refocus land BEFORE reading — a
    const s = await page.evaluate(probe, marker); // synchronous read sees focus on the next sibling and FALSE-CLEARS the trap
    if (!s.inDoc) { lost = true; break; }
    if (!s.inRegion) { tabEscapes = true; break; }
    if (s.isTarget && i > 0) { cycledBackToStart = true; break; }
  }
  // Shift+Tab escape (re-reach)
  let shiftEscapes = false;
  await H.realKeyboardReach(page, marker);
  for (let i = 0; i < BUDGET; i++) {
    await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift');
    await H.settle(page, TRAP_REFOCUS_SETTLE_MS); // same async-refocus settle on the backward sweep
    const s = await page.evaluate(probe, marker);
    if (!s.inDoc) { lost = true; break; }
    if (!s.inRegion) { shiftEscapes = true; break; }
    if (s.isTarget && i > 0) break;
  }
  // Esc closes/escapes (re-reach)
  await H.realKeyboardReach(page, marker);
  await page.keyboard.press('Escape');
  await H.settle(page, 60);
  const escResult = await page.evaluate((m) => {
    const region = document.querySelector(`[data-v3-region="${m}"]`);
    const removed = !region || !region.isConnected || region.hidden || getComputedStyle(region).display === 'none' || region.getAttribute('open') === null && region.tagName === 'DIALOG';
    const a = document.activeElement;
    const movedOut = !(a && region && region.contains(a));
    const inDoc = !!(a && a !== document.body && document.hasFocus());
    return { escClosesOrEscapes: (removed || movedOut), inDoc };
  }, marker).catch(() => ({ escClosesOrEscapes: false, inDoc: true }));
  if (!escResult.inDoc) lost = true;
  const escClosesOrEscapes = escResult.escClosesOrEscapes;

  // WCAG 2.1.2 permits ANOTHER keyboard exit method WHEN the user is advised of it. Detect advisory
  // text in the region ("press Z to leave"), try the advised key, and never assert a trap when an
  // advised exit exists but we couldn't confirm it (audit V3R2-H4).
  const advice = await page.evaluate((m) => {
    const region = document.querySelector(`[data-v3-region="${m}"]`);
    const t = region ? region.textContent || '' : '';
    const mm = t.match(/press\s+(?:the\s+)?["']?([A-Za-z])["']?\s+(?:key\s+)?to\s+(?:leave|exit|close|escape|dismiss|continue)/i);
    return { advised: /\bto\s+(leave|exit|close|escape|dismiss)\b/i.test(t), key: mm ? mm[1].toLowerCase() : null };
  }, marker).catch(() => ({ advised: false, key: null }));
  let advisedKeyEscapes = false;
  if (!escClosesOrEscapes && advice.key) {
    await H.realKeyboardReach(page, marker);
    await page.keyboard.press(advice.key); await H.settle(page, 60);
    const a = await page.evaluate((m) => { const region = document.querySelector(`[data-v3-region="${m}"]`); const el = document.activeElement; const inDoc = !!(el && el !== document.body && document.hasFocus()); const removed = !region || !region.isConnected || region.hidden; const movedOut = !(el && region && region.contains(el)); return { ok: (removed || movedOut), inDoc }; }, marker).catch(() => ({ ok: false, inDoc: true }));
    advisedKeyEscapes = a.ok; if (!a.inDoc) lost = true;
  }

  o.focusStaysInDocument = !lost;
  const anyEscapes = tabEscapes || shiftEscapes || escClosesOrEscapes || advisedKeyEscapes;
  // one-way / disagreement ⇒ INCONCLUSIVE (neither set)
  const oneWayConflict = (tabEscapes !== shiftEscapes) && !escClosesOrEscapes && !advisedKeyEscapes;
  o.escapeProvenForWidget = anyEscapes && o.focusStaysInDocument && !oneWayConflict;
  // a trap is asserted ONLY when no mechanism escaped AND there is no advised alternative exit.
  o.trapProven = !anyEscapes && !advice.advised && o.focusStaysInDocument && cycledBackToStart;
  const valid = o.focusStaysInDocument && reached;
  return mk(request, 'keyboard-trap-escape', '2.1.2', o, { targetIsFocusable: o.targetIsFocusable, keyboardReachableInState: o.keyboardReachableInState }, { action: 'tab-into-then-escape', valid, measurement: { tabEscapes, shiftEscapes, escClosesOrEscapes, advisedKeyEscapes, advised: advice.advised, cycledBackToStart, oneWayConflict } });
}

// =====================================================================================
// C4 — keyboard-activation → 2.1.1 (CLEAR only for finite-contract single-mode controls)
// =====================================================================================
const C4_SIMPLE = /^(button|link|checkbox|radio|switch|menuitem|menuitemcheckbox|menuitemradio|tab|option)$/;
const C4_SIMPLE_TAG = /^(BUTTON|A|INPUT|SELECT|TEXTAREA)$/;

// BROAD observation: an activation's observable effect may land on the control's NATIVE state
// (.checked/.value), its ARIA state, the focus location, OR anywhere in the document (off-board
// effect, e.g. a form submit message or a counter). Watching only the control's own ARIA/outerHTML
// produces false barriers on native checkboxes, submit buttons, and off-board-effect controls.
async function observeC4(page, marker) {
  return page.evaluate((m) => {
    const el = document.querySelector(`[data-v3-target="${m}"]`); if (!el) return null;
    const aria = ['aria-pressed', 'aria-checked', 'aria-expanded', 'aria-selected'].map((k) => k + '=' + el.getAttribute(k)).join(';');
    const a = document.activeElement;
    // a content HASH (not just length) so a same-length change ("Count: 0"→"Count: 1") is detected.
    const txt = document.body ? document.body.innerText : '';
    let h = 0; for (let i = 0; i < txt.length; i++) h = (h * 31 + txt.charCodeAt(i)) | 0;
    return {
      aria, checked: el.checked === undefined ? null : el.checked, value: el.value === undefined ? null : el.value,
      active: a ? a.tagName + '#' + (a.id || '') + '.' + (a.className || '') : '',
      docNodes: document.getElementsByTagName('*').length, docText: h,
    };
  }, marker).catch(() => null);
}
const c4changed = (a, b) => !a || !b || a.aria !== b.aria || a.checked !== b.checked || a.value !== b.value || a.active !== b.active || a.docNodes !== b.docNodes || a.docText !== b.docText;

async function runKeyboardActivation(page, request) {
  const marker = String(request.candidateId || request.targetXpath);
  const hydrationReady = await H.hydrate(page);
  const o = { targetIsInteractive: false, targetIsFocusable: false, hydrationReady, keyboardReachableInState: false, reachedForActivation: false, contractKeysAllOperated: false, observableEffectStable: false, realKeyDistinctFromSynthetic: false, singleModeControl: false, modeInventoryClosed: false, noKeyEffectStable: false };
  const tagged = await page.evaluate(H.tagByXpath, request.targetXpath, marker).catch(() => false);
  if (!tagged) return mk(request, 'keyboard-activation', '2.1.1', o, {}, { action: 'real-key-activate' });

  const info = await page.evaluate((m) => {
    const el = document.querySelector(`[data-v3-target="${m}"]`); if (!el) return null;
    const role = el.getAttribute('role') || ''; const tag = el.tagName;
    const type = (el.getAttribute('type') || '').toLowerCase();
    // a REGISTERED Enter/Space ACTIVATION control only — NOT text-entry fields (which "activate" by
    // typing a space) and NOT roving/composite widgets (tab/option/slider/combobox, operated by
    // arrows). Those are out of this experiment's recipe ⇒ applicability fails ⇒ PARTIAL, never a
    // clear or barrier (audit V3R2-C2).
    const enterSpaceRole = /^(button|checkbox|radio|switch|menuitem|menuitemcheckbox|menuitemradio)$/.test(role);
    // a composite/roving role (tab/option/slider/…) is operated by ARROWS, not Enter/Space — even on
    // a native <button> tag — so it is OUT of this experiment's recipe (audit V3R2-C2).
    const composite = /^(combobox|slider|grid|listbox|menu|tablist|tree|application|tab|option|textbox|searchbox|spinbutton)$/.test(role) || el.hasAttribute('aria-haspopup') || el.hasAttribute('aria-controls');
    const isActivationControl = !composite && (enterSpaceRole || tag === 'BUTTON'
      || (tag === 'A' && el.hasAttribute('href'))
      || (tag === 'INPUT' && /^(button|submit|reset|checkbox|radio)$/.test(type)));
    // OBSERVABLE pointer-only secondary functionality (ondblclick / oncontextmenu / mouse-specific)
    // means the mode inventory is NOT closed — even on a native control (audit V3R4-H3). This only
    // catches inline on* handlers (addEventListener is invisible), which is why 2.1.1 stays
    // barrier-only in the registry; this flag makes the OBSERVATION honest when a handler IS visible.
    const secondaryPointerHandler = ['ondblclick', 'oncontextmenu', 'onmousedown', 'onmouseup', 'onmousemove', 'onwheel'].some((h) => el.getAttribute(h) != null || typeof el[h] === 'function');
    el.focus(); const focusable = document.activeElement === el; el.blur();
    return { role, tag, type, isActivationControl, composite, focusable, secondaryPointerHandler };
  }, marker).catch(() => null);
  if (!info) return mk(request, 'keyboard-activation', '2.1.1', o, {}, { action: 'real-key-activate' });
  o.targetIsInteractive = info.isActivationControl; o.targetIsFocusable = info.focusable;
  // 2.1.1 clearing is WITHDRAWN at the registry (open-scope-never-clearable); these flags remain so a
  // proposer/observer never even infers a single-mode inventory when a pointer-only handler is visible.
  o.singleModeControl = info.isActivationControl && !info.composite && !info.secondaryPointerHandler;
  o.modeInventoryClosed = !info.composite && !info.secondaryPointerHandler;
  // out of recipe ⇒ don't even attempt activation; applicability will PARTIAL it.
  if (!info.isActivationControl) return mk(request, 'keyboard-activation', '2.1.1', o, { targetIsInteractive: false, targetIsFocusable: o.targetIsFocusable, hydrationReady }, { action: 'real-key-activate', valid: false });

  // synthetic-first probe (must NOT already produce the effect)
  const s0 = await observeC4(page, marker);
  await page.evaluate((m) => { const el = document.querySelector(`[data-v3-target="${m}"]`); el && el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); }, marker).catch(() => {});
  const s1 = await observeC4(page, marker);
  const syntheticEffect = c4changed(s0, s1);

  // real activation (Enter then Space, each from a fresh real-keyboard focus)
  const reach = await H.realKeyboardReach(page, marker); const reached = reach.reached; // V3R6-MAXTAB
  o.keyboardReachableInState = reached; o.reachedForActivation = reached;
  let activatedByEnter = false, activatedBySpace = false, navigated = false;
  page.once('framenavigated', () => { navigated = true; });
  // ROBUSTNESS: activating a LINK (`<a href>` / role=link) by Enter triggers the browser's DEFAULT
  // navigation. For an absolute EXTERNAL href that loads a real page over the network — stalling this
  // probe (seen as a 30-75s case-timeout on ACT cases whose links point at gutenberg.org / w3.org) and
  // leaving the page on the wrong document. Install a capture-phase guard on the link that RECORDS the
  // navigation intent and `preventDefault`s the actual load: the link is still observed as operable
  // (`navigated`), we just never leave the page. Same-document/programmatic navigations are unaffected.
  const targetIsLink = info.role === 'link' || info.tag === 'A';
  if (reached) {
    // Guard the Enter activation against LEAVING/DUPLICATING the page: (a) a capture-phase click guard on a
    // LINK records + preventDefaults its default navigation (covers external href AND target=_blank, whose
    // new-tab load is the click's default action); (b) a window.open STUB catches any control whose handler
    // explicitly opens a popup (#20 residual — preventDefault does NOT stop an explicit window.open() call).
    // Both RECORD operability so the control still reads as activated; both are restored after the probe.
    await page.evaluate((m, isLink) => {
      window.__v3navIntent = false; window.__v3openIntent = false;
      if (isLink) {
        const el = document.querySelector(`[data-v3-target="${m}"]`);
        if (el) { window.__v3navGuard = (e) => { if (e.target === el || (el.contains && el.contains(e.target))) { window.__v3navIntent = true; if (e.cancelable) e.preventDefault(); } }; document.addEventListener('click', window.__v3navGuard, true); }
      }
      window.__v3openOrig = window.open;
      try { window.open = function () { window.__v3openIntent = true; return null; }; } catch (e) {}
    }, marker, targetIsLink).catch(() => {});
    const before = await observeC4(page, marker);
    await page.keyboard.press('Enter'); await H.settle(page, 60);
    const afterEnter = await observeC4(page, marker);
    const intents = await page.evaluate(() => {
      const nav = window.__v3navIntent === true, open = window.__v3openIntent === true;
      if (window.__v3navGuard) { document.removeEventListener('click', window.__v3navGuard, true); window.__v3navGuard = null; }
      window.__v3openIntent = false; // reset so a SPACE-side window.open can be detected separately (the stub stays installed)
      return { nav, open };
    }).catch(() => ({ nav: false, open: false }));
    if (intents.nav || intents.open) navigated = true; // default navigation OR a window.open popup fired on Enter; we blocked the external load/tab
    activatedByEnter = navigated || c4changed(before, afterEnter);
    if (!navigated) {
      await H.realKeyboardReach(page, marker);
      const b2 = await observeC4(page, marker);
      await page.keyboard.press('Space'); await H.settle(page, 60);
      const afterSpace = await observeC4(page, marker);
      // the window.open stub is STILL installed (it must cover Space too — a custom role=button often opens
      // a popup on Space): a Space-triggered popup is blocked AND counts as operability (adversarial verify
      // #6 — restoring before Space let a real popup escape and produced a false 2.1.1 barrier).
      const spaceOpen = await page.evaluate(() => window.__v3openIntent === true).catch(() => false);
      activatedBySpace = c4changed(b2, afterSpace) || spaceOpen;
    }
    // restore the real window.open (the stub was installed for the Enter+Space probes above).
    await page.evaluate(() => { if (window.__v3openOrig) { try { window.open = window.__v3openOrig; } catch (e) {} window.__v3openOrig = null; } }).catch(() => {});
  }
  // contract per control: checkbox/radio/switch ⇒ Space; link ⇒ Enter; a NATIVE button/input ⇒
  // either key (browser-guaranteed operability; one observed activation suffices, and off-board
  // effects are often idempotent so the 2nd key shows no change); a CUSTOM role=button ⇒ Enter AND
  // Space, so a custom control that forgot Space-handling is caught (a real 2.1.1 gap).
  const isCheckRadio = /^(checkbox|radio|switch)$/.test(info.role) || (info.tag === 'INPUT' && /^(checkbox|radio)$/.test(info.type));
  const isLink = info.role === 'link' || info.tag === 'A';
  const isNative = /^(BUTTON|INPUT|SELECT|TEXTAREA)$/.test(info.tag);
  const contractKeysAllOperated = navigated ? true
    : isCheckRadio ? activatedBySpace
      : isLink ? activatedByEnter
        : isNative ? (activatedByEnter || activatedBySpace)
          : (activatedByEnter && activatedBySpace);
  o.contractKeysAllOperated = contractKeysAllOperated;
  o.observableEffectStable = contractKeysAllOperated;
  o.realKeyDistinctFromSynthetic = !syntheticEffect;
  o.noKeyEffectStable = reached && hydrationReady && !activatedByEnter && !activatedBySpace && !navigated && o.targetIsInteractive;
  const valid = reached && o.targetIsInteractive;
  return mk(request, 'keyboard-activation', '2.1.1', o, { targetIsInteractive: o.targetIsInteractive, targetIsFocusable: o.targetIsFocusable, hydrationReady }, { action: 'real-key-activate', valid, measurement: { syntheticEffect, activatedByEnter, activatedBySpace, navigated, isCheckRadio } });
}

// =====================================================================================
// C1 — ax-state-diff → 4.1.2 (CLEAR for a closed ARIA state set; CDP AX tree)
// =====================================================================================
const ARIA_STATE_FOR = { button: 'pressed', checkbox: 'checked', switch: 'checked', radio: 'checked', tab: 'selected', option: 'selected', combobox: 'expanded', menuitemcheckbox: 'checked', menuitemradio: 'checked' };

async function runAxStateDiff(page, request) {
  const marker = String(request.candidateId || request.targetXpath);
  const hydrationReady = await H.hydrate(page);
  const o = { targetHasWidgetRole: false, hydrationReady, axNodeResolved: false, axRolePresentAndExpected: false, axNamePresent: false, axNameNotFromError: false, axStatePropertyExposed: false, axStateChanged: false, axDomAgree: false, axDiffStable: false, activationWasReal: false, noNavigation: true, statesInventoryClosed: false, nrvDefectStable: false };
  const tagged = await page.evaluate(H.tagByXpath, request.targetXpath, marker).catch(() => false);
  if (!tagged) return mk(request, 'ax-state-diff', '4.1.2', o, {}, { action: 'activate-ax-diff' });

  const meta = await page.evaluate((m) => {
    const el = document.querySelector(`[data-v3-target="${m}"]`); if (!el) return null;
    const ariaRole = el.getAttribute('role') || '';
    const role = ariaRole || el.tagName.toLowerCase();
    // the state we will diff: the ARIA state the element ACTUALLY carries (a <button> may carry
    // aria-expanded), else its role's prescribed state.
    const present = ['expanded', 'pressed', 'checked', 'selected'].filter((k) => el.hasAttribute('aria-' + k));
    return { role, ariaRole, present, controls: el.getAttribute('aria-controls') || '', isWidget: /^(button|link|checkbox|switch|tab|menuitem|combobox|radio|slider)$/.test(ariaRole) || /^(BUTTON|A|INPUT|SELECT)$/.test(el.tagName) };
  }, marker).catch(() => null);
  if (!meta) return mk(request, 'ax-state-diff', '4.1.2', o, {}, { action: 'activate-ax-diff' });
  o.targetHasWidgetRole = meta.isWidget;
  const stateKey = meta.present[0] || ARIA_STATE_FOR[meta.role];
  // closed ARIA state set: the element carries exactly one settable ARIA state (or its role prescribes one).
  o.statesInventoryClosed = (meta.present.length === 1) || (meta.present.length === 0 && !!ARIA_STATE_FOR[meta.role]);

  let cdp;
  try { cdp = await page.target().createCDPSession(); await cdp.send('Accessibility.enable'); } catch (e) { cdp = null; }
  const axRead = async () => {
    if (!cdp) return null;
    try {
      const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
      const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: `[data-v3-target="${marker}"]` });
      if (!nodeId) return null;
      const { nodes } = await cdp.send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false });
      const n = nodes && nodes.find((x) => x.role && x.role.value !== 'none' && !x.ignored) || (nodes && nodes[0]);
      if (!n || n.ignored) return null;
      const props = {}; for (const p of n.properties || []) props[p.name] = p.value && p.value.value;
      return { role: n.role && n.role.value, name: n.name && n.name.value, props };
    } catch (e) { return null; }
  };

  const ax0 = await axRead();
  o.axNodeResolved = !!ax0;
  if (ax0) {
    o.axRolePresentAndExpected = !!ax0.role && ax0.role !== 'generic' && ax0.role !== 'none';
    o.axNamePresent = !!(ax0.name && String(ax0.name).trim());
    o.axNameNotFromError = !/unable to play|error|not available/i.test(String(ax0.name || ''));
    o.axStatePropertyExposed = stateKey ? (ax0.props[stateKey] !== undefined) : true;
  }
  const domState = async () => page.evaluate((m, k) => { const el = document.querySelector(`[data-v3-target="${m}"]`); return el ? el.getAttribute('aria-' + k) : null; }, marker, stateKey || 'pressed').catch(() => null);
  const dom0 = stateKey ? await domState() : null;

  // real activation
  let navigated = false; page.once('framenavigated', () => { navigated = true; });
  const reach = await H.realKeyboardReach(page, marker); const reached = reach.reached; // V3R6-MAXTAB
  if (reached) { await page.keyboard.press('Enter'); } else { await page.evaluate((m) => { const el = document.querySelector(`[data-v3-target="${m}"]`); el && el.click(); }, marker).catch(() => {}); }
  o.activationWasReal = reached;
  await H.settle(page, 80);
  o.noNavigation = !navigated;

  // a STABLE name/role defect on a resolved node is itself a sound 4.1.2 barrier.
  const nameRoleDefect = o.axNodeResolved && (!o.axNamePresent || !o.axRolePresentAndExpected);
  if (!navigated && stateKey) {
    const dom1 = await domState();
    const ax1 = await axRead();
    const domStateChanged = dom0 !== dom1;
    const axStateChanged = !!(ax0 && ax1 && String(ax0.props[stateKey]) !== String(ax1.props[stateKey]));
    o.axStateChanged = axStateChanged;
    o.axDomAgree = domStateChanged === axStateChanged && (!domStateChanged || String(dom1) === String(ax1 && ax1.props[stateKey]));
    // stability re-read
    await H.settle(page, 60);
    const ax2 = await axRead();
    o.axDiffStable = !!(ax1 && ax2 && String(ax1.props[stateKey]) === String(ax2.props[stateKey]));
    // barrier: name/role defect, OR DOM state changed but AX did not, OR a role-state never exposed
    o.nrvDefectStable = nameRoleDefect || (domStateChanged && !axStateChanged && o.axDiffStable) || (o.axNodeResolved && stateKey && !o.axStatePropertyExposed && domStateChanged);
  } else if (!navigated && !stateKey) {
    // stateless role: name+role only; vacuously satisfy the state obligations for a stateless control
    o.axStatePropertyExposed = true; o.axStateChanged = false; o.axDomAgree = true; o.axDiffStable = true;
    o.nrvDefectStable = nameRoleDefect;
  }
  if (cdp) { try { await cdp.detach(); } catch (e) {} }
  const valid = o.axNodeResolved && o.noNavigation;
  return mk(request, 'ax-state-diff', '4.1.2', o, { targetHasWidgetRole: o.targetHasWidgetRole, hydrationReady, axNodeResolved: o.axNodeResolved }, { action: 'activate-ax-diff', valid });
}

// =====================================================================================
// C9 — hover-content-tri → 1.4.13 (BARRIER-ONLY)
// =====================================================================================
async function runHoverContentTri(page, request) {
  const marker = String(request.candidateId || request.targetXpath);
  const hydrationReady = await H.hydrate(page);
  const o = { hasHoverFocusTrigger: false, triggerReachable: false, appearingContentDetected: false, contentIsAdditional: false, contentAppeared: false, anyPropertyFails: false, measurementDeterministic: false, dismissible: false, hoverable: false, persistent: false };
  const tagged = await page.evaluate(H.tagByXpath, request.targetXpath, marker).catch(() => false);
  if (!tagged) return mk(request, 'hover-content-tri', '1.4.13', o, {}, { action: 'hover-focus-tri' });

  // STATIC focusability check — never call el.focus() here: a focus listener that reveals content
  // would pollute the pristine "rest" baseline we capture next (audit follow-up).
  const trig = await page.evaluate((m) => {
    const el = document.querySelector(`[data-v3-target="${m}"]`); if (!el) return null;
    const hasTitle = el.hasAttribute('title');
    const hasDesc = el.hasAttribute('aria-describedby');
    const r = el.getBoundingClientRect();
    const focusable = el.tabIndex >= 0 || /^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(el.tagName);
    return { hasNativeTitleOnly: hasTitle && !hasDesc, hasTrigger: hasTitle || hasDesc || true, inView: r.top >= 0 && r.left >= 0 && r.bottom <= innerHeight && r.right <= innerWidth, focusable };
  }, marker).catch(() => null);
  if (!trig) return mk(request, 'hover-content-tri', '1.4.13', o, {}, { action: 'hover-focus-tri' });
  o.hasHoverFocusTrigger = trig.hasTrigger;
  o.triggerReachable = trig.inView;
  // native title= is UA-exempt
  const nativeTitleOnly = trig.hasNativeTitleOnly;

  // #2 (round-3 overfit audit) — GENERALIZED appearing-content signature. The old docSig counted ONLY a curated
  // tooltip-LIBRARY selector list ([role=tooltip],[role=status],[popover],[data-tooltip],.tooltip,.tip), so a
  // class="popover"/"card-flyout"/class-less JS-toggled div or a pure CSS :hover reveal never incremented ⇒
  // contentAppeared stayed false ⇒ the dismissible/hoverable/persistent tri-probe was silently skipped — a
  // condition fitted to tooltip libraries, not the 1.4.13 rule. Now: MARK every element's rest-state visibility
  // once (pristine — before any hover/focus), then measure the WHOLE-DOCUMENT delta of elements whose effective
  // visibility flipped hidden→shown (or that were created) and that bear non-trivial text/geometry. Only the
  // TOPMOST flipped element of an appeared region counts (a revealed subtree must not inflate the signature).
  // Scalar shape (count*1e6 + textLen) is kept so the tri-probe comparisons below are unchanged. The curated
  // selector list survives ONLY as a tip-binding PRIORITY (below), never as a gate.
  const markRest = () => {
    for (const el of document.querySelectorAll('body *')) {
      const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
      el.__v3HoverRestVis = cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0 && r.width > 1 && r.height > 1;
    }
  };
  const appearedSig = () => {
    let s = 0, t = 0;
    for (const el of document.querySelectorAll('body *')) {
      const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
      const vis = cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0 && r.width > 1 && r.height > 1;
      if (!vis || el.__v3HoverRestVis === true) continue;              // not shown, or already visible at rest
      const p = el.parentElement;                                      // topmost flipped only: parent was rest-visible (or <body>)
      if (p && p !== document.body && p.__v3HoverRestVis !== true) continue;
      const txt = (el.textContent || '').replace(/\s+/g, ' ').trim();  // non-trivial: own text, or geometry able to carry meaning
      if (!(txt.length > 0 || (r.width >= 16 && r.height >= 16))) continue;
      s++; t += txt.length;
    }
    return s * 1e6 + t;
  };
  await page.evaluate(markRest);
  const rest = await page.evaluate(appearedSig); // pristine — captured before any hover/focus (0 unless the page self-mutates)
  // hover
  const box = await page.evaluate((m) => { const el = document.querySelector(`[data-v3-target="${m}"]`); const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, marker);
  await page.mouse.move(box.x, box.y); await H.settle(page, 200);
  let shown = await page.evaluate(appearedSig);
  let revealMode = shown > rest ? 'hover' : null;
  // #2 FOCUS PATH: SC 1.4.13 is content on hover OR FOCUS — mirror the hover probe with a real focus + settle
  // when hovering revealed nothing and the trigger is focusable. Focus is applied only AFTER the rest baseline
  // and the hover attempt, so the pristine-baseline invariant above still holds.
  if (!revealMode && trig.focusable) {
    await page.mouse.move(2, 2); await H.settle(page, 100); // park the pointer away: isolate the focus channel
    await page.evaluate((m) => { const el = document.querySelector(`[data-v3-target="${m}"]`); el && el.focus(); }, marker).catch(() => {});
    await H.settle(page, 200);
    const focused = await page.evaluate(appearedSig);
    if (focused > rest) { revealMode = 'focus'; shown = focused; }
  }
  const hovered = shown; // the revealed-state signature (hover- or focus-triggered)
  o.appearingContentDetected = hovered > rest;
  o.contentAppeared = hovered > rest;
  o.contentIsAdditional = (hovered > rest) && !nativeTitleOnly;
  o.measurementDeterministic = true;

  if (o.contentAppeared && o.contentIsAdditional) {
    // bind the ACTUAL appearing content region — the flipped element(s) themselves, found by the same rest-mark
    // delta (#2: the curated tooltip selectors only PRIORITIZE which flipped region binds as "the tip"; they
    // never gate) — and decide whether it OBSCURES/REPLACES other content — 1.4.13 EXEMPTS Dismissible when it
    // does not (audit V3R2-H5).
    const tip = await page.evaluate(() => {
      const flipped = [];
      for (const el of document.querySelectorAll('body *')) {
        const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
        const vis = cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0 && r.width > 1 && r.height > 1;
        if (!vis || el.__v3HoverRestVis === true) continue;
        const p = el.parentElement;
        if (p && p !== document.body && p.__v3HoverRestVis !== true) continue;
        const txt = (el.textContent || '').replace(/\s+/g, ' ').trim();
        if (!(txt.length > 0 || (r.width >= 16 && r.height >= 16))) continue;
        flipped.push(el);
      }
      if (!flipped.length) return null;
      const PRIO = '[role="tooltip"],[role="status"],[popover],[data-tooltip],.tooltip,.tip';
      const tipEl = flipped.find((e) => { try { return e.matches(PRIO); } catch (err) { return false; } })
        || flipped.sort((a, b) => { const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect(); return rb.width * rb.height - ra.width * ra.height; })[0];
      const tr = tipEl.getBoundingClientRect();
      let obscures = false;
      for (const el of document.body.querySelectorAll('*')) {
        if (el === tipEl || tipEl.contains(el) || el.contains(tipEl)) continue;
        const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        let ownText = false; for (const n of el.childNodes) if (n.nodeType === 3 && n.textContent.trim()) ownText = true;
        if (!ownText) continue;
        const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue;
        if (!(tr.right <= r.left || tr.left >= r.right || tr.bottom <= r.top || tr.top >= r.bottom)) { obscures = true; break; }
      }
      return { cx: tr.left + tr.width / 2, cy: tr.top + tr.height / 2, obscures };
    }).catch(() => null);
    const dismissExempt = !!tip && !tip.obscures; // exempt when the content obscures/replaces nothing

    // re-show via the channel that actually revealed (hover OR focus — #2 focus path).
    const reshow = async () => {
      if (revealMode === 'focus') {
        await page.evaluate((m) => { const el = document.querySelector(`[data-v3-target="${m}"]`); el && el.blur && el.blur(); }, marker).catch(() => {});
        await H.settle(page, 90);
        await page.evaluate((m) => { const el = document.querySelector(`[data-v3-target="${m}"]`); el && el.focus(); }, marker).catch(() => {});
        await H.settle(page, 220);
      } else {
        await page.mouse.move(2, 2); await H.settle(page, 90);
        await page.mouse.move(box.x, box.y); await H.settle(page, 220);
      }
      return page.evaluate(appearedSig);
    };
    // Persistent: still present after a dwell while still hovered/focused?
    await H.settle(page, 1600);
    o.persistent = (await page.evaluate(appearedSig)) >= hovered;
    // Hoverable: 1.4.13's Hoverable condition applies to POINTER-hover-triggered content only. In focus mode we
    // are here precisely BECAUSE hover revealed nothing, so pointer hover cannot trigger it ⇒ vacuously satisfied
    // (never a manufactured barrier — the lane is BARRIER-ONLY, so a vacuous pass only prevents a false positive).
    if (revealMode === 'focus') {
      o.hoverable = true;
    } else {
      // re-show, then move the pointer to the ACTUAL content region; it must survive.
      const shown1 = await reshow();
      if (tip) { await page.mouse.move((box.x + tip.cx) / 2, (box.y + tip.cy) / 2); await page.mouse.move(tip.cx, tip.cy); } else { await page.mouse.move(box.x, box.y + 8); }
      await H.settle(page, 150);
      o.hoverable = shown1 > rest && (await page.evaluate(appearedSig)) >= shown1;
    }
    // Dismissible LAST (it hides the content). Exempt when the content obscures nothing.
    const shown2 = await reshow();
    await page.keyboard.press('Escape'); await H.settle(page, 100);
    o.dismissible = dismissExempt || (await page.evaluate(appearedSig)) < shown2;
    o.anyPropertyFails = (o.persistent === false) || (o.hoverable === false) || (o.dismissible === false);
  }
  // clean the rest-visibility marks (mirror the form-probe PRE cleanup — leave no probe residue on the page)
  await page.evaluate(() => { for (const el of document.querySelectorAll('body *')) { try { delete el.__v3HoverRestVis; } catch (e) {} } }).catch(() => {});
  const valid = o.contentAppeared && o.contentIsAdditional && o.measurementDeterministic;
  return mk(request, 'hover-content-tri', '1.4.13', o, { hasHoverFocusTrigger: o.hasHoverFocusTrigger, triggerReachable: o.triggerReachable }, { action: 'hover-focus-tri', valid, measurement: { rest, hovered, nativeTitleOnly, revealMode } });
}

// =====================================================================================
// C4 — non-text-contrast → 1.4.11 (UI components + graphical objects). Fills the producer the
// non-text-contrast-v0 rubric assumed existed (oracle: "No deterministic 1.4.11 runner exists").
// CLEAR/BARRIER only when the strongest distinguishing cue + its adjacent surface reduce to two flat
// opaque colours; otherwise INACTIVE/default-UA ⇒ INAPPLICABLE, and graphical/state-indicator/gradient/
// pseudo/sub-part ⇒ in-scope but not flat-reducible ⇒ auto-PARTIAL (the rubric judges the pixels).
async function runNonTextContrast(page, request) {
  const marker = String(request.candidateId || request.targetXpath);
  const o = { inScopeComponent: false, cueReducible: false, contrastComputed: false, thresholdMet: false, thresholdFailed: false };
  const hydrationReady = await H.hydrate(page);
  const tagged = await page.evaluate(H.tagByXpath, request.targetXpath, marker).catch(() => false);
  if (!tagged) return mk(request, 'non-text-contrast', '1.4.11', o, { hydrationReady }, { action: 'inspect-non-text-contrast' });
  const facts = await page.evaluate(NTC.collectNonTextFacts, `[data-v3-target="${marker}"]`, { focusState: false }).catch(() => null);
  const d = NTC.disposeFromFacts(facts, { focusState: false });
  let valid = false;
  if (facts && facts.found) {
    valid = true;
    if (d.exempt) { /* inactive/default-UA/decorative ⇒ out of 1.4.11 scope ⇒ inScopeComponent stays false ⇒ INAPPLICABLE */ }
    else if (d.decided && (d.verdict === 'pass' || d.verdict === 'fail')) {
      o.inScopeComponent = true; o.cueReducible = true; o.contrastComputed = true;
      o.thresholdMet = d.verdict === 'pass'; o.thresholdFailed = d.verdict === 'fail';
    } else { o.inScopeComponent = true; } // abstain ⇒ in-scope but not flat-reducible ⇒ auto-PARTIAL
  }
  return mk(request, 'non-text-contrast', '1.4.11', o,
    { component: (facts && facts.role) || null, exempt: !!(d && d.exempt), exemptReason: (d && d.exemptReason) || null, hydrationReady },
    { action: 'inspect-non-text-contrast', valid, measurement: { ratio: (d && d.ratio) || null, cue: (d && d.cue) || null, adjacent: (d && d.adjacent) || null, threshold: NTC.THRESHOLD, reason: (d && (d.reason || d.uncertainReason)) || null } });
}

// =====================================================================================
// C8 — small deterministic signals (one shared runner, dispatched by experimentId → aspect).
// Each wraps small-signals.js detectSignal: a clear deterministic verdict (fail = BARRIER / pass = NO_BARRIER)
// or an abstain (the semantic residual ⇒ auto-PARTIAL, judged by the matching rubric). signalApplicable is set
// whenever the element resolved + the signal ran, so an abstain falls to PARTIAL, not INAPPLICABLE.
// =====================================================================================
const SS_ASPECT = { 'glyph-text-alt': 'glyph-substitution', 'long-desc-presence': 'long-description-presence', 'multipart-grouping': 'multipart-field-grouping', 'positive-tabindex': 'positive-tabindex-f44' };
const SS_SC = { 'glyph-text-alt': '1.1.1', 'long-desc-presence': '1.1.1', 'multipart-grouping': '4.1.2', 'positive-tabindex': '2.4.3' };
async function runSmallSignalExp(page, request) {
  const marker = String(request.candidateId || request.targetXpath);
  const aspect = SS_ASPECT[request.experimentId];
  const sc = SS_SC[request.experimentId] || request.sc;
  const o = { signalApplicable: false, barrierConfirmed: false, passConfirmed: false };
  const hydrationReady = await H.hydrate(page);
  const tagged = await page.evaluate(H.tagByXpath, request.targetXpath, marker).catch(() => false);
  if (!tagged) return mk(request, request.experimentId, sc, o, { hydrationReady }, { action: 'small-signal:' + aspect });
  const r = await SS.runSmallSignal(page, { aspect, targetSelector: `[data-v3-target="${marker}"]` }).catch(() => null);
  let valid = false;
  if (r && r.reason !== 'not-found') {
    valid = true; o.signalApplicable = true; // the element resolved + the signal ran (decide or abstain)
    if (r.verdict === 'fail') o.barrierConfirmed = true;
    else if (r.verdict === 'pass') o.passConfirmed = true;
    // abstain ⇒ neither ⇒ auto-PARTIAL (the rubric judges the semantic residual)
  }
  return mk(request, request.experimentId, sc, o, { aspect, hydrationReady }, { action: 'small-signal:' + aspect, valid, measurement: { aspect, reason: (r && (r.reason || r.uncertainReason)) || null } });
}

// =====================================================================================
// C2 — composite-widget arrow-key trap → 2.1.2. Complements keyboard-trap-escape (which tests Tab/Shift+Tab/Esc/
// advised-key but never drives ARROW keys): a roving-tabindex composite widget can let Tab leave from its tab stop
// yet trap focus once an ARROW has moved to an inner item. Implemented as a sibling family (not folded into the
// audited runKeyboardTrapEscape) so the existing 2.1.2 contract is untouched; the two cover distinct mechanisms.
// =====================================================================================
async function runCompositeArrowTrap(page, request) {
  const marker = String(request.candidateId || request.targetXpath);
  const o = { isCompositeWidget: false, widgetTrapBarrier: false, widgetEscapes: false };
  const hydrationReady = await H.hydrate(page);
  const tagged = await page.evaluate(H.tagByXpath, request.targetXpath, marker).catch(() => false);
  if (!tagged) return mk(request, 'composite-arrow-trap', '2.1.2', o, { hydrationReady }, { action: 'arrow-key-trap' });
  // roving-tabindex ⇒ enter via a focusable inner item (the active descendant), not the container.
  const itemTagged = await page.evaluate((m) => {
    const w = document.querySelector(`[data-v3-target="${m}"]`); if (!w) return false;
    const item = w.querySelector('[role=menuitem],[role=menuitemcheckbox],[role=menuitemradio],[role=tab],[role=option],[role=treeitem],[role=row],[role=gridcell],[role=radio],button,a[href],[tabindex]') || w;
    item.setAttribute('data-v3-arrow-item', '1'); return true;
  }, marker).catch(() => false);
  o.isCompositeWidget = true;
  const r = itemTagged ? await RV.runReveal(page, { aspect: 'arrow-key-composite-widget-trap', triggerSelector: '[data-v3-arrow-item="1"]', revealedSelector: `[data-v3-target="${marker}"]`, interaction: 'focus' }).catch(() => null) : null;
  let valid = false;
  if (r && r.decided) { valid = true; if (r.verdict === 'fail') o.widgetTrapBarrier = true; else if (r.verdict === 'pass') o.widgetEscapes = true; }
  return mk(request, 'composite-arrow-trap', '2.1.2', o, { isCompositeWidget: true, hydrationReady }, { action: 'arrow-key-trap', valid, measurement: { reason: (r && r.reason) || null } });
}

const RUNNERS = {
  'text-contrast-pixel': runTextContrastPixel,
  'field-label-probe': runFieldLabelProbe,
  'form-error-probe': runFormErrorProbe,
  'reflow-overflow-probe': runReflowOverflowProbe,
  'focus-obscured-barrier': runFocusObscuredBarrier,
  'keyboard-trap-escape': runKeyboardTrapEscape,
  'keyboard-activation': runKeyboardActivation,
  'ax-state-diff': runAxStateDiff,
  'hover-content-tri': runHoverContentTri,
  'non-text-contrast': runNonTextContrast,
  'glyph-text-alt': runSmallSignalExp,
  'long-desc-presence': runSmallSignalExp,
  'multipart-grouping': runSmallSignalExp,
  'positive-tabindex': runSmallSignalExp,
  'composite-arrow-trap': runCompositeArrowTrap,
};

module.exports = { RUNNERS, measureContrast, measureFieldLabel, measureReflow, measureObscured };
