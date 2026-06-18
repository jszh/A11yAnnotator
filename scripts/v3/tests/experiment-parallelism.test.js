// Harness — DETERMINISTIC experiment parallelism (V3_EXPERIMENT_CONCURRENCY). The authoritative path may run
// experiments on N tab-copies concurrently, but MUST produce byte-identical dispositions (verdicts + order +
// attestation) to the serial run. This proves the three guarantees: (1) the budget RESERVATION guard never
// overshoots the cap and is a no-op when serial; (2) runPool keeps slot order == request order regardless of
// completion order; (3) end-to-end, concurrency 3 == serial and is repeat-run deterministic.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const budget = require('../lib/budget.js');
const { runPool } = require('../lib/llm-adjudicator.js');
const { runPlan, CHROME } = require('../lib/run-experiments.js');
const { assetFileUrl, assetPath } = require('../../lib/asset-paths.js');

const chromeOK = fs.existsSync(CHROME);
const FX = assetFileUrl('fx-v3-focus.html');
if (!chromeOK) console.log('# Chrome not found — experiment-parallelism Chrome tests SKIPPED');

// ---- (1) budget reservation guard — no Chrome ----
test('makeRunBudget.reserve/reconcile: concurrent reservations cannot overshoot the cap', () => {
  const b = budget.makeRunBudget({ maxRunWallClockMs: 100 });
  const g1 = b.reserve(60); assert.equal(g1, 60); assert.equal(b.remaining(), 40); assert.equal(b.exceeded(), false);
  const g2 = b.reserve(60); assert.equal(g2, 40, 'a 2nd in-flight reservation gets only the FREE headroom — no double-spend');
  assert.equal(b.remaining(), 0); assert.equal(b.exceeded(), true);
  assert.equal(b.reserve(10), 0, 'no headroom left ⇒ grant 0 ⇒ the caller defers (cap never overshot)');
  b.reconcile(g1, 5); b.reconcile(g2, 7); // both attempts cost far less than the worst-case they reserved
  assert.equal(b.spent(), 12, 'only the REAL measured cost is booked');
  assert.equal(b.remaining(), 88, 'the unused reservation is refunded');
  assert.equal(b.exceeded(), false);
});

test('makeRunBudget.reserve/reconcile is byte-identical to add() when serial (no outstanding reservation)', () => {
  const reserved = budget.makeRunBudget({ maxRunWallClockMs: 100 });
  const plain = budget.makeRunBudget({ maxRunWallClockMs: 100 });
  for (const cost of [30, 25, 80]) {
    const g = reserved.reserve(Math.min(cost + 5, reserved.remaining())); reserved.reconcile(g, cost); // reserve-then-reconcile within one attempt
    plain.add(cost);
    assert.equal(reserved.spent(), plain.spent(), `spent matches after a ${cost}ms attempt`);
    assert.equal(reserved.remaining(), plain.remaining(), `remaining matches after a ${cost}ms attempt`);
    assert.equal(reserved.exceeded(), plain.exceeded(), `exceeded matches after a ${cost}ms attempt`);
  }
});

// ---- (2) runPool ordering primitive — no Chrome ----
test('runPool: slot i always holds fn(items[i]) even when item 0 completes LAST (deterministic ordering)', async () => {
  const items = [0, 1, 2, 3, 4, 5];
  // reverse the delays so EARLIER items finish LATER — completion order is the opposite of request order
  const out = await runPool(items, 3, async (n) => { await new Promise((r) => setTimeout(r, (6 - n) * 8)); return n * 10; });
  assert.deepEqual(out, [0, 10, 20, 30, 40, 50], 'slot order == request order despite reversed completion order');
});

// ---- (3) end-to-end: parallel == serial authoritative output ----
const disposition = (exp) => ({
  // the verdict-determining fields, free of raw pixel buffers / timing
  results: exp.results.map((r) => ({ claimId: r.claimId, sc: r.sc, valid: r.valid, completed: r.completed, focusable: r.applicabilityEvidence && r.applicabilityEvidence.targetIsFocusable, reach: r.applicabilityEvidence && r.applicabilityEvidence.keyboardReachableInState })),
  unrun: exp.unrun.map((u) => ({ candidateId: u.candidateId, status: u.status })),
});
const PLAN = () => ({ file: 'fx', runId: 'R', pageDigest: 'sha256:x', _startedAt: 1, requests: [
  { candidateId: 'c0', experimentId: 'focus-visual-retry', targetXpath: '/html/body/button[1]', sc: '2.4.7' },
  { candidateId: 'c1', experimentId: 'focus-visual-retry', targetXpath: '/html/body/button[2]', sc: '2.4.7' },
  { candidateId: 'c2', experimentId: 'focus-visual-retry', targetXpath: '/html/body/button[3]', sc: '2.4.7' },
] });

test('runPlan: concurrency 3 gives the SAME dispositions, in REQUEST order, as serial (authoritative byte-identical)', { skip: !chromeOK, concurrency: false }, async () => {
  const serial = await runPlan(PLAN(), { resolveUrl: () => FX, experimentConcurrency: 1 });
  const parallel = await runPlan(PLAN(), { resolveUrl: () => FX, experimentConcurrency: 3 });
  assert.deepEqual(disposition(parallel), disposition(serial), 'parallel run == serial run (same verdicts, same order)');
  assert.deepEqual(serial.results.map((r) => r.claimId), ['c0', 'c1', 'c2'], 'results stay in request order, not completion order');
});

test('runPlan: two concurrency-3 runs are identical (no race nondeterminism)', { skip: !chromeOK, concurrency: false }, async () => {
  const a = await runPlan(PLAN(), { resolveUrl: () => FX, experimentConcurrency: 3 });
  const b = await runPlan(PLAN(), { resolveUrl: () => FX, experimentConcurrency: 3 });
  assert.deepEqual(disposition(a), disposition(b), 'repeat concurrency-3 runs match each other');
});

test('runPlan: every request still gets exactly ONE disposition under concurrency (audit V3-H6)', { skip: !chromeOK, concurrency: false }, async () => {
  const exp = await runPlan(PLAN(), { resolveUrl: () => FX, experimentConcurrency: 3 });
  assert.equal(exp.results.length + exp.unrun.length, 3, 'three requests ⇒ three dispositions, none dropped or duplicated');
});
