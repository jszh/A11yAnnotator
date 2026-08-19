// FN ROUND 1 (2026-08-19) — pins for the twelve-miss root-cause across 1.4.1 / 1.4.13 / 2.4.3 / 4.1.3
// (docs/analysis/reports-2026-06/FN-ROOTCAUSE-4SC-2026-08-19.md). Each fix is pinned in BOTH polarities:
// the shape it is meant to catch, and the neighbouring shape it must leave alone.
//
// Every fixture here is INVENTED and generic — none is derived from, or named after, any corpus page.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const llmAdj = require('../../lib/llm-adjudicator.js');
const { intrinsicOrdinalViolation } = require('../../lib/order-check.js');
const { persistentFacetFromVanish } = require('../../lib/exp-runners.js');

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// A. 4.1.3 — the stand-alone check, enforced instead of merely written down.
// ─────────────────────────────────────────────────────────────────────────────────────────────────

const statusSubject = (triggers, extra = {}) => ({
  rubricId: 'status-message-v0', sc: '4.1.3',
  element: { xpath: '/html/body/div[1]', __statusObservations: triggers, ...extra },
});

test('A1 announcedFactsOf reads the spoken string, preferring the mutated fragment on a non-atomic region', () => {
  const facts = llmAdj.announcedFactsOf(statusSubject([
    { triggerLabel: 'Update quantity for the blue notebook',
      regionsUpdated: [{ after: 'Subtotal: 12 items', atomic: true }], addedInsideLiveRegion: [] },
    { triggerLabel: 'Refresh totals',
      regionsUpdated: [{ after: 'Subtotal: 30 items', atomic: false, mutatedFragment: '30' }], addedInsideLiveRegion: [] },
  ], { sectionHeading: 'Depot summary' }));
  assert.deepEqual(facts.announced, ['Subtotal: 12 items', '30']);
  // each string travels with the control that CAUSED it — never a flat pool of every label on the page
  assert.deepEqual(facts.announcements, [
    { spoken: 'Subtotal: 12 items', byControl: 'Update quantity for the blue notebook' },
    { spoken: '30', byControl: 'Refresh totals' }]);
  assert.equal(facts.sectionHeading, 'Depot summary');
});

test('A2 announcedFactsOf folds addedInsideLiveRegion and returns null when no observations were threaded', () => {
  const facts = llmAdj.announcedFactsOf(statusSubject([
    { triggerLabel: 'Apply', regionsUpdated: [], addedInsideLiveRegion: ['Filter applied'] },
  ]));
  assert.deepEqual(facts.announced, ['Filter applied']);
  assert.deepEqual(facts.announcements, [{ spoken: 'Filter applied', byControl: 'Apply' }]);
  assert.equal(facts.sectionHeading, null);
  assert.equal(llmAdj.announcedFactsOf({ rubricId: 'status-message-v0', element: {} }), null);
});

test('A3 standaloneCheckPerformed accepts a quoted string or a named guard, and rejects a wiring-only clear', () => {
  // a 1-2 char announcement can never be "quoted" incidentally — it is always re-asked
  assert.equal(llmAdj.standaloneCheckPerformed({ reasoning: 'The count 30 is fine and ok.' }, ['30']), false);
  const announced = ['Saved'];
  assert.equal(llmAdj.standaloneCheckPerformed(
    { reasoning: 'The announced string "Saved" names the record because the region is labelled.' }, announced), true);
  assert.equal(llmAdj.standaloneCheckPerformed(
    { reasoning: 'Guard terse-outcome applies after a single unambiguous action.' }, announced), true);
  assert.equal(llmAdj.standaloneCheckPerformed(
    { reasoning: 'The update is delivered through a pre-existing polite live region without moving focus.' }, announced), false);
  assert.equal(llmAdj.standaloneCheckPerformed({ reasoning: '' }, announced), false);
});

const OBS = [{ triggerLabel: 'Rename the March report', regionsUpdated: [{ after: 'Renamed', atomic: true }], addedInsideLiveRegion: [] }];
const wiringOnlyClear = { verdict: 'NOT REPRODUCED', confidence: 'high', summary: 'Correctly wired.', reasoning: 'A pre-existing polite region was updated in place and focus did not move.' };

test('A4 an unqualified clear is re-asked, and a REPRODUCED from the focused pass becomes the verdict', async () => {
  const calls = [];
  const runAgent = async (messages) => {
    calls.push(messages[messages.length - 1].text);
    return { verdict: 'REPRODUCED', confidence: 'medium', summary: 'Names no subject.', reasoning: '"Renamed" states an outcome only.' };
  };
  const out = await llmAdj.applyStandaloneCheck(runAgent, [{ type: 'text', text: 'base' }], statusSubject(OBS), wiringOnlyClear);
  assert.equal(calls.length, 1);
  assert.match(calls[0], /STEP 2 of 2/);
  assert.match(calls[0], /Rename the March report/);   // the referent is handed over, not left to a screenshot
  assert.match(calls[0], /byControl/);                 // paired with ITS OWN control, not a pool of labels
  assert.equal(out.verdict, 'REPRODUCED');
  assert.equal(out._standaloneEnforced, true);
});

test('A5 the focused pass FAILS CLOSED — anything but REPRODUCED keeps the original clear', async () => {
  for (const v of ['NOT REPRODUCED', 'PARTIAL', 'N/A']) {
    const out = await llmAdj.applyStandaloneCheck(async () => ({ verdict: v, confidence: 'low', summary: '', reasoning: '' }),
      [], statusSubject(OBS), wiringOnlyClear);
    assert.equal(out.verdict, 'NOT REPRODUCED', `verdict ${v} must not disturb the clear`);
    assert.equal(out._standaloneEnforced, undefined);
  }
  const thrown = await llmAdj.applyStandaloneCheck(async () => { throw new Error('transport'); }, [], statusSubject(OBS), wiringOnlyClear);
  assert.equal(thrown.verdict, 'NOT REPRODUCED');
  // and a clear a SKEPTIC already produced by overturning a barrier is never re-opened by this gate
  let refuteCalls = 0;
  const refuted = await llmAdj.applyStandaloneCheck(async () => { refuteCalls += 1; return { verdict: 'REPRODUCED' }; },
    [], statusSubject(OBS), { ...wiringOnlyClear, _refutedFrom: 'REPRODUCED' });
  assert.equal(refuteCalls, 0);
  assert.equal(refuted.verdict, 'NOT REPRODUCED');
});

test('A6 a clear that CARRIED the check, a barrier, another rubric, and a silent page all cost zero calls', async () => {
  let calls = 0;
  const runAgent = async () => { calls += 1; return { verdict: 'REPRODUCED' }; };
  const carried = { verdict: 'NOT REPRODUCED', reasoning: 'The announced string "Renamed" is scoped by the region\'s own label.' };
  assert.equal((await llmAdj.applyStandaloneCheck(runAgent, [], statusSubject(OBS), carried)).verdict, 'NOT REPRODUCED');
  const barrier = { verdict: 'REPRODUCED', reasoning: 'x' };
  assert.equal((await llmAdj.applyStandaloneCheck(runAgent, [], statusSubject(OBS), barrier)).verdict, 'REPRODUCED');
  const other = { rubricId: 'alt-text-adequacy-v0', sc: '1.1.1', element: { __statusObservations: OBS } };
  assert.equal((await llmAdj.applyStandaloneCheck(runAgent, [], other, wiringOnlyClear)).verdict, 'NOT REPRODUCED');
  const silent = statusSubject([{ triggerLabel: 'Refresh', regionsUpdated: [], addedInsideLiveRegion: [] }]);
  assert.equal((await llmAdj.applyStandaloneCheck(runAgent, [], silent, wiringOnlyClear)).verdict, 'NOT REPRODUCED');
  assert.equal(calls, 0);
});

test('A7 V3_413_STANDALONE=0 disables the gate entirely', async () => {
  const prev = process.env.V3_413_STANDALONE;
  process.env.V3_413_STANDALONE = '0';
  try {
    let calls = 0;
    const out = await llmAdj.applyStandaloneCheck(async () => { calls += 1; return { verdict: 'REPRODUCED' }; },
      [], statusSubject(OBS), wiringOnlyClear);
    assert.equal(calls, 0);
    assert.equal(out.verdict, 'NOT REPRODUCED');
  } finally { if (prev === undefined) delete process.env.V3_413_STANDALONE; else process.env.V3_413_STANDALONE = prev; }
});

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// B. 1.4.1 — the post-activation colour delta becomes a subject on its OWN element.
// ─────────────────────────────────────────────────────────────────────────────────────────────────

const UC_RUBRIC = { id: 'use-of-color-v0', sc: '1.4.1', skill: 'color-and-visual-text' };
const ROW = '/html/body/table[1]/tbody[1]/tr[2]';
const FIELD = '/html/body/table[1]/tbody[1]/tr[2]/td[3]/input[1]';
const collectWith = (xpaths) => ({ elements: xpaths.map((x) => ({ xpath: x, tag: x.endsWith('input[1]') ? 'input' : 'tr' })), structure: {} });
const delta = (xpath, textAlsoChangedNearby) => ({ trigger: '/html/body/table[1]/tbody[1]/tr[2]/td[4]/button[1]', xpath, tag: 'tr',
  backgroundBefore: 'rgba(0, 0, 0, 0)', backgroundAfter: 'rgb(220, 245, 225)', textAlsoChangedNearby });
const select = (collect, ledger, colourStateDeltas) => llmAdj.selectRubricSubjects(collect, ledger, { uc: UC_RUBRIC }, { colourStateDeltas });

test('B1 a colour-alone delta on an element with no obligation still becomes a use-of-color subject', () => {
  const subs = select(collectWith([ROW, FIELD]), [], [delta(ROW, false)]);
  const row = subs.filter((s) => s.xpath === ROW);
  assert.equal(row.length, 1);
  assert.equal(row[0].rubricId, 'use-of-color-v0');
  assert.equal(row[0].sc, '1.4.1');
  assert.equal(row[0].claimFamily, 'use-of-color');
  assert.deepEqual(row[0].element.__colourStateDeltas, [delta(ROW, false)]);
});

test('B2 a delta accompanied by TEXT is not the colour-alone shape and mints nothing', () => {
  assert.equal(select(collectWith([ROW, FIELD]), [], [delta(ROW, true)]).length, 0);
});

test('B3 an uncollected element mints nothing, and an existing subject is never duplicated', () => {
  assert.equal(select(collectWith([FIELD]), [], [delta(ROW, false)]).length, 0);
  const ledger = [{ xpath: ROW, sc: '1.4.1', claimFamily: 'use-of-color', autoPartial: true }];
  const subs = select(collectWith([ROW]), ledger, [delta(ROW, false)]);
  assert.equal(subs.filter((s) => s.xpath === ROW && s.rubricId === 'use-of-color-v0').length, 1);
});

test('B4 one activation tinting many peers is capped', () => {
  const rows = Array.from({ length: 12 }, (_, i) => `/html/body/table[1]/tbody[1]/tr[${i + 1}]`);
  const subs = select(collectWith(rows), [], rows.map((r) => delta(r, false)));
  assert.equal(subs.length, 6);
});

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// C. 2.4.3 — the UNDECLARED modal, recognised from geometry.
// ─────────────────────────────────────────────────────────────────────────────────────────────────

const OVERLAY = '/html/body/div[3]';
const covered = (xpath, coverage, position = 'fixed') => ({ xpath, occludedBy: OVERLAY, occluderPosition: position,
  occluderViewportCoverage: coverage, rect: { x: 10, y: 10, w: 80, h: 30 } });
const inside = (n) => ({ xpath: `${OVERLAY}/form[1]/input[${n}]`, rect: { x: 200, y: 300, w: 200, h: 40 } });

test('C1 background stops under a full-viewport overlay that has its own stops are the leak shape', () => {
  const stops = [covered('/html/body/header[1]/a[1]', 1), covered('/html/body/header[1]/button[1]', 1), inside(1), inside(2)];
  assert.equal(llmAdj.occludedStopsUnderOverlay(stops).length, 2);
  assert.equal(llmAdj.focusClauseFacts({ forward: stops }).modal, true);
});

test('C2 a routine sticky header, a static occluder, and an overlay with no stops of its own all stay closed', () => {
  const sticky = [covered('/html/body/main[1]/a[1]', 0.12), inside(1)];
  assert.deepEqual(llmAdj.occludedStopsUnderOverlay(sticky), []);
  const staticOccluder = [covered('/html/body/main[1]/a[1]', 1, 'static'), inside(1)];
  assert.deepEqual(llmAdj.occludedStopsUnderOverlay(staticOccluder), []);
  const noStopsInside = [covered('/html/body/main[1]/a[1]', 1), { xpath: '/html/body/main[1]/a[2]', rect: { x: 0, y: 0, w: 10, h: 10 } }];
  assert.deepEqual(llmAdj.occludedStopsUnderOverlay(noStopsInside), []);
  assert.equal(llmAdj.focusClauseFacts({ forward: noStopsInside }).modal, false);
});

test('C3 the declared routes are untouched by the geometric one', () => {
  assert.equal(llmAdj.focusClauseFacts({ forward: [{ xpath: '/html/body/a[1]', modalOpen: true }] }).modal, true);
  assert.equal(llmAdj.focusClauseFacts({ forward: [{ xpath: '/html/body/a[1]', reveal: { containmentLeak: { leakedStops: 3 } } }] }).modal, true);
  assert.equal(llmAdj.focusClauseFacts({ forward: [{ xpath: '/html/body/a[1]', reveal: { containmentLeak: { leakedStops: 0 } } }] }).modal, false);
  assert.equal(llmAdj.focusClauseFacts(null).modal, false);
});

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// D. 2.4.3 — a set that PRINTS its own order.
// ─────────────────────────────────────────────────────────────────────────────────────────────────

// an invented 4x2 board of numbered pads, laid out row-major on screen.
const tile = (n, x, y, label) => ({ xpath: `/html/body/div[1]/button[${n}]`, label: label || `Pad ${n}`, rect: { x, y, w: 40, h: 40 } });
const XS = [0, 60, 120, 180];
const rowMajor = [];
for (const y of [0, 60]) for (const x of XS) rowMajor.push(tile(rowMajor.length + 1, x, y));
const colMajor = [];
for (const x of XS) for (const y of [0, 60]) colMajor.push(rowMajor.find((t) => t.rect.x === x && t.rect.y === y));

test('D1 a transposed walk over a set whose labels print the order is a violation', () => {
  const r = intrinsicOrdinalViolation(colMajor);
  assert.equal(r.violated, true);
  assert.deepEqual(r.navOrdinals, [1, 5, 2, 6, 3, 7, 4, 8]);
  assert.deepEqual(r.visualOrdinals, [1, 2, 3, 4, 5, 6, 7, 8]);
});

test('D2 the same walk over a set that does NOT print an order claims nothing', () => {
  assert.equal(intrinsicOrdinalViolation(rowMajor).violated, false);
  const unlabelled = colMajor.map((t) => ({ ...t, label: 'Choose' }));
  assert.equal(intrinsicOrdinalViolation(unlabelled).violated, false);
  const repeated = colMajor.map((t, i) => ({ ...t, label: `Group 2, item ${String.fromCharCode(65 + i)}` }));
  assert.equal(intrinsicOrdinalViolation(repeated).violated, false);
  const scrambledOnScreen = colMajor.map((t, i) => ({ ...t, label: `Pad ${[3, 8, 1, 6, 5, 2, 7, 4][i]}` }));
  assert.equal(intrinsicOrdinalViolation(scrambledOnScreen).violated, false);
  assert.equal(intrinsicOrdinalViolation(colMajor.slice(0, 4)).violated, false);
});

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// E. 1.4.13 — a vanish observed while the trigger is held revises the facet the dwell assigned.
// ─────────────────────────────────────────────────────────────────────────────────────────────────

const tipSamples = [{ atMs: 1000, present: true, held: true, via: 'tip' },
  { atMs: 3000, present: false, held: true, via: 'tip' },
  { atMs: 7000, present: false, held: true, via: 'tip' }];

// E1 pins the CORRECTION made after the scored A/B: a TIME-attributed vanish never scores the facet, no
// matter how well corroborated, because "arbitrary timer" and "the information really did expire" are the
// same measurement and only the second is licensed. Scoring it produced the round's one false positive (a
// seat-hold countdown that genuinely expired mid-probe) and made the verdict a race against the page's own
// clock — it fired in the scored run and not in the 140-page sweep of the identical tree.
test('E1 a timed removal is UNMEASURED however well corroborated — info-invalidation is the LLM lane\'s call', () => {
  assert.equal(persistentFacetFromVanish({ vanishedWhileHeld: true, persistReshowSig: 1000049, hoveredSig: 1000049,
    persistenceSamples: tipSamples }), 'unmeasured');
});

test('E2 a husk re-reveal or a scalar-authored absence leaves the facet UNMEASURED, never false', () => {
  const held = [{ atMs: 1000, present: true, held: true, via: 'tip' },
    { atMs: 3000, present: false, held: true, via: 'tip' }];
  const scrollOk = { triggerStillHeld: true, presentAfter: false, reshowIntact: true };
  assert.equal(persistentFacetFromVanish({ vanishedOnScrollWhileHeld: true, persistReshowSig: 1000020, hoveredSig: 1000049,
    persistenceSamples: held, scrollHeld: scrollOk }), 'unmeasured');
  const scalar = held.map((s) => (s.present === false ? { ...s, via: 'scalar' } : s));
  assert.equal(persistentFacetFromVanish({ vanishedOnScrollWhileHeld: true, persistReshowSig: 1000049, hoveredSig: 1000049,
    persistenceSamples: scalar, scrollHeld: scrollOk }), 'unmeasured');
});

test('E3 a scroll vanish scores only when the trigger was verified still held', () => {
  const held = [{ atMs: 1000, present: true, held: true, via: 'tip' }];
  assert.equal(persistentFacetFromVanish({ vanishedOnScrollWhileHeld: true, persistReshowSig: 9, hoveredSig: 9,
    persistenceSamples: held, scrollHeld: { triggerStillHeld: true, presentAfter: false, reshowIntact: true } }), 'false');
  assert.equal(persistentFacetFromVanish({ vanishedOnScrollWhileHeld: true, persistReshowSig: 9, hoveredSig: 9,
    persistenceSamples: held, scrollHeld: { triggerStillHeld: null, presentAfter: null } }), 'unmeasured');
});

// E3b the discriminator itself: identical corroboration, the ONLY difference being which probe saw the
// vanish. This is the pair the corpus is built around — a scroll-hidden definition popup (fail) and a
// countdown whose hold expired (pass) — and it must not collapse.
test('E3b same corroboration, opposite verdicts: scroll scores, time does not', () => {
  const args = { persistReshowSig: 9, hoveredSig: 9,
    persistenceSamples: [{ atMs: 1000, present: true, held: true, via: 'tip' }] };
  assert.equal(persistentFacetFromVanish({ ...args, vanishedOnScrollWhileHeld: true,
    scrollHeld: { triggerStillHeld: true, presentAfter: false, reshowIntact: true } }), 'false');
  assert.equal(persistentFacetFromVanish({ ...args, vanishedWhileHeld: true }), 'unmeasured');
});

// E3c the added bar: a scroll vanish whose content will NOT come back at full strength from the restored
// position is NOT attributable to the scroll — the information may simply have become invalid inside the
// probe's own window. Same shape as E3's scoring case, differing only in reshowIntact.
test('E3c a scroll vanish the trigger cannot re-summon at full strength stays UNMEASURED', () => {
  const held = [{ atMs: 1000, present: true, held: true, via: 'tip' }];
  const base = { vanishedOnScrollWhileHeld: true, persistReshowSig: 9, hoveredSig: 9, persistenceSamples: held };
  assert.equal(persistentFacetFromVanish({ ...base,
    scrollHeld: { triggerStillHeld: true, presentAfter: false, reshowIntact: false } }), 'unmeasured');
  assert.equal(persistentFacetFromVanish({ ...base,
    scrollHeld: { triggerStillHeld: true, presentAfter: false } }), 'unmeasured', 'unrecorded is not a pass');
  assert.equal(persistentFacetFromVanish({ ...base,
    scrollHeld: { triggerStillHeld: true, presentAfter: false, reshowIntact: true } }), 'false');
});

test('E4 no vanish revises nothing', () => {
  assert.equal(persistentFacetFromVanish({ vanishedWhileHeld: false, vanishedOnScrollWhileHeld: false,
    persistReshowSig: 9, hoveredSig: 9, persistenceSamples: [] }), null);
  assert.equal(persistentFacetFromVanish({}), null);
});

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// G. Tool-call telemetry is provider-agnostic (2026-08-19).
//    The run-level counter reads ONE shape — a trace event whose `blocks` carry `kind: 'tool_use'`.
//    Only the Claude Agent-SDK normaliser produced it, so every Gemini tools-ON run reported "0 calls"
//    and tripped a warning that could not distinguish a real tool-less regression from normal operation.
// ─────────────────────────────────────────────────────────────────────────────────────────────────

const { makeGeminiToolTransport } = require('../../lib/llm-agent-adapter.js');

// a fake Gemini endpoint: turn 1 asks for a tool, turn 2 answers. Mirrors the v1beta response shape.
function fakeGemini(turns) {
  let i = 0;
  return async () => {
    const body = turns[Math.min(i++, turns.length - 1)];
    return { ok: true, json: async () => body };
  };
}
const CALL_TURN = { candidates: [{ finishReason: 'STOP', content: { parts: [{ functionCall: { name: 'capture_full_page', args: { xpath: '/html' } } }] } }],
  usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 } };
const TEXT_TURN = { candidates: [{ finishReason: 'STOP', content: { parts: [{ text: '{"verdict":"NOT REPRODUCED","confidence":"low","summary":"s","reasoning":"r","evidenceRefs":[]}' }] } }],
  usageMetadata: { promptTokenCount: 12, candidatesTokenCount: 6 } };

test('G1 a Gemini tool call emits the same tool_use trace shape the counter reads', async () => {
  const events = [];
  const transport = makeGeminiToolTransport({
    apiKey: 'test-key', model: 'gemini-3.7-flash',
    dispatch: { declarations: [{ name: 'capture_full_page', parameters: { type: 'object', properties: {} } }], call: async () => ({ ok: true }) },
    fetchImpl: fakeGemini([CALL_TURN, TEXT_TURN]),
    onTraceSink: (e) => events.push(e),
  });
  await transport({ messages: [{ content: [{ type: 'text', text: 'judge this' }] }] });
  const toolBlocks = events.filter((e) => Array.isArray(e.blocks)).flatMap((e) => e.blocks).filter((b) => b.kind === 'tool_use');
  assert.equal(toolBlocks.length, 1, 'the dispatched call is reported');
  assert.equal(toolBlocks[0].name, 'capture_full_page');
  assert.deepEqual(toolBlocks[0].input, { xpath: '/html' });
});

test('G2 the turn count rides the existing result event — no extra event, so llmCalls is not inflated', async () => {
  const events = [];
  const transport = makeGeminiToolTransport({
    apiKey: 'test-key', model: 'gemini-3.7-flash',
    dispatch: { declarations: [{ name: 'capture_full_page', parameters: { type: 'object', properties: {} } }], call: async () => ({ ok: true }) },
    fetchImpl: fakeGemini([CALL_TURN, TEXT_TURN]),
    onTraceSink: (e) => events.push(e),
  });
  await transport({ messages: [{ content: [{ type: 'text', text: 'judge this' }] }] });
  const results = events.filter((e) => e.type === 'result');
  assert.equal(results.length, 2, 'exactly one result per API turn — two turns, two events');
  assert.deepEqual(results.map((r) => r.numTurns), [1, 2], 'each carries its own turn number');
  assert.ok(results.every((r) => r.usage && r.usage.input_tokens > 0), 'token accounting is untouched');
});

test('G3 a run that calls NO tool still reports zero — the warning must stay able to fire', async () => {
  const events = [];
  const transport = makeGeminiToolTransport({
    apiKey: 'test-key', model: 'gemini-3.7-flash',
    dispatch: { declarations: [{ name: 'capture_full_page', parameters: { type: 'object', properties: {} } }], call: async () => ({ ok: true }) },
    fetchImpl: fakeGemini([TEXT_TURN]),
    onTraceSink: (e) => events.push(e),
  });
  await transport({ messages: [{ content: [{ type: 'text', text: 'judge this' }] }] });
  assert.equal(events.filter((e) => Array.isArray(e.blocks)).length, 0, 'no tool call ⇒ no tool_use blocks');
  assert.equal(events.filter((e) => e.type === 'result').length, 1);
});
