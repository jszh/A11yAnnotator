// Harness 3.1 §5.2.2 — the action→announcement instrument (WCAG 4.1.3 Status Messages). Sound-first:
// drive each safe trigger and flag ONLY a status message that appears without a live region AND without
// focus moving to it. Gated on a local Chrome, like the other instrument suites.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer');
const { detectStatusMessages } = require('../../lib/status-detector.js');
const { runInstruments } = require('../../lib/run-instruments.js');
const { CHROME } = require('../../lib/run-experiments.js');

const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — v3 status-detector suite SKIPPED');
const { assetFileUrl: fx } = require('../../../lib/asset-paths.js');

// launch with a retry: the machine may be running a full suite in parallel, and a saturated box loses
// the DevTools WS endpoint on launch — retry (3x) rather than fail the assertion on contention.
async function launchWithRetry() {
  let lastErr;
  for (let i = 0; i < 3; i++) {
    try { return await puppeteer.launch({ executablePath: CHROME, headless: 'new', timeout: 60000, args: ['--no-sandbox', '--disable-dev-shm-usage'] }); }
    catch (e) { lastErr = e; if (!/WS endpoint|Timed out/i.test(String(e && e.message))) throw e; }
  }
  throw lastErr;
}

async function withPage(fixture, fn) {
  const browser = await launchWithRetry();
  try { const page = await browser.newPage(); await page.goto(fx(fixture), { waitUntil: 'load' }); return await fn(page); }
  finally { await browser.close(); }
}

// inline-HTML twin of withPage, for invented fixtures that need no asset file.
async function withHtml(html, fn) {
  const browser = await launchWithRetry();
  try { const page = await browser.newPage(); await page.setContent(html, { waitUntil: 'load' }); return await fn(page); }
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

// ===================================================================================
// ACCNAME-AWARE DIFF (residual RCA S10, non-textual-status-icon case-05). The detector diffed
// norm(textContent), so a status carried by an accname-only node — <svg role="img" aria-label>
// inserted into a live region — contributed '' and the change was invisible to BOTH channels.
// Inline fixtures invented here; nothing is corpus-derived.
// ===================================================================================
test('4.1.3 accname: an aria-label-only node inserted into a PRE-EXISTING live region is an observed update, not a barrier', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html><body>
    <button id="go" onclick="var s=document.createElementNS('http://www.w3.org/2000/svg','svg');s.setAttribute('role','img');s.setAttribute('aria-label','Payment accepted');document.getElementById('st').appendChild(s)">Pay now</button>
    <div id="st" role="status"></div>
  </body></html>`;
  const r = await withHtml(html, (p) => detectStatusMessages(p, {}));
  assert.equal(r.findings.length, 0, `announced via the live region — never a barrier: ${JSON.stringify(r.findings)}`);
  assert.equal(r.observations.length, 1, 'the change is OBSERVED (it used to be invisible)');
  const o = r.observations[0];
  const upd = o.regionsUpdated.find((u) => /payment accepted/i.test(u.after));
  assert.ok(upd, `the region update carries the accname text — got ${JSON.stringify(o.regionsUpdated)}`);
  assert.ok(o.addedInsideLiveRegion.some((t) => /payment accepted/i.test(t)), `the insertion is credited to the live region — got ${JSON.stringify(o)}`);
});

test('4.1.3 accname: an accname-only status OUTSIDE any live region IS the barrier (the diff now sees it)', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html><body>
    <button id="go" onclick="var s=document.createElementNS('http://www.w3.org/2000/svg','svg');s.setAttribute('role','img');s.setAttribute('aria-label','Upload failed — file too large');document.getElementById('out').appendChild(s)">Upload</button>
    <div id="out"></div>
  </body></html>`;
  const r = await withHtml(html, (p) => detectStatusMessages(p, {}));
  assert.equal(r.findings.length, 1, `the un-announced accname status is flagged — got ${JSON.stringify(r.findings)}`);
  assert.match(r.findings[0].detail, /Upload failed/, 'the barrier carries the accname text');
});

test('4.1.3 accname SOUNDNESS: a PRE-EXISTING aria-label node re-parented into a live region is not "new" (before-snapshot covers accnames)', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html><body>
    <span id="icon" role="img" aria-label="Synced to cloud">&#9729;</span>
    <button id="go" onclick="document.getElementById('st').appendChild(document.getElementById('icon'))">Move icon</button>
    <div id="st" role="status"></div>
  </body></html>`;
  const r = await withHtml(html, (p) => detectStatusMessages(p, {}));
  assert.equal(r.findings.length, 0, `re-parenting pre-existing content is never a barrier: ${JSON.stringify(r.findings)}`);
  for (const o of r.observations) {
    assert.ok(!o.addedInsideLiveRegion.some((t) => /synced to cloud/i.test(t))
      && !o.addedOutsideLiveRegion.some((t) => /synced to cloud/i.test(t)),
    `a relocated accname must not read as newly-added — got ${JSON.stringify(o)}`);
  }
});
