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

// ---- T3: target-size (WCAG 2.5.8, AA, 24px) WITH the standard exceptions ----
// box: {w,h}; opts: { display, isInline, nearestTargetCenterDist, essential }
// Exceptions per 2.5.8: Spacing (a 24px circle on each undersized target does not
// intersect another target's circle => centre-to-centre >= 24), Inline (target in
// a sentence / constrained by line-height), Essential, and User-agent default
// (not modelled). Returns { passes, reason, minDim }.
const TARGET_MIN = 24;
function evalTargetSize(box, opts = {}) {
  const w = box ? box.w : 0, h = box ? box.h : 0;
  const minDim = Math.min(w, h);
  if (!(w > 0) || !(h > 0)) return { passes: true, reason: 'zero-size/hidden — not a rendered target', minDim };
  if (w >= TARGET_MIN && h >= TARGET_MIN) return { passes: true, reason: 'meets 24x24', minDim };
  if (opts.essential) return { passes: true, reason: 'essential exception', minDim };
  if (opts.isInline || opts.display === 'inline') return { passes: true, reason: 'inline exception (in text flow)', minDim };
  const d = opts.nearestTargetCenterDist;
  if (typeof d === 'number' && d >= TARGET_MIN) return { passes: true, reason: `spacing exception (nearest target ${Math.round(d)}px >= 24)`, minDim };
  return { passes: false, reason: `${w}x${h}px below 24x24` + (typeof d === 'number' ? `, nearest target ${Math.round(d)}px < 24` : ''), minDim };
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
  if (respondedToSyntheticKey || respondsToArrows) return { operable: true, confident: false, reason: 'responded to a synthetic key (handlers present)' };
  if (focusable === false && reachedByTab === false) return { operable: false, confident: false, reason: 'not focusable and not reached by Tab — likely not keyboard operable (verify on live page)' };
  return { operable: null, confident: false, reason: 'no keyboard response observed, but only synthetic events were available on an offline snapshot — indeterminate (PARTIAL)' };
}

// ---- T1/T8: focus-indicator decision from multiple signals ----
// Combine the (possibly unreliable) screenshot diff with the authoritative
// computed-while-focused / forced-:focus-visible outline. A non-`none` outline or
// a box-shadow read WHILE the element is in its focus-visible state is positive
// evidence of a ring even when the pixel diff is 0 (wrong-crop) or below the
// area-dependent threshold. Returns { present, basis, adequateDiff }.
function focusRingDecision({ diffPct, cropValid, focusedOutline, focusedBoxShadow, forcedDiffPct }) {
  const outlinePresent = !!focusedOutline && !/^\s*none/i.test(focusedOutline) && !/\s0px\s/.test(' ' + focusedOutline + ' ');
  const shadowPresent = !!focusedBoxShadow && focusedBoxShadow !== 'none';
  const computedRing = outlinePresent || shadowPresent;
  // forced-:focus-visible screenshot diff is the most reliable visual signal
  if (typeof forcedDiffPct === 'number' && forcedDiffPct >= 1.5) return { present: true, basis: 'forced-focus-visible-diff', adequateDiff: true };
  if (cropValid && typeof diffPct === 'number' && diffPct >= 1.5) return { present: true, basis: 'tab-diff', adequateDiff: true };
  if (computedRing) return { present: true, basis: 'computed-while-focused-outline', adequateDiff: false };
  // crop invalid AND no computed ring AND no usable diff => cannot conclude absence
  if (!cropValid && !(typeof forcedDiffPct === 'number')) return { present: null, basis: 'indeterminate (no valid crop, no forced diff)', adequateDiff: false };
  return { present: false, basis: (typeof forcedDiffPct === 'number') ? 'forced-focus-visible-diff~0' : 'tab-diff~0 and no computed ring', adequateDiff: false };
}

// ---- T14: known third-party cookie/consent overlay containers ----
// Hidden before collection so they don't darken every screenshot or inject
// duplicate headings into the structure / forms inventory.
const CONSENT_SELECTORS = [
  '#onetrust-banner-sdk', '#onetrust-consent-sdk', '.onetrust-pc-dark-filter',
  '#ot-sdk-container', '.cmplz-cookiebanner', '#cmplz-cookiebanner-container',
  '#cookie-banner', '#cookie-consent', '[id*="cookie-banner" i]', '[class*="cookie-banner" i]',
  '[id*="cookieConsent" i]', '[class*="cookie-consent" i]', '[aria-label*="cookie" i][role="dialog"]',
  '#truste-consent-track', '.qc-cmp2-container', '#usercentrics-root', '#CybotCookiebotDialog',
  '[class*="consent-banner" i]', '[id*="gdpr" i]',
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
