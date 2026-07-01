// #6 fix — 1.3.1 now has TWO rubrics (routing is by SC, not claimFamily — see selectRubricSubjects): the
// pre-existing info-relationships-v0 (page-level: headings/lists/table-header-association) and the new
// field-programmatic-association-v0 (per-field: TT 5.C accessible-name/description + table-context +
// graphical-cue association, previously unreachable — the only rubric that would catch it, field-label-v0, is
// scoped to SC 3.3.2, a different, presence-only TT test per refs/trusted-tester/sc-3.3.2-labels-or-instructions.md).
// This pins the RUBRIC_GATE mutual exclusivity: without it, each rubric would ALSO fire on the other's row
// (info-relationships-v0 has no per-field judgment to make; field-programmatic-association-v0 has no page-level
// judgment to make) — wasted/nonsensical LLM calls, not just noise.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const oracle = require('../../lib/applicability-oracle.js');
const { selectRubricSubjects } = require('../../lib/llm-adjudicator.js');

const RUBRICS = {
  'info-relationships-v0': { id: 'info-relationships-v0', sc: '1.3.1', skill: 'grouping-and-reading-order', visionEvidence: ['viewport'] },
  'field-programmatic-association-v0': { id: 'field-programmatic-association-v0', sc: '1.3.1', skill: 'grouping-and-reading-order', visionEvidence: ['element-crop', 'surrounding-region'] },
};
const ids = (subs, xp) => subs.filter((s) => s.xpath === xp).map((s) => s.rubricId).sort();

test('applicability-oracle: a form field owes field-programmatic-association (1.3.1) alongside field-label (3.3.2) and error-identification (3.3.1)', () => {
  const field = { xpath: '/input', isFormField: true, role: 'textbox' };
  const scs = oracle.deriveObligations({ elements: [field] }).filter((o) => o.xpath === '/input').map((o) => o.sc);
  assert.ok(scs.includes('1.3.1'), 'the new 1.3.1 obligation is minted');
  assert.ok(scs.includes('3.3.2'), 'the pre-existing 3.3.2 field-label obligation is unaffected');
  assert.ok(scs.includes('3.3.1'), 'the pre-existing 3.3.1 error-identification obligation is unaffected');
});

test('applicability-oracle: a non-form element does NOT owe field-programmatic-association', () => {
  const link = { xpath: '/a', role: 'link' };
  const scs = oracle.deriveObligations({ elements: [link] }).filter((o) => o.xpath === '/a' && o.claimFamily === 'field-programmatic-association');
  assert.equal(scs.length, 0);
});

test('routing #6: the page-level info-relationships row gets ONLY info-relationships-v0 (not the field rubric)', () => {
  const collect = { elements: [] };
  const ledger = [{ xpath: oracle.PAGE_INFOREL_XPATH, sc: '1.3.1', claimFamily: 'info-relationships', autoPartial: true }];
  const subs = selectRubricSubjects(collect, ledger, RUBRICS);
  assert.deepEqual(ids(subs, oracle.PAGE_INFOREL_XPATH), ['info-relationships-v0']);
});

test('routing #6: a per-field 1.3.1 row gets ONLY field-programmatic-association-v0 (not info-relationships-v0)', () => {
  const collect = { elements: [{ xpath: '/input', isFormField: true, role: 'textbox' }] };
  const ledger = [{ xpath: '/input', sc: '1.3.1', claimFamily: 'field-programmatic-association', autoPartial: true }];
  const subs = selectRubricSubjects(collect, ledger, RUBRICS);
  assert.deepEqual(ids(subs, '/input'), ['field-programmatic-association-v0']);
});

test('routing #6: a page WITH both a page-level row AND per-field rows splits cleanly (mutual exclusivity, no cross-firing)', () => {
  const collect = { elements: [
    { xpath: '/input1', isFormField: true, role: 'textbox' },
    { xpath: '/input2', isFormField: true, role: 'combobox' }, // role-only match (FORMFIELD_ROLE), not isFormField
  ] };
  const ledger = [
    { xpath: oracle.PAGE_INFOREL_XPATH, sc: '1.3.1', claimFamily: 'info-relationships', autoPartial: true },
    { xpath: '/input1', sc: '1.3.1', claimFamily: 'field-programmatic-association', autoPartial: true },
    { xpath: '/input2', sc: '1.3.1', claimFamily: 'field-programmatic-association', autoPartial: true },
  ];
  const subs = selectRubricSubjects(collect, ledger, RUBRICS);
  assert.deepEqual(ids(subs, oracle.PAGE_INFOREL_XPATH), ['info-relationships-v0']);
  assert.deepEqual(ids(subs, '/input1'), ['field-programmatic-association-v0']);
  assert.deepEqual(ids(subs, '/input2'), ['field-programmatic-association-v0']);
  assert.equal(subs.length, 3, 'exactly 3 subjects total — no cross-firing duplication');
});

test('routing #6 REGRESSION GUARD: a role-only formfield match (FORMFIELD_ROLE, no isFormField flag) still gates correctly (real collector records sometimes carry role but not isFormField)', () => {
  const collect = { elements: [{ xpath: '/combo', roleAttr: 'combobox' }] }; // no isFormField, no top-level role — mirrors real collector shape (role read from roleAttr/axRole/sampledRole)
  const ledger = [{ xpath: '/combo', sc: '1.3.1', claimFamily: 'field-programmatic-association', autoPartial: true }];
  const subs = selectRubricSubjects(collect, ledger, RUBRICS);
  assert.deepEqual(ids(subs, '/combo'), ['field-programmatic-association-v0']);
});
