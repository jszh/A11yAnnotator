'use strict';
// Trusted-Tester v5.1.3 gap closures (docs/analysis/TRUSTED-TESTER-GAP-ANALYSIS.md):
//   G1 — list semantics (1.3.1 / TT 10.D): collect-lists.js + structure.lists → info-relationships precompute.
//   G2 — CSS background-image meaning (1.1.1 / TT 7.C): backgroundImageMeaningful → non-text-content → alt-adequacy.
//   G3 — CAPTCHA modalities (1.1.1 / TT 7.D): isCaptcha → captcha-alternative review family + gated rubric.
//   G5 — form-error soft-constraint widening (3.3.1 / TT 5.F): client-side framework REQUIRED markers.
// Pure-logic tests (oracle/coverage/routing/precompute) always run; DOM-extractor tests are Chrome-guarded.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const puppeteer = require('puppeteer');
const oracle = require('../lib/applicability-oracle.js');
const cov = require('../lib/coverage-registry.js');
const { selectRubricSubjects, precomputeSignals } = require('../lib/llm-adjudicator.js');
const { collectLists } = require('../lib/collect-lists.js');

const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — TT-gap DOM-extractor tests SKIPPED');

const RUBRICS = {
  'alt-text-adequacy-v0': { id: 'alt-text-adequacy-v0', sc: '1.1.1', skill: 'name-role-state', visionEvidence: ['element-crop'] },
  'long-description-completeness-v0': { id: 'long-description-completeness-v0', sc: '1.1.1', skill: 'name-role-state', visionEvidence: ['element-crop'] },
  'captcha-alternative-v0': { id: 'captcha-alternative-v0', sc: '1.1.1', skill: 'captcha', visionEvidence: ['element-crop'] },
  'info-relationships-v0': { id: 'info-relationships-v0', sc: '1.3.1', skill: 'grouping-and-reading-order', visionEvidence: ['viewport'] },
};
const ridsFor = (subs, xp) => [...new Set(subs.filter((s) => s.xpath === xp).map((s) => s.rubricId))].sort();

// ───────────────────────────── G2/G3 — oracle families + Rule-16 coverage ─────────────────────────────
test('G2: a meaningful background-image owes non-text-content (1.1.1), NOT images-of-text/non-text-contrast', () => {
  const fams = oracle.familiesFor({ xpath: '/d', tag: 'div', backgroundImageMeaningful: true });
  assert.deepEqual(fams, ['non-text-content'], 'bg-image div gets exactly the 1.1.1 alt family');
});
test('G3: a CAPTCHA owes captcha-alternative (1.1.1)', () => {
  const fams = oracle.familiesFor({ xpath: '/c', tag: 'div', isCaptcha: true });
  assert.deepEqual(fams, ['captcha-alternative']);
  assert.equal(oracle.scForFamily('captcha-alternative'), '1.1.1');
  assert.deepEqual(oracle.skillsForFamily('captcha-alternative'), ['captcha']);
});
test('G2/G3: absent signals enumerate nothing (no flood on ordinary elements)', () => {
  assert.deepEqual(oracle.familiesFor({ xpath: '/p', tag: 'div', hasText: true }), ['text-contrast']);
});
test('G2/G3: oracle + coverage-registry AGREE (Rule-16, no drift) for bg-image + captcha', () => {
  const collect = { elements: [
    { xpath: '/bg', tag: 'div', backgroundImageMeaningful: true },
    { xpath: '/cap', tag: 'div', isCaptcha: true },
  ], structure: { title: 't' } };
  assert.deepEqual(cov.coverageErrors(collect), [], 'no surface→oracle coverage gap');
  assert.deepEqual(oracle.enumerationErrors(collect), [], 'no enumeration fail-closed / drift');
});

// ───────────────────────────── G2/G3 — rubric routing + gates ─────────────────────────────
test('G2: a bg-image div routes to alt-text-adequacy ONLY (no long-desc, no captcha)', () => {
  const collect = { elements: [{ xpath: '/bg', tag: 'div', backgroundImageMeaningful: true }] };
  const ledger = [{ xpath: '/bg', sc: '1.1.1', claimFamily: 'non-text-content', autoPartial: true }];
  assert.deepEqual(ridsFor(selectRubricSubjects(collect, ledger, RUBRICS), '/bg'), ['alt-text-adequacy-v0']);
});
test('G3: a captcha routes to captcha-alternative ONLY (alt-text-adequacy is gated OFF)', () => {
  const collect = { elements: [{ xpath: '/cap', tag: 'div', isCaptcha: true }] };
  const ledger = [{ xpath: '/cap', sc: '1.1.1', claimFamily: 'captcha-alternative', autoPartial: true }];
  assert.deepEqual(ridsFor(selectRubricSubjects(collect, ledger, RUBRICS), '/cap'), ['captcha-alternative-v0']);
});
test('G3: captcha-alternative does NOT fire on an ordinary image; alt-text-adequacy DOES', () => {
  const collect = { elements: [{ xpath: '/img', tag: 'img', isImage: true, role: 'img' }] };
  const ledger = [{ xpath: '/img', sc: '1.1.1', claimFamily: 'non-text-content', autoPartial: true }];
  const rids = ridsFor(selectRubricSubjects(collect, ledger, RUBRICS), '/img');
  assert.ok(rids.includes('alt-text-adequacy-v0'), 'an image still gets alt-adequacy');
  assert.ok(!rids.includes('captcha-alternative-v0'), 'a non-captcha image never gets the captcha rubric');
});

// ───────────────────────────── G1/G2/G3 — precompute signal surfacing ─────────────────────────────
test('G1: structure.lists is surfaced into the grouping/reading-order signals', () => {
  const lists = [{ kind: 'faux', via: 'br-bulleted', tag: 'p', itemCount: 3, itemSamples: ['• a', '• b', '• c'] }];
  const s = precomputeSignals({ xpath: '/page-level::info-relationships', __pageStructure: { title: 't', lists } }, 'grouping-and-reading-order');
  assert.ok(s.structure && Array.isArray(s.structure.lists), 's.structure.lists present');
  assert.equal(s.structure.lists[0].via, 'br-bulleted');
});
test('G2: backgroundImage signal is surfaced for name-role-state (with decorative-default steer)', () => {
  const s = precomputeSignals({ xpath: '/bg', backgroundImageMeaningful: true, backgroundImageUrl: 'x.png', isInteractive: true }, 'name-role-state');
  assert.ok(s.backgroundImage, 's.backgroundImage present');
  assert.equal(s.backgroundImage.interactive, true);
  assert.match(s.backgroundImage.uncertainReason, /DECORATIVE is the DEFAULT|decorative is the DEFAULT/i);
});
test('G3: captcha signal is surfaced for the captcha skill with the review steer', () => {
  const s = precomputeSignals({ xpath: '/cap', isCaptcha: true, tag: 'div' }, 'captcha');
  assert.ok(s.captcha && s.captcha.detected === true);
  assert.match(s.captcha.uncertainReason, /PARTIAL|review/i);
});

// ───────────────────────────── G1 — collectLists DOM extraction (Chrome-guarded) ─────────────────────────────
const LIST_HTML = `<!doctype html><meta charset=utf-8><body>
  <ul><li>a</li><li>b</li><li>c</li></ul>
  <ul><li>x</li><div>stray</div><li>y</li></ul>
  <p>Buy:<br>• Milk<br>• Eggs<br>• Bread</p>
  <div><div>- one reason</div><div>- two reason</div><div>- three reason</div></div>
  <div id="roman"><p>i. first</p><p>ii. second</p><p>iii. third</p></div>
  <div id="emoji"><p>🔹 alpha</p><p>🔹 beta</p><p>🔹 gamma</p></div>
  <div style="display:flex"><div>Card A</div><div>Card B</div><div>Card C</div></div>
  <p>- a single intro line, not a list</p>
  <div id="quotes"><p>— Ada, on engines</p><p>— Alan, on machines</p><p>— Grace, on bugs</p></div>
</body>`;

test('G1: collectLists finds real + faux (incl. roman/emoji) lists, ignores decoys + em-dash prose', { skip: !chromeOK, concurrency: false }, async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage();
    await page.setContent(LIST_HTML, { waitUntil: 'load' });
    const lists = await page.evaluate(collectLists);
    const real = lists.filter((l) => l.kind === 'real');
    const faux = lists.filter((l) => l.kind === 'faux');
    assert.equal(real.length, 2, 'two real <ul>s');
    assert.ok(real.some((l) => l.hasNonItemChildren === true), 'the stray-child <ul> is flagged');
    // four faux: <br>-bulleted, dash-sibling, roman-sibling, emoji-sibling — NOT the card grid, single hyphen, or em-dash prose.
    assert.equal(faux.length, 4, 'br + dash + roman + emoji faux lists; em-dash attribution and card grid are NOT lists');
    const samples = faux.flatMap((l) => l.itemSamples).join(' | ');
    assert.ok(/i\. first|ii\. second/.test(samples), 'roman-numbered faux list detected (adversarial recall fix)');
    assert.ok(/🔹/.test(samples), 'emoji-bulleted faux list detected (adversarial recall fix)');
    assert.ok(!/Ada, on engines/.test(samples), 'em-dash attribution prose is NOT a faux list (adversarial precision fix)');
  } finally { await browser.close(); }
});

// ───────────────────────────── G2/G3 + G5 — collector / runner gates (Chrome-guarded) ─────────────────────────────
const { collectActPage } = require('../lib/act-page-collect.js');
const GATE_HTML = `<!doctype html><meta charset=utf-8><style>.bg{background-image:url(http://x/i.png)}.ic{display:inline-block;width:32px;height:32px}</style><body>
  <a id="p1" class="bg ic" href="#"></a>
  <button id="d1" class="bg ic" aria-label="Search"></button>
  <span id="d2" class="bg ic" aria-hidden="true"></span>
  <a id="p3" class="bg ic" href="#" aria-labelledby="missing-id"></a>
  <div id="p5" class="bg" style="width:300px;height:200px"></div>
  <div id="dfb" class="bg" style="width:780px;height:400px"></div>
  <div id="c1" class="g-recaptcha" data-sitekey="k" style="width:300px;height:78px"></div>
  <div id="c2" class="turnstile-widget" style="width:300px;height:65px">verify</div>
  <div id="d3" style="width:300px;height:78px">just a div</div>
</body>`;

test('G2/G3: collector fires bg-image on unlabeled controls (incl. DANGLING labelledby) + captcha incl. turnstile class; decoys silent', { skip: !chromeOK, concurrency: false }, async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage();
    const tmp = path.join(os.tmpdir(), 'tt-gap-gate.html');
    fs.writeFileSync(tmp, GATE_HTML);
    const collect = await collectActPage(page, { url: 'file://' + tmp, file: 'tt:gate', runId: 't' });
    const ids = await page.evaluate((xps) => xps.map((xp) => { try { const n = document.evaluate(xp.split('>>')[0], document, null, 9, null).singleNodeValue; return n ? n.id : null; } catch (e) { return null; } }), collect.elements.map((e) => e.xpath));
    const by = {}; collect.elements.forEach((e, i) => { if (ids[i]) by[ids[i]] = e; });
    assert.equal(by.p1 && by.p1.backgroundImageMeaningful, true, 'unlabeled bg-image control fires');
    assert.equal(by.p3 && by.p3.backgroundImageMeaningful, true, 'a DANGLING aria-labelledby does not mask the barrier (adversarial fix)');
    assert.equal(by.p5 && by.p5.backgroundImageMeaningful, true, 'a MEDIUM non-interactive bg fires — size deferred to the rubric (a)');
    assert.ok(!(by.dfb && by.dfb.backgroundImageMeaningful), 'a FULL-BLEED backdrop does NOT fire (almost always decorative) (a)');
    assert.ok(!(by.d1 && by.d1.backgroundImageMeaningful), 'a named control does NOT');
    assert.ok(!(by.d2 && by.d2.backgroundImageMeaningful), 'an aria-hidden bg does NOT');
    assert.equal(by.c1 && by.c1.isCaptcha, true, 'g-recaptcha fires isCaptcha');
    assert.equal(by.c2 && by.c2.isCaptcha, true, 'a turnstile-classed widget fires (adversarial fix)');
    assert.ok(!(by.d3 && by.d3.isCaptcha), 'a plain div is not a captcha');
  } finally { await browser.close(); }
});

const { RUNNERS } = require('../lib/exp-runners.js');
const formErrorRunner = RUNNERS['form-error-probe'];
// G5: a field validated ONLY by a client-side framework REQUIRED marker (no native HTML constraint, not `required`)
// is now CONSTRAINED+applicable — TT 5.F's JS-validated field, previously skipped. A bare type WITHOUT a marker
// stays NOT-applicable (the server-side boundary: a non-navigating probe cannot observe server validation).
const G5_HTML = `<!doctype html><meta charset=utf-8><body>
  <form><input id="jsreq" data-val-required type="text"><input id="plain" type="text">
  <input id="disab" required disabled type="text"><input id="ro" required readonly value="prefilled" type="text">
  <button type="submit">Go</button></form>
</body>`;
const xpById = (id) => `(function(){var e=document.getElementById(${JSON.stringify(id)});var parts=[];for(var n=e;n&&n.nodeType===1;n=n.parentElement){var i=1;for(var s=n.previousElementSibling;s;s=s.previousElementSibling)if(s.tagName===n.tagName)i++;parts.unshift(n.tagName.toLowerCase()+'['+i+']');}return '/'+parts.join('/');})()`;
test('G5: framework-required is constrained; bare/disabled/readonly fields are NOT (no false barrier)', { skip: !(chromeOK && formErrorRunner), concurrency: false }, async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage();
    const tmp = path.join(os.tmpdir(), 'tt-gap-g5.html');
    fs.writeFileSync(tmp, G5_HTML);
    await page.goto('file://' + tmp, { waitUntil: 'load' });
    const run = async (id, cand) => formErrorRunner(page, { targetXpath: await page.evaluate(`(${xpById(id)})`), candidateId: cand });
    const jsreq = await run('jsreq', 'g5a');
    const plain = await run('plain', 'g5b');
    const disab = await run('disab', 'g5c');
    const ro = await run('ro', 'g5d');
    assert.equal(jsreq.applicabilityEvidence.fieldConstrained, true, 'data-val-required makes the JS-validated field constrained');
    assert.equal(jsreq.valid, true, 'and therefore applicable (reaches the error-surface check)');
    assert.equal(plain.applicabilityEvidence.fieldConstrained, false, 'a bare text field with NO constraint stays unconstrained (server-side boundary)');
    assert.equal(disab.valid, false, 'a DISABLED required field is NOT applicable (adversarial false-barrier fix)');
    assert.equal(disab.outcome.errorNotIdentified, false, 'and never reports a barrier');
    assert.equal(ro.valid, false, 'a READONLY required field is NOT applicable (adversarial false-barrier fix)');
    assert.equal(ro.outcome.errorNotIdentified, false, 'and never reports a barrier');
  } finally { await browser.close(); }
});
