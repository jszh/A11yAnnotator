// Harness 3.0 — regression guards for the adversarially-found weaknesses in the VSR/keyboard instrument
// detectors. Each fixture is a repro the adversarial pass used to break a detector; these pin the fix so
// the soundness-critical FALSE POSITIVES (and the high-value false negatives) cannot silently return.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer');
const { CHROME } = require('../lib/run-experiments.js');
const { collectVsrTranscript } = require('../lib/vsr-collect.js');
const { analyzeTranscript } = require('../lib/vsr-analysis.js');
const { collectTabOrder, tabOrderFindings, detectKeyboardTraps } = require('../lib/kbd-graph.js');
const { vsrNavigationIntegrity } = require('../lib/vsr-graph.js');

const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — adversarial-instruments suite SKIPPED');
const { assetFileUrl: fx } = require('../../lib/asset-paths.js');
async function withPage(fixture, fn) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try { const page = await browser.newPage(); await page.goto(fx(fixture), { waitUntil: 'load' }); return await fn(page); }
  finally { await browser.close(); }
}

test('order: a main+sidebar two-column layout is NOT flagged (reading order or tab order)', { skip: !chromeOK, concurrency: false }, async () => {
  await withPage('fx-v3-adv-twocol.html', async (page) => {
    const r = analyzeTranscript(await collectVsrTranscript(page));
    assert.equal(r.readingOrder.length, 0, 'two-column reading order is valid: ' + JSON.stringify(r.readingOrder.map((f) => f.xpath)));
    const tab = await collectTabOrder(page);
    assert.equal(tabOrderFindings(tab).findings.length, 0, 'two-column tab order is valid');
  });
});

test('order: a row-major CSS card grid is NOT flagged', { skip: !chromeOK, concurrency: false }, async () => {
  await withPage('fx-v3-adv-grid.html', async (page) => {
    const r = analyzeTranscript(await collectVsrTranscript(page));
    assert.equal(r.readingOrder.length, 0, 'row-major grid reads correctly: ' + JSON.stringify(r.readingOrder.map((f) => f.xpath)));
  });
});

test('meaning: an unlabeled <select> is a barrier; a labeled <select> floods no review', { skip: !chromeOK, concurrency: false }, async () => {
  await withPage('fx-v3-adv-unlabeled-select.html', async (page) => {
    const r = analyzeTranscript(await collectVsrTranscript(page));
    assert.ok(r.meaning.some((f) => f.kind === 'no-accessible-name'), 'unlabeled select/combobox flagged as no-name');
  });
});

test('tab-order: positive tabindex no longer truncates the ring walk', { skip: !chromeOK, concurrency: false }, async () => {
  await withPage('fx-v3-adv-positive-tabindex.html', async (page) => {
    const tab = await collectTabOrder(page);
    assert.ok(tab.count >= 5, `the full reordered ring is captured (count=${tab.count}), not truncated to 1`);
  });
});

test('tab-order: a scrolled page with a fixed top nav is NOT flagged', { skip: !chromeOK, concurrency: false }, async () => {
  await withPage('fx-v3-adv-fixed-nav.html', async (page) => {
    const tab = await collectTabOrder(page);
    assert.equal(tabOrderFindings(tab).findings.length, 0, 'fixed/sticky top nav is at the visual top regardless of scroll');
  });
});

test('tab-trap: an APG modal escapable only by a keyboard Close button is NOT confirmed a trap', { skip: !chromeOK, concurrency: false }, async () => {
  await withPage('fx-v3-adv-closebtn-modal.html', async (page) => {
    const res = await detectKeyboardTraps(page);
    assert.equal(res.traps.length, 0, 'a close-button-dismissable modal is not a trap');
  });
});

test('tab-trap: a genuine focus trap in a role-LESS overlay div IS detected', { skip: !chromeOK, concurrency: false }, async () => {
  await withPage('fx-v3-adv-roleless-trap.html', async (page) => {
    const res = await detectKeyboardTraps(page);
    assert.ok(res.traps.length >= 1, 'a class-based (role-less) overlay trap is discovered and confirmed');
  });
});

test('vsr-trap: an empty document is NOT a trap; a deadline timeout is NOT a trap', { skip: !chromeOK, concurrency: false }, async () => {
  // empty body via a data fixture
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage();
    await page.setContent('<!doctype html><html><body></body></html>', { waitUntil: 'load' });
    const empty = await vsrNavigationIntegrity(page);
    assert.equal(empty.forwardTrap, false, 'empty document is not a trap');
    assert.deepEqual(empty.traps, []);
    // a long page forced to time out (small deadline) must report timedOut, not a trap
    let body = '<!doctype html><html><body>';
    for (let i = 0; i < 400; i++) body += `<section><h2>Section ${i}</h2><p>Body text number ${i} that the reader announces.</p></section>`;
    body += '</body></html>';
    await page.setContent(body, { waitUntil: 'load' });
    const timed = await vsrNavigationIntegrity(page, { deadlineMs: 300, maxSteps: 50 });
    assert.equal(timed.forwardTrap, false, 'a deadline/cap timeout is "did not finish", not a 2.1.2 trap');
  } finally { await browser.close(); }
});
