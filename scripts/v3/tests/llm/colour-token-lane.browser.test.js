// TEXT-LESS COLOUR-TOKEN LANE — the IN-BROWSER half of colour-token-lane.test.js: the same conjuncts through
// real computed styles and layout, plus the flag-off byte-discipline guard on a real page. PENDING LEAD GATE:
// this file launches Chrome, so it must not run while a measurement run is in flight — written but
// deliberately not executed by its author; the ordinary suite glob picks it up.
//
// Fixtures are invented and generic — none is derived from any corpus page.
'use strict';

const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const puppeteer = require('puppeteer');

const { collectColourPeers } = require('../../lib/collect-colour-peers.js');
const { BROWSER_ARGS } = require('../../lib/browser-args.js');

const CHROME = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — colour-token-lane browser tests SKIPPED');

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'colourtoken-fx-'));
const writeFx = (name, html) => { fs.writeFileSync(path.join(DIR, name), html); return 'file://' + path.join(DIR, name); };

const BASE_CSS = `
  body { font: 14px/1.4 Arial, sans-serif; }
  table { border-collapse: collapse; } td, th { padding: 6px 10px; }
  .dot { display: inline-block; width: 12px; height: 12px; border-radius: 50%; }
  .up { background: rgb(22, 163, 74); } .slow { background: rgb(217, 119, 6); } .down { background: rgb(220, 38, 38); }
  .legend { margin-top: 12px; }`;

// The signature shape: a service×day matrix whose cells hold ONLY a coloured dot, and a legend where the
// SAME dot class sits next to words. No main-lane group can form here (dots are text-less, cross-parent).
const MATRIX = writeFx('matrix.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Uptime board</title>
<style>${BASE_CSS}</style></head><body>
  <h1>Uptime board</h1>
  <table>
    <tr><th>Service</th><th>Mon</th><th>Tue</th><th>Wed</th></tr>
    <tr><th>Gateway</th><td><span class="dot up"></span></td><td><span class="dot up"></span></td><td><span class="dot slow"></span></td></tr>
    <tr><th>Search</th><td><span class="dot down"></span></td><td><span class="dot up"></span></td><td><span class="dot up"></span></td></tr>
  </table>
  <p class="legend"><span class="dot up"></span> Operational <span class="dot slow"></span> Degraded <span class="dot down"></span> Down</p>
</body></html>`);

// Same matrix, NO legend anywhere: conjunct 4 must kill it.
const NO_LEGEND = writeFx('nolegend.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Uptime board</title>
<style>${BASE_CSS}</style></head><body>
  <table>
    <tr><th>Gateway</th><td><span class="dot up"></span></td><td><span class="dot slow"></span></td></tr>
    <tr><th>Search</th><td><span class="dot down"></span></td><td><span class="dot up"></span></td></tr>
  </table>
</body></html>`);

// Legend ONLY (single parent): conjunct 3 must kill it — a swatch row alone is not the matrix shape.
const LEGEND_ONLY = writeFx('legendonly.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Key</title>
<style>${BASE_CSS}</style></head><body>
  <p class="legend"><span class="dot up"></span> Operational <span class="dot slow"></span> Degraded <span class="dot down"></span> Down</p>
</body></html>`);

let browser = null;
async function getBrowser() {
  if (browser) return browser;
  let last = null;
  for (let i = 0; i < 3; i++) {
    try {
      browser = await puppeteer.launch({ headless: 'new', executablePath: CHROME, args: BROWSER_ARGS, timeout: 60000 });
      return browser;
    } catch (e) { last = e; if (!/WebSocket|ws endpoint|Timed out|timeout/i.test(String(e && e.message))) throw e; }
  }
  throw last;
}
after(async () => { if (browser) await browser.close(); });

const groupsOn = async (url, opts) => {
  const b = await getBrowser();
  const page = await b.newPage();
  try {
    await page.goto(url, { waitUntil: 'load' });
    return opts === undefined ? await page.evaluate(collectColourPeers) : await page.evaluate(collectColourPeers, opts);
  } finally { await page.close(); }
};
const tokenGroups = (groups) => groups.filter((g) => g.tokenLane === true);

test('FLAG OFF (no argument — the production call today): the matrix page produces NO group', { skip: !chromeOK }, async () => {
  assert.deepEqual(await groupsOn(MATRIX), [], 'byte-identical to the pre-lane collector');
});

test('FLAG ON: the matrix + legend forms one token group with legendText, in the existing payload shape', { skip: !chromeOK }, async () => {
  const groups = await groupsOn(MATRIX, { tokenLane: true });
  const tks = tokenGroups(groups);
  assert.equal(tks.length, 1, `exactly one token group (got ${JSON.stringify(groups.map((g) => g.key))})`);
  const g = tks[0];
  assert.match(g.key, /^token\|span\|\.dot$/);
  assert.equal(g.distinctColours, 3);
  assert.match(g.legendText, /Operational/);
  assert.ok(g.members.length >= 3);
  for (const m of g.members) assert.deepEqual(Object.keys(m).sort(), ['background', 'color', 'label', 'xpath']);
  const parents = new Set(g.members.map((m) => m.xpath.replace(/\/span\[\d+\]$/, '')));
  assert.ok(parents.size >= 2, 'the group really is cross-parent');
});

test('conjunct 4 in a real page: the same matrix with NO legend → no group', { skip: !chromeOK }, async () => {
  assert.deepEqual(tokenGroups(await groupsOn(NO_LEGEND, { tokenLane: true })), []);
});

test('conjunct 3 in a real page: the legend alone (one parent) → no group', { skip: !chromeOK }, async () => {
  assert.deepEqual(tokenGroups(await groupsOn(LEGEND_ONLY, { tokenLane: true })), []);
});

test('MAIN-LANE NON-INTERFERENCE: a text-bearing main-lane page is unchanged with the flag ON', { skip: !chromeOK }, async () => {
  const url = writeFx('mainlane.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Ledger</title><style>
    body { font: 14px/1.4 Arial, sans-serif; } .board span { display: inline-block; margin-right: 12px; }
    .alert { color: rgb(185, 28, 28); }
  </style></head><body>
    <div class="board"><span>Delivery received</span><span>Delivery received</span><span class="alert">Payment overdue</span></div>
  </body></html>`);
  const off = await groupsOn(url);
  const on = await groupsOn(url, { tokenLane: true });
  assert.deepEqual(on, off, 'flag ON adds nothing on a page with no token shape — main-lane output is identical');
  assert.equal(off.length, 1, 'and the main-lane group itself still forms');
});
