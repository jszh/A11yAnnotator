// 1.4.1 COLOUR PEER GROUP — ANCHOR ELIGIBILITY (residual RCA S10, fix parts i+ii).
//
// WHAT WENT WRONG. `collectColourPeers` buckets peers by tag|role|parentXpath and downstream treats
// members[0] as the group's SUBJECT: build-v3 mints the group obligation on members[0].xpath, and the
// adjudicator threads `__colourPeerGroup` onto the subject whose xpath equals members[0].xpath. On a
// bucketed row whose DOM-first member is the one member carrying NO distinguishing colour (a plain lead
// cell in an otherwise colour-coded set), every group verdict therefore reasoned about a colourless
// element while the coded members sat unjudged — 1.4.1's signature miss shape.
//
// WHAT THIS PINS. (§1) the collector orders members so members[0] CARRIES a distinguishing colour, while
// colour-uniform members remain in the listing for comparison; the payload shape is preserved (additive
// `anchorCarriesColour` only); groups with no uniform baseline keep DOM order; all-uniform sets still
// produce no group at all. (§2) the downstream contract the reorder relies on — anchor == members[0] —
// is pinned at source level so the fix cannot be silently orphaned. (§3) the rubric asks the group-scoped
// question whenever the signal is present.
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
if (!chromeOK) console.log('# Chrome not found — colour-peer anchor browser tests SKIPPED');

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'colourpeer-fx-'));
const writeFx = (name, html) => { fs.writeFileSync(path.join(DIR, name), html); return 'file://' + path.join(DIR, name); };

// (a) A row-bucketed group whose FIRST member is colour-uniform: a plain lead cell (transparent background
// over the shared surface) followed by two cells coded by background. The anchor must move; the uniform
// member must stay listed.
const ROW = writeFx('row.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Stock</title><style>
  body { font:14px/1.4 Arial, sans-serif; }
  td { padding:8px 10px; }
  .low { background: rgb(254, 202, 202); }
  .fine { background: rgb(187, 247, 208); }
</style></head><body>
  <table><tr>
    <td>Warehouse North</td>
    <td class="low">Reorder soon</td>
    <td class="fine">Holding steady</td>
  </tr></table>
</body></html>`);

// Text-colour coding with NO painted backgrounds: the uniform baseline is the strictly modal signature, and
// the single off-modal member must anchor even though it sits last-but-one in DOM order.
const MODAL = writeFx('modal.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Ledger</title><style>
  body { font:14px/1.4 Arial, sans-serif; }
  .board span { display:inline-block; margin-right:12px; }
  .alert { color: rgb(185, 28, 28); }
</style></head><body>
  <div class="board">
    <span>Delivery received</span>
    <span>Delivery received</span>
    <span class="alert">Payment overdue</span>
    <span>Delivery received</span>
  </div>
</body></html>`);

// A 2+2 signature TIE: no member is "the uniform one", so DOM order must stand — this is the shape the
// signal-lane wiring fixture relies on, and reordering it would be an unforced churn of every anchor.
const TIE = writeFx('tie.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Items</title><style>
  body { font:14px/1.4 Arial, sans-serif; }
  .due { color: rgb(176, 0, 32); } .paid { color: rgb(10, 125, 51); }
</style></head><body>
  <nav>
    <a class="due" href="#a">Item one</a>
    <a class="paid" href="#b">Item two</a>
    <a class="due" href="#c">Item three</a>
    <a class="paid" href="#d">Item four</a>
  </nav>
</body></html>`);

// (b) ALL members colour-uniform: the existing no-signal path — no group is emitted at all.
const UNIFORM = writeFx('uniform.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Plain</title><style>
  body { font:14px/1.4 Arial, sans-serif; }
  td { padding:8px 10px; }
</style></head><body>
  <table><tr>
    <td>Warehouse North</td>
    <td>Warehouse South</td>
    <td>Warehouse East</td>
  </tr></table>
</body></html>`);

// MACHINE CONTENTION: one browser for the whole file, launched with retry on WS-endpoint timeouts.
let browser = null;
async function getBrowser() {
  if (browser) return browser;
  let last = null;
  for (let i = 0; i < 3; i++) {
    try {
      browser = await puppeteer.launch({ headless: 'new', executablePath: CHROME, args: BROWSER_ARGS, timeout: 60000 });
      return browser;
    } catch (e) {
      last = e;
      if (!/WebSocket|ws endpoint|Timed out|timeout/i.test(String(e && e.message))) throw e;
    }
  }
  throw last;
}
after(async () => { if (browser) await browser.close(); });

const groupsOn = async (url) => {
  const b = await getBrowser();
  const page = await b.newPage();
  try { await page.goto(url, { waitUntil: 'load' }); return await page.evaluate(collectColourPeers); } finally { await page.close(); }
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// §1 — the collector, in a real browser
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

test('§1a a colour-uniform FIRST member does not anchor — the anchor moves to a colour-carrying member', { skip: !chromeOK }, async () => {
  const groups = await groupsOn(ROW);
  assert.equal(groups.length, 1, `exactly the one row group forms (got ${JSON.stringify(groups.map((g) => g.key))})`);
  const g = groups[0];

  // The anchor is the first CODED cell, not the DOM-first plain cell.
  assert.match(g.members[0].xpath, /td\[2\]$/, `members[0] is a colour-carrying member, got ${g.members[0].xpath}`);
  assert.equal(g.members[0].background, 'rgb(254, 202, 202)', 'and it really carries the coded background');
  assert.equal(g.anchorCarriesColour, true);

  // The uniform member is STILL LISTED (the judge needs the full set), demoted behind the anchor with the
  // rest in original DOM order.
  assert.deepEqual(g.members.map((m) => m.xpath.replace(/^.*tr\[1\]\//, '')), ['td[2]', 'td[1]', 'td[3]'],
    'anchor first, everyone else in DOM order — nobody dropped');
  const plain = g.members.find((m) => m.label === 'Warehouse North');
  assert.ok(plain, 'the colour-uniform lead cell remains in the group listing');
  assert.equal(plain.background, 'rgba(0, 0, 0, 0)', 'and is reported with its own (uniform) colours');
});

test('§1a the payload SHAPE is preserved — additive field only', { skip: !chromeOK }, async () => {
  const groups = await groupsOn(ROW);
  const g = groups[0];
  assert.deepEqual(Object.keys(g).sort(), ['anchorCarriesColour', 'distinctColours', 'key', 'members'],
    'group keys: the pre-existing payload plus ONE additive field');
  for (const m of g.members) {
    assert.deepEqual(Object.keys(m).sort(), ['background', 'color', 'label', 'xpath'], 'member shape unchanged');
  }
  assert.equal(g.distinctColours, 3);
});

test('§1 modal baseline: with no painted backgrounds, the off-modal member anchors', { skip: !chromeOK }, async () => {
  const groups = await groupsOn(MODAL);
  assert.equal(groups.length, 1, `exactly one group (got ${JSON.stringify(groups.map((g) => g.key))})`);
  const g = groups[0];
  assert.match(g.members[0].xpath, /span\[3\]$/, `the single differently-coloured member anchors, got ${g.members[0].xpath}`);
  assert.equal(g.members[0].color, 'rgb(185, 28, 28)');
  assert.equal(g.members.length, 4, 'the three modal members stay listed');
  assert.equal(g.anchorCarriesColour, true);
});

test('§1 signature TIE: no uniform baseline exists, so DOM order stands', { skip: !chromeOK }, async () => {
  const groups = await groupsOn(TIE);
  assert.equal(groups.length, 1, `exactly one group (got ${JSON.stringify(groups.map((g) => g.key))})`);
  const g = groups[0];
  assert.deepEqual(g.members.map((m) => m.xpath.replace(/^.*nav\[1\]\//, '')), ['a[1]', 'a[2]', 'a[3]', 'a[4]'],
    'every member carries a distinguishing colour equally — the original anchor is kept');
  assert.equal(g.anchorCarriesColour, true);
});

test('§1b ALL members colour-uniform ⇒ no group at all (the existing no-signal path, unchanged)', { skip: !chromeOK }, async () => {
  const groups = await groupsOn(UNIFORM);
  assert.deepEqual(groups, [], 'a colour-uniform set has nothing for an anchor rule to act on');
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// §2 — the downstream contract the reorder relies on: anchor == members[0].xpath
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

test('§2 build-v3 mints the group obligation on members[0].xpath and the adjudicator threads by it', () => {
  // If either side stops keying on members[0], the collector's anchor ordering silently decides nothing.
  const bv = fs.readFileSync(path.join(__dirname, '..', '..', 'lib', 'build-v3.js'), 'utf8');
  assert.match(bv, /g\.members\[0\] && g\.members\[0\]\.xpath/, 'build-v3 anchors the mint on members[0].xpath');
  const adj = fs.readFileSync(path.join(__dirname, '..', '..', 'lib', 'llm-adjudicator.js'), 'utf8');
  assert.match(adj, /members\[0\]\.xpath === baseEl\.xpath/, 'the adjudicator threads the group onto the members[0] subject');
  // ...and the collector's serialized body stays self-contained (it runs under page.evaluate).
  const src = collectColourPeers.toString();
  assert.ok(!/\brequire\s*\(/.test(src) && !/\bprocess\./.test(src) && !/\bmodule\b/.test(src),
    'collectColourPeers must remain self-contained for page.evaluate');
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// §3 — the rubric asks the group-scoped question when the signal is present
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

test('§3 use-of-color-v0 scopes the judgment to the SET and demotes the subject to "anchor"', () => {
  const text = fs.readFileSync(path.join(__dirname, '..', '..', 'llm-rubrics', 'use-of-color-v0.md'), 'utf8');
  assert.match(text, /THE GROUP IS THE\s+QUESTION/, 'the group question is explicitly group-scoped');
  assert.match(text, /merely the group's ANCHOR/, 'the subject element is named as only the anchor');
  assert.match(text, /clears that MEMBER, never the group/, 'a plain-text anchor cannot clear the set');
});
