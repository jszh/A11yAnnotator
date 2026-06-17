// Regression cases for docs/audits/HARDCODED-JUDGMENTS-WCAG-AUDIT.md (Round-3 empirical campaign).
//
// Each test runs the REAL runner/detector code over a fixture and asserts the WCAG-2.2-correct outcome.
// Two flavors:
//   • CORRECT-GUARD — the harness already matches WCAG here; a change is a regression (hard pass).
//   • KNOWN-GAP (marked `{ todo: '…fix at file:line' }`) — the harness is CURRENTLY WRONG per the audit,
//     so the assertion below (the WCAG-correct outcome) FAILS today. node:test reports it as `todo`, not a
//     hard failure, so the suite stays green while the gap stays VISIBLE in the summary (`# todo N`). The
//     `todo` reason names the file:line the BUILDER should change. When the fix lands, the assertion passes
//     — delete the `{ todo }` flag to convert it into a permanent guard.
//
// This polarity is deliberate: a green KNOWN-GAP would have hidden a live defect and turned RED on the fix.
// Asserting the CORRECT behavior under `todo` keeps "10 known WCAG gaps" honest in the output.
//
// Some todo assertions use `>= 1` rather than an exact count where the post-fix count depends on which fix
// the builder chooses (noted per case). All findings here are NON-AUTHORITATIVE in production
// (shadow / barrier-only / calibrated:false); these tests assert instrument behavior, not published verdicts.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer');

const { visualOrderDivergence } = require('../lib/order-check.js');
const A = require('../../lib/a11y-eval.js');
const { RUNNERS } = require('../lib/exp-runners.js');
const { detectStatusMessages } = require('../lib/status-detector.js');
const { detectKeyboardTraps } = require('../lib/kbd-graph.js');
const { CHROME } = require('../lib/run-experiments.js');

const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — regression-wcag-method browser suite SKIPPED');
const FX = (n) => 'file://' + path.join(__dirname, 'fixtures', 'wcag-method', n);

async function withPage(fixture, fn) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try { const page = await browser.newPage(); await page.goto(FX(fixture), { waitUntil: 'load' }); return await fn(page); }
  finally { await browser.close(); }
}
const run = (page, id, xpath) => RUNNERS[id](page, { candidateId: 'c1', targetXpath: xpath, environment: 'test' });
// a browser KNOWN-GAP: needs Chrome AND is a documented gap ⇒ todo with a fix pointer (skips if no Chrome).
const gap = (reason) => ({ todo: reason, skip: !chromeOK, concurrency: false });
const guard = { skip: !chromeOK, concurrency: false };

// =====================================================================================
// B1 — order-check JUMP threshold (1.3.2 / 2.4.3). Pure JS. (audit §B1)
// FIX: scripts/v3/lib/order-check.js:64 (JUMP=max(3,round(0.25n))) + :68 (strict `>`). Replace with a
//      within-column `delta >= 1` backward check, or BAGEL's FuncSet-entry-multiplicity test (§5.1.1).
// =====================================================================================
const colItem = (visualRank, label) => ({ xpath: '/x' + visualRank, label, rect: { x: 0, y: visualRank * 30, w: 100, h: 20 } });

test('B1 CORRECT-GUARD: a large hoist (footer to visual top of a 5-item column) IS flagged', () => {
  const reading = [colItem(1, 'a'), colItem(2, 'b'), colItem(3, 'c'), colItem(4, 'd'), colItem(0, 'footer')];
  assert.equal(visualOrderDivergence(reading, { sc: '1.3.2', kind: 'reading-order' }).findings.length, 1);
});

test('B1 CORRECT-GUARD: false-positive guards hold (2-column main+sidebar is NOT flagged)', () => {
  const items = [];
  for (let i = 0; i < 5; i++) items.push({ xpath: '/m' + i, label: 'm' + i, rect: { x: 0, y: i * 40, w: 400, h: 30 } });
  for (let i = 0; i < 3; i++) items.push({ xpath: '/s' + i, label: 's' + i, rect: { x: 420, y: i * 40, w: 140, h: 30 } });
  assert.equal(visualOrderDivergence(items, { sc: '1.3.2', kind: 'reading-order' }).findings.length, 0);
});

test('B1 GUARD (was KNOWN-GAP; fixed by A5): an adjacent transposition (delta=1) in a 6-item column is flagged', () => {
  const reading = [0, 1, 3, 2, 4, 5].map((vr) => colItem(vr, 'i' + vr)); // neighbors 2,3 transposed
  // A5: a within-column delta≥1 backward step is flagged (the floor-of-3 + strict `>` hole is gone).
  const r = visualOrderDivergence(reading, { sc: '1.3.2', kind: 'reading-order' });
  assert.ok(r.findings.length >= 1);
  assert.ok(r.findings.every((f) => f.review === true && f.calibrated === false), 'order findings are quarantined as uncalibrated triage');
});

test('B1 GUARD (was KNOWN-GAP; fixed by A5): a fully-reversed 4-item column is flagged (n≤4 dead zone)', () => {
  const reversed = [3, 2, 1, 0].map((vr) => colItem(vr, 'i' + vr));
  assert.ok(visualOrderDivergence(reversed, { sc: '1.3.2', kind: 'reading-order' }).findings.length >= 1);
});

// =====================================================================================
// §A — target-size + large-text constants (pure JS). CORRECT-GUARD only. (audit §A)
// =====================================================================================
test('A CORRECT-GUARD: 2.5.8 target-size geometry — 24px / 12px-radius circle is exact', () => {
  assert.equal(A.evalTargetSize({ x: 0, y: 0, w: 24, h: 24 }, { squareFits: true }).verdict, 'pass');
  assert.notEqual(A.evalTargetSize({ x: 0, y: 0, w: 23, h: 23 }, {}).verdict, 'pass');
  const undersized = { x: 0, y: 0, w: 20, h: 20 }; // circle centred at (10,10), r=12
  assert.notEqual(A.evalTargetSize(undersized, { neighbors: [{ x: 18, y: 0, w: 200, h: 4 }] }).verdict, 'pass', 'circle∩rect despite >24px centre gap');
  assert.equal(A.evalTargetSize(undersized, { neighbors: [{ x: 60, y: 0, w: 10, h: 10 }] }).verdict, 'pass', 'far neighbor ⇒ spacing exception');
});

test('A CORRECT-GUARD: 1.4.3 large-text boundary + threshold are exact (24px / 18.6667px-bold)', () => {
  assert.equal(A.isLargeText(24, 400), true);
  assert.equal(A.isLargeText(23.99, 400), false);
  assert.equal(A.isLargeText(18.6667, 700), true);
  assert.equal(A.isLargeText(18.0, 700), false);
  assert.equal(A.isLargeText(18.6667, 699), false);
  assert.equal(A.contrastThresholdFor(24, 400), 3.0);
  assert.equal(A.contrastThresholdFor(23, 400), 4.5);
});

// =====================================================================================
// B2 — 1.4.3 contrast pixel-uniformity tolerances (browser). (audit §B2)
// FIX: scripts/v3/lib/exp-runners.js runTextContrastPixel (~:271-272) — when the pixelAgrees gap > 0,
//      compute the ratio against analyzeBackdrop's RENDERED mean (px.r/g/b), not a.bgColor (the CSS base).
// =====================================================================================
test('B2 GUARD (was KNOWN-GAP; fixed by A1): a true 3.64:1 contrast must NOT clear', guard, async () => {
  const r = await withPage('b2-contrast-false-clear.html', (p) => run(p, 'text-contrast-pixel', "//*[@id='t']"));
  // white-on-rendered-gray134 = 3.64:1 < 4.5 ⇒ thresholdMet false. A1: the ratio is now computed against
  // the rendered backdrop's worst-case extreme (exp-runners.js worstContrast), not the CSS base.
  assert.equal(r.outcome.thresholdMet, false);
});

test('B2 CORRECT-GUARD: a 17/channel disagreement (just past the tolerance) is REJECTED', guard, async () => {
  const r = await withPage('b2-contrast-gap17-rejects.html', (p) => run(p, 'text-contrast-pixel', "//*[@id='t']"));
  assert.equal(r.outcome.contrastComputable, false);
  assert.equal(r.outcome.thresholdMet, false);
});

// =====================================================================================
// B5 — 1.4.3 false barriers from ACT afw4f7 (audit §B5; docs/analysis/V3-ACT-WORKLIST.md).
// FIX (exp-runners.js measureContrast): (1) a text-shadow / -webkit-text-stroke GLYPH EFFECT is part of the
//   rendered glyph and can PROVIDE contrast (a white shadow halo lifts a 4.43:1 case to an ACT PASS); the
//   flat fg/bg model cannot account for it ⇒ contrastComputable:false (abstain → the vision rubric, which
//   no static tool decides). (2) text in a DISABLED context (a disabled control, a [disabled]/[aria-disabled]
//   ancestor, or a label NAMING a disabled widget) is 1.4.3-INAPPLICABLE ⇒ notExemptText:false. A BARRIER
//   requires BOTH contrastComputable AND notExemptText (catalog.js:49), so these abstain rather than flag.
// =====================================================================================
test('B5 GUARD (was KNOWN-GAP; fixed): a contrast-lifting text-shadow must NOT be hard-failed (abstain → vision lane)', guard, async () => {
  const r = await withPage('b5-contrast-textshadow-false-barrier.html', (p) => run(p, 'text-contrast-pixel', "//*[@id='t']"));
  assert.equal(r.outcome.contrastComputable, false); // glyph effect ⇒ not soundly computable
  assert.equal(r.outcome.thresholdFailed, false);    // no false BARRIER; hands off to the vision rubric
});

test('B5 CORRECT-GUARD: the same fg/bg with NO glyph effect (genuine 4.43:1) IS still a barrier', guard, async () => {
  const r = await withPage('b5-contrast-noshadow-control.html', (p) => run(p, 'text-contrast-pixel', "//*[@id='t']"));
  assert.equal(r.outcome.thresholdFailed, true); // guards against an over-broad fix that abstains on all near-threshold text
});

test('B5 GUARD: pure-symbol text is non-language (1.4.3 inapplicable); worded/numeric low-contrast still fails', guard, async () => {
  // ACT afw4f7 Passed Example 6: "----====++++..." conveys nothing in a human language ⇒ exempt.
  const sym = await withPage('b5-contrast-nonlanguage.html', (p) => run(p, 'text-contrast-pixel', "//*[@id='symbols']"));
  assert.equal(sym.outcome.notExemptText, false, 'a pure-symbol run is exempt ⇒ no BARRIER');
  // GUARD (no over-exemption): letters AND digits both express meaning at the same 3.66:1 — still flagged.
  for (const id of ['worded', 'numeric']) {
    const r = await withPage('b5-contrast-nonlanguage.html', (p) => run(p, 'text-contrast-pixel', `//*[@id='${id}']`));
    assert.equal(r.outcome.notExemptText, true, `${id}: worded/numeric text is NOT exempt`);
    assert.equal(r.outcome.thresholdFailed, true, `${id}: 3.66:1 worded/numeric text still fails the threshold`);
  }
});

test('B5 GUARD: text in a DISABLED context is 1.4.3-inapplicable (notExemptText:false); enabled low-contrast still barriers', guard, async () => {
  // disabled fieldset ancestor, aria-disabled group ancestor, and a label NAMING a disabled widget — all exempt.
  for (const id of ['lbl_fieldset', 'lbl_aria', 'lbl_target']) {
    const r = await withPage('b5-contrast-disabled-context.html', (p) => run(p, 'text-contrast-pixel', `//*[@id='${id}']`));
    assert.equal(r.outcome.notExemptText, false, `${id}: disabled-context text is exempt ⇒ no BARRIER (notExemptText gates it)`);
  }
  // GUARD (no over-exemption): the same #888-on-white run with NO disabled context IS a real barrier.
  const enabled = await withPage('b5-contrast-disabled-context.html', (p) => run(p, 'text-contrast-pixel', "//*[@id='lbl_enabled']"));
  assert.equal(enabled.outcome.notExemptText, true, 'enabled text is NOT exempt');
  assert.equal(enabled.outcome.thresholdFailed, true, 'enabled 3.55:1 text still fails the threshold (no over-exemption)');
});

// =====================================================================================
// B6 — ACT afw4f7 Passed Example 7 (1.4.3 false barrier, worklist v2 §B). A lone visible letter on a
// widget whose accessible name is supplied SEPARATELY (aria-label) is a decorative icon glyph, not
// human-language text ⇒ notExemptText:false. FIX: exp-runners.js measureContrast `singleCharIcon`.
// =====================================================================================
test('B6 GUARD (was worklist-v2 §B false barrier; fixed): a single-letter icon (aria-label override) is 1.4.3-inapplicable', guard, async () => {
  const r = await withPage('b6-contrast-icon-glyph.html', (p) => run(p, 'text-contrast-pixel', "//*[@id='close']"));
  assert.equal(r.outcome.thresholdFailed, true, 'the X really is below 4.5:1 (3.66:1) — the gate is exemption, not the ratio');
  assert.equal(r.outcome.notExemptText, false, 'a lone "X" whose name is "Close" (aria-label) is a decorative icon ⇒ no BARRIER');
});
test('B6 CORRECT-GUARD: single low-contrast letters that ARE content still barrier (no over-exemption)', guard, async () => {
  // an A–Z index link whose name derives from its own content "A"
  const idx = await withPage('b6-contrast-icon-glyph.html', (p) => run(p, 'text-contrast-pixel', "//*[@id='index']"));
  assert.equal(idx.outcome.notExemptText, true, 'a single letter that IS the content (no overriding name) is NOT exempt');
  // the glyph and the aria-label are the SAME character ⇒ the name does not override the glyph
  const same = await withPage('b6-contrast-icon-glyph.html', (p) => run(p, 'text-contrast-pixel', "//*[@id='named-same']"));
  assert.equal(same.outcome.notExemptText, true, 'aria-label equal to the glyph is content, not an icon — NOT exempt');
  // a multi-character worded button is still readable language
  const word = await withPage('b6-contrast-icon-glyph.html', (p) => run(p, 'text-contrast-pixel', "//*[@id='word']"));
  assert.equal(word.outcome.notExemptText, true, 'only a length-1 glyph is exempt; a worded button stays checked');
});
test('B6 GUARD (was worklist-v2 §B false barrier; fixed): a pre-existing field-referenced static error IS identified (3.3.1)', guard, async () => {
  // ACT 36b590 Passed Example 1 — number field pre-set to an invalid 0 with a referenced, error-styled message.
  const r = await withPage('b6-error-static-referenced.html', (p) => run(p, 'form-error-probe', "//*[@id='age']"));
  assert.equal(r.valid, true, 'the constrained number field is applicable');
  assert.equal(r.outcome.errorNotIdentified, false, 'a referenced, error-styled, already-visible message identifies the error ⇒ no BARRIER');
});
test('B6 CORRECT-GUARD: a referenced PLAIN HINT (not error-styled) is NOT mistaken for error identification', guard, async () => {
  const r = await withPage('b6-error-static-referenced.html', (p) => run(p, 'form-error-probe', "//*[@id='email2']"));
  assert.equal(r.outcome.errorNotIdentified, true, 'an unchanged, non-error-styled aria-describedby hint must not clear a real barrier');
});

// =====================================================================================
// B3 — 4.1.3 status-message rule (browser). (audit §B3)
// FIX: scripts/v3/lib/status-detector.js — :55 selector (button-only) widen to other activatable controls;
//      :24/:57 maxTriggers=12 cap raise/record; :91-105 add a disclosure/tab exclusion (skip when the
//      inserted node is inside the trigger's aria-controls target while aria-expanded toggles true, or is
//      role=tabpanel for the trigger's tab).
// =====================================================================================
test('B3 CORRECT-GUARD: a genuinely un-announced status IS flagged; a live-region status is NOT', guard, async () => {
  const barrier = await withPage('b3-status-true-barrier.html', (p) => detectStatusMessages(p, {}));
  assert.equal(barrier.findings.length, 1);
  assert.equal(barrier.findings[0].sc, '4.1.3');
  const ok = await withPage('b3-status-live-region-ok.html', (p) => detectStatusMessages(p, {}));
  assert.equal(ok.findings.length, 0);
});

test('B3 GUARD (was KNOWN-GAP; fixed by A4): a lazy-inserted disclosure body (primary content) is NOT flagged', guard, async () => {
  const r = await withPage('b3-status-disclosure-fp.html', (p) => detectStatusMessages(p, {}));
  // A4: a control that expands its own aria-controls target (aria-expanded→true) renders primary content,
  // not a status — the disclosure/tab exclusion drops it.
  assert.equal(r.findings.length, 0);
});

test('B3 GUARD (was KNOWN-GAP; fixed by A4): a real barrier on the 15th button is found at the default cap', guard, async () => {
  const def = await withPage('b3-status-cap-fn.html', (p) => detectStatusMessages(p, {}));
  assert.equal(def.findings.length, 1); // A4: default cap raised to 25 (was 12) ⇒ button[15] is probed
});

test('B3 CORRECT-GUARD: lifting the cap proves the 15th button IS the cause', guard, async () => {
  const lifted = await withPage('b3-status-cap-fn.html', (p) => detectStatusMessages(p, { maxTriggers: 20 }));
  assert.equal(lifted.findings.length, 1, 'with maxTriggers=20 the barrier on button[15] is found');
});

test('B3 GUARD (was KNOWN-GAP; fixed by A4): un-announced statuses behind non-button triggers are found', guard, async () => {
  const r = await withPage('b3-status-nonbutton-fn.html', (p) => detectStatusMessages(p, {}));
  // A4: the pass-1 selector now includes checkbox/radio/switch/tab/menuitem/link, so the link/checkbox/tab
  // triggers are probed (was 0: never probed).
  assert.ok(r.findings.length >= 1);
});

// =====================================================================================
// B4 — 3.3.1 error-identification heuristics (browser). (audit §B4)
// FIX: scripts/v3/lib/exp-runners.js probeFormError (:393-395 ERR_TEXT/reddish, :460 decision) — a surfaced,
//      field-associated message that newly appears on invalid submit should be INCONCLUSIVE (defer to the
//      LLM/vision lane), never errorNotIdentified=true; drop the reddish()/ERR_TEXT signals from the decision.
// =====================================================================================
test('B4 CORRECT-GUARD: an English in-text identification is NOT a barrier', guard, async () => {
  const r = await withPage('b4-error-english-ok.html', (p) => run(p, 'form-error-probe', "//*[@id='t']"));
  assert.equal(r.valid, true);
  assert.equal(r.outcome.errorNotIdentified, false);
});

for (const [fx, lang] of [['b4-error-spanish-fb.html', 'Spanish'], ['b4-error-german-fb.html', 'German'], ['b4-error-japanese-fb.html', 'Japanese']]) {
  test(`B4 GUARD (was KNOWN-GAP; fixed by A2): a ${lang} in-text identification must NOT be barriered`, guard, async () => {
    const r = await withPage(fx, (p) => run(p, 'form-error-probe', "//*[@id='t']"));
    // A2: identification is a newly-surfaced, field-associated visible TEXT message (form-contained here),
    // language-agnostic — the English-only ERR_TEXT keyword + reddish() colour are no longer the decider.
    assert.equal(r.valid, true);
    assert.equal(r.outcome.errorNotIdentified, false);
  });
}

test('B4 CORRECT-GUARD: a color-only cue (no text) IS a barrier', guard, async () => {
  const r = await withPage('b4-error-coloronly-barrier.html', (p) => run(p, 'form-error-probe', "//*[@id='t']"));
  assert.equal(r.outcome.errorNotIdentified, true);
});

// =====================================================================================
// L5 — 2.1.2 keyboard-trap: the RUNNER false-clears a role-less trap the DETECTOR catches. (audit §D)
// FIX: scripts/v3/lib/exp-runners.js:733 — region anchor is role-only (`...|| el`); use the class-aware
//      fallback `el.closest(TRAP_REGION_SEL) || el` (TRAP_REGION_SEL from kbd-graph.js:83). (Also BUDGET=12
//      at :749 suppresses a valid CLEAR at ≥13 focusables — derive it from in-region focusable count.)
// =====================================================================================
test('L5 GUARD (was KNOWN-GAP; fixed by A3): a role-less <div class=modal> keyboard trap must be proven (not cleared)', guard, async () => {
  const r = await withPage('l5-trap-roleless-runner-fc.html', (p) => run(p, 'keyboard-trap-escape', "//*[@id='in0']"));
  // A3: the region anchor now uses the shared class-aware TRAP_REGION_SEL (kbd-graph), so the role-less
  // overlay is the region (not collapsed to the input) and the trap is proven, matching the detector.
  assert.equal(r.outcome.trapProven, true);
  assert.equal(r.outcome.escapeProvenForWidget, false);
});

test('L5 CORRECT-GUARD: the byte-identical role=dialog trap IS correctly trapProven by the runner', guard, async () => {
  const r = await withPage('l5-trap-roledialog-runner-ok.html', (p) => run(p, 'keyboard-trap-escape', "//*[@id='in0']"));
  assert.equal(r.outcome.trapProven, true);
  assert.equal(r.outcome.escapeProvenForWidget, false);
});

test('L5 CORRECT-GUARD: detectKeyboardTraps catches the role-less trap and clears the APG modal', guard, async () => {
  const trap = await withPage('l5-trap-roleless-detector-ok.html', (p) => detectKeyboardTraps(p, {}));
  assert.ok(trap.traps.length >= 1, 'the class-aware detector confirms the role-less trap (unlike the runner)');
  const apg = await withPage('l5-apg-modal-ok.html', (p) => detectKeyboardTraps(p, {}));
  assert.equal(apg.traps.length, 0);
});

// =====================================================================================
// §A — reflow / focus-obscured / field-label constants (browser). CORRECT-GUARD. (audit §A)
// =====================================================================================
test('A CORRECT-GUARD: 1.4.10 reflow flags a 360px block at 320 viewport, not a clean page', guard, async () => {
  const overflow = await withPage('a-reflow-overflow-360.html', (p) => run(p, 'reflow-overflow-probe', '//body'));
  assert.equal(overflow.outcome.overflowBarrierObserved, true);
  const clean = await withPage('a-reflow-clean.html', (p) => run(p, 'reflow-overflow-probe', '//body'));
  assert.equal(clean.outcome.overflowBarrierObserved, false);
});

test('A CORRECT-GUARD: 2.4.11 — fully-covered focus is a barrier; 90%-covered (visible strip) is NOT', guard, async () => {
  const full = await withPage('a-obscured-full.html', (p) => run(p, 'focus-obscured-barrier', "//*[@id='t']"));
  assert.equal(full.outcome.entirelyObscuredByAuthorContent, true);
  const partial = await withPage('a-obscured-partial90.html', (p) => run(p, 'focus-obscured-barrier', "//*[@id='t']"));
  assert.equal(partial.outcome.entirelyObscuredByAuthorContent, false);
});

test('A CORRECT-GUARD: 3.3.2 — placeholder is excluded from the accessible name; a real <label for> clears', guard, async () => {
  const ph = await withPage('a-label-placeholder-only.html', (p) => run(p, 'field-label-probe', "//*[@id='t']"));
  assert.equal(ph.outcome.programmaticNamePresent, false);
  const lbl = await withPage('a-label-for-visible.html', (p) => run(p, 'field-label-probe', "//*[@id='t']"));
  assert.equal(lbl.outcome.programmaticNamePresent, true);
  assert.equal(lbl.outcome.visibleLabelText, true);
});
