'use strict';
// 3.3.1 — the PER-FIELD half of the error-summary correspondence.
//
// The collector's summary record is a PAGE-level fact (`namedFields` / `flaggedFields` and the two set
// differences), but error-identification-v0 fires per FIELD. As first shipped the judge was handed the page-level
// sets and left to run the set-membership step itself, and it demonstrably failed at exactly that step while
// holding the right data: on a page whose summary named a field the page never flagged, the prompt carried
// `namedButNotFlagged:[<that field>]`, the judge evaluated the field's own markup, found it correct, and cleared.
// The rubric already warns against that inversion two lines above the signal, so the lever is removing the
// reasoning step, not adding more prose.
//
// The join is fail-SAFE by construction and these tests pin that above all else: collect-error-summary.js keys a
// field as `f.id || f.getAttribute('name') || xpathOf(f)` and the collected element record carries neither id nor
// name, so an unresolvable or AMBIGUOUS field must yield NO `thisField` rather than a guessed one — a wrong
// correspondence would be worse than none, because the judge would act on it.
const { test } = require('node:test');
const assert = require('node:assert/strict');

const { selectRubricSubjects, precomputeSignals } = require('../../lib/llm-adjudicator.js');

const RUBRICS = { 'error-identification-v0': { id: 'error-identification-v0', sc: '3.3.1', skill: 'forms-instructions-errors' } };
const row = (xpath) => ({ xpath, sc: '3.3.1', claimFamily: 'error-identification', autoPartial: true });
const sigFor = (collect, xpath) => {
  const subs = selectRubricSubjects(collect, (collect.elements || []).map((e) => row(e.xpath)), RUBRICS, {});
  const s = subs.find((x) => x.xpath === xpath);
  return s ? precomputeSignals(s.element, s.skill, s.sc) : null;
};
// One summary: names two fields, only one of which the page actually flags.
const SUMMARY = {
  xpath: '/html/body/div[1]', role: 'alert', text: 'Please fix 2 things to continue.',
  namedFields: ['region', 'units'], flaggedFields: ['units'],
  namedButNotFlagged: ['region'], flaggedButNotNamed: [], namedFieldNotOnPage: [], coherent: false,
  namedVia: [
    { via: 'label-text', text: 'Delivery region', field: 'region' },
    { via: 'label-text', text: 'Unit count', field: 'units' },
  ],
};
const collectWith = (elements, summaries = [SUMMARY]) => ({ elements, structure: { errorSummaries: summaries } });

test('the field the summary NAMES but the page never FLAGS is told so about itself', () => {
  const collect = collectWith([
    { xpath: '/f/select', tag: 'select', isFormField: true, axName: 'Delivery region' },
    { xpath: '/f/input[1]', tag: 'input', isFormField: true, axName: 'Unit count' },
  ]);
  const tf = sigFor(collect, '/f/select').errorSummaries.thisField;
  assert.deepEqual(tf, { named: true, flagged: false, namedButNotFlagged: true, flaggedButNotNamed: false, resolvedVia: 'accessible-name' });
});

test('a correctly-identified field reads as named AND flagged (the signal does not just say "barrier")', () => {
  const collect = collectWith([
    { xpath: '/f/select', tag: 'select', isFormField: true, axName: 'Delivery region' },
    { xpath: '/f/input[1]', tag: 'input', isFormField: true, axName: 'Unit count' },
  ]);
  const tf = sigFor(collect, '/f/input[1]').errorSummaries.thisField;
  assert.equal(tf.named, true);
  assert.equal(tf.flagged, true);
  assert.equal(tf.namedButNotFlagged, false, 'this field is coherent — the judge must not read a mismatch here');
});

test('an id-less, name-less field resolves by XPATH (the collector keys it that way)', () => {
  const S = { ...SUMMARY, namedFields: ['/f/input[9]'], flaggedFields: [], namedButNotFlagged: ['/f/input[9]'], namedVia: [] };
  const collect = collectWith([{ xpath: '/f/input[9]', tag: 'input', isFormField: true, axName: 'Some field' }], [S]);
  const tf = sigFor(collect, '/f/input[9]').errorSummaries.thisField;
  assert.equal(tf.resolvedVia, 'xpath');
  assert.equal(tf.namedButNotFlagged, true);
});

// ---------------------------------------- fail-safe ----------------------------------------

test('FAIL-SAFE: two fields sharing an accessible name are AMBIGUOUS ⇒ no thisField at all', () => {
  const collect = collectWith([
    { xpath: '/f/input[1]', tag: 'input', isFormField: true, axName: 'Delivery region' },
    { xpath: '/f/input[2]', tag: 'input', isFormField: true, axName: 'Delivery region' }, // the twin
  ]);
  const sig = sigFor(collect, '/f/input[1]');
  assert.ok(sig.errorSummaries, 'the page-level summary is still handed over');
  assert.equal(sig.errorSummaries.thisField, undefined, 'a name that cannot single out one field yields NO correspondence');
});

test('FAIL-SAFE: a field the summary never mentions gets no thisField (no invented row)', () => {
  const collect = collectWith([
    { xpath: '/f/select', tag: 'select', isFormField: true, axName: 'Delivery region' },
    { xpath: '/f/input[7]', tag: 'input', isFormField: true, axName: 'Reference' }, // named by nothing
  ]);
  assert.equal(sigFor(collect, '/f/input[7]').errorSummaries.thisField, undefined);
});

test('FAIL-SAFE: `via:"link"` entries are NOT used for the name join (link text is not label text)', () => {
  // A summary link reading "Fix this now" pointing at the region field must never be matched against a field
  // whose accessible name happens to be "Fix this now" — the two strings mean different things.
  const S = { ...SUMMARY, namedVia: [{ via: 'link', text: 'Delivery region', field: 'region' }] };
  const collect = collectWith([{ xpath: '/f/select', tag: 'select', isFormField: true, axName: 'Delivery region' }], [S]);
  assert.equal(sigFor(collect, '/f/select').errorSummaries.thisField, undefined, 'only label-text provenance is trusted for the name join');
});

test('FAIL-SAFE: an unnamed field (no axName, no xpath key) yields no thisField', () => {
  const collect = collectWith([{ xpath: '/f/input[3]', tag: 'input', isFormField: true, axName: '' }]);
  assert.equal(sigFor(collect, '/f/input[3]').errorSummaries.thisField, undefined);
});

test('FAIL-SAFE: one summary entry mapping a name to TWO different field keys is ambiguous ⇒ nothing', () => {
  const S = { ...SUMMARY, namedVia: [
    { via: 'label-text', text: 'Delivery region', field: 'region' },
    { via: 'label-text', text: 'Delivery region', field: 'region-2' },
  ] };
  const collect = collectWith([{ xpath: '/f/select', tag: 'select', isFormField: true, axName: 'Delivery region' }], [S]);
  assert.equal(sigFor(collect, '/f/select').errorSummaries.thisField, undefined);
});

// ------------------------------- xpath provenance (the exact join) -------------------------------
// collect-error-summary.js publishes `fieldXpath` on every `namedVia` entry and a `flaggedFieldsXpath` array
// index-aligned with `flaggedFields`. That closes the two cases the accessible-name join structurally cannot
// reach: a LINK-based summary (whose entry text is prose, not a label) and a field that is FLAGGED but never
// NAMED (which appears in no `namedVia` entry at all). Measured before the collector change: 3 of 9 mismatch
// field-keys resolved; after it, 9 of 9.

test('a LINK-based summary resolves by fieldXpath — the case the name join must refuse', () => {
  const S = {
    ...SUMMARY,
    namedVia: [{ via: 'link', text: 'Provide the delivery address exactly as printed on your invoice', field: 'region', fieldXpath: '/f/select' }],
  };
  const collect = collectWith([{ xpath: '/f/select', tag: 'select', isFormField: true, axName: 'Delivery region' }], [S]);
  const tf = sigFor(collect, '/f/select').errorSummaries.thisField;
  assert.equal(tf.resolvedVia, 'xpath', 'the element the link RESOLVED to is authoritative; its prose is not');
  assert.equal(tf.namedButNotFlagged, true);
});

test('a field that is FLAGGED but never NAMED resolves via flaggedFieldsXpath', () => {
  const S = {
    xpath: '/html/body/div[1]', role: 'alert', text: 'Please fix 1 thing.',
    namedFields: ['region'], flaggedFields: ['units'],
    namedButNotFlagged: ['region'], flaggedButNotNamed: ['units'], namedFieldNotOnPage: [], coherent: false,
    namedVia: [{ via: 'label-text', text: 'Delivery region', field: 'region', fieldXpath: '/f/select' }],
    flaggedFieldsXpath: ['/f/input[1]'],
  };
  const collect = collectWith([
    { xpath: '/f/select', tag: 'select', isFormField: true, axName: 'Delivery region' },
    { xpath: '/f/input[1]', tag: 'input', isFormField: true, axName: 'Unit count' },
  ], [S]);
  const tf = sigFor(collect, '/f/input[1]').errorSummaries.thisField;
  assert.equal(tf.resolvedVia, 'xpath');
  assert.deepEqual({ named: tf.named, flagged: tf.flagged, fbn: tf.flaggedButNotNamed },
    { named: false, flagged: true, fbn: true }, 'the summary omits a field that IS in error — reported about that field');
});

test('THE ASYMMETRY: an AMBIGUOUS accessible name still resolves when the xpath join is exact', () => {
  // Two fields share the accessible name "Delivery region", so the name join must refuse (and does — see the
  // fail-safe test above, which is this exact page minus the xpath provenance). The xpath join has no such
  // problem: it identifies the element itself. This is the whole point of publishing the xpath.
  const S = {
    ...SUMMARY,
    namedVia: [{ via: 'label-text', text: 'Delivery region', field: 'region', fieldXpath: '/f/input[2]' }],
  };
  const collect = collectWith([
    { xpath: '/f/input[1]', tag: 'input', isFormField: true, axName: 'Delivery region' },
    { xpath: '/f/input[2]', tag: 'input', isFormField: true, axName: 'Delivery region' }, // the twin
  ], [S]);
  const tf2 = sigFor(collect, '/f/input[2]').errorSummaries.thisField;
  assert.equal(tf2.resolvedVia, 'xpath', 'the named twin resolves exactly');
  assert.equal(tf2.namedButNotFlagged, true);
  // ...and the OTHER twin, which the summary does not point at, still gets nothing — the ambiguity is not
  // "solved" by handing the same row to both.
  assert.equal(sigFor(collect, '/f/input[1]').errorSummaries.thisField, undefined, 'the un-named twin stays unresolved');
});

test('flaggedFields / flaggedFieldsXpath are read INDEX-ALIGNED, not positionally guessed', () => {
  const S = {
    xpath: '/html/body/div[1]', role: 'alert', text: 'x',
    namedFields: [], flaggedFields: ['alpha', 'beta'],
    namedButNotFlagged: [], flaggedButNotNamed: ['alpha', 'beta'], namedFieldNotOnPage: [], coherent: false,
    namedVia: [], flaggedFieldsXpath: ['/f/input[1]', '/f/input[2]'],
  };
  const collect = collectWith([
    { xpath: '/f/input[1]', tag: 'input', isFormField: true, axName: 'Alpha' },
    { xpath: '/f/input[2]', tag: 'input', isFormField: true, axName: 'Beta' },
  ], [S]);
  // if the pairing were off by one, the SECOND element would resolve to key 'alpha' and still look "fine" —
  // so assert both rows resolve and both report the flagged-but-not-named state for their own field.
  for (const xp of ['/f/input[1]', '/f/input[2]']) {
    const tf = sigFor(collect, xp).errorSummaries.thisField;
    assert.equal(tf.resolvedVia, 'xpath', `${xp} resolves`);
    assert.equal(tf.flaggedButNotNamed, true, `${xp} reports its OWN row`);
  }
});

test('BACKWARD COMPATIBLE: a summary from an older evidence pack (no xpath keys) still works', () => {
  // `fieldXpath` / `flaggedFieldsXpath` absent ⇒ the name join carries it exactly as before, and nothing throws.
  const S = { ...SUMMARY }; // SUMMARY deliberately has neither new key
  assert.equal(S.flaggedFieldsXpath, undefined);
  assert.ok(S.namedVia.every((v) => v.fieldXpath === undefined));
  const collect = collectWith([{ xpath: '/f/select', tag: 'select', isFormField: true, axName: 'Delivery region' }], [S]);
  const tf = sigFor(collect, '/f/select').errorSummaries.thisField;
  assert.equal(tf.resolvedVia, 'accessible-name');
  assert.equal(tf.namedButNotFlagged, true);
});

test('FAIL-SAFE survives the widening: a non-matching xpath does NOT fall through to a guess', () => {
  const S = { ...SUMMARY, namedVia: [{ via: 'label-text', text: 'Delivery region', field: 'region', fieldXpath: '/f/somewhere-else' }] };
  const collect = collectWith([
    { xpath: '/f/input[1]', tag: 'input', isFormField: true, axName: 'Delivery region' },
    { xpath: '/f/input[2]', tag: 'input', isFormField: true, axName: 'Delivery region' }, // name still ambiguous
  ], [S]);
  assert.equal(sigFor(collect, '/f/input[1]').errorSummaries.thisField, undefined,
    'xpath did not match and the name is ambiguous ⇒ still nothing, never a guess');
});

// ---------------------------------------- prompt stability ----------------------------------------

test('a page with NO error summary is untouched — no errorSummaries key at all', () => {
  const collect = { elements: [{ xpath: '/f/input[1]', tag: 'input', isFormField: true, axName: 'Unit count' }], structure: { errorSummaries: [] } };
  assert.equal(sigFor(collect, '/f/input[1]').errorSummaries, undefined, 'the gate is unchanged: no summary ⇒ byte-identical prompt');
});

test('the page-level block is IDENTICAL whether or not thisField resolves (additive only)', () => {
  const resolvable = collectWith([{ xpath: '/f/select', tag: 'select', isFormField: true, axName: 'Delivery region' }]);
  const unresolvable = collectWith([{ xpath: '/f/select', tag: 'select', isFormField: true, axName: '' }]);
  const a = sigFor(resolvable, '/f/select').errorSummaries;
  const b = sigFor(unresolvable, '/f/select').errorSummaries;
  assert.deepEqual(a.summaries, b.summaries, 'the page-level facts are the same object either way');
  assert.ok(a.thisField && !b.thisField);
  // the note gains its per-field sentence ONLY when there is a per-field row to explain
  assert.ok(a.note.includes('thisField'), 'the note explains the key when it is present');
  assert.ok(!b.note.includes('thisField'), 'and says nothing about it when it is absent');
  assert.ok(b.note.length < a.note.length);
});

test('the note tells the judge its own markup being correct does not settle the question', () => {
  const collect = collectWith([{ xpath: '/f/select', tag: 'select', isFormField: true, axName: 'Delivery region' }]);
  const note = sigFor(collect, '/f/select').errorSummaries.note;
  assert.match(note, /does not settle it/, 'the per-field note carries the anti-inversion clause');
  assert.match(note, /accessible-name|xpath/, 'and states how the field was resolved, so a wrong join is auditable');
});
