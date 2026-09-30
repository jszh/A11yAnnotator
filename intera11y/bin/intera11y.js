#!/usr/bin/env node
'use strict';
// InterA11y corpus runner.
//
//   node intera11y/bin/intera11y.js --corpus=act|supplementary|augmented-dev|saved-pages [--sc=2.4.7,2.1.2]
//        [--ids=a,b | --ids-file=f] [--limit=N] [--out=name] [--pages=8] [--browsers=2] [--llm-conc=16]
//
// Writes results/<out>/: pages/<id>.json (full page report), results.json (one row per case in the shape the
// existing scorers read), summary.json, trace.jsonl (every judge batch and tool call), turns.jsonl + turn-images/ (every LLM
// conversation in full, turn by turn), status.json.
// Re-running with the same --out resumes: cases whose page report exists are not re-run.
const fs = require('fs');
const path = require('path');
const { CONFIG } = require('../src/core/config.js');
const { launchBrowser } = require('../src/core/session.js');
const { makePool, Deadline } = require('../src/core/deadline.js');
const { evaluatePage } = require('../src/core/run-page.js');
const { makeGeminiClient } = require('../src/judge/gemini.js');
const { CORPORA } = require('../eval/corpora.js');

const args = Object.fromEntries(process.argv.slice(2).map((a) => { const m = /^--([^=]+)(?:=(.*))?$/.exec(a); return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true]; }));
const corpus = args.corpus || 'augmented-dev';
if (!CORPORA[corpus]) { console.error(`unknown corpus ${corpus}; one of ${Object.keys(CORPORA).join(', ')}`); process.exit(2); }
const OUT = path.join(CONFIG.root, 'results', args.out || `intera11y-${corpus}-${new Date().toISOString().slice(0, 10)}`);
const PAGES_DIR = path.join(OUT, 'pages');
fs.mkdirSync(PAGES_DIR, { recursive: true });
const fileId = (id) => id.replace(/[^a-z0-9_.-]+/gi, '_').slice(0, 180);

let cases = CORPORA[corpus]();
if (args.sc) { const want = new Set(String(args.sc).split(',')); cases = cases.map((c) => ({ ...c, scs: c.scs.filter((s) => want.has(s)) })).filter((c) => c.scs.length); }
if (args.ids || args['ids-file']) {
  // --ids-file: one id per line (saved-page ids contain spaces and commas)
  const ids = new Set(args.ids ? String(args.ids).split(',') : fs.readFileSync(args['ids-file'], 'utf8').split(/\r?\n/).map((x) => x.trim()).filter(Boolean));
  cases = cases.filter((c) => ids.has(c.id));
  const missing = [...ids].filter((x) => !cases.some((c) => c.id === x));
  if (missing.length) { console.error(`ids not in the corpus: ${missing.slice(0, 5).join(' | ')}`); process.exit(1); }
}
if (args.limit) cases = cases.slice(0, Number(args.limit));

const model = args.model || CONFIG.judge.model;
const effort = args.effort || CONFIG.judge.effort;
// an OpenRouter model id is vendor/model (e.g. z-ai/glm-5.3-flash); a bare id is a Gemini model
const client = model.includes('/') ? require('../src/judge/openrouter.js').makeOpenRouterClient({ model, effort }) : makeGeminiClient({ model, effort });
const llmPool = makePool(Number(args['llm-conc'] || CONFIG.judge.concurrency));
const pagePool = makePool(Number(args.pages || 8));
const traceFh = fs.openSync(path.join(OUT, 'trace.jsonl'), 'a');
// the LLM conversations, turn by turn (turns.jsonl); every image in them is written once to turn-images/<hash>.<ext>
// and referenced by that path
const turnsFh = fs.openSync(path.join(OUT, 'turns.jsonl'), 'a');
const IMG_DIR = path.join(OUT, 'turn-images');
fs.mkdirSync(IMG_DIR, { recursive: true });
const externalise = (v, depth = 0) => {
  if (typeof v === 'string' && v.length > 1000 && /^(iVBORw0KGgo|\/9j\/)/.test(v)) {
    const ext = v.startsWith('/9j/') ? 'jpg' : 'png';
    const name = `${require('crypto').createHash('sha1').update(v).digest('hex').slice(0, 20)}.${ext}`;
    const f = path.join(IMG_DIR, name);
    if (!fs.existsSync(f)) fs.writeFileSync(f, Buffer.from(v, 'base64'));
    return `turn-images/${name}`;
  }
  if (!v || typeof v !== 'object' || depth > 12) return v;
  if (Array.isArray(v)) return v.map((x) => externalise(x, depth + 1));
  return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, externalise(x, depth + 1)]));
};
const trace = (ev) => {
  try {
    if (ev.kind === 'turn') fs.writeSync(turnsFh, JSON.stringify(externalise({ t: Date.now(), ...ev })) + '\n');
    else fs.writeSync(traceFh, JSON.stringify({ t: Date.now(), ...ev }) + '\n');
  } catch (e) { /* telemetry never throws */ }
};

// the exact code that ran: a hash over every InterA11y source file and the v3 files it imports
function codeHash() {
  const h = require('crypto').createHash('sha256');
  const own = path.join(__dirname, '..');   // this InterA11y tree, wherever it is checked out
  const walk = (d) => { for (const f of fs.readdirSync(d).sort()) { if (f.startsWith('.')) continue; const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (/\.(js|md)$/.test(f)) h.update(p.slice(own.length) + '\0' + fs.readFileSync(p)); } };
  walk(path.join(own, 'src')); walk(path.join(own, 'rubrics'));
  for (const f of ['settle.js', 'kbd-graph.js', 'cdp-tools.js', 'llm-agent-adapter.js', 'order-check.js']) h.update(f + '\0' + fs.readFileSync(path.join(CONFIG.root, 'scripts', 'v3', 'lib', f)));
  return h.digest('hex').slice(0, 16);
}
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify({ corpus, args, model, effort, codeHash: codeHash(), config: CONFIG, cases: cases.length, startedAt: new Date().toISOString(), node: process.version }, null, 1));

// `field` = 'verdict' (with the screening sweep) or 'verdictWithoutScreen' (rule-based candidates only)
function outcomeOf(report, scs, field = 'verdict') {
  if (!report || report.error) return 'error';
  const vs = scs.map((sc) => report.criteria[sc] && report.criteria[sc][field]);
  if (vs.includes('FAIL')) return 'caught';
  if (vs.includes('INCOMPLETE') || vs.includes(undefined)) return 'uncertain';
  return 'missedAgree';
}

function rowOf(c, report) {
  const outcome = outcomeOf(report, c.scs);
  const polarity = c.expected === 'failed' ? 'recall' : c.expected ? 'specificity' : null;
  return {
    id: c.id, ...c.meta, scs: c.scs, expected: c.expected || null, outcome, polarity,
    falsePositive: polarity === 'specificity' && outcome === 'caught',
    verdicts: report && report.criteria ? Object.fromEntries(c.scs.map((sc) => [sc, report.criteria[sc] ? report.criteria[sc].verdict : null])) : null,
    outcomeWithoutScreen: outcomeOf(report, c.scs, 'verdictWithoutScreen'),
    verdictsWithoutScreen: report && report.criteria ? Object.fromEntries(c.scs.map((sc) => [sc, report.criteria[sc] ? report.criteria[sc].verdictWithoutScreen || null : null])) : null,
    findings: report && report.criteria ? Object.fromEntries(c.scs.map((sc) => [sc, (report.criteria[sc] && report.criteria[sc].findings) || []])) : null,
    costUsd: report && report.criteria ? Object.values(report.criteria).reduce((s, x) => s + (x.costUsd || 0), 0) : 0,
    ms: report ? report.ms : null,
    error: report && report.error ? report.error : null,
  };
}

(async () => {
  const nBrowsers = Math.max(1, Number(args.browsers || 2));
  const browsers = [];
  for (let i = 0; i < nBrowsers; i++) browsers.push(await launchBrowser());
  const rows = [];
  let done = 0, next = 0;
  const status = () => fs.writeFileSync(path.join(OUT, 'status.json'), JSON.stringify({ corpus, total: cases.length, done, costUsd: +client.usage.costUsd.toFixed(4), llmCalls: client.usage.calls, toolCalls: client.usage.toolCalls, updatedAt: new Date().toISOString() }));
  await Promise.all(cases.map((c) => pagePool(async () => {
    const file = path.join(PAGES_DIR, `${fileId(c.id)}.json`);
    let report = null;
    if (fs.existsSync(file)) report = JSON.parse(fs.readFileSync(file, 'utf8'));
    else {
      const browser = browsers[next++ % browsers.length];
      const run = await new Deadline(CONFIG.pageDeadlineMs).run(() => evaluatePage({ browser, url: c.url, scs: c.scs, client, llmPool, trace: (ev) => trace({ id: c.id, ...ev }), targets: c.targets || null }));
      if (run.value) report = run.value;
      else report = { url: c.url, error: run.timedOut ? `page time limit (${CONFIG.pageDeadlineMs / 60000} min) exceeded` : String((run.error && run.error.stack) || run.error).slice(0, 1000), criteria: {} };
      report.case = { id: c.id, scs: c.scs, expected: c.expected || null, meta: c.meta };
      fs.writeFileSync(file, JSON.stringify(report));
    }
    rows.push(rowOf(c, report));
    done++;
    const r = rows[rows.length - 1];
    console.log(`[${done}/${cases.length}] ${c.id} ${c.scs.join(',')} expected=${c.expected || '-'} → ${r.outcome} ${JSON.stringify(r.verdicts)} $${r.costUsd.toFixed(3)} ${Math.round((r.ms || 0) / 1000)}s`);
    status();
  })));
  for (const b of browsers) await b.close().catch(() => {});
  rows.sort((a, b) => a.id.localeCompare(b.id));
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(rows, null, 1));
  const bySc = {};
  for (const r of rows) for (const sc of r.scs) {
    const m = (bySc[sc] = bySc[sc] || { TP: 0, FP: 0, FN: 0, TN: 0, uncertain: 0, error: 0 });
    if (r.outcome === 'error') { m.error++; continue; }
    if (r.outcome === 'uncertain') m.uncertain++;
    if (!r.polarity) continue;
    const flagged = r.verdicts && r.verdicts[sc] === 'FAIL';
    if (r.polarity === 'recall') m[flagged ? 'TP' : 'FN']++; else m[flagged ? 'FP' : 'TN']++;
  }
  const summary = { corpus, model, effort, cases: rows.length, costUsd: +client.usage.costUsd.toFixed(4), usage: client.usage, bySc, finishedAt: new Date().toISOString() };
  fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 1));
  status();
  console.log(JSON.stringify({ bySc, costUsd: summary.costUsd }, null, 1));
})().catch((e) => { console.error(e); process.exit(1); });
