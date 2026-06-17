// Harness 3.3 — C0: axe-surfacing WIRING. axe runs at COLLECTION time (scripts/eval-page.js →
// collect.axe/collect.axeRan) but the v3 ledger never consumed it. We reconcile axe's DECIDED wins
// (1.3.1 / 1.3.5 / 1.4.4 / 2.4.4 / 3.1.x) into a side `checkerFindings` lane — NON-AUTHORITATIVE,
// identity-bound, never an obligation disposition (no tie-break — HARNESS-3.3-IMPLEMENTATION.md §2).
// Pure mapping + builder tests, plus a Chrome-gated end-to-end orchestrate.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { surfaceAxeFindings, wcagTagToSc, isSurfaced } = require('../lib/axe-surface.js');
const { buildV3 } = require('../lib/build-v3.js');
const { crossArtifactErrors } = require('../lib/cross-artifact.js');
const { orchestrate } = require('../lib/orchestrator.js');
const { CHROME } = require('../lib/run-experiments.js');

// a violation in the eval-page.js out.axe shape: { id, impact, help, wcag:[tag…], nodes:[{target,html}] }
const axeViolation = (id, wcag, targets, impact = 'serious') =>
  ({ id, impact, help: `${id} help text`, wcag, nodes: targets.map((t) => ({ target: [t], html: '<x>page content N/A</x>' })) });

// ===== surfaceAxeFindings (pure mapping) =====

test('axe-surface: surfaces ONLY the decided allow-list (1.3.1/1.3.5/1.4.4/2.4.4/3.1.x), drops the rest', () => {
  const collect = { axeRan: true, axe: [
    axeViolation('color-contrast', ['wcag143', 'wcag2aa'], ['.a']),          // 1.4.3 — NOT surfaced (axe doesn't own it)
    axeViolation('html-has-lang', ['wcag311'], ['html']),                    // 3.1.1 — surfaced (prefix)
    axeViolation('valid-lang', ['wcag312'], ['span']),                       // 3.1.2 — surfaced (prefix)
    axeViolation('autocomplete-valid', ['wcag135', 'wcag21aa'], ['#email']), // 1.3.5 — surfaced
    axeViolation('link-name', ['wcag244', 'wcag412'], ['a']),                // 2.4.4 surfaced; 4.1.2 tag dropped
    axeViolation('list', ['wcag131'], ['ul']),                               // 1.3.1 — surfaced
    axeViolation('aria-roles', ['wcag412'], ['div']),                        // 4.1.2 — NOT surfaced
  ] };
  const { ran, findings } = surfaceAxeFindings(collect);
  assert.equal(ran, true);
  assert.deepEqual([...new Set(findings.map((f) => f.sc))].sort(), ['1.3.1', '1.3.5', '2.4.4', '3.1.1', '3.1.2']);
  assert.ok(!findings.some((f) => f.sc === '1.4.3' || f.sc === '4.1.2'), 'non-allow-listed SCs are dropped');
  // structured-only: axe's raw html/help prose is NOT carried (cannot leak page content into the
  // strictly-scanned results — note the fixture html even contains the legacy token "N/A").
  assert.ok(findings.every((f) => !('html' in f) && !('help' in f) && !('detail' in f)), 'no page-content prose leaked');
  assert.ok(findings.every((f) => f.source === 'axe' && f.review === false && f.kind === 'violation' && f.authoritative === undefined));
});

test('axe-surface: FAIL-CLOSED when axe did not run (missing sentinel ⇒ no signal, not "axe clean")', () => {
  assert.deepEqual(surfaceAxeFindings({ axe: [axeViolation('list', ['wcag131'], ['ul'])] }), { ran: false, findings: [] }); // axeRan missing
  assert.deepEqual(surfaceAxeFindings({ axeRan: false, axe: [axeViolation('list', ['wcag131'], ['ul'])] }), { ran: false, findings: [] });
  assert.deepEqual(surfaceAxeFindings(null), { ran: false, findings: [] });
  assert.deepEqual(surfaceAxeFindings({ axeRan: true }), { ran: true, findings: [] }); // ran, but no axe array ⇒ nothing surfaced (and "ran" is true)
});

test('axe-surface: a violation with several decided SC tags fans out; level/version tags drop', () => {
  const collect = { axeRan: true, axe: [axeViolation('multi', ['wcag131', 'wcag311', 'wcag2a', 'best-practice'], ['#n'])] };
  assert.deepEqual(surfaceAxeFindings(collect).findings.map((f) => f.sc).sort(), ['1.3.1', '3.1.1']);
});

test('axe-surface: multiple nodes fan out per SC; an identical (rule,sc,target) is deduped', () => {
  const collect = { axeRan: true, axe: [axeViolation('list', ['wcag131'], ['ul.a', 'ul.b', 'ul.a'])] };
  const findings = surfaceAxeFindings(collect).findings;
  assert.equal(findings.length, 2, 'two distinct targets; the duplicate ul.a is deduped');
  assert.deepEqual(findings.map((f) => f.xpath).sort(), ['ul.a', 'ul.b']);
});

test('axe-surface: tag→SC + allow-list edge cases', () => {
  assert.equal(wcagTagToSc('wcag1410'), '1.4.10');  // two-digit criterion
  assert.equal(wcagTagToSc('wcag2aa'), null);        // level tag
  assert.equal(wcagTagToSc('best-practice'), null);
  assert.equal(isSurfaced('3.1.99'), true);          // 3.1.x prefix is open-ended
  assert.equal(isSurfaced('3.2.1'), false);
  assert.equal(isSurfaced('1.3.1'), true);
});

// ===== build-v3 consumption =====
const scope = { actionTargetRef: 'node:b1', state: 'fresh-load', action: 'tab-to', environment: 'headless-chromium' };
const FULL = { targetIsFocusable: true, keyboardReachableInState: true, realKeyboardFocus: true, hydrationReady: true, focusDependentIndicator: true, obviouslyVisible: true, stableIndicatorAbsence: true, modeCompletenessProven: true };
const baseBundle = () => ({
  collect: { file: 'p', runId: 'R', pageDigest: 'sha256:d', collectedAt: 1000, elements: [{ xpath: 'node:b1', focusable: true }] },
  experiments: { file: 'p', runId: 'R', pageDigest: 'sha256:d', catalogVersion: '3.0.0-phase0', startedAt: 2000, results: [{ claimId: 'c1', experimentId: 'focus-visual-retry', targetXpath: 'node:b1', sc: '2.4.7', observationScope: scope, outcome: FULL, applicabilityEvidence: { targetIsFocusable: true, keyboardReachableInState: true } }] },
  claimProposals: { file: 'p', runId: 'R', pageDigest: 'sha256:d', proposals: [{ claimId: 'c1', sc: '2.4.7', direction: 'NO_BARRIER_OBSERVED', experimentId: 'focus-visual-retry', claimFamily: 'focus-indicator-visible', observationScope: scope }] },
});

test('build: checker findings surface NON-AUTHORITATIVE, counted by SC; authoritative count unchanged', () => {
  const without = buildV3(baseBundle());
  const bundle = baseBundle();
  bundle.checkerFindings = { file: 'p', runId: 'R', pageDigest: 'sha256:d', source: 'axe', ran: true, findings: [
    { source: 'axe', detector: 'axe:list', ruleId: 'list', sc: '1.3.1', impact: 'serious', kind: 'violation', xpath: 'ul', review: false },
    { source: 'axe', detector: 'axe:html-has-lang', ruleId: 'html-has-lang', sc: '3.1.1', impact: 'serious', kind: 'violation', xpath: 'html', review: false },
  ] };
  const r = buildV3(bundle);
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.results.checkerFindings.length, 2);
  assert.ok(r.results.checkerFindings.every((f) => f.authoritative === false && f.shadow === true), 'checker findings are never authoritative');
  assert.equal(r.results.summary.checkerFindings, 2);
  assert.deepEqual({ ...r.results.summary.checkerFindingsBySc }, { '1.3.1': 1, '3.1.1': 1 }); // null-proto map (a SC id is DATA)
  assert.equal(r.results.summary.authoritative, without.results.summary.authoritative, 'checkers do not change the authoritative count');
});

test('build: evidenceMode (B) reflects which non-authoritative lanes contributed', () => {
  // bare deterministic run: no lanes
  const bare = buildV3(baseBundle()).results.summary.evidenceMode;
  assert.deepEqual(bare, { provisionalMode: 'ungated', runLlm: false, runInstruments: false, checkers: [] });
  // axe surfaced + instruments attached
  const bundle = baseBundle();
  bundle.checkerFindings = { file: 'p', runId: 'R', pageDigest: 'sha256:d', source: 'axe', ran: true, findings: [{ source: 'axe', detector: 'axe:list', ruleId: 'list', sc: '1.3.1', impact: 'serious', kind: 'violation', xpath: 'ul', review: false }] };
  bundle.instruments = { file: 'p', runId: 'R', pageDigest: 'sha256:d', findings: [{ detector: 'tab-order', sc: '2.4.3', kind: 'tab-order', xpath: '/y', detail: 'x' }] };
  const em = buildV3(bundle, { provisionalMode: 'gated' }).results.summary.evidenceMode;
  assert.deepEqual(em, { provisionalMode: 'gated', runLlm: false, runInstruments: true, checkers: ['axe'] });
});

test('build: a malformed checkerFindings artifact is REFUSED (findings must be an array)', () => {
  const bundle = baseBundle();
  bundle.checkerFindings = { file: 'p', runId: 'R', pageDigest: 'sha256:d', findings: 'nope' };
  const r = buildV3(bundle);
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => /checkerFindings/.test(e)), JSON.stringify(r.errors));
});

// ===== identity gate =====
test('gate: a checkerFindings artifact bound to the WRONG page is REFUSED', () => {
  const bundle = baseBundle();
  bundle.checkerFindings = { file: 'p', runId: 'R', pageDigest: 'sha256:WRONG', source: 'axe', ran: true, findings: [] };
  const errs = crossArtifactErrors(bundle);
  assert.ok(errs.some((e) => /pageDigest mismatch: checkerFindings/.test(e)), JSON.stringify(errs));
  assert.equal(buildV3(bundle).ok, false, 'the build refuses a stale/wrong-page checker artifact');
});

// ===== orchestrate wiring (Chrome) =====
const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — checker-findings orchestrate e2e SKIPPED');
const FIXTURE = 'file://' + path.join(__dirname, '..', '..', '..', 'assets', 'saved', 'fx-v3-focus.html');

test('orchestrate: axe surfaced from collect.axe is attached, identity-bound, and surfaced (allow-list only)', { skip: !chromeOK, concurrency: false }, async () => {
  const collect = { file: 'fx-v3-focus.html', runId: 'R', pageDigest: 'sha256:fx', collectedAt: 1000,
    elements: [], // no candidates ⇒ all-PARTIAL; axe surfacing is independent of the experiment pipeline
    axeRan: true, axe: [
      { id: 'html-has-lang', impact: 'serious', help: 'x', wcag: ['wcag311'], nodes: [{ target: ['html'], html: '<html>' }] }, // surfaced
      { id: 'color-contrast', impact: 'serious', help: 'x', wcag: ['wcag143'], nodes: [{ target: ['.x'], html: '<x>' }] },      // dropped
    ] };
  const { built, bundle } = await orchestrate(collect, { elements: [] }, { resolveUrl: () => FIXTURE, now: 2000 });
  assert.equal(built.ok, true, JSON.stringify(built.errors));
  assert.ok(bundle.checkerFindings && bundle.checkerFindings.pageDigest === 'sha256:fx', 'attached + identity-stamped');
  assert.equal(built.results.checkerFindings.length, 1, 'only the allow-listed 3.1.1 surfaced; 1.4.3 dropped');
  assert.equal(built.results.checkerFindings[0].sc, '3.1.1');
  assert.equal(built.results.summary.authoritative, 0, 'axe surfacing never publishes authoritative');
});
