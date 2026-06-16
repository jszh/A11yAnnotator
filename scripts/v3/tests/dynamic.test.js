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

// gap-fill red-team (HIGH): a static page bounds obligations by collected elements, but a DISCOVERED
// subject set is bounded only by what a (buggy/compromised) runner asserts. Without a cap, 200k subjects
// expand to ~1.8M obligations (~1GB) and DoS the build BEFORE any gate runs. The cap must be enforced
// BEFORE expansion (fail-closed), so the pathological expansion never materializes.
const wellFormed = (n) => Array.from({ length: n }, (_, i) => { const s = { xpath: 'node:dlg/btn' + i, viaAction: 'activate', surfaceFacts: { focusable: true } }; s.fingerprint = dynamic.fingerprintOf(s); return s; });

test('expandDiscovered: an over-cap per-result subject set is REFUSED before expansion (DoS backstop)', () => {
  const over = dynamic.MAX_SUBJECTS_PER_RESULT + 1;
  const t0 = Date.now();
  const r = dynamic.expandDiscovered({ results: [{ claimId: 'c1', discoveredSubjects: wellFormed(over) }] });
  assert.ok(Date.now() - t0 < 2000, 'returns promptly — no per-subject expansion of the over-cap set');
  assert.ok(r.errors.some((m) => /per-result cap/.test(m)), JSON.stringify(r.errors.slice(0, 2)));
  assert.equal(r.subjects.length, 0, 'the over-cap result is NOT expanded');
  assert.equal(r.obligations.length, 0);
});

test('expandDiscovered: the run-level subject total is bounded across results (over-cap ⇒ error)', () => {
  const per = dynamic.MAX_SUBJECTS_PER_RESULT;       // each result is within the per-result cap
  const nResults = Math.ceil((dynamic.MAX_TOTAL_SUBJECTS + per) / per);
  let idx = 0;
  const results = Array.from({ length: nResults }, (_, k) => ({ claimId: 'c' + k, discoveredSubjects: Array.from({ length: per }, () => { const s = { xpath: 'node:n' + (idx++), viaAction: 'activate', surfaceFacts: { focusable: true } }; s.fingerprint = dynamic.fingerprintOf(s); return s; }) }));
  const r = dynamic.expandDiscovered({ results });
  assert.ok(r.errors.some((m) => /run cap/.test(m)), JSON.stringify(r.errors.slice(0, 2)));
  assert.ok(r.subjects.length <= dynamic.MAX_TOTAL_SUBJECTS, `subjects bounded to the run cap (${r.subjects.length} <= ${dynamic.MAX_TOTAL_SUBJECTS})`);
});

test('buildV3: an over-cap dynamic result FAILS CLOSED (refuses the build, no silent expansion)', () => {
  const r = buildV3(bundleWith(wellFormed(dynamic.MAX_SUBJECTS_PER_RESULT + 1)), { authority: promoted(['focus-visual-retry/NO_BARRIER_OBSERVED']) });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((m) => /dynamic-subject.*cap|cap/.test(m)), JSON.stringify(r.errors.slice(0, 3)));
});
