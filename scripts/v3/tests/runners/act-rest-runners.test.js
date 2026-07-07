// ACT-REST expansion Round 1 — the real static-DOM runners against inline fixtures, then one end-to-end
// through buildV3 to confirm a runner barrier lands as a source:'deterministic' SHADOW observation (the
// exact record the ACT-rest eval scores). Chrome-gated, like runner.test.js.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { runPlan, CHROME } = require('../../lib/run-experiments.js');
const { buildV3 } = require('../../lib/build-v3.js');

const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — ACT-rest runner suite SKIPPED');

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'act-rest-fx-'));
const writeFx = (name, html) => { const p = path.join(DIR, name); fs.writeFileSync(p, html); return 'file://' + p; };

const FX_FORMS = writeFx('forms.html', `<!DOCTYPE html><html lang="en"><body>
  <input autocomplete="username">
  <input autocomplete="badname">
  <input type="submit" autocomplete="email">
  <p style="letter-spacing: 0.2em !important">wide enough letters</p>
  <p style="letter-spacing: 0.1em !important">too tight letters here</p>
  <p style="line-height: 20px !important; max-width: 120px; font-size: 20px">The toy brought back fond memories of being lost in the rain forest.</p>
  <a href="/" aria-label="ACT rules">ACT rules</a>
  <a href="/" aria-label="WCAG">ACT rules</a>
  <button aria-label="anything">X</button>
</body></html>`);
// viewport + meta-refresh live in <head>; two files so each verdict is unambiguous.
const FX_HEAD_BARRIER = writeFx('head-barrier.html', `<!DOCTYPE html><html lang="en"><head>
  <meta name="viewport" content="user-scalable=no">
  <meta http-equiv="refresh" content="30"></head><body><p>x</p></body></html>`);
const FX_HEAD_PASS = writeFx('head-pass.html', `<!DOCTYPE html><html lang="en"><head>
  <meta name="viewport" content="maximum-scale=2.0">
  <meta http-equiv="refresh" content="72001"></head><body><p>x</p></body></html>`);
// verifier repro fixtures (spec-cited): user-scalable=device-width permits (vp-usdw); a permissive viewport
// followed by a restrictive one FAILS because the rule applies to EACH meta (vp-multi).
const FX_VP_USDW = writeFx('vp-usdw.html', `<!DOCTYPE html><html lang="en"><head><meta name="viewport" content="user-scalable=device-width"></head><body><p>x</p></body></html>`);
const FX_VP_MULTI = writeFx('vp-multi.html', `<!DOCTYPE html><html lang="en"><head><meta name="viewport" content="user-scalable=yes"><meta name="viewport" content="maximum-scale=1.0"></head><body><p>x</p></body></html>`);
// line-height at odd font metrics measured from the USED getComputedStyle value must PASS (no rounding FP);
// a single line of text is a definitive pass via the ACT 78fd32 "less than two lines" exemption.
const FX_LH = writeFx('lh.html', `<!DOCTYPE html><html lang="en"><body>
  <p id="odd" style="font-size:13.333px; line-height:1.5 !important; max-width:120px">The toy brought back fond memories of being lost in the rain forest today.</p>
  <p id="odd25" style="font-size:12.5px; line-height:1.5 !important; max-width:120px">The toy brought back fond memories of being lost in the rain forest today.</p>
  <p id="single" style="line-height:1.0 !important">short</p>
  <p id="tight" style="line-height:1.2 !important; max-width:120px">The toy brought back fond memories of being lost in the rain forest today.</p>
</body></html>`);

// SC 59br37 (1.4.4) zoom-clip: the runner re-lays out at 640x512. Each div is a clipping ancestor. Long text
// ("The Raven ...") ensures overflow. vclip-boundary passes (box == line-height → clean line boundary); vclip-mid
// fails (box 1.5em, partial 2nd line); hclip-ellipsis passes (nowrap + ellipsis exception); hclip-clip fails.
const FX_CLIP = writeFx('clip.html', `<!DOCTYPE html><html lang="en"><body style="font-size:16px">
  <div id="vboundary" style="overflow:hidden; height:16px; line-height:16px; word-wrap:break-word; width:200px">Once upon a midnight dreary, while I pondered, weak and weary, over many a quaint volume of forgotten lore.</div>
  <div id="vmid" style="overflow:hidden; height:1.5em; width:200px">Once upon a midnight dreary, while I pondered, weak and weary, over many a quaint volume of forgotten lore.</div>
  <div id="hellipsis" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width:200px">Once upon a midnight dreary, while I pondered, weak and weary, over many a quaint volume of forgotten lore.</div>
  <div id="hclip" style="white-space:nowrap; overflow-x:hidden; text-overflow:clip; width:50px; height:16px; line-height:16px">Once upon a midnight dreary, while I pondered.</div>
</body></html>`);

// SC efbfc7 (2.2.2) auto-update-pausable. A 300ms ticker updates #t; the runner confirms updates via snapshots.
// barrier: static content + ticker + NO control. inapplicable: the ticker is the ONLY content ("alone").
const TICKER = `<script>var i=0;setInterval(function(){document.getElementById('t').innerText=(++i);},300);</script>`;
const FX_AU_BARRIER = writeFx('au-barrier.html', `<!DOCTYPE html><html lang="en"><body><p>Some static reading content here.</p><p>Count: <span id="t">0</span></p>${TICKER}</body></html>`);
const FX_AU_ALONE = writeFx('au-alone.html', `<!DOCTYPE html><html lang="en"><body><span id="t">0</span>${TICKER}</body></html>`);
const FX_AU_PAUSE = writeFx('au-pause.html', `<!DOCTYPE html><html lang="en"><body><p>Some static reading content here.</p><p>Count: <span id="t">0</span></p><button onclick="clearInterval(window.__iv)">Pause</button><script>var i=0;window.__iv=setInterval(function(){document.getElementById('t').innerText=(++i);},300);</script></body></html>`);

// SC cf77f2 (2.4.1) bypass-blocks (body-scoped). barrier: nav (repeated) before div#main, no limb. pass-landmark:
// nav before <main>. pass-order: main content before the repeated aside (bypassable by UA). pass-skip: skip-link
// to #main. pass-collapse: a button that hides the nav (activation-confirmed).
const FX_BP_BARRIER = writeFx('bp-barrier.html', `<!DOCTYPE html><html lang="en"><body><nav><a href="/other.html">Nav link</a></nav><div id="main"><p>The unique article content of this page goes here.</p></div></body></html>`);
const FX_BP_LANDMARK = writeFx('bp-landmark.html', `<!DOCTYPE html><html lang="en"><body><nav><a href="/other.html">Nav link</a></nav><main><p>The unique article content of this page goes here.</p></main></body></html>`);
const FX_BP_ORDER = writeFx('bp-order.html', `<!DOCTYPE html><html lang="en"><body><div id="main"><p>The unique article content of this page goes here.</p></div><aside><a href="/other.html">Related link</a></aside></body></html>`);
const FX_BP_SKIP = writeFx('bp-skip.html', `<!DOCTYPE html><html lang="en"><body><a href="#main">Skip to main content</a><nav><a href="/other.html">Nav link</a></nav><div id="main"><p>The unique article content of this page goes here.</p></div></body></html>`);
const FX_BP_COLLAPSE = writeFx('bp-collapse.html', `<!DOCTYPE html><html lang="en"><body><button onclick="document.getElementById('nav1').style.display='none'">Hide navigation</button><nav id="nav1"><a href="/other.html">Nav link</a></nav><div id="main"><p>The unique article content of this page goes here.</p></div></body></html>`);
// verifier R2 probes (spec-cited): a skip-link must land PAST ALL leading repeated blocks, not just the first.
const RA = '<p>Repeated aside content that is still ahead of the main region here.</p>';
const FX_BP_ENDNAV = writeFx('bp-endnav.html', `<!DOCTYPE html><html lang="en"><body><a href="#endnav">Skip to main</a><nav><a href="/o.html">Nav</a><span id="endnav"></span></nav><aside>${RA}</aside><div id="main"><p>The unique article content.</p></div></body></html>`);
const FX_BP_BETWEEN = writeFx('bp-between.html', `<!DOCTYPE html><html lang="en"><body><a href="#between">Skip to main</a><nav><a href="/o.html">Nav</a></nav><span id="between"></span><aside>${RA}</aside><div id="main"><p>The unique article content.</p></div></body></html>`);
const FX_BP_PASTALL = writeFx('bp-pastall.html', `<!DOCTYPE html><html lang="en"><body><a href="#main">Skip to main</a><nav><a href="/o.html">Nav</a></nav><aside>${RA}</aside><div id="main"><p>The unique article content.</p></div></body></html>`);
// verifier R2 probe (spec-cited): line-height:1.5 clip on a clean line boundary passes (used line-height from top DELTAS, not glyph-run height).
const RAVEN = 'Once upon a midnight dreary, while I pondered, weak and weary, Over many a quaint and curious volume of forgotten lore.';
const FX_ZC_CLEAN15 = writeFx('zc-clean15.html', `<!DOCTYPE html><html lang="en"><body style="font-size:16px"><div style="overflow:hidden; height:24px; line-height:1.5; width:300px">${RAVEN}</div></body></html>`);
const FX_ZC_CLEAN15_2 = writeFx('zc-clean15-2.html', `<!DOCTYPE html><html lang="en"><body style="font-size:16px"><div style="overflow:hidden; height:48px; line-height:1.5; width:300px">${RAVEN}</div></body></html>`);
const FX_ZC_MID = writeFx('zc-mid.html', `<!DOCTYPE html><html lang="en"><body style="font-size:16px"><div style="overflow:hidden; height:24px; line-height:normal; width:300px">${RAVEN}</div></body></html>`);

function runnerResults(plan, url) { return runPlan(plan, { resolveUrl: () => url }); }

test('ACT-rest runners: autocomplete / text-spacing / label-in-name verdicts on inline fixtures', { skip: !chromeOK, concurrency: false }, async () => {
  const plan = { file: 'f', runId: 'R', pageDigest: 'sha256:f', _startedAt: 1, requests: [
    { candidateId: 'ac-ok', experimentId: 'autocomplete-valid', targetXpath: '/html/body/input[1]', sc: '1.3.5' },
    { candidateId: 'ac-bad', experimentId: 'autocomplete-valid', targetXpath: '/html/body/input[2]', sc: '1.3.5' },
    { candidateId: 'ac-na', experimentId: 'autocomplete-valid', targetXpath: '/html/body/input[3]', sc: '1.3.5' },
    { candidateId: 'ls-ok', experimentId: 'text-spacing-adequate', targetXpath: '/html/body/p[1]', sc: '1.4.12' },
    { candidateId: 'ls-bad', experimentId: 'text-spacing-adequate', targetXpath: '/html/body/p[2]', sc: '1.4.12' },
    { candidateId: 'lh-px', experimentId: 'text-spacing-adequate', targetXpath: '/html/body/p[3]', sc: '1.4.12' },
    { candidateId: 'lin-ok', experimentId: 'label-in-name-match', targetXpath: '/html/body/a[1]', sc: '2.5.3' },
    { candidateId: 'lin-bad', experimentId: 'label-in-name-match', targetXpath: '/html/body/a[2]', sc: '2.5.3' },
    { candidateId: 'lin-abstain', experimentId: 'label-in-name-match', targetXpath: '/html/body/button[1]', sc: '2.5.3' },
  ] };
  const exp = await runnerResults(plan, FX_FORMS);
  const by = {}; for (const r of exp.results) by[r.claimId] = r.outcome;
  assert.deepEqual([by['ac-ok'].passConfirmed, by['ac-ok'].barrierConfirmed], [true, false], 'valid autocomplete clears');
  assert.deepEqual([by['ac-bad'].passConfirmed, by['ac-bad'].barrierConfirmed], [false, true], 'badname autocomplete barriers');
  assert.equal(by['ac-na'].autocompleteApplicable, false, 'type=submit is inapplicable (no verdict)');
  assert.equal(by['ls-ok'].passConfirmed, true, '0.2em letter-spacing clears');
  assert.equal(by['ls-bad'].barrierConfirmed, true, '0.1em letter-spacing barriers');
  assert.equal(by['lh-px'].barrierConfirmed, true, 'px line-height 20/20=1.0 over wrapped text barriers (the axe blind spot)');
  assert.equal(by['lin-ok'].passConfirmed, true, 'visible label contained in name clears');
  assert.equal(by['lin-bad'].barrierConfirmed, true, '"ACT rules" not in "WCAG" barriers');
  assert.deepEqual([by['lin-abstain'].passConfirmed, by['lin-abstain'].barrierConfirmed], [false, false], 'single-char "X" abstains (auto-PARTIAL), never a hard barrier');
});

test('ACT-rest runners: viewport + meta-refresh barrier and pass', { skip: !chromeOK, concurrency: false }, async () => {
  const mkPlan = (f) => ({ file: f, runId: 'R', pageDigest: 'sha256:f', _startedAt: 1, requests: [
    { candidateId: 'vp', experimentId: 'viewport-allows-zoom', targetXpath: '/html/head/meta[1]', sc: '1.4.4' },
    { candidateId: 'mr', experimentId: 'no-meta-refresh-delay', targetXpath: '/html/head/meta[2]', sc: '2.2.1' },
  ] });
  const barrier = {}; for (const r of (await runnerResults(mkPlan('b'), FX_HEAD_BARRIER)).results) barrier[r.claimId] = r.outcome;
  assert.equal(barrier['vp'].barrierConfirmed, true, 'user-scalable=no restricts zoom');
  assert.equal(barrier['mr'].barrierConfirmed, true, '30s refresh is a timed delay');
  const pass = {}; for (const r of (await runnerResults(mkPlan('p'), FX_HEAD_PASS)).results) pass[r.claimId] = r.outcome;
  assert.equal(pass['vp'].passConfirmed, true, 'maximum-scale=2.0 permits zoom');
  assert.equal(pass['mr'].passConfirmed, true, '72001s > 72000 is exempt');
});

test('ACT-rest viewport: user-scalable=device-width passes; a 2nd restrictive viewport meta fails the page (applies to each)', { skip: !chromeOK, concurrency: false }, async () => {
  const req = (xp) => ({ file: 'f', runId: 'R', pageDigest: 'sha256:f', _startedAt: 1, requests: [{ candidateId: 'vp', experimentId: 'viewport-allows-zoom', targetXpath: xp, sc: '1.4.4' }] });
  const usdw = (await runnerResults(req('/html/head/meta[1]'), FX_VP_USDW)).results[0].outcome;
  assert.equal(usdw.passConfirmed, true, 'vp-usdw: user-scalable=device-width permits zoom');
  const multi = (await runnerResults(req('/html/head/meta[1]'), FX_VP_MULTI)).results[0].outcome;
  assert.equal(multi.barrierConfirmed, true, 'vp-multi: a later maximum-scale=1.0 viewport meta makes the page fail');
});

test('ACT-rest line-height: odd font metrics measured from the USED value PASS; a single line is a definitive pass', { skip: !chromeOK, concurrency: false }, async () => {
  const plan = { file: 'f', runId: 'R', pageDigest: 'sha256:f', _startedAt: 1, requests: [
    { candidateId: 'odd', experimentId: 'text-spacing-adequate', targetXpath: '/html/body/p[1]', sc: '1.4.12' },
    { candidateId: 'odd25', experimentId: 'text-spacing-adequate', targetXpath: '/html/body/p[2]', sc: '1.4.12' },
    { candidateId: 'single', experimentId: 'text-spacing-adequate', targetXpath: '/html/body/p[3]', sc: '1.4.12' },
    { candidateId: 'tight', experimentId: 'text-spacing-adequate', targetXpath: '/html/body/p[4]', sc: '1.4.12' },
  ] };
  const by = {}; for (const r of (await runnerResults(plan, FX_LH)).results) by[r.claimId] = r.outcome;
  assert.equal(by['odd'].passConfirmed, true, 'lh-odd: line-height 1.5 on a 13.333px font clears (no rounding false-barrier)');
  assert.equal(by['odd25'].passConfirmed, true, 'lh-odd25: line-height 1.5 on a 12.5px font clears');
  assert.equal(by['single'].passConfirmed, true, 'lh-single: a single line of text is a definitive pass (ACT 78fd32 "< 2 lines" exemption)');
  assert.equal(by['tight'].barrierConfirmed, true, 'line-height 1.2 over wrapped text is still a genuine barrier');
});

test('ACT-rest zoom-clip (59br37): mid-line vertical clip + text-overflow:clip horizontal clip barrier; clean-line-boundary + ellipsis pass', { skip: !chromeOK, concurrency: false }, async () => {
  const plan = { file: 'f', runId: 'R', pageDigest: 'sha256:f', _startedAt: 1, requests: [
    { candidateId: 'vboundary', experimentId: 'zoom-clip-probe', targetXpath: '/html/body/div[1]', sc: '1.4.4' },
    { candidateId: 'vmid', experimentId: 'zoom-clip-probe', targetXpath: '/html/body/div[2]', sc: '1.4.4' },
    { candidateId: 'hellipsis', experimentId: 'zoom-clip-probe', targetXpath: '/html/body/div[3]', sc: '1.4.4' },
    { candidateId: 'hclip', experimentId: 'zoom-clip-probe', targetXpath: '/html/body/div[4]', sc: '1.4.4' },
  ] };
  const by = {}; for (const r of (await runnerResults(plan, FX_CLIP)).results) by[r.claimId] = r.outcome;
  assert.equal(by['vboundary'].passConfirmed, true, 'box == line-height ⇒ clean line boundary ⇒ pass (Expectation 2 exception)');
  assert.equal(by['vmid'].barrierConfirmed, true, 'box 1.5em clips the 2nd line mid-glyph ⇒ barrier');
  assert.equal(by['hellipsis'].passConfirmed, true, 'nowrap + text-overflow:ellipsis ⇒ Expectation 1 exception ⇒ pass');
  assert.equal(by['hclip'].barrierConfirmed, true, 'nowrap + text-overflow:clip ⇒ no exception ⇒ horizontal clip barrier');
});

test('ACT-rest auto-update-pausable (efbfc7): ticker with static content + no control barriers; ticker-alone inapplicable; a driven pause control clears', { skip: !chromeOK, concurrency: false }, async () => {
  const req = (xp, url) => runnerResults({ file: 'f', runId: 'R', pageDigest: 'sha256:f', _startedAt: 1, requests: [{ candidateId: 'au', experimentId: 'auto-update-pausable', targetXpath: xp, sc: '2.2.2' }] }, url);
  const barrier = (await req('/html/body/p[2]/span[1]', FX_AU_BARRIER)).results[0].outcome;
  assert.equal(barrier.barrierConfirmed, true, 'confirmed updates + static content + NO control ⇒ barrier');
  const alone = (await req('/html/body/span[1]', FX_AU_ALONE)).results[0].outcome;
  assert.equal(alone.autoUpdateApplicable, false, 'the ticker is the only content ("alone") ⇒ inapplicable');
  const paused = (await req('/html/body/p[2]/span[1]', FX_AU_PAUSE)).results[0].outcome;
  assert.equal(paused.passConfirmed, true, 'a driven pause control that stops the ticker ⇒ pass-confirm');
});

test('ACT-rest bypass-blocks (cf77f2): repeated-before-main with no limb barriers; landmark/order/skip-link/collapse each pass', { skip: !chromeOK, concurrency: false }, async () => {
  const req = (url) => runnerResults({ file: 'f', runId: 'R', pageDigest: 'sha256:f', _startedAt: 1, requests: [{ candidateId: 'bp', experimentId: 'bypass-blocks', targetXpath: '/html/body', sc: '2.4.1' }] }, url);
  assert.equal((await req(FX_BP_BARRIER)).results[0].outcome.barrierConfirmed, true, 'nav before div#main, no bypass ⇒ barrier');
  assert.equal((await req(FX_BP_LANDMARK)).results[0].outcome.passConfirmed, true, 'a <main> landmark ⇒ pass');
  assert.equal((await req(FX_BP_ORDER)).results[0].outcome.passConfirmed, true, 'repeated content after the main content ⇒ pass (UA-bypassable)');
  assert.equal((await req(FX_BP_SKIP)).results[0].outcome.passConfirmed, true, 'a skip-link to #main ⇒ pass');
  assert.equal((await req(FX_BP_COLLAPSE)).results[0].outcome.passConfirmed, true, 'an activated control that hides the nav ⇒ pass (collapse limb)');
});

test('ACT-rest bypass-blocks: a skip-link must land past ALL leading repeated blocks (multi-block, verifier R2 fix)', { skip: !chromeOK, concurrency: false }, async () => {
  const req = (url) => runnerResults({ file: 'f', runId: 'R', pageDigest: 'sha256:f', _startedAt: 1, requests: [{ candidateId: 'bp', experimentId: 'bypass-blocks', targetXpath: '/html/body', sc: '2.4.1' }] }, url);
  assert.equal((await req(FX_BP_ENDNAV)).results[0].outcome.barrierConfirmed, true, 'anchor at end of nav still leaves the aside ahead ⇒ barrier');
  assert.equal((await req(FX_BP_BETWEEN)).results[0].outcome.barrierConfirmed, true, 'anchor between nav and aside still leaves the aside ahead ⇒ barrier');
  assert.equal((await req(FX_BP_PASTALL)).results[0].outcome.passConfirmed, true, 'anchor to #main (past ALL leading blocks) ⇒ pass');
});

test('ACT-rest zoom-clip: line-height 1.5 clip on a clean line boundary passes (used line-height from top deltas, verifier R2 fix)', { skip: !chromeOK, concurrency: false }, async () => {
  const req = (url) => runnerResults({ file: 'f', runId: 'R', pageDigest: 'sha256:f', _startedAt: 1, requests: [{ candidateId: 'zc', experimentId: 'zoom-clip-probe', targetXpath: '/html/body/div[1]', sc: '1.4.4' }] }, url);
  assert.equal((await req(FX_ZC_CLEAN15)).results[0].outcome.passConfirmed, true, 'height:24px == 1x line-height:1.5 ⇒ clean boundary ⇒ pass (not the 18px glyph-run measure)');
  assert.equal((await req(FX_ZC_CLEAN15_2)).results[0].outcome.passConfirmed, true, 'height:48px == 2x line-height:1.5 ⇒ clean boundary ⇒ pass (tolerance scales with line count)');
  assert.equal((await req(FX_ZC_MID)).results[0].outcome.barrierConfirmed, true, 'height:24px with line-height:normal (~1.33 lines) clips mid-line ⇒ barrier');
});

test('ACT-rest end-to-end: an autocomplete barrier publishes a source:deterministic SHADOW observation (unpromoted)', { skip: !chromeOK, concurrency: false }, async () => {
  const plan = { file: 'f', runId: 'R', pageDigest: 'sha256:f', _startedAt: 1, requests: [
    { candidateId: 'ac-bad', experimentId: 'autocomplete-valid', targetXpath: '/html/body/input[2]', sc: '1.3.5' },
  ] };
  const exp = await runnerResults(plan, FX_FORMS);
  const collect = { file: 'f', runId: 'R', pageDigest: 'sha256:f', collectedAt: 1, elements: [
    { xpath: '/html/body/input[2]', tag: 'input', isFormField: true, sampledRole: 'textbox', autocompleteApplicable: true },
  ] };
  const proposals = [{ claimId: 'ac-bad', sc: '1.3.5', direction: 'BARRIER_OBSERVED', experimentId: 'autocomplete-valid', claimFamily: 'autocomplete-valid', observationScope: exp.results[0].observationScope }];
  const { withPipeline } = require('../helpers.js');
  const bundle = withPipeline({ collect, experiments: { file: 'f', runId: 'R', pageDigest: 'sha256:f', catalogVersion: '3.0.0-phase0', startedAt: 1, results: exp.results }, claimProposals: { file: 'f', runId: 'R', pageDigest: 'sha256:f', proposals } });
  const r = buildV3(bundle, {}); // no authority ⇒ default shadow (exactly the ACT-rest scoring path)
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  const shadow = r.results.shadowObservations.find((o) => o.source === 'deterministic' && o.sc === '1.3.5');
  assert.ok(shadow, 'a 1.3.5 deterministic shadow observation exists');
  assert.equal(shadow.wouldBe.observationOutcome, 'BARRIER_OBSERVED');
  assert.equal(shadow.mechanism, 'autocomplete-valid');
});

test.after(() => { try { fs.rmSync(DIR, { recursive: true, force: true }); } catch (e) {} });
