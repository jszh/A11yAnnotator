'use strict';
// C4 validation harness: run the 1.4.11 non-text-contrast runner over the independently-generated adversarial
// corpus (eval/capability-tests/1.4.11/<aspect>/labels.json) and score against the manifest.
// `runnerShould:"decide"` rows: the verdict (pass/fail mapped from expected passed/failed) must match.
// `runnerShould:"abstain"` rows: the runner MUST abstain (non-flat / can't reduce). Exemption rows: must exempt.
const fs = require('fs'); const path = require('path');
const puppeteer = require('puppeteer');
const { runNonTextContrast } = require('../../../scripts/v3/lib/nontext-contrast-runner.js');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT = path.resolve(__dirname, '..', '1.4.11');

(async () => {
  const aspects = fs.existsSync(ROOT) ? fs.readdirSync(ROOT).filter((d) => fs.statSync(path.join(ROOT, d)).isDirectory()) : [];
  if (!aspects.length) { console.log('no 1.4.11 corpus yet at', ROOT); process.exit(0); }
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const tally = {}; const mismatches = [];
  for (const aspect of aspects.sort()) {
    const mf = path.join(ROOT, aspect, 'labels.json');
    if (!fs.existsSync(mf)) continue;
    let rows; try { rows = JSON.parse(fs.readFileSync(mf, 'utf8')); } catch (e) { console.log('bad manifest', aspect); continue; }
    rows = Array.isArray(rows) ? rows : (rows.cases || rows.rows || []);
    tally[aspect] = { n: 0, correct: 0, decidedN: 0, passN: 0, passOK: 0, failN: 0, failOK: 0, abstainN: 0, abstainOK: 0, falseClear: 0, falseBarrier: 0, falseExempt: 0 };
    const t = tally[aspect];
    for (const row of rows) {
      const file = path.isAbsolute(row.file) ? row.file : path.join(ROOT, aspect, path.basename(row.file));
      if (!fs.existsSync(file)) { mismatches.push({ aspect, file: row.file, why: 'file-missing' }); continue; }
      t.n++;
      await page.goto('file://' + file, { waitUntil: 'load' }).catch(() => {});
      const focusState = !!row.dataFocusTarget || (row.aspect && /focus/.test(row.aspect));
      // Subject resolution: manifest selector if given, else discover + tag the component the oracle would pick
      // (a styled widget/control/graphical element) — mirrors the real harness handing the runner an xpath.
      let sel = row.dataFocusTarget || row.selector || row.target;
      if (!sel) {
        const tagged = await page.evaluate(() => {
          const order = ['[data-test-target]', '.btn', '.button', '.toggle', '.switch', '.chip', '.cta', '.control', '.field', '.input', '.indicator', '.dot', '.badge', '.pill', '.icon-btn', '.tab', 'button', '[role=button]', '[role=switch]', '[role=checkbox]', '[role=tab]', '[role=slider]', '[role=radio]', 'input:not([type=hidden])', 'select', 'textarea', 'a[href]', 'svg'];
          for (const s of order) { const els = [...document.querySelectorAll('body ' + s)].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 2 && b.height > 2; }); if (els.length) { els[0].setAttribute('data-test-target', '1'); return true; } }
          return false;
        }).catch(() => false);
        sel = tagged ? '[data-test-target="1"]' : 'body';
      }
      const r = await runNonTextContrast(page, { selector: String(sel).split(',')[0].trim(), focusState }).catch(() => ({}));
      const got = r.exempt ? 'exempt' : r.abstain ? 'abstain' : (r.verdict || 'none');
      const decided = (got === 'pass' || got === 'fail' || got === 'exempt');
      if (decided) t.decidedN++;
      // DANGEROUS errors (a deterministic runner must NOT make these): false clear / false barrier / false exempt
      if (got === 'pass' && row.expected === 'failed') { t.falseClear++; mismatches.push({ aspect, file: path.basename(file), kind: 'FALSE-CLEAR', got, ratio: r.ratio, dim: row.dimension }); }
      else if (got === 'exempt' && row.expected === 'failed') { t.falseExempt++; mismatches.push({ aspect, file: path.basename(file), kind: 'FALSE-EXEMPT', got, dim: row.dimension }); }
      else if (got === 'fail' && row.expected === 'passed') { t.falseBarrier++; mismatches.push({ aspect, file: path.basename(file), kind: 'FALSE-BARRIER', got, ratio: r.ratio, dim: row.dimension }); }
      let ok;
      if (row.runnerShould === 'abstain') { t.abstainN++; ok = (got === 'abstain'); if (ok) t.abstainOK++; }
      else if (row.expected === 'passed') { t.passN++; ok = (got === 'pass' || got === 'exempt'); if (ok) t.passOK++; }
      else { t.failN++; ok = (got === 'fail'); if (ok) t.failOK++; }
      if (ok) t.correct++;
    }
  }
  await browser.close();
  console.log('=== C4 non-text-contrast runner vs independent corpus ===');
  console.log('(decision accuracy = correct among DECIDED; abstain = safe coverage-loss; FC/FB/FE = dangerous errors)\n');
  let N = 0, C = 0, dec = 0, FC = 0, FB = 0, FE = 0;
  for (const [a, t] of Object.entries(tally)) {
    N += t.n; C += t.correct; dec += t.decidedN; FC += t.falseClear; FB += t.falseBarrier; FE += t.falseExempt;
    const danger = t.falseClear + t.falseBarrier + t.falseExempt;
    console.log(`  ${a.padEnd(50)} acc ${t.correct}/${t.n}  decided ${t.decidedN}/${t.n}  ${danger ? '⚠ FC' + t.falseClear + ' FB' + t.falseBarrier + ' FE' + t.falseExempt : 'clean'}`);
  }
  console.log(`\nTOTAL: ${C}/${N} correct (${(100 * C / (N || 1)).toFixed(1)}%) · coverage ${dec}/${N} decided · DANGEROUS: ${FC} false-clear, ${FB} false-barrier, ${FE} false-exempt`);
  console.log(`\nDANGEROUS-ERROR cases (${mismatches.length}):`);
  for (const m of mismatches.slice(0, 50)) console.log('  ', JSON.stringify(m));
  fs.writeFileSync(path.join(__dirname, 'nontext-contrast-validation.json'), JSON.stringify({ tally, mismatches }, null, 2));
})().catch((e) => { console.error(e.stack); process.exit(1); });
