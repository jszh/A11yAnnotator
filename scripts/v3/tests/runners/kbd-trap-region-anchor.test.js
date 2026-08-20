// 2.1.2 — REGION IDENTIFICATION for the keyboard-trap-escape experiment (2026-08-19).
//
// The experiment decides "focus left the region", so it needs a region. It resolved one as
// `el.closest(TRAP_REGION_SEL) || el` — and that selector answers a DIFFERENT question. Its job is "is this
// container worth ENUMERATING as a trap candidate", where deliberate over-matching is harmless because a
// confirmation gate follows. As a RESOLVER it has no fallback: on a page whose confining container is a
// plain `<section class=berths>` or `<div class=carousel>` — role-less, and carrying none of the modal-ish
// class words — `closest()` returns null and the region becomes THE CONTROL ITSELF. Every sibling then sits
// outside it, so the first Tab reads as "focus left the region" and the experiment CLEARS a component that
// demonstrably loops. Root-caused twice on the corpus (residual RCA 2026-08-15) and deferred out of the
// 2026-08-19 FP batch because it changes trap MECHANICS rather than advisory reading.
//
// The replacement first looks for a real boundary under two invariants — >= 2 visible focusables inside,
// >= 1 outside — and only then falls back to the control. Invariant (2) is what makes this safe: it is
// the only thing standing between "walk up until something contains two focusables" and anchoring on
// `<body>`, where a document-wide tab ring that wraps at its end satisfies `cycledBackToStart` with no
// escape on literally every page. Those two failure directions — the false CLEAR it fixes and the
// manufactured BARRIER it must not cause — are pinned against the SAME fixture below.
//
// The fallback is KEPT, not replaced by an abstain, and that was measured rather than argued: across the 55
// corpus 2.1.2 pages, 60 of 383 visible focusables (15.7%) have no bounded group, and they are lone controls
// outside every component — a skip link, a lone submit — where "focus moves off this control" is precisely
// the claim owed. Abstaining there would have cost a sixth of the lane for no soundness gained.
//
// Fixtures INVENTED (a harbour berth-booking panel). `mech` decides the confinement, `wrapper` decides only
// what the container looks like to a selector; nothing else varies between them.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const puppeteer = require('puppeteer');
const { RUNNERS } = require('../../lib/exp-runners.js');
const { CHROME } = require('../../lib/run-experiments.js');

const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — 2.1.2 region-anchor suite SKIPPED');

// `mech`: 'cycle'   — Tab and Shift+Tab both wrap inside the panel: a real, both-directions trap.
//         'free'    — no handler at all: focus walks straight out of the panel.
//         'oneway'  — only forward Tab wraps; Shift+Tab walks out. A standard exit method EXISTS, so this
//                     is not a 2.1.2 failure — the corpus shape that the collapse used to "clear" for the
//                     wrong reason, and that must now land on INCONCLUSIVE rather than on either verdict.
// `wrapper`: 'plain' — role-less `<section class="berths">`, matches no trap-region selector.
//            'modal' — the same element with `class="modal"`, i.e. the already-validated declared path.
//            'selfmatch' — plain wrapper, but the FIELDS carry `class="popup-berth"`, so `closest()` starting
//                     at the element matched the element itself and re-created the collapse one level down.
//            'nested' — plain wrapper, each field additionally boxed in a one-focusable `<div class="cell">`
//                     that the ancestor walk must step OVER rather than anchor on.
const PANEL = (mech, wrapper = 'plain') => {
  const cls = wrapper === 'modal' ? ' class="modal"' : '';
  const fieldCls = wrapper === 'selfmatch' ? ' class="popup-berth"' : '';
  const box = (inner) => (wrapper === 'nested' ? `<div class="cell">${inner}</div>` : inner);
  return `<!doctype html><html><body style="font:14px system-ui">
  <main>
    <a href="#tides" id="before">Tide tables</a>
    <section id="berths"${cls} aria-label="Berth booking">
      <p>Choose a berth for the visiting vessel.</p>
      ${box(`<label for="vessel">Vessel</label><input id="vessel"${fieldCls} value="Kittiwake">`)}
      ${box(`<label for="nights">Nights</label><input id="nights"${fieldCls} value="3">`)}
      ${box(`<button id="hold">Hold berth</button>`)}
    </section>
    <a href="#office" id="after">Harbour office</a>
  </main>
  <script>
    // Deterministic keydown confinement — never blur/setTimeout/refocus, which races the runner's own
    // keyboard-reach probe and would let the fixture decide its own reachability by timing.
    const reg = document.getElementById('berths');
    const items = () => [...reg.querySelectorAll('input,button')];
    const MECH = ${JSON.stringify(mech)};
    if (MECH !== 'free') reg.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const f = items(), first = f[0], last = f[f.length - 1];
      if (e.shiftKey) { if (MECH === 'cycle' && document.activeElement === first) { e.preventDefault(); last.focus(); } }
      else if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  </script>
</body></html>`;
};

// Every focusable in the document lives inside the group, so there is nowhere for focus to go: "focus left
// the region" cannot be observed even in principle, whatever the region is.
const NO_OUTSIDE = `<!doctype html><html><body><main><div id="wrap">
  <label for="v">Vessel</label><input id="v"><button id="h">Hold berth</button>
</div></main><script>
  const reg = document.getElementById('wrap');
  reg.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const f = [...reg.querySelectorAll('input,button')], first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
</script></body></html>`;

// An ORDINARY page: no confinement anywhere, and the target sits alone in its own wrapper so the ancestor
// walk is forced to climb. The tab ring wraps at the end of the document, as every tab ring does.
const ORDINARY = `<!doctype html><html><body><main>
  <a href="#a" id="before">Tide tables</a>
  <div class="cell"><label for="v">Vessel</label><input id="v"></div>
  <div class="cell"><label for="n">Nights</label><input id="n"></div>
  <a href="#b" id="after">Harbour office</a>
</main></body></html>`;

async function runTrap(html, targetXpath) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', timeout: 60000, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    return await RUNNERS['keyboard-trap-escape'](page, { candidateId: 'c-reg', targetXpath });
  } finally { await browser.close(); }
}

const XP_PLAIN = '/html/body/main[1]/section[1]/input[1]';
const XP_NESTED = '/html/body/main[1]/section[1]/div[1]/input[1]';

// ---------------------------------------------------------------------------------------------------
// The defect itself
// ---------------------------------------------------------------------------------------------------

test('2.1.2 a role-less container that traps focus is a BARRIER, not a clear', { skip: !chromeOK, concurrency: false }, async () => {
  const r = await runTrap(PANEL('cycle', 'plain'), XP_PLAIN);
  const m = r.measurement;
  assert.equal(m.regionAnchor, 'focusable-group-ancestor', 'no selector matched, so the anchor was inferred');
  assert.equal(m.regionFocusableCount, 3, 'and it is the SECTION — three fields — not the input it was called on');
  assert.equal(m.tabEscapes, false, 'forward Tab never leaves the section');
  assert.equal(m.shiftEscapes, false, 'nor does Shift+Tab');
  assert.equal(m.cycledBackToStart, true, 'it returns to where it started: a loop');
  assert.equal(r.outcome.trapProven, true, 'which is the verdict the collapsed region could never reach');
  assert.equal(r.outcome.escapeProvenForWidget, false, 'and it must not simultaneously claim an escape');
});

test('2.1.2 the DECLARED-region path is left exactly as it was', { skip: !chromeOK, concurrency: false }, async () => {
  // Same page, same mechanism — only `class="modal"` differs, so `closest()` hits. This is the path the
  // audit already validated; the repair is a fallback and must be invisible here.
  const r = await runTrap(PANEL('cycle', 'modal'), XP_PLAIN);
  assert.equal(r.measurement.regionAnchor, 'trap-region-selector', 'the declared selector still wins');
  assert.equal(r.outcome.trapProven, true, 'with the same verdict the plain wrapper now also reaches');
});

test('2.1.2 a control whose OWN class is modal-ish does not become its own region', { skip: !chromeOK, concurrency: false }, async () => {
  // `closest()` starts AT the element, so `<input class="popup-berth">` matched itself and the region
  // collapsed onto one control — the same bug, reached by a different route, and invisible to a fixture
  // that only ever varies the wrapper. The search now starts at the parent.
  const r = await runTrap(PANEL('cycle', 'selfmatch'), XP_PLAIN);
  assert.notEqual(r.measurement.regionFocusableCount, 1, 'the region is never the control under test');
  assert.equal(r.measurement.regionFocusableCount, 3, 'it is the section holding all three fields');
  assert.equal(r.outcome.trapProven, true, 'so the confinement is still proven');
});

test('2.1.2 the ancestor walk steps over one-focusable boxes', { skip: !chromeOK, concurrency: false }, async () => {
  // Invariant (1) restated: a `<div class="cell">` wrapping a single field is not a boundary — anchoring
  // there reproduces the collapse one level up from the control.
  const r = await runTrap(PANEL('cycle', 'nested'), XP_NESTED);
  assert.equal(r.measurement.regionFocusableCount, 3, 'the walk climbed past the single-field cell');
  assert.equal(r.outcome.trapProven, true);
});

// ---------------------------------------------------------------------------------------------------
// The direction the repair must NOT move — a wider region makes "focus never left" easier to satisfy
// ---------------------------------------------------------------------------------------------------

test('2.1.2 the SAME container without a confinement still clears', { skip: !chromeOK, concurrency: false }, async () => {
  const r = await runTrap(PANEL('free', 'plain'), XP_PLAIN);
  assert.equal(r.measurement.regionAnchor, 'focusable-group-ancestor', 'same inferred anchor as the trapping page');
  assert.equal(r.measurement.tabEscapes, true, 'focus simply walks out');
  assert.equal(r.outcome.escapeProvenForWidget, true, 'so the escape is proven, not merely unobserved');
  assert.equal(r.outcome.trapProven, false, 'and no trap is manufactured out of the widened region');
});

test('2.1.2 an ordinary page whose tab ring wraps is not a trap', { skip: !chromeOK, concurrency: false }, async () => {
  // The failure mode invariant (2) exists to prevent. Every focusable here lives under `<main>`, so an
  // unbounded walk anchors there and the page reads as: focus never left the region (there is no outside)
  // and it came back to where it started (rings wrap) — a confirmed trap on every page in the corpus.
  // Invariant (2) rejects `<main>`, the walk finds nothing bounded, and the control fallback answers the
  // per-control question correctly. The target is alone in its `.cell`, so the walk genuinely climbed.
  const r = await runTrap(ORDINARY, '/html/body/main[1]/div[1]/input[1]');
  const m = r.measurement;
  assert.equal(m.regionAnchor, 'control-fallback', 'no bounded group exists, and <main> is not allowed to be one');
  assert.notEqual(m.regionFocusableCount, m.docFocusableCount, 'the anchor never swallows the whole document');
  assert.equal(r.outcome.trapProven, false, 'so a wrapping tab ring is not read as a loop');
  assert.equal(r.outcome.escapeProvenForWidget, true, 'and focus demonstrably moves off the control');
});

// ---------------------------------------------------------------------------------------------------
// Abstention
// ---------------------------------------------------------------------------------------------------

test('2.1.2 a group holding every focusable is refused, and the claim drops to control scale', { skip: !chromeOK, concurrency: false }, async () => {
  // Two focusables in the document, both inside the group: "focus left the region" is unobservable for that
  // group however it is reached, so invariant (2) refuses it and the fallback answers the smaller question
  // it CAN answer — focus moves off this control. That is the honest scope, and the label says so, which is
  // the point of reporting the anchor at all. The group-scale claim on such a page is the kbd-graph
  // instruments' to make; this experiment climbs from one control and must not pretend otherwise.
  const r = await runTrap(NO_OUTSIDE, '/html/body/main[1]/div[1]/input[1]');
  const m = r.measurement;
  assert.equal(m.regionAnchor, 'control-fallback', 'the enclosing group is not an admissible boundary');
  assert.equal(m.regionFocusableCount, 0, 'so the region is the control — an <input> has no focusable descendants');
  assert.equal(r.outcome.trapProven, false, 'and no region-scale trap is asserted from a control-scale probe');
});

// ---------------------------------------------------------------------------------------------------
// The corpus shape this was root-caused on
// ---------------------------------------------------------------------------------------------------

test('2.1.2 a one-way loop with a working reverse exit is INCONCLUSIVE, not a barrier', { skip: !chromeOK, concurrency: false }, async () => {
  // ACT a1b64e requires escape in ONE direction only, so a component whose forward Tab wraps but whose
  // Shift+Tab walks out is not a 2.1.2 failure. It is exactly the shape the collapsed region used to
  // "clear" — for the wrong reason, since it cleared before observing either direction. With a real region
  // the two sweeps disagree, and `oneWayConflict` withholds both verdicts. Getting the RIGHT answer here is
  // what stops the repair from trading a false clear for a false barrier.
  const r = await runTrap(PANEL('oneway', 'plain'), XP_PLAIN);
  const m = r.measurement;
  assert.equal(m.regionAnchor, 'focusable-group-ancestor');
  assert.equal(m.tabEscapes, false, 'forward Tab wraps inside the panel');
  assert.equal(m.shiftEscapes, true, 'Shift+Tab leaves it — a standard exit method that works');
  assert.equal(m.oneWayConflict, true);
  assert.equal(r.outcome.trapProven, false, 'so no trap is asserted');
  assert.equal(r.outcome.escapeProvenForWidget, false, 'and the disagreement is not laundered into a clear');
});
