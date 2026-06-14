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

test('buildResults derives anyIssue, bySkill, elementsWithIssue, issues', () => {
  const input = {
    file: 'f', slug: 's', noscript: false, elements: [
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
