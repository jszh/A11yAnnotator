'use strict';
// Item 10 (1.2.x time-based media): a <video> enumerates a media-alternatives (1.2.2) obligation that survives the
// build's fail-closed cross-checks (new skill/SC), binds the rubric, and surfaces the collected media facts.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const oracle = require('../../lib/applicability-oracle.js');
const cov = require('../../lib/coverage-registry.js');
const { buildV3 } = require('../../lib/build-v3.js');
const { selectRubricSubjects, precomputeSignals } = require('../../lib/llm-adjudicator.js');
const { loadRubrics } = require('../../lib/rubric-loader.js');

const ID = { file: 'p', runId: 'R', pageDigest: 'sha256:d' };

test('a <video> enumerates media-alternatives (1.2.2); the coverage registry agrees', () => {
  const el = { xpath: '/v', tag: 'video', isMedia: true, mediaInfo: { mediaTag: 'video', hasCaptionsTrack: false, trackKinds: [] } };
  assert.ok(oracle.familiesFor(el).includes('media-alternatives'));
  assert.ok(cov.expectedFamilies(el).has('media-alternatives'));
  assert.ok(!oracle.familiesFor({ xpath: '/p', tag: 'p' }).includes('media-alternatives'), 'non-media does not');
});

test('buildV3 keeps a 1.2.2 media obligation (auto-PARTIAL) through all cross-checks (new skill/SC)', () => {
  const collect = { ...ID, collectedAt: 1, elements: [{ xpath: '/v', tag: 'video', isMedia: true, mediaInfo: { mediaTag: 'video', hasCaptionsTrack: false, trackKinds: [] } }], structure: { title: 't', headings: [] } };
  const r = buildV3({ collect, experiments: { ...ID, catalogVersion: '3.0.0-phase0', startedAt: 2, results: [] }, claimProposals: { ...ID, proposals: [] } });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  const row = r.results.obligationLedger.find((o) => o.sc === '1.2.2' && o.claimFamily === 'media-alternatives');
  assert.ok(row, '1.2.2 obligation enumerated');
  assert.equal(row.autoPartial, true);
});

test('media-alternatives-v0 rubric loads, binds, and surfaces the media facts (present-but-empty = not captions)', () => {
  const { rubrics } = loadRubrics();
  assert.equal(rubrics['media-alternatives-v0'].sc, '1.2.2');
  const collect = { elements: [{ xpath: '/v', tag: 'video', mediaInfo: { mediaTag: 'video', hasCaptionsTrack: true, captionsTrackEmpty: true, trackKinds: ['captions'] } }] };
  const ledger = [{ xpath: '/v', sc: '1.2.2', claimFamily: 'media-alternatives', autoPartial: true }];
  const sub = selectRubricSubjects(collect, ledger, rubrics).find((s) => s.rubricId === 'media-alternatives-v0');
  assert.ok(sub, 'rubric selected for the video');
  const sig = precomputeSignals(sub.element, 'media-alternatives');
  assert.equal(sig.media.captionsTrackEmpty, true);
  assert.match(sig.media.uncertainReason, /present but EMPTY/i);
});
