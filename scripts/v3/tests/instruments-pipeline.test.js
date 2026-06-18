// Harness 3.0 — instrument findings WIRING. The VSR/keyboard instruments flow into the bundle as a
// non-authoritative `instruments` stage and surface in the build output as `instrumentFindings`
// (shadow, never authoritative) — mirroring the Phase-3 judgment recommendations. Pure builder tests
// plus an end-to-end orchestrate (Chrome) with runInstruments.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildV3 } = require('../lib/build-v3.js');
const { orchestrate } = require('../lib/orchestrator.js');
const { CHROME } = require('../lib/run-experiments.js');
const { runInstruments } = require('../lib/run-instruments.js');
const puppeteer = require('puppeteer');
const { assetFileUrl, assetPath } = require('../../lib/asset-paths.js');

const scope = { actionTargetRef: 'node:b1', state: 'fresh-load', action: 'tab-to', environment: 'headless-chromium' };
const FULL = { targetIsFocusable: true, keyboardReachableInState: true, realKeyboardFocus: true, hydrationReady: true, focusDependentIndicator: true, obviouslyVisible: true, stableIndicatorAbsence: true, modeCompletenessProven: true };
const baseBundle = () => ({
  collect: { file: 'p', runId: 'R', pageDigest: 'sha256:d', collectedAt: 1000, elements: [{ xpath: 'node:b1', focusable: true }] },
  experiments: { file: 'p', runId: 'R', pageDigest: 'sha256:d', catalogVersion: '3.0.0-phase0', startedAt: 2000, results: [{ claimId: 'c1', experimentId: 'focus-visual-retry', targetXpath: 'node:b1', sc: '2.4.7', observationScope: scope, outcome: FULL, applicabilityEvidence: { targetIsFocusable: true, keyboardReachableInState: true } }] },
  claimProposals: { file: 'p', runId: 'R', pageDigest: 'sha256:d', proposals: [{ claimId: 'c1', sc: '2.4.7', direction: 'NO_BARRIER_OBSERVED', experimentId: 'focus-visual-retry', claimFamily: 'focus-indicator-visible', observationScope: scope }] },
});

test('build: instrument findings surface NON-AUTHORITATIVE and do not affect the authoritative count', () => {
  const withoutInstruments = buildV3(baseBundle());
  const bundle = baseBundle();
  bundle.instruments = { file: 'p', runId: 'R', pageDigest: 'sha256:d', findings: [
    { detector: 'vsr-meaning', sc: '4.1.2', kind: 'no-accessible-name', xpath: '/x', detail: 'interactive element with no accessible name' },
    { detector: 'tab-order', sc: '2.4.3', kind: 'tab-order', xpath: '/y', detail: 'focus order diverges from visual order' },
  ] };
  const r = buildV3(bundle);
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.results.instrumentFindings.length, 2);
  assert.ok(r.results.instrumentFindings.every((f) => f.authoritative === false && f.shadow === true), 'instrument findings are never authoritative');
  assert.equal(r.results.summary.instrumentFindings, 2);
  assert.equal(r.results.summary.authoritative, withoutInstruments.results.summary.authoritative, 'instruments do not change the authoritative count');
});

test('build: a malformed instruments artifact is REFUSED (findings must be an array)', () => {
  const bundle = baseBundle();
  bundle.instruments = { file: 'p', runId: 'R', pageDigest: 'sha256:d', findings: 'nope' };
  const r = buildV3(bundle);
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => /instruments/.test(e)), 'the build refuses a malformed instruments artifact');
});

// ---- end-to-end (Chrome) ----
const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — instruments-pipeline e2e SKIPPED');
const FX = assetFileUrl('fx-v3-vsr-analysis.html');

test('orchestrate(runInstruments): instruments run on the page and surface as non-authoritative findings', { skip: !chromeOK, concurrency: false }, async () => {
  const collect = { file: 'fx-v3-vsr-analysis.html', runId: 'R', pageDigest: 'sha256:fx', collectedAt: 1000, elements: [] };
  const { built, bundle } = await orchestrate(collect, { elements: [] }, { resolveUrl: () => FX, now: 2000, runInstruments: true });
  assert.equal(built.ok, true, JSON.stringify(built.errors));
  assert.ok(bundle.instruments && Array.isArray(bundle.instruments.findings), 'the instruments stage is attached to the bundle');
  assert.ok(bundle.instruments.findings.length >= 1, 'instruments produced findings on a page with known issues');
  assert.ok(built.results.instrumentFindings.length >= 1, 'findings surfaced in the build output');
  assert.ok(built.results.instrumentFindings.every((f) => f.authoritative === false), 'never authoritative');
  // the no-name icon button (4.1.2) and the misplaced link (1.3.2) should be among them
  assert.ok(built.results.instrumentFindings.some((f) => f.kind === 'no-accessible-name'), 'the 4.1.2 no-name finding is present');
  // instruments do not publish authoritative claims
  assert.equal(built.results.summary.authoritative, 0, 'instrument findings never publish authoritative');
});

test('runInstruments (#21): a native alert() raised on a safe click is captured (not silently auto-dismissed)', { skip: !chromeOK, concurrency: false }, async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  let res;
  try {
    const page = await browser.newPage();
    await page.goto(assetFileUrl('fx-v3-native-dialog.html'), { waitUntil: 'load' });
    res = await runInstruments(page, {});
  } finally { await browser.close(); }
  const dlg = res.findings.filter((f) => f.detector === 'native-dialog');
  assert.equal(dlg.length, 1, 'the native alert() raised when the Save button is clicked is captured');
  assert.equal(dlg[0].sc, '4.1.3');
  assert.equal(dlg[0].review, true, 'a native dialog is a review-tier signal, not a decided barrier');
  assert.ok(/native alert\(\) dialog/.test(dlg[0].detail));
});
