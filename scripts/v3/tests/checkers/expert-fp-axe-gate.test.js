// Expert-study FP root cause (docs/analysis/EXPERT-FP-ROOT-CAUSE-2026-09-25.md) — the axe PROMOTION gate.
// A decided axe violation fills a 4.1.2 / 1.1.1 obligation as a PROVISIONAL barrier. Two rules no longer promote
// on their own:
//   · aria-prohibited-attr on a node that is not a user-interface component (ARIA legality ≠ a 4.1.2 barrier;
//     ACT lists 4.1.2 as a SECONDARY requirement of kb1m8s/5c01ea) — it stays a shadow checker signal;
//   · object-alt on an object ACT 8fc3b6 does not apply to (non image/audio/video MIME, or not rendered).
// Findings without nodeFacts (older collector output) keep the previous behaviour.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildV3 } = require('../../lib/build-v3.js');

const bundleWith = (findings) => ({
  collect: { file: 'p', runId: 'R', pageDigest: 'sha256:d', collectedAt: 1000, elements: [] },
  experiments: { file: 'p', runId: 'R', pageDigest: 'sha256:d', catalogVersion: '3.0.0-phase0', startedAt: 2000, results: [] },
  claimProposals: { file: 'p', runId: 'R', pageDigest: 'sha256:d', proposals: [] },
  checkerFindings: { file: 'p', runId: 'R', pageDigest: 'sha256:d', source: 'axe', ran: true, findings },
});
const axe = (ruleId, sc, xpath, nodeFacts) => ({ source: 'axe', detector: 'axe:' + ruleId, ruleId, sc, impact: 'serious', kind: 'violation', xpath, review: false, ...(nodeFacts ? { nodeFacts } : {}) });
const barrierAt = (r, xpath, sc) => r.results.obligationLedger.some((o) => o.xpath === xpath && o.sc === sc && o.provisional
  && o.provisional.outcome === 'BARRIER_OBSERVED' && /^axe:/.test(o.provisional.mechanism || ''));

test('axe gate: aria-prohibited-attr promotes only on a UI component; legacy findings without facts still promote', () => {
  const r = buildV3(bundleWith([
    axe('aria-prohibited-attr', '4.1.2', '/html/body/i[1]', { w: 14, h: 14, interactive: false }),   // tick icon beside "Verified buyer"
    axe('aria-prohibited-attr', '4.1.2', '/html/body/div[2]/i[1]', { w: 32, h: 32, interactive: true }), // mouse-only bell
    axe('aria-prohibited-attr', '4.1.2', '/html/body/span[3]'),                                          // no facts ⇒ previous path
  ]));
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(barrierAt(r, '/html/body/i[1]', '4.1.2'), false, 'non-interactive aria-label host is not a published 4.1.2 barrier');
  assert.equal(barrierAt(r, '/html/body/div[2]/i[1]', '4.1.2'), true, 'an operable control with an ignored name still is');
  assert.equal(barrierAt(r, '/html/body/span[3]', '4.1.2'), true, 'no nodeFacts ⇒ unchanged');
  assert.ok(r.results.checkerFindings.some((f) => f.xpath === '/html/body/i[1]'), 'the gated finding is still surfaced as a shadow checker signal');
});

test('axe gate: object-alt follows ACT applicability (image/audio/video, rendered)', () => {
  const r = buildV3(bundleWith([
    axe('object-alt', '1.1.1', '/html/body/object[1]', { w: 1, h: 1, mime: 'application/x-shockwave-flash' }),
    axe('object-alt', '1.1.1', '/html/body/object[2]', { w: 300, h: 200, mime: 'application/x-shockwave-flash' }),
    axe('object-alt', '1.1.1', '/html/body/object[3]', { w: 300, h: 200, mime: 'image/png' }),
    axe('object-alt', '1.1.1', '/html/body/object[4]', { w: 300, h: 200, mime: null }),
  ]));
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(barrierAt(r, '/html/body/object[1]', '1.1.1'), false, '1x1 off-screen capability probe');
  assert.equal(barrierAt(r, '/html/body/object[2]', '1.1.1'), false, 'non-media MIME is outside the rule');
  assert.equal(barrierAt(r, '/html/body/object[3]', '1.1.1'), true, 'rendered image object without a name');
  assert.equal(barrierAt(r, '/html/body/object[4]', '1.1.1'), true, 'unknown MIME ⇒ conservative, still promotes');
});
