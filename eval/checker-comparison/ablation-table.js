#!/usr/bin/env node
'use strict';
// Reusable ablation-table reporter for the evidence×vision FN×LLM experiments.
// Prints a markdown table over whichever config result dirs exist. The PRIMARY metric is the LLM-LANE recall
// (failed cases the LLM flagged a barrier) — it is computed directly from the agent/rubric verdicts and is
// therefore independent of the obligation scorer, so it stays consistent across runs. End-to-end recall / FP /
// precision read the runner's `outcome` field; the no-tools ablation runs are one code batch and mutually
// consistent. Partial (scored<458) or missing dirs are flagged, never silently averaged.
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../../results');
const FAIL = 66, PASS = 392; // reaches-LLM split: 66 GT-fail, 392 GT-pass/inapplicable

// an LLM "barrier" verdict on this case (scorer-independent): a REPRODUCED agent verdict or a LIKELY_BARRIER rubric verdict
const llmFlagged = (x) =>
  (x.agentVerdicts || []).some((v) => { const s = JSON.stringify(v); return /REPRODUCED/.test(s) && !/NOT REPRODUCED/.test(s); }) ||
  (x.rubricVerdicts || []).some((v) => /LIKELY_BARRIER/.test(JSON.stringify(v)));

// All no-vision rows use the FAIR config (V3_NO_VISION_RUBRIC: gate bypassed + de-visioned rubric). The earlier
// gate-confounded no-vision runs (exp3/exp4/exp5) invoked the LLM on ~16/458 cases and are excluded as invalid.
const CONFIGS = [
  ['run9-llmoff-baseline', 'Deterministic only (LLM off)', '—', '—'],
  ['exp10-namerole-devision', 'LLM + name/role (fair no-vision)', 'none', 'name/role'],
  ['exp11-html-novision-devision', 'LLM + raw element HTML (fair no-vision)', 'none', 'name/role + HTML'],
  ['exp8-v3sig-novision-devision', 'LLM + v3 signals (fair no-vision)', 'none', 'name/role + v3 signals'],
  ['exp6-baseline-vision', 'LLM + v3 signals + FULL-PAGE vision', 'full-page', 'name/role + v3 signals'],
  ['exp9-namerole-vision', 'LLM + name/role + targeted vision', 'targeted', 'name/role'],
  ['exp2-llm-notools', 'LLM + v3 signals + targeted vision', 'targeted', 'name/role + v3 signals'],
  ['run8-instruments', 'FULL: v3 + targeted vision + TOOLS', 'targeted', 'name/role + v3 signals + tools'],
];

function metrics(dir) {
  const f = path.join(ROOT, dir, 'results.json');
  if (!fs.existsSync(f)) return null;
  let R; try { R = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; }
  const fl = R.filter((x) => x.expected === 'failed');
  const sp = R.filter((x) => x.expected !== 'failed');
  const tp = fl.filter((x) => x.outcome === 'caught').length;   // GT-fail flagged = true positive
  const fn = FAIL - tp;                                          // GT-fail missed = false negative
  const fp = sp.filter((x) => x.outcome === 'caught').length;   // GT-pass flagged = false positive
  const tn = PASS - fp;
  const recall = tp / FAIL;
  const precision = (tp + fp) ? tp / (tp + fp) : 0;
  const f1 = (precision + recall) ? 2 * precision * recall / (precision + recall) : 0;
  const llmR = fl.filter(llmFlagged).length;                    // LLM's marginal recall (scorer-independent)
  let done = R.length;
  try { done = JSON.parse(fs.readFileSync(path.join(ROOT, dir, 'status.json'), 'utf8')).done; } catch {}
  return { scored: R.length, done, tp, fn, fp, tn, recall, precision, f1, llmR };
}

const p1 = (x) => (x * 100).toFixed(1) + '%';
// End-to-end confusion (P/R/F1/FP/FN over the full reaches-LLM set) + the LLM-lane marginal recall.
console.log('\n| Config | Vision | Recall | Precision | F1 | TP | FN | FP | FP-rate | LLM-lane |');
console.log('|---|---|---|---|---|---|---|---|---|---|');
for (const [dir, label, vision] of CONFIGS) {
  const m = metrics(dir);
  if (!m) { console.log(`| ${label} | ${vision} | _not run_ | | | | | | | |`); continue; }
  const partial = m.done < 458 ? ` ⏳${m.done}/458` : '';
  console.log(`| ${label}${partial} | ${vision} | ${p1(m.recall)} | ${p1(m.precision)} | ${m.f1.toFixed(3)} | ${m.tp} | ${m.fn} | ${m.fp} | ${p1(m.fp / PASS)} | ${m.llmR}/66 |`);
}
console.log('\n_GT: 66 fail (recall denom), 392 pass/NA (FP denom). TP=GT-fail flagged, FN=GT-fail missed, FP=GT-pass flagged. Recall=TP/66, Precision=TP/(TP+FP), F1=harmonic mean. LLM-lane=GT-fail the LLM marginally flagged (scorer-independent). ⚠ run8 predates the scorer fix (FP inflated) until re-run._\n');
