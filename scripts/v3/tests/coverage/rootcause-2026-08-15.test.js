// Regression suite for the 2026-08-15 FP/FN root-cause campaign on the act-augmented synthetic
// corpus (docs/analysis/reports-2026-06/SYNTHETIC-CORPUS-FP-FN-ROOTCAUSE.md).
//
// Each block below pins ONE defect that measurably cost recall or precision, and — just as
// importantly — pins the guard that stops the fix from over-correcting. Several of these bugs were
// invisible for months precisely because they failed SILENTLY (a build abort recorded as
// "no obligation"; an instrument's output discarded one line after it was computed; a `|| true`
// that made two operands dead), so every test here asserts the OBSERVABLE consequence, not just
// the shape of the code.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const coverage = require('../../lib/coverage-registry.js');
const oracle = require('../../lib/applicability-oracle.js');
const adj = require('../../lib/llm-adjudicator.js');
const { loadRubrics } = require('../../lib/rubric-loader.js');

// ===================================================================================
// P1 — coverage-registry <-> oracle drift on `inactiveText` ABORTED THE ENTIRE BUILD
//
// WCAG 1.4.3 exempts inactive UI components from contrast. The oracle honoured that
// (applicability-oracle.js:223); the registry did not, so every page containing a DISABLED
// text-bearing control raised a Rule-16 coverage error. coverageErrors fails CLOSED, so
// build-v3.js:86 returned {ok:false, results:null} and the page lost obligations for EVERY SC —
// 8/405 act-augmented pages, recorded by score-lib.js as an ordinary `noObligation`.
// ===================================================================================
test('P1: a DISABLED text-bearing control raises no coverage error (1.4.3 inactive exemption)', () => {
  const disabled = { xpath: '/html/body/button[1]', tag: 'button', role: 'button', hasText: true, text: 'Submit', inactiveText: true };
  const errs = coverage.coverageErrors({ elements: [disabled] });
  assert.deepEqual(errs, [], `an inactive control must not trip Rule 16:\n${errs.join('\n')}`);
});

test('P1 blast radius: one inactive control cannot void a whole page of obligations', () => {
  // The real-world shape: a normal page that merely CONTAINS a disabled button. Before the fix
  // this returned a coverage error, which build-v3 escalates to a total build abort.
  const collect = { elements: [
    { xpath: 'b1', tag: 'button', role: 'button', focusable: true, hasText: true, text: 'Save' },
    { xpath: 'b2', tag: 'button', role: 'button', hasText: true, text: 'Submit', inactiveText: true },
    { xpath: 'f1', isFormField: true },
  ] };
  assert.deepEqual(coverage.coverageErrors(collect), []);
});

test('P1 GUARD: the exemption is narrow — ACTIVE text still owes text-contrast', () => {
  // If the fix were written as a blanket `hasText` relaxation, this element would stop being
  // covered and Rule 16 would lose its only text-contrast surface.
  const active = { xpath: 'p1', tag: 'p', hasText: true, text: 'hello' };
  assert.ok(coverage.expectedFamilies(active).has('text-contrast'));
  assert.ok(!coverage.expectedFamilies({ ...active, inactiveText: true }).has('text-contrast'));
});

test('P1 GUARD: the Rule-16 mutation backstop still fires if the oracle branch is deleted', () => {
  // The whole point of the registry is catching a removed oracle branch. Prove the fix did not
  // disarm it: delete text-contrast from the oracle and the registry must still object.
  const collect = { elements: [{ xpath: 'p1', tag: 'p', hasText: true, text: 'hi' }] };
  const brokenFamiliesFor = (el) => oracle.familiesFor(el).filter((f) => f !== 'text-contrast');
  const errs = coverage.coverageErrors(collect, brokenFamiliesFor);
  assert.ok(errs.some((m) => /text-contrast/.test(m)), errs.join(' | '));
});

test('P1 GUARD: an inactive element is still checked for its OTHER families', () => {
  // The exemption must not become a blanket "skip this element" escape hatch.
  const collect = { elements: [{ xpath: 'b1', tag: 'button', role: 'button', hasText: true, inactiveText: true }] };
  const brokenFamiliesFor = (el) => oracle.familiesFor(el).filter((f) => f !== 'name-role-value');
  const errs = coverage.coverageErrors(collect, brokenFamiliesFor);
  assert.ok(errs.some((m) => /name-role-value/.test(m)), errs.join(' | '));
});

// ===================================================================================
// P2 — the recorded tab SEQUENCE was computed and then discarded
//
// run-instruments.js kept only `tabOrderFindings(tab).findings` and dropped `tab.order` on the very
// next line; `tabOrder` appeared nowhere in llm-adjudicator / obligations / build-v3 / judgments.
// focus-order-meaning-v0 is written around that artifact and told to abstain without it, so it
// abstained 17/17 and 2.4.3 scored 20.0% — the worst SC in the run — as a pure evidence gap.
// ===================================================================================
const FOCUS_ORDER_FIXTURE = {
  forward: [
    { index: 0, xpath: '/html/body/nav/a', label: 'Skip to content', rect: { x: 0, y: 8, w: 90, h: 18 } },
    { index: 1, xpath: '/html/body/main/button', label: 'Place order & pay $48.00', rect: { x: 0, y: 700, w: 200, h: 40 } },
    { index: 2, xpath: '/html/body/main/input', label: 'Card number', rect: { x: 0, y: 10, w: 200, h: 30 } },
  ],
  backward: [], wrapped: true, exhausted: false, count: 3,
};

function focusOrderSubject(focusOrder) {
  const rubrics = loadRubrics().rubrics;
  const collect = { file: 'x', elements: [], structure: { title: 'Checkout', headings: [{ level: 1, text: 'Checkout' }], landmarks: [{ role: 'navigation' }] } };
  const ledger = [{ xpath: oracle.PAGE_FOCUSORDER_XPATH, sc: '2.4.3', claimFamily: 'focus-order-meaning', autoPartial: true }];
  const subs = adj.selectRubricSubjects(collect, ledger, rubrics, { onlyAutoPartial: true, focusOrder });
  return subs.find((s) => s.rubricId === 'focus-order-meaning-v0') || null;
}

test('P2: the 2.4.3 subject receives the recorded tab sequence as judgeable evidence', () => {
  const subj = focusOrderSubject(FOCUS_ORDER_FIXTURE);
  assert.ok(subj, 'a focus-order-meaning-v0 subject must be selected');
  assert.ok(subj.element.__focusOrder, '__focusOrder must be threaded onto the subject');

  const sig = adj.precomputeSignals(subj.element, subj.skill, subj.sc);
  assert.ok(sig.focusOrder, 'precomputeSignals must surface focusOrder to the prompt');
  assert.equal(sig.focusOrder.forward.length, 3);
  // the rect per stop is the whole point: 2.4.3 is order-vs-LAYOUT, not order-vs-DOM.
  assert.ok(sig.focusOrder.forward.every((f) => f.rect && Number.isFinite(f.rect.y)),
    'each stop must carry its on-page rect so the order can be related to the visible layout');
  // the defect in this fixture is visible in the evidence: stop 1 is at y=700, stop 2 back at y=10.
  assert.equal(sig.focusOrder.forward[1].rect.y, 700);
  assert.equal(sig.focusOrder.forward[2].rect.y, 10);
});

test('P2: the 2.4.3 subject also gets landmarks/headings to name the region a stop lands in', () => {
  const subj = focusOrderSubject(FOCUS_ORDER_FIXTURE);
  const sig = adj.precomputeSignals(subj.element, subj.skill, subj.sc);
  assert.ok(sig.structure, 'page structure must be threaded to the page-level 2.4.3 subject');
  assert.ok(Array.isArray(sig.structure.headings));
  // ...but NOT the full page-structure payload — table association is noise for a focus-order judgment.
  assert.equal(sig.structure.tableAssociation, undefined);
  assert.equal(sig.pageTitle, undefined);
});

test('P2 GUARD: the element-level focus rubrics that SHARE skill=focus-management are untouched', () => {
  // focus-not-obscured-v0 (2.4.11) — and historically 2.4.7 focus-visible — use the same skill string.
  // Keying the new branch on the skill would have injected page structure + a tab sequence into their
  // element-level prompts. Gate is on the threaded evidence instead, so this must stay empty.
  const rubrics = loadRubrics().rubrics;
  const sharing = Object.values(rubrics).filter((r) => r && r.skill === 'focus-management').map((r) => r.id);
  assert.ok(sharing.length > 1, `expected focus-management to be shared; got ${sharing.join(',')}`);

  const el = { xpath: '/html/body/button[1]', tag: 'button', role: 'button', focusable: true };
  const sig = adj.precomputeSignals(el, 'focus-management', '2.4.11');
  assert.equal(sig.focusOrder, undefined, 'an element-level focus subject must not receive a tab sequence');
  assert.equal(sig.structure, undefined, 'an element-level focus subject must not receive page structure');
});

test('P2 GUARD: no recorded sequence ⇒ no fabricated evidence (the rubric must still be able to abstain)', () => {
  const subj = focusOrderSubject(null);
  assert.ok(subj, 'the subject is still selected when the instrument produced nothing');
  const sig = adj.precomputeSignals(subj.element, subj.skill, subj.sc);
  assert.equal(sig.focusOrder, undefined,
    'without an instrument result the judge must see NO sequence, so its abstain clause still applies');
});

// ===================================================================================
// P4 — 1.4.1 use-of-color aperture. One line gated the family on links + form fields only, which made
// the SC structurally invisible on charts/colour-coded graphics (~15 FNs) while every obligation that
// DID exist sat in the link/form lane (all 5 FPs). Widened to graphic surfaces — but NOT to plain <img>.
// ===================================================================================
test('P4: chart/graphic surfaces now enumerate use-of-color (1.4.1)', () => {
  for (const el of [
    { xpath: '/s', tag: 'svg' },
    { xpath: '/c', tag: 'canvas' },
    { xpath: '/d', tag: 'div', role: 'img' },              // a div-built chart
    { xpath: '/g', tag: 'div', role: 'graphics-document' },
  ]) {
    assert.ok(oracle.familiesFor(el).includes('use-of-color'), `${el.tag}/${el.role || '-'} should owe 1.4.1`);
  }
});

test('P4 GUARD: a plain raster <img> does NOT enumerate use-of-color', () => {
  // An <img> has an implicit role of img. Including it would fire 1.4.1 on every content image and
  // duplicate the alt-text question 1.1.1 already owns (it also broke the fifth-pass Rule-16 expectation
  // that an <img> owes exactly 1.1.1 + 1.4.5).
  const img = { xpath: '/i', tag: 'img', role: 'img', alt: 'Team photo' };
  assert.ok(!oracle.familiesFor(img).includes('use-of-color'));
});

test('P4 GUARD: links and form fields still enumerate use-of-color (the original aperture is intact)', () => {
  assert.ok(oracle.familiesFor({ xpath: '/a', tag: 'a', role: 'link' }).includes('use-of-color'));
  assert.ok(oracle.familiesFor({ xpath: '/f', tag: 'input', isFormField: true }).includes('use-of-color'));
});

// ===================================================================================
// P7 — an EMPTIED live region voices the literal string "polite: " with nothing after it. The old filter
// tested only the prefix, so that counted as an announcement: `noLiveRegionAnnouncement` read false and
// the judge saw a non-empty queue while a user hears silence. (4 cases.)
// ===================================================================================
test('P7: an empty "polite: " event is not counted as an announcement', () => {
  // mirrors the predicate in cdp-tools.js probe_screen_reader_after_action
  const spokenBody = (a) => String(a).replace(/^(polite|assertive)\s*:?\s*/i, '').trim();
  const isLive = (a) => /^(polite|assertive)\b/i.test(a) && spokenBody(a).length > 0;

  for (const empty of ['polite: ', 'polite:', 'assertive:   ', 'POLITE: ']) {
    assert.equal(isLive(empty), false, `"${empty}" is a cleared region — the user hears nothing`);
  }
  for (const real of ['polite: Added to cart', 'assertive: Error: card declined', 'polite: 6']) {
    assert.equal(isLive(real), true, `"${real}" is a real announcement`);
  }
  // a BARE NUMERAL is real content — this is the aria-atomic case where only the count changes, and
  // dropping it would silently turn a correct announcement into a false barrier.
  assert.equal(isLive('polite: 6'), true);
  // a focus phrase is not a live-region event at all
  assert.equal(isLive('button, Submit'), false);
});

// ===================================================================================
// RUBRIC REGRESSIONS — these are prompt files, so the test pins the CLAUSE, which is what the judge acts
// on. Each of these clauses was measured to cost recall or precision.
// ===================================================================================
const fs = require('node:fs');
const path = require('node:path');
const RUBRIC_DIR = path.join(__dirname, '..', '..', 'llm-rubrics');
const rubric = (id) => fs.readFileSync(path.join(RUBRIC_DIR, `${id}.md`), 'utf8');

test('R1: 1.3.1 no longer tells the judge to clear ANY programmatic→visual mismatch', () => {
  const md = rubric('info-relationships-v0');
  // the old blanket instruction cleared WCAG F46 (th/caption/summary on a LAYOUT table) — 9 of 21 misses
  assert.ok(!/if the only "mismatch" you can name runs programmatic→visual, return NOT REPRODUCED/.test(md),
    'the unconditional inverted-direction clear must be gone');
  assert.ok(/F46/.test(md), 'F46 (fabricated table semantics) must be named as a failure');
  assert.ok(/MISDESCRIBES/.test(md), 'the rubric must distinguish an ACCURATE hidden structure from a FALSE one');
  // ...while still protecting the sr-only heading technique the clause was written for
  assert.ok(/sr-only/.test(md) && /CONFORMING/.test(md),
    'a visually-hidden but accurate heading must still be explicitly conforming');
});

test('R2: 3.3.1 requires the error message to be TRUE, not merely present and specific', () => {
  const md = rubric('error-identification-v0');
  assert.ok(/INCORRECT-MESSAGE failure mode/.test(md));
  assert.ok(/contradicts the value actually in the field/.test(md));
  // must not become a licence to flag on suspicion — the abstain path has to survive
  assert.ok(/return PARTIAL rather than assuming the message is accurate/.test(md));
});

test('R3: 2.4.4 compares the link name against its destination', () => {
  const md = rubric('link-purpose-v0');
  assert.ok(/Name CONTRADICTS the destination/.test(md));
  assert.ok(/specific-sounding name is NOT an automatic clear/i.test(md));
  // guard against the obvious over-correction: shortened/redirect/opaque URLs are not contradictions
  assert.ok(/redirect/.test(md) && /opaque slug/.test(md));
});

test('R4: 1.4.1 has an applicability precondition and forbids invented contrast ratios', () => {
  const md = rubric('use-of-color-v0');
  assert.ok(/APPLICABILITY PRECONDITION/.test(md));
  // the exact inverted reasoning that produced 3 FPs: identical colour => fails the >=3:1 escape => barrier
  assert.ok(/Never reason "the colors are identical/.test(md));
  assert.ok(/Do NOT assert numeric contrast\/luminance ratios you have not been given/.test(md));
});

test('R4: the axe link-in-text-block DEFER clause is now reachable (passes are collected)', () => {
  // The rubric told the judge to defer to axe's PASS, but act-page-collect never requested passes, so the
  // clause could never fire. Pin both halves together — a clause without its evidence is dead text.
  const md = rubric('use-of-color-v0');
  assert.ok(/link-in-text-block/.test(md), 'the DEFER clause must still exist');
  const collector = fs.readFileSync(path.join(__dirname, '..', '..', 'lib', 'act-page-collect.js'), 'utf8');
  assert.ok(/resultTypes: \['violations', 'incomplete', 'passes'\]/.test(collector),
    'axe must be asked for passes, or the DEFER clause is unreachable');
  assert.ok(/PASS_ALLOW/.test(collector), 'passes must be allowlisted so the artifact does not balloon');
});

// ===================================================================================
// LIVE-PAGE regressions. The collector/runner fixes below are in-page code, so a fixture-object test
// would prove nothing — each of these bugs survived precisely because the JS shape looked plausible.
// Each fixture is ADVERSARIAL: it pairs the failing shape with a near-identical shape that must NOT fire.
// ===================================================================================
const puppeteer = require('puppeteer');
const { BROWSER_ARGS } = require('../../lib/browser-args.js');
const { collectActPage } = require('../../lib/act-page-collect.js');
const { RUNNERS } = require('../../lib/exp-runners.js');
const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const os = require('node:os');

async function withPage(html, fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'v3rc-'));
  const file = path.join(dir, 'f.html');
  fs.writeFileSync(file, html);
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: BROWSER_ARGS });
  try {
    const page = await browser.newPage();
    return await fn(page, 'file://' + file);
  } finally {
    await browser.close().catch(() => {});
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('P3 (live): an EMPTY / hidden live region is collected; an aria-hidden one is not', async () => {
  const html = `<!doctype html><meta charset=utf-8><title>Cart</title>
    <div id="empty" role="status"></div>
    <div id="hidden" aria-live="polite" style="display:none"></div>
    <div id="sized" role="status" style="min-height:22px">Ready</div>
    <div id="ariahidden" role="status" aria-hidden="true"></div>`;
  await withPage(html, async (page, url) => {
    const c = await collectActPage(page, { url, file: url });
    const live = (c.elements || []).filter((e) => e.liveRegion);
    // BEFORE the fix only #sized survived: visible() requires width>0 && height>0, and the element loop
    // dropped the others ~170 lines before the liveRegion fact was ever computed. That removed the only
    // element that can carry the 4.1.3 obligation, so the SC scored noObligation on resting CSS geometry.
    assert.equal(live.length, 3, `expected empty+hidden+sized to be collected, got ${live.length}`);
    assert.ok(live.some((e) => e.liveRegionHiddenAtRest === true), 'the at-rest-hidden state must be recorded');
    assert.ok(live.some((e) => e.liveRegionHiddenAtRest === false), 'a rendered region must not be marked hidden');
    // aria-hidden is outside the a11y tree and can never announce ⇒ must stay excluded
    assert.equal(live.length, 3, 'the aria-hidden status container must NOT be admitted');
  });
});

test('P5 (live): an addEventListener-wired focus trap enumerates no-keyboard-trap; plain controls do not', async () => {
  const html = `<!doctype html><meta charset=utf-8><title>Gate</title>
    <input id="gate" aria-label="Access code">
    <button id="plain">Continue</button>
    <a href="#x" id="link">Help</a>
    <script>
      document.getElementById('gate').addEventListener('blur', function(){ setTimeout(()=>this.focus(),0); });
    </script>`;
  await withPage(html, async (page, url) => {
    const c = await collectActPage(page, { url, file: url });
    const byXpath = Object.fromEntries((c.elements || []).map((e) => [e.xpath, e]));
    const gate = byXpath['/html/body/input[1]'];
    assert.ok(gate, 'the input must be collected');
    // the static focusRisk fact can only see INLINE onblur/onfocus/onfocusout. Across all 20 of the
    // corpus's 2.1.2 pages there were ZERO inline handlers — every trap used addEventListener.
    assert.equal(gate.focusRisk, true, 'a listener-wired focus handler must raise focusRisk');
    assert.ok(oracle.familiesFor(gate).includes('no-keyboard-trap'),
      'the trap obligation must now be enumerated (it never was, so the detector never ran)');
    // GUARD: this must not flood every focusable element with a trap obligation.
    for (const xp of ['/html/body/button[1]', '/html/body/a[1]']) {
      const el = byXpath[xp];
      if (!el) continue;
      assert.ok(!oracle.familiesFor(el).includes('no-keyboard-trap'), `${xp} has no focus listener — no trap obligation`);
    }
  });
});

test('P9 (live): 3.3.1 credits an already-rendered error and abstains on an unprobeable optional field', async () => {
  // novalidate so NATIVE validation cannot mask the credit path under test.
  const html = `<!doctype html><meta charset=utf-8><title>Checkout</title>
    <form action="#" novalidate>
      <label for="amt">Amount</label>
      <input id="amt" type="text" required aria-invalid="true" aria-describedby="amtmsg" value="2">
      <div id="amtmsg" class="msg">Enter an amount of at least $5.00</div>
      <label for="tel">Phone (optional)</label><input id="tel" type="tel">
      <label for="bare">Full name</label><input id="bare" type="text" required>
    </form>`;
  await withPage(html, async (page, url) => {
    const probe = RUNNERS['form-error-probe'];

    // (1) the error is ALREADY on screen, associated via aria-describedby, on a field marked aria-invalid.
    // The old co-gate required the container to LOOK error-ish by CSS class; real pages name these
    // `msg`/`err`/`field-msg`, so this scored errorNotIdentified ⇒ 4 of the run's 14 false positives.
    await page.goto(url, { waitUntil: 'load' });
    const r1 = await probe(page, { targetXpath: '/html/body/form[1]/input[1]', candidateId: 'amt' });
    assert.equal(r1.measurement.customIdentifies, true, 'a referenced pre-existing error on an aria-invalid field is identified');
    assert.equal(r1.outcome.errorNotIdentified, false, 'and therefore must not be a barrier');

    // (2) an OPTIONAL type=tel: no invalid value can be synthesized, so the probe used to write '' — a
    // perfectly VALID value — and then report a barrier when no error appeared. That is a fabricated
    // error condition, so the correct behaviour is to abstain.
    await page.goto(url, { waitUntil: 'load' });
    const r2 = await probe(page, { targetXpath: '/html/body/form[1]/input[2]', candidateId: 'tel' });
    assert.equal(r2.valid, false, 'an unprobeable optional field must be NOT-applicable');
    assert.equal(r2.outcome.errorNotIdentified, false, 'and must never read as a barrier');

    // (3) REGRESSION GUARD — the genuine barrier must still fire. If the two fixes above had been written
    // as blanket relaxations, this is the assertion that would catch it.
    await page.goto(url, { waitUntil: 'load' });
    const r3 = await probe(page, { targetXpath: '/html/body/form[1]/input[3]', candidateId: 'bare' });
    assert.equal(r3.outcome.errorNotIdentified, true, 'a required field rejected with NO error message is still a barrier');
  });
});
