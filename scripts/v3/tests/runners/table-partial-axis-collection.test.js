// #4 fix regression guard (collect-tables.js): firstColPartialTh must EXCLUDE row 0 from its "some but not all
// rows have <th> at column 0" check. The first attempt at this fix (checking ALL rows including row 0) was caught
// by a full-corpus scan of the 458-case ACT reaches-llm set: it spuriously flagged 8 ordinary, correctly-coded
// single-header-row tables (e.g. a real ACT-corpus GT-pass table — <thead><th>Projects</th><th>Exams</th></thead>
// <tbody><td colspan="2">15%</td></tbody> — the lone body row's colspan cell isn't <th>, which trivially makes
// "some but not all rows have th@col0" true for ANY such table). This pins BOTH the false-trigger fix AND that a
// genuinely inconsistent row-header pattern (some body rows carry a row-label <th>, others don't) still fires.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const chromeOK = fs.existsSync(CHROME);

const { collectTables } = require('../../lib/collect-tables.js');

async function collect(html) {
  const puppeteer = require('puppeteer');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'table-partial-'));
  fs.writeFileSync(path.join(tmp, 'index.html'), html);
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage();
    await page.goto('file://' + path.join(tmp, 'index.html'), { waitUntil: 'load' });
    return await page.evaluate(collectTables);
  } finally {
    await browser.close();
  }
}

test('collectTables #4 REGRESSION GUARD: a single-header-row table with a colspan data row does NOT spuriously flag firstColPartialTh', { skip: !chromeOK, concurrency: false }, async () => {
  // the exact real ACT-corpus shape (d0f69e, GT-pass) that the first version of this fix broke.
  const tables = await collect(`<!doctype html><html><body>
    <table><thead><tr><th>Projects</th><th>Exams</th></tr></thead>
    <tbody><tr><td colspan="2">15%</td></tr></tbody></table>
  </body></html>`);
  assert.equal(tables.length, 1);
  assert.equal(tables[0].firstRowAllTh, true);
  assert.equal(tables[0].firstColPartialTh, false, 'row 0 (the header row) must be excluded from the column-0 partial check');
});

test('collectTables #4 REGRESSION GUARD: a "Time"/"05:41" single-column, single-header-row table does not flag firstColPartialTh', { skip: !chromeOK, concurrency: false }, async () => {
  const tables = await collect(`<!doctype html><html><body>
    <table><tr><th>Time</th></tr><tr><td>05:41</td></tr></table>
  </body></html>`);
  assert.equal(tables[0].firstRowAllTh, true);
  assert.equal(tables[0].firstColPartialTh, false);
});

test('collectTables #4: a genuinely inconsistent row-header column (some body rows have a row-label <th>, others don\'t) still flags firstColPartialTh', { skip: !chromeOK, concurrency: false }, async () => {
  const tables = await collect(`<!doctype html><html><body>
    <table>
      <tr><th>Item</th><th>Q1</th><th>Q2</th></tr>
      <tr><th>Widgets</th><td>10</td><td>20</td></tr>
      <tr><td>Gadgets</td><td>15</td><td>25</td></tr>
    </table>
  </body></html>`);
  assert.equal(tables[0].firstRowAllTh, true, 'row 0 is a clean header row');
  assert.equal(tables[0].firstColPartialTh, true, 'body rows disagree on whether they carry a row-label <th> — a real inconsistency');
});

test('collectTables #4: the real DHS Trusted-Tester 511654-19 shape (row 0 mixes a real corner <th> with unmarked column labels) still flags firstRowPartialTh', { skip: !chromeOK, concurrency: false }, async () => {
  const tables = await collect(`<!doctype html><html><body>
    <table>
      <tr><th>Rank</th><td>First</td><td>Second</td><td>Third</td></tr>
      <tr><th>Name</th><td>A</td><td>B</td><td>C</td></tr>
      <tr><th>Year</th><td>D</td><td>E</td><td>F</td></tr>
    </table>
  </body></html>`);
  assert.equal(tables[0].firstColAllTh, true);
  assert.equal(tables[0].firstRowPartialTh, true, 'row 0 mixes a marked corner <th> with unmarked column labels — the real bug shape');
});
