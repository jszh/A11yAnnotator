// Residual RCA S10 / Tier 3 — the 1.4.13 held-state PERSISTENCE PROBE in runHoverContentTri.
// The single 1600 ms dwell cannot see a TIMED dismissal (content hidden by a page timer while the
// trigger is still held), so the runner now re-shows once and samples the revealed state at fixed
// offsets, reporting `persistenceSamples` + `vanishedWhileHeld` as MEASUREMENT facts (never a new
// outcome flag — the timed-removal question includes the SC's own "information no longer valid"
// exception, which stays a judgment call). Invented inline fixtures; nothing corpus-derived.
//
// PENDING (2026-08-17): written during a live measurement run under a no-browser-launch freeze — this
// suite has NOT yet been executed. Run it (with the rest of the runner suites) once the freeze lifts.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const puppeteer = require('puppeteer');
const { RUNNERS } = require('../../lib/exp-runners.js');
const { CHROME } = require('../../lib/run-experiments.js');

const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — v3 hover-persistence suite SKIPPED');

async function launchWithRetry() {
  let lastErr;
  for (let i = 0; i < 3; i++) {
    try { return await puppeteer.launch({ executablePath: CHROME, headless: 'new', timeout: 60000, args: ['--no-sandbox', '--disable-dev-shm-usage'] }); }
    catch (e) { lastErr = e; if (!/WS endpoint|Timed out/i.test(String(e && e.message))) throw e; }
  }
  throw lastErr;
}

async function runTri(html, request) {
  const browser = await launchWithRetry();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    return await RUNNERS['hover-content-tri'](page, { candidateId: 'c-tri', ...request });
  } finally { await browser.close(); }
}

// The reveal survives the 1600 ms dwell (so o.persistent stays true and the probe arms), then a timer
// ANCHORED ON THE REVEAL hides it 2.2 s in — while the pointer never leaves the trigger. Offsets are
// compressed via request.persistenceSampleOffsetsMs so the test stays fast; production keeps 1/3/7 s.
const VANISHING = `<!doctype html><html><body>
  <style>#tip{display:none;position:absolute;top:34px;left:8px;background:#fff;border:1px solid #999;padding:4px}
         .on #tip{display:block}</style>
  <div id="wrap" style="position:relative">
    <a href="#" id="lnk">Rules for changing your mind</a>
    <div id="tip">You may swap the day up to the final morning</div>
  </div>
  <script>
    let tt = null;
    const wrap = document.getElementById('wrap');
    document.getElementById('lnk').addEventListener('mouseenter', () => {
      wrap.classList.add('on');
      clearTimeout(tt);
      tt = setTimeout(() => wrap.classList.remove('on'), 2200); // hides WHILE the pointer still rests on the trigger
    });
    document.getElementById('lnk').addEventListener('mouseleave', () => { clearTimeout(tt); wrap.classList.remove('on'); });
  </script>
</body></html>`;

test('C9 persistence probe: content hidden by a timer WHILE HELD ⇒ vanishedWhileHeld true, with the vanish sampled', { skip: !chromeOK, concurrency: false }, async () => {
  const r = await runTri(VANISHING, { targetXpath: '/html/body/div/a', persistenceSampleOffsetsMs: [500, 1500, 2600] });
  assert.equal(r.outcome.contentAppeared, true, 'the hover reveal was observed');
  assert.equal(r.outcome.persistent, true, 'the 1600 ms dwell passes — exactly the case the samples exist for');
  const m = r.measurement;
  assert.ok(Array.isArray(m.persistenceSamples) && m.persistenceSamples.length === 3, `three samples — got ${JSON.stringify(m)}`);
  assert.equal(m.persistenceSamples[0].present, true, 'still present at the first sample');
  assert.equal(m.persistenceSamples[2].present, false, 'gone at the sample past the timer');
  assert.ok(m.persistenceSamples.every((s) => s.held === true), 'the hold POSITIVELY survived every sample (hover mode holds by construction)');
  assert.equal(m.vanishedWhileHeld, true);
});

// NULL POLARITY (soundness probe 2026-08-17): `held: null` means the hold-check evaluate itself FAILED —
// an unknown, not a proven hold. The old `held !== false` counted it as held, minting the timed-dismissal
// signature from a probe that could not answer. Pure — runs with no Chrome.
test('C9 persistence facts: a null hold-check is never counted as a hold', () => {
  const { vanishedWhileHeldFrom } = require('../../lib/exp-runners.js');
  assert.equal(vanishedWhileHeldFrom([{ atMs: 1000, present: false, held: null }]), false, 'held:null + vanished ⇒ NOT the signature');
  assert.equal(vanishedWhileHeldFrom([{ atMs: 1000, present: false, held: true }]), true, 'a proven hold + vanished ⇒ the signature');
  assert.equal(vanishedWhileHeldFrom([{ atMs: 1000, present: false, held: false }]), false, 'a lost hold explains the vanish');
  assert.equal(vanishedWhileHeldFrom([{ atMs: 1000, present: true, held: true }]), false);
  assert.equal(vanishedWhileHeldFrom([]), false);
  assert.equal(vanishedWhileHeldFrom(null), false);
});

test('C9 persistence probe: a genuinely persistent reveal samples present throughout ⇒ vanishedWhileHeld false', { skip: !chromeOK, concurrency: false }, async () => {
  const html = VANISHING.replace(/tt = setTimeout\([^;]+;/, ''); // same fixture, no timer
  const r = await runTri(html, { targetXpath: '/html/body/div/a', persistenceSampleOffsetsMs: [400, 900, 1400] });
  assert.equal(r.outcome.persistent, true);
  const m = r.measurement;
  assert.ok(Array.isArray(m.persistenceSamples) && m.persistenceSamples.every((s) => s.present === true),
    `present at every offset — got ${JSON.stringify(m.persistenceSamples)}`);
  assert.equal(m.vanishedWhileHeld, false);
});

// PIN UPDATED for #F5 (batch-3 adversarial review): the probe is no longer gated on the dwell PASSING —
// a dwell-failing page is exactly where the held-state samples carry the timed-dismissal question to the
// LLM facet lane, so the probe now runs whenever content was revealed. The old "a failed dwell needs no
// samples" bound is deliberately gone; the opt-out contract is unchanged.
test('C9 persistence probe: runs on a dwell-failing reveal too (#F5), and stays opt-out-able', { skip: !chromeOK, concurrency: false }, async () => {
  // dwell-failing fixture: the tip hides 800 ms after reveal, inside the 1600 ms dwell
  const fast = VANISHING.replace('2200', '800');
  const r1 = await runTri(fast, { targetXpath: '/html/body/div/a', persistenceSampleOffsetsMs: [400, 900] });
  assert.equal(r1.outcome.persistent, false, 'a full-strength re-reveal proves the dwell loss was a real removal');
  assert.ok(Array.isArray(r1.measurement.persistenceSamples), 'the held-state samples are recorded even when the dwell failed (#F5)');
  assert.equal(r1.measurement.vanishedWhileHeld, true, 'the timed dismissal is measured for the LLM facet lane');
  const r2 = await runTri(VANISHING, { targetXpath: '/html/body/div/a', persistenceProbe: false });
  assert.equal(r2.measurement.persistenceSamples, undefined, 'persistenceProbe:false keeps the runner byte-identical to the pre-probe shape');
});
