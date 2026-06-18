// Harness 3.0 — up-front VSR collection (scripts/v3/lib/vsr-collect.js) against deterministic fixtures
// on real Chrome. Gated on a local Chrome, like experiments.test.js. Verifies: a clean full-page
// reading-order transcript with role/name/state/value parsed; <noscript> raw markup is skipped (the
// ported server.js artifact fix); and the cursor reaches end-of-document (no false VSR trap).
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer');
const { collectVsrTranscript } = require('../lib/vsr-collect.js');
const { CHROME } = require('../lib/run-experiments.js');

const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — v3 VSR-collect suite SKIPPED');
const fx = (name) => 'file://' + path.join(__dirname, '..', '..', '..', 'assets', 'fixtures', name);

async function transcribe(fixture, opts) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage();
    await page.goto(fx(fixture), { waitUntil: 'load' });
    return await collectVsrTranscript(page, opts || {});
  } finally {
    await browser.close();
  }
}
const at = (t, xp) => t.steps.find((s) => s.xpath === xp);

test('vsr-collect: full semantic transcript with role/name/state/value, reaches end, no false trap', { skip: !chromeOK, concurrency: false }, async () => {
  const t = await transcribe('fx-v3-vsr-semantic.html');
  assert.equal(t.ok, true, 'collection ok');
  assert.equal(t.reachedEnd, true, 'cursor reached end-of-document cleanly');
  assert.equal(t.stoppedEarly, false, 'no early stop');
  assert.equal(t.wrapped, false, 'no false cycle (container enter/exit must not collide)');

  // reading order: heading → nav → its two links → button → labeled input → paragraph
  const h = at(t, '/html/body/h1[1]');
  assert.ok(h && h.role === 'heading' && /Weather/.test(h.name), 'heading announced with its name');
  assert.ok(at(t, '/html/body/nav[1]/a[1]'), 'nav link Home present');
  assert.ok(at(t, '/html/body/nav[1]/a[2]'), 'nav link Forecast present');

  const btn = at(t, '/html/body/button[1]');
  assert.ok(btn && btn.role === 'button', 'button role parsed');
  assert.match(btn.states, /expanded/, 'button ARIA state (not expanded) captured');

  const input = at(t, '/html/body/label[1]/input[1]');
  assert.ok(input && input.role === 'textbox', 'textbox role parsed');
  assert.match(input.states, /Boston/, 'textbox value (Boston) captured in the announcement');

  // ordering: the heading must be announced before the button, which is before the input
  const idx = (xp) => t.steps.findIndex((s) => s.xpath === xp);
  assert.ok(idx('/html/body/h1[1]') < idx('/html/body/button[1]'), 'heading before button');
  assert.ok(idx('/html/body/button[1]') < idx('/html/body/label[1]/input[1]'), 'button before input');
});

test('vsr-collect: <noscript> raw markup is skipped (ported artifact fix)', { skip: !chromeOK, concurrency: false }, async () => {
  const t = await transcribe('fx-v3-vsr-noscript.html');
  assert.equal(t.ok, true);
  const leaked = t.steps.some((s) => /x\.png|enable JS|color:red|<img|<style/i.test(s.phrase));
  assert.equal(leaked, false, 'no <noscript> raw markup leaked into the transcript');
  // the real content is still present and in order
  assert.ok(t.steps.some((s) => s.role === 'heading' && /Shop/.test(s.name)), 'heading present');
  assert.ok(t.steps.some((s) => s.xpath === '/html/body/a[1]'), 'the Cart link is still read');
});

test('vsr-collect §5.2.0: CDP axName correction overwrites the mis-voiced name slot, keeps role+states', { skip: !chromeOK, concurrency: false }, async () => {
  const t = await transcribe('fx-v3-adv-unlabeled-select.html');
  assert.equal(t.ok, true);
  assert.equal(t.cdpCorrected, true, 'the CDP name-slot correction ran');
  // the UNLABELED <select> voiced its first option ("Apple") as its name — CDP says it has NO name.
  const sel = t.steps.find((s) => s.role === 'combobox' && /select\[1\]$/.test(s.xpath));
  assert.ok(sel, 'the unlabeled select is in the transcript');
  assert.equal(sel.rawName, 'Apple', 'raw VSR name was the leaked first option');
  assert.equal(sel.axName, '', 'Chrome reports no accessible name');
  assert.equal(sel.name, '', 'corrected name slot is empty — the real "no accessible name" (no optionLeak heuristic needed)');
  assert.match(sel.states, /has popup listbox/, 'role + ARIA states are preserved through the correction');
});

test('vsr-collect §5.2.0: a bare-role node reads its TEXT, but an unlabeled landmark does NOT absorb the subtree', { skip: !chromeOK, concurrency: false }, async () => {
  const t = await transcribe('fx-v3-vsr-semantic.html');
  const p = t.steps.find((s) => s.role === 'paragraph');
  assert.ok(p && /Sunny today/.test(p.name), 'paragraph (nameFrom:contents) falls back to its text');
  const sel = await transcribe('fx-v3-adv-unlabeled-select.html');
  const main = sel.steps.find((s) => s.role === 'main');
  assert.ok(main && main.name === '', 'an unlabeled <main> landmark has NO name (no whole-subtree fold-in)');
});
