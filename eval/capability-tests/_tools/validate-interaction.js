'use strict';
const fs = require('fs'); const path = require('path');
const puppeteer = require('puppeteer');
const { runStateColor, runDynamicNRV } = require('../../../scripts/v3/lib/interaction-capture.js');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = path.resolve(__dirname, '..');
const GROUPS = ['C1-state-color', 'C1-dynamic-nrv'];

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const tally = {}; const mismatches = [];
  for (const grp of GROUPS) {
    const gDir = path.join(BASE, grp); if (!fs.existsSync(gDir)) continue;
    for (const aspect of fs.readdirSync(gDir).filter((d) => !d.startsWith('_') && fs.statSync(path.join(gDir, d)).isDirectory()).sort()) {
      const mf = path.join(gDir, aspect, 'labels.json'); if (!fs.existsSync(mf)) continue;
      let rows; try { rows = JSON.parse(fs.readFileSync(mf, 'utf8')); } catch (e) { continue; }
      rows = Array.isArray(rows) ? rows : (rows.cases || rows.rows || []);
      const key = grp.replace('C1-', '') + '/' + aspect; const t = tally[key] = { n: 0, correct: 0, decidedN: 0, falseClear: 0, falseBarrier: 0 };
      for (const row of rows) {
        const file = path.isAbsolute(row.file) ? row.file : path.join(gDir, aspect, path.basename(row.file));
        if (!fs.existsSync(file)) continue; t.n++;
        await page.goto('file://' + file, { waitUntil: 'load' }).catch(() => {});
        let r;
        if (grp === 'C1-state-color') r = await runStateColor(page, { targetSelector: row.targetSelector || '#t', state: row.state || 'hover', sc: row.sc || '1.4.3' }).catch(() => ({}));
        else r = await runDynamicNRV(page, { targetSelector: row.targetSelector || '#t', activation: row.activation || 'click' }).catch(() => ({}));
        const got = r.abstain ? 'abstain' : (r.verdict || 'none');
        const decided = (got === 'pass' || got === 'fail'); if (decided) t.decidedN++;
        if (got === 'pass' && row.expected === 'failed') { t.falseClear++; mismatches.push({ key, file: path.basename(file), kind: 'FALSE-CLEAR', dim: row.dimension, reason: r.reason }); }
        else if (got === 'fail' && row.expected === 'passed') { t.falseBarrier++; mismatches.push({ key, file: path.basename(file), kind: 'FALSE-BARRIER', dim: row.dimension, reason: r.reason }); }
        let ok;
        if (row.runnerShould === 'abstain') ok = (got === 'abstain') || (row.expected === 'passed' ? got === 'pass' : got === 'fail');
        else if (row.expected === 'passed') ok = (got === 'pass' || got === 'abstain');
        else ok = (got === 'fail');
        if (ok) t.correct++;
      }
    }
  }
  await browser.close();
  console.log('=== C1 interaction-capture vs independent corpus (FC/FB = dangerous) ===');
  let N = 0, C = 0, FC = 0, FB = 0;
  for (const [k, t] of Object.entries(tally)) { N += t.n; C += t.correct; FC += t.falseClear; FB += t.falseBarrier; console.log(`  ${k.padEnd(46)} acc ${t.correct}/${t.n}  decided ${t.decidedN}/${t.n}  ${t.falseClear + t.falseBarrier ? '⚠ FC' + t.falseClear + ' FB' + t.falseBarrier : 'clean'}`); }
  console.log(`\nTOTAL: ${C}/${N} (${(100 * C / (N || 1)).toFixed(1)}%) · DANGEROUS: ${FC} false-clear, ${FB} false-barrier`);
  console.log(`\nDANGEROUS (${mismatches.length}):`); for (const m of mismatches.slice(0, 40)) console.log('  ', JSON.stringify(m));
  fs.writeFileSync(path.join(__dirname, 'interaction-validation.json'), JSON.stringify({ tally, mismatches }, null, 2));
})().catch((e) => { console.error(e.stack); process.exit(1); });
