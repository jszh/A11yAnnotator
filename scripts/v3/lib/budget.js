// Harness 3.0 — bounded cost: per-experiment + run-level budgets and risk classes (plan Rule 8).
//
// A real run over many pages must never hang on a pathological page, retry forever, or run a
// high-mutation experiment without isolation. Each experiment declares a `cost` class (wall-clock,
// retries, mutationRisk); the runner enforces it with a hard wall-clock DEADLINE (aborting the page
// on timeout), a bounded retry count, and a run-level wall-clock cap. A candidate that would exceed
// any budget is recorded as an explicit `unrun` disposition (deferred/failed) — NEVER silently
// dropped or allowed to clear (Rule 7 / audit V3-H6).
'use strict';

// conservative defaults; an experiment overrides via its catalog `cost` block.
const DEFAULT_COST = Object.freeze({ maxWallClockMs: 20000, retries: 1, mutationRisk: 'low' });
const RISK_CLASSES = Object.freeze(['none', 'low', 'high']);
// HARD upper bounds: clamping only the LOWER bound let a catalog entry (or an attacker who can supply a
// catalog) request retries:1e6 / maxWallClockMs:1e9, multiplying the per-request run-budget overshoot
// without limit (gap-fill red-team). All real catalog entries are ≤30000ms / 1 retry, so these caps are
// generous headroom, not a functional constraint — they bound only the pathological tail.
const MAX_WALL_CLOCK_MS = 120000;
const MAX_RETRIES = 5;

// the effective cost class for an experiment (catalog `cost` ∪ defaults), validated/clamped BOTH ends.
function costFor(exp) {
  const c = (exp && exp.cost) || {};
  const maxWallClockMs = Number.isFinite(c.maxWallClockMs) && c.maxWallClockMs > 0 ? Math.min(c.maxWallClockMs, MAX_WALL_CLOCK_MS) : DEFAULT_COST.maxWallClockMs;
  const retries = Number.isInteger(c.retries) && c.retries >= 0 ? Math.min(c.retries, MAX_RETRIES) : DEFAULT_COST.retries;
  const mutationRisk = RISK_CLASSES.includes(c.mutationRisk) ? c.mutationRisk : DEFAULT_COST.mutationRisk;
  return { maxWallClockMs, retries, mutationRisk };
}

// run-level wall-clock cap shared across a plan; exceeded ⇒ remaining candidates are deferred.
function makeRunBudget({ maxRunWallClockMs = 10 * 60 * 1000 } = {}) {
  let spent = 0;
  return {
    add(ms) { spent += Math.max(0, ms || 0); },
    spent() { return spent; },
    remaining() { return Math.max(0, maxRunWallClockMs - spent); },
    exceeded() { return spent >= maxRunWallClockMs; },
    max: maxRunWallClockMs,
  };
}

// Run `factory()` with a hard wall-clock deadline. Resolves { ok:true, value } on success,
// { ok:false, timeout:true } if the deadline fires first, or { ok:false, error } on rejection.
// The caller is responsible for aborting side effects (e.g. closing the page) on a timeout.
function withDeadline(factory, ms) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (r) => { if (!settled) { settled = true; clearTimeout(timer); resolve(r); } };
    const timer = setTimeout(() => finish({ ok: false, timeout: true }), ms);
    Promise.resolve().then(factory).then((value) => finish({ ok: true, value }), (error) => finish({ ok: false, error }));
  });
}

module.exports = { DEFAULT_COST, RISK_CLASSES, MAX_WALL_CLOCK_MS, MAX_RETRIES, costFor, makeRunBudget, withDeadline };
