// ACT-REST expansion Round 1 — PURE decision-logic tests (no browser). Every case is a real ACT fixture
// value (or a spec edge the plan flags as held-out / anti-overfit). Mirrors the per-SC confusion the
// end-to-end suite scores, but at the grammar/threshold layer so a regression is caught without Chrome.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const S = require('../../lib/static-checks.js');

test('1.3.5 autocomplete: valid ordered autofill-token sequences pass', () => {
  for (const v of ['username', 'bday-month', 'Street-Address', 'work email', 'section-partner email',
    'section-primary billing address-line1', 'section-primary shipping work email', 'bday-day',
    'current-password webauthn']) {
    assert.equal(S.validateAutocompleteTokens(v).valid, true, `should be valid: ${v}`);
  }
});
test('1.3.5 autocomplete: unknown token / mis-order / extra token fail (incl. anti-overfit "banner")', () => {
  for (const v of ['badname', 'banner', 'work photo', 'work shipping email', 'work,email', 'shipping',
    'address-line1 address-line2', 'work', 'current-password webauthn invalid', 'email invalid']) {
    assert.equal(S.validateAutocompleteTokens(v).valid, false, `should be invalid: ${v}`);
  }
});
test('1.3.5 autocomplete: on/off is the toggle (rule inapplicable, decided by the applicability gate)', () => {
  assert.equal(S.isAutocompleteToggle('on'), true);
  assert.equal(S.isAutocompleteToggle('off'), true);
  assert.equal(S.isAutocompleteToggle('username'), false);
});

test('1.4.4 viewport: permits-zoom values pass; restricting/unrecognized fail (incl. the axe blind spots)', () => {
  for (const c of ['user-scalable=yes', 'maximum-scale=2.0', 'maximum-scale=-1', 'user-scalable=5', 'maximum-scale=device-width']) {
    const r = S.evalViewportContent(c); assert.equal(r.applicable, true, c); assert.equal(r.barrier, false, `pass: ${c}`);
  }
  for (const c of ['user-scalable=no', 'user-scalable=yes, initial-scale=0.8, maximum-scale=1.5', 'maximum-scale=1.0',
    'maximum-scale=yes', 'user-scalable=0.5', 'user-scalable=invalid', 'maximum-scale=invalid']) {
    const r = S.evalViewportContent(c); assert.equal(r.applicable, true, c); assert.equal(r.barrier, true, `barrier: ${c}`);
  }
});
test('1.4.4 viewport: no user-scalable/maximum-scale key ⇒ inapplicable', () => {
  for (const c of ['width=device-width', '', 'initial-scale=1']) assert.equal(S.evalViewportContent(c).applicable, false, c);
});
test('1.4.4 viewport: user-scalable device-width/height permit zoom (ACT b4f0c3 Expectation 1); invalid still restricts', () => {
  assert.equal(S.evalViewportContent('user-scalable=device-width').barrier, false, 'vp-usdw: device-width permits');
  assert.equal(S.evalViewportContent('user-scalable=device-height').barrier, false, 'device-height permits');
  assert.equal(S.evalViewportContent('user-scalable=invalid').barrier, true, 'an unrecognized token is NOT a passing value');
});
test('1.4.4 viewport: the rule applies to EACH meta — a page fails if ANY keyed viewport meta restricts', () => {
  assert.equal(S.evalViewportMetas(['user-scalable=yes', 'maximum-scale=1.0']).barrier, true, 'vp-multi: permissive first, restrictive second ⇒ FAIL');
  assert.equal(S.evalViewportMetas(['maximum-scale=2.0', 'user-scalable=yes']).barrier, false, 'both permit ⇒ pass');
  assert.equal(S.evalViewportMetas(['width=device-width', 'maximum-scale=1.0']).barrier, true, 'non-keyed first must not mask a keyed restrictive second');
  assert.equal(S.evalViewportMetas(['width=device-width']).applicable, false, 'no keyed viewport meta ⇒ inapplicable');
});

test('2.2.1 meta refresh: 0 or >72000 pass; (0,72000] barrier; 72000 boundary barrier', () => {
  assert.equal(S.evalMetaRefreshContent("0; URL='https://github.com'").barrier, false);
  assert.equal(S.evalMetaRefreshContent('72001; x').barrier, false);
  assert.equal(S.evalMetaRefreshContent('72000; https://w3.org').barrier, true, 'exactly 72000 is a barrier (strictly-greater exemption)');
  assert.equal(S.evalMetaRefreshContent('30').barrier, true);
  assert.equal(S.evalMetaRefreshContent('5; https://w3.org').barrier, true);
});
test('2.2.1 meta refresh: invalid content (no leading time, or a bad char after the time) ⇒ inapplicable', () => {
  assert.equal(S.evalMetaRefreshContent("foo; URL='https://w3.org'").applicable, false);
  assert.equal(S.evalMetaRefreshContent(null).applicable, false);
  assert.equal(S.evalMetaRefreshContent('0: https://w3.org').applicable, false, '"0:" (colon) schedules no refresh — the two-meta bc659a case');
});

test('1.4.12 spacing: threshold is inclusive (>=); below fails', () => {
  assert.equal(S.spacingRatioMeets('letter-spacing', 0.12), true);
  assert.equal(S.spacingRatioMeets('letter-spacing', 0.1), false);
  assert.equal(S.spacingRatioMeets('word-spacing', 0.16), true);
  assert.equal(S.spacingRatioMeets('word-spacing', 0.125), false);
  assert.equal(S.spacingRatioMeets('line-height', 1.5), true);
  assert.equal(S.spacingRatioMeets('line-height', 1.0), false, 'px line-height 20/20 = 1.0 is a barrier (the axe blind spot)');
});
test('1.4.12 spacing: cascade-deferring keywords (inherit/unset/revert) do NOT lock ⇒ inapplicable; initial/normal DO', () => {
  for (const kw of ['inherit', 'unset', 'revert', 'revert-layer', 'INHERIT']) assert.equal(S.spacingLocksValue(kw), false, kw);
  for (const kw of ['initial', 'normal', '0.1em', '3px']) assert.equal(S.spacingLocksValue(kw), true, kw);
});

test('2.5.3 label-in-name: containment ignores whitespace + case but not punctuation', () => {
  assert.equal(S.labelContainedInName('ACT rules', 'ACT rules'), true);
  assert.equal(S.labelContainedInName('ACT rules', ' ACT rules '), true);
  assert.equal(S.labelContainedInName('ACT rules', 'act rules'), true);
  assert.equal(S.labelContainedInName('Next Page', 'Next Page in the list'), true);
  assert.equal(S.labelContainedInName('ACT rules', 'WCAG'), false);
  assert.equal(S.labelContainedInName('The full label', 'the full'), false);
  assert.equal(S.labelContainedInName('nonstandard', 'non-standard'), false, 'punctuation difference is a genuine failure');
  assert.equal(S.labelContainedInName('123.456.7890', '1 2 3. 4 5 6. 7 8 9 0'), false);
});
test('2.5.3 label-in-name: the name-from-content widget role set matches ACT 2ee8b8', () => {
  for (const role of ['button', 'link', 'checkbox', 'radio', 'switch', 'tab', 'menuitem', 'option', 'treeitem']) {
    assert.equal(S.NAME_FROM_CONTENT_WIDGET_ROLES.has(role), true, role);
  }
  for (const role of ['tooltip', 'navigation', 'textbox', 'combobox', 'slider']) {
    assert.equal(S.NAME_FROM_CONTENT_WIDGET_ROLES.has(role), false, `${role} is not name-from-content`);
  }
});

test('1.3.5 autofill field-name table is FULL (not fixture-pruned): a spec field absent from every fixture is accepted', () => {
  // "one-time-code" and "cc-csc" appear in NO Round-1 fixture; a partial table would reject them.
  assert.equal(S.validateAutocompleteTokens('one-time-code').valid, true);
  assert.equal(S.validateAutocompleteTokens('section-x billing cc-csc').valid, true);
  assert.equal(S.CONTACT_FIELD_NAMES.has('impp'), true);
  assert.equal(S.AUTOFILL_FIELD_NAMES.has('photo'), true);
  assert.equal(S.CONTACT_FIELD_NAMES.has('photo'), false, 'photo is a field name but NOT a contact type');
});
