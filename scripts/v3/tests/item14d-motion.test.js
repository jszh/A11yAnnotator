'use strict';
// Item 14d (2.2.2 pause/stop/hide): auto-moving content enumerates a motion-control obligation that survives the
// build cross-checks (new skill/SC) and binds the rubric.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const oracle = require('../lib/applicability-oracle.js');
const cov = require('../lib/coverage-registry.js');
const { buildV3 } = require('../lib/build-v3.js');
const { loadRubrics } = require('../lib/rubric-loader.js');
const ID = { file: 'p', runId: 'R', pageDigest: 'sha256:d' };

test('auto-moving content enumerates motion-control (2.2.2); coverage agrees; static content does not', () => {
  assert.ok(oracle.familiesFor({ xpath: '/m', tag: 'marquee', autoMotion: true }).includes('motion-control'));
  assert.ok(cov.expectedFamilies({ xpath: '/m', tag: 'marquee', autoMotion: true }).has('motion-control'));
  assert.ok(!oracle.familiesFor({ xpath: '/d', tag: 'div', autoMotion: false }).includes('motion-control'));
});

test('buildV3 keeps a 2.2.2 motion-control obligation (auto-PARTIAL) through all cross-checks', () => {
  const collect = { ...ID, collectedAt: 1, elements: [{ xpath: '/m', tag: 'marquee', autoMotion: true }], structure: { title: 't', headings: [] } };
  const r = buildV3({ collect, experiments: { ...ID, catalogVersion: '3.0.0-phase0', startedAt: 2, results: [] }, claimProposals: { ...ID, proposals: [] } });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  const row = r.results.obligationLedger.find((o) => o.sc === '2.2.2' && o.claimFamily === 'motion-control');
  assert.ok(row && row.autoPartial === true);
});

test('motion-control-v0 rubric loads', () => {
  assert.equal(loadRubrics().rubrics['motion-control-v0'].sc, '2.2.2');
});
