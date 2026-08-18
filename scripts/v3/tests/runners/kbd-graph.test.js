// Harness 3.0 — keyboard focus-flow graph + tab-order check (scripts/v3/lib/kbd-graph.js). A pure-
// function unit (synthetic order) plus end-to-end tab-order collection on real Chrome fixtures.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { collectTabOrder, tabOrderFindings, detectKeyboardTraps, detectFocusRetentionTraps, detectFocusRejection, focusRejectionProbeOnce, tagFocusables, FOCUSABLE_SEL } = require('../../lib/kbd-graph.js');

// ---- pure unit ----
test('tab-order: a focusable element tabbed last but positioned visually first is flagged (2.4.3)', () => {
  const order = [];
  for (let i = 0; i < 8; i++) order.push({ index: i, xpath: '/a[' + i + ']', rect: { x: 0, y: 60 + i * 30, w: 50, h: 20 } });
  order.push({ index: 8, xpath: '/top', rect: { x: 0, y: 0, w: 50, h: 20 } }); // tab-last, visual-first
  const f = tabOrderFindings({ order }).findings;
  assert.ok(f.some((x) => x.xpath === '/top' && x.sc === '2.4.3'), 'flags the divergent focus order');
});

test('tab-order: a clean top-to-bottom focus order yields no findings', () => {
  const order = [];
  for (let i = 0; i < 8; i++) order.push({ index: i, xpath: '/a[' + i + ']', rect: { x: 0, y: i * 30, w: 50, h: 20 } });
  assert.equal(tabOrderFindings({ order }).findings.length, 0);
});

// ---- end-to-end (Chrome) ----
const { CHROME } = require('../../lib/run-experiments.js');
const puppeteer = require('puppeteer');
const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — kbd-graph e2e SKIPPED');
const { assetFileUrl: fx } = require('../../../lib/asset-paths.js');

async function tabOrder(fixture) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage();
    await page.goto(fx(fixture), { waitUntil: 'load' });
    return await collectTabOrder(page);
  } finally { await browser.close(); }
}

test('kbd-graph e2e: ring-walk collects the focus order and wraps; misplaced link flags 2.4.3', { skip: !chromeOK, concurrency: false }, async () => {
  const tab = await tabOrder('fx-v3-vsr-analysis.html');
  assert.equal(tab.wrapped, true, 'the focus ring wrapped (cycle detected, not a step cap)');
  assert.ok(tab.count >= 8, 'collected the focusable elements');
  const f = tabOrderFindings(tab).findings;
  assert.ok(f.some((x) => x.xpath === '/html/body/main[1]/a[7]' && x.sc === '2.4.3'),
    'the visually-first/tab-last "Back to top" link is flagged for focus order');
});

test('kbd-graph e2e: a clean deep page (DOM order = visual order) yields NO tab-order findings', { skip: !chromeOK, concurrency: false }, async () => {
  const tab = await tabOrder('fx-v3-reach-deep.html');
  assert.equal(tab.wrapped, true);
  assert.ok(tab.count > 60, 'the ring-walk passes the old 60 cap');
  assert.equal(tabOrderFindings(tab).findings.length, 0, 'no false positives on a cleanly-ordered page');
});

test('kbd-graph e2e: a JS focus-trap dialog is confirmed (2.1.2); a well-behaved dialog is cleared', { skip: !chromeOK, concurrency: false }, async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  let res;
  try {
    const page = await browser.newPage();
    await page.goto(fx('fx-v3-kbd-trap.html'), { waitUntil: 'load' });
    res = await detectKeyboardTraps(page);
  } finally { await browser.close(); }
  assert.equal(res.regionCount, 2, 'both dialogs are trap-prone candidates');
  assert.equal(res.traps.length, 1, 'exactly one confirmed trap');
  assert.equal(res.traps[0].regionXpath, '/html/body/div[1]', 'the JS focus-trap dialog is the confirmed trap');
  assert.equal(res.traps[0].sc, '2.1.2');
  // the well-behaved dialog must be a candidate but NOT confirmed (Tab flows out).
  const ok = res.candidates.find((c) => c.regionXpath === '/html/body/div[2]');
  assert.ok(ok && ok.confirmed === false && ok.forwardTrapped === false, 'the well-behaved dialog is cleared');
});

// ---- self-refocus trap (2.1.2) — the LONE-focusable trap the region detector cannot see (ACT 80af7b) ----
async function retentionTraps(fixture) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try { const page = await browser.newPage(); await page.goto(fx(fixture), { waitUntil: 'load' }); return await detectFocusRetentionTraps(page); }
  finally { await browser.close(); }
}

test('self-refocus trap: a lone button that re-grabs its own focus on blur IS confirmed (2.1.2)', { skip: !chromeOK, concurrency: false }, async () => {
  const res = await retentionTraps('fx-v3-self-refocus-trap.html');
  assert.equal(res.traps.length, 1, 'exactly one self-refocus trap');
  assert.equal(res.traps[0].xpath, '/html/body/button[1]', 'the onblur-refocus button is the trap');
  assert.equal(res.traps[0].sc, '2.1.2');
});

test('self-refocus trap CORRECT-GUARD: a normal page + sibling-progression bounce (Passed Ex7) is NOT flagged', { skip: !chromeOK, concurrency: false }, async () => {
  const res = await retentionTraps('fx-v3-self-refocus-ok.html');
  assert.equal(res.traps.length, 0, 'no false positive: nothing refocuses ITSELF (sibling progression goes to a DIFFERENT element)');
  assert.ok(res.focusableCount >= 5, 'the guard page has multiple focusables (the trap requires >=2, so this exercises the real path)');
});

// ---- focus-rejection (2.1.1/2.4.7, F55) — the inverse of a self-refocus trap (coverage #15) ----
async function focusRejection(fixture) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try { const page = await browser.newPage(); await page.goto(fx(fixture), { waitUntil: 'load' }); return await detectFocusRejection(page); }
  finally { await browser.close(); }
}

test('focus-rejection (#15): sync AND async onfocus→blur are flagged; a normal control and a benign redirect are NOT', { skip: !chromeOK, concurrency: false }, async () => {
  const res = await focusRejection('fx-v3-focus-rejection.html');
  const xpaths = res.rejections.map((r) => r.xpath).sort();
  assert.deepEqual(xpaths, ['/html/body/a[1]', '/html/body/input[1]'], 'exactly the sync <a onfocus=blur> and async setTimeout-blur <input> reject focus');
  assert.ok(res.rejections.every((r) => r.sc === '2.1.1'), 'flagged at 2.1.1 (also notes 2.4.7)');
  assert.ok(res.rejections.find((r) => r.xpath === '/html/body/a[1]').inlineHandler === true, 'the inline onfocus handler is noted');
  // negatives: ok-button, the redirect pair (focus lands on another control, not body), and ok-input are NOT flagged.
  assert.ok(!xpaths.includes('/html/body/button[1]') && !xpaths.includes('/html/body/input[2]'), 'a normal button and a benign focus redirect are not false-flagged');
});

// ---- F14 (soundness review round 2) — cross-candidate stale-timer interference in probeOnce ----
// A page-JS timer left running by a PREVIOUS candidate's own async blur handler is not cancelled just
// because the probe moved on to a fresh evaluate() call — it persists in the same document and can fire
// DURING the next candidate's own measurement, stealing its focus and reading as that candidate's own
// rejection. This pins the primitive DIRECTLY (`focusRejectionProbeOnce`, the literal function production
// calls) against a deterministic stand-in for that shape: a "stale" timer, scheduled just before the
// probe starts, that steals focus shortly after — gap=0 reproduces the pre-fix contamination; a real gap
// (as production now always passes) absorbs it harmlessly before the candidate's own focus() call.
test('F14: a stale cross-candidate timer contaminates an ungapped probe; the gap absorbs it before el.focus()', { skip: !chromeOK, concurrency: false }, async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage();
    await page.setContent(`<!doctype html><html><body>
      <button id="stale">Stale (a prior candidate, not probed here)</button>
      <button id="target">Target (an ordinary, non-rejecting control)</button>
    </body></html>`, { waitUntil: 'load' });
    await page.evaluate(tagFocusables, FOCUSABLE_SEL);
    await page.evaluate(() => {
      window.__fojInstalled = true; window.__fojLog = [];
      document.addEventListener('focusout', (e) => {
        const t = e.target; window.__fojLog.push((t && t.getAttribute && t.getAttribute('data-v3-foc')) || '');
      }, true);
    });
    const targetId = await page.evaluate(() => document.getElementById('target').getAttribute('data-v3-foc'));

    // pre-fix shape: gap=0 — the stale timer (firing at 15ms) lands DURING the 40ms measurement window,
    // stealing focus from target after el.focus() already ran.
    await page.evaluate(() => { setTimeout(() => document.getElementById('stale').focus(), 15); });
    const contaminated = await page.evaluate(focusRejectionProbeOnce, targetId, 40, 0);
    assert.equal(contaminated.took, false,
      `an ungapped probe reads the ordinary target as NOT holding focus — stolen by the stale timer: ${JSON.stringify(contaminated)}`);

    // F11-fixed shape: gap=30 — the stale timer (firing at 15ms, during the gap, before el.focus() at
    // ~30ms) has ALREADY fired and resolved by the time the real measurement starts, so it cannot land
    // inside this candidate's window at all.
    await page.evaluate(() => { setTimeout(() => document.getElementById('stale').focus(), 15); });
    const clean = await page.evaluate(focusRejectionProbeOnce, targetId, 40, 30);
    assert.equal(clean.took, true, `the gap absorbs the stale timer before el.focus() — got ${JSON.stringify(clean)}`);
  } finally { await browser.close(); }
});
