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

test('table-association: UNCERTAIN for a no-scope/no-headers data table with NO positional facts (older packs / fallback)', () => {
  // a table carrying no simple-positional facts (firstRowAllTh/regularGrid absent) is NOT subtracted — backward
  // compatible with packs frozen before #3, and the genuine no-structure ambiguity zone the rubric must judge.
  const v = sig([dataTable({ headers: [{}], tdWithHeaders: 0 })]);
  assert.equal(v.perTable[0], 'UNCERTAIN');
  assert.equal(v.page, 'HAS_UNCERTAIN', 'left to the judge → recall on the GT-fail preserved');
});

// ===================== #3 simple-positional VALID (FP fix, verified on real DOM in probe-tables.js) =====================
const posOK = (over) => dataTable({ headers: [{}], tdWithHeaders: 0, firstRowAllTh: true, firstColAllTh: false, regularGrid: true, bodyTh: 0, headerRows: 1, ...over });
test('table-association #3: a regular column-header table (9fbe21: <thead> + colspan-matched data row) ⇒ VALID', () => {
  assert.equal(sig([posOK({})]).perTable[0], 'VALID', 'first-row-all-th + regular grid ⇒ positionally determinable');
});
test('table-association #3: a regular 2-D first-row+first-column table (47a80a) ⇒ VALID', () => {
  assert.equal(sig([posOK({ firstColAllTh: true })]).perTable[0], 'VALID');
});
test('table-association #3: a pure row-header table (first column all th, no header row) ⇒ VALID', () => {
  assert.equal(sig([posOK({ firstRowAllTh: false, firstColAllTh: true, headerRows: 0 })]).perTable[0], 'VALID');
});
test('table-association #3 RECALL GUARD: an IRREGULAR grid (664972fe: 2-col header, 1-cell data, no colspan) stays UNCERTAIN', () => {
  assert.equal(sig([posOK({ regularGrid: false })]).perTable[0], 'UNCERTAIN', 'ragged logical widths ⇒ not positionally determinable ⇒ judged (GT-fail recall preserved)');
});
test('table-association #3 RECALL GUARD: a scattered mid-body th (needs scope) stays UNCERTAIN', () => {
  assert.equal(sig([posOK({ bodyTh: 1 })]).perTable[0], 'UNCERTAIN');
});
test('table-association #3 RECALL GUARD: a multi-row header stack (headerRows>1, needs scope) stays UNCERTAIN', () => {
  assert.equal(sig([posOK({ headerRows: 2 })]).perTable[0], 'UNCERTAIN');
});
test('table-association #3: a BROKEN headers= ref still dominates the positional path (BROKEN, not VALID)', () => {
  assert.equal(sig([posOK({ danglingIdref: true })]).perTable[0], 'BROKEN', 'a real broken ref is a barrier regardless of grid shape');
});

test('table-association: BROKEN dominates UNCERTAIN at the page level', () => {
  assert.equal(sig([dataTable({}), dataTable({ danglingIdref: true })]).page, 'HAS_BROKEN');
});

// ===================== #4 partial-axis FP fix (DHS Trusted-Tester 511654-19, testId 14.B) =====================
// top__table: row 0 = [th "Rank", td "First", td "Second", td "Third"]; rows 1-2 = [th "Name"/"Year", td, td, td].
// firstColAllTh=true (every row's cell 0 is a real <th>), but row 0 itself mixes ONE <th> with three plain <td>
// that a sighted user reads as column labels — DHS ground truth: FAIL (column headers never marked up at all).
// Before #4 this was wrongly certified VALID via firstColAllTh alone, hard-gating the LLM away from a real barrier.
test('table-association #4 FP FIX: firstColAllTh alone is NOT enough when row 0 is a partially-marked header row (511654-19 14.B) ⇒ UNCERTAIN', () => {
  const v = sig([dataTable({
    headers: [{}], tdWithHeaders: 0,
    firstRowAllTh: false, firstColAllTh: true, firstRowPartialTh: true, firstColPartialTh: false,
    regularGrid: true, bodyTh: 0, headerRows: 0,
  })]);
  assert.equal(v.perTable[0], 'UNCERTAIN', 'a half-marked row-0 header attempt must not be waved through via the column axis');
  assert.equal(v.page, 'HAS_UNCERTAIN');
});
test('table-association #4 FP FIX (symmetric): firstRowAllTh alone is NOT enough when column 0 is partially-marked ⇒ UNCERTAIN', () => {
  const v = sig([dataTable({
    headers: [{}], tdWithHeaders: 0,
    firstRowAllTh: true, firstColAllTh: false, firstRowPartialTh: false, firstColPartialTh: true,
    regularGrid: true, bodyTh: 0, headerRows: 1,
  })]);
  assert.equal(v.perTable[0], 'UNCERTAIN');
});
test('table-association #4 NO OVER-SUPPRESSION: a clean row-header-only table (no partial marking on the other axis) stays VALID', () => {
  // guards against the fix being too aggressive — a genuinely single-axis table (column 0 all-th, row 0 all plain
  // <td> with NO th at all, i.e. firstRowPartialTh=false) must still clear via the column axis as before #4.
  assert.equal(sig([dataTable({
    headers: [{}], tdWithHeaders: 0,
    firstRowAllTh: false, firstColAllTh: true, firstRowPartialTh: false, firstColPartialTh: false,
    regularGrid: true, bodyTh: 0, headerRows: 0,
  })]).perTable[0], 'VALID');
});
test('table-association #4 NO OVER-SUPPRESSION: a clean two-axis table (both first-row and first-col fully <th>) stays VALID', () => {
  // both axes complete ⇒ each axis's own partial flag is false by construction ⇒ unaffected by #4.
  assert.equal(sig([dataTable({
    headers: [{}], tdWithHeaders: 0,
    firstRowAllTh: true, firstColAllTh: true, firstRowPartialTh: false, firstColPartialTh: false,
    regularGrid: true, bodyTh: 0, headerRows: 1,
  })]).perTable[0], 'VALID');
});
test('table-association #4 backward-compat: older collector packs missing the partial-axis facts (undefined) behave as before #4', () => {
  const v = posOK({}); // posOK never sets firstRowPartialTh/firstColPartialTh — both undefined
  assert.equal(sig([v]).perTable[0], 'VALID', 'undefined partial flags must not newly suppress a pack frozen before #4');
});
