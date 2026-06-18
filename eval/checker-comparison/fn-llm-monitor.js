#!/usr/bin/env node
'use strict';
// Live CLI monitor for run-fn-llm.js. Polls results/fn-llm/status.json and redraws a dashboard: progress,
// per-page-worker activity, in-flight LLM judgments, tab allocator usage, token spend, and memory. Read-only;
// run in a second terminal alongside the runner.   Usage:  node fn-llm-monitor.js [path/to/status.json]
const fs = require('fs');
const path = require('path');

const STATUS = process.argv[2] || path.join(__dirname, '..', '..', 'results', 'fn-llm', 'status.json');
const EVERY_MS = 500;

const C = {
  reset: '\x1b[0m', dim: '\x1b[2m', bold: '\x1b[1m',
  green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m', cyan: '\x1b[36m', blue: '\x1b[34m', magenta: '\x1b[35m', gray: '\x1b[90m',
};
const clr = (c, s) => `${C[c] || ''}${s}${C.reset}`;
const fmtN = (n) => { n = Number(n) || 0; if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M'; if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k'; return String(n); };
const fmtMs = (ms) => { ms = Number(ms) || 0; const s = Math.floor(ms / 1000); if (s < 60) return s + 's'; const m = Math.floor(s / 60); return `${m}m${String(s % 60).padStart(2, '0')}s`; };
const bar = (frac, width) => { frac = Math.max(0, Math.min(1, frac || 0)); const f = Math.round(frac * width); return '█'.repeat(f) + '░'.repeat(width - f); };
const shortXp = (xp) => { if (!xp) return '—'; return xp.length > 34 ? '…' + xp.slice(-33) : xp; };
const OUTCOME_C = { caught: 'green', missedAgree: 'yellow', uncertain: 'magenta', noVerdict: 'gray', noObligation: 'gray', error: 'red' };

function render(t) {
  const L = [];
  const now = Date.now();
  const elapsed = t.elapsedMs || (t.startedAt ? now - t.startedAt : 0);
  const cfg = t.config || {};
  const phaseC = t.phase === 'done' ? 'green' : t.phase === 'running' ? 'cyan' : 'yellow';
  L.push(clr('bold', '  FN × LLM evidence lane') + clr('gray', `   model ${cfg.model || '?'} · effort medium · vision ${cfg.vision ? 'on' : 'off'} · tools ${cfg.tools ? 'ON' : 'off'}`));
  L.push(clr('gray', `  phase `) + clr(phaseC, (t.phase || '?')) + clr('gray', `   elapsed ${fmtMs(elapsed)}   pages=${cfg.pageConc} globalLLM=${cfg.globalLlm} maxTabs=${cfg.maxTabs}`));
  L.push('');

  // progress
  const done = t.done || 0, total = t.total || 0;
  const frac = total ? done / total : 0;
  const eta = done && total > done ? (elapsed / done) * (total - done) : 0;
  L.push(`  ${clr('bold', 'progress')}  ${bar(frac, 28)} ${done}/${total} ${clr('gray', `(${(100 * frac).toFixed(0)}%)`)}  ${done && total > done ? clr('gray', 'ETA ' + fmtMs(eta)) : ''}`);
  const ta = t.tally || {};
  L.push(`            ${clr('green', '✓caught ' + (ta.caught || 0))}   ${clr('yellow', 'agree ' + (ta.missedAgree || 0))}   ${clr('magenta', 'uncertain ' + (ta.uncertain || 0))}   ${clr('gray', 'noVerdict ' + (ta.noVerdict || 0))}   ${clr('gray', 'noOblig ' + (ta.noObligation || 0))}   ${clr('red', 'err ' + (ta.error || 0))}`);
  L.push('');

  // tokens + tabs + memory
  const llm = t.llm || {};
  const totalTok = (llm.inputTokens || 0) + (llm.outputTokens || 0) + (llm.cacheReadTokens || 0) + (llm.cacheCreateTokens || 0);
  L.push(`  ${clr('bold', 'LLM')}     calls ${llm.done || 0}/${llm.calls || 0} ${clr('cyan', '(' + (llm.inFlightNow || 0) + ' in flight)')}   tok ${clr('cyan', fmtN(totalTok))} ${clr('gray', `(out ${fmtN(llm.outputTokens)} · in ${fmtN(llm.inputTokens)} · cache ${fmtN((llm.cacheReadTokens || 0) + (llm.cacheCreateTokens || 0))})`)}   ${llm.costUsd ? clr('yellow', '~$' + llm.costUsd.toFixed(2)) : ''}`);
  const tb = t.tabs || {};
  L.push(`  ${clr('bold', 'tabs')}    in-use ${clr('cyan', (tb.inUse || 0) + '/' + (cfg.maxTabs || '?'))}   peak ${tb.peak || 0}   queued ${clr(tb.queued ? 'yellow' : 'gray', tb.queued || 0)}   granted ${tb.granted || 0}   openFail ${tb.openFailures || 0}`);
  const m = t.mem || {};
  const chrome = m.chromeRssMb == null ? clr('gray', 'n/a') : clr(m.chromeRssMb > 6000 ? 'red' : 'cyan', m.chromeRssMb.toFixed(0) + 'MB');
  L.push(`  ${clr('bold', 'mem')}     chrome-tree ${chrome}   node ${(m.nodeRssMb || 0).toFixed(0)}MB   sys ${clr((m.sysPct || 0) > 90 ? 'red' : 'gray', (m.sysUsedMb || 0) + '/' + (m.sysTotalMb || 0) + 'MB ' + (m.sysPct || 0) + '%')}`);
  L.push('');

  // workers (pages in flight)
  L.push(`  ${clr('bold', 'pages in flight')}`);
  const workers = Object.entries(t.workers || {}).sort();
  if (!workers.length) L.push(clr('gray', '    (none)'));
  for (const [wid, w] of workers) {
    const ph = w.phase === 'orchestrate' ? clr('cyan', 'orchestrate') : clr('yellow', (w.phase || '').padEnd(11));
    L.push(`    ${clr('blue', wid.padEnd(4))} [${String((w.idx || 0) + 1).padStart(3)}] ${String(w.ruleId || '').padEnd(8)} ${clr('gray', 'sc ' + (w.sc || '').padEnd(8))} ${ph} ${clr('gray', fmtMs(now - (w.startedAt || now)))}`);
  }
  L.push('');

  // in-flight LLM judgments (elements)
  const infl = Object.values(t.inflight || {}).sort((a, b) => (a.startedAt || 0) - (b.startedAt || 0));
  L.push(`  ${clr('bold', 'judging now')} ${clr('gray', '(' + infl.length + ' subject' + (infl.length === 1 ? '' : 's') + ')')}`);
  if (!infl.length) L.push(clr('gray', '    (idle)'));
  for (const s of infl.slice(0, 8)) {
    L.push(`    ${clr('magenta', String(s.sc || '?').padEnd(7))} ${String(s.skill || '').slice(0, 22).padEnd(22)} ${clr('gray', shortXp(s.xpath))} ${clr('gray', fmtMs(now - (s.startedAt || now)))}`);
  }
  if (infl.length > 8) L.push(clr('gray', `    … +${infl.length - 8} more`));
  L.push('');

  // recent completions
  L.push(`  ${clr('bold', 'recent')}`);
  for (const r of (t.recent || []).slice(0, 6)) {
    L.push(`    ${clr(OUTCOME_C[r.outcome] || 'reset', (r.outcome || '').padEnd(12))} ${String(r.ruleId || '').padEnd(8)} ${clr('gray', 'sc ' + (r.sc || ''))} ${clr('gray', fmtMs(r.ms))}`);
  }
  if (t.phase === 'done') L.push('\n  ' + clr('green', '● run complete'));
  L.push(clr('gray', '\n  (ctrl-c to exit monitor; the run keeps going)'));
  return L.join('\n');
}

function tick() {
  let frame;
  try {
    const t = JSON.parse(fs.readFileSync(STATUS, 'utf8'));
    frame = render(t);
  } catch (e) {
    frame = clr('yellow', `  waiting for ${path.relative(process.cwd(), STATUS)} …`) + clr('gray', '\n  (start the run: node run-fn-llm.js)');
  }
  process.stdout.write('\x1b[2J\x1b[H' + frame + '\n');
}

console.log('\x1b[?25l'); // hide cursor
tick();
const timer = setInterval(tick, EVERY_MS);
process.on('SIGINT', () => { clearInterval(timer); process.stdout.write('\x1b[?25h\n'); process.exit(0); });
