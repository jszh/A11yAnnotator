// Residual RCA S10 — multi-step status evidence, PURE-NODE slice. The browser halves of this work
// (the phase-B timeline itself, the birth observer against a live document, the hover persistence
// probe) live in status-timeline.test.js / hover-persistence.test.js; everything here runs with no
// Chrome at all: the budget math, the pure finding/aggregation helpers, and the source-level pins
// that keep the new evidence OFF the prompt-bound observation objects until the surfacing hunks land.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { effectiveTimelineMs } = require('../../lib/status-detector.js');
const { birthFindingsFrom, colourDeltasFrom } = require('../../lib/run-instruments.js');

// ── effectiveTimelineMs: the phase-B horizon is budget-clamped and never below the legacy window ──
test('timeline horizon: full budget ⇒ the configured horizon', () => {
  assert.equal(effectiveTimelineMs({ timelineMs: 8000, sweepBudgetMs: 15000, elapsedMs: 0, maxWaitMs: 2500 }), 8000);
});

test('timeline horizon: is clamped to what the sweep budget has left (minus the reserve)', () => {
  assert.equal(effectiveTimelineMs({ timelineMs: 8000, sweepBudgetMs: 15000, elapsedMs: 10000, maxWaitMs: 2500 }), 4000);
});

test('timeline horizon: an extension that cannot beat the legacy window buys nothing ⇒ 0', () => {
  // remaining budget leaves at most 2s of horizon, below the 2.5s legacy window — the trigger must run
  // exactly the pre-timeline shape rather than pay setup for a shorter window.
  assert.equal(effectiveTimelineMs({ timelineMs: 8000, sweepBudgetMs: 15000, elapsedMs: 12000, maxWaitMs: 2500 }), 0);
  assert.equal(effectiveTimelineMs({ timelineMs: 8000, sweepBudgetMs: 15000, elapsedMs: 15000, maxWaitMs: 2500 }), 0);
});

test('timeline horizon: disabled (0 / non-finite) ⇒ 0, and a custom horizon is honoured', () => {
  assert.equal(effectiveTimelineMs({ timelineMs: 0, sweepBudgetMs: 15000, elapsedMs: 0, maxWaitMs: 2500 }), 0);
  assert.equal(effectiveTimelineMs({ timelineMs: NaN, sweepBudgetMs: 15000, elapsedMs: 0, maxWaitMs: 2500 }), 0);
  assert.equal(effectiveTimelineMs({ timelineMs: 5000, sweepBudgetMs: 60000, elapsedMs: 0, maxWaitMs: 2500 }), 5000);
});

// ── STARVATION GUARD (soundness probe 2026-08-17): the reserve scales with the triggers still unprobed,
// and a sweep-wide phase-B pool bounds the total extension spend — phase B may never cost a later trigger
// its legacy window.
test('timeline horizon: the reserve covers a worst-case legacy window for EVERY unprobed trigger', () => {
  // 3 triggers still to probe ⇒ reserve 3 × 2500 = 7500 ⇒ horizon clamps to 15000 − 0 − 7500 = 7500
  assert.equal(effectiveTimelineMs({ timelineMs: 8000, sweepBudgetMs: 15000, elapsedMs: 0, maxWaitMs: 2500, remainingTriggers: 3 }), 7500);
  // 5 unprobed triggers ⇒ reserve 12500 ⇒ at most 2500 of horizon left, not past the legacy window ⇒ 0
  assert.equal(effectiveTimelineMs({ timelineMs: 8000, sweepBudgetMs: 15000, elapsedMs: 0, maxWaitMs: 2500, remainingTriggers: 5 }), 0);
  // remainingTriggers: 0 keeps the old flat-1000 floor (a lone trigger loses nothing)
  assert.equal(effectiveTimelineMs({ timelineMs: 8000, sweepBudgetMs: 15000, elapsedMs: 0, maxWaitMs: 2500, remainingTriggers: 0 }), 8000);
});

test('timeline horizon: the phase-B pool clamps the extension past the legacy window', () => {
  // pool 4500 ⇒ horizon capped at legacy 2500 + 4500 = 7000 even with budget to spare
  assert.equal(effectiveTimelineMs({ timelineMs: 8000, sweepBudgetMs: 15000, elapsedMs: 0, maxWaitMs: 2500, phaseBPoolMs: 4500 }), 7000);
  // an exhausted pool ⇒ no extension at all — the trigger runs exactly the legacy shape
  assert.equal(effectiveTimelineMs({ timelineMs: 8000, sweepBudgetMs: 15000, elapsedMs: 0, maxWaitMs: 2500, phaseBPoolMs: 0 }), 0);
  // an omitted pool is unbounded (pure-math callers unchanged)
  assert.equal(effectiveTimelineMs({ timelineMs: 8000, sweepBudgetMs: 15000, elapsedMs: 0, maxWaitMs: 2500 }), 8000);
});

// ── birthFindingsFrom: only the two suspicious shapes produce a review row ──
const bornFilled = { xpath: '/html/body/div[3]', via: 'mount', mountedAfterLoad: true, emptyAtBirth: false, textAtBirth: 'x', atMs: 2500, removedAtMs: null };

test('birth findings: a region MOUNTED after load already carrying text is a 4.1.3 review row', () => {
  const rows = birthFindingsFrom({ regions: [bornFilled] });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].sc, '4.1.3');
  assert.equal(rows[0].kind, 'live-region-birth');
  assert.equal(rows[0].review, true, 'never a barrier on its own');
  assert.equal(rows[0].xpath, '/html/body/div[3]');
  assert.match(rows[0].detail, /INSERTED into the document after load/);
  assert.match(rows[0].detail, /OBSERVATION, not a verdict/);
});

test('birth findings: a self-removing born-filled region carries the removal clause', () => {
  const rows = birthFindingsFrom({ regions: [{ ...bornFilled, removedAtMs: 8000 }] });
  assert.equal(rows.length, 1);
  assert.match(rows[0].detail, /REMOVED ITSELF/);
});

test('birth findings: an element WIRED live after its content was set is a review row', () => {
  const rows = birthFindingsFrom({ regions: [{ xpath: '/html/body/p[1]', via: 'attribute-wired', mountedAfterLoad: false, emptyAtBirth: false, atMs: 900 }] });
  assert.equal(rows.length, 1);
  assert.match(rows[0].detail, /WIRED as a live region/);
});

test('birth findings: the healthy shapes produce NO row (existed-empty, or parsed with initial content)', () => {
  const rows = birthFindingsFrom({ regions: [
    { xpath: '/html/body/div[1]', via: 'mount', mountedAfterLoad: false, emptyAtBirth: true, duringInitialParse: true, firstContentAtMs: 4000 }, // static region filled later — healthy
    { xpath: '/html/body/div[2]', via: 'mount', mountedAfterLoad: false, emptyAtBirth: false, duringInitialParse: true },                        // initial page content — not a mount
    { xpath: '/html/body/div[4]', via: 'mount', mountedAfterLoad: true, emptyAtBirth: true },                                                    // mounted EMPTY then (maybe) filled — the empty birth is fine
  ] });
  assert.deepEqual(rows, []);
});

test('birth findings: capped, and null/absent input yields []', () => {
  const many = Array.from({ length: 12 }, (_, i) => ({ ...bornFilled, xpath: `/html/body/div[${i + 1}]` }));
  assert.equal(birthFindingsFrom({ regions: many }).length, 6, 'row cap');
  assert.deepEqual(birthFindingsFrom(null), []);
  assert.deepEqual(birthFindingsFrom({}), []);
});

// ── HARNESS ATTRIBUTION (soundness probe 2026-08-17): a birth recorded after the lane's own click
// boundary is the harness's toast, not the page's — tagged in the artifact, never a review row.
test('birth findings: a harnessInteraction-tagged birth produces NO row; the identical untagged birth still does', () => {
  const tagged = { ...bornFilled, harnessInteraction: true };
  assert.deepEqual(birthFindingsFrom({ regions: [tagged] }), [], 'harness-caused ⇒ artifact-only');
  const mixed = birthFindingsFrom({ regions: [tagged, { ...bornFilled, xpath: '/html/body/div[7]' }] });
  assert.equal(mixed.length, 1, 'the spontaneous birth beside it is still flagged');
  assert.equal(mixed[0].xpath, '/html/body/div[7]');
  // the wired-onto-content shape honours the same boundary
  assert.deepEqual(birthFindingsFrom({ regions: [{ xpath: '/html/body/p[1]', via: 'attribute-wired', emptyAtBirth: false, atMs: 900, harnessInteraction: true }] }), []);
});

// ── colourDeltasFrom: per-trigger deltas flatten into the one instrument fact, trigger-stamped ──
test('colour deltas: flattened and stamped with the producing trigger', () => {
  const out = colourDeltasFrom([
    { trigger: '/html/body/button[1]', colourStateDeltas: [{ xpath: '/html/body/table/tbody/tr[1]', backgroundBefore: 'rgba(0, 0, 0, 0)', backgroundAfter: 'rgb(46, 125, 50)', textAlsoChangedNearby: false }] },
    { trigger: '/html/body/button[2]' }, // no deltas → contributes nothing
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0].trigger, '/html/body/button[1]');
  assert.equal(out[0].backgroundAfter, 'rgb(46, 125, 50)');
  assert.equal(out[0].textAlsoChangedNearby, false);
  assert.deepEqual(colourDeltasFrom(null), []);
});

// ── SOURCE PINS: the new evidence must stay OFF the prompt-embedded observation objects ──
// statusObservations rows are embedded verbatim in the status-message prompt (llm-adjudicator
// `obs.slice(0, CAP)`), so the timeline/colour sidecars must never become keys on the observation
// literal — they ride as separate artifacts until the lead's surfacing hunk lands.
test('the observation object literal carries no timeline/colour keys (prompt byte-identity)', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', '..', 'lib', 'status-detector.js'), 'utf8');
  const m = src.match(/const observation = \{[\s\S]*?\n {8}\};/);
  assert.ok(m, 'the observation literal must still exist');
  assert.ok(!/timeline|colourStateDeltas|stateEvents|visFlips/.test(m[0]),
    'the observation object must not grow timeline/colour keys — they are sidecar artifacts');
});

test('runInstruments returns the sidecar artifacts alongside statusObservations (source pin)', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', '..', 'lib', 'run-instruments.js'), 'utf8');
  assert.match(src, /return \{ findings, tabOrder, statusObservations: statusObs, statusTimelines, colourStateDeltas, liveRegionBirths, collectorLiveness \}/);
});

// ── the hover persistence probe must stay OUT of the outcome flags (typedOutcomes is closed) ──
test('persistence facts ride in measurement, never in outcome flags', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', '..', 'lib', 'exp-runners.js'), 'utf8');
  assert.match(src, /persistenceSamples, vanishedWhileHeld \} : \{\}\) \} \}\);/, 'measurement carries the probe facts');
  assert.ok(!/o\.persistenceSamples|o\.vanishedWhileHeld/.test(src), 'no new outcome flag — schemas.js validates outcome keys against catalog typedOutcomes');
  // and the pinned dwell adjacency the facet-split regression test relies on must be intact
  assert.match(src, /await H\.settle\(page, 1600\);\s*\n\s*o\.persistent =/);
});
