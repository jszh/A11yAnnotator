'use strict';
// Lightweight run-timing collector. Answers "where did the wall-clock go?" at two grains:
//   • per-STAGE  — experiments vs vision vs llm vs instruments vs build (the headline breakdown), and
//   • per-ELEMENT — each subject's time within a stage (so a slow control/obligation is attributable).
// Pure accounting, no I/O. orchestrate() threads ONE instance through the run and snapshots it into the bundle
// (→ timings.json). `nowFn` is injectable so the unit tests are deterministic (no real clock).
function makeTimings(nowFn) {
  const now = typeof nowFn === 'function' ? nowFn : Date.now;
  const stages = {};    // stage     -> { ms, count }
  const elements = {};  // elementKey -> { stage -> { ms, count } }

  const bump = (bucket, ms) => { bucket.ms += Math.max(0, Number(ms) || 0); bucket.count++; };
  const addStage = (name, ms) => bump(stages[name] || (stages[name] = { ms: 0, count: 0 }), ms);
  const addElement = (key, stage, ms) => {
    if (key == null || stage == null) return;
    const e = elements[key] || (elements[key] = {});
    bump(e[stage] || (e[stage] = { ms: 0, count: 0 }), ms);
  };

  return {
    // Time an async stage and return its result: await t.stage('experiments', () => run.runPlan(...))
    async stage(name, fn) { const t0 = now(); try { return await fn(); } finally { addStage(name, now() - t0); } },
    // Time a synchronous stage.
    stageSync(name, fn) { const t0 = now(); try { return fn(); } finally { addStage(name, now() - t0); } },
    // Fold in a duration measured elsewhere (e.g. a per-attempt cost reconciled inside run-experiments).
    record(name, ms) { addStage(name, ms); },
    element(key, stage, ms) { addElement(key, stage, ms); },
    snapshot() {
      const stageOut = {};
      for (const k of Object.keys(stages)) stageOut[k] = { ms: stages[k].ms, count: stages[k].count };
      const elOut = {};
      for (const k of Object.keys(elements)) { elOut[k] = {}; for (const s of Object.keys(elements[k])) elOut[k][s] = { ms: elements[k][s].ms, count: elements[k][s].count }; }
      const totalStageMs = Object.values(stages).reduce((a, s) => a + s.ms, 0);
      return { totalStageMs, stages: stageOut, elements: elOut };
    },
  };
}
module.exports = { makeTimings };
