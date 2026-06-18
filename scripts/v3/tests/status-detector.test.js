// Harness 3.1 §5.2.2 — the action→announcement instrument (WCAG 4.1.3 Status Messages). Sound-first:
// drive each safe trigger and flag ONLY a status message that appears without a live region AND without
// focus moving to it. Gated on a local Chrome, like the other instrument suites.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer');
const { detectStatusMessages } = require('../lib/status-detector.js');
const { runInstruments } = require('../lib/run-instruments.js');
const { CHROME } = require('../lib/run-experiments.js');

const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — v3 status-detector suite SKIPPED');
const fx = (n) => 'file://' + path.join(__dirname, '..', '..', '..', 'assets', 'fixtures', n);

async function withPage(fixture, fn) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try { const page = await browser.newPage(); await page.goto(fx(fixture), { waitUntil: 'load' }); return await fn(page); }
  finally { await browser.close(); }
}

test('4.1.3: an UN-ANNOUNCED status is flagged; live-region + focus-moved + no-op are NOT (sound)', { skip: !chromeOK, concurrency: false }, async () => {
  const r = await withPage('fx-v3-status-4-1-3.html', (p) => detectStatusMessages(p, {}));
  assert.equal(r.findings.length, 1, `exactly the one true barrier — got ${JSON.stringify(r.findings)}`);
  const f = r.findings[0];
  assert.equal(f.sc, '4.1.3');
  assert.equal(f.kind, 'status-not-announced');
  assert.match(f.xpath, /section\[1\]\/div\[1\]/, 'points at the plain (un-live) message container');
  assert.match(f.detail, /email address is required/);
});

test('4.1.3 detector is WIRED into runInstruments as a status-message finding', { skip: !chromeOK, concurrency: false }, async () => {
  const r = await withPage('fx-v3-status-4-1-3.html', (p) => runInstruments(p, {}));
  const status = r.findings.filter((x) => x.detector === 'status-message');
  assert.ok(status.length >= 1 && status.every((x) => x.sc === '4.1.3'), JSON.stringify(r.findings.map((x) => x.detector)));
});

test('4.1.3 adversarial soundness: aria-hidden / visibility:hidden / re-parent / scripted-nav triggers are NOT false-flagged', { skip: !chromeOK, concurrency: false }, async () => {
  const r = await withPage('fx-v3-status-adv.html', (p) => detectStatusMessages(p, {}));
  // exactly the one TRUE barrier — none of the four FP guards fire.
  assert.equal(r.findings.length, 1, `only the real barrier — got ${JSON.stringify(r.findings)}`);
  assert.match(r.findings[0].detail, /phone number is invalid/, 'the flagged message is the genuine un-announced one');
});
