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
const { CHROME } = require('../../lib/run-experiments.js');
const { queryAxNode, observeStateAfterActivation, setStateAndCapture, probeScreenReaderAfterAction, measureGeometryLive, requestHiResCrop, renderWithOverrides, computeContrastRatio, resolvePartColor, resolveDestination, compareNamedRegions, ocrImageText, ssrfSafeUrl, isPrivateIp, interactAndObserve } = require('../../lib/cdp-tools.js');
const http = require('node:http');
const { assetFileUrl, assetPath } = require('../../../lib/asset-paths.js');

const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — cdp-tools e2e SKIPPED');
const FX = assetFileUrl('fx-v3-cdp-tools.html');
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
  chart: '/html[1]/body[1]/div[2]',
  ariacheck: '/html[1]/body[1]/div[3]',   // role=checkbox, no aria-checked
  injectlive: '/html[1]/body[1]/button[3]', // injects a NEW role=status with its message
  toggle: '/html[1]/body[1]/button[4]',   // reveals a display:none node
  hiddenrow: '/html[1]/body[1]/div[4]',
  chkrole: '/html[1]/body[1]/input[3]',   // native checkbox with redundant role=checkbox
  oklchtext: '/html[1]/body[1]/span[3]',  // wide-gamut oklch() colour
  occtarget: '/html[1]/body[1]/div[5]',   // covered by occcover
  occcover: '/html[1]/body[1]/div[6]',
  translborder: '/html[1]/body[1]/span[4]', // translucent border
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
    // a TEXT input has no "checked" state — the old `'checked' in el` prototype trap falsely reported reached
    const txt = await setStateAndCapture(page, { targetXpath: XP.lbl, state: 'checked' }, { freshClone });
    assert.equal(txt.stateReached, false, 'a text input has no checked state ⇒ not reproduced (no prototype-trap false positive)');
  });
});

test('mutating tools REFUSE when no fresh clone is supplied (never touch the shared page)', { skip: !chromeOK, concurrency: false }, async () => {
  await withPage(async (page) => {
    const r = await observeStateAfterActivation(page, { targetXpath: XP.reveal }, {}); // ctx with no freshClone
    assert.ok(/fresh clone unavailable/.test(r.error || ''), 'refuses rather than mutating the shared page');
    const statusText = await page.evaluate(() => document.getElementById('status').textContent.trim());
    assert.equal(statusText, '', 'the shared page was NOT mutated');
  });
});

test('reapStale is concurrency-safe: spares a clone younger than the threshold, reaps an older one (must-fix regression)', { skip: !chromeOK, concurrency: false }, async () => {
  const { openToolSession } = require('../../lib/orchestrator.js');
  // threshold 500ms (generous vs clone-load latency so it's not flaky under suite load): a "young" in-use clone
  // is NEVER reaped; only a clone explicitly aged past the threshold is.
  const session = await openToolSession(FX, { executablePath: CHROME, reapAgeMs: 500 });
  try {
    const oldClone = await session.freshClone();
    await new Promise((r) => setTimeout(r, 900)); // oldClone is now > 500ms (a leaked tab)
    const youngClone = await session.freshClone(); // freshly created — stands in for a PEER's in-use tab
    const reaped = await session.reapStale();      // default threshold = the 500ms passed above
    assert.equal(reaped, 1, 'exactly the stale clone is reaped');
    assert.equal(oldClone.isClosed(), true, 'the stale (leaked) clone is closed');
    assert.equal(youngClone.isClosed(), false, 'the young (in-use) clone is SPARED — never reap a peer\'s active tab');
    // the production threshold sits above the whole-run abort, so an in-use clone can never age into the reap window.
    assert.equal(await session.reapStale(330000), 0, 'with the production threshold nothing in-flight is reaped');
  } finally { await session.browser.close(); }
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
    assert.ok(typeof r.cssVsRenderedDivergence.sourceProperty === 'string', 'the matched CSS property is surfaced (diff is vs the part colour, not always cs.color)');
    assert.ok(!('contrastRatio' in r) && !('verdict' in r), 'raw RGBA + flags only — no ratio, no verdict');
    // a translucent border: the rendered pixel may best-match an OPAQUE property, but translucentPart must
    // still fire (ANY translucent painting prop ⇒ the flat used-colour is unreliable ⇒ trust the pixel).
    const tbc = await page.evaluate((xp) => { const el = document.evaluate(xp, document, null, 9, null).singleNodeValue; const b = el.getBoundingClientRect(); return { x: Math.round(b.x + 3), y: Math.round(b.y + b.height / 2) }; }, XP.translborder);
    const tb = await resolvePartColor(page, { x: tbc.x, y: tbc.y });
    assert.equal(tb.translucentPart, true, 'a translucent border sets translucentPart even if the pixel best-matches an opaque property');
    assert.equal(tb.usedColourReliable, false, 'translucency ⇒ the CSS used-colour is unreliable; trust the rendered pixel');
    assert.ok(tb.renderedPixelRGBA && Number.isFinite(tb.renderedPixelRGBA.r), 'the rendered pixel is still always returned');
  });
});

test('compute_contrast_ratio: passes is computed on the UNROUNDED ratio (WCAG do-not-round; 2.998 ≠ pass 3:1)', () => {
  const A = require('../../../lib/a11y-eval.js');
  // black vs rgb(89,89,89): true ratio ≈ 2.998 (a real FAIL) — but rounds to 3.00.
  const raw = A.contrastRatioRaw([0, 0, 0], [89, 89, 89]);
  assert.ok(raw < 3, `unrounded ratio is below 3:1 (${raw})`);
  assert.equal(A.contrastRatio([0, 0, 0], [89, 89, 89]), 3, 'the DISPLAY value still rounds to 3.00');
  assert.equal(raw >= 3, false, 'a passes gate on the unrounded ratio correctly FAILS at 2.998');
});

test('query_ax_node: an aria role=checkbox with no aria-checked reports requiredStatesMissing (F68/4e8ab6); a native checkbox does NOT', { skip: !chromeOK, concurrency: false }, async () => {
  await withPage(async (page) => {
    const aria = await queryAxNode(page, { targetXpath: XP.ariacheck });
    assert.deepEqual(aria.requiredStatesMissing, ['checked'], 'explicit role=checkbox without aria-checked ⇒ the required state is missing');
    assert.deepEqual(aria.requiredStatesPresent, [], 'no author state attribute is present');
    const native = await queryAxNode(page, { targetXpath: XP.chk });
    assert.deepEqual(native.requiredStatesMissing, [], 'a NATIVE <input type=checkbox> conveys its state natively ⇒ nothing missing');
    const redundant = await queryAxNode(page, { targetXpath: XP.chkrole });
    assert.deepEqual(redundant.requiredStatesMissing, [], 'a native checkbox with a REDUNDANT role=checkbox still conveys state natively ⇒ not flagged');
  });
});

test('query_ax_node: nameFrom emits only the CONTRIBUTING source, not every candidate slot', { skip: !chromeOK, concurrency: false }, async () => {
  await withPage(async (page) => {
    const r = await queryAxNode(page, { targetXpath: XP.realh }); // a contents-named heading
    assert.ok(r.nameFrom.length <= 1, `at most one contributing source (got ${JSON.stringify(r.nameFrom)})`);
    assert.ok(!r.nameFrom.includes('attribute') || r.nameFrom.length === 1, 'no fabricated extra slots');
  });
});

test('observe_state_after_activation: classifies visibilityCause + honors the 4.1.3 live-region pre-existence rule', { skip: !chromeOK, concurrency: false }, async () => {
  await withPage(async (page, freshClone) => {
    // pre-existing role=status filled by the button ⇒ a clean 4.1.3 announcement
    const pre = await observeStateAfterActivation(page, { targetXpath: XP.reveal }, { freshClone });
    assert.equal(pre.anyNewTextInLiveRegion, true, 'text into a PRE-EXISTING live region counts (4.1.3)');
    // a button that INJECTS a new role=status with its message ⇒ NOT a reliable announcement
    const inj = await observeStateAfterActivation(page, { targetXpath: XP.injectlive }, { freshClone });
    assert.equal(inj.newVisibleTextCount >= 1, true, 'the injected text is seen');
    assert.equal(inj.anyNewTextInLiveRegion, false, 'a region CREATED with its message is NOT a clean 4.1.3 announcement');
    assert.equal(inj.anyNewTextInNewLiveRegion, true, 'but it is surfaced as text-in-a-NEW-live-region (INCONCLUSIVE)');
    assert.ok(inj.newlyVisibleNodes.some((n) => n.visibilityCause === 'inserted'), 'an injected node is classified inserted');
    // a toggled-visible (display:none → block) pre-existing node ⇒ visibilityCause 'display', not 'inserted'
    const tog = await observeStateAfterActivation(page, { targetXpath: XP.toggle }, { freshClone });
    assert.ok(tog.newlyVisibleNodes.some((n) => n.visibilityCause === 'display'), 'an un-hidden (display) node is classified by HOW it became visible');
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
    // cross-origin is DEFAULT-ON behind the SSRF guard. An injected blocking guard ⇒ refused 'cross-origin-unsafe'
    // (the live target is never reached); allowCrossOrigin:false hard-disables ⇒ plain 'cross-origin'. (No network.)
    const blocked = await resolveDestination(page, { linkXpath: XP.extlink }, { ssrfCheck: async () => ({ safe: false, reason: 'test-blocked' }) });
    assert.equal(blocked.refused, 'cross-origin-unsafe', 'an SSRF-unsafe cross-origin target is refused, not fetched');
    assert.equal(blocked.reason, 'test-blocked');
    const disabled = await resolveDestination(page, { linkXpath: XP.extlink }, { allowCrossOrigin: false });
    assert.equal(disabled.refused, 'cross-origin', 'allowCrossOrigin:false hard-disables cross-origin egress');
  });
});

// ───────────── #2 SSRF guard (pure, no browser) — the cross-origin egress gate ─────────────
test('SSRF isPrivateIp: blocks private/loopback/link-local/ULA/CGNAT/metadata, allows public', () => {
  for (const ip of ['10.0.0.1', '172.16.5.5', '192.168.1.1', '127.0.0.1', '0.0.0.0', '169.254.169.254', '100.64.0.1', '224.0.0.1', '::1', 'fc00::1', 'fd12::3', 'fe80::1', '::ffff:10.0.0.1'])
    assert.equal(isPrivateIp(ip), true, `${ip} must be blocked`);
  for (const ip of ['8.8.8.8', '1.1.1.1', '185.199.108.153', '172.32.0.1', '2606:4700::1111'])
    assert.equal(isPrivateIp(ip), false, `${ip} must be allowed`);
  assert.equal(isPrivateIp('not-an-ip'), true, 'a non-IP is fail-closed to unsafe');
});

test('SSRF ssrfSafeUrl: only public-resolving http(s) on 80/443 without creds passes; every A/AAAA checked', async () => {
  const stub = (map) => async (h) => { if (!(h in map)) throw new Error('nxdomain'); return map[h].map((a) => ({ address: a, family: a.includes(':') ? 6 : 4 })); };
  const chk = (s, map) => ssrfSafeUrl(new URL(s), stub(map));
  assert.equal((await chk('https://act-rules.github.io/', { 'act-rules.github.io': ['185.199.108.153'] })).safe, true, 'public host passes');
  assert.equal((await chk('https://internal/', { internal: ['10.1.2.3'] })).reason, 'private-ip', 'private A blocked');
  assert.equal((await chk('http://169.254.169.254/latest/', { '169.254.169.254': ['169.254.169.254'] })).reason, 'private-ip', 'cloud metadata blocked');
  assert.equal((await chk('https://u:p@evil.test/', { 'evil.test': ['8.8.8.8'] })).reason, 'credentials-in-url', 'creds blocked');
  assert.equal((await chk('https://x.test:8080/', { 'x.test': ['8.8.8.8'] })).reason, 'non-standard-port', 'non-80/443 port blocked');
  assert.equal((await chk('http://localhost/', {})).reason, 'local-hostname', 'localhost name blocked pre-DNS');
  assert.equal((await chk('https://rebind.test/', { 'rebind.test': ['8.8.8.8', '127.0.0.1'] })).reason, 'private-ip', 'multi-A with ANY private is blocked (DNS-rebinding safe)');
  assert.equal((await chk('https://nope.invalid/', {})).reason, 'dns-failed', 'unresolvable host blocked');
  assert.equal((await chk('ftp://x.test/', { 'x.test': ['8.8.8.8'] })).reason, 'non-http', 'non-http scheme blocked');
});

test('resolve_destination cross-origin: an SSRF-cleared external link IS resolved (crossOrigin:true fingerprint)', { skip: !chromeOK, concurrency: false }, async () => {
  // two LOCAL origins (different ports ⇒ cross-origin) stand in for an external destination; the injected permissive
  // ssrfCheck lets the path run end-to-end with NO real external egress. Proves the cross-origin fetch + flag.
  const dest = http.createServer((req, res) => { res.setHeader('content-type', 'text/html'); res.end('<!doctype html><title>Pricing</title><h1>Pricing details</h1><main><p>Annual plans.</p></main>'); });
  await new Promise((r) => dest.listen(0, '127.0.0.1', r));
  const destPort = dest.address().port;
  const origin = http.createServer((req, res) => { res.setHeader('content-type', 'text/html'); res.end(`<!doctype html><body><a id="x" href="http://127.0.0.1:${destPort}/pricing">More</a></body>`); });
  await new Promise((r) => origin.listen(0, '127.0.0.1', r));
  const originPort = origin.address().port;
  try {
    const page = await sharedBrowser.newPage();
    try {
      await page.goto(`http://127.0.0.1:${originPort}/`, { waitUntil: 'load' });
      const r = await resolveDestination(page, { linkXpath: '/html[1]/body[1]/a[1]' }, { ssrfCheck: async () => ({ safe: true }) });
      assert.ok(!r.error && !r.refused, `resolved: ${r.error || r.refused || 'ok'}`);
      assert.equal(r.crossOrigin, true, 'flagged crossOrigin:true');
      assert.equal(r.title, 'Pricing');
      assert.equal(r.h1, 'Pricing details');
      assert.ok(!('equivalent' in r) && !('verdict' in r), 'raw fingerprint only — no verdict laundered');
    } finally { await page.close().catch(() => {}); }
  } finally { dest.close(); origin.close(); }
});

test('compare_named_regions: a red vs blue chart half is measured perceptibly distinct (1.1.1 F13); derived only', { skip: !chromeOK, concurrency: false }, async () => {
  await withPage(async (page) => {
    const r = await compareNamedRegions(page, { targetXpath: XP.chart, regions: [
      { name: 'left', x: 0, y: 0, w: 0.4, h: 1 },
      { name: 'right', x: 0.6, y: 0, w: 0.4, h: 1 },
    ] });
    assert.ok(!r.error, `ran: ${r.error || 'ok'}`);
    const left = r.regionColors.find((c) => c.name === 'left'), right = r.regionColors.find((c) => c.name === 'right');
    assert.ok(left.r > left.b && right.b > right.r, 'left sampled red-dominant, right blue-dominant');
    const pair = r.pairs[0];
    assert.ok(pair.deltaE2000 > 11 && pair.perceptiblyDistinct === true, 'the two halves are perceptibly distinct (ΔE2000)');
    assert.ok(Number.isFinite(pair.luminanceDelta), 'a luminanceDelta is reported');
    assert.ok(r.regionColors.every((c) => Number.isFinite(c.colorSpread)), 'each region reports its colorSpread (uniformity)');
    assert.ok(!r.pairs.some((p) => 'contrastRatio' in p || 'verdict' in p || 'deltaE' in p), 'derived ΔE2000 only — no contrast ratio, no verdict, no bare CIE76 deltaE');
  });
});

test('ocr_image_text: returns recognised text + lines (objective, no verdict); errors degrade to INCONCLUSIVE, not empty', { skip: !chromeOK, concurrency: false }, async () => {
  await withPage(async (page) => {
    // STUB the sidecar — deterministic, no Python in the unit test
    const okOcr = { available: () => true, recognize: async () => ({ text: 'Real heading', lines: [{ text: 'Real heading', score: 0.99, box: [[0, 0], [10, 0], [10, 5], [0, 5]] }] }) };
    const r = await ocrImageText(page, { targetXpath: XP.realh }, { ocr: okOcr });
    assert.equal(r.text, 'Real heading');
    assert.equal(r.lineCount, 1);
    assert.equal(r.lines[0].score, 0.99);
    assert.ok(!('verdict' in r) && !('passes' in r) && !('isImageOfText' in r) && !('al;tMatches' in r), 'objective reading only — the model judges, the tool does not');
    // no sidecar configured ⇒ INCONCLUSIVE error, never a crash or a fabricated empty read
    const u = await ocrImageText(page, { targetXpath: XP.realh }, {});
    assert.ok(/ocr-unavailable/.test(u.error || ''), 'absent sidecar ⇒ {error}, treated as INCONCLUSIVE');
    // a sidecar runtime error ⇒ {error} + an INCONCLUSIVE note (NOT empty text the model could read as "no text")
    const errOcr = { available: () => true, recognize: async () => ({ error: 'ocr-call-timeout' }) };
    const e = await ocrImageText(page, { targetXpath: XP.realh }, { ocr: errOcr });
    assert.ok(/timeout/.test(e.error || '') && /INCONCLUSIVE/.test(e.note || ''), 'a runtime error surfaces as error+INCONCLUSIVE, never a silent empty string');
    // an explicit rect also works (no xpath)
    const rect = await ocrImageText(page, { x: 0, y: 0, width: 40, height: 20 }, { ocr: okOcr });
    assert.equal(rect.text, 'Real heading', 'an explicit x/y/width/height rect is accepted');
    // low-confidence lines are flagged (the under-read / non-Latin signal) ⇒ INCONCLUSIVE, never "no text"
    const lowOcr = { available: () => true, recognize: async () => ({ text: 'blur', lines: [{ text: 'blur', score: 0.3, box: [] }] }) };
    const low = await ocrImageText(page, { targetXpath: XP.realh }, { ocr: lowOcr });
    assert.equal(low.lowConfidenceLineCount, 1, 'a sub-0.6 line is flagged low-confidence');
    assert.ok(low.minLineScore < 0.6, 'minLineScore surfaced');
  });
});

// ---- deferred-item regressions ----
test('compute_contrast_ratio: a wide-gamut oklch() colour resolves to sRGB (not refused as unparseable)', { skip: !chromeOK, concurrency: false }, async () => {
  await withPage(async (page) => {
    const r = await computeContrastRatio(page, { nodeAXpath: XP.oklchtext, nodeBXpath: XP.realh });
    assert.ok(!('inconclusive' in r) || r.inconclusive !== 'unparseable-color', 'oklch is normalised, not rejected');
    assert.ok(Number.isFinite(r.contrastRatio) && typeof r.passes === 'boolean', 'a real ratio + passes is produced');
  });
});

test('measure_geometry_live: occludedElements lists a sibling painting on top (1.4.13); viewportWidth uses a clone', { skip: !chromeOK, concurrency: false }, async () => {
  await withPage(async (page, freshClone) => {
    const r = await measureGeometryLive(page, { targetXpath: XP.occtarget });
    assert.ok(Array.isArray(r.occludedElements) && r.occludedElements.length >= 1, 'the covering sibling is detected as occluding');
    assert.equal(r.stateUsed, 'as-loaded(shared-page)', 'no viewportWidth ⇒ read-only on the shared page');
    const sw = await page.evaluate(() => window.innerWidth);
    const v = await measureGeometryLive(page, { targetXpath: XP.realh, viewportWidth: 320 }, { freshClone });
    assert.ok(/viewport-320px\(clone\)/.test(v.stateUsed), 'viewportWidth re-measures on a clone');
    assert.equal(await page.evaluate(() => window.innerWidth), sw, 'the SHARED page viewport is unchanged (clone only)');
  });
});

test('render_with_overrides: an unresolvable targetXpath errors (no silent full-viewport fallback)', { skip: !chromeOK, concurrency: false }, async () => {
  await withPage(async (page) => {
    const r = await renderWithOverrides(page, { transform: 'grayscale', targetXpath: '/html[1]/body[1]/nope[9]' }, { freshClone: async () => { const p = await sharedBrowser.newPage(); await p.goto(FX, { waitUntil: 'load' }); return p; } });
    assert.ok(/not found or zero-size/.test(r.error || ''), 'a bad target errors, never a full-viewport shot mistaken for the element');
  });
});

test('resolve_destination: single-link reports redirect timing; linkXpaths[] returns a byte-equality grid (fd3a94 set test)', { skip: !chromeOK, concurrency: false }, async () => {
  await withPage(async (page) => {
    const one = await resolveDestination(page, { linkXpath: XP.destlink });
    assert.ok('instantRedirect' in one && 'redirectDelayMs' in one, 'single-link carries redirect-timing fields');
    const set = await resolveDestination(page, { linkXpaths: [XP.destlink, XP.destlink] });
    assert.equal(set.fingerprints.length, 2, 'the set is resolved');
    assert.equal(set.equality.titleEqual, true, 'two resolves of the same link are byte-equal on title');
    assert.equal(set.equality.h1Equal, true);
    assert.ok(!('verdict' in set.equality) && !('same' in set.equality), 'byte-equality grid only — never a same/different verdict');
  });
});

test('observe_state_after_activation: activationKind classifies in-page vs navigating-link (isSafe awareness)', { skip: !chromeOK, concurrency: false }, async () => {
  await withPage(async (page, freshClone) => {
    const btn = await observeStateAfterActivation(page, { targetXpath: XP.reveal }, { freshClone });
    assert.equal(btn.activationKind, 'in-page', 'a plain reveal button is in-page');
    const link = await observeStateAfterActivation(page, { targetXpath: XP.destlink }, { freshClone });
    assert.equal(link.activationKind, 'navigating-link', 'a real href is flagged as navigating (the delta may be a page change)');
  });
});

// ───────────── interact_and_observe (bounded generic primitive set) ─────────────
// Served over a LOCAL http origin so the navigation-block (request interception) is genuinely exercised.
const INTERACT_HTML = fs.readFileSync(assetPath('fx-v3-interact.html'), 'utf8');
const IXP = { email: '/html[1]/body[1]/form[1]/input[1]', submit: '/html[1]/body[1]/form[1]/button[1]', reveal: '/html[1]/body[1]/button[1]' };
async function withInteractPage(fn) {
  const srv = http.createServer((req, res) => { if (req.url === '/' || req.url.startsWith('/?')) { res.setHeader('content-type', 'text/html'); res.end(INTERACT_HTML); } else { res.statusCode = 404; res.end('gone'); } });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${srv.address().port}/`;
  const page = await sharedBrowser.newPage();
  try { await page.goto(url, { waitUntil: 'load' }); const ctx = { freshClone: async () => { const p = await sharedBrowser.newPage(); await p.goto(url, { waitUntil: 'load' }); return p; } }; return await fn(page, ctx); }
  finally { await page.close().catch(() => {}); srv.close(); }
}

test('interact_and_observe 3.3.1: submit an empty required field ⇒ invalidFields with validationMessage + ASSOCIATED error text', { skip: !chromeOK, concurrency: false }, async () => {
  await withInteractPage(async (page, ctx) => {
    const r = await interactAndObserve(page, { actions: [{ op: 'click', xpath: IXP.submit }] }, ctx);
    assert.ok(!r.error, r.error || 'ok');
    const email = r.delta.invalidFields.find((f) => /input/.test(f.xpath));
    assert.ok(email, 'the empty required email is reported invalid');
    assert.equal(email.constraintInvalid, true, 'native constraint validation flags it');
    assert.ok(email.validationMessage && email.validationMessage.length > 0, 'a native validationMessage is surfaced');
    assert.equal(email.ariaInvalid, true, 'the page set aria-invalid');
    assert.ok(email.associatedErrorText.some((t) => /valid email/i.test(t)), 'the programmatically-associated error text is captured');
    assert.equal(email.errorAssociated, true);
    assert.equal(email.via, 'aria-describedby');
    assert.equal(r.delta.urlChanged, false, 'no navigation/POST happened');
  });
});

test('interact_and_observe 3.3.1: type an INVALID value then submit ⇒ field reported invalid (typed sequence)', { skip: !chromeOK, concurrency: false }, async () => {
  await withInteractPage(async (page, ctx) => {
    const r = await interactAndObserve(page, { actions: [{ op: 'type', xpath: IXP.email, text: 'notanemail' }, { op: 'click', xpath: IXP.submit }] }, ctx);
    assert.ok(!r.error, r.error || 'ok');
    assert.equal(r.steps.length, 2);
    assert.ok(r.delta.invalidFields.some((f) => f.constraintInvalid && /input/.test(f.xpath)), 'the bad-format email is invalid');
    assert.equal(r.delta.urlChanged, false);
  });
});

test('interact_and_observe SAFETY: a VALID submit does NOT navigate/POST (preventDefault on submit)', { skip: !chromeOK, concurrency: false }, async () => {
  await withInteractPage(async (page, ctx) => {
    const r = await interactAndObserve(page, { actions: [{ op: 'type', xpath: IXP.email, text: 'a@b.com' }, { op: 'click', xpath: IXP.submit }] }, ctx);
    assert.ok(!r.error, r.error || 'ok');
    assert.equal(r.delta.urlChanged, false, 'the form did not navigate away — the submit default was prevented (no real POST)');
    assert.equal(r.delta.noErrorSurfaced, true, 'a valid form surfaced no field errors');
  });
});

test('interact_and_observe SAFETY: a JS-driven navigation (location.href) is BLOCKED at the network layer (backstop)', { skip: !chromeOK, concurrency: false }, async () => {
  await withInteractPage(async (page, ctx) => {
    const r = await interactAndObserve(page, { actions: [{ op: 'click', xpath: '/html[1]/body[1]/button[2]' }] }, ctx); // the "Leave" button → location.href
    assert.ok(!r.error, r.error || 'ok');
    assert.ok(r.blockedNavigations >= 1, 'the JS navigation REQUEST was aborted by the interception backstop — no real GET/POST reached the network (the destination href may commit on a blocked load, but nothing was fetched)');
  });
});

test('interact_and_observe: a multi-step reveal returns the newly-visible content (visibilityCause)', { skip: !chromeOK, concurrency: false }, async () => {
  await withInteractPage(async (page, ctx) => {
    const r = await interactAndObserve(page, { actions: [{ op: 'click', xpath: IXP.reveal }] }, ctx);
    assert.ok(!r.error, r.error || 'ok');
    const node = r.delta.newlyVisibleNodes.find((n) => /Hidden details revealed/.test(n.text));
    assert.ok(node, 'the revealed panel text is reported newly-visible');
    assert.equal(node.visibilityCause, 'display', 'un-hidden via display (the hidden attribute)');
  });
});

test('interact_and_observe GUARDS: action cap + invalid op are rejected; result never carries a verdict', { skip: !chromeOK, concurrency: false }, async () => {
  await withInteractPage(async (page, ctx) => {
    const tooMany = await interactAndObserve(page, { actions: Array.from({ length: 17 }, () => ({ op: 'press', key: 'Tab' })) }, ctx);
    assert.match(tooMany.error || '', /too many actions/, 'the action cap is enforced');
    const badOp = await interactAndObserve(page, { actions: [{ op: 'navigate', xpath: IXP.reveal }] }, ctx);
    assert.match(badOp.error || '', /invalid op/, 'an unknown op is rejected');
    const r = await interactAndObserve(page, { actions: [{ op: 'click', xpath: IXP.reveal }] }, ctx);
    assert.ok(!('verdict' in r) && !('pass' in r) && !('barrier' in r) && !('conformant' in r), 'facts only — no verdict laundered');
  });
});
