#!/usr/bin/env node
/**
 * Reconstruct USD spend for past Gemini runs from their recorded token counts.
 *
 * Why this is needed: Gemini's API returns token counts but no cost, and until 2026-09-06 nothing in this
 * repo priced them — so every harness Gemini run recorded $0 spend, and the Python baselines priced
 * `gemini-3.5-flash` at Flash-Lite's rates (0.30/2.50 instead of 1.50/9.00), understating those runs ~5x on
 * input. Tokens are the authoritative artifact and they were always recorded, so spend is recoverable.
 *
 * Deliberately calls geminiCostUsd() from the adapter rather than re-implementing the price table. A second
 * implementation is how two scorers drift: it reproduces the easy column and diverges silently on the hard one.
 *
 * All historical runs predate flex, so everything here is priced at the STANDARD tier. `at` is taken from the
 * summary's own timestamp where present, because 3.7-flash rates double on 2027-01-01 and an artifact must keep
 * pricing at the rate in force when it ran.
 *
 * Caveat it reports rather than hides: cached input bills at ~10% of normal input, so a run that used context
 * caching is OVERSTATED when its cache tokens were not recorded separately. Such runs are flagged, not silently
 * adjusted.
 *
 *   node eval/act-augmented/_tools/reconstruct-gemini-costs.js [--json] [--min=0.01]
 */
const fs = require('fs');
const path = require('path');
const { geminiCostUsd } = require('../../../scripts/v3/lib/llm-agent-adapter.js');

const REPO = path.resolve(__dirname, '../../..');
const RESULTS = path.join(REPO, 'results');
const argv = process.argv.slice(2);
const AS_JSON = argv.includes('--json');
const MIN = Number((argv.find((a) => a.startsWith('--min=')) || '--min=0').slice(6));

const rows = [];
for (const run of fs.readdirSync(RESULTS).sort()) {
  const sp = path.join(RESULTS, run, 'summary.json');
  if (!fs.existsSync(sp)) continue;
  let s;
  try { s = JSON.parse(fs.readFileSync(sp, 'utf8')); } catch (e) { continue; }
  // Two summary shapes carry token telemetry and they are NOT interchangeable: the annotated/baseline runners
  // write `llm.*`, while run-fn-llm.js writes `tokens.*` with llm:null. Reading only one silently skipped every
  // ACT harness run — i.e. reported them as having no telemetry rather than as $0, which is the better failure
  // but still a hole. Prefer whichever carries counts.
  const llm = (s.llm && (s.llm.inputTokens || s.llm.outputTokens)) ? s.llm : (s.tokens || s.llm || {});
  const model = s.model || (s.config || {}).model || (s.tokens || {}).model || '';
  if (!/^gemini/.test(model)) continue;
  const inTok = Number(llm.inputTokens || 0);
  const outTok = Number(llm.outputTokens || 0);
  const cacheTok = Number(llm.cacheReadTokens || 0);
  if (!inTok && !outTok) continue;
  // Cached tokens are billed at the cache rate; when a run recorded none but shows an input:output ratio far
  // above what uncached prompting produces, caching was almost certainly in play and unrecorded.
  const ratio = outTok ? inTok / outTok : Infinity;
  const suspectCache = cacheTok === 0 && ratio > 12;
  const at = s.finishedAt || s.startedAt || s.mergedAt || null;
  // geminiCostUsd now subtracts the cached portion itself (promptTokenCount includes it), so pass the
  // full prompt count — subtracting here too would under-charge by removing the cache twice.
  const recon = geminiCostUsd({ model, inputTokens: inTok, outputTokens: outTok, cachedTokens: cacheTok, at });
  const recorded = typeof llm.costUsd === 'number' ? llm.costUsd : null;
  if (recon != null && recon < MIN) continue;
  rows.push({ run, model, inTok, outTok, cacheTok, recorded, reconstructed: recon, suspectCache, ratio });
}

rows.sort((a, b) => (b.reconstructed || 0) - (a.reconstructed || 0));
if (AS_JSON) { console.log(JSON.stringify(rows, null, 1)); process.exit(0); }

const f = (n) => (n == null ? '—' : `$${n.toFixed(2)}`);
console.log(`${'run'.padEnd(50)} ${'model'.padEnd(22)} ${'in'.padStart(12)} ${'out'.padStart(10)} ${'recorded'.padStart(9)} ${'actual'.padStart(9)}  note`);
let sumRec = 0; let sumRecorded = 0; let unknown = 0;
for (const r of rows) {
  if (r.reconstructed == null) { unknown++; continue; }
  sumRec += r.reconstructed;
  sumRecorded += r.recorded || 0;
  const note = [r.suspectCache ? `CACHE? in:out ${r.ratio.toFixed(0)}:1 — likely overstated` : '',
    (r.recorded === 0 || r.recorded == null) && r.reconstructed > 0.01 ? 'was $0' : ''].filter(Boolean).join(' ');
  console.log(`${r.run.slice(0, 50).padEnd(50)} ${r.model.slice(0, 22).padEnd(22)} ${String(r.inTok).padStart(12)} ${String(r.outTok).padStart(10)} ${f(r.recorded).padStart(9)} ${f(r.reconstructed).padStart(9)}  ${note}`);
}
console.log(`\n${rows.length} runs | recorded total ${f(sumRecorded)} | reconstructed total ${f(sumRec)} | unpriced models skipped: ${unknown}`);
console.log('Historical runs are priced at the STANDARD tier (all predate flex). Rows flagged CACHE? used context');
console.log('caching whose cached-token split was not recorded, so their figure is an upper bound.');
