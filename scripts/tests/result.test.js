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
// R21-C1/R2.3-C: all three page skills must be present and NOT N/A (inherently
// applicable) — default to NOT REPRODUCED with a reason.
function pageOk(overrides = {}) {
  const ps = {}; for (const k of S.PAGE_SKILLS) ps[k] = { verdict: 'NOT REPRODUCED', sc: null, level: null, evidence: 'checked: no page-level issue' };
  return { ...ps, ...overrides };
}
// R2.3-C: provenance is mandatory. This honest wrapper derives it from the elements
// under test (membership trivially holds) so existing builder tests still validate;
// the dedicated provenance/determinism tests construct provenance explicitly.
const _build = buildResults;
function build(input) {
  if (input.provenance) return _build(input);
  const xpaths = (input.elements || []).map(e => e.xpath);
  return _build({ ...input, provenance: { collect: { xpaths, count: xpaths.length } } });
}

test('buildResults derives anyIssue, bySkill, elementsWithIssue, issues', () => {
  const input = {
    file: 'f', slug: 's', noscript: false, pageSkills: pageOk(), elements: [
      el('/a', { 'focus-visibility': { verdict: 'REPRODUCED', sc: '2.4.7', level: 'AA', evidence: 'no ring' } }),
      el('/b', { 'keyboard-operability': { verdict: 'PARTIAL', sc: '2.1.1', level: 'A', evidence: 'indeterminate' } }),
      el('/c'),
    ],
  };
  const R = build(input);
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
  const R = build({ file: 'f', slug: 's', elements: [
    el('/a', { 'focus-visibility': same }), el('/b', { 'focus-visibility': { ...same } }),
  ] });
  assert.equal(R.summary.issues.length, 1, 'identical findings dedup to one');
});

// ---- C5 rejection cases: the validator must catch each ----
test('C5 reject: anyIssue:false but a REPRODUCED sub-verdict (the 204/37 bug)', () => {
  const R = build({ file: 'f', slug: 's', elements: [el('/a', { 'focus-visibility': { verdict: 'REPRODUCED', sc: '2.4.7', level: 'AA', evidence: 'no ring' } })] });
  R.elements[0].anyIssue = false; // corrupt it
  const v = validateResults(R);
  assert.equal(v.ok, false);
  assert.ok(v.errors.some(e => /anyIssue/.test(e)));
});

test('C5 reject: bySkill cell disagrees with records', () => {
  const R = build({ file: 'f', slug: 's', elements: [el('/a', { 'focus-visibility': { verdict: 'REPRODUCED', sc: '2.4.7', level: 'AA', evidence: 'x' } })] });
  R.summary.bySkill['focus-visibility'].reproduced = 5; // corrupt
  assert.equal(validateResults(R).ok, false);
});

test('C5 reject: SC not allowed for the skill (e.g. 4.1.3 on focus-visibility)', () => {
  const R = build({ file: 'f', slug: 's', elements: [el('/a', { 'focus-visibility': { verdict: 'REPRODUCED', sc: '4.1.3', level: 'AA', evidence: 'x' } })] });
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
  const R = build({ file: 'f', slug: 's', elements: [el('/a', { 'focus-visibility': { verdict: 'REPRODUCED', sc: '2.4.7', level: 'AA', evidence: '' } })] });
  assert.equal(validateResults(R).ok, false);
});

test('C5 reject: verdict not in enum', () => {
  const R = build({ file: 'f', slug: 's', elements: [el('/a', { 'focus-visibility': { verdict: 'MAYBE', sc: '2.4.7', evidence: 'x' } })] });
  assert.equal(validateResults(R).ok, false);
});

test('C5 reject: missing a skill key', () => {
  const e = el('/a'); delete e.skills['page-structure'];
  const R = build({ file: 'f', slug: 's', elements: [e] });
  const v = validateResults(R);
  assert.equal(v.ok, false);
  assert.ok(v.errors.some(er => /missing skill key/.test(er)));
});

// ---- R2.1-B: the strict/hardening cases the round-2 validator missed ----
test('R2-C1 pageSkills are AGGREGATED into issues + normative tally', () => {
  const R = build({ file: 'f', slug: 's', elements: [el('/a')], pageSkills: pageOk({
    'page-structure': { verdict: 'REPRODUCED', sc: '1.3.1', level: 'A', evidence: 'unnamed heading in outline', bucket: 'normative' },
    'grouping-and-reading-order': { verdict: 'NOT REPRODUCED', sc: null, level: null, evidence: 'ok' },
  }) });
  assert.equal(R.summary.issues.filter(i => i.scope === 'page').length, 1, 'page-level finding must appear in issues');
  assert.equal(R.summary.normativeFailures, 1);
  assert.equal(R.summary.pageHasIssue, true);
  assert.equal(validateResults(R).ok, true);
});
test('R2-C1 reject: an issue verdict with NO SC', () => {
  const R = build({ file: 'f', slug: 's', elements: [el('/a', { 'focus-visibility': { verdict: 'REPRODUCED', sc: null, level: null, evidence: 'no ring' } })] });
  const v = validateResults(R); assert.equal(v.ok, false);
  assert.ok(v.errors.some(e => /no WCAG SC/.test(e)));
});
test('R2-C1 reject: WRONG level for the SC', () => {
  const R = build({ file: 'f', slug: 's', elements: [el('/a', { 'focus-visibility': { verdict: 'REPRODUCED', sc: '2.4.7', level: 'A', evidence: 'x' } })] });
  const v = validateResults(R); assert.equal(v.ok, false);
  assert.ok(v.errors.some(e => /level A != AA/.test(e)));
});
test('R2-C1 reject: missing summary / missing pageSkills', () => {
  const R = build({ file: 'f', slug: 's', elements: [el('/a')] });
  delete R.summary; assert.equal(validateResults(R).ok, false);
  const R2 = build({ file: 'f', slug: 's', elements: [el('/a')] });
  delete R2.pageSkills; assert.ok(validateResults(R2).errors.some(e => /missing pageSkills/.test(e)));
});
test('R2-C1 reject: definite DYNAMIC verdict on a notFound element', () => {
  const e = el('/a', { 'keyboard-operability': { verdict: 'REPRODUCED', sc: '2.1.1', level: 'A', evidence: 'no kbd' } }); e.notFound = true;
  const R = build({ file: 'f', slug: 's', elements: [e] });
  const v = validateResults(R); assert.equal(v.ok, false);
  assert.ok(v.errors.some(er => /notFound/.test(er)));
});
test('R2-C1 reject: summary.issues CONTENT corrupted even when length matches', () => {
  const R = build({ file: 'f', slug: 's', elements: [el('/a', { 'focus-visibility': { verdict: 'REPRODUCED', sc: '2.4.7', level: 'AA', evidence: 'real evidence' } })] });
  R.summary.issues[0].evidence = 'totally different fabricated evidence'; // same length count, different content
  assert.equal(validateResults(R).ok, false);
});
test('R2-C1 multi-SC field: every cited SC is validated', () => {
  const R = build({ file: 'f', slug: 's', pageSkills: pageOk(), elements: [el('/a', { 'page-structure': { verdict: 'REPRODUCED', sc: '1.3.1 + 4.1.3', level: 'A', evidence: 'x' } })] });
  // 4.1.3 is NOT allowed on page-structure → must be rejected even though 1.3.1 is fine
  assert.ok(validateResults(R).errors.some(e => /4\.1\.3 not allowed/.test(e)));
});

// ---- R2.2-A: the round-2.1 adversarial cases the gate must now reject/allow ----
test('R21-C1 reject: an evaluation that OMITS pageSkills (empty {} default)', () => {
  const R = build({ file: 'f', slug: 's', elements: [el('/a')] }); // no pageSkills
  const v = validateResults(R); assert.equal(v.ok, false);
  assert.ok(v.errors.some(e => /missing required key/.test(e)), 'must require all 3 page skills');
});
test('R21-C1 reject: empty elements[]', () => {
  const R = build({ file: 'f', slug: 's', pageSkills: pageOk(), elements: [] });
  assert.ok(validateResults(R).errors.some(e => /empty elements/.test(e)));
});
test('R21-C1 reject: a CORRUPTED issue object (verdict/level/bucket changed, key fields same)', () => {
  const R = build({ file: 'f', slug: 's', pageSkills: pageOk(), elements: [el('/a', { 'focus-visibility': { verdict: 'REPRODUCED', sc: '2.4.7', level: 'AA', evidence: 'real evidence here' } })] });
  R.summary.issues[0].verdict = 'PARTIAL'; R.summary.issues[0].level = 'A'; R.summary.issues[0].xpath = '/zzz'; // corrupt non-key fields
  assert.equal(validateResults(R).ok, false);
});
test('R21-C1 reject: a missing derived summary field (normativeFailures)', () => {
  const R = build({ file: 'f', slug: 's', pageSkills: pageOk(), elements: [el('/a', { 'focus-visibility': { verdict: 'REPRODUCED', sc: '2.4.7', level: 'AA', evidence: 'x' } })] });
  delete R.summary.normativeFailures;
  assert.ok(validateResults(R).errors.some(e => /normativeFailures missing/.test(e)));
});
test('R21-C1 reject: a page-skill with the WRONG level', () => {
  const R = build({ file: 'f', slug: 's', pageSkills: pageOk({ 'page-structure': { verdict: 'REPRODUCED', sc: '1.3.1', level: 'AA', evidence: 'x' } }), elements: [el('/a')] });
  assert.ok(validateResults(R).errors.some(e => /level AA != A/.test(e)));
});
test('R21-M3 ALLOW: a best-practice observation with a `rule` id and NO WCAG SC', () => {
  const R = build({ file: 'f', slug: 's', pageSkills: pageOk({ 'page-structure': { verdict: 'REPRODUCED', sc: null, level: null, bucket: 'best-practice', rule: 'page-has-heading-one', evidence: 'no h1 (best practice)' } }), elements: [el('/a')] });
  assert.equal(validateResults(R).ok, true, 'best-practice may use a rule id instead of a fake SC');
  assert.equal(R.summary.bestPracticeFindings, 1);
  assert.equal(R.summary.normativeFailures, 0);
});
test('R21-M3 reject: a NORMATIVE issue still requires an SC', () => {
  const R = build({ file: 'f', slug: 's', pageSkills: pageOk(), elements: [el('/a', { 'name-role-state': { verdict: 'REPRODUCED', sc: null, level: null, evidence: 'unnamed', bucket: 'normative' } })] });
  assert.ok(validateResults(R).errors.some(e => /NORMATIVE.*no WCAG SC/.test(e)));
});

// ---- R2.3-C: completeness (R22-C1) + determinism (R22-C2) ----
test('R2.3-C completeness: evidence-free N/A everywhere is REJECTED (blank evaluation)', () => {
  const blank = {}; for (const k of S.SKILLS) blank[k] = { verdict: 'N/A', sc: null, level: null, evidence: '' };
  const R = build({ file: 'f', slug: 's', pageSkills: pageOk(), elements: [{ xpath: '/a', axRole: 'link', axName: 'x', skills: blank }] });
  const v = validateResults(R); assert.equal(v.ok, false);
  assert.ok(v.errors.some(e => /N\/A with empty evidence/.test(e)), 'every N/A needs a reason');
});
test('R2.3-C completeness: evidence-free NOT REPRODUCED everywhere is REJECTED', () => {
  const blank = {}; for (const k of S.SKILLS) blank[k] = { verdict: 'NOT REPRODUCED', sc: null, level: null, evidence: '' };
  const R = build({ file: 'f', slug: 's', pageSkills: pageOk(), elements: [{ xpath: '/a', axRole: 'link', axName: 'x', skills: blank }] });
  assert.ok(validateResults(R).errors.some(e => /NOT REPRODUCED with empty evidence/.test(e)));
});
test('R2.3-C completeness: page-level N/A is REJECTED (inherently applicable)', () => {
  const R = build({ file: 'f', slug: 's', pageSkills: pageOk({ 'reflow': { verdict: 'N/A', sc: null, level: null, evidence: 'n/a' } }), elements: [el('/a')] });
  assert.ok(validateResults(R).errors.some(e => /N\/A is not permitted/.test(e)));
});
test('R2.3-C provenance: missing provenance is REJECTED', () => {
  const R = buildResults({ file: 'f', slug: 's', pageSkills: pageOk(), elements: [el('/a')] }); // raw, no provenance
  assert.ok(validateResults(R).errors.some(e => /provenance: missing/.test(e)));
});
test('R2.3-C provenance: a DUMMY element not in the collector inventory is REJECTED', () => {
  const R = buildResults({ file: 'f', slug: 's', pageSkills: pageOk(), elements: [el('/fabricated')],
    provenance: { collect: { xpaths: ['/real-1', '/real-2'], count: 2 } } });
  assert.ok(validateResults(R).errors.some(e => /not in the collector inventory/.test(e)));
});
test('R2.4-A provenance: a collected element DROPPED is REJECTED by default (no flag needed)', () => {
  const R = buildResults({ file: 'f', slug: 's', pageSkills: pageOk(), elements: [el('/a')],
    provenance: { collect: { xpaths: ['/a', '/b'], count: 2 } } });
  assert.ok(validateResults(R).errors.some(e => /was dropped/.test(e)), 'completeness is default-closed');
});
test('R2.4-A provenance: a dropped element is ACCEPTED only via skipped[{xpath,reason}]', () => {
  const ok = buildResults({ file: 'f', slug: 's', pageSkills: pageOk(), elements: [el('/a')],
    provenance: { collect: { xpaths: ['/a', '/b'], count: 2, skipped: [{ xpath: '/b', reason: 'off-screen duplicate' }] } } });
  assert.equal(validateResults(ok).ok, true, 'a structured skip with a reason closes completeness');
  const noReason = buildResults({ file: 'f', slug: 's', pageSkills: pageOk(), elements: [el('/a')],
    provenance: { collect: { xpaths: ['/a', '/b'], count: 2, skipped: [{ xpath: '/b' }] } } });
  assert.ok(validateResults(noReason).errors.some(e => /SUBSTANTIVE reason/.test(e)), 'a skip without a reason is rejected');
});
test('R2.5-B skip integrity: mass-skip (>25% cap), filler reasons, and extra skip keys are REJECTED', () => {
  const inv = Array.from({ length: 12 }, (_, i) => '/e' + i);
  // mass-skip 11/12 with a substantive reason → cap fires
  const massSkip = buildResults({ file: 'f', slug: 's', pageSkills: pageOk(), elements: [el('/e0')],
    provenance: { collect: { xpaths: inv, count: 12, skipped: inv.slice(1).map(x => ({ xpath: x, reason: 'not locatable in dynamic dom' })) } } });
  assert.ok(validateResults(massSkip).errors.some(e => /exceeds the cap/.test(e)), 'cannot declare most of the sample un-evaluated');
  // filler reason "........"
  const filler = buildResults({ file: 'f', slug: 's', pageSkills: pageOk(), elements: [el('/e0')],
    provenance: { collect: { xpaths: ['/e0', '/e1'], count: 2, skipped: [{ xpath: '/e1', reason: '........' }] } } });
  assert.ok(validateResults(filler).errors.some(e => /SUBSTANTIVE reason/.test(e)), 'a no-word filler reason is rejected');
  // extra key on a skip entry
  const extra = buildResults({ file: 'f', slug: 's', pageSkills: pageOk(), elements: [el('/e0')],
    provenance: { collect: { xpaths: ['/e0', '/e1'], count: 2, skipped: [{ xpath: '/e1', reason: 'off-screen duplicate', forgedVerdict: 'PASS' }] } } });
  assert.ok(validateResults(extra).errors.some(e => /skipped: unexpected key "forgedVerdict"/.test(e)));
});
test('R2.5-B axe floor: skipping elements + 0 failures while the collector axe found serious violations is REJECTED', () => {
  const R = buildResults({ file: 'f', slug: 's', pageSkills: pageOk(), elements: [el('/a')],
    provenance: { collect: { xpaths: ['/a', '/b'], count: 2, skipped: [{ xpath: '/b', reason: 'off-screen duplicate' }] } } });
  const blocked = validateResults(R, { collectorAxe: { seriousCount: 4 } });
  assert.ok(blocked.errors.some(e => /collector's axe run found 4 critical\/serious/.test(e)), 'cannot launder a clean result by skipping flagged elements');
  // no skips → the floor does not apply (agent owns every element)
  const noSkip = buildResults({ file: 'f', slug: 's', pageSkills: pageOk(), elements: [el('/a'), el('/b')],
    provenance: { collect: { xpaths: ['/a', '/b'], count: 2 } } });
  assert.equal(validateResults(noSkip, { collectorAxe: { seriousCount: 4 } }).ok, true, 'no skips → floor does not fire');
});
test('R2.4-A provenance: count mismatch and an unexpected collect key are REJECTED', () => {
  const badCount = buildResults({ file: 'f', slug: 's', pageSkills: pageOk(), elements: [el('/a')], provenance: { collect: { xpaths: ['/a'], count: 9 } } });
  assert.ok(validateResults(badCount).errors.some(e => /count=9 != inventory length 1/.test(e)));
  const badKey = buildResults({ file: 'f', slug: 's', pageSkills: pageOk(), elements: [el('/a')], provenance: { collect: { xpaths: ['/a'], complete: true } } });
  assert.ok(validateResults(badKey).errors.some(e => /unexpected key "complete"/.test(e)), 'the circular `complete` flag is gone');
});
test('R2.3-C determinism: REPRODUCED vs PARTIAL of the SAME defect MERGE to REPRODUCED', () => {
  const rep = { verdict: 'REPRODUCED', sc: '2.4.7', level: 'AA', evidence: 'same defect' };
  const par = { verdict: 'PARTIAL', sc: '2.4.7', level: 'AA', evidence: 'same defect' };
  const A = build({ file: 'f', slug: 's', pageSkills: pageOk(), elements: [el('/a', { 'focus-visibility': par }), el('/b', { 'focus-visibility': rep })] });
  const B = build({ file: 'f', slug: 's', pageSkills: pageOk(), elements: [el('/a', { 'focus-visibility': rep }), el('/b', { 'focus-visibility': par })] });
  assert.equal(A.summary.normativeFailures, 1);
  assert.equal(B.summary.normativeFailures, 1, 'the normative total is identical regardless of which element carries REPRODUCED');
  assert.equal(A.summary.issues.length, 1);
  assert.equal(A.summary.issues[0].verdict, 'REPRODUCED', 'REPRODUCED wins the merge');
});
test('R2.4-E (R23-M1): the representative xpath always carries the WINNING verdict', () => {
  // PARTIAL at the smaller xpath /a, REPRODUCED at the larger /z.
  const A = build({ file: 'f', slug: 's', pageSkills: pageOk(), elements: [
    el('/a', { 'focus-visibility': { verdict: 'PARTIAL', sc: '2.4.7', level: 'AA', evidence: 'same defect' } }),
    el('/z', { 'focus-visibility': { verdict: 'REPRODUCED', sc: '2.4.7', level: 'AA', evidence: 'same defect' } }),
  ] });
  assert.equal(A.summary.issues[0].verdict, 'REPRODUCED');
  assert.equal(A.summary.issues[0].xpath, '/z', 'attributed to /z (which is REPRODUCED), NOT the smaller /a (only PARTIAL)');
});
test('R2.4-E determinism: reordering the SAME elements yields byte-identical output (incl raw casing/whitespace)', () => {
  const mk = order => build({ file: 'f', slug: 's', pageSkills: pageOk(), elements: order.map(([xp, ev]) =>
    el(xp, { 'focus-visibility': { verdict: 'REPRODUCED', sc: '2.4.7', level: 'AA', evidence: ev } })) });
  const A = mk([['/a', 'No   Ring'], ['/b', 'no ring']]); // casing + whitespace variants → one defect
  const B = mk([['/b', 'no ring'], ['/a', 'No   Ring']]);
  assert.equal(A.summary.issues.length, 1, 'casing/whitespace variants merge to one defect');
  assert.deepEqual(A.summary.issues, B.summary.issues, 'identical output regardless of input order');
});
test('R2.3-C determinism: a DUPLICATE summary.issues entry is REJECTED (exact array, not a Set)', () => {
  const R = build({ file: 'f', slug: 's', pageSkills: pageOk(), elements: [el('/a', { 'focus-visibility': { verdict: 'REPRODUCED', sc: '2.4.7', level: 'AA', evidence: 'no ring' } })] });
  R.summary.issues.push({ ...R.summary.issues[0] }); // inject a duplicate
  assert.ok(validateResults(R).errors.some(e => /count 2 != derived 1/.test(e)));
});
test('R2.3-C determinism: a corrupted `rule` on an issue is DETECTED', () => {
  const R = build({ file: 'f', slug: 's', pageSkills: pageOk({ 'page-structure': { verdict: 'REPRODUCED', sc: null, level: null, bucket: 'best-practice', rule: 'page-has-heading-one', evidence: 'no h1' } }), elements: [el('/a')] });
  R.summary.issues[0].rule = 'tampered-rule';
  assert.ok(validateResults(R).errors.some(e => /summary\.issues\[0\] mismatch/.test(e)));
});
test('R2.3-C schema: an UNEXPECTED extra summary field is REJECTED', () => {
  const R = build({ file: 'f', slug: 's', pageSkills: pageOk(), elements: [el('/a')] });
  R.summary.injectedTotal = 999;
  assert.ok(validateResults(R).errors.some(e => /unexpected key "injectedTotal"/.test(e)));
});
test('R2.3-C schema: an UNEXPECTED extra skill key is REJECTED', () => {
  const e = el('/a'); e.skills['made-up-skill'] = { verdict: 'REPRODUCED', sc: '2.4.7', level: 'AA', evidence: 'x' };
  const R = build({ file: 'f', slug: 's', pageSkills: pageOk(), elements: [e] });
  assert.ok(validateResults(R).errors.some(er => /unexpected skill key "made-up-skill"/.test(er)));
});
test('R2.3-C schema: an UNEXPECTED key inside a verdict record is REJECTED', () => {
  const R = build({ file: 'f', slug: 's', pageSkills: pageOk(), elements: [el('/a', { 'focus-visibility': { verdict: 'REPRODUCED', sc: '2.4.7', level: 'AA', evidence: 'x', smuggled: true } })] });
  assert.ok(validateResults(R).errors.some(e => /unexpected key "smuggled"/.test(e)));
});

// ---- R2.3-D: isolation/trust enforcement (R22-H3) ----
test('R2.3-D reject: a definite DYNAMIC verdict resting on SYNTHETIC input must be PARTIAL', () => {
  const R = build({ file: 'f', slug: 's', pageSkills: pageOk(), elements: [el('/a', { 'keyboard-operability': { verdict: 'REPRODUCED', sc: '2.1.1', level: 'A', evidence: 'no kbd', trust: 'synthetic', isolation: 'isolated' } })] });
  assert.ok(validateResults(R).errors.some(e => /SYNTHETIC input must be PARTIAL/.test(e)));
});
test('R2.3-D reject: a definite DYNAMIC verdict resting on a NON-ISOLATED probe must be PARTIAL', () => {
  const R = build({ file: 'f', slug: 's', pageSkills: pageOk(), elements: [el('/a', { 'focus-management': { verdict: 'NOT REPRODUCED', sc: '2.4.3', level: 'A', evidence: 'focus ok', trust: 'trusted', isolation: 'shared' } })] });
  assert.ok(validateResults(R).errors.some(e => /NON-ISOLATED probe must be PARTIAL/.test(e)));
});
test('R2.3-D ALLOW: a definite dynamic verdict on a TRUSTED+ISOLATED probe; PARTIAL may rest on either', () => {
  const R = build({ file: 'f', slug: 's', pageSkills: pageOk(), elements: [
    el('/a', { 'keyboard-operability': { verdict: 'REPRODUCED', sc: '2.1.1', level: 'A', evidence: 'no kbd', trust: 'trusted', isolation: 'isolated' } }),
    el('/b', { 'focus-management': { verdict: 'PARTIAL', sc: '2.4.3', level: 'A', evidence: 'indeterminate', trust: 'synthetic', isolation: 'shared' } }),
  ] });
  assert.equal(validateResults(R).ok, true);
});
test('R2.3-D: the trust/isolation rule does NOT constrain STATIC skills', () => {
  const R = build({ file: 'f', slug: 's', pageSkills: pageOk(), elements: [el('/a', { 'reflow-and-pointer-affordances': { verdict: 'REPRODUCED', sc: '2.5.8', level: 'AA', evidence: 'too small', trust: 'synthetic', isolation: 'shared' } })] });
  assert.equal(validateResults(R).ok, true, 'target size (2.5.8) is a static, geometry-only skill — not behavioral');
});

// ---- R2.4-B: bind definite behavioral verdicts to DRIVER evidence (R23-C2) ----
const { driverEvidenceFrom } = require('../lib/result-builder.js');
function DE(byXpath, formsTrust) { return { driverEvidence: { byXpath: byXpath || {}, formsTrust: formsTrust || { probed: false, allTrustedIsolated: false } } }; }

test('R2.4-B reject: a definite focus-visibility verdict with NO driver focus probe → PARTIAL', () => {
  const R = build({ file: 'f', slug: 's', pageSkills: pageOk(), elements: [el('/a', { 'focus-visibility': { verdict: 'REPRODUCED', sc: '2.4.7', level: 'AA', evidence: 'no ring' } })] });
  const v = validateResults(R, DE({ '/a': { focusProbed: false, activation: null, keyboard: null } }));
  assert.ok(v.errors.some(e => /not supported by driver evidence/.test(e)));
});
test('R2.4-B reject: agent self-attests trusted but the DRIVER shows no trusted+isolated activation', () => {
  const R = build({ file: 'f', slug: 's', pageSkills: pageOk(), elements: [el('/a', { 'focus-management': { verdict: 'NOT REPRODUCED', sc: '2.4.3', level: 'A', evidence: 'ok', trust: 'trusted', isolation: 'isolated' } })] });
  const v = validateResults(R, DE({ '/a': { activation: { trusted: false, isolated: true } } }));
  assert.ok(v.errors.some(e => /not supported by driver evidence/.test(e)), 'driver evidence is authoritative over the agent stamp');
});
test('R2.4-B reject: forms-instructions-errors REPRODUCED with a SYNTHETIC submit → PARTIAL', () => {
  const R = build({ file: 'f', slug: 's', pageSkills: pageOk(), elements: [el('/a', { 'forms-instructions-errors': { verdict: 'REPRODUCED', sc: '3.3.1', level: 'A', evidence: 'no error text' } })] });
  const v = validateResults(R, DE({ '/a': {} }, { probed: true, allTrustedIsolated: false }));
  assert.ok(v.errors.some(e => /synthetic\/non-trusted/.test(e)));
});
test('R2.4-B native presumption supports NOT REPRODUCED but NOT a keyboard FAILURE', () => {
  const nativeEv = { '/a': { keyboard: { trusted: null, isolated: true, exercised: false }, activation: { trusted: true, isolated: true } } };
  const pass = build({ file: 'f', slug: 's', pageSkills: pageOk(), elements: [el('/a', { 'keyboard-operability': { verdict: 'NOT REPRODUCED', sc: '2.1.1', level: 'A', evidence: 'native button operable' } })] });
  assert.equal(validateResults(pass, DE(nativeEv)).ok, true, 'native presumption supports "operable"');
  const fail = build({ file: 'f', slug: 's', pageSkills: pageOk(), elements: [el('/a', { 'keyboard-operability': { verdict: 'REPRODUCED', sc: '2.1.1', level: 'A', evidence: 'keys do nothing' } })] });
  assert.ok(validateResults(fail, DE(nativeEv)).errors.some(e => /native presumption cannot support a keyboard FAILURE/.test(e)));
});
test('R2.4-B ALLOW: a definite verdict backed by a trusted+isolated probe validates', () => {
  const ev = { '/a': { keyboard: { trusted: true, isolated: true, exercised: true }, activation: { trusted: true, isolated: true }, focusProbed: true } };
  const R = build({ file: 'f', slug: 's', pageSkills: pageOk(), elements: [
    el('/a', { 'keyboard-operability': { verdict: 'REPRODUCED', sc: '2.1.1', level: 'A', evidence: 'no kbd' }, 'focus-visibility': { verdict: 'NOT REPRODUCED', sc: '2.4.7', level: 'AA', evidence: 'ring ok' } }),
  ] });
  assert.equal(validateResults(R, DE(ev, { probed: true, allTrustedIsolated: true })).ok, true);
});
test('R2.4-B driverEvidenceFrom distils behavioralTrust/focusIndicator/forms', () => {
  const ev = driverEvidenceFrom({ elements: [{ xpath: '/a', behavioralTrust: { keyboard: { trusted: true, isolated: true, exercised: true }, activation: { trusted: true, isolated: true } }, focusIndicator: { present: true } }], forms: [{ submitMethod: 'trusted' }] });
  assert.equal(ev.byXpath['/a'].focusProbed, true);
  assert.equal(ev.byXpath['/a'].activation.trusted, true);
  assert.deepEqual(ev.formsTrust, { probed: true, allTrustedIsolated: true });
});

// ---- R2.4-F: recursive strictness (R23-M2) ----
test('R2.4-F: a disallowed SC / wrong level on a NOT REPRODUCED verdict is REJECTED', () => {
  const badSc = build({ file: 'f', slug: 's', pageSkills: pageOk(), elements: [el('/a', { 'focus-visibility': { verdict: 'NOT REPRODUCED', sc: '4.1.3', level: 'AA', evidence: 'checked' } })] });
  assert.ok(validateResults(badSc).errors.some(e => /4\.1\.3 not allowed/.test(e)), 'non-issue verdicts are not exempt from SC-allowance');
  const badLvl = build({ file: 'f', slug: 's', pageSkills: pageOk(), elements: [el('/a', { 'focus-visibility': { verdict: 'NOT REPRODUCED', sc: '2.4.7', level: 'A', evidence: 'checked' } })] });
  assert.ok(validateResults(badLvl).errors.some(e => /level A != AA/.test(e)));
});
test('R2.4-F: an unexpected key inside summary.issues[] / countBasis / bySkill cell is REJECTED', () => {
  const base = () => build({ file: 'f', slug: 's', pageSkills: pageOk(), elements: [el('/a', { 'focus-visibility': { verdict: 'REPRODUCED', sc: '2.4.7', level: 'AA', evidence: 'no ring' } })] });
  const issueKey = base(); issueKey.summary.issues[0].smuggled = 1;
  assert.ok(validateResults(issueKey).errors.some(e => /summary\.issues\[0\]: unexpected key "smuggled"/.test(e)));
  const cb = base(); cb.summary.countBasis.smuggled = 1;
  assert.ok(validateResults(cb).errors.some(e => /summary\.countBasis: unexpected key "smuggled"/.test(e)));
  const bs = base(); bs.summary.bySkill['focus-visibility'].smuggled = 1;
  assert.ok(validateResults(bs).errors.some(e => /summary\.bySkill\.focus-visibility: unexpected key "smuggled"/.test(e)));
});

// ---- R2.5-A: OUTCOME-aware behavioral binding (R24-C1) ----
function DEo(byXpath, extra) { return { driverEvidence: Object.assign({ byXpath: byXpath || {}, formsTrust: { probed: false, allTrustedIsolated: false }, formByField: {} }, extra || {}) }; }
test('R2.5-A reject: focus-visibility REPRODUCED 2.4.7 but the driver saw a ring (present:true)', () => {
  const R = build({ file: 'f', slug: 's', pageSkills: pageOk(), elements: [el('/a', { 'focus-visibility': { verdict: 'REPRODUCED', sc: '2.4.7', level: 'AA', evidence: 'no ring' } })] });
  const v = validateResults(R, DEo({ '/a': { focusProbed: true, ringPresent: true } }));
  assert.ok(v.errors.some(e => /contradicts focusIndicator\.present:true/.test(e)), 'a "no ring" verdict cannot stand when the driver detected a ring');
});
test('R2.5-A reject: keyboard-operability REPRODUCED 2.1.1 but the driver saw a key response', () => {
  const R = build({ file: 'f', slug: 's', pageSkills: pageOk(), elements: [el('/a', { 'keyboard-operability': { verdict: 'REPRODUCED', sc: '2.1.1', level: 'A', evidence: 'does not operate' } })] });
  const v = validateResults(R, DEo({ '/a': { keyboard: { trusted: true, isolated: true, exercised: true }, kbdResponseKnown: true, kbdResponded: true } }));
  assert.ok(v.errors.some(e => /contradicts an observed key response/.test(e)));
});
test('R2.5-A reject: dynamic-announcement REPRODUCED 4.1.3 but a meaningful announcement was captured', () => {
  const R = build({ file: 'f', slug: 's', pageSkills: pageOk(), elements: [el('/a', { 'dynamic-announcement': { verdict: 'REPRODUCED', sc: '4.1.3', level: 'AA', evidence: 'not announced' } })] });
  const v = validateResults(R, DEo({ '/a': { activation: { trusted: true, isolated: true }, vsrAnnounced: true } }));
  assert.ok(v.errors.some(e => /contradicts a meaningful vsrAnnouncement/.test(e)));
});
test('R2.5-A reject: forms REPRODUCED 3.3.1 but the field’s OWN form identified the error in text', () => {
  const R = build({ file: 'f', slug: 's', pageSkills: pageOk(), elements: [el('/a', { 'forms-instructions-errors': { verdict: 'REPRODUCED', sc: '3.3.1', level: 'A', evidence: 'error not identified' } })] });
  const v = validateResults(R, DEo({ '/a': {} }, { formsTrust: { probed: true, allTrustedIsolated: true }, formByField: { '/a': { nativeTextIdentification: true, noTextIdentificationAtAll: false, trustedSubmit: true } } }));
  assert.ok(v.errors.some(e => /contradicts nativeTextIdentification:true/.test(e)), 'tied to the field’s OWN form, not a page-level any-form pass');
});
test('R2.5-A ALLOW: verdicts CONSISTENT with the observed outcome validate', () => {
  const R = build({ file: 'f', slug: 's', pageSkills: pageOk(), elements: [
    el('/a', { 'focus-visibility': { verdict: 'REPRODUCED', sc: '2.4.7', level: 'AA', evidence: 'no ring' }, 'dynamic-announcement': { verdict: 'NOT REPRODUCED', sc: '4.1.3', level: 'AA', evidence: 'announced' } }),
  ] });
  const v = validateResults(R, DEo({ '/a': { focusProbed: true, ringPresent: false, activation: { trusted: true, isolated: true }, vsrAnnounced: true } }));
  assert.equal(v.ok, true, 'present:false supports "no ring"; an announcement supports NOT REPRODUCED');
});
