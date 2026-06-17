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

test('axe-surface: wholesale SCs + per-rule 4.1.2 allow-list surface; genuinely-unowned SCs drop', () => {
  const collect = { axeRan: true, axe: [
    axeViolation('color-contrast', ['wcag143', 'wcag2aa'], ['.a']),          // 1.4.3 — NOT surfaced (not wholesale, not a per-rule)
    axeViolation('html-has-lang', ['wcag311'], ['html']),                    // 3.1.1 — surfaced (prefix)
    axeViolation('valid-lang', ['wcag312'], ['span']),                       // 3.1.2 — surfaced (prefix)
    axeViolation('autocomplete-valid', ['wcag135', 'wcag21aa'], ['#email']), // 1.3.5 — surfaced (wholesale)
    axeViolation('image-alt', ['wcag111'], ['img']),                         // 1.1.1 — surfaced (wholesale, NEW)
    axeViolation('link-name', ['wcag244', 'wcag412'], ['a']),                // 2.4.4 wholesale + 4.1.2 per-rule (NEW)
    axeViolation('list', ['wcag131'], ['ul']),                               // 1.3.1 — surfaced
    axeViolation('aria-roles', ['wcag412'], ['div']),                        // 4.1.2 — surfaced via per-rule allow-list (NEW)
    axeViolation('aria-roledescription', ['wcag412'], ['div']),              // 4.1.2 — NOT in the per-rule allow-list ⇒ dropped (no wholesale 4.1.2)
  ] };
  const { ran, findings } = surfaceAxeFindings(collect);
  assert.equal(ran, true);
  assert.deepEqual([...new Set(findings.map((f) => f.sc))].sort(), ['1.1.1', '1.3.1', '1.3.5', '2.4.4', '3.1.1', '3.1.2', '4.1.2']);
  assert.ok(!findings.some((f) => f.sc === '1.4.3'), 'color-contrast (1.4.3) is NOT surfaced (axe does not own it here)');
  assert.ok(!findings.some((f) => f.ruleId === 'aria-roledescription'), 'a 4.1.2 rule NOT on the per-rule allow-list is dropped (no wholesale 4.1.2)');
  assert.ok(findings.some((f) => f.ruleId === 'link-name' && f.sc === '2.4.4') && findings.some((f) => f.ruleId === 'link-name' && f.sc === '4.1.2'), 'link-name fans out to BOTH its SCs (per-rule allow-list)');
  // structured-only: axe's raw html/help prose is NOT carried (cannot leak page content into the
  // strictly-scanned results — note the fixture html even contains the legacy token "N/A").
  assert.ok(findings.every((f) => !('html' in f) && !('help' in f) && !('detail' in f)), 'no page-content prose leaked');
  assert.ok(findings.every((f) => f.source === 'axe' && f.review === false && f.kind === 'violation' && f.authoritative === undefined));
});

test('axe-surface: best-practice rules (no wcag tag) surface via ruleId→SC map', () => {
  const collect = { axeRan: true, axe: [
    axeViolation('presentation-role-conflict', [], ['img']), // best-practice, empty wcag ⇒ mapped to 1.1.1
    axeViolation('empty-heading', [], ['h2']),               // best-practice, empty wcag ⇒ mapped to 1.3.1
    axeViolation('some-other-bp', [], ['div']),              // best-practice not in the map ⇒ dropped
  ] };
  const findings = surfaceAxeFindings(collect).findings;
  assert.deepEqual(findings.map((f) => `${f.ruleId}@${f.sc}`).sort(), ['empty-heading@1.3.1', 'presentation-role-conflict@1.1.1']);
});

test('axe-surface: incomplete (needs-review) findings surface as review-tier (review:true, kind:incomplete)', () => {
  const collect = { axeRan: true,
    axe: [axeViolation('list', ['wcag131'], ['ul'])],
    axeIncomplete: [axeViolation('td-headers-attr', ['wcag131'], ['td']), axeViolation('aria-required-children', ['wcag131'], ['[role=list]'])],
  };
  const findings = surfaceAxeFindings(collect).findings;
  const inc = findings.filter((f) => f.kind === 'incomplete');
  assert.equal(inc.length, 2, 'both incomplete findings surface');
  assert.ok(inc.every((f) => f.review === true), 'incomplete findings are review-tier (a prior, not a decision)');
  assert.ok(findings.some((f) => f.ruleId === 'list' && f.kind === 'violation' && f.review === false), 'violations stay decided (review:false)');
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

// ===== coverage round 2 =====

test('axe-surface (#10): a per-rule allow-listed rule does NOT leak an out-of-scope tag (obsolete 4.1.1)', () => {
  // button-name carries wcag412; a hypothetical/legacy build could also tag it wcag411 (removed in WCAG 2.2).
  // The per-rule gate must surface 4.1.2 but DROP 4.1.1 — only ALLOWLIST_SCS may ride an allow-listed rule.
  const collect = { axeRan: true, axe: [axeViolation('button-name', ['wcag411', 'wcag412'], ['button'])] };
  const findings = surfaceAxeFindings(collect).findings;
  assert.deepEqual(findings.map((f) => f.sc).sort(), ['4.1.2']);
  assert.ok(!findings.some((f) => f.sc === '4.1.1'), 'obsolete 4.1.1 is not surfaced');
});

test('axe-surface (#8): link-in-text-block surfaces under 1.4.1 via the per-rule allow-list (F73 use-of-color)', () => {
  const collect = { axeRan: true, axe: [axeViolation('link-in-text-block', ['wcag141'], ['a.inline'])] };
  const findings = surfaceAxeFindings(collect).findings;
  assert.deepEqual(findings.map((f) => `${f.ruleId}@${f.sc}`), ['link-in-text-block@1.4.1']);
  assert.equal(findings[0].review, false, 'F73 is a decided 1.4.1 finding, not advisory');
});

test('axe-surface (#6): advisory best-practice rules surface review-tier; genuine ones stay decided', () => {
  const collect = { axeRan: true, axe: [
    axeViolation('heading-order', [], ['h3']),       // advisory structure prior ⇒ 1.3.1 review:true
    axeViolation('landmark-unique', [], ['nav']),    // advisory ⇒ 1.3.1 review:true
    axeViolation('region', [], ['div']),             // advisory ⇒ 1.3.1 review:true
    axeViolation('tabindex', [], ['#x']),            // advisory focus-order ⇒ 2.4.3 review:true
    axeViolation('aria-allowed-role', [], ['#y']),   // advisory ⇒ 4.1.2 review:true
    axeViolation('image-redundant-alt', [], ['img']),// advisory ⇒ 1.1.1 review:true
    axeViolation('empty-heading', [], ['h2']),       // GENUINE ⇒ 1.3.1 review:false
    axeViolation('presentation-role-conflict', [], ['img']), // GENUINE ⇒ 1.1.1 review:false
    axeViolation('frame-tested', [], ['iframe']),    // best-practice NOT mapped ⇒ dropped
  ] };
  const findings = surfaceAxeFindings(collect).findings;
  const by = (id) => findings.find((f) => f.ruleId === id);
  assert.equal(by('heading-order').sc, '1.3.1'); assert.equal(by('heading-order').review, true);
  assert.equal(by('tabindex').sc, '2.4.3'); assert.equal(by('tabindex').review, true);
  assert.equal(by('aria-allowed-role').sc, '4.1.2'); assert.equal(by('aria-allowed-role').review, true);
  assert.equal(by('image-redundant-alt').sc, '1.1.1'); assert.equal(by('image-redundant-alt').review, true);
  assert.equal(by('empty-heading').review, false, 'an empty heading is a genuine 1.3.1 barrier, not advisory');
  assert.equal(by('presentation-role-conflict').review, true, 'axe fires this on non-decorative/non-image elements too (ACT 46ca7f), so it is an advisory prior, not a decided 1.1.1');
  assert.ok(!by('frame-tested'), 'an unmapped best-practice rule is still dropped');
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

test('build: triageCandidates (E) consolidate instrument+checker signals on review SCs by (xpath,sc) with agreement', () => {
  const bundle = baseBundle();
  bundle.instruments = { file: 'p', runId: 'R', pageDigest: 'sha256:d', findings: [
    { detector: 'vsr-reading-order', sc: '1.3.2', kind: 'reading-order', xpath: '/x', detail: 'order diverges', review: true, calibrated: false },
    { detector: 'status-message', sc: '4.1.3', kind: 'status-not-announced', xpath: '/y', detail: 'unannounced status' },
    { detector: 'vsr-meaning', sc: '4.1.2', kind: 'no-accessible-name', xpath: '/z', detail: 'no name' }, // 4.1.2 is NOT a triage SC → excluded
  ] };
  bundle.checkerFindings = { file: 'p', runId: 'R', pageDigest: 'sha256:d', source: 'checker', ran: true, findings: [
    { source: 'checker', detector: 'ibm:g1', ruleId: 'g1', sc: '1.4.1', impact: 'serious', kind: 'review', xpath: '/x', review: true }, // 1.4.1 candidate (IBM prior)
    { source: 'axe', detector: 'axe:list', ruleId: 'list', sc: '1.3.1', impact: 'serious', kind: 'violation', xpath: '/u', review: false }, // 1.3.1 is decided, NOT triage → excluded
  ] };
  const r = buildV3(bundle);
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  const tc = r.results.triageCandidates;
  assert.deepEqual([...new Set(tc.map((c) => c.sc))].sort(), ['1.3.2', '1.4.1', '4.1.3'], '4.1.2 + decided 1.3.1 are excluded');
  assert.ok(tc.every((c) => c.review === true && c.authoritative === false), 'triage candidates are review-only, never authoritative');
  assert.ok(tc.every((c) => c.agreement === c.signals.length && c.agreement >= 1), 'agreement = number of unioned signals');
  assert.equal(r.results.summary.triageCandidates, tc.length);
});

test('build: deterministicSignals (F) — 2.5.8 geometry + 2.5.3 label-in-name from collector facts, shadow only', () => {
  const bundle = baseBundle();
  bundle.collect.elements = [
    { xpath: 'node:b1', focusable: true }, // the focus subject (no box/text) — no signal
    { xpath: '/big', focusable: true, box: { x: 0, y: 0, w: 40, h: 40, squareFits: true }, targetOpts: { squareFits: true } }, // 2.5.8 geometry-pass
    { xpath: '/small', focusable: true, box: { x: 0, y: 0, w: 18, h: 18 }, targetOpts: { neighbors: [{ x: 16, y: 0, w: 100, h: 18 }] } }, // 2.5.8 geometry-fail (circle hits neighbour)
    { xpath: '/round', focusable: true, box: { x: 0, y: 0, w: 40, h: 40 }, targetOpts: { cornerRadius: 20 } }, // needs-judgment ⇒ NO signal (deferred)
    { xpath: '/btn', focusable: true, text: 'Submit', axName: 'Go' }, // 2.5.3 label-not-in-name ("submit" ⊄ "go")
    { xpath: '/ok', focusable: true, text: 'Search', axName: 'Search products' }, // visible ⊆ name ⇒ NO signal
  ];
  const r = buildV3(bundle);
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  const ds = r.results.deterministicSignals;
  assert.ok(ds.every((s) => s.authoritative === false && s.shadow === true), 'deterministic signals are shadow only (Decision B)');
  const kinds = ds.map((s) => `${s.sc}:${s.kind}`).sort();
  assert.deepEqual(kinds, ['2.5.3:label-not-in-name', '2.5.8:geometry-fail', '2.5.8:geometry-pass'], 'round (needs-judgment) + ok (label⊆name) emit no signal');
  assert.equal(r.results.summary.deterministicSignals, 3);
  assert.deepEqual({ ...r.results.summary.deterministicSignalsBySc }, { '2.5.8': 2, '2.5.3': 1 });
});

test('build: deterministicSignals (F) — ax-name-presence fires on an EXPOSED name-requiring role with an empty CDP name', () => {
  // NB: the empty-name fixtures use axName:'' — exactly what eval-page.js now produces for a name that
  // resolved to empty (the prior `value || null` coercion conflated empty-with-unresolved, which made
  // this detector unreachable on real data; that coercion is fixed). null = unresolved ⇒ skipped.
  const bundle = baseBundle();
  bundle.collect.elements = [
    { xpath: 'node:b1', focusable: true }, // focus subject — no axRole ⇒ no signal
    { xpath: '/img', axRole: 'image', axName: '', inTree: true },          // 1.1.1 empty-accessible-name
    { xpath: '/btn', axRole: 'button', axName: '', inTree: true },          // 4.1.2 empty-accessible-name
    { xpath: '/sum', axRole: 'DisclosureTriangle', axName: '', inTree: true }, // 4.1.2 (summary)
    { xpath: '/hd', axRole: 'heading', axName: '', inTree: true },          // 1.3.1 (empty heading)
    { xpath: '/opt', axRole: 'option', axName: '', inTree: true },          // option EXCLUDED (placeholder pattern) ⇒ NO signal
    { xpath: '/named', axRole: 'button', axName: 'Close', inTree: true },   // has a name ⇒ NO signal
    { xpath: '/decor', axRole: 'image', axName: '', inTree: false },        // ignored / not in tree ⇒ NO signal (decorative)
    { xpath: '/unres', axRole: 'button', axName: null, inTree: true },      // null axName (unresolved) ⇒ NO signal (uncertain)
    { xpath: '/plain', axRole: 'paragraph', axName: '', inTree: true },     // not a name-requiring role ⇒ NO signal
  ];
  const r = buildV3(bundle);
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  const names = r.results.deterministicSignals.filter((s) => s.detector === 'ax-name-presence');
  assert.ok(names.every((s) => s.authoritative === false && s.shadow === true && s.kind === 'empty-accessible-name'));
  assert.deepEqual(names.map((s) => `${s.sc}:${s.xpath}`).sort(), ['1.1.1:/img', '1.3.1:/hd', '4.1.2:/btn', '4.1.2:/sum']);
});

test('build: deterministicSignals (#16) — dangling aria-labelledby/describedby resolved against structure.pageIds', () => {
  const bundle = baseBundle();
  bundle.collect.structure = { pageIds: { 'real': 5, 'desc-ok': 3 } };
  bundle.collect.elements = [
    { xpath: 'node:b1', focusable: true },
    { xpath: '/lb-dangle', ariaLabelledby: 'gone' },               // 4.1.2 dangling name ref
    { xpath: '/lb-partial', ariaLabelledby: 'real missing2' },     // 4.1.2 (one of two ids absent)
    { xpath: '/db-dangle', ariaDescribedby: 'nope' },              // 1.3.1 dangling description ref
    { xpath: '/lb-ok', ariaLabelledby: 'real' },                   // resolves ⇒ NO signal
    { xpath: '/db-ok', ariaDescribedby: 'desc-ok' },               // resolves ⇒ NO signal
  ];
  const r = buildV3(bundle);
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  const idref = r.results.deterministicSignals.filter((s) => s.detector === 'dangling-idref');
  assert.ok(idref.every((s) => s.authoritative === false && s.shadow === true && s.kind === 'dangling-idref'));
  assert.deepEqual(idref.map((s) => `${s.sc}:${s.xpath}`).sort(), ['1.3.1:/db-dangle', '4.1.2:/lb-dangle', '4.1.2:/lb-partial']);
});

test('build: deterministicSignals (#16) — a SIZE-CAPPED id map disables dangling detection (no false barrier)', () => {
  const bundle = baseBundle();
  const big = {}; for (let i = 0; i < 4000; i++) big['id' + i] = 1; // capped — cannot disprove an idref
  bundle.collect.structure = { pageIds: big };
  bundle.collect.elements = [{ xpath: 'node:b1', focusable: true }, { xpath: '/x', ariaLabelledby: 'definitely-absent' }];
  const r = buildV3(bundle);
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.results.deterministicSignals.filter((s) => s.detector === 'dangling-idref').length, 0);
});

test('build: deterministicSignals (#14) — keyboard-orphan is review-tier and conservative', () => {
  const bundle = baseBundle();
  bundle.collect.elements = [
    { xpath: 'node:b1', focusable: true },
    { xpath: '/orphan', tag: 'div', focusable: false, keyListener: false, cursor: 'pointer', pointerActivationListener: true, listenerTypes: ['click'] }, // FLAG (2.1.1, review)
    { xpath: '/focusable', tag: 'div', focusable: true, cursor: 'pointer', pointerActivationListener: true, listenerTypes: ['click'] },                  // focusable ⇒ NO signal
    { xpath: '/has-key', tag: 'div', focusable: false, keyListener: true, cursor: 'pointer', pointerActivationListener: true, listenerTypes: ['click', 'keydown'] }, // has key handler ⇒ NO signal
    { xpath: '/no-cursor', tag: 'div', focusable: false, keyListener: false, cursor: 'auto', pointerActivationListener: true, listenerTypes: ['click'] }, // not cursor:pointer (likely delegation) ⇒ NO signal
    { xpath: '/native', tag: 'button', focusable: false, keyListener: false, cursor: 'pointer', pointerActivationListener: true, listenerTypes: ['click'] }, // native interactive ⇒ NO signal
    { xpath: '/role', tag: 'div', roleAttr: 'button', focusable: false, keyListener: false, cursor: 'pointer', pointerActivationListener: true, listenerTypes: ['click'] }, // interactive role ⇒ NO signal
    { xpath: '/delegation', tag: 'ul', roleAttr: 'list', focusable: false, keyListener: false, cursor: 'pointer', pointerActivationListener: true, listenerTypes: ['click'] }, // structural role (delegation container) ⇒ NO signal
    { xpath: '/presentational', tag: 'div', roleAttr: 'presentation', focusable: false, keyListener: false, cursor: 'pointer', pointerActivationListener: true, listenerTypes: ['click'] }, // a fake button marked presentational ⇒ FLAG
  ];
  const r = buildV3(bundle);
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  const orphans = r.results.deterministicSignals.filter((s) => s.detector === 'keyboard-orphan');
  assert.deepEqual(orphans.map((s) => s.xpath).sort(), ['/orphan', '/presentational'], 'flags the roleless + presentational fake buttons; excludes the role=list delegation container');
  assert.ok(orphans.every((s) => s.sc === '2.1.1' && s.review === true), 'keyboard-orphan is a review-tier 2.1.1 prior, not a decided barrier');
});

test('build: deterministicSignals (#12) — group-label fires on a nameless multi-control group only', () => {
  const bundle = baseBundle();
  bundle.collect.structure = { fieldsets: [
    { xpath: '/fs-nolegend', tag: 'fieldset', hasLegend: false, legendText: '', ariaLabel: '', labelledbyText: '', controlCount: 3 }, // FLAG (3.3.2)
    { xpath: '/fs-emptylegend', tag: 'fieldset', hasLegend: true, legendText: '', ariaLabel: '', labelledbyText: '', controlCount: 2 }, // empty legend ⇒ FLAG
    { xpath: '/fs-legend', tag: 'fieldset', hasLegend: true, legendText: 'Contact', controlCount: 2 },          // named ⇒ NO signal
    { xpath: '/grp-arialabel', tag: 'div', role: 'group', ariaLabel: 'Shipping', controlCount: 4 },             // aria-label ⇒ NO signal
    { xpath: '/grp-labelledby', tag: 'div', role: 'radiogroup', labelledbyText: 'Size', controlCount: 3 },      // resolved labelledby ⇒ NO signal
    { xpath: '/fs-onecontrol', tag: 'fieldset', hasLegend: false, controlCount: 1 },                            // <2 controls ⇒ NO signal
  ] };
  bundle.collect.elements = [{ xpath: 'node:b1', focusable: true }];
  const r = buildV3(bundle);
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  const grp = r.results.deterministicSignals.filter((s) => s.detector === 'group-label');
  assert.ok(grp.every((s) => s.sc === '3.3.2' && s.authoritative === false && s.shadow === true && s.kind === 'group-without-accessible-name'));
  assert.deepEqual(grp.map((s) => s.xpath).sort(), ['/fs-emptylegend', '/fs-nolegend']);
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
