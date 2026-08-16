'use strict';
// Two related routing/binding defects found on results/aug-annot-s9-tools, both caused by the SAME root
// property: rubric routing is BY SC (selectRubricSubjects), so a rubric with no gate fires on every row its SC
// enumerates, and a rubric's verdict binds to whichever claim-family the oracle emitted FIRST for (xpath, sc).
//
//  (1) 1.3.1 GATE — control-semantics-v0 (F42 "emulated control") shipped with no RUBRIC_GATE entry. Measured:
//      116 verdicts across all 53 1.3.1 cases — the page-level pseudo-element in every one plus 63 form-field
//      rows — where its premise (non-focusable, role-less element carrying a script activation handler) is
//      false. 84/116 came back LIKELY_OK, filling the obligation and displacing the incumbent rubric's barrier.
//  (2) 1.1.1 FACET — a complex image owns BOTH `non-text-content` and `long-description` on 1.1.1;
//      long-description-completeness-v0 bound its verdict to `non-text-content` (emitted first), so the
//      long-description obligation was never filled and an "the NAME is adequate" clear could settle the
//      "is the LONG DESCRIPTION complete" question. Fixed in two halves: RUBRIC_FAMILY rebinds the subject to
//      the family it answers, and obligations.js's facet precedence stops an off-facet CLEAR from clearing.
const { test } = require('node:test');
const assert = require('node:assert/strict');

const { selectRubricSubjects } = require('../../lib/llm-adjudicator.js');
const oracle = require('../../lib/applicability-oracle.js');
const obl = require('../../lib/obligations.js');

// ============================ (1) the 1.3.1 three-rubric partition ============================

const R131 = {
  'info-relationships-v0': { id: 'info-relationships-v0', sc: '1.3.1', skill: 'grouping-and-reading-order' },
  'field-programmatic-association-v0': { id: 'field-programmatic-association-v0', sc: '1.3.1', skill: 'grouping-and-reading-order' },
  'control-semantics-v0': { id: 'control-semantics-v0', sc: '1.3.1', skill: 'grouping-and-reading-order' },
};
const ids = (subs, xp) => subs.filter((s) => s.xpath === xp).map((s) => s.rubricId).sort();

test('1.3.1 gate: control-semantics-v0 fires ONLY on an emulatedControl element — the other two rubrics keep their rows', () => {
  const collect = { elements: [
    // the page-level pseudo-element has NO collected element record at all (info-relationships' row)
    { xpath: '/form/input', tag: 'input', isFormField: true },
    { xpath: '/div[1]', tag: 'div', emulatedControl: true },              // F42: the rubric's actual subject
    { xpath: '/div[2]', tag: 'div', emulatedControl: false },             // shape-only, no activation handler
    { xpath: '/div[3]', tag: 'div', emulatedControlShape: true },         // shape without the listener half
  ] };
  const rows = [
    { xpath: oracle.PAGE_INFOREL_XPATH, sc: '1.3.1', claimFamily: 'info-relationships', autoPartial: true },
    { xpath: '/form/input', sc: '1.3.1', claimFamily: 'field-programmatic-association', autoPartial: true },
    { xpath: '/div[1]', sc: '1.3.1', claimFamily: 'control-semantics', autoPartial: true },
    { xpath: '/div[2]', sc: '1.3.1', claimFamily: 'control-semantics', autoPartial: true },
    { xpath: '/div[3]', sc: '1.3.1', claimFamily: 'control-semantics', autoPartial: true },
  ];
  const subs = selectRubricSubjects(collect, rows, R131);
  // the ungated rubric used to appear in EVERY one of these lists.
  assert.deepEqual(ids(subs, oracle.PAGE_INFOREL_XPATH), ['info-relationships-v0'], 'the page-level row is the info-relationships rubric ALONE (this row alone was 53 of the 116 bogus verdicts)');
  assert.deepEqual(ids(subs, '/form/input'), ['field-programmatic-association-v0'], 'a form field is the field rubric ALONE — an <input> is focusable and native, so it can never be an emulated control');
  assert.deepEqual(ids(subs, '/div[1]'), ['control-semantics-v0'], 'the GENUINE F42 element still routes — the gate must not suppress what the rubric exists to judge');
  assert.deepEqual(ids(subs, '/div[2]'), [], 'no activation handler ⇒ the F42 premise is false ⇒ no LLM call');
  assert.deepEqual(ids(subs, '/div[3]'), [], 'emulatedControlShape alone is NOT the premise — the collector only sets emulatedControl once a click/key handler is confirmed');
  assert.equal(subs.length, 3, 'exactly one rubric per row; the three 1.3.1 rubrics partition cleanly');
});

test('1.3.1 gate: the gate predicate is the SAME fact the oracle mints the obligation from (no drift)', () => {
  // applicability-oracle.js:366 / coverage-registry.js:94 both key on `emulatedControl === true`; if the gate
  // ever diverged from them, the obligation would be enumerated with no rubric able to answer it.
  const el = { xpath: '/span[1]', tag: 'span', emulatedControl: true };
  const fams = oracle.familiesFor ? oracle.familiesFor(el) : null;
  if (fams) assert.ok(fams.includes('control-semantics'), 'the oracle mints control-semantics from emulatedControl');
  const subs = selectRubricSubjects({ elements: [el] }, [{ xpath: '/span[1]', sc: '1.3.1', claimFamily: 'control-semantics', autoPartial: true }], R131);
  assert.deepEqual(subs.map((s) => s.rubricId), ['control-semantics-v0']);
});

// ============================ (2a) the 1.1.1 facet REBIND ============================

const R111 = {
  'alt-text-adequacy-v0': { id: 'alt-text-adequacy-v0', sc: '1.1.1', skill: 'name-role-state' },
  'long-description-completeness-v0': { id: 'long-description-completeness-v0', sc: '1.1.1', skill: 'name-role-state' },
};
// the oracle's real emission order for a complex image: non-text-content BEFORE long-description.
const complexImageRows = (xp) => [
  { xpath: xp, sc: '1.1.1', claimFamily: 'non-text-content', autoPartial: true },
  { xpath: xp, sc: '1.1.1', claimFamily: 'long-description', autoPartial: true },
];

test('facet rebind: each 1.1.1 rubric binds to the family it ANSWERS — and still costs exactly one call each', () => {
  const collect = { elements: [{ xpath: '/figure/svg', tag: 'svg', isImage: true, complexImageHint: true }] };
  const subs = selectRubricSubjects(collect, complexImageRows('/figure/svg'), R111);
  assert.equal(subs.length, 2, 'ONE subject per (element, rubric) — the rebind must not fan out into extra LLM calls');
  const by = Object.fromEntries(subs.map((s) => [s.rubricId, s.claimFamily]));
  assert.equal(by['long-description-completeness-v0'], 'long-description', 'the long-description verdict fills the LONG-DESCRIPTION obligation (was: non-text-content)');
  assert.equal(by['alt-text-adequacy-v0'], 'non-text-content', 'the alt-adequacy verdict fills the alt obligation');
});

test('facet rebind: with only ONE family enumerated the binding is unchanged (no invented family)', () => {
  // a plain (non-complex) image owns non-text-content only; long-description-completeness-v0 is gated off it,
  // and alt-text-adequacy must keep binding to the single row that exists.
  const collect = { elements: [{ xpath: '/img', tag: 'img', isImage: true, complexImageHint: false }] };
  const subs = selectRubricSubjects(collect, [{ xpath: '/img', sc: '1.1.1', claimFamily: 'non-text-content', autoPartial: true }], R111);
  assert.deepEqual(subs.map((s) => [s.rubricId, s.claimFamily]), [['alt-text-adequacy-v0', 'non-text-content']]);
});

test('facet rebind: a rubric with no RUBRIC_FAMILY entry keeps first-row binding (change is scoped)', () => {
  const R = { 'captcha-alternative-v0': { id: 'captcha-alternative-v0', sc: '1.1.1', skill: 'name-role-state' } };
  const collect = { elements: [{ xpath: '/img', tag: 'img', isImage: true, isCaptcha: true, complexImageHint: true }] };
  const subs = selectRubricSubjects(collect, complexImageRows('/img'), R);
  assert.deepEqual(subs.map((s) => s.claimFamily), ['non-text-content'], 'unlisted rubrics are untouched by the rebind');
});

// ============================ (2b) the obligations.js facet PRECEDENCE ============================

const LD = 'i::1.1.1::long-description';
const ldObls = [{ obligationId: LD, xpath: 'i', sc: '1.1.1', claimFamily: 'long-description' }];
const fill = (mech, outcome, confidence = 'high') => ({ obligationId: LD, kind: 'PROVISIONAL', outcome, provisional: { mechanism: mech, confidence, outcome } });
const alt = (o, c) => fill('llm-rubric:alt-text-adequacy-v0', o, c);
const longDesc = (o, c) => fill('llm-rubric:long-description-completeness-v0', o, c);

test('facet precedence: an alt-adequacy CLEAR may NOT clear a long-description obligation (case-03/case-07)', () => {
  const r = obl.reconcile(ldObls, [alt('NO_BARRIER_OBSERVED')]);
  const row = r.ledger[0];
  assert.equal(row.disposition, 'PARTIAL', 'nobody answered the long-description question ⇒ honest auto-PARTIAL');
  assert.equal(row.autoPartial, true);
  assert.equal(row.cleared, false, 'an adequate NAME is not evidence that the LONG DESCRIPTION is complete');
});

test('facet precedence: the OWNING rubric still clears its own obligation', () => {
  const r = obl.reconcile(ldObls, [longDesc('NO_BARRIER_OBSERVED')]);
  assert.equal(r.ledger[0].disposition, 'PROVISIONAL');
  assert.equal(r.ledger[0].cleared, true, 'the on-facet rubric is exactly who may clear this');
});

test('facet precedence RECALL GUARD: an off-facet BARRIER is never suppressed', () => {
  // asymmetric by design — only clears are dropped. An alt-adequacy rubric that spots a real 1.1.1 barrier on
  // the image still fills, so the rule can never cost recall.
  const r = obl.reconcile(ldObls, [alt('BARRIER_OBSERVED')]);
  assert.equal(r.ledger[0].cleared, false);
  assert.equal(r.ledger[0].provisional.outcome, 'BARRIER_OBSERVED');
  assert.equal(r.ledger[0].provisional.mechanism, 'llm-rubric:alt-text-adequacy-v0');
});

test('facet precedence: an off-facet clear alongside the OWNER\'s clear still clears (suppression is not a veto)', () => {
  const r = obl.reconcile(ldObls, [alt('NO_BARRIER_OBSERVED'), longDesc('NO_BARRIER_OBSERVED')]);
  const row = r.ledger[0];
  assert.equal(row.cleared, true, 'the owner cleared it; dropping the off-facet duplicate must not change the answer');
  assert.equal(row.provisional.mechanism, 'llm-rubric:long-description-completeness-v0', 'attribution is the rubric that actually answered');
  assert.deepEqual(row.provisional.reconciled, { rule: 'facet-owner-authoritative', suppressed: ['llm-rubric:alt-text-adequacy-v0'] });
  assert.ok(row.provisional.supportRefs.includes('llm-rubric:alt-text-adequacy-v0'), 'the suppressed clear still rides the audit trail');
});

test('facet precedence: owner BARRIER + off-facet clear ⇒ barrier (fail-closed, unchanged)', () => {
  const r = obl.reconcile(ldObls, [alt('NO_BARRIER_OBSERVED'), longDesc('BARRIER_OBSERVED')]);
  assert.equal(r.ledger[0].cleared, false);
  assert.equal(r.ledger[0].provisional.outcome, 'BARRIER_OBSERVED');
});

test('facet precedence: a NON-rubric mechanism is never suppressed (deterministic/instrument/checker fills stand)', () => {
  // ADVERSARIAL: the rule must not silently swallow an axe / target-size / trap / whole-obligation-agent fill —
  // those are not "a rubric answering a different facet", and dropping them would lose a real disposition.
  for (const mech of ['checker-axe', 'llm-agent', 'instrument-keyboard']) {
    const r = obl.reconcile(ldObls, [fill(mech, 'NO_BARRIER_OBSERVED')]);
    assert.equal(r.ledger[0].disposition, 'PROVISIONAL', `${mech} must still fill`);
    assert.equal(r.ledger[0].cleared, true);
  }
});

test('facet precedence is SCOPED: an undeclared family keeps plain barrier-dominance/clear semantics', () => {
  const oid = 'i::1.1.1::non-text-content';
  const obls = [{ obligationId: oid, xpath: 'i', sc: '1.1.1', claimFamily: 'non-text-content' }];
  const mk = (mech, o) => ({ obligationId: oid, kind: 'PROVISIONAL', outcome: o, provisional: { mechanism: mech, confidence: 'high' } });
  const r = obl.reconcile(obls, [mk('llm-rubric:long-description-completeness-v0', 'NO_BARRIER_OBSERVED')]);
  assert.equal(r.ledger[0].cleared, true, 'only the declared families are governed — nothing else changes behaviour');
  assert.equal(r.ledger[0].provisional.reconciled, undefined);
});

test('facet precedence: order-independent (deterministic ledger)', () => {
  const a = obl.reconcile(ldObls, [alt('NO_BARRIER_OBSERVED'), longDesc('NO_BARRIER_OBSERVED')]);
  const b = obl.reconcile(ldObls, [longDesc('NO_BARRIER_OBSERVED'), alt('NO_BARRIER_OBSERVED')]);
  assert.deepEqual(a.ledger[0].provisional, b.ledger[0].provisional);
});
