#!/usr/bin/env node
'use strict';
/**
 * Inspect a run of run-annotated-suite.js while it is going.
 *
 * Read-only. Reads the run's live status.json (or the fixed /tmp path, i.e.
 * "whatever run wrote last") plus the partial results.json the runner flushes
 * every 10 cases, so it shows real scored progress per stratum, not just a count.
 *
 * Usage:
 *   node eval/act-augmented/_tools/annotated-run-progress.js                 # current run, one shot
 *   node eval/act-augmented/_tools/annotated-run-progress.js --watch         # redraw every 5s
 *   node eval/act-augmented/_tools/annotated-run-progress.js aug-annot-sonnet46
 *   node eval/act-augmented/_tools/annotated-run-progress.js --watch --every 2
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..', '..', '..');
const RESULTS_ROOT = path.join(REPO_ROOT, 'results');
const FIXED_STATUS_PATH = process.env.LLM_EVAL_STATUS_PATH || '/tmp/llm-eval-status.json';

function arg(name, def = null) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) {
    const eq = process.argv.find((a) => a.startsWith(`--${name}=`));
    return eq ? eq.slice(name.length + 3) : def;
  }
  const next = process.argv[i + 1];
  return next && !next.startsWith('--') ? next : true;
}

const WATCH = !!arg('watch', false);
const EVERY = Number(arg('every', 5)) * 1000;
const target = process.argv.slice(2).find((a) => !a.startsWith('--')
  && process.argv[process.argv.indexOf(a) - 1] !== '--every');

function resolveRun() {
  if (target) return path.join(RESULTS_ROOT, target);
  if (fs.existsSync(FIXED_STATUS_PATH)) {
    try {
      const st = JSON.parse(fs.readFileSync(FIXED_STATUS_PATH, 'utf8'));
      if (st.runName) return path.join(RESULTS_ROOT, st.runName);
    } catch { /* fall through */ }
  }
  return null;
}

const pct = (a, b) => (b ? ((a / b) * 100).toFixed(1) + '%' : '—');
const dur = (ms) => {
  const s = Math.round(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}m${String(s % 60).padStart(2, '0')}s`;
};

/** recall / FP / F1 over a set of scored records. */
function metrics(rows) {
  const rec = rows.filter((r) => r.polarity === 'recall');
  const spec = rows.filter((r) => r.polarity === 'specificity');
  const tp = rec.filter((r) => r.outcome === 'caught').length;
  const fn = rec.length - tp;
  const fp = spec.filter((r) => r.falsePositive).length;
  const tn = spec.length - fp;
  const recall = rec.length ? tp / rec.length : null;
  const prec = (tp + fp) ? tp / (tp + fp) : null;
  const f1 = (recall != null && prec != null && recall + prec > 0) ? (2 * recall * prec) / (recall + prec) : null;
  return { n: rows.length, tp, fn, fp, tn, recall, precision: prec, f1, fpRate: spec.length ? fp / spec.length : null,
    errors: rows.filter((r) => r.outcome === 'error').length };
}

function render() {
  const dir = resolveRun();
  if (!dir || !fs.existsSync(dir)) {
    console.log('no run found — start one with:\n  node eval/act-augmented/_tools/run-annotated-suite.js --out aug-annot-sonnet46');
    return false;
  }
  const runName = path.basename(dir);
  let st = null, results = [];
  try { st = JSON.parse(fs.readFileSync(path.join(dir, 'status.json'), 'utf8')); } catch { /* may not exist yet */ }
  try { results = JSON.parse(fs.readFileSync(path.join(dir, 'results.json'), 'utf8')); } catch { /* flushed every 10 */ }

  const lines = [];
  const done = st?.done ?? results.length;
  const total = st?.total ?? 0;
  const bar = total ? '█'.repeat(Math.round((done / total) * 34)).padEnd(34, '·') : '';
  lines.push(`\n  ${runName}   ${st?.phase || '?'}   model=${st?.config?.model || '?'}   include=${st?.config?.include || '?'}`);
  lines.push(`  [${bar}] ${done}/${total} (${pct(done, total)})   elapsed ${dur(st?.elapsedMs || 0)}`);
  if (done && total && st?.elapsedMs) {
    const eta = (st.elapsedMs / done) * (total - done);
    lines.push(`  rate ${(done / (st.elapsedMs / 60000)).toFixed(1)}/min   eta ${dur(eta)}`);
  }
  if (st?.llm) {
    const l = st.llm;
    lines.push(`  llm: ${l.done}/${l.calls} calls, ${l.inFlightNow ?? 0} in flight (peak ${l.peakInFlight})   tokens in ${(l.inputTokens / 1000).toFixed(0)}k out ${(l.outputTokens / 1000).toFixed(0)}k cache-r ${(l.cacheReadTokens / 1000).toFixed(0)}k`);
  }

  if (results.length) {
    const strata = [...new Set(results.map((r) => r.stratum || 'unflagged'))].sort();
    lines.push(`\n  scored so far (partial — runner flushes every 10)`);
    lines.push(`  ${'stratum'.padEnd(18)} ${'n'.padStart(4)} ${'recall'.padStart(14)} ${'FP'.padStart(13)} ${'prec'.padStart(6)} ${'F1'.padStart(6)} ${'err'.padStart(4)}`);
    lines.push('  ' + '-'.repeat(72));
    for (const s of [...strata, 'ALL']) {
      const rows = s === 'ALL' ? results : results.filter((r) => (r.stratum || 'unflagged') === s);
      const m = metrics(rows);
      lines.push(`  ${String(s).padEnd(18)} ${String(m.n).padStart(4)} ${`${m.tp}/${m.tp + m.fn}`.padStart(7)}${pct(m.recall, 1).padStart(7)} ${`${m.fp}/${m.fp + m.tn}`.padStart(6)}${pct(m.fpRate, 1).padStart(7)} ${m.precision != null ? (m.precision * 100).toFixed(0) + '%' : '—'.padStart(4)}`.padEnd(78)
        + `${m.f1 != null ? m.f1.toFixed(3) : '—'} ${String(m.errors).padStart(3)}`);
    }
  }

  if (st?.workers && Object.keys(st.workers).length) {
    lines.push(`\n  workers`);
    for (const [w, x] of Object.entries(st.workers)) {
      lines.push(`    ${w}  #${String(x.idx).padStart(3)}  ${String(x.sc).padEnd(7)} ${String(x.stratum || '').padEnd(16)} ${String(x.phase).padEnd(12)} ${dur(Date.now() - x.startedAt)}`);
    }
  }
  if (st?.recent?.length) {
    lines.push(`\n  recent`);
    for (const r of st.recent.slice(0, 6)) {
      lines.push(`    ${r.outcome === 'caught' ? '✔' : r.outcome === 'error' ? '✖' : '·'} ${String(r.expected).padEnd(12)} ${String(r.stratum).padEnd(16)} ${r.testcaseId}`);
    }
  }
  if (st?.errors?.length) {
    lines.push(`\n  errors (${st.errors.length})`);
    for (const e of st.errors.slice(-3)) lines.push(`    ${e.testcaseId}: ${String(e.error).slice(0, 90)}`);
  }
  console.log(lines.join('\n'));
  return st?.phase === 'done';
}

if (!WATCH) { render(); }
else {
  const tick = () => {
    process.stdout.write('\x1b[2J\x1b[H');
    const finished = render();
    if (finished) { console.log('\n  run complete.'); process.exit(0); }
  };
  tick();
  setInterval(tick, EVERY);
}
