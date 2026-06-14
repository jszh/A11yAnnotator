// W2 — result builder + schema validator tests (fixes C5).
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildResults, validateResults } = require('../lib/result-builder.js');
const S = require('../lib/result-schema.js');

// minimal full-skill record helper (all 10 keys present, default N/A)
function el(xpath, overrides = {}) {
  const skills = {};
  for (const k of S.SKILLS) skills[k] = { verdict: 'N/A', sc: null, level: null, evidence: 'n/a' };
  for (const [k, v] of Object.entries(overrides)) skills[k] = v;
  return { xpath, axRole: 'link', axName: 'x', skills };
}
// R21-C1: all three page skills must be present — default to N/A.
function pageOk(overrides = {}) {
  const ps = {}; for (const k of S.PAGE_SKILLS) ps[k] = { verdict: 'N/A', sc: null, level: null, evidence: 'n/a' };
  return { ...ps, ...overrides };
}

test('buildResults derives anyIssue, bySkill, elementsWithIssue, issues', () => {
  const input = {
    file: 'f', slug: 's', noscript: false, pageSkills: pageOk(), elements: [
      el('/a', { 'focus-visibility': { verdict: 'REPRODUCED', sc: '2.4.7', level: 'AA', evidence: 'no ring' } }),
      el('/b', { 'keyboard-operability': { verdict: 'PARTIAL', sc: '2.1.1', level: 'A', evidence: 'indeterminate' } }),
      el('/c'),
    ],
  };
  const R = buildResults(input);
  assert.equal(R.elements[0].anyIssue, true);
  assert.equal(R.elements[2].anyIssue, false);
  assert.equal(R.summary.elementsWithIssue, 2);
  assert.equal(R.summary.bySkill['focus-visibility'].reproduced, 1);
  assert.equal(R.summary.bySkill['keyboard-operability'].partial, 1);
  assert.equal(R.summary.issues.length, 2);
  assert.equal(validateResults(R).ok, true, 'a freshly-built result must validate');
});

test('buildResults dedups issues by (skill, sc, evidence)', () => {
  const same = { verdict: 'REPRODUCED', sc: '2.4.7', level: 'AA', evidence: 'No visible focus indicator' };
  const R = buildResults({ file: 'f', slug: 's', elements: [
    el('/a', { 'focus-visibility': same }), el('/b', { 'focus-visibility': { ...same } }),
  ] });
  assert.equal(R.summary.issues.length, 1, 'identical findings dedup to one');
});

// ---- C5 rejection cases: the validator must catch each ----
test('C5 reject: anyIssue:false but a REPRODUCED sub-verdict (the 204/37 bug)', () => {
  const R = buildResults({ file: 'f', slug: 's', elements: [el('/a', { 'focus-visibility': { verdict: 'REPRODUCED', sc: '2.4.7', level: 'AA', evidence: 'no ring' } })] });
  R.elements[0].anyIssue = false; // corrupt it
  const v = validateResults(R);
  assert.equal(v.ok, false);
  assert.ok(v.errors.some(e => /anyIssue/.test(e)));
});

test('C5 reject: bySkill cell disagrees with records', () => {
  const R = buildResults({ file: 'f', slug: 's', elements: [el('/a', { 'focus-visibility': { verdict: 'REPRODUCED', sc: '2.4.7', level: 'AA', evidence: 'x' } })] });
  R.summary.bySkill['focus-visibility'].reproduced = 5; // corrupt
  assert.equal(validateResults(R).ok, false);
});

test('C5 reject: SC not allowed for the skill (e.g. 4.1.3 on focus-visibility)', () => {
  const R = buildResults({ file: 'f', slug: 's', elements: [el('/a', { 'focus-visibility': { verdict: 'REPRODUCED', sc: '4.1.3', level: 'AA', evidence: 'x' } })] });
  const v = validateResults(R);
  assert.equal(v.ok, false);
  assert.ok(v.errors.some(e => /not allowed/.test(e)));
});

test('C1 reject in practice: state-change announcement must be 4.1.2 not 4.1.3 — but 4.1.2 is not a dynamic-announcement SC', () => {
  // dynamic-announcement only permits 4.1.3; a state-exposure finding belongs on name-role-state (4.1.2)
  assert.ok(!S.SKILL_SCS['dynamic-announcement'].includes('4.1.2'));
  assert.ok(S.SKILL_SCS['name-role-state'].includes('4.1.2'));
});

test('C5 reject: REPRODUCED with empty evidence', () => {
  const R = buildResults({ file: 'f', slug: 's', elements: [el('/a', { 'focus-visibility': { verdict: 'REPRODUCED', sc: '2.4.7', level: 'AA', evidence: '' } })] });
  assert.equal(validateResults(R).ok, false);
});

test('C5 reject: verdict not in enum', () => {
  const R = buildResults({ file: 'f', slug: 's', elements: [el('/a', { 'focus-visibility': { verdict: 'MAYBE', sc: '2.4.7', evidence: 'x' } })] });
  assert.equal(validateResults(R).ok, false);
});

test('C5 reject: missing a skill key', () => {
  const e = el('/a'); delete e.skills['page-structure'];
  const R = buildResults({ file: 'f', slug: 's', elements: [e] });
  const v = validateResults(R);
  assert.equal(v.ok, false);
  assert.ok(v.errors.some(er => /missing skill key/.test(er)));
});

// ---- R2.1-B: the strict/hardening cases the round-2 validator missed ----
test('R2-C1 pageSkills are AGGREGATED into issues + normative tally', () => {
  const R = buildResults({ file: 'f', slug: 's', elements: [el('/a')], pageSkills: pageOk({
    'page-structure': { verdict: 'REPRODUCED', sc: '1.3.1', level: 'A', evidence: 'unnamed heading in outline', bucket: 'normative' },
    'grouping-and-reading-order': { verdict: 'NOT REPRODUCED', sc: null, level: null, evidence: 'ok' },
  }) });
  assert.equal(R.summary.issues.filter(i => i.scope === 'page').length, 1, 'page-level finding must appear in issues');
  assert.equal(R.summary.normativeFailures, 1);
  assert.equal(R.summary.pageHasIssue, true);
  assert.equal(validateResults(R).ok, true);
});
test('R2-C1 reject: an issue verdict with NO SC', () => {
  const R = buildResults({ file: 'f', slug: 's', elements: [el('/a', { 'focus-visibility': { verdict: 'REPRODUCED', sc: null, level: null, evidence: 'no ring' } })] });
  const v = validateResults(R); assert.equal(v.ok, false);
  assert.ok(v.errors.some(e => /no WCAG SC/.test(e)));
});
test('R2-C1 reject: WRONG level for the SC', () => {
  const R = buildResults({ file: 'f', slug: 's', elements: [el('/a', { 'focus-visibility': { verdict: 'REPRODUCED', sc: '2.4.7', level: 'A', evidence: 'x' } })] });
  const v = validateResults(R); assert.equal(v.ok, false);
  assert.ok(v.errors.some(e => /level A != AA/.test(e)));
});
test('R2-C1 reject: missing summary / missing pageSkills', () => {
  const R = buildResults({ file: 'f', slug: 's', elements: [el('/a')] });
  delete R.summary; assert.equal(validateResults(R).ok, false);
  const R2 = buildResults({ file: 'f', slug: 's', elements: [el('/a')] });
  delete R2.pageSkills; assert.ok(validateResults(R2).errors.some(e => /missing pageSkills/.test(e)));
});
test('R2-C1 reject: definite DYNAMIC verdict on a notFound element', () => {
  const e = el('/a', { 'keyboard-operability': { verdict: 'REPRODUCED', sc: '2.1.1', level: 'A', evidence: 'no kbd' } }); e.notFound = true;
  const R = buildResults({ file: 'f', slug: 's', elements: [e] });
  const v = validateResults(R); assert.equal(v.ok, false);
  assert.ok(v.errors.some(er => /notFound/.test(er)));
});
test('R2-C1 reject: summary.issues CONTENT corrupted even when length matches', () => {
  const R = buildResults({ file: 'f', slug: 's', elements: [el('/a', { 'focus-visibility': { verdict: 'REPRODUCED', sc: '2.4.7', level: 'AA', evidence: 'real evidence' } })] });
  R.summary.issues[0].evidence = 'totally different fabricated evidence'; // same length count, different content
  assert.equal(validateResults(R).ok, false);
});
test('R2-C1 multi-SC field: every cited SC is validated', () => {
  const R = buildResults({ file: 'f', slug: 's', pageSkills: pageOk(), elements: [el('/a', { 'page-structure': { verdict: 'REPRODUCED', sc: '1.3.1 + 4.1.3', level: 'A', evidence: 'x' } })] });
  // 4.1.3 is NOT allowed on page-structure → must be rejected even though 1.3.1 is fine
  assert.ok(validateResults(R).errors.some(e => /4\.1\.3 not allowed/.test(e)));
});

// ---- R2.2-A: the round-2.1 adversarial cases the gate must now reject/allow ----
test('R21-C1 reject: an evaluation that OMITS pageSkills (empty {} default)', () => {
  const R = buildResults({ file: 'f', slug: 's', elements: [el('/a')] }); // no pageSkills
  const v = validateResults(R); assert.equal(v.ok, false);
  assert.ok(v.errors.some(e => /missing required key/.test(e)), 'must require all 3 page skills');
});
test('R21-C1 reject: empty elements[]', () => {
  const R = buildResults({ file: 'f', slug: 's', pageSkills: pageOk(), elements: [] });
  assert.ok(validateResults(R).errors.some(e => /empty elements/.test(e)));
});
test('R21-C1 reject: a CORRUPTED issue object (verdict/level/bucket changed, key fields same)', () => {
  const R = buildResults({ file: 'f', slug: 's', pageSkills: pageOk(), elements: [el('/a', { 'focus-visibility': { verdict: 'REPRODUCED', sc: '2.4.7', level: 'AA', evidence: 'real evidence here' } })] });
  R.summary.issues[0].verdict = 'PARTIAL'; R.summary.issues[0].level = 'A'; R.summary.issues[0].xpath = '/zzz'; // corrupt non-key fields
  assert.equal(validateResults(R).ok, false);
});
test('R21-C1 reject: a missing derived summary field (normativeFailures)', () => {
  const R = buildResults({ file: 'f', slug: 's', pageSkills: pageOk(), elements: [el('/a', { 'focus-visibility': { verdict: 'REPRODUCED', sc: '2.4.7', level: 'AA', evidence: 'x' } })] });
  delete R.summary.normativeFailures;
  assert.ok(validateResults(R).errors.some(e => /normativeFailures missing/.test(e)));
});
test('R21-C1 reject: a page-skill with the WRONG level', () => {
  const R = buildResults({ file: 'f', slug: 's', pageSkills: pageOk({ 'page-structure': { verdict: 'REPRODUCED', sc: '1.3.1', level: 'AA', evidence: 'x' } }), elements: [el('/a')] });
  assert.ok(validateResults(R).errors.some(e => /level AA != A/.test(e)));
});
test('R21-M3 ALLOW: a best-practice observation with a `rule` id and NO WCAG SC', () => {
  const R = buildResults({ file: 'f', slug: 's', pageSkills: pageOk({ 'page-structure': { verdict: 'REPRODUCED', sc: null, level: null, bucket: 'best-practice', rule: 'page-has-heading-one', evidence: 'no h1 (best practice)' } }), elements: [el('/a')] });
  assert.equal(validateResults(R).ok, true, 'best-practice may use a rule id instead of a fake SC');
  assert.equal(R.summary.bestPracticeFindings, 1);
  assert.equal(R.summary.normativeFailures, 0);
});
test('R21-M3 reject: a NORMATIVE issue still requires an SC', () => {
  const R = buildResults({ file: 'f', slug: 's', pageSkills: pageOk(), elements: [el('/a', { 'name-role-state': { verdict: 'REPRODUCED', sc: null, level: null, evidence: 'unnamed', bucket: 'normative' } })] });
  assert.ok(validateResults(R).errors.some(e => /NORMATIVE.*no WCAG SC/.test(e)));
});
