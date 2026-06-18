// Harness 3.0 — the real focus-visual-retry runner against deterministic fixtures, then
// end-to-end through the v3 builder. Gated on a local Chrome (like evidence.test.js).
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { runPlan, CHROME } = require('../lib/run-experiments.js');
const { buildV3 } = require('../lib/build-v3.js');
const { assetFileUrl, assetPath } = require('../../lib/asset-paths.js');

const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — v3 runner suite SKIPPED');

const FIXTURE = assetFileUrl('fx-v3-focus.html');
const plan = {
  file: 'fx-v3-focus.html', runId: 'R', pageDigest: 'sha256:fx', _startedAt: 1000,
  requests: [
    { candidateId: 'c-real', experimentId: 'focus-visual-retry', targetXpath: '/html/body/button[1]', sc: '2.4.7' },
    { candidateId: 'c-none', experimentId: 'focus-visual-retry', targetXpath: '/html/body/button[2]', sc: '2.4.7' },
    { candidateId: 'c-always', experimentId: 'focus-visual-retry', targetXpath: '/html/body/button[3]', sc: '2.4.7' },
  ],
};

test('focus-visual-retry measures focus-dependence: real ring clears; no-indicator & always-on are barriers', { skip: !chromeOK, concurrency: false }, async () => {
  const exp = await runPlan(plan, { resolveUrl: () => FIXTURE });
  const byId = {}; for (const r of exp.results) byId[r.claimId] = r;

  // #real: focusable, keyboard-reached, focus-DEPENDENT obvious indicator
  const real = byId['c-real'].outcome;
  assert.equal(real.targetIsFocusable, true);
  assert.equal(real.keyboardReachableInState, true, 'tabbed to the real button');
  assert.equal(real.focusDependentIndicator, true, 'a focus-dependent ring appeared');
  assert.equal(real.obviouslyVisible, true);

  // #none: reached, but no indicator → stable absence (barrier evidence), not a clear
  const none = byId['c-none'].outcome;
  assert.equal(none.focusDependentIndicator, false);
  assert.equal(none.stableIndicatorAbsence, true);

  // #always: an always-on shadow that does not change on focus is NOT focus-dependent → barrier
  const always = byId['c-always'].outcome;
  assert.equal(always.focusDependentIndicator, false, 'always-on styling is not a focus indicator');
  assert.equal(always.stableIndicatorAbsence, true);

  // ---- end-to-end through the builder (PROMOTED): real clears, the others reproduce a barrier ----
  const collect = { file: 'fx-v3-focus.html', runId: 'R', pageDigest: 'sha256:fx', collectedAt: 500, elements: [
    { xpath: '/html/body/button[1]', focusable: true },
    { xpath: '/html/body/button[2]', focusable: true },
    { xpath: '/html/body/button[3]', focusable: true },
  ] };
  const fam = 'focus-indicator-visible';
  const proposals = [
    { claimId: 'c-real', sc: '2.4.7', direction: 'NO_BARRIER_OBSERVED', experimentId: 'focus-visual-retry', claimFamily: fam, observationScope: byId['c-real'].observationScope },
    { claimId: 'c-none', sc: '2.4.7', direction: 'BARRIER_OBSERVED', experimentId: 'focus-visual-retry', claimFamily: fam, observationScope: byId['c-none'].observationScope },
    { claimId: 'c-always', sc: '2.4.7', direction: 'BARRIER_OBSERVED', experimentId: 'focus-visual-retry', claimFamily: fam, observationScope: byId['c-always'].observationScope },
  ];
  const { withPipeline, promoted } = require('./helpers.js');
  const PROMOTED = promoted(['focus-visual-retry/NO_BARRIER_OBSERVED', 'focus-visual-retry/BARRIER_OBSERVED']);
  const bundle = withPipeline({ collect, experiments: { file: 'fx-v3-focus.html', runId: 'R', pageDigest: 'sha256:fx', catalogVersion: '3.0.0-phase0', startedAt: 1000, results: exp.results }, claimProposals: { file: 'fx-v3-focus.html', runId: 'R', pageDigest: 'sha256:fx', proposals } });
  const r = buildV3(bundle, { authority: PROMOTED });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  const claimBy = {}; for (const c of r.results.claims) claimBy[c.claimId] = c;
  assert.equal(claimBy['c-real'].observationOutcome, 'NO_BARRIER_OBSERVED');
  assert.equal(claimBy['c-none'].observationOutcome, 'BARRIER_OBSERVED');
  assert.equal(claimBy['c-always'].observationOutcome, 'BARRIER_OBSERVED');
});
