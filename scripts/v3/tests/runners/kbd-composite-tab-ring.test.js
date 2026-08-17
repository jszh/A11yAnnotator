// FIX: composite-input tab-ring wrap bug (collectTabOrder, kbd-graph.js).
//
// <input type="time"> (and date/datetime-local/month/week) is a SEGMENTED composite widget: Tab moves
// between its internal segments (hour → minute → meridiem) while document.activeElement stays the same
// <input>. The ring-walk's plain revisit test (`info.seen ⇒ wrapped`) therefore fired on the SECOND press
// and recorded a ONE-stop ring for a page whose real ring has dozens of stops — a degenerate `__focusOrder`
// artifact every 2.4.3 judgment downstream then trusted. The guard treats a same-element repeat on a
// segmented control as internal traversal (bounded per element), never as a wrap.
//
// Fixtures are INVENTED inline HTML — nothing from any eval corpus.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { collectTabOrder } = require('../../lib/kbd-graph.js');
const { CHROME } = require('../../lib/run-experiments.js');
const puppeteer = require('puppeteer');

const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — kbd-composite-tab-ring SKIPPED');

// MACHINE-CONTENTION LAUNCH: one browser at a time (concurrency:false on every test); on the WS-endpoint
// timeout that heavy parallel Chrome load produces, wait 60s and retry (max 3 attempts).
async function launch() {
  for (let attempt = 1; ; attempt++) {
    try {
      return await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    } catch (e) {
      const msg = String((e && e.message) || e);
      if (attempt < 3 && /WS endpoint URL/i.test(msg)) { await new Promise((r) => setTimeout(r, 60000)); continue; }
      throw e;
    }
  }
}

const FIXTURE = `<!doctype html><html><body><main>
  <a href="#top">Section overview</a>
  <label>Opens at <input type="time" id="t1"></label>
  <label>Closes at <input type="time" id="t2"></label>
  <label>Pause from <input type="time" id="t3"></label>
  <input type="text" id="notes" placeholder="Notes">
  <button id="save">Save schedule</button>
</main></body></html>`;

test('composite time inputs: the ring-walk records the FULL ring, not a one-stop wrap on the second press', { skip: !chromeOK, concurrency: false }, async () => {
  const browser = await launch();
  try {
    const page = await browser.newPage();
    await page.setContent(FIXTURE, { waitUntil: 'load' });
    const tab = await collectTabOrder(page);
    assert.equal(tab.wrapped, true, 'the ring wrapped via genuine cycle detection');
    assert.equal(tab.count, 6, `all 6 tab stops recorded (got ${tab.count}: ${tab.order.map((o) => o.xpath).join(', ')}) — a segmented input must not truncate the ring`);
    const xpaths = tab.order.map((o) => o.xpath);
    // each time input appears EXACTLY once (internal segment presses are consumed, never re-recorded)
    for (const i of [1, 2, 3]) {
      const xp = `/html/body/main[1]/label[${i}]/input[1]`;
      assert.equal(xpaths.filter((x) => x === xp).length, 1, `time input ${i} recorded exactly once`);
    }
    // ...and the stops AFTER the segmented inputs are present — the half the old wrap bug amputated.
    assert.ok(xpaths.includes('/html/body/main[1]/input[1]'), 'the text input after the time inputs is reached');
    assert.ok(xpaths.includes('/html/body/main[1]/button[1]'), 'the button after the time inputs is reached');
  } finally { await browser.close(); }
});

test('non-segmented revisit still wraps immediately (pre-existing behavior preserved)', { skip: !chromeOK, concurrency: false }, async () => {
  const browser = await launch();
  try {
    const page = await browser.newPage();
    await page.setContent('<!doctype html><html><body><a href="#a">Alpha</a><a href="#b">Beta</a><a href="#c">Gamma</a></body></html>', { waitUntil: 'load' });
    const tab = await collectTabOrder(page);
    assert.equal(tab.wrapped, true);
    assert.equal(tab.count, 3, 'a plain link ring is unchanged by the segmented-control guard');
  } finally { await browser.close(); }
});

test('datetime-local with seconds (7 Chrome segments) does not exhaust the cap into a fake wrap', { skip: !chromeOK, concurrency: false }, async () => {
  // Adversarial soundness finding #2: at step="1" Chrome renders SEVEN segments (mm/dd/yyyy hh:mm:ss AM/PM),
  // which exhausted the old cap of 6 and fell through to `wrapped = true` — the same degenerate one-stop
  // artifact the guard exists to prevent. The raised cap traverses all segments; and even a hypothetical
  // control with MORE segments than the cap must read as `exhausted` (incomplete), never `wrapped`.
  const browser = await launch();
  try {
    const page = await browser.newPage();
    await page.setContent('<!doctype html><html><body><main>' +
      '<label>Departure <input type="datetime-local" id="dt" step="1"></label>' +
      '<button id="go">Search routes</button>' +
      '</main></body></html>', { waitUntil: 'load' });
    const tab = await collectTabOrder(page);
    assert.notEqual(tab.count, 1, 'never a one-stop ring on a two-stop page');
    assert.ok(tab.order.some((o) => o.xpath === '/html/body/main[1]/button[1]'),
      `the button after the datetime-local is reached (got: ${tab.order.map((o) => o.xpath).join(', ')})`);
    assert.ok(!(tab.wrapped === true && tab.count === 1), 'cap exhaustion must never masquerade as a completed ring');
  } finally { await browser.close(); }
});
