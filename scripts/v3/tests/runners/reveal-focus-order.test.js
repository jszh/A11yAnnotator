// 2.4.3 focus-order EVIDENCE: the reveal-state instrument (R1), the modalOpen visibility gate (R2), the
// redundant-stop pre-computation (R4), and probeActive collector liveness.
//
// Every one of these tests is written against the shape that would make the detector WRONG, not only the
// shape it is meant to catch — the adversarial half is the point, because the reveal pass is the first
// instrument in this file that ACTIVATES controls and therefore the first that can manufacture evidence.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const puppeteer = require('puppeteer');
const { collectTabOrder, collectRevealedFocusOrder, redundantStopFacts } = require('../../lib/kbd-graph.js');
const { CHROME } = require('../../lib/run-experiments.js');
const { BROWSER_ARGS } = require('../../lib/browser-args.js');
const { assetFileUrl: fx } = require('../../../lib/asset-paths.js');
const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — reveal-focus-order e2e SKIPPED');

async function onPage(fixture, fn) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: BROWSER_ARGS });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    const url = fx(fixture);
    await page.goto(url, { waitUntil: 'load' });
    await require('../../lib/settle.js').awaitSettle(page);
    return await fn(page, url);
  } finally { await browser.close(); }
}

// ── R2: modalOpen must mean a modal is RENDERED, not merely declared ────────────────────────────────
test('modalOpen: dialog markup inside a display:none scrim is NOT an open modal', { skip: !chromeOK, concurrency: false }, async () => {
  const tab = await onPage('fx-v3-modal-hidden-vs-open.html', (page) => collectTabOrder(page));
  assert.ok(tab.count >= 3, 'the page contributes its visible controls');
  // the scrim is display:none, so its two buttons are not in the ring at all…
  assert.equal(tab.order.some((o) => o.label === 'OK' || o.label === 'Cancel'), false, 'hidden dialog controls are not tab stops');
  // …and CRUCIALLY no stop may claim a modal is open. Before the visibility gate every stop reported
  // modalOpen:true / insideOpenModal:false, which is exactly the pair the rubric's containment clause reads
  // as "focus has leaked out of an open dialog" — a barrier manufactured on a page with nothing open.
  assert.deepEqual(tab.order.filter((o) => o.modalOpen).map((o) => o.label), [],
    'no stop reports an open modal while the dialog is inside a hidden scrim');
});

test('modalOpen: the SAME markup, once actually shown, DOES report an open modal', { skip: !chromeOK, concurrency: false }, async () => {
  const tab = await onPage('fx-v3-modal-hidden-vs-open.html', async (page) => {
    await page.evaluate(() => document.getElementById('scrim').classList.add('open'));
    await page.evaluate(() => new Promise((r) => setTimeout(r, 60)));
    return collectTabOrder(page);
  });
  const inside = tab.order.filter((o) => o.modalOpen && o.insideOpenModal);
  const leaked = tab.order.filter((o) => o.modalOpen && !o.insideOpenModal);
  assert.ok(inside.length >= 2, 'the dialog controls are stops and report themselves inside the open modal');
  // the gate must not have made the fact unreachable: this page does NOT inert its background, so the
  // page controls are still tab stops OUTSIDE the open dialog — a genuine containment leak, still visible.
  assert.ok(leaked.length >= 1, 'a real containment leak is still reported');
});

// ── R1: the reveal-state pass, judged on the shapes that must NOT produce a claim ───────────────────
test('reveal-state: conforming reveal shapes produce facts that clear, never a manufactured barrier', { skip: !chromeOK, concurrency: false }, async () => {
  const { states } = await onPage('fx-v3-reveal-order.html', async (page, url) => {
    const tab = await collectTabOrder(page);
    return collectRevealedFocusOrder(page, url, {
      restingXpaths: tab.order.map((o) => o.xpath), maxOpeners: 6, pageIsFresh: true,
    });
  });
  const by = (name) => states.find((s) => s.openerName === name);
  // The rule the rubric applies: a barrier needs adjacent===false AND focusMovedIntoRevealed===false.
  const insertionBarrier = (s) => !!s && s.adjacent === false && s.focusMovedIntoRevealed === false;
  // …and for the return half: the region actually hid, focus did not come back, and the trigger still exists.
  const returnBarrier = (s) => !!s && s.regionHiddenAfterDismiss === true && s.returnedToOpener === false && s.openerStillPresent === true;

  // A — panel is the LAST block in the document (not adjacent) but activation moves focus into it. F85 is
  // satisfied by focus management; a detector that failed on non-adjacency alone would flag a good page.
  const a = by('Open settings');
  assert.ok(a, 'the declared opener was found');
  assert.equal(a.adjacent, false, 'the panel genuinely is not adjacent');
  assert.equal(a.focusMovedIntoRevealed, true, 'but activation moved focus into it');
  assert.equal(insertionBarrier(a), false, 'so no insertion barrier');
  assert.equal(returnBarrier(a), false, 'and focus returns on close');

  // B — the button APPENDS new nodes; nothing was hidden and nothing was revealed. The ring grows and the
  // new stops are far from the button, which is the exact shape that would fabricate a barrier without the
  // formerly-hidden-region guard. It must make no claim at all.
  const b = by('Add option');
  assert.ok(b, 'the appending control was probed');
  assert.ok(b.newStops >= 1, 'the ring really did grow (so the guard, not the absence of change, is what saves it)');
  assert.equal(b.revealedRegionXpath, null, 'no formerly-hidden region became visible');
  assert.equal(b.adjacent, null, 'so adjacency is not asserted in EITHER direction');
  assert.equal(insertionBarrier(b), false);

  // C — the in-panel control ADVANCES a multi-step flow instead of closing. Requiring focus to return from
  // a "dismissal" that dismissed nothing would fail a conforming page.
  const c = by('Open checklist');
  assert.ok(c, 'the multi-step opener was probed');
  assert.equal(c.regionHiddenAfterDismiss, false, 'the region did not actually go away');
  assert.equal(returnBarrier(c), false, 'so no return is owed');

  // D — the action DELETES its own trigger and focuses the logical neighbour, which F85 explicitly blesses.
  // This is also the xpath-aliasing trap: the removed trigger's POSITIONAL xpath now resolves to the next
  // button, so identity must be tracked on the element, not the path.
  const d = by('Remove this entry');
  assert.ok(d, 'the self-removing opener was probed');
  assert.equal(d.openerStillPresent, false, 'the trigger is correctly seen to be GONE, not aliased to its neighbour');
  assert.equal(returnBarrier(d), false, 'so "focus did not return to the trigger" is not held against it');
});

test('reveal-state: a page with no declared opener makes no claim and costs NO page load', { skip: !chromeOK, concurrency: false }, async () => {
  // Cost control is the whole reason this pass can sit in the middle of a capped lane: the overwhelming
  // majority of pages must pay two in-page queries and nothing else. A reload per page would BE the budget.
  const res = await onPage('fx-v3-reach-deep.html', async (page, url) => {
    let gotos = 0;
    const counting = new Proxy(page, {
      get: (t, k) => (k === 'goto' ? ((...a) => { gotos++; return t.goto(...a); }) : Reflect.get(t, k).bind ? Reflect.get(t, k).bind(t) : Reflect.get(t, k)),
    });
    const r = await collectRevealedFocusOrder(counting, url, { maxOpeners: 2, pageIsFresh: true });
    return { r, gotos };
  });
  assert.deepEqual(res.r.states, [], 'no reveal facts are asserted');
  assert.equal(res.gotos, 0, 'and the precondition was answered from the page as it stood — no page load');
});

// ── R4: the redundant-stop pre-computation (pure function over a recorded ring) ─────────────────────
const stop = (i, xpath, o = {}) => ({ index: i, xpath, tag: o.tag || 'button', label: o.label || '', rect: o.rect || { x: 0, y: i * 30, w: 100, h: 20 }, role: o.role || null, tabindexAttr: o.tabindexAttr == null ? null : o.tabindexAttr });

test('redundant stops: a focusable wrapper immediately followed by its own child is flagged', () => {
  const f = redundantStopFacts({ order: [
    stop(0, '/html/body/div[1]', { tag: 'div', label: 'Add to basket', rect: { x: 10, y: 10, w: 200, h: 60 }, tabindexAttr: '0' }),
    stop(1, '/html/body/div[1]/button[1]', { tag: 'button', label: 'Add to basket', rect: { x: 10, y: 10, w: 200, h: 60 } }),
  ] });
  const w = f['/html/body/div[1]'];
  assert.ok(w, 'the wrapper carries facts');
  assert.equal(w.wrapsNextStop, true, 'the next stop is its DOM descendant');
  assert.equal(w.rectEnclosesNextStop, true);
  assert.equal(w.nameCoversNextStop, true, 'and it announces the same thing');
});

test('redundant stops: a SIBLING pair with the same name is NOT a nested-wrapper flag', () => {
  // two stacked links to the same destination are a different concern; only DOM nesting is this signature.
  const f = redundantStopFacts({ order: [
    stop(0, '/html/body/a[1]', { tag: 'a', label: 'Listen now' }),
    stop(1, '/html/body/a[2]', { tag: 'a', label: 'Listen now' }),
  ] });
  assert.equal(f['/html/body/a[1]'], undefined, 'siblings are not reported as wrapper/child');
});

test('redundant stops: a generic container stop is qualified by WHERE it sits', () => {
  const field = (i, n, label) => stop(i, `/html/body/form[1]/fieldset[1]/div[${n}]/input[1]`, { tag: 'input', label });
  // (a) wedged between two fields of ONE field group ⇒ it interrupts a sequence being worked through
  const mid = redundantStopFacts({ order: [
    field(0, 1, 'Card number'),
    stop(1, '/html/body/form[1]/fieldset[1]/div[2]', { tag: 'div', label: 'SECTION HEADING', tabindexAttr: '0' }),
    field(2, 3, 'Expiry'),
  ] })['/html/body/form[1]/fieldset[1]/div[2]'];
  assert.equal(mid.genericContainerStop, true);
  assert.equal(mid.interruptsCoupledSequence, true, 'between two fields of the same group');

  // (b) the SAME kind of stop introducing a group of links is merely tedious, not confusing
  const nav = redundantStopFacts({ order: [
    stop(0, '/html/body/nav[1]/span[1]', { tag: 'span', label: 'SECTION', tabindexAttr: '0' }),
    stop(1, '/html/body/nav[1]/a[1]', { tag: 'a', label: 'First page' }),
    stop(2, '/html/body/nav[1]/a[2]', { tag: 'a', label: 'Second page' }),
  ] })['/html/body/nav[1]/span[1]'];
  assert.equal(nav.genericContainerStop, true, 'still reported as a fact…');
  assert.equal(nav.interruptsCoupledSequence, false, '…but explicitly NOT flagged as interrupting anything');

  // (c) a generic tag carrying an INTERACTIVE role is a real widget, never "meaningless"
  const widget = redundantStopFacts({ order: [
    stop(0, '/html/body/div[9]', { tag: 'div', role: 'button', label: 'Play', tabindexAttr: '0' }),
    stop(1, '/html/body/a[1]', { tag: 'a', label: 'Next' }),
  ] });
  assert.equal(widget['/html/body/div[9]'], undefined, 'a role=button div is not a generic container stop');
});

// ── collector liveness: a swallowed probeActive throw must be OBSERVABLE ────────────────────────────
test('collectorLiveness: a throwing probeActive is recorded, and the fallback VALUE is unchanged', async () => {
  const prev = process.env.V3_SETTLE_KBD;
  process.env.V3_SETTLE_KBD = '0';                  // no settle helper — this stub page has no real CDP
  try {
    const stubPage = {
      evaluate: async () => { throw new Error('ReferenceError: helper is not defined'); },
      keyboard: { press: async () => {}, down: async () => {}, up: async () => {} },
    };
    const tab = await collectTabOrder(stubPage, { safetyCap: 3 });
    // the FALLBACK is byte-for-byte what it always was: a sentinel entry, an empty ring, no wrap.
    assert.deepEqual(tab.order, [], 'a genuinely broken page still degrades to an empty ring');
    assert.equal(tab.wrapped, false);
    assert.equal(tab.count, 0);
    // …but the throw is no longer invisible. Without this, a dead probeActive returns `sentinel: true`,
    // which the ring logic reads as a legitimate DOCUMENT-BOUNDARY crossing — so the failure mode is not
    // "no findings", it is a plausible, wrongly-anchored order.
    assert.ok(Array.isArray(tab.liveness) && tab.liveness.length >= 1, 'the swallowed throw is recorded');
    assert.equal(tab.liveness[0].collector, 'probeActive@entry');
    assert.match(tab.liveness[0].error, /helper is not defined/, 'the message is kept, so the cause is diagnosable');
    assert.ok(tab.liveness.some((l) => l.collector === 'probeActive@walk'), 'the in-walk site is recorded too');
  } finally { if (prev === undefined) delete process.env.V3_SETTLE_KBD; else process.env.V3_SETTLE_KBD = prev; }
});

test('collectorLiveness: a healthy ring carries an EMPTY liveness list', { skip: !chromeOK, concurrency: false }, async () => {
  const tab = await onPage('fx-v3-modal-hidden-vs-open.html', (page) => collectTabOrder(page));
  assert.deepEqual(tab.liveness, [], 'presence of any entry at all is the signal, so a healthy page must have none');
});

// ── THE CHANNEL. Everything above only matters if these per-stop facts actually reach the judge. The
// adjudicator builds `signals.focusOrder` from an explicit WHITELIST of page-level fields (forward,
// backward, count, wrapped, exhausted, truncated, startAnchored, partial, note) — a new page-level key on
// the tabOrder artifact is silently dropped before the prompt. What it does NOT whitelist is the CONTENTS
// of a stop: `forward` is passed through with `slice()`, so each stop object travels whole. That is why
// the reveal / divergence / redundant-stop facts are attached PER STOP rather than page-level. If this
// test ever fails, every fact this file computes is being discarded on the way to the judge.
const adj = require('../../lib/llm-adjudicator.js');
const oracle = require('../../lib/applicability-oracle.js');
const { loadRubrics } = require('../../lib/rubric-loader.js');

test('CHANNEL: per-stop reveal / divergence / redundant-stop facts survive into the judge prompt', () => {
  const focusOrder = {
    forward: [
      { index: 0, xpath: '/html/body/button[1]', tag: 'button', label: 'Open panel', rect: { x: 0, y: 8, w: 90, h: 18 },
        reveal: { openerName: 'Open panel', adjacent: false, focusMovedIntoRevealed: false, revealedRegionRole: 'dialog',
          regionHiddenAfterDismiss: true, returnedToOpener: false, openerStillPresent: true } },
      { index: 1, xpath: '/html/body/div[1]', tag: 'div', label: 'Group', rect: { x: 0, y: 40, w: 200, h: 60 },
        genericContainerStop: true, interruptsCoupledSequence: true, wrapsNextStop: true },
      { index: 2, xpath: '/html/body/div[1]/a[1]', tag: 'a', label: 'Later', rect: { x: 0, y: 10, w: 90, h: 18 },
        visualOrderDivergence: 'encountered after X but sits 3 visual position(s) earlier within its column' },
    ],
    backward: [], wrapped: true, exhausted: false, count: 3, startAnchored: true,
  };
  const collect = { file: 'x', elements: [], structure: { title: 'T', headings: [], landmarks: [] } };
  const ledger = [{ xpath: oracle.PAGE_FOCUSORDER_XPATH, sc: '2.4.3', claimFamily: 'focus-order-meaning', autoPartial: true }];
  const subj = adj.selectRubricSubjects(collect, ledger, loadRubrics().rubrics, { onlyAutoPartial: true, focusOrder })
    .find((s) => s.rubricId === 'focus-order-meaning-v0');
  assert.ok(subj, 'the 2.4.3 page subject is selected');
  const sig = adj.precomputeSignals(subj.element, subj.skill, subj.sc);
  const prompt = adj.buildPrompt(subj, sig, null, { rubric: 'R' });

  assert.equal(sig.focusOrder.forward[0].reveal.adjacent, false, 'the reveal object rides on its opener stop');
  assert.equal(sig.focusOrder.forward[0].reveal.returnedToOpener, false);
  assert.equal(sig.focusOrder.forward[1].interruptsCoupledSequence, true, 'the redundant-stop qualifier rides too');
  assert.ok(sig.focusOrder.forward[2].visualOrderDivergence, 'and the divergence triage');
  // …and all three are actually SERIALISED into the text the model reads.
  for (const key of ['focusMovedIntoRevealed', 'returnedToOpener', 'openerStillPresent', 'interruptsCoupledSequence', 'wrapsNextStop', 'visualOrderDivergence']) {
    assert.ok(prompt.includes(key), `"${key}" reaches the prompt`);
  }
});

test('CHANNEL GUARD: the rubric names every fact key it tells the judge to reason over', () => {
  // A fact the rubric never mentions is a fact the judge has no instruction for; a rubric clause about a
  // key the instrument never emits is an instruction about nothing. Keep the two halves in step.
  const fs2 = require('node:fs');
  const rubric = fs2.readFileSync(require('node:path').join(__dirname, '..', '..', 'llm-rubrics', 'focus-order-meaning-v0.md'), 'utf8');
  for (const key of ['adjacent', 'focusMovedIntoRevealed', 'regionHiddenAfterDismiss', 'returnedToOpener',
    'openerStillPresent', 'visualOrderDivergence', 'wrapsNextStop', 'genericContainerStop', 'interruptsCoupledSequence']) {
    assert.ok(rubric.includes(key), `the rubric explains the "${key}" fact`);
  }
});
