// Shared pure helpers for the parallel skills evaluation harness.
//
// These are deliberately side-effect-free (no DOM, no puppeteer) so they can be
// unit-tested in isolation (scripts/tests/unit.test.js) and reused by both
// eval-page.js (static collector) and drive-page.js (dynamic driver). Each
// function fixes a specific harness issue catalogued in
// eval-results/HARNESS-ISSUES.md (referenced by Txx tags below).

'use strict';

// ---- contrast (WCAG relative luminance) ----
function relLuminance([r, g, b]) {
  const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrastRatio(rgb1, rgb2) {
  const a = relLuminance(rgb1), b = relLuminance(rgb2);
  const hi = Math.max(a, b), lo = Math.min(a, b);
  return +((hi + 0.05) / (lo + 0.05)).toFixed(2);
}
function parseRGB(s) {
  const m = (s || '').match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const p = m[1].split(',').map(x => parseFloat(x.trim()));
  return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
}

// ---- T4: WCAG "large text" classification + contrast threshold ----
// WCAG 1.4.3: large = >=18pt (24px) normal-weight OR >=14pt (18.66px) bold (>=700).
// The previous harness used `fontPx>=18.66 || (fontPx>=14 && bold)` — BOTH bands
// too lenient (18.66px is 14pt not 18pt; 14px is not 14pt). Fixed here.
const PT_TO_PX = 96 / 72; // 1.3333
const LARGE_NORMAL_PX = 18 * PT_TO_PX;   // 24
const LARGE_BOLD_PX = 14 * PT_TO_PX;     // 18.6667
function isLargeText(fontPx, fontWeight) {
  const fw = parseInt(fontWeight, 10) || 400;
  if (!(fontPx > 0)) return false;
  return fontPx >= LARGE_NORMAL_PX || (fontPx >= LARGE_BOLD_PX && fw >= 700);
}
function contrastThresholdFor(fontPx, fontWeight) {
  return isLargeText(fontPx, fontWeight) ? 3.0 : 4.5;
}

// ---- T3 / C4: target-size (WCAG 2.5.8, AA, 24px) with the NORMATIVE geometry ----
// box: {x,y,w,h}; opts: { essential, inSentence, neighbors:[{x,y,w,h}] }.
// Pass iff: >=24x24, OR essential, OR a *semantic* inline exception (in a sentence /
// line-height-constrained — `inSentence`, NOT raw display:inline), OR the Spacing
// exception: a 24px-diameter circle centred on the target does not intersect another
// TARGET's rectangle, nor another undersized target's 24px circle
// (https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html). Center-to-
// center distance alone is insufficient — a large neighbour can be intersected despite
// a >=24px centre gap. Returns { passes, reason, minDim }.
const TARGET_MIN = 24;
const TARGET_R = 12; // radius of the 24px-diameter circle
function _circleRectIntersect(cx, cy, r, rect) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nx, dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}
function _circleCircleIntersect(cx1, cy1, r1, cx2, cy2, r2) {
  const dx = cx1 - cx2, dy = cy1 - cy2;
  return dx * dx + dy * dy < (r1 + r2) * (r1 + r2);
}
function evalTargetSize(box, opts = {}) {
  const w = box ? box.w : 0, h = box ? box.h : 0;
  const minDim = Math.min(w, h);
  if (!(w > 0) || !(h > 0)) return { passes: true, reason: 'zero-size/hidden — not a rendered target', minDim };
  if (w >= TARGET_MIN && h >= TARGET_MIN) return { passes: true, reason: 'meets 24x24', minDim };
  if (opts.essential) return { passes: true, reason: 'essential exception', minDim };
  if (opts.inSentence) return { passes: true, reason: 'inline exception (in a sentence / line-height-constrained)', minDim };
  const neighbors = Array.isArray(opts.neighbors) ? opts.neighbors : null;
  if (neighbors) {
    const cx = (box.x || 0) + w / 2, cy = (box.y || 0) + h / 2;
    let intersected = null;
    for (const n of neighbors) {
      if (!n || !(n.w > 0) || !(n.h > 0)) continue;
      const ncx = n.x + n.w / 2, ncy = n.y + n.h / 2;
      const undersized = Math.min(n.w, n.h) < TARGET_MIN;
      const hit = _circleRectIntersect(cx, cy, TARGET_R, n) ||
        (undersized && _circleCircleIntersect(cx, cy, TARGET_R, ncx, ncy, TARGET_R));
      if (hit) { intersected = n; break; }
    }
    if (!intersected) return { passes: true, reason: 'spacing exception (24px circle clears all adjacent targets)', minDim };
    return { passes: false, reason: `${w}x${h}px below 24x24; 24px circle intersects an adjacent target`, minDim };
  }
  // no neighbour geometry supplied → cannot prove the spacing exception
  return { passes: false, reason: `${w}x${h}px below 24x24 (spacing exception unproven — no neighbour geometry)`, minDim, indeterminateSpacing: true };
}

// ---- T9: filter virtual-SR "noise" phrases that are not real element announcements
// After click-induced navigation / a Pass-B reload the VSR cursor lands on the
// document root and lastSpokenPhrase() returns "document" (or a bare landmark),
// which must NOT be recorded as an element's announcement.
// Only unambiguous landmark/root words a real control would never carry as its
// whole accessible name. 'search'/'form'/'region'/'article' are intentionally
// excluded — they collide with legitimate control names (e.g. a "Search" button).
const VSR_ROOT_PHRASES = new Set([
  'document', 'main', 'banner', 'navigation', 'complementary', 'contentinfo',
  'end of document', 'end of main',
]);
function isVsrNoisePhrase(phrase) {
  if (!phrase) return true;
  const p = String(phrase).trim().toLowerCase();
  if (!p) return true;
  if (VSR_ROOT_PHRASES.has(p)) return true;
  if (/^end of /.test(p)) return true;
  return false;
}
// T9/T10: a phrase is a *meaningful* announcement only if it is non-noise AND
// differs from the baseline phrase captured before the action (sticky/stale guard).
function meaningfulAnnouncement(after, before) {
  if (isVsrNoisePhrase(after)) return null;
  if (before != null && String(after).trim() === String(before).trim()) return null;
  return after;
}

// ---- T12: offline media artifacts ----
// Browser fallback names that are NOT author-supplied (video/audio failed to load
// headless/offline) — must not be trusted as the element's accessible name.
function isMediaErrorName(name) {
  if (!name) return false;
  return /unable to play media|no compatible source|the media could not be loaded|video format or mime type is not supported|invalid (source|media)/i.test(String(name));
}
// A screenshot crop is an unusable "black/blank frame" (paused video, missing
// asset) when nearly all sampled pixels share one near-uniform very-dark colour.
// stats: { meanLuma (0..255), stdLuma, darkFraction (0..1) }
function isBlankFrame(stats) {
  if (!stats) return false;
  const { meanLuma, stdLuma, darkFraction } = stats;
  return (meanLuma != null && meanLuma <= 16 && stdLuma != null && stdLuma <= 6) ||
    (darkFraction != null && darkFraction >= 0.985 && stdLuma != null && stdLuma <= 8);
}

// ---- T2: roving-tabindex / composite-widget keyboard reasoning ----
const COMPOSITE_ROLES = new Set(['tab', 'menuitem', 'menuitemradio', 'menuitemcheckbox', 'option', 'radio', 'treeitem', 'gridcell']);
// In a roving-tabindex widget only the ACTIVE item is in the Tab sequence; the
// rest carry tabindex="-1" and are reached by arrow keys. So "not reached by Tab"
// is EXPECTED for such items and must not be reported as a 2.1.1 keyboard failure.
function isRovingTabindexItem(role, tabindex) {
  return COMPOSITE_ROLES.has(role) && String(tabindex) === '-1';
}
// Decide a keyboard-operability signal for a custom (non-native) widget given what
// the (synthetic) probes saw. Returns { operable: true|false|null, confident, reason }.
// null operable => "could not determine" (=> agent should record PARTIAL, not a
// confident REPRODUCED), which is the honest outcome when the only evidence is
// synthetic events on an offline snapshot whose handlers may not be wired.
function keyboardOperabilitySignal({ role, tabindex, reachedByTab, respondedToSyntheticKey, respondsToArrows, focusable }) {
  if (isRovingTabindexItem(role, tabindex)) {
    if (respondsToArrows) return { operable: true, confident: true, reason: 'roving-tabindex item operated by arrow keys' };
    return { operable: null, confident: false, reason: 'roving-tabindex item: not Tab-reachable BY DESIGN; arrow operation could not be confirmed via synthetic events on this snapshot' };
  }
  if (reachedByTab && respondedToSyntheticKey) return { operable: true, confident: true, reason: 'reached by Tab and responded to Enter/Space' };
  if (respondedToSyntheticKey || respondsToArrows) return { operable: true, confident: false, reason: 'responded to a key (handlers present)' };
  // A non-focusable, non-Tab-reached element is operable:false ONLY when it is NOT a
  // composite-role widget — for a tab/option/menuitem the missing tabindex is usually
  // wired by the app's JS (roving), which an un-hydrated offline snapshot won't run, so
  // we stay indeterminate rather than assert a confident failure (C3 refinement).
  if (focusable === false && reachedByTab === false && !COMPOSITE_ROLES.has(role))
    return { operable: false, confident: false, reason: 'not focusable and not reached by Tab — likely not keyboard operable (verify on live page)' };
  return { operable: null, confident: false, reason: 'no keyboard response observed, but only limited/snapshot evidence was available — indeterminate (PARTIAL)' };
}

// ---- T1/T8/H1: focus-indicator decision, prioritising REAL keyboard focus ----
// The indicator must be (a) FOCUS-DEPENDENT (differs between unfocused and focused —
// an always-on outline/shadow does NOT count) and (b) visually present. Real-keyboard
// pixel change is primary; forced :focus-visible + computed-style change are
// corroboration, never an independent proof (per the audit, H1). Conflicting signals
// or an unvalidated crop with no forced read => null (PARTIAL).
// Inputs:
//   realTabDiffPct, realTabCropValid  — unfocused vs real-keyboard-focused pixel diff
//   unfocusedOutline/focusedOutline, unfocusedBoxShadow/focusedBoxShadow — computed
//   forcedDiffPct                     — forced :focus-visible screenshot diff (corrob.)
// Returns { present:true|false|null, basis, focusDependentComputed }.
const VIS = 1.5; // visible-change threshold (%); spatial measure is preferred upstream
function _nonNone(s) { return !!s && !/^\s*none/i.test(s) && !/(^|\s)0px(\s|$)/.test(s); }
// A computed outline that actually RENDERS: a real line style with non-zero width
// (so "none 3px ..." and "solid 0px ..." don't count, but "auto 1px"/"solid 2px" do).
function _visibleOutlineStyle(s) {
  if (!s) return false;
  const style = String(s).trim().split(/\s+/)[0].toLowerCase();
  if (style === 'none' || style === 'hidden') return false;
  if (/(^|\s)0px(\s|$)/.test(s)) return false;
  return /^(auto|solid|dashed|dotted|double|groove|ridge|inset|outset)$/.test(style);
}
function focusRingDecision(opts = {}) {
  // accept both new and legacy field names for a soft migration
  const realTabDiffPct = opts.realTabDiffPct != null ? opts.realTabDiffPct : opts.diffPct;
  const realTabCropValid = opts.realTabCropValid != null ? opts.realTabCropValid : opts.cropValid;
  const fOut = opts.focusedOutline, uOut = opts.unfocusedOutline;
  const fSh = opts.focusedBoxShadow, uSh = opts.unfocusedBoxShadow;
  const forcedDiffPct = opts.forcedDiffPct;

  // Outline focus-dependence is "strong" only when the focused outline is a real
  // rendered line AND differs from unfocused — this both kills the always-on case
  // and lets an off-screen `none→auto/solid` change stand without a pixel diff.
  const outlineFocusDependent = _visibleOutlineStyle(fOut) && (uOut == null || fOut !== uOut);
  const shadowFocusDependent = (!!fSh && fSh !== 'none') && (uSh == null || fSh !== uSh);
  const focusDependentComputed = outlineFocusDependent || shadowFocusDependent;

  const realChange = realTabCropValid && typeof realTabDiffPct === 'number' && realTabDiffPct >= VIS;
  const realNoChange = realTabCropValid && typeof realTabDiffPct === 'number' && realTabDiffPct < VIS;
  const forcedChange = typeof forcedDiffPct === 'number' && forcedDiffPct >= VIS;

  // 1) Real keyboard focus produced a visible change.
  if (realChange) return { present: true, basis: focusDependentComputed ? 'real-keyboard-diff+computed' : 'real-keyboard-diff (verify not animation)', focusDependentComputed };
  // 2) Real keyboard focus produced NO visible change.
  if (realNoChange) {
    if (focusDependentComputed) return { present: null, basis: 'conflict: computed ring changed but real pixels did not (likely clipped/wrong-crop)', focusDependentComputed };
    return { present: false, basis: 'real-keyboard: no focus-dependent change', focusDependentComputed };
  }
  // 3) No valid real-keyboard crop → forced pixel diff + computed (corroboration).
  if (forcedChange && focusDependentComputed) return { present: true, basis: 'forced-focus-visible-diff + computed (real crop unavailable)', focusDependentComputed };
  // 3b) No usable pixel diff at all, but the forced computed OUTLINE became a real,
  // focus-dependent rendered line (none→auto/solid) — sufficient for 2.4.7 even
  // off-screen (an outline with a real style + width always renders).
  if (outlineFocusDependent) return { present: true, basis: 'forced computed outline focus-dependent (none→visible style; no pixel crop)', focusDependentComputed };
  if (typeof forcedDiffPct === 'number' && !forcedChange && !focusDependentComputed) return { present: false, basis: 'forced-focus-visible: no focus-dependent change', focusDependentComputed };
  // shadow-only focus-dependence without pixels can't be confirmed visible → PARTIAL
  if (shadowFocusDependent) return { present: null, basis: 'conflict: focus-dependent box-shadow but no pixel confirmation of visibility', focusDependentComputed };
  return { present: null, basis: 'indeterminate (no valid crop, no forced diff, no focus-dependent computed change)', focusDependentComputed };
}

// ---- T14: known third-party cookie/consent overlay containers ----
// Hidden before collection so they don't darken every screenshot or inject
// duplicate headings into the structure / forms inventory.
const CONSENT_SELECTORS = [
  // OneTrust (banner + preference center)
  '#onetrust-banner-sdk', '#onetrust-consent-sdk', '#onetrust-pc-sdk', '.onetrust-pc-dark-filter', '#ot-sdk-container',
  // Complianz, TrustArc, Quantcast, Usercentrics, Cookiebot, Sourcepoint, Didomi, Osano
  '.cmplz-cookiebanner', '#cmplz-cookiebanner-container', '#truste-consent-track', '#truste-consent-content',
  '.qc-cmp2-container', '.qc-cmp-cleanslate', '#usercentrics-root', '#CybotCookiebotDialog',
  '[id^="sp_message_container"]', '#onetrust-pc-sdk', '#didomi-host', '.osano-cm-window', '.osano-cm-dialog',
  // generic
  '#cookie-banner', '#cookie-consent', '[id*="cookie-banner" i]', '[class*="cookie-banner" i]',
  '[id*="cookieConsent" i]', '[class*="cookie-consent" i]', '[class*="consent-banner" i]',
  '[aria-label*="cookie" i][role="dialog"]', '[aria-label*="consent" i][role="dialog"]', '[id*="gdpr" i]',
];

module.exports = {
  relLuminance, contrastRatio, parseRGB,
  isLargeText, contrastThresholdFor, LARGE_NORMAL_PX, LARGE_BOLD_PX,
  evalTargetSize, TARGET_MIN,
  isVsrNoisePhrase, meaningfulAnnouncement,
  isMediaErrorName, isBlankFrame,
  isRovingTabindexItem, keyboardOperabilitySignal, COMPOSITE_ROLES,
  focusRingDecision,
  CONSENT_SELECTORS,
};
