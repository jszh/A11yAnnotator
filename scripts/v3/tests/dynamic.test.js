// Harness 3.0 — dynamic / provisional subjects (plan Rule 13): typed discovery provenance,
// content-addressed fingerprints, deterministic obligation expansion + reconciliation.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const dynamic = require('../lib/dynamic-subjects.js');
const { buildV3 } = require('../lib/build-v3.js');
const { withPipeline, promoted } = require('./helpers.js');

const SCOPE = { actionTargetRef: 'node:b1', state: 'fresh-load', action: 'tab-to', environment: 'headless-chromium' };
const FULL = { targetIsFocusable: true, keyboardReachableInState: true, realKeyboardFocus: true, hydrationReady: true, focusDependentIndicator: true, obviouslyVisible: true, stableIndicatorAbsence: true, modeCompletenessProven: true };

function bundleWith(discoveredSubjects) {
  return withPipeline({
    collect: { file: 'p', runId: 'R', pageDigest: 'sha256:d', collectedAt: 1, elements: [{ xpath: 'node:b1', focusable: true }] },
    experiments: { file: 'p', runId: 'R', pageDigest: 'sha256:d', catalogVersion: '3.0.0-phase0', startedAt: 2, results: [
      { claimId: 'c1', experimentId: 'focus-visual-retry', targetXpath: 'node:b1', sc: '2.4.7', observationScope: SCOPE, outcome: { ...FULL }, applicabilityEvidence: { targetIsFocusable: true, keyboardReachableInState: true }, valid: true, completed: true, discoveredSubjects },
    ] },
    claimProposals: { file: 'p', runId: 'R', pageDigest: 'sha256:d', proposals: [{ claimId: 'c1', sc: '2.4.7', direction: 'NO_BARRIER_OBSERVED', experimentId: 'focus-visual-retry', claimFamily: 'focus-indicator-visible', observationScope: SCOPE }] },
  });
}
const subject = (over = {}) => { const s = { xpath: 'node:dlg/button', viaAction: 'activate', surfaceFacts: { focusable: true }, ...over }; s.fingerprint = over.fingerprint || dynamic.fingerprintOf(s); return s; };

test('fingerprintOf is deterministic and content-addressed (facts ⇒ identity)', () => {
  const a = { xpath: 'x', surfaceFacts: { focusable: true, role: 'button' } };
  assert.equal(dynamic.fingerprintOf(a), dynamic.fingerprintOf({ ...a }));
  assert.notEqual(dynamic.fingerprintOf(a), dynamic.fingerprintOf({ xpath: 'x', surfaceFacts: { focusable: true, role: 'link' } }));
});

test('expandDiscovered: a well-formed subject yields the oracle-derived obligations', () => {
  const { obligations, subjects, errors } = dynamic.expandDiscovered({ results: [{ claimId: 'c1', discoveredSubjects: [subject()] }] });
  assert.deepEqual(errors, []);
  assert.equal(subjects.length, 1);
  // focusable ⇒ focus-indicator-visible (2.4.7) + keyboard-operable (2.1.1)
  assert.deepEqual(obligations.map((o) => o.claimFamily).sort(), ['focus-indicator-visible', 'keyboard-operable']);
});

test('expandDiscovered FAILS CLOSED on missing provenance or a forged fingerprint', () => {
  const noProv = dynamic.expandDiscovered({ results: [{ claimId: 'c1', discoveredSubjects: [{ xpath: 'x', surfaceFacts: { focusable: true }, fingerprint: 'sha256:whatever' }] }] });
  assert.ok(noProv.errors.some((m) => /discovery provenance|viaAction/.test(m)));
  const forged = dynamic.expandDiscovered({ results: [{ claimId: 'c1', discoveredSubjects: [{ xpath: 'x', viaAction: 'activate', surfaceFacts: { focusable: true }, fingerprint: 'sha256:' + '0'.repeat(64) }] }] });
  assert.ok(forged.errors.some((m) => /content-address forgery|fingerprint/.test(m)));
});

test('buildV3: a discovered subject is expanded into reconciled obligations + surfaced (Rule 13)', () => {
  const r = buildV3(bundleWith([subject()]), { authority: promoted(['focus-visual-retry/NO_BARRIER_OBSERVED']) });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.results.summary.dynamicSubjects, 1);
  // the discovered subject's two obligations appear in the ledger as auto-PARTIAL (accounted, not silently dropped)
  const dynRows = r.results.obligationLedger.filter((o) => o.xpath === 'node:dlg/button');
  assert.equal(dynRows.length, 2);
  assert.ok(dynRows.every((o) => o.autoPartial === true), 'discovered obligations are auto-PARTIAL until proposed');
  assert.equal(r.results.dynamicSubjects[0].viaAction, 'activate');
});

test('buildV3: a forged-fingerprint discovered subject REFUSES the build', () => {
  const r = buildV3(bundleWith([subject({ fingerprint: 'sha256:' + '1'.repeat(64) })]), { authority: promoted(['focus-visual-retry/NO_BARRIER_OBSERVED']) });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((m) => /dynamic-subject/.test(m)), JSON.stringify(r.errors));
});
