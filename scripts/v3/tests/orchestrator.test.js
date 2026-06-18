// Harness 3.0 — deterministic proposer (pure), full orchestrate (Chrome-gated), replay determinism.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { proposeClaims, directionForFocusVisible } = require('../lib/proposer.js');
const { orchestrate } = require('../lib/orchestrator.js');
const { buildV3 } = require('../lib/build-v3.js');
const { CHROME } = require('../lib/run-experiments.js');
const { assetFileUrl, assetPath } = require('../../lib/asset-paths.js');

const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — v3 orchestrate suite SKIPPED');

test('deterministic proposer picks direction only for unambiguous outcomes', () => {
  assert.equal(directionForFocusVisible({ focusDependentIndicator: true, obviouslyVisible: true, keyboardReachableInState: true, realKeyboardFocus: true, hydrationReady: true }), 'NO_BARRIER_OBSERVED');
  assert.equal(directionForFocusVisible({ stableIndicatorAbsence: true, keyboardReachableInState: true, realKeyboardFocus: true, hydrationReady: true }), 'BARRIER_OBSERVED');
  assert.equal(directionForFocusVisible({ focusDependentIndicator: true, obviouslyVisible: false, keyboardReachableInState: true, realKeyboardFocus: true, hydrationReady: true }), null, 'not obviously visible ⇒ ambiguous ⇒ no proposal');
  const out = proposeClaims({ file: 'p', runId: 'R', pageDigest: 'd' }, { results: [
    { claimId: 'x', sc: '2.4.7', experimentId: 'focus-visual-retry', observationScope: {}, outcome: { focusDependentIndicator: true, obviouslyVisible: true, keyboardReachableInState: true, realKeyboardFocus: true, hydrationReady: true } },
    { claimId: 'y', sc: '2.4.7', experimentId: 'focus-visual-retry', observationScope: {}, outcome: { hydrationReady: false } },
  ] });
  assert.equal(out.proposals.length, 1);
  assert.equal(out.proposals[0].claimId, 'x');
});

test('replay determinism: building twice over a frozen bundle yields identical results', () => {
  const FULL = { targetIsFocusable: true, keyboardReachableInState: true, realKeyboardFocus: true, hydrationReady: true, focusDependentIndicator: true, obviouslyVisible: true, stableIndicatorAbsence: true, modeCompletenessProven: true };
  const scope = { actionTargetRef: 'node:b1', state: 'fresh-load', action: 'tab-to', environment: 'headless-chromium' };
  const bundle = {
    collect: { file: 'p', runId: 'R', pageDigest: 'sha256:d', collectedAt: 1000, elements: [{ xpath: 'node:b1', focusable: true }] },
    experiments: { file: 'p', runId: 'R', pageDigest: 'sha256:d', catalogVersion: '3.0.0-phase0', startedAt: 2000, results: [{ claimId: 'c1', experimentId: 'focus-visual-retry', targetXpath: 'node:b1', sc: '2.4.7', observationScope: scope, outcome: FULL, applicabilityEvidence: { targetIsFocusable: true, keyboardReachableInState: true } }] },
    claimProposals: { file: 'p', runId: 'R', pageDigest: 'sha256:d', proposals: [{ claimId: 'c1', sc: '2.4.7', direction: 'NO_BARRIER_OBSERVED', experimentId: 'focus-visual-retry', claimFamily: 'focus-indicator-visible', observationScope: scope }] },
  };
  assert.deepEqual(buildV3(bundle).results, buildV3(bundle).results);
});

const FIXTURE_PATH = assetPath('fx-v3-focus.html');
const FIXTURE = 'file://' + FIXTURE_PATH;
// the runner binds the digest of the resource it ACTUALLY loaded (audit V3R4-C1); the collector's
// declared pageDigest must equal that for a promoted clear to publish — so compute the real digest.
const attest = require('../lib/attestation.js');
const FIXTURE_DIGEST = attest.pageDigestOf(fs.readFileSync(FIXTURE_PATH)); // RAW BYTES (same domain as the runner)

const { promoted } = require('./helpers.js');
const PROMOTED = promoted(['focus-visual-retry/NO_BARRIER_OBSERVED', 'focus-visual-retry/BARRIER_OBSERVED']);

test('orchestrate is SHADOW by default: gate-passing focus observations do not publish (audit V3-C2)', { skip: !chromeOK, concurrency: false }, async () => {
  const collect = { file: 'fx-v3-focus.html', runId: 'R', pageDigest: 'sha256:fx', collectedAt: 1000, elements: [
    { xpath: '/html/body/button[1]', focusable: true, role: 'button', hasText: true },
  ] };
  const { built } = await orchestrate(collect, { elements: [] }, { resolveUrl: () => FIXTURE, now: 2000 });
  assert.equal(built.ok, true, JSON.stringify(built.errors));
  assert.equal(built.results.summary.authoritative, 0, 'nothing publishes under default-shadow authority');
  assert.ok(built.results.summary.shadow >= 1, 'the would-be clear is recorded as a shadow observation');
});

test('orchestrate (focus PROMOTED): real ring clears, no-indicator barriers; ONLY promoted focus publishes', { skip: !chromeOK, concurrency: false }, async () => {
  const collect = { file: 'fx-v3-focus.html', runId: 'R', pageDigest: FIXTURE_DIGEST, collectedAt: 1000, elements: [
    { xpath: '/html/body/button[1]', focusable: true, role: 'button', hasText: true },
    { xpath: '/html/body/button[2]', focusable: true, role: 'button', hasText: true },
    { xpath: '/html/body/button[3]', focusable: true, role: 'button', hasText: true },
  ] };
  const drive = { elements: [] }; // no baseline focus evidence ⇒ all indeterminate ⇒ all get focus candidates
  // all 8 experiments now run via the normal pipeline (audit V3R2-H1): focusable+button+text ⇒
  // focus + keyboard-activation + text-contrast + ax-state-diff candidates per button.
  const { plan, built } = await orchestrate(collect, drive, { resolveUrl: () => FIXTURE, now: 2000, authority: PROMOTED });
  assert.ok(plan.requests.length >= 3, `every enumerated obligation is scheduled (got ${plan.requests.length})`);
  assert.equal(built.ok, true, JSON.stringify(built.errors));
  // ONLY focus-visual-retry is promoted ⇒ all authoritative claims are 2.4.7 focus claims.
  assert.ok(built.results.claims.every((c) => c.sc === '2.4.7'), 'only the promoted focus mechanism publishes');
  assert.ok(built.results.claims.some((c) => c.observationOutcome === 'NO_BARRIER_OBSERVED'), 'the real-ring button cleared');
  assert.ok(built.results.claims.some((c) => c.observationOutcome === 'BARRIER_OBSERVED'), 'a no-indicator button reproduced a barrier');
  assert.ok(built.results.summary.shadow >= 1, 'non-promoted experiments are recorded as shadow, not published');
});
