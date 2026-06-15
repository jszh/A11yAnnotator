// Harness 3.0 — bounded cost (plan Rule 8): per-experiment + run-level budgets, retry, risk classes.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const budget = require('../lib/budget.js');
const cat = require('../lib/catalog.js');
const { runPlan, CHROME } = require('../lib/run-experiments.js');

const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — budget Chrome test SKIPPED');

test('costFor: defaults, catalog override, and clamping of invalid values', () => {
  assert.deepEqual(budget.costFor(null), { maxWallClockMs: 20000, retries: 1, mutationRisk: 'low' });
  assert.deepEqual(budget.costFor({ cost: { maxWallClockMs: 5000, retries: 0, mutationRisk: 'high' } }), { maxWallClockMs: 5000, retries: 0, mutationRisk: 'high' });
  assert.deepEqual(budget.costFor({ cost: { maxWallClockMs: -1, retries: -3, mutationRisk: 'bogus' } }), { maxWallClockMs: 20000, retries: 1, mutationRisk: 'low' }, 'invalid cost clamps to defaults');
});

test('the catalog declares cost/risk for mutating + long-running experiments', () => {
  assert.equal(budget.costFor(cat.getExperiment('keyboard-activation')).mutationRisk, 'high');
  assert.equal(budget.costFor(cat.getExperiment('ax-state-diff')).mutationRisk, 'high');
  assert.equal(budget.costFor(cat.getExperiment('keyboard-trap-escape')).mutationRisk, 'high');
  assert.ok(budget.costFor(cat.getExperiment('hover-content-tri')).maxWallClockMs >= 30000);
});

test('makeRunBudget: tracks spend, remaining, and exceeded', () => {
  const b = budget.makeRunBudget({ maxRunWallClockMs: 100 });
  assert.equal(b.exceeded(), false);
  b.add(60); assert.equal(b.remaining(), 40);
  b.add(50); assert.equal(b.exceeded(), true); assert.equal(b.remaining(), 0);
});

test('withDeadline: resolves success, timeout, and error without hanging', async () => {
  assert.deepEqual(await budget.withDeadline(async () => 42, 1000), { ok: true, value: 42 });
  const t = await budget.withDeadline(() => new Promise((r) => setTimeout(() => r('late'), 80)), 5);
  assert.equal(t.ok, false); assert.equal(t.timeout, true);
  const e = await budget.withDeadline(async () => { throw new Error('boom'); }, 1000);
  assert.equal(e.ok, false); assert.equal(e.error.message, 'boom');
});

test('runPlan: a tiny run budget DEFERS rather than silently dropping (Rule 8 + Rule 7)', { skip: !chromeOK, concurrency: false }, async () => {
  const fx = 'file://' + path.join(__dirname, '..', '..', '..', 'assets', 'saved', 'fx-v3-focus.html');
  const plan = { file: 'fx', runId: 'R', pageDigest: 'sha256:x', _startedAt: 1, requests: [
    { candidateId: 'c0', experimentId: 'focus-visual-retry', targetXpath: '/html/body/button[1]', sc: '2.4.7' },
    { candidateId: 'c1', experimentId: 'focus-visual-retry', targetXpath: '/html/body/button[2]', sc: '2.4.7' },
  ] };
  const exp = await runPlan(plan, { resolveUrl: () => fx, budgetOpts: { maxRunWallClockMs: 1 } });
  // EVERY request gets exactly one disposition — nothing disappears (Rule 7 / audit V3-H6).
  assert.equal(exp.results.length + exp.unrun.length, plan.requests.length, 'every request reconciled');
  assert.ok(exp.unrun.length >= 1, 'a 1ms run budget defers at least one request');
  assert.ok(exp.unrun.every((u) => ['deferred', 'failed'].includes(u.status)));
  assert.ok(exp.unrun.some((u) => /budget|wall-clock/.test(u.reason)), 'deferral cites the budget');
});
