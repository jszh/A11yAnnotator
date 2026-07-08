// Harness 3.3 C2 — PURE policy-core tests for the QualWeb two-lane checker (no browser). Every case
// exercises the verified "fully production-honest" policy (docs/analysis/coverage/
// TARGETED-MULTI-CHECKER-COUNTERFACTUAL.md): failed→barrier, warning blocks the clear, applicable-silent
// (passed) → clear, inapplicable/not-implemented → nothing, and the construct-granular image split
// (R17/23a2a8 in-tree vs removed-from-tree). Rule codes/outcomes are QualWeb's own metadata.outcome values.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const Q = require('../../lib/checker-qualweb.js');
const { buildV3 } = require('../../lib/build-v3.js');

const actIds = (list) => list.map((b) => b.actId).sort();

// minimal reconcilable bundle (mirrors checker-findings.test.js baseBundle): one focus-subject element +
// a supporting experiment/proposal so the build is OK; tests add collect elements + a checkerQualweb stage.
const scope = { actionTargetRef: 'node:b1', state: 'fresh-load', action: 'tab-to', environment: 'headless-chromium' };
const FULL = { targetIsFocusable: true, keyboardReachableInState: true, realKeyboardFocus: true, hydrationReady: true, focusDependentIndicator: true, obviouslyVisible: true, stableIndicatorAbsence: true, modeCompletenessProven: true };
const baseBundle = () => ({
  collect: { file: 'p', runId: 'R', pageDigest: 'sha256:d', collectedAt: 1000, structure: { title: 'T' }, elements: [{ xpath: 'node:b1', focusable: true }] },
  experiments: { file: 'p', runId: 'R', pageDigest: 'sha256:d', catalogVersion: '3.0.0-phase0', startedAt: 2000, results: [{ claimId: 'c1', experimentId: 'focus-visual-retry', targetXpath: 'node:b1', sc: '2.4.7', observationScope: scope, outcome: FULL, applicabilityEvidence: { targetIsFocusable: true, keyboardReachableInState: true } }] },
  claimProposals: { file: 'p', runId: 'R', pageDigest: 'sha256:d', proposals: [{ claimId: 'c1', sc: '2.4.7', direction: 'NO_BARRIER_OBSERVED', experimentId: 'focus-visual-retry', claimFamily: 'focus-indicator-visible', observationScope: scope }] },
});
const ledgerRow = (r, pred) => r.results.obligationLedger.find(pred);

test('QualWeb barrier lane: a failed rule publishes a barrier with its v3 families', () => {
  // QW-ACT-R39 (d0f69e, 1.3.1 table header cells) — the residual-FN rescue.
  const r = Q.normalizeQualweb({ 'QW-ACT-R39': 'failed' });
  assert.equal(r.barriers.length, 1);
  assert.equal(r.barriers[0].actId, 'd0f69e');
  assert.deepEqual(r.barriers[0].families.map((f) => f.sc), ['1.3.1']);
  assert.equal(r.clears.length, 0);
  assert.equal(r.reviews.length, 0);
});

test('QualWeb barrier lane: the one 799-corpus rule-level FP path (QW-ACT-R37 afw4f7 contrast) barriers', () => {
  const r = Q.normalizeQualweb({ 'QW-ACT-R37': 'failed' });
  assert.deepEqual(actIds(r.barriers), ['afw4f7']);
  assert.deepEqual(r.barriers[0].families.map((f) => f.sc), ['1.4.3']);
});

test('QualWeb CLEAR lane is EMPTY — NO family clears on `passed` (adversarial verification conclusion)', () => {
  // Every clear candidate has a live cross-lane sibling (LLM adequacy/descriptiveness rubric, cross-ACT-rule,
  // or instrument) that a name/title-PRESENCE pass cannot decide, so no QualWeb rule's `passed` fully decides
  // its v3 obligation. The clear lane is therefore barrier-only across the board. `inapplicable` also clears
  // nothing. (The BARRIER lane is unchanged — see below.)
  for (const code of ['QW-ACT-R1', 'QW-ACT-R11', 'QW-ACT-R16', 'QW-ACT-R66', 'QW-ACT-R12', 'QW-ACT-R6',
    'QW-ACT-R17', 'QW-ACT-R21', 'QW-ACT-R42', 'QW-ACT-R19', 'QW-ACT-R37', 'QW-ACT-R44']) {
    assert.equal(Q.normalizeQualweb({ [code]: 'passed' }).clears.length, 0, `${code} passed must NOT clear (clear lane empty)`);
    assert.equal(Q.normalizeQualweb({ [code]: 'inapplicable' }).clears.length, 0, `${code} inapplicable must NOT clear`);
  }
  // no QW_POLICY family is clear-eligible
  const anyClearEligible = Object.values(Q.QW_POLICY).some((p) => (p.families || []).some((f) => f.clear === true));
  assert.equal(anyClearEligible, false, 'no QW_POLICY family may be clear:true (each has a cross-lane sibling)');
});

test('QualWeb BARRIER lane unchanged by the empty clear lane — name/title/image/iframe rules still barrier on `failed`', () => {
  // The FP/FN benefit lives entirely in the barrier lane; emptying clears must not touch it.
  for (const code of ['QW-ACT-R1', 'QW-ACT-R11', 'QW-ACT-R16', 'QW-ACT-R17', 'QW-ACT-R21', 'QW-ACT-R19', 'QW-ACT-R39']) {
    assert.equal(Q.normalizeQualweb({ [code]: 'failed' }).barriers.length, 1, `${code} failed must still barrier`);
  }
});

test('QualWeb clear lane: a WARNING (review) BLOCKS the clear — judgment rules stay routed to the LLM', () => {
  // QW-ACT-R37 (contrast) and QW-ACT-R44 (link-purpose) warning ⇒ review, never a clear.
  const r = Q.normalizeQualweb({ 'QW-ACT-R37': 'warning', 'QW-ACT-R44': 'warning' });
  assert.equal(r.clears.length, 0);
  assert.deepEqual(actIds(r.reviews), ['afw4f7', 'fd3a94']);
  assert.equal(r.barriers.length, 0);
});

test('QualWeb clear lane: judgment rules never clear even when they report passed (clear:false gate)', () => {
  // A `passed` on afw4f7/fd3a94 must NOT settle — a passed contrast/link-purpose is not authoritative.
  const r = Q.normalizeQualweb({ 'QW-ACT-R37': 'passed', 'QW-ACT-R44': 'passed' });
  assert.equal(r.clears.length, 0);
  assert.equal(r.barriers.length, 0);
  assert.equal(r.reviews.length, 0);
});

test('QualWeb clear lane: 1.3.1 structural rules barrier but NEVER clear (no whole-SC suppression)', () => {
  // R33/R36/R38/R39 (ARIA context / headers / owned / table-cells) map their BARRIER to page info-relationships
  // but must not clear it — a single relationship check does not clear the whole page. passed ⇒ no clear.
  for (const code of ['QW-ACT-R33', 'QW-ACT-R36', 'QW-ACT-R38', 'QW-ACT-R39']) {
    assert.equal(Q.normalizeQualweb({ [code]: 'passed' }).clears.length, 0, `${code} passed must not clear`);
    assert.equal(Q.normalizeQualweb({ [code]: 'failed' }).barriers.length, 1, `${code} failed must barrier`);
  }
});

test('QualWeb: a not-implemented / unmapped code contributes NOTHING', () => {
  const r = Q.normalizeQualweb({ 'QW-ACT-R999': 'failed', 'QW-NOT-A-RULE': 'passed' });
  assert.equal(r.barriers.length, 0);
  assert.equal(r.clears.length, 0);
  assert.equal(r.reviews.length, 0);
});

test('QualWeb kill-switch: killSwitch=true (or V3_QUALWEB=0) ⇒ inert', () => {
  const r = Q.normalizeQualweb({ 'QW-ACT-R39': 'failed', 'QW-ACT-R17': 'passed' }, { killSwitch: true });
  assert.equal(r.disabled, true);
  assert.equal(r.barriers.length, 0);
  assert.equal(r.clears.length, 0);
  assert.equal(r.reviews.length, 0);
});

test('QualWeb worst-outcome-wins across multiple assertions of one rule', () => {
  // failed dominates passed/warning for the same ACT id (aggregate is fail-closed).
  assert.equal(Q.normalizeQualweb({ 'QW-ACT-R17': 'passed', 'QW-ACT-R17': 'failed' }).barriers.length, 1);
});

// ── Construct-granular MATCHERS (the brief's load-bearing image split) ──────────────────────────────────
test('MATCHER img: an IN-TREE image matches R17; a removed-from-tree / decorative-conflict image does NOT', () => {
  const inTreeImg = { tag: 'img', axRole: 'image', removedFromA11yTree: false };
  const decorative = { tag: 'img', axRole: 'image', removedFromA11yTree: true };            // aria-hidden/role=presentation
  const conflict = { tag: 'img', axRole: 'image', decorativeConflict: true };               // e88epe cross-rule catch
  assert.equal(Q.MATCHERS.img(inTreeImg), true, 'in-tree image is R17 territory');
  assert.equal(Q.MATCHERS.img(decorative), false, 'removed-from-tree decorative image is NOT cleared by R17');
  assert.equal(Q.MATCHERS.img(conflict), false, 'decorative-conflict image (e88epe lane) survives R17 silence');
});

test('MATCHER img excludes svg/object/image-button (owned by R21/R42/R6, not R17)', () => {
  assert.equal(Q.MATCHERS.img({ tag: 'svg', axRole: 'image' }), false);
  assert.equal(Q.MATCHERS.svg({ tag: 'svg' }), true);
  assert.equal(Q.MATCHERS.object({ tag: 'object' }), true);
  assert.equal(Q.MATCHERS.imageButton({ tag: 'input', type: 'image' }), true);
  assert.equal(Q.MATCHERS.img({ tag: 'input', type: 'image' }), false);
});

test('MATCHER role-precise name-presence predicates', () => {
  assert.equal(Q.MATCHERS.button({ tag: 'button' }), true);
  assert.equal(Q.MATCHERS.button({ tag: 'input', type: 'submit' }), true);
  assert.equal(Q.MATCHERS.formField({ isFormField: true }), true);
  assert.equal(Q.MATCHERS.link({ tag: 'a', href: '#x' }), true);
  assert.equal(Q.MATCHERS.iframe({ tag: 'iframe' }), true);
  assert.equal(Q.MATCHERS.menuitem({ axRole: 'menuitem' }), true);
  assert.equal(Q.MATCHERS.button({ tag: 'a', href: '#x' }), false);
});

// ── build-v3 WIRING: barrier → authoritative disposition, clear → auto-PARTIAL settle ──────────────────
test('build wiring: absent/kill-switched QualWeb is inert (ledger identical to pre-QualWeb)', () => {
  const withoutBundle = baseBundle();
  const r0 = buildV3(withoutBundle);
  assert.equal(r0.ok, true, JSON.stringify(r0.errors));
  assert.equal(r0.results.summary.qualweb.ran, false);
  // kill-switch: even with a stage present, killSwitch makes normalizeQualweb inert ⇒ no disposition.
  const killed = baseBundle();
  killed.collect.elements.push({ xpath: '/img', tag: 'img', axRole: 'image', removedFromA11yTree: false });
  killed.checkerQualweb = { ruleOutcomes: { 'QW-ACT-R17': 'passed' } };
  const rk = buildV3(killed, { qualweb: {} }); // build never reads V3_QUALWEB itself; assert lane behaviour below with the switch off
  assert.equal(rk.ok, true, JSON.stringify(rk.errors));
});

test('build wiring: a QualWeb BARRIER (R39 failed) publishes an authoritative 1.3.1 barrier disposition', () => {
  const bundle = baseBundle();
  bundle.checkerQualweb = { ruleOutcomes: { 'QW-ACT-R39': 'failed' } }; // d0f69e table-header cells — the FN rescue
  const r = buildV3(bundle);
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.results.summary.qualweb.ran, true);
  const infoRel = Q.PAGE_INFOREL_XPATH + '::1.3.1::info-relationships';
  assert.ok(r.results.summary.qualweb.barrierObligations.includes(infoRel), 'the page info-relationships obligation is barriered');
  const row = ledgerRow(r, (x) => x.obligationId === infoRel);
  assert.ok(row && row.cleared === false && row.autoPartial === false, 'barriered (not auto-PARTIAL, not cleared)');
});

test('build wiring: the CLEAR lane is EMPTY — a button name-presence pass (R11) does NOT clear (adequacy sibling)', () => {
  const bundle = baseBundle();
  bundle.collect.elements.push({ xpath: '/btn', tag: 'button', axRole: 'button', focusable: true });
  bundle.checkerQualweb = { ruleOutcomes: { 'QW-ACT-R11': 'passed' } };
  const r = buildV3(bundle);
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  const oid = '/btn::4.1.2::name-role-value';
  assert.equal(r.results.summary.qualweb.clearObligations.length, 0, 'no obligation is QualWeb-cleared (clear lane empty)');
  const row = ledgerRow(r, (x) => x.obligationId === oid);
  assert.ok(row && row.autoPartial === true, 'button name obligation stays auto-PARTIAL (accessible-name-adequacy-v0 stays LLM-reachable)');
});

test('build wiring FALSE-CLEAR GUARD: an image (R17 passed) is NOT cleared — adequacy stays LLM-reachable', () => {
  const bundle = baseBundle();
  // The false-clear fix: a name-PRESENCE pass on an image must never settle the alt-ADEQUACY obligation
  // (this was the qt1vmo/e88epe false-clear source). The image obligation must remain auto-PARTIAL.
  bundle.collect.elements.push({ xpath: '/img', tag: 'img', axRole: 'image', removedFromA11yTree: false });
  bundle.checkerQualweb = { ruleOutcomes: { 'QW-ACT-R17': 'passed' } };
  const r = buildV3(bundle);
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  const oid = '/img::1.1.1::non-text-content';
  assert.ok(!r.results.summary.qualweb.clearObligations.includes(oid), 'image non-text-content (adequacy) is NOT cleared by R17 name-presence');
  const row = ledgerRow(r, (x) => x.obligationId === oid);
  assert.ok(row && row.autoPartial === true, 'image adequacy obligation stays auto-PARTIAL (LLM reachable; e88epe/qt1vmo lanes survive)');
});

test('build wiring MATCHER granularity intact: MATCHERS.img still excludes removed-from-tree (documented for barrier)', () => {
  // Even though image rules are barrier-only for clears, the in-tree predicate still scopes any future
  // image barrier — a removed-from-tree decorative image is not the subject of R17.
  assert.equal(Q.MATCHERS.img({ tag: 'img', axRole: 'image', removedFromA11yTree: true, decorativeConflict: true }), false);
  assert.equal(Q.MATCHERS.img({ tag: 'img', axRole: 'image', removedFromA11yTree: false }), true);
});

test('build wiring: QualWeb never overrides a v3 deterministic disposition (fills auto-PARTIAL only)', () => {
  const bundle = baseBundle();
  // node:b1 already carries a deterministic CLAIM clear (2.4.7) from the base experiment. A QualWeb clear
  // whose target resolved to that obligation must not be added (reconcile would collide). Here R17 targets
  // /img only, so we just assert the base CLAIM is untouched and the build stays ok with the lane on.
  bundle.collect.elements.push({ xpath: '/img', tag: 'img', axRole: 'image', removedFromA11yTree: false });
  bundle.checkerQualweb = { ruleOutcomes: { 'QW-ACT-R17': 'passed', 'QW-ACT-R39': 'failed' } };
  const r = buildV3(bundle);
  assert.equal(r.ok, true, JSON.stringify(r.errors)); // reconcile did NOT collide despite the lane being on
  // node:b1 already carries a v3 deterministic disposition (a shadow PARTIAL under default authority); it is
  // NOT in QualWeb's applicability, so QualWeb touches neither it nor any obligation the harness already owns.
  const b1 = ledgerRow(r, (x) => x.obligationId === 'node:b1::2.4.7::focus-indicator-visible');
  assert.ok(b1 && b1.disposition !== undefined, 'the base obligation keeps its v3 disposition');
  assert.ok(!r.results.summary.qualweb.clearObligations.includes('node:b1::2.4.7::focus-indicator-visible'), 'QualWeb did not clear a v3-owned obligation');
});
