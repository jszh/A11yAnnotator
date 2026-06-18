'use strict';
// Item 11 (4.1.3 status messages): a live region enumerates a status-message obligation that survives the build's
// fail-closed cross-checks (coverage/enumeration/catalog) and binds the status-message-v0 rubric.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const oracle = require('../lib/applicability-oracle.js');
const cov = require('../lib/coverage-registry.js');
const { buildV3 } = require('../lib/build-v3.js');
const { selectRubricSubjects } = require('../lib/llm-adjudicator.js');
const { loadRubrics } = require('../lib/rubric-loader.js');
const { withPipeline, reseal, promoted } = require('./helpers.js');

const ID = { file: 'p', runId: 'R', pageDigest: 'sha256:d' };

test('a live region enumerates status-message (4.1.3); the coverage registry agrees', () => {
  const el = { xpath: '/sr', roleAttr: 'status', sampledRole: 'status', axRole: 'status', liveRegion: true };
  assert.ok(oracle.familiesFor(el).includes('status-message'));
  assert.ok(cov.expectedFamilies(el).has('status-message'));
  // aria-live without a live role also qualifies (set by the collector)
  assert.ok(oracle.familiesFor({ xpath: '/d', liveRegion: true }).includes('status-message'));
  // a non-live element does NOT
  assert.ok(!oracle.familiesFor({ xpath: '/p', roleAttr: '', liveRegion: false }).includes('status-message'));
});

test('buildV3 keeps a 4.1.3 status-message obligation (auto-PARTIAL) through all fail-closed cross-checks', () => {
  const collect = { ...ID, collectedAt: 1, elements: [{ xpath: '/sr', roleAttr: 'status', sampledRole: 'status', axRole: 'status', liveRegion: true }], structure: { title: 't', headings: [] } };
  const b = withPipeline({ collect, experiments: { ...ID, catalogVersion: '3.0.0-phase0', startedAt: 2, results: [] }, claimProposals: { ...ID, proposals: [] } });
  const r = buildV3(reseal(b), { authority: promoted([]) });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  const row = r.results.obligationLedger.find((o) => o.sc === '4.1.3' && o.claimFamily === 'status-message');
  assert.ok(row, '4.1.3 status-message obligation enumerated');
  assert.equal(row.autoPartial, true, 'no deterministic decider ⇒ auto-PARTIAL → LLM');
});

test('the status-message-v0 rubric loads and binds the 4.1.3 subject', () => {
  const { rubrics } = loadRubrics();
  assert.ok(rubrics['status-message-v0'], 'rubric registered');
  assert.equal(rubrics['status-message-v0'].sc, '4.1.3');
  const ledger = [{ xpath: '/sr', sc: '4.1.3', claimFamily: 'status-message', autoPartial: true }];
  const subs = selectRubricSubjects({ elements: [{ xpath: '/sr', liveRegion: true }] }, ledger, rubrics);
  assert.ok(subs.some((s) => s.rubricId === 'status-message-v0'), 'the rubric is selected for the live-region subject');
});
