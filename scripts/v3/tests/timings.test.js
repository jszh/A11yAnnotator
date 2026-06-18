// Run-timing collector — unit coverage with an injected fake clock (deterministic, no real time).
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { makeTimings } = require('../lib/timings.js');

function fakeClock() { let t = 0; const now = () => t; now.advance = (ms) => { t += ms; }; return now; }

test('timings: stage() times an async stage, returns its value, accumulates across calls', async () => {
  const clk = fakeClock();
  const t = makeTimings(clk);
  const r = await t.stage('experiments', async () => { clk.advance(120); return 'ok'; });
  assert.equal(r, 'ok');
  await t.stage('experiments', async () => { clk.advance(80); });
  const s = t.snapshot();
  assert.deepEqual(s.stages.experiments, { ms: 200, count: 2 });
  assert.equal(s.totalStageMs, 200);
});

test('timings: stage() still records the elapsed time when the body throws', async () => {
  const clk = fakeClock();
  const t = makeTimings(clk);
  await assert.rejects(() => t.stage('vision', async () => { clk.advance(50); throw new Error('boom'); }), /boom/);
  assert.equal(t.snapshot().stages.vision.ms, 50, 'a throwing stage is still timed');
});

test('timings: stageSync + record fold into the same per-stage buckets', () => {
  const clk = fakeClock();
  const t = makeTimings(clk);
  t.stageSync('build', () => { clk.advance(15); });
  t.record('llm', 900);                 // a duration measured elsewhere
  t.record('llm', 100);
  const s = t.snapshot();
  assert.equal(s.stages.build.ms, 15);
  assert.deepEqual(s.stages.llm, { ms: 1000, count: 2 });
});

test('timings: per-element breakdown attributes time by key and stage', () => {
  const t = makeTimings(fakeClock());
  t.element('/html/body/button[1]::2.4.7', 'experiment', 40);
  t.element('/html/body/button[1]::2.4.7', 'llm', 1200);
  t.element('/html/body/a[1]::1.4.3', 'llm', 800);
  const s = t.snapshot();
  assert.deepEqual(s.elements['/html/body/button[1]::2.4.7'], { experiment: { ms: 40, count: 1 }, llm: { ms: 1200, count: 1 } });
  assert.equal(s.elements['/html/body/a[1]::1.4.3'].llm.ms, 800);
});

test('timings: null key/stage and negative/NaN durations are ignored, not crashing', () => {
  const t = makeTimings(fakeClock());
  t.element(null, 'x', 10);             // ignored (no key)
  t.element('k', null, 10);             // ignored (no stage)
  t.record('s', -50);                   // clamped to 0
  t.record('s', NaN);                   // treated as 0
  const s = t.snapshot();
  assert.deepEqual(s.elements, {});
  assert.equal(s.stages.s.ms, 0);
  assert.equal(s.stages.s.count, 2);
});

test('timings: snapshot is a plain detached object (mutating it does not corrupt the collector)', () => {
  const t = makeTimings(fakeClock());
  t.record('a', 10);
  const snap = t.snapshot();
  snap.stages.a.ms = 99999;
  assert.equal(t.snapshot().stages.a.ms, 10, 'the live collector is unaffected by mutating a snapshot');
});
