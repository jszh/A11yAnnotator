// Harness 3.4 Phase 2 — CDP tool logic tests. The tools' RAW functions are pure CDP/DOM measurement, so we
// test them directly against a real puppeteer page (NO SDK, NO model) — asserting the OBJECTIVE return
// matches reality and (soundness rail) never contains a verdict. query_ax_node is read-only;
// observe_state_after_activation runs on a fresh clone.
'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer');
const { CHROME } = require('../lib/run-experiments.js');
const { queryAxNode, observeStateAfterActivation, setStateAndCapture, probeScreenReaderAfterAction, measureGeometryLive, requestHiResCrop, renderWithOverrides, computeContrastRatio, resolvePartColor, resolveDestination } = require('../lib/cdp-tools.js');

const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — cdp-tools e2e SKIPPED');
const FX = 'file://' + path.join(__dirname, '..', '..', '..', 'assets', 'saved', 'fx-v3-cdp-tools.html');
const XP = {
  realh: '/html[1]/body[1]/h2[1]',
  fakeh: '/html[1]/body[1]/p[1]',
  lbl: '/html[1]/body[1]/input[1]',
  lblsrc: '/html[1]/body[1]/span[1]',
  reveal: '/html[1]/body[1]/button[1]',
  focusbtn: '/html[1]/body[1]/button[2]',
  chk: '/html[1]/body[1]/input[2]',
  graytext: '/html[1]/body[1]/span[2]',
  destlink: '/html[1]/body[1]/a[1]',
  extlink: '/html[1]/body[1]/a[2]',
};

// ONE shared browser for the whole file (not one per test) — fewer parallel Chrome instances under the full
// suite, which keeps the timing-sensitive e2e tests across files from starving each other of CPU.
let sharedBrowser = null;
before(async () => { if (chromeOK) sharedBrowser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] }); });
after(async () => { if (sharedBrowser) { try { await sharedBrowser.close(); } catch (e) {} } });
async function withPage(fn) {
  const page = await sharedBrowser.newPage();
  try {
    await page.goto(FX, { waitUntil: 'load' });
    const freshClone = async () => { const p = await sharedBrowser.newPage(); await p.goto(FX, { waitUntil: 'load' }); return p; };
    return await fn(page, freshClone);
  } finally { try { await page.close(); } catch (e) {} }
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

test('probe_screen_reader_after_action: activating the Apply button voices the live-region update (4.1.3)', { skip: !chromeOK, concurrency: false }, async () => {
  await withPage(async (page, freshClone) => {
    const r = await probeScreenReaderAfterAction(page, { triggerXpath: XP.reveal }, { freshClone });
    assert.ok(!r.error, `probe ran: ${r.error || 'ok'}`);
    assert.equal(r.emptyQueue, false, 'the screen reader voiced something after the action');
    assert.ok(r.announcements.some((a) => /Coupon applied/.test(a)), 'the live-region text was announced');
    assert.ok(!('verdict' in r) && !('announced' in r), 'raw announcement queue only — no adequacy verdict');
  });
});

test('measure_geometry_live: read-only box + overflow + two-element overlap; no verdict (1.4.13/1.4.10)', { skip: !chromeOK, concurrency: false }, async () => {
  await withPage(async (page) => {
    const r = await measureGeometryLive(page, { targetXpath: XP.realh, otherXpath: XP.fakeh });
    assert.ok(r.box && Number.isFinite(r.box.w) && r.box.w > 0, 'a measured box is returned');
    assert.equal(typeof r.overflowsHorizontally, 'boolean');
    assert.ok(r.overlap && Number.isFinite(r.overlap.overlapAreaPx), 'two-element overlap is measured (raw px)');
    assert.ok(!('verdict' in r) && !('pass' in r) && !('obscured' in r), 'raw geometry only, never a verdict');
  });
});

test('request_hi_res_crop: re-rasters at N device-scale; device px = css px x scale; full element (1.1.1/1.4.5)', { skip: !chromeOK, concurrency: false }, async () => {
  await withPage(async (page, freshClone) => {
    const r = await requestHiResCrop(page, { targetXpath: XP.focusbtn, scale: 3 }, { freshClone });
    assert.ok(!r.error, `crop ran: ${r.error || 'ok'}`);
    assert.equal(r.scaleUsed, 3);
    assert.ok(typeof r.screenshot === 'string' && r.screenshot.length > 100, 'a PNG crop is returned');
    assert.equal(r.devicePixelSize.w, r.cssPixelSize.w * 3, 'higher device-scale, same layout (not zoom)');
  });
});

test('render_with_overrides: forced-colors + grayscale each return a transformed crop; clone-isolated; no verdict (1.4.1)', { skip: !chromeOK, concurrency: false }, async () => {
  await withPage(async (page, freshClone) => {
    const fc = await renderWithOverrides(page, { transform: 'forced-colors', targetXpath: XP.focusbtn }, { freshClone });
    assert.ok(!fc.error && typeof fc.screenshot === 'string' && fc.screenshot.length > 100, 'forced-colors render returned');
    const gs = await renderWithOverrides(page, { transform: 'grayscale', targetXpath: XP.focusbtn }, { freshClone });
    assert.ok(!gs.error && typeof gs.screenshot === 'string', 'grayscale render returned');
    assert.ok(!('verdict' in fc) && !('contrastRatio' in fc), 'pixels only — no numeric ratio from a transformed image');
  });
});

test('compute_contrast_ratio: WCAG ratio for two flat used-colours (G183); refuses a missing node (1.4.1)', { skip: !chromeOK, concurrency: false }, async () => {
  await withPage(async (page) => {
    const r = await computeContrastRatio(page, { nodeAXpath: XP.graytext, nodeBXpath: XP.realh, threshold: 3 });
    assert.equal(r.source, 'cssom');
    assert.ok(Number.isFinite(r.contrastRatio) && r.contrastRatio > 1, 'a real ratio between #767676 and black');
    assert.equal(typeof r.passes, 'boolean');
    const miss = await computeContrastRatio(page, { nodeAXpath: '/html[1]/body[1]/nope[9]', nodeBXpath: XP.realh });
    assert.ok(miss.error, 'a missing node yields an error, not a fabricated ratio');
  });
});

test('resolve_part_color: returns BOTH the CSS used-colour AND the rendered pixel + a divergence flag (1.4.11)', { skip: !chromeOK, concurrency: false }, async () => {
  await withPage(async (page) => {
    const c = await page.evaluate((xp) => { const el = document.evaluate(xp, document, null, 9, null).singleNodeValue; const r = el.getBoundingClientRect(); return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) }; }, XP.graytext);
    const r = await resolvePartColor(page, { x: c.x, y: c.y });
    assert.ok(!r.error, `ran: ${r.error || 'ok'}`);
    assert.ok(/rgb/.test(r.color), 'the CSS used-colour is returned');
    assert.ok(r.renderedPixelRGBA && Number.isFinite(r.renderedPixelRGBA.r), 'the RENDERED pixel is also returned (the false-clear guard)');
    assert.equal(typeof r.cssVsRenderedDivergence.divergent, 'boolean', 'a divergence flag is always present');
    assert.ok(!('contrastRatio' in r) && !('verdict' in r), 'raw RGBA + flags only — no ratio, no verdict');
  });
});

test('resolve_destination: same-origin link returns a raw fingerprint; cross-origin is refused; no verdict (2.4.4)', { skip: !chromeOK, concurrency: false }, async () => {
  await withPage(async (page) => {
    const r = await resolveDestination(page, { linkXpath: XP.destlink });
    assert.ok(!r.error, `resolved: ${r.error || 'ok'}`);
    assert.ok(/fx-v3-cdp-dest\.html/.test(r.finalUrl), 'followed the same-origin link');
    assert.equal(r.title, 'Pricing details');
    assert.equal(r.h1, 'Pricing details');
    assert.ok(!('equivalent' in r) && !('same' in r) && !('verdict' in r), 'raw fingerprint only — the "same purpose?" call stays with the model');
    const ext = await resolveDestination(page, { linkXpath: XP.extlink });
    assert.equal(ext.refused, 'cross-origin', 'an external (cross-origin) link is refused, not fetched (SSRF guard)');
  });
});
