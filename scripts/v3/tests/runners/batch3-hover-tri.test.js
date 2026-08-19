'use strict';
// Batch-3 fixes to runHoverContentTri (exp-runners.js), two polarities each. Fixtures are INVENTED
// inline HTML — nothing corpus-derived.
//
//  #8  CONTINUOUS hover travel: the hoverable facet now interpolates real mousemoves (~6px steps)
//      from trigger to content, so an element ON THE PATH receives its enter/leave events (F95's
//      neighbour-steal). The old two-teleport path skipped everything between its endpoints.
//  #30 REDUNDANCY EXEMPTION at applicability: revealed text contained in the LOCAL rest-visible
//      text (or equal to the trigger's accessible name) ⇒ contentIsAdditional=false — the reveal
//      deprives nobody, so its properties are never probed and no barrier can mint.
//  #31 RE-REVEAL INTEGRITY: a facet is scored only when its own re-reveal restored at least the
//      original signature; a husk re-reveal leaves the facet UNMEASURED (flag deleted, never false)
//      so anyPropertyFails cannot feed on it. Pinned analogs (fix-plan #31): the never-full-again
//      husk must NOT flag; the restarts-at-full-strength auto-hider must STILL flag.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const puppeteer = require('puppeteer');
const { RUNNERS } = require('../../lib/exp-runners.js');
const { CHROME } = require('../../lib/run-experiments.js');

const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — batch3-hover-tri suite SKIPPED');

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
    await page.setViewport({ width: 1280, height: 900 });
    await page.setContent(html, { waitUntil: 'load' });
    // compressed persistence offsets keep every test fast; production keeps 1/3/7 s.
    return await RUNNERS['hover-content-tri'](page, { candidateId: 'c-tri', persistenceSampleOffsetsMs: [150, 250], ...request });
  } finally { await browser.close(); }
}

// ─── #8: continuous travel ─────────────────────────────────────────────────────────────────────────
// A hover ZONE keeps the tip alive anywhere inside it (so losing the trigger's own hover is NOT what
// kills the tip). A stealer button sits at 1/4 of the straight trigger→tip path — a point the old
// midpoint-teleport never touched — and its mouseenter destroys the tip for good. Only a pointer that
// actually TRAVELS the path can hit it.
const STEAL = (withStealer) => `<!doctype html><html><body style="margin:0">
  <style>
    #zone{position:relative;width:520px;height:60px;margin:40px}
    #trig{position:absolute;left:0;top:10px;width:40px;height:40px;background:#246}
    #steal{position:absolute;left:90px;top:20px;width:20px;height:20px;background:#a33}
    #tip{display:none;position:absolute;left:300px;top:10px;width:150px;height:40px;background:#ffd;border:1px solid #995}
    #zone:hover #tip{display:block}
  </style>
  <div id="zone">
    <div id="trig" tabindex="0">NAV</div>
    ${withStealer ? '<button id="steal" aria-label="next point"></button>' : ''}
    <div id="tip" role="tooltip">Apr 07 $2.310 +0.4%</div>
  </div>
  <p style="margin:40px">Rest-visible paragraph text far from the zone.</p>
  <script>
    const st = document.getElementById('steal');
    if (st) st.addEventListener('mouseenter', () => {
      const t = document.getElementById('tip');
      t.dataset.stolen = '1'; t.style.display = 'none';
      document.getElementById('zone').insertAdjacentHTML('beforeend', '');
      // permanent: the zone:hover reveal is dead from here on
      t.remove();
    });
  </script>
</body></html>`;

test('#8 two-polarity: a path-crossing stealer kills the tip under CONTINUOUS travel — hoverable:false barrier', { skip: !chromeOK, concurrency: false }, async () => {
  const res = await runTri(STEAL(true), { targetXpath: '/html/body/div[1]/div[1]' });
  assert.equal(res.outcome.contentAppeared, true, 'the zone reveal was observed');
  assert.equal(res.outcome.contentIsAdditional, true, 'tip text is not locally redundant');
  assert.equal(res.outcome.hoverable, false, 'continuous travel crossed the stealer and lost the content');
  assert.equal(res.outcome.anyPropertyFails, true, 'the Hoverable failure publishes as a barrier');
});

test('#8 two-polarity: the same geometry WITHOUT a stealer survives the travel — no barrier', { skip: !chromeOK, concurrency: false }, async () => {
  const res = await runTri(STEAL(false), { targetXpath: '/html/body/div[1]/div[1]' });
  assert.equal(res.outcome.contentAppeared, true);
  assert.equal(res.outcome.hoverable, true, 'travel inside the hover zone keeps the content alive');
  assert.equal(res.outcome.anyPropertyFails, false, 'no facet fails on the conformant page');
});

// A REACHABLE tooltip behind a small gap: the popup is a CHILD of its trigger (hover holds while the
// pointer is over either), separated by a 12px dead band. The ~6px continuous sampler always lands in
// the band (mouseleave ⇒ hidden mid-travel), but a faster hand jumps it clean — the trigger→tip
// midpoint falls INSIDE the popup. The criterion is existential, so this page must NOT flag: the
// coarse-profile retry proves the content reachable.
test('#8 existential retry: a gap the fast profile jumps clean is NOT a hoverable barrier', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html><body style="margin:0">
    <style>
      #chip{position:absolute;left:900px;top:10px;width:160px;height:36px;background:#246;color:#fff}
      #pop{display:none;position:absolute;left:-120px;top:48px;width:280px;height:100px;background:#ffd;border:1px solid #995}
      #chip:hover #pop{display:block}
    </style>
    <div id="chip" tabindex="0">Draft stored<div id="pop" role="tooltip">Backed up moments ago to workspace storage.</div></div>
    <p style="margin-top:220px;margin-left:20px">Rest-visible paragraph text far below.</p>
  </body></html>`;
  const res = await runTri(html, { targetXpath: '/html/body/div[1]' });
  assert.equal(res.outcome.contentAppeared, true);
  assert.equal(res.outcome.hoverable, true, 'the coarse retry reaches the content — reachable ⇒ no barrier');
  assert.equal(res.outcome.anyPropertyFails, false);
  const ht = res.measurement.hoverTravel;
  assert.ok(ht && ht.continuousKept === false && ht.coarseKept === true, 'both profiles are surfaced as facts');
});

// ─── #30: redundancy exemption ─────────────────────────────────────────────────────────────────────
const SWATCH = (bubbleText) => `<!doctype html><html><body style="margin:0">
  <div style="margin:30px">
    <span class="wrap" style="position:relative;display:inline-block">
      <span id="sw" class="swatch" style="display:inline-block;width:36px;height:36px;background:#3a5f3a"></span>
      <span id="bub" style="display:none;position:absolute;left:0;top:-28px;background:#123;color:#fff;padding:2px 8px">${bubbleText}</span>
      <span class="name" style="display:block;font:12px sans-serif">Moss</span>
    </span>
  </div>
  <style>.swatch:hover ~ #bub, .wrap:hover #bub{display:block!important}</style>
</body></html>`;

test('#30 two-polarity: a hover bubble repeating the rest-visible local text is NOT additional content', { skip: !chromeOK, concurrency: false }, async () => {
  const res = await runTri(SWATCH('Moss'), { targetXpath: '/html/body/div[1]/span[1]/span[1]' });
  assert.equal(res.outcome.contentAppeared, true, 'the bubble did appear');
  assert.equal(res.outcome.contentIsAdditional, false, 'redundant with the visible label ⇒ not additional');
  assert.equal(res.outcome.anyPropertyFails, false, 'no facet is probed, no barrier can mint');
  assert.equal(res.valid, false, 'the experiment reports itself not valid for a barrier claim');
  const red = res.measurement.redundantWithVisibleText;
  assert.ok(red && red.redundant === true, 'the redundancy fact is surfaced in measurement');
  assert.equal(red.matchedBy, 'local-rest-text');
  assert.match(red.localTextSample || '', /moss/);
});

test('#30 two-polarity: a bubble with information absent from the local text KEEPS its obligation', { skip: !chromeOK, concurrency: false }, async () => {
  const res = await runTri(SWATCH('Ships in 3 days'), { targetXpath: '/html/body/div[1]/span[1]/span[1]' });
  assert.equal(res.outcome.contentAppeared, true);
  assert.equal(res.outcome.contentIsAdditional, true, 'novel text stays additional — the exemption never widens');
  const red = res.measurement.redundantWithVisibleText;
  assert.ok(red && red.redundant === false, 'the check ran and answered no');
});

test('#30: a bubble equal to the trigger accessible name is exempt via the accname branch', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html><body style="margin:0">
    <div style="margin:30px;position:relative">
      <button id="ic" aria-label="Download report" style="width:36px;height:36px"></button>
      <span id="bub" style="display:none;position:absolute;left:0;top:-28px;background:#123;color:#fff;padding:2px 8px">Download report</span>
    </div>
    <style>#ic:hover ~ #bub{display:block!important}</style>
  </body></html>`;
  const res = await runTri(html, { targetXpath: '/html/body/div[1]/button[1]' });
  assert.equal(res.outcome.contentIsAdditional, false, 'the bubble merely repeats the accessible name');
  const red = res.measurement.redundantWithVisibleText;
  assert.ok(red && red.redundant === true && red.matchedBy === 'trigger-accname');
});

// ─── #31: re-reveal integrity ──────────────────────────────────────────────────────────────────────
// Reveal-counter fixtures — no timers, fully deterministic. The tip OBSCURES a rest-visible paragraph
// (so Dismissible is owed, not exempt) and is repositioned over it.
//  HUSK: reveals 1-2 (initial + persistence-probe reshow) are full; every later reveal is an emptied
//        husk (the case-06-analog shape: the content's own lifecycle ended mid-probe).
//  RESTART: every reveal is full strength, but Escape does nothing and the content auto-hides while
//        held (the case-04-analog shape) — the integrity guard must NOT shield it.
const LIFECYCLE = (husk) => `<!doctype html><html><body style="margin:0">
  <style>
    #trig{display:inline-block;margin:30px;width:60px;height:30px;background:#246;color:#fff}
    #tip{display:none;position:absolute;left:20px;top:80px;width:260px;min-height:40px;background:#ffd;border:1px solid #995;padding:6px}
  </style>
  <div><span id="trig" tabindex="0">Slot B4</span></div>
  <p style="position:relative;left:20px;top:0;width:400px">Underlying paragraph the tooltip covers when open.</p>
  <div id="tip" role="tooltip">Reserved for 00:52 — confirm before the window closes.</div>
  <script>
    let reveals = 0;
    const tip = document.getElementById('tip');
    const FULL = tip.innerHTML;
    document.getElementById('trig').addEventListener('mouseenter', () => {
      reveals++;
      ${husk
        ? "tip.innerHTML = reveals <= 2 ? FULL : ''; tip.style.minHeight = reveals <= 2 ? '40px' : '4px';"
        : 'tip.innerHTML = FULL; clearTimeout(tip._t); tip._t = setTimeout(() => { tip.style.display = \'none\'; }, 2500);'}
      tip.style.display = 'block';
    });
    document.getElementById('trig').addEventListener('mouseleave', () => { tip.style.display = 'none'; });
  </script>
</body></html>`;

test('#31 pinned husk analog (case-06 shape): facets left UNMEASURED, no deterministic flag', { skip: !chromeOK, concurrency: false }, async () => {
  const res = await runTri(LIFECYCLE(true), { targetXpath: '/html/body/div[1]/span[1]' });
  assert.equal(res.outcome.contentAppeared, true);
  assert.equal(res.outcome.persistent, true, 'the original reveal survived the dwell');
  assert.ok(!('hoverable' in res.outcome), 'hoverable is UNMEASURED (absent), not false');
  assert.ok(!('dismissible' in res.outcome), 'dismissible is UNMEASURED (absent), not false');
  assert.equal(res.outcome.anyPropertyFails, false, 'unmeasured facets never feed anyPropertyFails');
  const ri = res.measurement.reshowIntegrity;
  assert.ok(ri && ri.intact === false, 'the integrity fact is surfaced');
  assert.deepEqual(ri.facetsUnmeasured.sort(), ['dismissible', 'hoverable']);
});

test('#31 pinned restart analog (case-04 shape): full-strength re-reveals stay scored — still flags', { skip: !chromeOK, concurrency: false }, async () => {
  // sample offset past the 2.5 s auto-hide so the held-state probe also records the vanish
  const res = await runTri(LIFECYCLE(false), { targetXpath: '/html/body/div[1]/span[1]', persistenceSampleOffsetsMs: [2700] });
  assert.equal(res.outcome.contentAppeared, true);
  assert.equal(res.outcome.dismissible, false, 'Escape does not dismiss the obscuring content — scored, not shielded');
  assert.equal(res.outcome.anyPropertyFails, true, 'the true catch is preserved');
  // PIN UPDATED (FN round 1, 2026-08-19). `reshowIntegrity` is now also the place a DECLARED facet deletion
  // is published, and this fixture's 2.5 s auto-hide is a TIME vanish — which no longer scores the persistent
  // facet, because "arbitrary timer" and "the information expired" are one measurement. So the artifact does
  // appear here; what the original pin was really protecting is that the HUSK shield did not fire, i.e. that
  // `hoverable`/`dismissible` stayed SCORED. Assert that directly instead of asserting the artifact's absence.
  const ri = res.measurement.reshowIntegrity;
  assert.deepEqual((ri && ri.facetsUnmeasured) || [], ['persistent'],
    'only the time-vanish facet is unmeasured — the husk shield did not fire on the other two');
  assert.ok('hoverable' in res.outcome && 'dismissible' in res.outcome,
    'both remain SCORED (present, whatever their value) — that is what the husk shield would have removed');
  assert.equal(res.measurement.vanishedWhileHeld, true, 'the held-state vanish is still recorded for the LLM facet lane');
});

// ─── #F5 (batch-3 adversarial review): the PERSISTENT facet is no longer a bare signature compare ──────
// appearedSig is `count*1e6 + textLen`, so ANY text shrink inside the revealed region used to score a
// Persistent FAILURE: a fully conformant tooltip carrying a live "minutes left" countdown minted a
// deterministic 1.4.13 barrier off one character, while the very same lifecycle correctly left the other
// two facets unmeasured. The facet now prefers the BOUND TIP'S OWN presence and, failing that, requires a
// full-strength re-reveal before scoring false. Fixtures INVENTED; the countdown re-renders at each reveal
// (the ordinary shape) so ONLY the persistent facet is affected and the isolation is clean.
const COUNTDOWN = (ticking) => `<!doctype html><html><body style="margin:0;font:14px system-ui">
  <style>
    #wrap{position:absolute;left:380px;top:60px;width:220px;height:36px}
    #trig{width:220px;height:36px;background:#26405e;color:#fff}
    #tip{display:none;position:absolute;left:0;top:36px;width:220px;height:120px;background:#fdf6d8;border:1px solid #9a8b3a}
    #wrap:hover #tip{display:block}
  </style>
  <div id="wrap" tabindex="0"><div id="trig">Basket reserved</div>
    <div id="tip" role="tooltip">Your basket is held for <span id="c">10</span> more minutes.</div></div>
  <p style="position:absolute;left:380px;top:240px;width:220px;margin:0">Items are released back to stock when the hold expires.</p>
  <script>
    const wrap = document.getElementById('wrap'), c = document.getElementById('c');
    let t = null;
    wrap.addEventListener('mouseenter', () => {
      c.textContent = '10';                       // every reveal re-renders the countdown at full strength
      clearTimeout(t);
      ${ticking ? "t = setTimeout(() => { c.textContent = '9'; }, 1400);" : ''}
    });
  </script>
</body></html>`;

test('#F5 two-polarity: a ticking countdown shrinks the signature ⇒ Persistent UNMEASURED, no barrier, samples recorded', { skip: !chromeOK, concurrency: false }, async () => {
  const res = await runTri(COUNTDOWN(true), { targetXpath: '/html/body/div[1]' });
  assert.equal(res.outcome.contentAppeared, true);
  assert.ok(!('persistent' in res.outcome), 'persistent is UNMEASURED (absent), not false');
  assert.equal(res.outcome.anyPropertyFails, false, 'one character of live text can no longer mint a 1.4.13 barrier');
  const ri = res.measurement.reshowIntegrity;
  assert.ok(ri && ri.facetsUnmeasured.includes('persistent'), 'the unmeasured facet is named in the integrity fact');
  assert.deepEqual(ri.facetsUnmeasured, ['persistent'], 'and ONLY persistent — the other two re-revealed at full strength');
  // BRANCH IDENTITY: the dwell-fail path has two exits, and this fixture must take the CHEAP one — the
  // bound tip was still rendered, so the tip's own presence settled it and no re-show was staged at all.
  // `perReshowSig: null` is what distinguishes it from the re-show-integrity exit (which hover-persistence
  // pins via the VANISHING fixture, where the tip is present-but-hidden and the re-show scores false).
  assert.equal(ri.perReshowSig, null, 'no re-show was needed — the bound tip never left the screen');
  assert.ok(Array.isArray(res.measurement.persistenceSamples) && res.measurement.persistenceSamples.length,
    'the held-state samples ran even though the dwell did not pass — the LLM facet lane keeps its evidence');
  assert.equal(res.measurement.vanishedWhileHeld, false, 'the tip never left the screen, so nothing vanished');
});

test('#F5 two-polarity: the same tooltip without the countdown is scored persistent:true', { skip: !chromeOK, concurrency: false }, async () => {
  const res = await runTri(COUNTDOWN(false), { targetXpath: '/html/body/div[1]' });
  assert.equal(res.outcome.persistent, true, 'a stable reveal is still scored, not shielded');
  assert.equal(res.outcome.anyPropertyFails, false);
  assert.ok(!res.measurement.reshowIntegrity, 'nothing was left unmeasured');
});

// TRUE CATCH preserved: the content is really gone inside the dwell and comes back at full strength on a
// fresh reveal — the removal is reproducible, so it is still scored a Persistent failure.
test('#F5 true catch: content removed while held, restored on re-reveal ⇒ persistent:false barrier', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html><body style="margin:0;font:14px system-ui">
    <style>
      #trig{position:absolute;left:380px;top:60px;width:220px;height:36px;background:#26405e;color:#fff}
      #tip{display:none;position:absolute;left:380px;top:100px;width:300px;height:90px;background:#fdf6d8;border:1px solid #9a8b3a}
    </style>
    <div id="trig" tabindex="0">Locker hold</div>
    <div id="tip" role="tooltip">Ten lockers are still held for this booking reference.</div>
    <p style="position:absolute;left:380px;top:120px;width:300px;margin:0">Lockers are released if payment is not completed.</p>
    <script>
      const trig = document.getElementById('trig'), tip = document.getElementById('tip');
      let t = null;
      trig.addEventListener('mouseenter', () => { tip.style.display = 'block'; clearTimeout(t); t = setTimeout(() => { tip.style.display = 'none'; }, 700); });
    </script>
  </body></html>`;
  // offsets straddle the 700 ms auto-hide so the held-state probe records the vanish as well
  const res = await runTri(html, { targetXpath: '/html/body/div[1]', persistenceSampleOffsetsMs: [300, 900] });
  assert.equal(res.outcome.persistent, false, 'a real timed removal that re-stages at full strength is still a failure');
  assert.equal(res.outcome.anyPropertyFails, true, 'the true catch publishes as a barrier');
  assert.equal(res.measurement.vanishedWhileHeld, true, 'and the held-state samples corroborate it');
});

// ─── #F6 (batch-3 adversarial review): the coarse retry is a fast hand, not a teleport ────────────────
// The existential retry used TWO bare mouse.moves (trigger → midpoint → tip): one hit-test per ~50-100 px,
// ≈6000 px/s. Being unbounded, it cleared REAL F95 gap barriers — a 24 px dead band a pointer genuinely
// cannot cross scored hoverable:true, decided by nothing but where the midpoint landed. Samples are now
// spaced a fixed 40 px along the path, so a band wider than one step must contain a sample. The negative
// polarity is the '#8 existential retry' test above (a 12 px band a fast hand really does jump).
const GAPPED = (gap) => `<!doctype html><html><body style="margin:0;font:14px system-ui">
  <style>
    #chip{position:absolute;left:400px;top:60px;width:180px;height:36px;background:#26405e;color:#fff}
    #pop{display:none;position:absolute;left:0;top:${36 + gap}px;width:300px;height:110px;background:#fdf6d8;border:1px solid #9a8b3a}
    #chip:hover #pop{display:block}
  </style>
  <div id="chip" tabindex="0">Delivery estimate<div id="pop" role="tooltip">Arrives Tue 12 May. Free exchanges for a fortnight.</div></div>
  <p style="margin:260px 0 0 20px">Unrelated rest-visible paragraph about shipping options.</p>
</body></html>`;

test('#F6 two-polarity: a 24 px dead band on the travel path is an F95 barrier again (coarse profile bounded)', { skip: !chromeOK, concurrency: false }, async () => {
  const res = await runTri(GAPPED(24), { targetXpath: '/html/body/div[1]' });
  assert.equal(res.outcome.contentAppeared, true);
  assert.equal(res.outcome.hoverable, false, 'neither profile can cross a band wider than one coarse step');
  assert.equal(res.outcome.anyPropertyFails, true);
  const ht = res.measurement.hoverTravel;
  assert.ok(ht && ht.continuousKept === false && ht.coarseKept === false, `both profiles lost it — got ${JSON.stringify(ht)}`);
});

test('#F6 two-polarity: a 12 px band in the SAME geometry stays reachable — the fast-hand retry survives', { skip: !chromeOK, concurrency: false }, async () => {
  const res = await runTri(GAPPED(12), { targetXpath: '/html/body/div[1]' });
  assert.equal(res.outcome.hoverable, true, 'a gap a fast hand jumps clean is not a barrier');
  assert.equal(res.outcome.anyPropertyFails, false);
  const ht = res.measurement.hoverTravel;
  assert.ok(ht && ht.continuousKept === false && ht.coarseKept === true, `the coarse retry kept it — got ${JSON.stringify(ht)}`);
});
