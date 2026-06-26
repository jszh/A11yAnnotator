'use strict';
// Validation harness for the 3.3.2 + 3.3.3 corpus (NOT the runner — this checks the FIXTURES are
// internally consistent: HTML loads, selectors resolve, and for 3.3.3 the invalidValue actually
// triggers a non-empty suggestion on submit). Soundness gate for the test author.
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT = path.resolve(__dirname, '..');
const SCS = ['3.3.2', '3.3.3'];

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const problems = [];
  let nFiles = 0, n333 = 0;
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') pageErrors.push('console: ' + m.text()); });

  for (const sc of SCS) {
    const scDir = path.join(ROOT, sc);
    const aspects = fs.readdirSync(scDir).filter((d) => fs.statSync(path.join(scDir, d)).isDirectory());
    for (const aspect of aspects.sort()) {
      const mf = path.join(scDir, aspect, 'labels.json');
      if (!fs.existsSync(mf)) { problems.push(`${sc}/${aspect}: NO labels.json`); continue; }
      let rows;
      try { rows = JSON.parse(fs.readFileSync(mf, 'utf8')); } catch (e) { problems.push(`${sc}/${aspect}: labels.json parse error ${e.message}`); continue; }
      if (!Array.isArray(rows)) { problems.push(`${sc}/${aspect}: labels.json not an array`); continue; }
      // file/case sequence sanity
      const seen = new Set();
      for (const row of rows) {
        const file = path.join(scDir, aspect, row.file);
        if (!fs.existsSync(file)) { problems.push(`${sc}/${aspect}/${row.file}: HTML missing`); continue; }
        if (seen.has(row.file)) problems.push(`${sc}/${aspect}/${row.file}: duplicate manifest row`);
        seen.add(row.file);
        // required manifest fields
        for (const k of ['expected', 'polarity', 'aspect', 'dimension', 'fieldSelector', 'runnerShould', 'rationale', 'citation']) {
          if (row[k] === undefined || row[k] === '') problems.push(`${sc}/${aspect}/${row.file}: missing field '${k}'`);
        }
        if (!['passed', 'failed'].includes(row.expected)) problems.push(`${sc}/${aspect}/${row.file}: bad expected '${row.expected}'`);
        if ((row.polarity === 'positive') !== (row.expected === 'failed')) problems.push(`${sc}/${aspect}/${row.file}: polarity/expected mismatch`);
        if (sc === '3.3.3') {
          for (const k of ['submitSelector', 'invalidValue']) if (row[k] === undefined) problems.push(`${sc}/${aspect}/${row.file}: 3.3.3 missing '${k}'`);
        }

        nFiles++;
        pageErrors.length = 0;
        await page.goto('file://' + file, { waitUntil: 'load' });
        if (pageErrors.length) problems.push(`${sc}/${aspect}/${row.file}: page/script error: ${pageErrors[0]}`);

        // fieldSelector must resolve to >=1 element
        const fieldN = await page.$$eval(row.fieldSelector, (els) => els.length).catch(() => -1);
        if (fieldN < 1) problems.push(`${sc}/${aspect}/${row.file}: fieldSelector '${row.fieldSelector}' resolves to ${fieldN}`);

        if (sc === '3.3.3') {
          n333++;
          // submitSelector resolves
          const subN = await page.$$eval(row.submitSelector, (els) => els.length).catch(() => -1);
          if (subN < 1) { problems.push(`${sc}/${aspect}/${row.file}: submitSelector '${row.submitSelector}' resolves to ${subN}`); continue; }
          // type invalidValue into the (first) field, submit, capture #err text
          const res = await page.evaluate((fSel, sSel, val) => {
            const fld = document.querySelector(fSel);
            if (fld) { fld.value = val; }
            const err = document.getElementById('err') || document.querySelector('.err, [role=alert]');
            document.querySelector(sSel).click();
            const e2 = document.getElementById('err') || document.querySelector('.err, [role=alert]');
            const txt = e2 ? (e2.textContent || '').trim() : '';
            const hidden = e2 ? (e2.hidden || getComputedStyle(e2).display === 'none') : true;
            return { txt, hidden, hasEl: !!e2 };
          }, row.fieldSelector, row.submitSelector, String(row.invalidValue));
          if (!res.hasEl) problems.push(`${sc}/${aspect}/${row.file}: no error element found after submit`);
          else if (res.hidden) problems.push(`${sc}/${aspect}/${row.file}: error stayed HIDDEN after submitting invalidValue '${row.invalidValue}' — validator did not fire (value may be valid)`);
          else if (!res.txt) problems.push(`${sc}/${aspect}/${row.file}: error shown but EMPTY text`);
        }
      }
      // count check
      const pos = rows.filter((r) => r.polarity === 'positive').length;
      const neg = rows.filter((r) => r.polarity === 'negative').length;
      if (pos < 10) problems.push(`${sc}/${aspect}: only ${pos} positives (<10)`);
      if (neg < 10) problems.push(`${sc}/${aspect}: only ${neg} negatives (<10)`);
    }
  }
  await browser.close();
  console.log(`Checked ${nFiles} HTML files (${n333} 3.3.3 submit-driven).`);
  if (problems.length === 0) { console.log('ALL CLEAN — selectors resolve, 3.3.3 invalidValue triggers a non-empty suggestion, manifests consistent.'); }
  else { console.log(`\n${problems.length} PROBLEM(S):`); for (const p of problems) console.log('  -', p); process.exitCode = 1; }
})().catch((e) => { console.error(e.stack); process.exit(1); });
