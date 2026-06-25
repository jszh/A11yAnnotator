'use strict';
// Judge-design presets for the FP-reduction experiments. A preset maps --method to a set of V3_FP_* env flags
// consumed inside scripts/v3/lib/llm-adjudicator.js (prompt + verdict levers, all inert by default). Implementing
// the levers in the adjudicator — not here — means a method runs IDENTICALLY in the cheap replay testbed and in a
// final live tools-ON full run, so a replay win transfers without a code change.
//
// Methods (added incrementally; baseline first for replay↔live validation):
//   baseline        — current production judge (no flags)
//   strip-question  — distractor stripping: drop the restated question/claimFamily/skill framing  [Mode global]
//   abstain-high    — downgrade a low/medium-confidence BARRIER verdict to PARTIAL (abstain)        [Mode D]
//   refute          — skeptical 2nd-pass: each BARRIER must survive a refutation call               [Mode C/D]
//   selfconsist-3   — sample the judge 3×; keep BARRIER only on a high-agreement bar                 [Mode C/D]
//   boundary        — inject explicit positive-class boundary + near-miss counter-examples          [Mode B]
//   grounded        — require a cited evidence span ruling out the pass-explanation before flagging  [Mode C]

const PRESETS = {
  baseline: {},
  'strip-question': { V3_FP_STRIP_QUESTION: '1' },
  'abstain-high': { V3_FP_ABSTAIN: 'high' },           // require confidence==high to keep a BARRIER
  'abstain-med': { V3_FP_ABSTAIN: 'medium' },          // require confidence>=medium
  refute: { V3_FP_REFUTE: '1' },
  'selfconsist-3': { V3_FP_VOTES: '3', V3_FP_VOTE_BAR: 'unanimous' },
  'selfconsist-3maj': { V3_FP_VOTES: '3', V3_FP_VOTE_BAR: 'majority' },
  boundary: { V3_FP_BOUNDARY: '1' },
  grounded: { V3_FP_GROUNDED: '1' },
  'apply-gate': { V3_FP_APPLY_GATE: '1' },             // decomposed step-1 applicability/exemption call [Mode B/D]
  'sharpen-412': { V3_FP_412_SHARPEN: '1' },           // targeted 4.1.2 name presence-vs-quality decision procedure
};

// all V3_FP_* flags we manage — cleared before each resolve so presets don't leak across in-process reuse
const MANAGED = ['V3_FP_STRIP_QUESTION', 'V3_FP_ABSTAIN', 'V3_FP_REFUTE', 'V3_FP_VOTES', 'V3_FP_VOTE_BAR', 'V3_FP_BOUNDARY', 'V3_FP_GROUNDED', 'V3_FP_APPLY_GATE', 'V3_FP_412_SHARPEN'];

function resolve(method) {
  for (const k of MANAGED) delete process.env[k];
  // a method is one preset OR a "+"-joined combination, e.g. --method=grounded+strip-question
  const parts = method.split('+');
  const envEcho = {};
  for (const part of parts) {
    const p = PRESETS[part];
    if (!p) throw new Error(`unknown preset part "${part}" in --method=${method}; known: ${Object.keys(PRESETS).join(', ')}`);
    for (const [k, v] of Object.entries(p)) { process.env[k] = v; envEcho[k] = v; }
  }
  return { method, envEcho };
}

// run the two judge producers over the pack's frozen subjects; method levers fire inside the adjudicator via env.
async function applyMethod(cfg, { llmAdj, pack, pOpts }) {
  const adj = (pack.agentSubjects && pack.agentSubjects.length)
    ? await llmAdj.runAdjudication(pack.agentSubjects, pOpts).catch(() => null) : null;
  const rub = (pack.rubricSubjects && pack.rubricSubjects.length)
    ? await llmAdj.runRubricJudgments(pack.rubricSubjects, pOpts).catch(() => null) : null;
  return { adj, rub };
}
applyMethod.resolve = resolve;
applyMethod.PRESETS = PRESETS;

module.exports = { applyMethod };
