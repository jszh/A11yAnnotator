'use strict';
// #1 deterministic 1.3.1 table-association SUBTRACTION: precomputeSignals derives a per-table + page verdict from the
// collector's wiring flags so the info-relationships rubric cannot hallucinate a header-association barrier where the
// facts settle it (a25f45 had 0 data tables; Gemini invented one). The verdict subtracts NO_DATA / VALID / NOT_DATA
// tables and leaves only UNCERTAIN (no-scope) / BROKEN to the judge — so the d0f69e GT-pass and GT-fail (collector-
// identical no-scope tables) are BOTH left judgeable (recall preserved).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { precomputeSignals } = require('../../lib/llm-adjudicator.js');

const sig = (tables) => {
  const el = { xpath: '/page-level::info-relationships', __pageStructure: { title: 't', headings: [], lists: [], tables } };
  const s = precomputeSignals(el, 'grouping-and-reading-order', '1.3.1');
  return s.structure.tableAssociation;
};
const dataTable = (over) => ({ rowCount: 2, thCount: 1, tdCount: 1, looksLikeDataTable: true, roleOverride: null, danglingIdref: false, headersRefsNonCell: false, headersRefsSelf: false, headers: [{}], tdWithHeaders: 0, ...over });

test('table-association: NO_DATA_TABLE when no data table is collected (the a25f45 hallucination guard)', () => {
  assert.deepEqual(sig([]), { page: 'NO_DATA_TABLE', hasDataTable: false, perTable: [] });
  assert.equal(sig([dataTable({ looksLikeDataTable: false })]).page, 'NO_DATA_TABLE', 'non-data table ⇒ no data table');
  assert.equal(sig([dataTable({ roleOverride: 'presentation' })]).page, 'NO_DATA_TABLE', 'role=presentation ⇒ no data table');
});

test('table-association: VALID when scope OR a resolving headers= ref is present', () => {
  assert.equal(sig([dataTable({ headers: [{ scope: 'col' }] })]).perTable[0], 'VALID', 'scope present ⇒ VALID');
  assert.equal(sig([dataTable({ tdWithHeaders: 1 })]).perTable[0], 'VALID', 'a resolving headers= ref ⇒ VALID');
  assert.equal(sig([dataTable({ headers: [{ scope: 'col' }] })]).page, 'ALL_VALID');
});

test('table-association: BROKEN on a dangling/non-cell/self ref (a real barrier — judged)', () => {
  assert.equal(sig([dataTable({ danglingIdref: true })]).perTable[0], 'BROKEN');
  assert.equal(sig([dataTable({ headersRefsNonCell: true })]).perTable[0], 'BROKEN');
  assert.equal(sig([dataTable({ headersRefsSelf: true })]).perTable[0], 'BROKEN');
  assert.equal(sig([dataTable({ danglingIdref: true })]).page, 'HAS_BROKEN');
});

test('table-association: UNCERTAIN for a no-scope/no-headers data table — the judgment zone is NOT subtracted', () => {
  // this is the d0f69e shape: GT-pass and GT-fail are collector-identical here, so the rubric must judge BOTH.
  const v = sig([dataTable({ headers: [{}], tdWithHeaders: 0 })]);
  assert.equal(v.perTable[0], 'UNCERTAIN');
  assert.equal(v.page, 'HAS_UNCERTAIN', 'left to the judge → recall on the GT-fail preserved');
});

test('table-association: BROKEN dominates UNCERTAIN at the page level', () => {
  assert.equal(sig([dataTable({}), dataTable({ danglingIdref: true })]).page, 'HAS_BROKEN');
});
