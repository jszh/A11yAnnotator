// Regression suite for the SECOND root-cause campaign — the 122 failures that SURVIVED the
// 2026-08-15 fix campaign (docs/analysis/reports-2026-06/RESIDUAL-ROOTCAUSE-AND-CHANGE-PLAN.md).
//
// Five of that campaign's fixes shipped and did NOT take effect. That is the reason this file
// asserts OBSERVABLE end-to-end consequences (an obligation exists; a disposition is a barrier; a
// rubric clause is reachable by the judge) rather than the presence of code. A test that only pins
// "the prose was added" is exactly what let R1 pass review while the hard gate 180 lines above it
// went on deciding every table.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { buildV3 } = require('../../lib/build-v3.js');
const oracle = require('../../lib/applicability-oracle.js');
const { withPipeline, promoted } = require('../helpers.js');

const PROMOTED = promoted([]);
const ID = { file: 'p', runId: 'R', pageDigest: 'sha256:d' };

// a minimal but STRUCTURALLY REAL bundle: collector elements + an instruments artifact, run through
// withPipeline so the manifest/attestation gates pass exactly as in production.
function bundleWith({ elements = [], findings = [] } = {}) {
  return withPipeline({
    collect: { ...ID, collectedAt: 1000, elements },
    experiments: { ...ID, catalogVersion: '3.0.0-phase0', startedAt: 2000, results: [] },
    claimProposals: { ...ID, proposals: [] },
    instruments: { ...ID, findings },   // instruments is cross-artifact bound to the page identity
  });
}

const oblsFor = (r, sc) => r.results.obligationLedger.filter((o) => o.sc === sc);

// ===================================================================================
// S1 — THE KEYSTONE: a CONFIRMED instrument trap could not create an obligation.
//
// build-v3 gave axeObs a mint loop (axeDecidedObligations) and detBarrierObs a mint loop
// (detBarrierObligations); trapObs had NONE, so it could only FILL an obligation the oracle had
// already enumerated. It cannot: detectKeyboardTraps reports the confining REGION's xpath
// (run-instruments.js:83) while applicability-oracle.js enumerates no-keyboard-trap per FOCUSABLE
// ELEMENT. The fill key never matched, so every confirmed trap was dropped — all 11 2.1.2 misses.
// ===================================================================================
test('S1: a confirmed keyboard trap on a REGION xpath mints its own 2.1.2 obligation', () => {
  // The exact production shape: the trap is reported on a region the oracle never enumerates,
  // and the page's focusable elements are NOT in a modal and carry no focusRisk, so the oracle
  // enumerates zero no-keyboard-trap obligations of its own. Before the mint loop: ledger empty.
  const r = buildV3(bundleWith({
    elements: [{ xpath: '/html/body/div[1]/input[1]', tag: 'input', focusable: true, isFormField: true }],
    findings: [{ sc: '2.1.2', kind: 'keyboard-trap', xpath: '/html/body/div[1]', detector: 'tab-cycle', detail: 'confirmed keyboard trap' }],
  }), { authority: PROMOTED });

  assert.equal(r.ok, true, JSON.stringify(r.errors));
  const traps = oblsFor(r, '2.1.2');
  assert.equal(traps.length, 1, 'the confirmed trap must MINT an obligation on the region');
  assert.equal(traps[0].xpath, '/html/body/div[1]');
  assert.equal(traps[0].claimFamily, 'no-keyboard-trap');
});

test('S1: the minted obligation is DISPOSED as a barrier — not left as an empty auto-PARTIAL', () => {
  // Minting alone recovers nothing: §5b must fill it. This is the assertion R1 lacked.
  const r = buildV3(bundleWith({
    elements: [{ xpath: '/html/body/div[1]/input[1]', tag: 'input', focusable: true, isFormField: true }],
    findings: [{ sc: '2.1.2', kind: 'keyboard-trap', xpath: '/html/body/div[1]', detector: 'tab-cycle' }],
  }), { authority: PROMOTED });

  const trap = oblsFor(r, '2.1.2')[0];
  assert.ok(trap, 'obligation exists');
  assert.equal(trap.cleared, false, 'a confirmed trap must never read as cleared');
  const provenance = JSON.stringify(trap);
  assert.ok(/kbd-trap:|instrument/.test(provenance), `barrier must carry instrument provenance: ${provenance}`);
});

test('S1 GUARD: a DIRECTIONAL one-way loop must NEVER mint (ACT a1b64e needs escape in ONE direction)', () => {
  // wcag-understanding/no-keyboard-trap + ACT a1b64e: escape by Tab OR Shift+Tab suffices. The
  // detector emits directional loops with review:true; if the mint loop ever stopped inheriting
  // that filter, every focus-cycling menubar on the corpus becomes a false positive.
  const r = buildV3(bundleWith({
    elements: [{ xpath: '/html/body/div[1]/input[1]', tag: 'input', focusable: true }],
    findings: [{ sc: '2.1.2', kind: 'keyboard-trap-directional', xpath: '/html/body/div[1]', review: true, detail: 'one-way' }],
  }), { authority: PROMOTED });

  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.deepEqual(oblsFor(r, '2.1.2'), [], 'a one-way loop is not a 2.1.2 failure and must not mint');
});

test('S1 GUARD: an ADVISORY confinement (review:true) must not mint either', () => {
  const r = buildV3(bundleWith({
    elements: [{ xpath: '/html/body/div[1]/input[1]', tag: 'input', focusable: true }],
    findings: [{ sc: '2.1.2', kind: 'keyboard-trap-confinement', xpath: '/html/body/div[1]', review: true, detector: 'confinement' }],
  }), { authority: PROMOTED });
  assert.deepEqual(oblsFor(r, '2.1.2'), [], 'an advisory confinement is a review row, not a barrier');
});

test('S1 GUARD: minting never DUPLICATES an obligation the oracle already enumerated', () => {
  // A focusable inside a modal DOES get an oracle-enumerated no-keyboard-trap obligation. If the
  // trap lands on that same element the mint must dedupe, or the ledger double-counts the failure.
  const el = { xpath: '/html/body/dialog[1]/button[1]', tag: 'button', focusable: true, inModal: true };
  const r = buildV3(bundleWith({
    elements: [el],
    findings: [{ sc: '2.1.2', kind: 'keyboard-trap-self-refocus', xpath: el.xpath, detector: 'self-refocus' }],
  }), { authority: PROMOTED });

  const traps = oblsFor(r, '2.1.2').filter((o) => o.xpath === el.xpath);
  assert.equal(traps.length, 1, `exactly one obligation for one element, got ${traps.length}`);
});

test('S1 GUARD: a page with no instrument findings mints nothing (no unconditional 2.1.2 flood)', () => {
  const r = buildV3(bundleWith({
    elements: [
      { xpath: 'a1', tag: 'a', focusable: true },
      { xpath: 'b1', tag: 'button', focusable: true },
      { xpath: 'i1', tag: 'input', focusable: true, isFormField: true },
    ],
    findings: [],
  }), { authority: PROMOTED });
  assert.deepEqual(oblsFor(r, '2.1.2'), [], 'no trap observed ⇒ no 2.1.2 obligation');
});

test('S1 GUARD: the mint is keyed on the oracle id, so a region and an element are distinct subjects', () => {
  const a = oracle.oblId('/html/body/div[1]', '2.1.2', 'no-keyboard-trap');
  const b = oracle.oblId('/html/body/div[1]/input[1]', '2.1.2', 'no-keyboard-trap');
  assert.notEqual(a, b, 'region xpath and member xpath must not collide — that collision is why the fill silently matched nothing');
});

// ===================================================================================
// S2 — the 1.3.1 TABLE GATE was answering a different question than the one being asked.
//
// R1 in the previous campaign added 38 lines of F46 prose to info-relationships-v0.md and never
// touched `tVerdict`, the deterministic gate that self-describes as "a HARD GATE you may not
// override" 180 lines earlier — so the prose was unreachable. These tests pin the SIGNAL the new
// clause reads, not the presence of the prose, which is the mistake that made R1 a no-op.
// ===================================================================================
const { precomputeSignals } = require('../../lib/llm-adjudicator.js');

// the collector's per-table facts, at the fidelity `collectTables` emits them.
const TBL = (over = {}) => ({
  rowCount: 4, colCount: 3, thCount: 3, tdCount: 9, hasCaption: false, captionText: null,
  headers: [], tdWithHeaders: 0, danglingIdref: false, headersRefsNonCell: false, headersRefsSelf: false,
  firstRowAllTh: true, firstColAllTh: false, firstRowPartialTh: false, firstColPartialTh: false,
  bodyTh: 0, headerRows: 1, regularGrid: true, roleOverride: null, headerWithNoDataCell: false,
  looksLikeDataTable: true, summaryAttr: null, hasNonEmptySummary: false, scopeCount: 0,
  headersAttrCount: 0, headerRowThCount: 3, headerColThCount: 0, cellsWithBlockContent: 0,
  cellCount: 12, maxCellTextLen: 20, allTdGrid: false, ...over,
});
const semOf = (over) => {
  const el = { xpath: '/page-level::info-relationships', tag: 'body', __pageStructure: { tables: [TBL(over)] } };
  const s = precomputeSignals(el, 'grouping-and-reading-order', '1.3.1');
  return s.structure.tableSemantics.perTable[0];
};

test('S2: a LAYOUT table fabricating data semantics is flagged (F46) even though the gate cleared it VALID', () => {
  // layout-table-fabricating-data-semantics/case-01 exactly: one <th colspan=3> masthead over cells
  // holding page regions. `hasScope` makes tVerdict say VALID — i.e. the association gate treats the
  // very markup F46 names as the failure as proof of conformance.
  const sem = semOf({ thCount: 1, scopeCount: 1, headerRowThCount: 1, cellsWithBlockContent: 3, cellCount: 5 });
  assert.equal(sem.verdict, 'LAYOUT_STRUCTURE_SUSPECT');
  assert.deepEqual(sem.declared, ['th', 'scope']);
});

test('S2: `summary=` is read at all — the attribute the collector never looked at', () => {
  const sem = semOf({ thCount: 0, headerRowThCount: 0, rowCount: 1, colCount: 2, summaryAttr: 'layout table for hero', hasNonEmptySummary: true, cellsWithBlockContent: 1 });
  assert.equal(sem.verdict, 'LAYOUT_STRUCTURE_SUSPECT');
  assert.ok(sem.declared.includes('summary'));
});

test('S2 GUARD: an EMPTY summary="" is not a failure (F46 names NON-EMPTY summaries)', () => {
  const sem = semOf({ thCount: 0, headerRowThCount: 0, rowCount: 1, colCount: 2, summaryAttr: '', hasNonEmptySummary: false, cellsWithBlockContent: 1 });
  assert.equal(sem.verdict, 'OK');
});

test('S2 GUARD: a layout table declaring role=presentation is CORRECT (TT 14.C PASS condition)', () => {
  const sem = semOf({ roleOverride: 'presentation', thCount: 1, scopeCount: 1, headerRowThCount: 1, cellsWithBlockContent: 4 });
  assert.equal(sem.verdict, 'OK', 'role=presentation strips the owned semantics — never an F46');
});

test('S2 GUARD: a REAL data table whose cells contain a heading/list is NOT flagged', () => {
  // Measured over 872 held-out pages, `layoutShaped` alone flipped two genuine data tables to suspect:
  // a medication schedule with a tooltip <h2> in a cell, and a booking grid with session titles. Both
  // have a full header row — the credible-header-axis exemption is what keeps them out.
  const sem = semOf({ cellsWithBlockContent: 4, firstRowAllTh: true, headerRowThCount: 3, colCount: 3, rowCount: 3, thCount: 5, scopeCount: 5, hasCaption: true });
  assert.equal(sem.verdict, 'OK');
  assert.equal(sem.credibleHeaderAxis, true);
});

test('S2 GUARD: a single <th colspan=N> masthead is NOT a credible header axis', () => {
  // The discriminator: a real header row labels two or more columns; a masthead labels none.
  const sem = semOf({ thCount: 1, headerRowThCount: 1, colCount: 3, cellsWithBlockContent: 2 });
  assert.equal(sem.credibleHeaderAxis, false);
});

test('S2: a DATA table suppressed with role=presentation is flagged (F92)', () => {
  const sem = semOf({ roleOverride: 'presentation', hasCaption: true, scopeCount: 5, thCount: 5, cellsWithBlockContent: 0, rowCount: 6, colCount: 5 });
  assert.equal(sem.verdict, 'DATA_SEMANTICS_SUPPRESSED');
});

test('S2 GUARD: a BARE role=presentation layout table (no th/caption/summary) is the correct pattern', () => {
  const sem = semOf({ roleOverride: 'presentation', thCount: 0, headerRowThCount: 0, hasCaption: false, scopeCount: 0, headersAttrCount: 0, cellsWithBlockContent: 1 });
  assert.equal(sem.verdict, 'OK', 'F92 requires POSITIVE data evidence, not merely a role override');
});

test('S2: a >=2x2 grid with not one <th> is flagged (F91 / TT 14.B) — the omission no longer excuses itself', () => {
  const sem = semOf({ thCount: 0, headerRowThCount: 0, firstRowAllTh: false, allTdGrid: true, looksLikeDataTable: false, rowCount: 6, colCount: 6, cellsWithBlockContent: 0 });
  assert.equal(sem.verdict, 'HEADERLESS_GRID_SUSPECT');
});

test('S2 GUARD: a pre-S2 collector pack (no new fields) degrades to OK, never to a false suspect', () => {
  const old = { rowCount: 4, colCount: undefined, thCount: 3, hasCaption: false, looksLikeDataTable: true,
    firstRowAllTh: true, firstColAllTh: false, roleOverride: null, headers: [], tdWithHeaders: 0 };
  const el = { xpath: '/page-level::info-relationships', tag: 'body', __pageStructure: { tables: [old] } };
  const sem = precomputeSignals(el, 'grouping-and-reading-order', '1.3.1').structure.tableSemantics.perTable[0];
  assert.equal(sem.verdict, 'OK');
});

test('S2: tVerdict (the association gate) is UNTOUCHED — its FP protections must survive', () => {
  const el = { xpath: '/page-level::info-relationships', tag: 'body', __pageStructure: { tables: [
    TBL({ scopeCount: 1, headers: [{ id: null, scope: 'col', text: 'X' }] }),      // scope ⇒ VALID
    TBL({ looksLikeDataTable: false }),                                            // ⇒ NOT_DATA
    TBL({ danglingIdref: true }),                                                  // ⇒ BROKEN
  ] } };
  const s = precomputeSignals(el, 'grouping-and-reading-order', '1.3.1');
  assert.deepEqual(s.structure.tableAssociation.perTable, ['VALID', 'NOT_DATA', 'BROKEN']);
});

// ===================================================================================
// S3 / S5 — 2.4.3. The tab-order fix that gained most (+26.7pp) shipped UNTRUSTWORTHY evidence,
// and the lane was never routed a tool: all 21 residual cases had `toolUse.calls: 0`.
// ===================================================================================
const { toolsForSubject } = require('../../lib/cdp-tool-catalog.js');

test('S3: 2.4.3 is now routed the tools that can see a REVEALED order', () => {
  // The resting ring cannot contain a panel that is display:none at rest, so a clean ring is not
  // evidence. Cases 05/06 did not time out, got a complete ring, and were read as clean.
  const names = toolsForSubject('2.4.3', 'focus-management').map((t) => t.name);
  assert.ok(names.includes('interact_and_observe'), `interact_and_observe must be offered: ${names}`);
  assert.ok(names.includes('observe_state_after_activation'), `observe_state_after_activation must be offered: ${names}`);
});

test('S5: the 2.4.3 signal carries startAnchored, so the judge knows whether index 0 is really first', () => {
  const el = { xpath: '/page-level::focus-order', tag: 'body', __focusOrder: {
    forward: [{ index: 0, xpath: 'a', label: 'Bold' }], backward: [], count: 1, wrapped: true, startAnchored: false,
  } };
  const s = precomputeSignals(el, 'focus-management', '2.4.3');
  assert.equal(s.focusOrder.startAnchored, false);
  assert.match(s.focusOrder.note, /UN-ROTATED|startAnchored/);
});

test('S5 GUARD: an element-level focus-management subject (2.4.7/2.4.11) still gets NO focusOrder', () => {
  // focus-management is shared with the element-level rubrics; their prompts must stay byte-identical.
  const s = precomputeSignals({ xpath: 'btn', tag: 'button', focusable: true }, 'focus-management', '2.4.7');
  assert.equal(s.focusOrder, undefined);
});

// ===================================================================================
// S4 — 4.1.3. The obligation was anchored to the live region, the ONE element already correct.
// ===================================================================================
test('S4: a detector-observed status change mints a PAGE-LEVEL 4.1.3 obligation', () => {
  const r = buildV3(bundleWith({
    elements: [{ xpath: 'b1', tag: 'button', focusable: true }],
    findings: [{ sc: '4.1.3', kind: 'status-change-observed', xpath: 'b1', review: true, detail: 'a region was inserted already carrying its message' }],
  }), { authority: PROMOTED });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  const rows = oblsFor(r, '4.1.3');
  assert.equal(rows.length, 1, 'the observed change must create a page-level obligation');
  assert.equal(rows[0].xpath, oracle.PAGE_STATUS_MESSAGE_XPATH);
});

test('S4 GUARD: a page where NO status change was observed owes nothing (the gate that stops the flood)', () => {
  const r = buildV3(bundleWith({
    elements: [{ xpath: 'b1', tag: 'button', focusable: true }, { xpath: 'b2', tag: 'button', focusable: true }],
    findings: [],
  }), { authority: PROMOTED });
  assert.deepEqual(oblsFor(r, '4.1.3'), [], 'no observed change ⇒ no 4.1.3 obligation on this page');
});

test('S4: a `status-not-announced` BARRIER now reaches the ledger instead of a queue nobody reads', () => {
  // Proven live before this fix: 5 correct findings on the right element -> obligationLedger413: 0.
  const r = buildV3(bundleWith({
    elements: [{ xpath: 'b1', tag: 'button', focusable: true }],
    findings: [{ sc: '4.1.3', kind: 'status-not-announced', xpath: '/html/body/p[1]', detector: 'status-message' }],
  }), { authority: PROMOTED });
  const rows = oblsFor(r, '4.1.3');
  assert.ok(rows.length >= 1, 'the barrier must have an obligation to land on');
  const onTarget = rows.find((o) => o.xpath === '/html/body/p[1]');
  assert.ok(onTarget, `expected an obligation on the message element: ${JSON.stringify(rows)}`);
  assert.equal(onTarget.cleared, false);
});

test('S4: the status observations reach the rubric as signals (the clause has something to read)', () => {
  // P7 in the previous campaign landed a probe field with NO rubric consumer and the judge cleared
  // the page anyway. Pin the plumbing, not the prose.
  const el = { xpath: oracle.PAGE_STATUS_MESSAGE_XPATH, tag: 'body', __statusObservations: [
    { trigger: 'b1', triggerLabel: 'Submit', addedOutsideLiveRegion: [], addedInsideLiveRegion: ['Received'],
      regionsBornWithContent: [{ xpath: 'r1', text: 'Received', politeness: 'polite' }], regionsUpdated: [], removedText: [] },
  ] };
  const s = precomputeSignals(el, 'dynamic-announcement', '4.1.3');
  assert.equal(s.statusObservations.count, 1);
  assert.equal(s.statusObservations.triggers[0].regionsBornWithContent.length, 1);
  assert.match(s.statusObservations.note, /born with its content|announce/i);
});

test('S4 GUARD: auto-update-notification-v0 shares the skill and must NOT receive statusObservations', () => {
  const s = precomputeSignals({ xpath: 'c1', tag: 'div', autoUpdatingContent: true }, 'dynamic-announcement', '4.1.2');
  assert.equal(s.statusObservations, undefined);
});

// ===================================================================================
// REVERTS — two recommendations from the previous round were wrong and are withdrawn here.
// ===================================================================================
const { requiredToolFor } = require('../../lib/required-tool-routing.js');

test('REVERT: grayscale is no longer REQUIRED 1.4.1 evidence — it preserves luminance', () => {
  // micro-checks.js:129 had already MEASURED grayscale losing its bake-off for this exact question
  // ("it preserves luminance, so a colour-only element still reads as a different shade"). Routing it
  // as required evidence contradicted the repo's own measurement, and it produced the 1.4.1 bucket's
  // only false clear.
  const routed = requiredToolFor('1.4.1');
  assert.ok(!routed.some((r) => r.tool === 'render_with_overrides'), `grayscale must not be required 1.4.1 evidence: ${JSON.stringify(routed)}`);
  assert.ok(routed.some((r) => r.tool === 'compute_contrast_ratio'), 'the G183 luminance separation is what IS decidable');
});

// ===================================================================================
// S7 — the items the first pass of this campaign SKIPPED, then went back for.
// ===================================================================================
const coverage = require('../../lib/coverage-registry.js');

test('S7 F42: a script-activated element with no role and no focusability owes control-semantics', () => {
  const el = { xpath: '/html/body/span[1]', tag: 'span', emulatedControl: true };
  assert.ok(oracle.familiesFor(el).includes('control-semantics'));
  assert.deepEqual(coverage.coverageErrors({ elements: [el] }), [], 'Rule 16 parity: the registry must agree');
});

test('S7 F42 GUARD: an ordinary element owes nothing — the fact is the whole gate', () => {
  for (const el of [
    { xpath: '/p', tag: 'p' },
    { xpath: '/a', tag: 'a', focusable: true },
    { xpath: '/b', tag: 'button', focusable: true },
    { xpath: '/d', tag: 'div', emulatedControl: false },
  ]) assert.ok(!oracle.familiesFor(el).includes('control-semantics'), `${el.tag} must not owe control-semantics`);
});

test('S7 F42: the family routes to 1.3.1 and reaches a real rubric', () => {
  const { loadRubrics } = require('../../lib/rubric-loader.js');
  const rubrics = loadRubrics();
  const list = rubrics.rubrics || rubrics;
  const r = (Array.isArray(list) ? list : Object.values(list)).find((x) => x && x.id === 'control-semantics-v0');
  assert.ok(r, 'control-semantics-v0 must exist — a family with no rubric is an obligation nothing can fill');
  assert.equal(String(r.sc), '1.3.1');
});

test('S7 2.1.2: a document-boundary landing is a ring WAYPOINT, not an escape', () => {
  // Every tab ring crosses <body> once per cycle, a native <dialog>'s included — measured directly, a
  // modal whose real order is three buttons records b1 -> b2 -> b3 -> <doc> -> b1. Reading that waypoint
  // as "focus left the region" made probeDirectionalEscape report trapped:false for the entire
  // native-modal family, while still confirming JS traps that snap focus back without touching <body>.
  // Pinned at the source level because the alternative is a live browser fixture for a one-line predicate.
  const src = require('fs').readFileSync(require('path').join(__dirname, '..', '..', 'lib', 'kbd-graph.js'), 'utf8');
  assert.match(src, /focusPositionFor/, 'the three-outcome position helper must exist');
  assert.match(src, /pos === 'outside'\) return \{ trapped: false \}/, 'only a REAL element outside the region ends the probe');
  assert.match(src, /boundaryHits/, 'boundary landings must be tolerated but BOUNDED');
});

test('S7 F10: an embedded-format trap mints a 2.1.2 obligation and reads as a barrier', () => {
  // The detector reports the BOUNDARY element (the iframe/object/shadow host), which the oracle never
  // enumerates for no-keyboard-trap — so this only works because of the S1 mint loop above.
  const r = buildV3(bundleWith({
    elements: [{ xpath: '/html/body/a[1]', tag: 'a', focusable: true }],
    findings: [{ sc: '2.1.2', kind: 'keyboard-trap', xpath: '/html/body/main[1]/iframe[1]', detector: 'keyboard-trap',
      detail: 'confirmed keyboard trap (WCAG F10): focus enters this iframe and cannot leave' }],
  }), { authority: PROMOTED });
  const t = oblsFor(r, '2.1.2');
  assert.equal(t.length, 1);
  assert.equal(t[0].xpath, '/html/body/main[1]/iframe[1]');
  assert.equal(t[0].cleared, false);
});

test('S7 F10 GUARD: a CROSS-ORIGIN embed is review-only — "trapped" and "slower than we waited" look identical', () => {
  const r = buildV3(bundleWith({
    elements: [{ xpath: '/html/body/a[1]', tag: 'a', focusable: true }],
    findings: [{ sc: '2.1.2', kind: 'keyboard-trap', xpath: '/html/body/iframe[1]', review: true, detector: 'keyboard-trap' }],
  }), { authority: PROMOTED });
  assert.deepEqual(oblsFor(r, '2.1.2'), [], 'a review row must not mint — the budget was a guess');
});

test('S7 P5: the collector resolves listeners in the NODE\'S OWN context, not the top frame\'s', () => {
  // A top-frame objectId for an in-frame node makes DOMDebugger.getEventListeners return [] — silently,
  // and indistinguishably from "no listeners". Pinned at the source level: the fix is a DOM.resolveNode
  // round-trip keyed on backendNodeId, and the listener query must use ITS objectId.
  const src = require('fs').readFileSync(require('path').join(__dirname, '..', '..', 'lib', 'act-page-collect.js'), 'utf8');
  assert.match(src, /DOM\.resolveNode', \{ backendNodeId \}/, 'listeners must be resolved from the backendNodeId');
  assert.match(src, /listenerObjectId/, 'and the query must use that objectId');
  assert.match(src, /ancestorListenerTypes/, 'one-level ancestor delegation must be recorded');
  assert.match(src, /delegatedListenerTypes: pageDelegatedListenerTypes/, 'page-level delegation roots must be reported');
});

// ===================================================================================
// S8 — ADVERSARIAL edge cases for the detectors added last. Each of these is a shape that
// LOOKS like the failure and is not, or looks benign and is not. The held-out sweeps proved the
// aperture; these pin the specific ways each predicate could be made to lie.
// ===================================================================================
const { collectErrorSummary } = require('../../lib/collect-error-summary.js');
const { collectFauxColumns } = require('../../lib/collect-faux-columns.js');
const { collectStylingOutliers } = require('../../lib/collect-styling-outliers.js');
const { collectColourPeers } = require('../../lib/collect-colour-peers.js');

// These four run IN THE PAGE, so exercising them needs a DOM. Rather than stand up Chrome for a pure
// predicate, assert the properties that hold at the source level plus the contracts callers depend on.
test('S8: every page-evaluated collector is self-contained (no closure over Node scope)', () => {
  // They are handed to page.evaluate, so a reference to anything outside their own body is a
  // ReferenceError inside the browser — a failure mode that shows up as an empty result, not a crash,
  // and therefore as a silent loss of coverage.
  for (const [name, fn] of Object.entries({ collectErrorSummary, collectFauxColumns, collectStylingOutliers, collectColourPeers })) {
    const src = fn.toString();
    assert.ok(!/\brequire\s*\(/.test(src), `${name} must not require() — it runs in the browser`);
    assert.ok(!/\bprocess\./.test(src), `${name} must not touch process`);
    assert.ok(!/\bmodule\b/.test(src), `${name} must not reference module`);
  }
});

test('S8 F2: the trigger set is strike-through + small-caps ONLY — weight/size must not trigger', () => {
  // Measured: including weight/size fires on 28.6% of pages because that is how the web expresses
  // HIERARCHY. If someone widens `appearance` back, this catches it before a corpus run does.
  const src = collectStylingOutliers.toString();
  const appearance = src.match(/const appearance = \(cs\) => \[([^\]]*)\]/);
  assert.ok(appearance, 'the trigger signature must be a single readable expression');
  assert.match(appearance[1], /textDecorationLine/);
  assert.match(appearance[1], /fontVariantCaps/);
  assert.ok(!/fontWeight|fontSize/.test(appearance[1]),
    `weight/size must not be in the TRIGGER set (they are still REPORTED): ${appearance[1]}`);
});

test('S8 error-summary: coherence requires ALL THREE differences to be empty', () => {
  // A summary can be wrong in three independent ways and any one of them misdirects the user. If the
  // predicate ever reduces to two, a summary that omits a broken field would read as coherent.
  const src = collectErrorSummary.toString();
  const coh = src.match(/coherent:\s*([^,]+),/);
  assert.ok(coh, 'coherent must be a single explicit expression');
  for (const part of ['namedNotFlagged.length === 0', 'flaggedNotNamed.length === 0', 'unresolved.length === 0']) {
    assert.ok(coh[1].includes(part), `coherence must require ${part} — got: ${coh[1]}`);
  }
});

test('S8 error-summary: a block CONTAINING form fields is a form section, not a summary about one', () => {
  const src = collectErrorSummary.toString();
  assert.match(src, /if \(box\.querySelector\(FIELD_SEL\)\) continue;/,
    'a role=alert wrapper around the form itself would otherwise "name" every field in it');
});

test('S8 F34: alignment is only counted where whitespace actually RENDERS', () => {
  // Outside white-space:pre* the browser collapses runs of spaces, so there is no visual column to lose
  // and any "alignment" in the source is invisible to everyone.
  const src = collectFauxColumns.toString();
  assert.match(src, /\^pre\(\$\|-\)/, 'must gate on white-space: pre / pre-wrap / pre-line');
});

test('S8 F10: the escape probe requires Tab AND Shift+Tab AND Escape to all fail', () => {
  const src = require('fs').readFileSync(require('path').join(__dirname, '..', '..', 'lib', 'kbd-graph.js'), 'utf8');
  const fn = src.slice(src.indexOf('async function detectEmbeddedFormatTraps'));
  assert.match(fn, /bwd\.escaped === true.*directional/s, 'a one-way escape is directional, never a barrier');
  assert.match(fn, /escEscapes/, 'Escape must be probed — an editor that swallows Tab but honours Esc is a PASS');
  assert.match(fn, /countedViaCdp/, 'cross-origin frames must be counted through the frame API');
});
