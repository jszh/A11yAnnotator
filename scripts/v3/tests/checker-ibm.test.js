// Harness 3.3 — C1: IBM Equal Access normalization + INERT wiring. The pure normalizer is the tested
// core; the live lane is opt-in and INERT unless `accessibility-checker` is installed (it fetches its
// rulepack from a CDN at runtime). IBM is wired ONLY on its surviving grounds: 1.4.12 / 2.5.3 decided +
// 1.4.1 / 1.3.3 triage priors; 1.3.1 / 1.3.5 (axe owns) and 2.4.6 are explicitly dropped.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { normalizeIbmFindings, buildRule2Sc, runIbm } = require('../lib/checker-ibm.js');
const { orchestrate } = require('../lib/orchestrator.js');
const { CHROME } = require('../lib/run-experiments.js');

test('normalizeIbmFindings: 1.4.12/2.5.3 FAIL→hard, POTENTIAL→review; 1.4.1/1.3.3 priors; 1.3.1/2.4.6/PASS dropped', () => {
  const rule2sc = { r_spacing: ['1.4.12'], r_label: ['2.5.3'], r_color: ['1.4.1'], r_sensory: ['1.3.3'], r_info: ['1.3.1'], r_head: ['2.4.6'], r_potential: ['1.4.12'] };
  const items = [
    { ruleId: 'r_spacing', value: ['VIOLATION', 'FAIL'], path: { dom: '/a' }, message: 'text spacing' }, // 1.4.12 hard
    { ruleId: 'r_potential', value: ['VIOLATION', 'POTENTIAL'], path: { dom: '/b' } },                   // 1.4.12 review (soft)
    { ruleId: 'r_label', value: ['VIOLATION', 'FAIL'], path: { dom: '/c' } },                            // 2.5.3 hard
    { ruleId: 'r_color', value: ['VIOLATION', 'POTENTIAL'], path: { dom: '/d' } },                        // 1.4.1 prior (review)
    { ruleId: 'r_color', value: ['VIOLATION', 'FAIL'], path: { dom: '/e' } },                             // 1.4.1 STILL a prior (never hard)
    { ruleId: 'r_sensory', value: ['RECOMMENDATION', 'MANUAL'], path: { dom: '/f' } },                    // 1.3.3 prior
    { ruleId: 'r_info', value: ['VIOLATION', 'FAIL'], path: { dom: '/g' } },                              // 1.3.1 DROPPED (axe owns)
    { ruleId: 'r_head', value: ['VIOLATION', 'FAIL'], path: { dom: '/h' } },                              // 2.4.6 DROPPED
    { ruleId: 'r_label', value: ['VIOLATION', 'PASS'], path: { dom: '/i' } },                             // PASS dropped
  ];
  const f = normalizeIbmFindings(items, rule2sc);
  const bySc = (sc) => f.filter((x) => x.sc === sc);
  assert.deepEqual(bySc('1.4.12').map((x) => x.kind).sort(), ['review', 'violation'], '1.4.12 FAIL→hard, POTENTIAL→review');
  assert.equal(bySc('2.5.3')[0].kind, 'violation'); assert.equal(bySc('2.5.3')[0].review, false);
  assert.equal(bySc('1.4.1').length, 2); assert.ok(bySc('1.4.1').every((x) => x.kind === 'review' && x.review === true), '1.4.1 is a prior even on a FAIL');
  assert.equal(bySc('1.3.3')[0].review, true);
  assert.equal(bySc('1.3.1').length, 0, 'axe owns 1.3.1 — IBM dropped');
  assert.equal(bySc('2.4.6').length, 0, 'IBM contributes no 2.4.6 triage');
  assert.ok(f.every((x) => x.source === 'checker' && x.detector.startsWith('ibm:') && x.authoritative === undefined), 'checker-sourced, non-authoritative');
});

test('buildRule2Sc: maps checkpoint SC numbers to rule ids (IBM_Accessibility ruleset preferred)', () => {
  const rulesets = [
    { id: 'WCAG_2_1', checkpoints: [{ num: '9.9.9', rules: [{ id: 'wrong' }] }] },
    { id: 'IBM_Accessibility', checkpoints: [{ num: '1.4.12', rules: [{ id: 'r_spacing' }] }, { num: '2.5.3 Label in Name', rules: [{ id: 'r_label' }] }, { num: 'nope', rules: [{ id: 'x' }] }] },
  ];
  const m = buildRule2Sc(rulesets);
  assert.deepEqual(m.r_spacing, ['1.4.12']);
  assert.deepEqual(m.r_label, ['2.5.3']);
  assert.equal(m.x, undefined, 'a checkpoint without an SC number is skipped');
  assert.equal(m.wrong, undefined, 'the non-IBM ruleset is not used');
});

test('runIbm: INERT when accessibility-checker is absent → checkerUnavailable (never throws)', async () => {
  let r;
  await assert.doesNotReject(async () => { r = await runIbm(null, {}); });
  assert.equal(r.checkerUnavailable, true);
  assert.equal(typeof r.reason, 'string');
});

const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — checker-ibm orchestrate e2e SKIPPED');
const FIXTURE = 'file://' + path.join(__dirname, '..', '..', '..', 'assets', 'saved', 'fx-v3-focus.html');

test('orchestrate(runChecker): an unavailable IBM is RECORDED (checkerUnavailable), never silently skipped', { skip: !chromeOK, concurrency: false }, async () => {
  const collect = { file: 'fx-v3-focus.html', runId: 'R', pageDigest: 'sha256:fx', collectedAt: 1000, elements: [] };
  const { built, bundle } = await orchestrate(collect, { elements: [] }, { resolveUrl: () => FIXTURE, now: 2000, runChecker: true });
  assert.equal(built.ok, true, JSON.stringify(built.errors));
  // accessibility-checker is not installed in this repo ⇒ the artifact records the skip rather than vanishing.
  assert.ok(bundle.checkerFindings && typeof bundle.checkerFindings.checkerUnavailable === 'string', 'IBM unavailability recorded on the artifact');
  assert.equal(built.results.summary.evidenceMode.checkerUnavailable, bundle.checkerFindings.checkerUnavailable, 'surfaced in evidenceMode');
  assert.equal(built.results.summary.authoritative, 0);
});
