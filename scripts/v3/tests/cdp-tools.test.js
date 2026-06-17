// Harness 3.4 Phase 2 — CDP tool logic tests. The tools' RAW functions are pure CDP/DOM measurement, so we
// test them directly against a real puppeteer page (NO SDK, NO model) — asserting the OBJECTIVE return
// matches reality and (soundness rail) never contains a verdict. query_ax_node is read-only;
// observe_state_after_activation runs on a fresh clone.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer');
const { CHROME } = require('../lib/run-experiments.js');
const { queryAxNode, observeStateAfterActivation, setStateAndCapture } = require('../lib/cdp-tools.js');

const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — cdp-tools e2e SKIPPED');
const FX = 'file://' + path.join(__dirname, '..', '..', '..', 'assets', 'saved', 'fx-v3-cdp-tools.html');
const XP = {
  realh: '/html[1]/body[1]/h2[1]',
  fakeh: '/html[1]/body[1]/p[1]',
  lbl: '/html[1]/body[1]/input[1]',
  reveal: '/html[1]/body[1]/button[1]',
  focusbtn: '/html[1]/body[1]/button[2]',
  chk: '/html[1]/body[1]/input[2]',
};

async function withPage(fn) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage();
    await page.goto(FX, { waitUntil: 'load' });
    const freshClone = async () => { const p = await browser.newPage(); await p.goto(FX, { waitUntil: 'load' }); return p; };
    return await fn(page, freshClone);
  } finally { await browser.close(); }
}

test('query_ax_node: a real <h2> resolves to role heading w/ level; a styled <p> does NOT (1.3.1 F2)', { skip: !chromeOK, concurrency: false }, async () => {
  await withPage(async (page) => {
    const h = await queryAxNode(page, { targetXpath: XP.realh });
    assert.equal(h.resolved, true);
    assert.equal(h.role, 'heading');
    assert.equal(h.headingLevel, 2, 'a real heading reports its level');

    const p = await queryAxNode(page, { targetXpath: XP.fakeh });
    assert.equal(p.role, 'paragraph', 'a big-bold <p> is NOT a heading despite looking like one');
    assert.equal(p.headingLevel, null);
    // soundness rail: objective facts only, no verdict tokens
    assert.ok(!('verdict' in h) && !('pass' in h) && !('barrier' in h));
  });
});

test('query_ax_node: aria-labelledby IDREF resolve status distinguishes a present source from a dangling one (4.1.2 F68)', { skip: !chromeOK, concurrency: false }, async () => {
  await withPage(async (page) => {
    const r = await queryAxNode(page, { targetXpath: XP.lbl });
    assert.ok(Array.isArray(r.labelledby) && r.labelledby.length === 2, 'both referenced ids are reported');
    const src = r.labelledby.find((x) => x.id === 'lblsrc');
    const miss = r.labelledby.find((x) => x.id === 'missing-id');
    assert.equal(src.present, true); assert.equal(src.hasText, true);
    assert.equal(miss.present, false, 'the dangling idref is reported as not present (raw fact, not "broken label")');
  });
});

test('observe_state_after_activation: clicking a button that fills a live region reports the new text in-live (4.1.3 insertion-only)', { skip: !chromeOK, concurrency: false }, async () => {
  await withPage(async (page, freshClone) => {
    const r = await observeStateAfterActivation(page, { targetXpath: XP.reveal }, { freshClone });
    assert.equal(r.urlChanged, false);
    assert.equal(r.navigated, false);
    assert.ok(r.newVisibleTextCount >= 1, 'the revealed text is detected as newly visible');
    assert.ok(r.newlyVisibleNodes.some((n) => /Coupon applied/.test(n.text)), 'the specific revealed text is captured');
    assert.equal(r.anyNewTextInLiveRegion, true, 'it appeared inside a role=status live region');
    assert.ok(!('verdict' in r) && !('announced' in r), 'objective delta only — no 4.1.3 verdict');
  });
});

test('observe_state_after_activation: a fresh clone is used — the live page the model sees is NOT mutated', { skip: !chromeOK, concurrency: false }, async () => {
  await withPage(async (page, freshClone) => {
    await observeStateAfterActivation(page, { targetXpath: XP.reveal }, { freshClone });
    // the ORIGINAL page's status region is still empty (activation happened only on the throwaway clone)
    const statusText = await page.evaluate(() => document.getElementById('status').textContent.trim());
    assert.equal(statusText, '', 'the activation ran on a clone; the frozen page is untouched');
  });
});

test('set_state_and_capture: driving :focus surfaces the focus-only outline as an objective style delta (1.4.11/2.4.7)', { skip: !chromeOK, concurrency: false }, async () => {
  await withPage(async (page, freshClone) => {
    const r = await setStateAndCapture(page, { targetXpath: XP.focusbtn, state: 'focus' }, { freshClone });
    assert.equal(r.stateReached, true, 'the element took focus on the clone');
    assert.ok(r.styleDelta && (r.styleDelta.outlineWidth || r.styleDelta.outlineStyle), 'the :focus outline shows up as a changed outline prop');
    assert.ok(r.screenshots && typeof r.screenshots.before === 'string' && typeof r.screenshots.after === 'string', 'before/after pixels returned (the sound datum)');
    assert.ok(!('contrastRatio' in r) && !('verdict' in r), 'no synthesized contrast number, no verdict');
  });
});

test('set_state_and_capture: state=checked reaches the state; fresh-clone isolation leaves the frozen page unchecked', { skip: !chromeOK, concurrency: false }, async () => {
  await withPage(async (page, freshClone) => {
    const r = await setStateAndCapture(page, { targetXpath: XP.chk, state: 'checked' }, { freshClone });
    assert.equal(r.stateReached, true);
    const origChecked = await page.evaluate(() => document.getElementById('chk').checked);
    assert.equal(origChecked, false, 'the checkbox was checked only on the throwaway clone');
  });
});

test('set_state_and_capture: an unreachable state is reported stateReached:false (never a silent pass)', { skip: !chromeOK, concurrency: false }, async () => {
  await withPage(async (page, freshClone) => {
    // a plain <h2> cannot be "checked" → not reproduced, flagged honestly
    const r = await setStateAndCapture(page, { targetXpath: XP.realh, state: 'checked' }, { freshClone });
    assert.equal(r.stateReached, false);
    assert.ok(/did not reproduce/.test(r.note || ''), 'the unreached state is called out so the model cannot infer a pass');
  });
});
