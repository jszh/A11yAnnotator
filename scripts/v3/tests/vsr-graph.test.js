// Harness 3.0 — VSR navigation integrity / trap detection (scripts/v3/lib/vsr-graph.js). Pure-classifier
// units (no Chrome) plus an end-to-end integrity check on a healthy fixture (forward reaches end,
// backward reaches start, no traps).
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { classifyVsrTraps, vsrNavigationIntegrity } = require('../lib/vsr-graph.js');

// ---- pure classifier ----
test('classify: a forward cursor that never reaches end-of-document is a forward VSR trap', () => {
  const c = classifyVsrTraps({ reachedEnd: false, stoppedEarly: true, stuckXpath: '/html/body/div[1]' }, { ok: true, reachedStart: true });
  assert.equal(c.forwardTrap, true);
  assert.ok(c.traps.some((t) => t.kind === 'vsr-forward-trap' && t.sc === '2.1.2'));
});

test('classify: a backward cursor stuck before the start is a backward VSR trap', () => {
  const c = classifyVsrTraps({ reachedEnd: true }, { ok: true, reachedStart: false, stuckXpath: '/html/body/div[2]' });
  assert.equal(c.backwardTrap, true);
  assert.ok(c.traps.some((t) => t.kind === 'vsr-backward-trap'));
});

test('classify: a reading-order cycle is reported', () => {
  const c = classifyVsrTraps({ reachedEnd: false, wrapped: true }, { ok: true, reachedStart: true });
  assert.equal(c.cycle, true);
  assert.ok(c.traps.some((t) => t.kind === 'vsr-cycle'));
});

test('classify: a healthy forward+backward walk yields no traps', () => {
  const c = classifyVsrTraps({ reachedEnd: true }, { ok: true, reachedStart: true });
  assert.deepEqual(c.traps, []);
});

// ---- end-to-end (Chrome) ----
const { CHROME } = require('../lib/run-experiments.js');
const puppeteer = require('puppeteer');
const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — vsr-graph e2e SKIPPED');
const fxUrl = 'file://' + path.join(__dirname, '..', '..', '..', 'assets', 'saved', 'fx-v3-vsr-semantic.html');

test('vsr-graph e2e: a healthy page has no VSR trap — forward reaches end, backward reaches start', { skip: !chromeOK, concurrency: false }, async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  let res;
  try {
    const page = await browser.newPage();
    await page.goto(fxUrl, { waitUntil: 'load' });
    res = await vsrNavigationIntegrity(page);
  } finally { await browser.close(); }
  assert.equal(res.forward.reachedEnd, true, 'forward cursor reached end-of-document');
  assert.equal(res.backward.ok, true);
  assert.equal(res.backward.reachedStart, true, 'backward cursor retreated to the start');
  assert.equal(res.forwardTrap, false);
  assert.equal(res.backwardTrap, false);
  assert.deepEqual(res.traps, [], 'no VSR traps on a healthy page');
});
