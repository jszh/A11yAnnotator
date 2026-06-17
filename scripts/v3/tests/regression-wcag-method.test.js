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

test('B1 KNOWN-GAP: an adjacent transposition (delta=1) in a 6-item column should be flagged', { todo: 'fix order-check.js:64,68 — strict `>` + floor-of-3 makes delta=1 invisible' }, () => {
  const reading = [0, 1, 3, 2, 4, 5].map((vr) => colItem(vr, 'i' + vr)); // neighbors 2,3 transposed
  // post-fix count is algorithm-dependent (a delta>=1 check flags ≥1; BAGEL FuncSet may differ) ⇒ assert ≥1.
  assert.ok(visualOrderDivergence(reading, { sc: '1.3.2', kind: 'reading-order' }).findings.length >= 1);
});

test('B1 KNOWN-GAP: a fully-reversed 4-item column should be flagged (n≤4 dead zone)', { todo: 'fix order-check.js:64,68 — max delta n−1 ≤ JUMP=3 with strict `>` ⇒ 0/24 perms detected at n=4' }, () => {
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

test('B3 KNOWN-GAP: a lazy-inserted disclosure body (primary content) must NOT be flagged', gap('fix status-detector.js:91-105 — add an aria-expanded/aria-controls (and role=tabpanel) disclosure exclusion'), async () => {
  const r = await withPage('b3-status-disclosure-fp.html', (p) => detectStatusMessages(p, {}));
  assert.equal(r.findings.length, 0); // WCAG-correct: a disclosure body is primary content, not a status
});

test('B3 KNOWN-GAP: a real barrier on the 15th button must be found at the default cap', gap('fix status-detector.js:24,57 — maxTriggers=12 default + slice(0,maxTriggers) truncates coverage'), async () => {
  const def = await withPage('b3-status-cap-fn.html', (p) => detectStatusMessages(p, {}));
  assert.equal(def.findings.length, 1); // today 0 — the 12-cap never probes button[15]
});

test('B3 CORRECT-GUARD: lifting the cap proves the 15th button IS the cause', guard, async () => {
  const lifted = await withPage('b3-status-cap-fn.html', (p) => detectStatusMessages(p, { maxTriggers: 20 }));
  assert.equal(lifted.findings.length, 1, 'with maxTriggers=20 the barrier on button[15] is found');
});

test('B3 KNOWN-GAP: un-announced statuses behind non-button triggers should be found', gap('fix status-detector.js:55 — pass-1 selector is button,[role=button],input[type=button] only'), async () => {
  const r = await withPage('b3-status-nonbutton-fn.html', (p) => detectStatusMessages(p, {}));
  // post-fix count depends on the widened selector + isSafe rules ⇒ assert ≥1 (today 0: never probed).
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
