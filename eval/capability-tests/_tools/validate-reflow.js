'use strict';
// C6 validation: run the reflow runner over the independent 1.4.10 corpus + score (soundness framing).
const fs = require('fs'); const path = require('path');
const puppeteer = require('puppeteer');
const { runReflow } = require('../../../scripts/v3/lib/reflow-runner.js');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT = path.resolve(__dirname, '..', '1.4.10');

(async () => {
  const aspects = fs.existsSync(ROOT) ? fs.readdirSync(ROOT).filter((d) => d !== '_gen' && fs.statSync(path.join(ROOT, d)).isDirectory()) : [];
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const tally = {}; const mismatches = [];
  for (const aspect of aspects.sort()) {
    const mf = path.join(ROOT, aspect, 'labels.json'); if (!fs.existsSync(mf)) continue;
    let rows; try { rows = JSON.parse(fs.readFileSync(mf, 'utf8')); } catch (e) { continue; }
    rows = Array.isArray(rows) ? rows : (rows.cases || rows.rows || []);
    const t = tally[aspect] = { n: 0, correct: 0, decidedN: 0, falseClear: 0, falseBarrier: 0 };
    for (const row of rows) {
      const file = path.isAbsolute(row.file) ? row.file : path.join(ROOT, aspect, path.basename(row.file));
      if (!fs.existsSync(file)) continue;
      t.n++;
      const r = await runReflow(page, { url: 'file://' + file }).catch(() => ({}));
      const got = r.abstain ? 'abstain' : (r.verdict || 'none');
      const decided = (got === 'pass' || got === 'fail'); if (decided) t.decidedN++;
      if (got === 'pass' && row.expected === 'failed') { t.falseClear++; mismatches.push({ aspect, file: path.basename(file), kind: 'FALSE-CLEAR', dim: row.dimension }); }
      else if (got === 'fail' && row.expected === 'passed') { t.falseBarrier++; mismatches.push({ aspect, file: path.basename(file), kind: 'FALSE-BARRIER', kind2: r.kind, culprit: r.culprit, dim: row.dimension }); }
      let ok;
      // runnerShould:abstain was calibrated to the OLD probe; the more-capable runner may correctly DECIDE — accept either.
      if (row.runnerShould === 'abstain') ok = (got === 'abstain') || (row.expected === 'passed' ? got === 'pass' : got === 'fail');
      else if (row.expected === 'passed') ok = (got === 'pass' || got === 'abstain');
      else ok = (got === 'fail');
      if (ok) t.correct++;
    }
  }
  await browser.close();
  console.log('=== C6 reflow runner vs independent corpus (FC/FB = dangerous) ===');
  let N = 0, C = 0, FC = 0, FB = 0;
  for (const [a, t] of Object.entries(tally)) { N += t.n; C += t.correct; FC += t.falseClear; FB += t.falseBarrier; console.log(`  ${a.padEnd(48)} acc ${t.correct}/${t.n}  decided ${t.decidedN}/${t.n}  ${t.falseClear + t.falseBarrier ? '⚠ FC' + t.falseClear + ' FB' + t.falseBarrier : 'clean'}`); }
  console.log(`\nTOTAL: ${C}/${N} (${(100 * C / (N || 1)).toFixed(1)}%) · DANGEROUS: ${FC} false-clear, ${FB} false-barrier`);
  console.log(`\nDANGEROUS cases (${mismatches.length}):`); for (const m of mismatches.slice(0, 45)) console.log('  ', JSON.stringify(m));
  fs.writeFileSync(path.join(__dirname, 'reflow-validation.json'), JSON.stringify({ tally, mismatches }, null, 2));
})().catch((e) => { console.error(e.stack); process.exit(1); });
