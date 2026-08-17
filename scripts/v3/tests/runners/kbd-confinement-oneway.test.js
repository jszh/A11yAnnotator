// FIXES: detectFixedSetConfinementTraps (kbd-graph.js) —
//  (1) BACKWARD-GATE MIRROR: the old gate required the ENTIRE backward sequence to sit inside S, but every
//      backward sweep enters from the document boundary through the page's LAST focusable (outside S), so a
//      genuine both-direction trap was declined. The gate now mirrors the forward logic (confinement from the
//      first in-S stop onward).
//  (2) ONE-WAY CONFINEMENT REVIEW finding (`onewayTraps`, kind keyboard-trap-oneway): a forward loop that
//      walls off later content falls between the two existing lanes (no TRAP_REGION_SEL match; both-directions
//      required by design). Emitted from data the sweep already collects; both-direction confinement (modals)
//      must take the existing lane and never emit it.
//  (3) tryAdvised WIDENING: verb-first advisories ("To VERB …, press Ctrl+Alt+X") and multi-modifier combos.
//
// Fixtures are INVENTED inline HTML — nothing from any eval corpus.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { detectFixedSetConfinementTraps } = require('../../lib/kbd-graph.js');
const { CHROME } = require('../../lib/run-experiments.js');
const puppeteer = require('puppeteer');

const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — kbd-confinement-oneway SKIPPED');

// MACHINE-CONTENTION LAUNCH: one browser at a time (concurrency:false on every test); on the WS-endpoint
// timeout that heavy parallel Chrome load produces, wait 60s and retry (max 3 attempts).
async function launch() {
  for (let attempt = 1; ; attempt++) {
    try {
      return await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    } catch (e) {
      const msg = String((e && e.message) || e);
      if (attempt < 3 && /WS endpoint URL/i.test(msg)) { await new Promise((r) => setTimeout(r, 60000)); continue; }
      throw e;
    }
  }
}

async function confinement(html) {
  const browser = await launch();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    return await detectFixedSetConfinementTraps(page);
  } finally { await browser.close(); }
}

// A panel walled in BOTH directions (Tab on the last member loops to the first; Shift+Tab on the first loops
// to the last), sitting BETWEEN outside content — so the backward sweep enters through the page's last
// focusable, which is OUTSIDE the trapped set. Exactly the shape the old backward gate could never pass.
const BOTH_WAYS = (extra = '') => `<!doctype html><html><body><main>
  <a href="#top" id="top">Skip to content</a>
  <section id="panel">
    <button id="p1">First step</button>
    <button id="p2">Second step</button>
    <button id="p3">Third step</button>
  </section>
  <a href="#end" id="end">Continue to summary</a>
  ${extra}
  <script>
    document.getElementById('p3').addEventListener('keydown', function (e) {
      if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); document.getElementById('p1').focus(); }
    });
    document.getElementById('p1').addEventListener('keydown', function (e) {
      if (e.key === 'Tab' && e.shiftKey) { e.preventDefault(); document.getElementById('p3').focus(); }
    });
  </script>
</main></body></html>`;

test('backward-gate mirror: a both-direction trap whose backward sweep ENTERS from outside S is now CONFIRMED', { skip: !chromeOK, concurrency: false }, async () => {
  const res = await confinement(BOTH_WAYS());
  assert.equal(res.traps.length, 1, 'the both-direction confinement is confirmed');
  assert.equal(res.traps[0].sc, '2.1.2');
  assert.equal(res.traps[0].setSize, 3, 'the trapped set is the three panel buttons');
  assert.deepEqual(res.traps[0].memberXpaths.slice().sort(), [1, 2, 3].map((i) => `/html/body/main[1]/section[1]/button[${i}]`), 'the members are the panel buttons');
  assert.equal(res.traps[0].deterministicTrapConfirmed, true);
  assert.equal(res.traps[0].lyingAdvisory, false, 'no advisory on this page');
  assert.ok(!res.onewayTraps, 'a BOTH-direction confinement must NOT also emit the one-way REVIEW finding');
});

test('escape guard still holds under the mirrored gate: a both-direction region released by Escape is NOT flagged (and emits no one-way finding)', { skip: !chromeOK, concurrency: false }, async () => {
  const escapable = BOTH_WAYS(`<script>
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { document.getElementById('end').focus(); }
    });
  </script>`);
  const res = await confinement(escapable);
  assert.equal(res.traps.length, 0, 'Escape frees focus, so this is not a 2.1.2 confinement');
  assert.ok(!res.onewayTraps, 'an escapable region emits no one-way finding either');
});

// A forward-only loop: Tab on the last group member returns to the first (walling off the two links after the
// group), while Shift+Tab is untouched — focus escapes backward. Falls between detectKeyboardTraps (no
// TRAP_REGION_SEL match) and the both-directions-by-design confinement lane.
const ONE_WAY = `<!doctype html><html><body><main>
  <a href="#top" id="intro">Overview</a>
  <div id="group">
    <button id="g1">Alpha option</button>
    <button id="g2">Beta option</button>
    <button id="g3">Gamma option</button>
  </div>
  <a href="#x" id="after1">Contact us</a>
  <a href="#y" id="after2">Privacy notice</a>
  <script>
    document.getElementById('g3').addEventListener('keydown', function (e) {
      if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); document.getElementById('g1').focus(); }
    });
  </script>
</main></body></html>`;

test('one-way forward loop: emits the keyboard-trap-oneway REVIEW finding with the unreached focusables, and NO confirmed trap', { skip: !chromeOK, concurrency: false }, async () => {
  const res = await confinement(ONE_WAY);
  assert.equal(res.traps.length, 0, 'a one-way loop is NOT a confirmed both-direction confinement');
  assert.ok(Array.isArray(res.onewayTraps) && res.onewayTraps.length === 1, 'exactly one one-way REVIEW finding');
  const ow = res.onewayTraps[0];
  assert.equal(ow.sc, '2.1.2');
  assert.equal(ow.kind, 'keyboard-trap-oneway');
  assert.equal(ow.review, true, 'REVIEW severity — never an authoritative barrier');
  assert.equal(ow.direction, 'forward');
  assert.equal(ow.setSize, 3);
  assert.deepEqual(ow.memberXpaths.slice().sort(), [1, 2, 3].map((i) => `/html/body/main[1]/div[1]/button[${i}]`), 'the confined set is the three group buttons');
  assert.equal(ow.unreachedCount, 2, 'both links after the loop are walled off');
  const unreached = ow.unreached.map((u) => `${u.tag}:${u.label}`).sort();
  assert.deepEqual(unreached, ['a:Contact us', 'a:Privacy notice'], 'unreached focusables carry tag + accessible name');
  assert.ok(ow.unreached.length <= 5, 'unreached list is capped');
});

test('tryAdvised widening (verb-first + multi-modifier): a WORKING "To leave …, press Ctrl+Alt+Q" advisory clears the trap', { skip: !chromeOK, concurrency: false }, async () => {
  // The gap is deliberately LONG (8 words): real advisories name both the region left and the destination,
  // and a short-gap bound silently under-matched exactly that shape (leak-audit finding O3).
  const advisedWorks = `<!doctype html><html><body><main>
    <p>To leave the editor pane and rejoin the article list, press Ctrl+Alt+Q.</p>
    <a href="#s" id="start">Start here</a>
    <div id="ed">
      <button id="e1">Bold</button>
      <button id="e2">Italic</button>
    </div>
    <a href="#d" id="done">Finish</a>
    <script>
      document.getElementById('e2').addEventListener('keydown', function (e) {
        if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); document.getElementById('e1').focus(); }
      });
      document.getElementById('e1').addEventListener('keydown', function (e) {
        if (e.key === 'Tab' && e.shiftKey) { e.preventDefault(); document.getElementById('e2').focus(); }
      });
      document.addEventListener('keydown', function (e) {
        if (e.ctrlKey && e.altKey && (e.code === 'KeyQ' || String(e.key).toLowerCase() === 'q')) { document.getElementById('done').focus(); }
      });
    </script>
  </main></body></html>`;
  const res = await confinement(advisedWorks);
  assert.equal(res.traps.length, 0, 'the documented verb-first multi-modifier exit works ⇒ not a barrier');
  assert.ok(!res.onewayTraps, 'a cleared advisory emits no one-way finding');
});

test('tryAdvised widening (press-first + multi-modifier): an advertised "Press Ctrl+Alt+Q to exit" that does NOTHING is a lying advisory', { skip: !chromeOK, concurrency: false }, async () => {
  const advisedLies = `<!doctype html><html><body><main>
    <p>Press Ctrl+Alt+Q to exit the editor.</p>
    <a href="#s" id="start">Start here</a>
    <div id="ed">
      <button id="e1">Bold</button>
      <button id="e2">Italic</button>
    </div>
    <a href="#d" id="done">Finish</a>
    <script>
      document.getElementById('e2').addEventListener('keydown', function (e) {
        if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); document.getElementById('e1').focus(); }
      });
      document.getElementById('e1').addEventListener('keydown', function (e) {
        if (e.key === 'Tab' && e.shiftKey) { e.preventDefault(); document.getElementById('e2').focus(); }
      });
    </script>
  </main></body></html>`;
  const res = await confinement(advisedLies);
  assert.equal(res.traps.length, 1, 'the confinement is confirmed');
  assert.equal(res.traps[0].lyingAdvisory, true, 'the multi-modifier advisory was parsed, pressed, and proven NOT to free focus');
});
