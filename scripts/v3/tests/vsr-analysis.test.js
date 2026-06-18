// Harness 3.0 — VSR transcript analysis (scripts/v3/lib/vsr-analysis.js). Pure-function unit tests over
// synthetic transcripts (no Chrome) PLUS one end-to-end test (collect → analyze) on a real fixture.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { analyzeTranscript, readingOrderFindings, meaningFindings } = require('../lib/vsr-analysis.js');
const { assetFileUrl, assetPath } = require('../../lib/asset-paths.js');

// ---- pure-function units (deterministic, no browser) ----
const step = (o) => ({ index: 0, xpath: '/x', tag: 'a', phrase: '', role: '', name: '', states: '', boundary: null, rect: { x: 0, y: 0, w: 50, h: 20 }, visibleText: '', interactive: false, ...o });

test('meaning: an interactive element announced with NO accessible name is a sound 4.1.2 barrier', () => {
  const t = { steps: [step({ xpath: '/a[1]', role: 'link', name: '', interactive: true, phrase: 'link' })] };
  const f = meaningFindings(t).findings;
  assert.equal(f.length, 1);
  assert.equal(f[0].kind, 'no-accessible-name');
  assert.equal(f[0].sc, '4.1.2');
});

test('meaning: a control whose name matches its visible text is clean; non-interactive empties are ignored', () => {
  const t = { steps: [
    step({ xpath: '/button[1]', role: 'button', name: 'Submit', visibleText: 'Submit' }),
    step({ xpath: '/h1[1]', role: 'heading', name: '', visibleText: 'Title' }), // empty NAME but not interactive ⇒ no finding
  ] };
  assert.equal(meaningFindings(t).findings.length, 0);
});

test('meaning: announced name sharing no word with the visible text is a REVIEW candidate, not a barrier', () => {
  const t = { steps: [step({ xpath: '/button[1]', role: 'button', name: 'Close', visibleText: 'Menu options here' })] };
  const f = meaningFindings(t).findings;
  assert.equal(f.length, 1);
  assert.equal(f[0].review, true);
  assert.equal(f[0].kind, 'name-text-mismatch');
});

test('reading-order: a clean top-to-bottom page yields no findings', () => {
  const steps = [];
  for (let i = 0; i < 8; i++) steps.push(step({ xpath: '/a[' + i + ']', rect: { x: 0, y: i * 30, w: 50, h: 20 } }));
  assert.equal(readingOrderFindings({ steps }).findings.length, 0);
});

test('reading-order: an element read late but positioned visually first is flagged (1.3.2)', () => {
  const steps = [];
  for (let i = 0; i < 8; i++) steps.push(step({ xpath: '/a[' + i + ']', rect: { x: 0, y: 60 + i * 30, w: 50, h: 20 } }));
  steps.push(step({ xpath: '/misplaced', rect: { x: 0, y: 0, w: 50, h: 20 } })); // read last, visually first
  const f = readingOrderFindings({ steps }).findings;
  assert.ok(f.length >= 1, 'flags the visual/reading-order divergence');
  assert.ok(f.some((x) => x.xpath === '/misplaced' && x.sc === '1.3.2'));
});

// ---- end-to-end on a real fixture (Chrome) ----
const { CHROME } = require('../lib/run-experiments.js');
const { collectVsrTranscript } = require('../lib/vsr-collect.js');
const puppeteer = require('puppeteer');
const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — vsr-analysis e2e SKIPPED');
const fxUrl = assetFileUrl('fx-v3-vsr-analysis.html');

test('vsr-analysis e2e: real no-name icon button is a barrier; misplaced link flags reading order', { skip: !chromeOK, concurrency: false }, async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  let res;
  try {
    const page = await browser.newPage();
    await page.goto(fxUrl, { waitUntil: 'load' });
    const t = await collectVsrTranscript(page);
    res = analyzeTranscript(t);
  } finally { await browser.close(); }

  // 4.1.2: the icon-only button (no text, aria-hidden svg) announces no name ⇒ sound barrier.
  assert.ok(res.meaning.some((f) => f.kind === 'no-accessible-name'), 'icon button with no name is flagged');
  // the plain "Submit" button and the labeled section links must NOT be flagged as no-name.
  assert.ok(!res.meaning.some((f) => f.xpath === '/html/body/main[1]/button[1]'), 'the Submit button is clean');
  // 1.3.2: the "Back to top" link is read last but sits visually at the top ⇒ reading-order divergence.
  // (its xpath is positional — the 7th <a> in main — since the collector keys by position, not id.)
  assert.ok(res.readingOrder.some((f) => f.xpath === '/html/body/main[1]/a[7]' && f.sc === '1.3.2'),
    'the misplaced "Back to top" link is flagged for reading order');
  assert.equal(res.stats.reachedEnd, true, 'transcript completed (no VSR trap on this fixture)');
});
