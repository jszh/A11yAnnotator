#!/usr/bin/env node
'use strict';
// Analyze K replicate replay runs (results.rep1.json … results.repK.json in one --dir, or several --dirs) for the
// FIXED-EVIDENCE noise floor + per-case stability. Generalizes the prior docs/.../analyze-variance.js to the
// replay output. Because the replay holds the evidence byte-fixed, any remaining FP/recall variance is the JUDGE's
// intrinsic sampling noise — directly comparable to the prior full-pipeline ±3 FP floor (which also carried
// collect/vision/tool nondeterminism). Reports: per-run FP/recall, the noise band, the stable/noisy decomposition,
// and per-case flip rates (the inputs to the power analysis).
//
// Usage:
//   node analyze-replicates.js --dir=results/fp-rep-baseline
//   node analyze-replicates.js --dir=results/fp-rep-baseline --dir2=results/fp-rep-refute   # A/B two methods

const fs = require('fs');
const path = require('path');
const REPO_ROOT = path.join(__dirname, '..', '..', '..');

function arg(name, def = null) { const p = process.argv.find((x) => x === `--${name}` || x.startsWith(`--${name}=`)); if (!p) return def; if (p === `--${name}`) return true; return p.slice(name.length + 3); }
function abs(p) { return path.isAbsolute(p) ? p : path.join(REPO_ROOT, p); }

function loadReps(dir) {
  const d = abs(dir);
  const files = fs.readdirSync(d).filter((f) => /^results\.rep\d+\.json$/.test(f)).sort();
  return files.map((f) => JSON.parse(fs.readFileSync(path.join(d, f), 'utf8')));
}
// per replicate: {fp, recall, caughtIds, fpIds}; caught keyed by testcaseId
function repMetrics(R) {
  const fail = R.filter((x) => x.expected === 'failed');
  const spec = R.filter((x) => x.expected !== 'failed');
  const tp = fail.filter((x) => x.outcome === 'caught').length;
  const fp = spec.filter((x) => x.falsePositive).length;
  return { tp, fn: fail.length - tp, fp, failN: fail.length, specN: spec.length,
    caught: new Set(R.filter((x) => x.outcome === 'caught').map((x) => x.testcaseId)) };
}
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const sd = (a) => { const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, a.length - 1)); };

function analyze(dir, label) {
  const reps = loadReps(dir);
  if (!reps.length) { console.log(`(${label}: no replicate files in ${dir})`); return null; }
  const K = reps.length;
  const ms = reps.map(repMetrics);
  const fps = ms.map((m) => m.fp), recs = ms.map((m) => m.tp);
  // union of all case ids + their per-rep caught vector
  const ids = [...new Set(reps.flatMap((R) => R.map((x) => x.testcaseId)))];
  const meta = {}; for (const R of reps) for (const x of R) meta[x.testcaseId] = { exp: x.expected, sc: (x.sc || [])[0] };
  let stableCorrect = 0, stableFP = 0, stableMiss = 0, noisy = 0; const noisyCases = [], stableFPcases = [], stableMissCases = [];
  for (const id of ids) {
    const caughtCount = reps.filter((R) => { const x = R.find((r) => r.testcaseId === id); return x && x.outcome === 'caught'; }).length;
    const present = reps.filter((R) => R.some((r) => r.testcaseId === id)).length;
    if (present < K) continue; // only cases in every replicate
    const exp = meta[id].exp, sc = meta[id].sc, tag = id.slice(0, 8) + '(' + sc + ')';
    const allSame = caughtCount === 0 || caughtCount === K;
    if (!allSame) { noisy++; noisyCases.push(tag + `[${caughtCount}/${K}]`); continue; }
    const caught = caughtCount === K;
    if (exp === 'failed') { caught ? stableCorrect++ : (stableMiss++, stableMissCases.push(tag)); }
    else { caught ? (stableFP++, stableFPcases.push(tag)) : stableCorrect++; }
  }
  console.log(`\n========== ${label} (K=${K}, ${dir}) ==========`);
  console.log(`  per-run FP:     [${fps.join(', ')}]  mean ${mean(fps).toFixed(2)}  sd ${sd(fps).toFixed(2)}  range ${Math.max(...fps) - Math.min(...fps)}  (denom ${ms[0].specN})`);
  console.log(`  per-run recall: [${recs.join(', ')}]  mean ${mean(recs).toFixed(2)}  sd ${sd(recs).toFixed(2)}  range ${Math.max(...recs) - Math.min(...recs)}  (denom ${ms[0].failN})`);
  console.log(`  per-case stability: stable-correct ${stableCorrect} | stable-FP ${stableFP} | stable-MISS ${stableMiss} | NOISY ${noisy}`);
  console.log(`    stable-FP cases:   ${JSON.stringify(stableFPcases)}`);
  console.log(`    stable-MISS cases: ${JSON.stringify(stableMissCases)}`);
  console.log(`    noisy cases:       ${JSON.stringify(noisyCases)}`);
  return { K, fps, recs, fpMean: mean(fps), fpSd: sd(fps), recMean: mean(recs), recSd: sd(recs), stableCorrect, stableFP, stableMiss, noisy, specN: ms[0].specN, failN: ms[0].failN };
}

// Per-case caught-fraction across replicates: id -> { exp, sc, frac (0..1), K }
function caughtFraction(dir) {
  const reps = loadReps(dir);
  const ids = [...new Set(reps.flatMap((R) => R.map((x) => x.testcaseId)))];
  const out = {};
  for (const id of ids) {
    const present = reps.filter((R) => R.some((r) => r.testcaseId === id));
    if (!present.length) continue;
    const caught = present.filter((R) => { const x = R.find((r) => r.testcaseId === id); return x && x.outcome === 'caught'; }).length;
    const any = present[0].find((r) => r.testcaseId === id);
    out[id] = { exp: any.expected, sc: (any.sc || [])[0], frac: caught / present.length, K: present.length };
  }
  return out;
}
// Robust stable-transition A/B: classify each case stable/noisy in BOTH conditions and report FP fixes / recall losses.
function compareStable(dirA, dirB) {
  const A = caughtFraction(dirA), B = caughtFraction(dirB);
  const cls = (f) => (f === 0 ? 'clean' : f === 1 ? 'caught' : 'noisy');
  const fpFixed = [], fpNew = [], recallLost = [], recallGained = [], noiseShift = [];
  for (const id of Object.keys(A)) {
    if (!B[id]) continue;
    const a = A[id], b = B[id], tag = id.slice(0, 8) + '(' + a.sc + ')';
    const ca = cls(a.frac), cb = cls(b.frac);
    if (a.exp !== 'failed') { // GT-pass: caught = FP
      if (ca === 'caught' && cb !== 'caught') fpFixed.push(tag + ` ${a.frac.toFixed(1)}→${b.frac.toFixed(1)}`);
      if (ca !== 'caught' && cb === 'caught') fpNew.push(tag + ` ${a.frac.toFixed(1)}→${b.frac.toFixed(1)}`);
      if (ca === 'noisy' || cb === 'noisy') if (Math.abs(a.frac - b.frac) >= 0.4) noiseShift.push(tag + ` ${a.frac.toFixed(1)}→${b.frac.toFixed(1)}`);
    } else { // GT-fail: caught = recall TP
      if (ca === 'caught' && cb !== 'caught') recallLost.push(tag + ` ${a.frac.toFixed(1)}→${b.frac.toFixed(1)}`);
      if (ca !== 'caught' && cb === 'caught') recallGained.push(tag + ` ${a.frac.toFixed(1)}→${b.frac.toFixed(1)}`);
    }
  }
  console.log(`\n========== STABLE-TRANSITION A/B: ${path.basename(dirA)} → ${path.basename(dirB)} ==========`);
  console.log(`  FP FIXED (GT-pass no longer stably caught): ${fpFixed.length}  ${JSON.stringify(fpFixed)}`);
  console.log(`  FP NEW   (GT-pass newly caught):            ${fpNew.length}  ${JSON.stringify(fpNew)}`);
  console.log(`  RECALL LOST (GT-fail no longer caught):     ${recallLost.length}  ${JSON.stringify(recallLost)}`);
  console.log(`  RECALL GAINED (GT-fail newly caught):       ${recallGained.length}  ${JSON.stringify(recallGained)}`);
  console.log(`  (FP noise shifts ≥0.4 frac: ${noiseShift.length} ${JSON.stringify(noiseShift)})`);
  console.log(`  → net FP change = NEW − FIXED = ${fpNew.length - fpFixed.length}; net recall change = GAINED − LOST = ${recallGained.length - recallLost.length}`);
  console.log(`  → ASYMMETRY (FP-fixed / recall-lost) = ${recallLost.length ? (fpFixed.length / recallLost.length).toFixed(2) : (fpFixed.length ? '∞' : 'n/a')}  (want ≫1: fixes FPs, keeps recall)`);
}

function main() {
  const dir = arg('dir'); if (!dir) { console.error('usage: --dir=results/<run> [--dir2=...]'); process.exit(1); }
  const a = analyze(dir, arg('label', path.basename(dir)));
  const dir2 = arg('dir2');
  if (dir2) {
    const b = analyze(dir2, path.basename(dir2));
    if (a && b) {
      console.log(`\n========== A/B: ${path.basename(dir)}  vs  ${path.basename(dir2)} ==========`);
      console.log(`  ΔFP (b−a):     ${(b.fpMean - a.fpMean).toFixed(2)}  (a ${a.fpMean.toFixed(2)}±${a.fpSd.toFixed(2)} → b ${b.fpMean.toFixed(2)}±${b.fpSd.toFixed(2)})`);
      console.log(`  Δrecall (b−a): ${(b.recMean - a.recMean).toFixed(2)}  (a ${a.recMean.toFixed(2)}±${a.recSd.toFixed(2)} → b ${b.recMean.toFixed(2)}±${b.recSd.toFixed(2)})`);
      // Welch t on FP means (rough, small-K): report effect vs pooled noise
      const pooledSd = Math.sqrt((a.fpSd ** 2 + b.fpSd ** 2) / 2) || 1e-9;
      console.log(`  FP effect size (ΔFP / pooled-sd): ${((b.fpMean - a.fpMean) / pooledSd).toFixed(2)}  ← |d|≥~1 needed to clear the noise at small K`);
    }
    compareStable(dir, dir2); // the ROBUST per-case stable-transition comparison (noise-insensitive)
  }
}
main();
