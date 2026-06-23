'use strict';
// Item 14c (1.3.2 meaningful sequence): a PAGE-LEVEL obligation enumerated ONLY when the vsr detector reports a
// visual-vs-source reading-order divergence (gated, never on every page), surviving the build cross-checks.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildV3 } = require('../../lib/build-v3.js');
const { selectRubricSubjects } = require('../../lib/llm-adjudicator.js');
const { loadRubrics } = require('../../lib/rubric-loader.js');

const ID = { file: 'p', runId: 'R', pageDigest: 'sha256:d' };
const base = () => ({
  collect: { ...ID, collectedAt: 1000, elements: [], structure: { title: 't', lang: 'en', headings: [] } },
  experiments: { ...ID, catalogVersion: '3.0.0-phase0', startedAt: 2000, results: [] },
  claimProposals: { ...ID, proposals: [] },
});

test('1.3.2 meaningful-sequence is NOT enumerated without a reorder divergence', () => {
  const r = buildV3(base());
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.ok(!r.results.obligationLedger.some((o) => o.claimFamily === 'meaningful-sequence'), 'no divergence ⇒ no obligation (no flood)');
});

test('a vsr reading-order divergence enumerates the page-level meaningful-sequence obligation (auto-PARTIAL)', () => {
  const b = base();
  b.instruments = { ...ID, findings: [{ detector: 'vsr', sc: '1.3.2', kind: 'reading-order', xpath: '/html/body/div[1]', phrase: 'x', detail: 'visual order ≠ source order' }] };
  const r = buildV3(b);
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  const row = r.results.obligationLedger.find((o) => o.sc === '1.3.2' && o.claimFamily === 'meaningful-sequence');
  assert.ok(row, 'the divergence enumerates the obligation');
  assert.equal(row.autoPartial, true, 'no deterministic decider ⇒ auto-PARTIAL → LLM');
});

test('sequence-meaning-v0 rubric loads and binds the page-level subject', () => {
  const { rubrics } = loadRubrics();
  assert.equal(rubrics['sequence-meaning-v0'].sc, '1.3.2');
  const ledger = [{ xpath: '/page-level::meaningful-sequence', sc: '1.3.2', claimFamily: 'meaningful-sequence', autoPartial: true }];
  const subs = selectRubricSubjects({ elements: [], structure: { title: 't', headings: [] } }, ledger, rubrics);
  assert.ok(subs.some((s) => s.rubricId === 'sequence-meaning-v0'));
});
