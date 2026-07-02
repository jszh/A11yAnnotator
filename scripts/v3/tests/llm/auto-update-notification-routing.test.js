// #9 fix — TT 4.1.2 Test 2.D (auto-updating content notification). A Bootstrap carousel swaps slides via
// setInterval + a CSS *transition*, not @keyframes, so the pre-existing autoMotion signal (gated on animationName)
// never fires on it — a real DHS Trusted-Tester page (a carousel with ZERO aria-live anywhere) minted NO obligation
// for "does this announce its automatic changes", only an unrelated accessible-name-adequacy check on its
// prev/next buttons. This pins: (1) the new autoUpdatingContent collector signal, (2) the applicability-oracle
// family + its liveRegion exclusion, (3) end-to-end on the real DHS page.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const oracle = require('../../lib/applicability-oracle.js');
const { selectRubricSubjects, precomputeSignals } = require('../../lib/llm-adjudicator.js');

const RUBRICS = {
  'accessible-name-adequacy-v0': { id: 'accessible-name-adequacy-v0', sc: '4.1.2', skill: 'name-role-state', visionEvidence: ['element-crop'] },
  'auto-update-notification-v0': { id: 'auto-update-notification-v0', sc: '4.1.2', skill: 'dynamic-announcement', visionEvidence: ['element-crop', 'surrounding-region'] },
};
const ids = (subs, xp) => subs.filter((s) => s.xpath === xp).map((s) => s.rubricId).sort();

const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const chromeOK = fs.existsSync(CHROME);

// ===================== applicability-oracle: family predicate =====================
test('applicability-oracle #9: an auto-updating element NOT already in a live region owes auto-update-notification (4.1.2)', () => {
  const el = { xpath: '/carousel', autoUpdatingContent: true, liveRegion: false };
  const scs = oracle.deriveObligations({ elements: [el] }).filter((o) => o.xpath === '/carousel').map((o) => o.sc);
  assert.ok(scs.includes('4.1.2'));
});

test('applicability-oracle #9 NO OVER-SUPPRESSION: a plain widget (autoUpdatingContent:false) does not owe it', () => {
  const el = { xpath: '/plain', autoUpdatingContent: false, liveRegion: false };
  const fam = oracle.deriveObligations({ elements: [el] }).filter((o) => o.xpath === '/plain' && o.claimFamily === 'auto-update-notification');
  assert.equal(fam.length, 0);
});

test('applicability-oracle #9 EXCLUSION: an auto-updating element that IS already inside a live region does NOT ALSO get this family (status-message-v0 already owns adequacy there)', () => {
  const el = { xpath: '/live-carousel', autoUpdatingContent: true, liveRegion: true };
  const fams = oracle.deriveObligations({ elements: [el] }).filter((o) => o.xpath === '/live-carousel').map((o) => o.claimFamily);
  assert.ok(!fams.includes('auto-update-notification'), 'liveRegion:true routes to status-message instead');
  assert.ok(fams.includes('status-message'), 'the status-message family still fires (its own, separate obligation)');
});

// ===================== RUBRIC_GATE mutual exclusivity (the over-routing bug caught live) =====================
// #9 REGRESSION (self-caught, not user-reported): the first version of this fix shipped with NO RUBRIC_GATE
// entry for auto-update-notification-v0. Since routing is by SC string match only (see selectRubricSubjects),
// and accessible-name-adequacy-v0 ALSO declares sc:'4.1.2', the rubric was tried on EVERY 4.1.2 row — plain
// iframes, "Next" links, anything — not just the carousel container the collector actually flagged. Live-run
// evidence: results/tt-thoroughround-verify-4_1_2 showed auto-update-notification-v0 firing on
// /html/body/iframe[2] and /html/body/a[1] with transport-null http-400s from OpenAI (malformed/empty-evidence
// prompts for elements with no autoUpdatingContent fact at all).
test('routing #9: a plain 4.1.2 row (no autoUpdatingContent) gets ONLY accessible-name-adequacy-v0', () => {
  const collect = { elements: [{ xpath: '/html/body/iframe[2]', role: 'iframe' }] };
  const ledger = [{ xpath: '/html/body/iframe[2]', sc: '4.1.2', claimFamily: 'accessible-name-adequacy', autoPartial: true }];
  const subs = selectRubricSubjects(collect, ledger, RUBRICS);
  assert.deepEqual(ids(subs, '/html/body/iframe[2]'), ['accessible-name-adequacy-v0']);
});

test('routing #9: the carousel row (autoUpdatingContent:true) DOES get auto-update-notification-v0 (accessible-name-adequacy-v0 legitimately also fires — it independently judges whether the carousel container itself has an adequate name, ungated, unaffected by this fix)', () => {
  const collect = { elements: [{ xpath: '/carousel', autoUpdatingContent: true }] };
  const ledger = [{ xpath: '/carousel', sc: '4.1.2', claimFamily: 'auto-update-notification', autoPartial: true }];
  const subs = selectRubricSubjects(collect, ledger, RUBRICS);
  assert.deepEqual(ids(subs, '/carousel'), ['accessible-name-adequacy-v0', 'auto-update-notification-v0']);
});

test('routing #9: a page with a plain 4.1.2 row and a carousel row — auto-update-notification-v0 fires ONLY where autoUpdatingContent is true', () => {
  const collect = { elements: [
    { xpath: '/carousel', autoUpdatingContent: true },
    { xpath: '/a-next', role: 'link' }, // the "Next" control — a plain accessible-name-adequacy row, NOT auto-updating itself
  ] };
  const ledger = [
    { xpath: '/carousel', sc: '4.1.2', claimFamily: 'auto-update-notification', autoPartial: true },
    { xpath: '/a-next', sc: '4.1.2', claimFamily: 'accessible-name-adequacy', autoPartial: true },
  ];
  const subs = selectRubricSubjects(collect, ledger, RUBRICS);
  assert.deepEqual(ids(subs, '/carousel'), ['accessible-name-adequacy-v0', 'auto-update-notification-v0']);
  assert.deepEqual(ids(subs, '/a-next'), ['accessible-name-adequacy-v0'], 'auto-update-notification-v0 must NOT fire here — no autoUpdatingContent fact');
  assert.equal(subs.length, 3, 'exactly 3 subjects total (2 on the carousel row, 1 on the plain row) — no over-routing');
});

// ===================== HTML-gate exemption (the "evidence-starved UNCERTAIN" bug caught live) =====================
// #9 REGRESSION 2 (also self-caught): 4.1.2 is in the default HTML_RUNNER_OWNED_SC gate set (raw markup is
// withheld for 4.1.2 by default, because it over-flagged accessible-name-adequacy-v0's FPs on aria-hidden
// markup). That blanket gate ALSO starved auto-update-notification-v0 — whose entire judgment turns on
// confirming aria-live/role=status PRESENCE, a fact NO screenshot can show. Live-run evidence: the real DHS
// 457383-14 carousel's obligation correctly MINTED and ROUTED, but the model returned UNCERTAIN ("cannot
// determine ... whether ... announces") on both evidence-starved attempts — a correct abstention given what it
// was handed, not a reasoning failure. This pins the (sc, skill) exemption that restores markup for this rubric
// ONLY, leaving accessible-name-adequacy-v0's gate untouched.
test('precomputeSignals #9: auto-update-notification-v0 (skill:dynamic-announcement) on 4.1.2 STILL receives raw markup despite the SC-level gate', () => {
  const element = { xpath: '/carousel', autoUpdatingContent: true, htmlSnippet: '<div class="carousel">', enclosingHtml: '<body><div class="carousel">' };
  const s = precomputeSignals(element, 'dynamic-announcement', '4.1.2');
  assert.equal(s.rawElementHtml, '<div class="carousel">', 'markup evidence must be present for this rubric to judge aria-live presence at all');
});

test('precomputeSignals #9 REGRESSION GUARD: accessible-name-adequacy-v0 (skill:name-role-state) on 4.1.2 is STILL gated OFF (its FP-avoidance is unaffected)', () => {
  const element = { xpath: '/iframe', htmlSnippet: '<iframe aria-hidden="true">', enclosingHtml: '<body><iframe aria-hidden="true">' };
  const s = precomputeSignals(element, 'name-role-state', '4.1.2');
  assert.equal(s.rawElementHtml, undefined, 'the pre-existing gate for the OTHER 4.1.2 rubric must remain intact — this exemption is narrowly (sc,skill)-scoped');
});

test('precomputeSignals #9 REGRESSION GUARD: dynamic-announcement on an UNRELATED runner-owned SC (1.4.3) is STILL gated OFF (exemption is 4.1.2-specific, not skill-wide)', () => {
  const element = { xpath: '/x', htmlSnippet: '<div style="color:#888">', enclosingHtml: '<body><div style="color:#888">' };
  const s = precomputeSignals(element, 'dynamic-announcement', '1.4.3');
  assert.equal(s.rawElementHtml, undefined, 'the exemption must not leak into other HTML-gated SCs just because the skill happens to match');
});

// ===================== collector signal (real DOM) =====================
async function collect(html) {
  const puppeteer = require('puppeteer');
  const { collectActPage, normalizeCollectRoles } = require('../../lib/act-page-collect.js');
  const { BROWSER_ARGS } = require('../../lib/orchestrator.js');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'auto-update-'));
  fs.writeFileSync(path.join(tmp, 'index.html'), html);
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: BROWSER_ARGS });
  try {
    const page = await browser.newPage();
    const url = 'file://' + path.join(tmp, 'index.html');
    const out = normalizeCollectRoles(await collectActPage(page, { url, elementCap: 40, file: 'p', runId: 'p', sourceUrl: url, autoUpdateWindowMs: 0 }));
    return out.elements;
  } finally { await browser.close(); }
}

test('act-page-collect #9: a Bootstrap data-ride="carousel" element is flagged autoUpdatingContent:true', { skip: !chromeOK, concurrency: false }, async () => {
  const els = await collect(`<!doctype html><html><body>
    <div id="carouselExampleIndicators" class="carousel slide" data-ride="carousel" tabindex="0">
      <div class="carousel-inner"><div class="carousel-item active">Slide 1</div></div>
    </div>
  </body></html>`);
  const carousel = els.find((e) => e.xpath.includes('div[1]'));
  assert.equal(carousel.autoUpdatingContent, true);
});

test('act-page-collect #9 REGRESSION GUARD: an ordinary focusable div with no data-ride is NOT flagged', { skip: !chromeOK, concurrency: false }, async () => {
  const els = await collect(`<!doctype html><html><body><div tabindex="0" class="carousel">Not actually rotating</div></body></html>`);
  const div = els.find((e) => e.xpath.includes('div[1]'));
  assert.equal(div.autoUpdatingContent, false, 'the class name "carousel" alone (no data-ride attribute) must NOT trigger — narrowly scoped to the real marker');
});

test('act-page-collect #9 REGRESSION GUARD: a Bootstrap 5 data-bs-ride="carousel" element is ALSO flagged (both attribute generations)', { skip: !chromeOK, concurrency: false }, async () => {
  const els = await collect(`<!doctype html><html><body><div tabindex="0" data-bs-ride="carousel">Slides</div></body></html>`);
  const div = els.find((e) => e.xpath.includes('div[1]'));
  assert.equal(div.autoUpdatingContent, true);
});

// ===================== end-to-end on the real DHS page =====================
test('end-to-end #9: the real DHS 457383-14 carousel now mints an auto-update-notification obligation (previously ZERO obligation existed for this defect)', { skip: !chromeOK, concurrency: false }, async () => {
  const puppeteer = require('puppeteer');
  const { collectActPage, normalizeCollectRoles } = require('../../lib/act-page-collect.js');
  const { BROWSER_ARGS } = require('../../lib/orchestrator.js');
  const url = 'file:///Users/jason/Developer/A11yAnnotator/refs/DHS-Trusted-Tester-examples/_captured-pages/457383-14/index.html';
  if (!fs.existsSync(url.replace('file://', ''))) { console.log('# DHS corpus not present locally — skipping'); return; }
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: BROWSER_ARGS });
  try {
    const page = await browser.newPage();
    const collect = normalizeCollectRoles(await collectActPage(page, { url, elementCap: 80, file: 'p', runId: 'p', sourceUrl: url, autoUpdateWindowMs: 0 }));
    const obligations = oracle.deriveObligations(collect).filter((o) => o.claimFamily === 'auto-update-notification');
    assert.ok(obligations.length > 0, 'the real Bootstrap carousel on this page now owes an auto-update-notification obligation');
  } finally { await browser.close(); }
});
