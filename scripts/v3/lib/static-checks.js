// ACT-REST expansion (Round 1) — PURE, browser-free decision logic for the five static-deterministic
// SCs. Each function takes already-extracted DOM facts (strings / numbers the collector or runner read
// in-page) and returns a typed verdict. Kept separate from exp-runners.js so the spec grammar/thresholds
// are unit-testable without Chrome, and so the "unrecognized value ⇒ fail" anti-overfit guards (the axe
// blind spots the plan calls out) live in one audited place.
//
// SOUNDNESS STANCE: these reproduce the ACT rule / WCAG threshold verbatim, NOT the checkers' measured
// gaps (axe passes user-scalable=invalid + misses px line-height; we compare actual values to thresholds
// and default an unrecognized token to FAIL). Every branch is keyed to the spec, not the fixtures.
'use strict';

// ============================================================================================
// SC 1.3.5 — autocomplete has a valid value (ACT 73f2c2)
// ============================================================================================
// The FULL WHATWG "autofill field name" table (HTML Living Standard §autofill), transcribed in full so
// a plausible-but-invalid token that is not in ANY fixture (e.g. "banner") still fails — the partial-table
// trap the plan warns about (§3). Do NOT prune to the fixture tokens.
const AUTOFILL_FIELD_NAMES = new Set([
  'name', 'honorific-prefix', 'given-name', 'additional-name', 'family-name', 'honorific-suffix',
  'nickname', 'username', 'new-password', 'current-password', 'one-time-code', 'organization-title',
  'organization', 'street-address', 'address-line1', 'address-line2', 'address-line3', 'address-level4',
  'address-level3', 'address-level2', 'address-level1', 'country', 'country-name', 'postal-code',
  'cc-name', 'cc-given-name', 'cc-additional-name', 'cc-family-name', 'cc-number', 'cc-exp',
  'cc-exp-month', 'cc-exp-year', 'cc-csc', 'cc-type', 'transaction-currency', 'transaction-amount',
  'language', 'bday', 'bday-day', 'bday-month', 'bday-year', 'sex', 'url', 'photo',
  'tel', 'tel-country-code', 'tel-national', 'tel-area-code', 'tel-local', 'tel-local-prefix',
  'tel-local-suffix', 'tel-extension', 'email', 'impp',
]);
// Field names that MAY be preceded by a contact-type modifier (home|work|mobile|fax|pager) per the spec.
// A modifier before any OTHER field name (e.g. "work photo") is invalid.
const CONTACT_FIELD_NAMES = new Set([
  'tel', 'tel-country-code', 'tel-national', 'tel-area-code', 'tel-local', 'tel-local-prefix',
  'tel-local-suffix', 'tel-extension', 'email', 'impp',
]);
const CONTACT_MODIFIERS = new Set(['home', 'work', 'mobile', 'fax', 'pager']);
// input `type` values for which autocomplete does not apply (the rule is INAPPLICABLE); plus these the
// element must not be disabled and the value must not be the on/off toggle.
const AUTOCOMPLETE_EXEMPT_INPUT_TYPES = new Set([
  'hidden', 'button', 'submit', 'reset', 'image', 'checkbox', 'radio', 'file',
]);

// Does the on-token-grammar of an autocomplete value hold? `raw` is the attribute value; caller guarantees
// applicability (non-empty, not on/off, applicable control). Returns { valid, reason }.
// Grammar (forward order): [section-*] [shipping|billing] [home|work|mobile|fax|pager] field-name [webauthn]
// — validated by consuming tokens from the END (webauthn, then the required field name, then the optional
// modifiers in reverse), which makes the ordering + "exactly one field name" constraints fall out cleanly.
function validateAutocompleteTokens(raw) {
  const value = String(raw == null ? '' : raw).trim().toLowerCase();
  if (!value) return { valid: false, reason: 'empty value' };
  let tokens = value.split(/\s+/);
  // optional trailing credential type
  if (tokens[tokens.length - 1] === 'webauthn') {
    tokens = tokens.slice(0, -1);
    if (!tokens.length) return { valid: false, reason: 'webauthn without a field name' };
  }
  const field = tokens[tokens.length - 1];
  if (!AUTOFILL_FIELD_NAMES.has(field)) return { valid: false, reason: `"${field}" is not an autofill field name` };
  let rest = tokens.slice(0, -1); // tokens BEFORE the field name, in document order
  // optional contact-type modifier (only valid immediately before a CONTACT field name)
  if (rest.length && CONTACT_MODIFIERS.has(rest[rest.length - 1])) {
    if (!CONTACT_FIELD_NAMES.has(field)) return { valid: false, reason: `contact modifier "${rest[rest.length - 1]}" is not valid before non-contact field "${field}"` };
    rest = rest.slice(0, -1);
  }
  // optional shipping/billing group
  if (rest.length && (rest[rest.length - 1] === 'shipping' || rest[rest.length - 1] === 'billing')) {
    rest = rest.slice(0, -1);
  }
  // optional section-* token
  if (rest.length && rest[rest.length - 1].startsWith('section-')) {
    rest = rest.slice(0, -1);
  }
  if (rest.length) return { valid: false, reason: `unexpected leading token(s) [${rest.join(' ')}] (order must be section-* shipping|billing modifier field webauthn)` };
  return { valid: true, reason: null };
}

// Is the (already-lowercased-first-token) value the on/off toggle (⇒ INAPPLICABLE)?
function isAutocompleteToggle(raw) {
  const first = String(raw == null ? '' : raw).trim().toLowerCase().split(/\s+/)[0];
  return first === 'on' || first === 'off';
}

// ============================================================================================
// SC 1.4.4 — meta viewport allows zoom (ACT b4f0c3)
// ============================================================================================
// Parse the LEADING number of a viewport value (per the CSSOM-view viewport algorithm's lenient number
// read). Returns a finite number or null (an unrecognized token ⇒ null ⇒ NOT a passing value ⇒ FAIL).
function leadingNumber(v) {
  const m = String(v == null ? '' : v).trim().match(/^[+-]?(?:\d+\.?\d*|\.\d+)/);
  return m ? parseFloat(m[0]) : null;
}
// Evaluate a `content` string of a `<meta name=viewport>`. Applicable only when it declares a
// user-scalable or maximum-scale key. Returns { applicable, barrier, reason }.
function evalViewportContent(content) {
  const map = {};
  for (const part of String(content == null ? '' : content).split(/[,;]/)) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const k = part.slice(0, i).trim().toLowerCase();
    const val = part.slice(i + 1).trim().toLowerCase();
    if (k) map[k] = val;
  }
  const hasUs = Object.prototype.hasOwnProperty.call(map, 'user-scalable');
  const hasMs = Object.prototype.hasOwnProperty.call(map, 'maximum-scale');
  if (!hasUs && !hasMs) return { applicable: false, barrier: false, reason: 'no user-scalable/maximum-scale key — rule inapplicable' };
  // user-scalable permits zoom iff undefined, "yes", "device-width"/"device-height", or a number OUTSIDE
  // (-1,1) (ACT b4f0c3 Expectation 1). Anything else ("no", "0", "0.5", or an unrecognized token) restricts.
  let usOk = true;
  if (hasUs) {
    const us = map['user-scalable'];
    if (us === 'yes' || us === 'device-width' || us === 'device-height') usOk = true;
    else { const n = leadingNumber(us); usOk = (n !== null && (n <= -1 || n >= 1)); }
  }
  // maximum-scale permits zoom iff undefined, "device-width"/"device-height", a number >= 2, or negative
  // (negative maximum-scale is ignored by UAs). Anything else (incl. < 2 or an unrecognized token) restricts.
  let msOk = true;
  if (hasMs) {
    const ms = map['maximum-scale'];
    if (ms === 'device-width' || ms === 'device-height') msOk = true;
    else { const n = leadingNumber(ms); msOk = (n !== null && (n >= 2 || n < 0)); }
  }
  const pass = usOk && msOk;
  return { applicable: true, barrier: !pass, reason: pass ? 'viewport permits zoom' : `viewport restricts zoom (user-scalable ok=${usOk}, maximum-scale ok=${msOk})` };
}
// Does ANY viewport meta declare a user-scalable/maximum-scale key? (applicability gate — a page may have
// several viewport metas; the rule applies to each keyed one.)
function viewportContentKeyed(content) { return /(^|[,;\s])(user-scalable|maximum-scale)\s*=/i.test(String(content == null ? '' : content)); }
// ACT b4f0c3 applies to EACH `meta[name=viewport]` independently; a page fails if ANY keyed viewport meta
// restricts zoom. Combine the contents of every viewport meta: inapplicable if none is keyed; BARRIER if any
// keyed one restricts; pass only if every keyed one permits. Returns { applicable, barrier, reason }.
function evalViewportMetas(contents) {
  const keyed = (contents || []).map(evalViewportContent).filter((r) => r.applicable);
  if (!keyed.length) return { applicable: false, barrier: false, reason: 'no viewport meta declares user-scalable/maximum-scale' };
  const bad = keyed.find((r) => r.barrier);
  return { applicable: true, barrier: !!bad, reason: bad ? bad.reason : 'every viewport meta permits zoom' };
}

// ============================================================================================
// SC 2.2.1 — meta refresh has no timed delay (ACT bc659a)
// ============================================================================================
// Evaluate the `content` of a single `<meta http-equiv=refresh>`. Applicable only when the content is a
// VALID refresh per the HTML "shared declarative refresh" algorithm: skip ASCII whitespace, collect the
// time (digits + optional fraction), then the NEXT character (if any) must be ';', ',', or ASCII
// whitespace — otherwise the algorithm returns without scheduling a refresh (e.g. "0: url" schedules
// nothing; "foo; url" schedules nothing). An invalid content ⇒ INAPPLICABLE so the caller moves to the
// next meta. Returns { applicable, barrier, delaySeconds }.
function evalMetaRefreshContent(content) {
  if (content == null) return { applicable: false, barrier: false, delaySeconds: null, reason: 'no content attribute' };
  const m = String(content).match(/^[ \t\n\f\r]*(\d+(?:\.\d+)?)/);
  if (!m) return { applicable: false, barrier: false, delaySeconds: null, reason: 'content is not a valid refresh (no leading time)' };
  const after = String(content).slice(m[0].length);
  if (after.length && !/^[;,\s]/.test(after)) return { applicable: false, barrier: false, delaySeconds: null, reason: `invalid character after the time (${JSON.stringify(after[0])} is not ";", "," or whitespace) — no refresh is scheduled` };
  const delay = parseFloat(m[1]);
  // A refresh of 0s (instant redirect) or > 72000s (effectively none within a session) is exempt (pass);
  // 0 < delay <= 72000 is a timed refresh barrier.
  const barrier = delay > 0 && delay <= 72000;
  return { applicable: true, barrier, delaySeconds: delay, reason: barrier ? `timed refresh after ${delay}s` : `${delay}s is exempt (0 or >72000)` };
}

// ============================================================================================
// SC 1.4.12 — text spacing wide enough (ACT 24afc2 letter / 9e45ec word / 78fd32 line-height)
// ============================================================================================
const SPACING_THRESHOLDS = Object.freeze({ 'letter-spacing': 0.12, 'word-spacing': 0.16, 'line-height': 1.5 });
const SPACING_EPS = 1e-6; // a value exactly at the threshold PASSES (0.12em on a 25px font = 3px, etc.)
// CSS-wide keywords that DEFER to the cascade rather than LOCK a concrete spacing: an !important
// `inherit`/`unset`/`revert` declaration does not block a user text-spacing override (the override still
// applies up the cascade / via the user origin), so ACT 1.4.12 treats it as INAPPLICABLE. `initial`
// (and `normal`) DO lock a value (initial letter/word-spacing = normal = 0), so those stay APPLICABLE
// and can fail. letter/word-spacing + line-height are all inherited ⇒ `unset` === `inherit` for them.
const SPACING_CASCADE_KEYWORDS = new Set(['inherit', 'unset', 'revert', 'revert-layer']);
function spacingLocksValue(declaredValue) {
  return !SPACING_CASCADE_KEYWORDS.has(String(declaredValue == null ? '' : declaredValue).trim().toLowerCase());
}
// ratio = spacing/font-size (line-height uses the used value). Meets the WCAG text-spacing metric?
function spacingRatioMeets(prop, ratio) {
  const t = SPACING_THRESHOLDS[prop];
  return t != null && ratio >= t - SPACING_EPS;
}

// ============================================================================================
// SC 2.5.3 — visible label is part of the accessible name (ACT 2ee8b8)
// ============================================================================================
// ARIA widget roles that support "name from content" — the exact ACT 2ee8b8 applicability set.
const NAME_FROM_CONTENT_WIDGET_ROLES = new Set([
  'button', 'checkbox', 'gridcell', 'link', 'menuitem', 'menuitemcheckbox', 'menuitemradio',
  'option', 'radio', 'searchbox', 'switch', 'tab', 'treeitem',
]);
// Normalize per the ACT expectation: trim, collapse internal whitespace, lowercase. Punctuation is KEPT
// (the rule ignores only whitespace + case; "nonstandard" ⊄ "non-standard" is a genuine failure).
function normalizeLabel(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim().toLowerCase(); }
// Is the visible label a contiguous substring of the accessible name (after normalization)?
function labelContainedInName(visible, name) {
  const v = normalizeLabel(visible);
  const n = normalizeLabel(name);
  if (!v) return true; // no visible label ⇒ nothing to contain (caller gates applicability on visible text)
  return n.includes(v);
}

module.exports = {
  // 1.3.5
  AUTOFILL_FIELD_NAMES, CONTACT_FIELD_NAMES, CONTACT_MODIFIERS, AUTOCOMPLETE_EXEMPT_INPUT_TYPES,
  validateAutocompleteTokens, isAutocompleteToggle,
  // 1.4.4
  leadingNumber, evalViewportContent, viewportContentKeyed, evalViewportMetas,
  // 2.2.1
  evalMetaRefreshContent,
  // 1.4.12
  SPACING_THRESHOLDS, SPACING_EPS, SPACING_CASCADE_KEYWORDS, spacingLocksValue, spacingRatioMeets,
  // 2.5.3
  NAME_FROM_CONTENT_WIDGET_ROLES, normalizeLabel, labelContainedInName,
};
