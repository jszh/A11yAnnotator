// BATCH-3 rubric / prompt-surface fixes (docs/analysis/reports-2026-06/BATCH3-RCA-FIX-PLAN.md).
// Item numbers refer to that plan. House pattern (rubric-generalization.test.js): rubrics are PROMPTS whose
// live behavior is validated by LLM runs, so these tests PIN the load-bearing wording against silent removal,
// and test the ADJUDICATOR threading (signals, gates, the loud missing-frame abstain) directly.
//
// Every fixture here is generic and written for this test. None is derived from any evaluated page.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const llmAdj = require('../../lib/llm-adjudicator.js');
const { loadRubrics } = require('../../lib/rubric-loader.js');

const R = loadRubrics().rubrics;
const ID = { file: 'p', runId: 'R', pageDigest: 'sha256:d' };
// rubric prose is hard-wrapped; pin PHRASES whitespace-tolerantly so a re-wrap is not a false failure.
const phrase = (s) => new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'));

// ─────────────────────── #19a — LOUD missing-declared-frame abstain at the required-evidence gate ───────────────────────

function captureStderr(fn) {
  const lines = [];
  const orig = process.stderr.write;
  process.stderr.write = (chunk) => { lines.push(String(chunk)); return true; };
  const restore = () => { process.stderr.write = orig; };
  return fn(lines).finally(restore);
}

test('#19a a missing declared frame emits one [v3:noVerdict] missing-declared-frame line, names the frame(s), and never calls the agent', async () => {
  let called = false;
  const stub = async () => { called = true; return { verdict: 'REPRODUCED', confidence: 'high', summary: 's', reasoning: 'r', evidenceRefs: [] }; };
  const subs = [{
    xpath: '/img', sc: '1.1.1', claimFamily: 'non-text-content', rubricId: 'alt-text-adequacy-v0',
    rubric: R['alt-text-adequacy-v0'], skill: 'name-role-state', element: { xpath: '/img' },
  }];
  await captureStderr(async (lines) => {
    const { judgments } = await llmAdj.runRubricJudgments(subs, { runAgent: stub, visionByXpath: {}, ...ID });
    assert.equal(called, false, 'the model is never called — the gate abstains before dispatch');
    assert.equal(judgments.judgments.length, 0, 'no judgment is emitted (stays auto-PARTIAL upstream)');
    const nv = lines.filter((l) => l.includes('[v3:noVerdict]'));
    assert.equal(nv.length, 1, `exactly one noVerdict line (got ${nv.length}: ${nv.join('|')})`);
    const rec = JSON.parse(nv[0].slice(nv[0].indexOf('{')));
    assert.equal(rec.reason, 'missing-declared-frame');
    assert.equal(rec.frame, 'element-crop,surrounding-region', 'names EXACTLY the declared frames that are missing');
    assert.equal(rec.rubricId, 'alt-text-adequacy-v0');
    assert.equal(rec.sc, '1.1.1');
    assert.equal(rec.xpath, '/img');
  });
});

test('#19a a PARTIALLY-captured subject names only the missing frame, and a fully-captured one emits nothing', async () => {
  const stub = async () => ({ verdict: 'NOT REPRODUCED', confidence: 'high', summary: 's', reasoning: 'r', evidenceRefs: [] });
  const PNG = 'iVBORw0KGgoAAAANSUhEUg=='; // any non-empty base64 — content is never decoded here
  const subs = [{
    xpath: '/img', sc: '1.1.1', claimFamily: 'non-text-content', rubricId: 'alt-text-adequacy-v0',
    rubric: R['alt-text-adequacy-v0'], skill: 'name-role-state', element: { xpath: '/img' },
  }];
  await captureStderr(async (lines) => {
    await llmAdj.runRubricJudgments(subs, { runAgent: stub, visionByXpath: { '/img': { 'element-crop': PNG } }, ...ID });
    const rec = JSON.parse(lines.find((l) => l.includes('missing-declared-frame')).replace(/^[\s\S]*?\{/, '{'));
    assert.equal(rec.frame, 'surrounding-region', 'only the frame actually missing is named');
  });
  await captureStderr(async (lines) => {
    const { judgments } = await llmAdj.runRubricJudgments(subs, {
      runAgent: stub, visionByXpath: { '/img': { 'element-crop': PNG, 'surrounding-region': PNG } }, ...ID,
    });
    assert.equal(judgments.judgments.length, 1, 'fully-captured subject is judged');
    assert.equal(lines.filter((l) => l.includes('missing-declared-frame')).length, 0, 'no noVerdict line when nothing is missing');
  });
});

test('#19a V3_NOVERDICT_LOG=0 silences the line (same opt-out as the adapter channel); the abstain itself is unchanged', async () => {
  const stub = async () => ({ verdict: 'REPRODUCED', confidence: 'high', summary: 's', reasoning: 'r', evidenceRefs: [] });
  const subs = [{
    xpath: '/img', sc: '1.1.1', claimFamily: 'non-text-content', rubricId: 'alt-text-adequacy-v0',
    rubric: R['alt-text-adequacy-v0'], skill: 'name-role-state', element: { xpath: '/img' },
  }];
  process.env.V3_NOVERDICT_LOG = '0';
  try {
    await captureStderr(async (lines) => {
      const { judgments } = await llmAdj.runRubricJudgments(subs, { runAgent: stub, visionByXpath: {}, ...ID });
      assert.equal(judgments.judgments.length, 0, 'still abstains');
      assert.equal(lines.filter((l) => l.includes('[v3:noVerdict]')).length, 0, 'but logs nothing');
    });
  } finally { delete process.env.V3_NOVERDICT_LOG; }
});

// ─────────────────────── #7 — F13 mint reason threaded as a signal + use-of-color branch ───────────────────────

test('#7 an image whose OWN alt states a STRONG colour construction surfaces imageAltColorReferences on its 1.4.1 subject', () => {
  const el = { xpath: '/img', tag: 'img', role: 'img', isImage: true, alt: 'Chart where completed regions are shown in green and pending regions in red' };
  const s = llmAdj.precomputeSignals(el, 'color-and-visual-text', '1.4.1');
  assert.ok(s.imageAltColorReferences, 'the mint reason reaches the prompt');
  assert.equal(s.imageAltColorReferences.field, 'alt');
  assert.ok(Array.isArray(s.imageAltColorReferences.constructions) && s.imageAltColorReferences.constructions.length >= 1);
  assert.match(s.imageAltColorReferences.uncertainReason, /applicability only, never the verdict/);
  assert.match(s.imageAltColorReferences.uncertainReason, /colour-RESOLVED/i, 'states the residual question (which item is in which state)');
});

test('#7 a merely-descriptive colour adjective does NOT fire it (STRONG constructions only, mirroring the oracle mint)', () => {
  const el = { xpath: '/img', tag: 'img', role: 'img', isImage: true, alt: 'A blue delivery van parked outside a bakery' };
  const s = llmAdj.precomputeSignals(el, 'color-and-visual-text', '1.4.1');
  assert.equal(s.imageAltColorReferences, undefined, 'an ordinary photo alt cannot fire the F13 signal');
});

test('#7 the signal is 1.4.1-only within the shared skill, and never on a removed-from-tree image — other prompts stay byte-identical', () => {
  const el = { xpath: '/img', tag: 'img', role: 'img', isImage: true, alt: 'Chart where completed regions are shown in green and pending regions in red' };
  const s143 = llmAdj.precomputeSignals(el, 'color-and-visual-text', '1.4.3');
  assert.equal(s143.imageAltColorReferences, undefined, 'the shared color-and-visual-text skill does not leak the signal onto 1.4.3 subjects');
  const sHidden = llmAdj.precomputeSignals({ ...el, removedFromA11yTree: true }, 'color-and-visual-text', '1.4.1');
  assert.equal(sHidden.imageAltColorReferences, undefined, 'mirrors the oracle aperture: a removed-from-tree image minted nothing');
});

test('#7 rubric: the F13 branch pins the alt-declared coding + the unstated-covariate rule', () => {
  const t = R['use-of-color-v0'].text;
  assert.match(t, /signals\.imageAltColorReferences/, 'names the signal');
  assert.match(t, /F13/, 'cites the failure technique');
  assert.match(t, phrase('An UNSTATED visual covariate never clears this'), 'the covariate rule is pinned');
  assert.match(t, phrase('announces the coding without resolving it'), 'announce-but-withhold is the barrier direction');
});

// ─────────────────────── #29 — colourKeyText key-case sentence (fieldColourState) ───────────────────────

test('#29 rubric: the colourKeyText set-level key sentence is pinned (stated-lightness key + measured >=3:1 + two-state set clears members)', () => {
  const t = R['use-of-color-v0'].text;
  assert.match(t, /`colourKeyText`/, 'names the (sibling-delivered) fact');
  assert.match(t, phrase('apply the key/legend test below ONCE for the set'));
  assert.match(t, phrase('the clearance covers the coded MEMBERS as well as the element that displays the key'));
  assert.match(t, phrase('a member field is never failed for lacking its own private copy of the key text'));
});

// ─────────────────────── #1a — 3.3.1 at-rest truth check ───────────────────────

test('#1a rubric: present at-rest error text must be TRUE of the error, including relational messages against OTHER records', () => {
  const t = R['error-identification-v0'].text;
  assert.match(t, phrase('Present error text is not the end of the check — it must be TRUE of the displayed error'));
  assert.match(t, phrase("against THIS record's `retainedValue`"));
  assert.match(t, phrase("against the OTHER at-rest records' retained values"));
  assert.match(t, phrase('identifies nothing ⇒ REPRODUCED, not a clear'));
});

// ─────────────────────── #3 — F34 CLI-transcript disambiguation ───────────────────────

test('#3 rubric: the "code listing" exclusion is scoped to SOURCE CODE; header-row-over-values output is a table', () => {
  const t = R['info-relationships-v0'].text;
  assert.match(t, phrase('The "code listing" exclusion means SOURCE CODE'));
  assert.match(t, phrase('Captured command/terminal OUTPUT is not source code'));
  assert.match(t, phrase('column labels with per-line values aligned beneath them'));
  assert.match(t, phrase('tabular data conveyed by whitespace'));
  // the original guard survives — ASCII art / monospaced banners stay excluded
  assert.match(t, phrase('ASCII art, a monospaced banner, a code listing, and indented source are aligned and convey no'));
});

// ─────────────────────── #4 + #23 — presence framing: anchors, not the inventory ───────────────────────

test('#4 adjudicator: the visualHeadings note says the entries are deterministic and the list is NOT exhaustive', () => {
  const s = llmAdj.precomputeSignals({ xpath: '/x', __visualHeadings: [{ text: 'A' }] }, 'grouping-and-reading-order', '1.3.1');
  assert.ok(s.visualHeadings, 'signal present');
  assert.match(s.visualHeadings.note, /Each ENTRY is deterministic; the LIST\s+is NOT exhaustive/);
  assert.match(s.visualHeadings.note, /additive anchors, not the complete inventory/);
});

test('#23 rubric: the general presence-framing anchor line is pinned', () => {
  const t = R['info-relationships-v0'].text;
  assert.match(t, phrase('PAGE-LEVEL SIGNAL PAYLOADS ARE ADDITIVE ANCHORS, NOT THE COMPLETE INVENTORY'));
  assert.match(t, phrase('the ABSENCE of an entry asserts nothing'));
  assert.match(t, phrase('The viewport crop remains fully in'));
});

// ─────────────────────── #9 — persistenceSamples / vanishedWhileHeld ───────────────────────

test('#9 rubric: hover-persistent documents the samples; vanishedWhileHeld is refutable ONLY by a dwell past the last sample offset', () => {
  const t = R['hover-persistent-v0'].text;
  assert.match(t, /`persistenceSamples` \/ `vanishedWhileHeld`/);
  assert.match(t, phrase('positive observation of SELF-WITHDRAWAL'));
  assert.match(t, phrase("exceeds the LAST\n  sample's `atMs` offset".replace('\n', ' ')));
  assert.match(t, phrase('information-invalid exception, not a timer'));
});

test('#9 adjudicator: the hoverFacets note documents the samples ONLY when the probe produced them (byte-identical otherwise)', () => {
  const base = { probeRan: true, contentAppeared: true, dismissible: true, hoverable: true, persistent: true, dwellMs: 1600 };
  const noSamples = llmAdj.precomputeSignals({ xpath: '/t', __hoverFacets: { ...base } }, 'color-and-visual-text', '1.4.13');
  assert.ok(noSamples.hoverFacets);
  assert.ok(!/persistenceSamples/.test(noSamples.hoverFacets.note), 'no samples ⇒ the note is unchanged');
  const withSamples = llmAdj.precomputeSignals({
    xpath: '/t',
    __hoverFacets: { ...base, persistenceSamples: [{ atMs: 3000, present: false, held: true }], vanishedWhileHeld: true },
  }, 'color-and-visual-text', '1.4.13');
  assert.equal(withSamples.hoverFacets.vanishedWhileHeld, true, 'the measurement itself rides through the spread');
  assert.match(withSamples.hoverFacets.note, /positive self-withdrawal observation/);
  assert.match(withSamples.hoverFacets.note, /refutable only by a longer held dwell/);
  assert.ok(withSamples.hoverFacets.note.startsWith(noSamples.hoverFacets.note), 'strictly additive — the base note is a prefix');
});

// ─────────────────────── #15 + #16a — decorative redundancy source + valve constraint ───────────────────────

test('#15 rubric: the redundancy quote must be TEXTUAL evidence, never pixels inside the candidate crop', () => {
  const t = R['decorative-image-verification-v0'].text;
  assert.match(t, phrase('NEVER from pixels inside the candidate\'s own crop'));
  assert.match(t, phrase('citing them as the\n"adjacent" equivalent clears the image with itself'.replace('\n', ' ')));
  assert.match(t, phrase('confirm\nthe same words exist in the textual evidence'.replace('\n', ' ')));
});

test('#16a rubric: BOTH abstain valves are constrained to content-bearing locations (a labelled user-entry control is not one)', () => {
  for (const id of ['decorative-image-verification-v0', 'long-description-completeness-v0']) {
    const t = R[id].text;
    assert.match(t, phrase('CONTENT-BEARING locations'), `${id} names the constraint`);
    assert.match(t, phrase('a labelled user-entry control'), `${id} carves the user-entry field`);
    assert.match(t, phrase('what the USER enters'), `${id} states why a field label cannot carry the image content`);
  }
  // …and the valves themselves survive (the abstains stay; only their aperture narrows)
  assert.match(R['decorative-image-verification-v0'].text, phrase('capped or plausibly incomplete'));
  assert.match(R['long-description-completeness-v0'].text, phrase('capped or plausibly incomplete'));
});

// ─────────────────────── #17 + #33 — 4.1.3 stand-alone check: structural clear + icon-accname carve ───────────────────────

test('#33 rubric: a clear over an observed announcement must QUOTE the announced string and name its referent in reasoning', () => {
  const t = R['status-message-v0'].text;
  assert.match(t, phrase('STRUCTURAL REQUIREMENT — a clear must CARRY this check\'s result'));
  assert.match(t, phrase('MUST quote the exact announced string, AND EITHER'));
  assert.match(t, phrase('name the subject/referent that makes it stand alone'));
  assert.match(t, phrase('has not performed this check: return PARTIAL instead'));
  assert.match(t, phrase('the verdict JSON\'s shape is unchanged'), 'explicitly schema-preserving (parsing stays compatible)');
});

// SOUNDNESS FIX F9 (batch-3 adversarial review, round 2): the STRUCTURAL REQUIREMENT above used to demand a
// referent UNCONDITIONALLY on every clear — including the two guarded shapes just below it (a terse "Done"
// outcome, a count whose referent IS the region itself) where NO separate referent exists to quote BY THE
// GUARD'S OWN DESIGN. That forced every legitimately-guarded clear down to PARTIAL, contradicting the guards.
// The fix: the requirement now accepts EITHER a named referent OR an explicit guard name
// (`terse-outcome` / `region-carries-its-own-referent`) — never neither.
test('F9: the structural requirement offers an escape valve to the two guards below it, by NAME, so a guarded clear is not forced to PARTIAL', () => {
  const t = R['status-message-v0'].text;
  assert.match(t, phrase('OR state WHICH GUARD BELOW APPLIES'));
  assert.match(t, /`terse-outcome`/, 'the escape names the one-word-outcome guard');
  assert.match(t, /`region-carries-its-own-referent`/, 'the escape names the region-is-the-referent guard');
  assert.match(t, phrase('quotes no referent AND names no guard'), 'PARTIAL is reserved for doing NEITHER, not for invoking a guard');
  // …and the guards themselves are now labelled with the exact names the structural requirement points at,
  // so a judge (or this test) can cross-reference them without inventing a mapping.
  assert.match(t, phrase('Guard `terse-outcome`: a one-word outcome ("Done")'));
  assert.match(t, phrase('Guard `region-carries-its-own-referent`: a count/value whose referent IS the announced region'));
});

test('#17 rubric: the one-word-outcome guard is carved to exclude icon-accname announcements; symbol-name/lang-mismatch clause present', () => {
  const t = R['status-message-v0'].text;
  assert.match(t, phrase('It does NOT cover an announced string that is an icon\'s ACCESSIBLE NAME'));
  assert.match(t, phrase('NAME OF A SYMBOL, not a composed status message'));
  assert.match(t, /`viaAccName`|`viaAccName: true`/, 'feature-detects the sibling provenance fields');
  assert.match(t, /`accNameVoiced`/, 'names the detector\'s emitted provenance array');
  assert.match(t, phrase('language mismatches `documentLang`'));
  assert.match(t, phrase('Even without provenance fields'), 'degrades gracefully while the detector fact is not in the tree');
  // the guard itself survives for genuine one-word outcomes (F9 relabelled it `terse-outcome` — see below)
  assert.match(t, phrase('a one-word outcome ("Done") after a single'));
});

// ─────────────────────── #34 + #35 — births corroborate WIRING; emptiedAtMs ───────────────────────

test('#34/#35 rubric: births alone never license a clear; a healthy birth corroborates WIRING; emptiedAtMs is the silent-empty shape', () => {
  const t = R['status-message-v0'].text;
  assert.match(t, phrase('it corroborates correct\nWIRING, and nothing more'.replace('\n', ' ')));
  assert.match(t, phrase('A birth record alone NEVER licenses a clear'));
  assert.match(t, /`emptiedAtMs`/, 'documents the (sibling-delivered) transition fact');
  assert.match(t, phrase('apply the removal test of items (2)/(3) to it'));
  assert.ok(!/healthy shape and corroborates a clear/.test(t), 'the old corroborates-a-clear wording is GONE');
});

test('#35 adjudicator: the liveRegionBirths note gains the emptiedAtMs sentence ONLY when a region carries it (byte-identical otherwise)', () => {
  const without = llmAdj.precomputeSignals({ xpath: '/x', __liveRegionBirths: { regions: [{ emptyAtBirth: true, firstContentAtMs: 900 }], documentAgeMs: 5000 } }, 'dynamic-announcement', '4.1.3');
  assert.ok(without.liveRegionBirths);
  assert.ok(!/emptiedAtMs =/.test(without.liveRegionBirths.note), 'no transition fact ⇒ no new sentence');
  assert.match(without.liveRegionBirths.note, /corroborates correct WIRING — never, on its own, a clear/);
  const withFact = llmAdj.precomputeSignals({ xpath: '/x', __liveRegionBirths: { regions: [{ emptyAtBirth: true, firstContentAtMs: 900, emptiedAtMs: 4000 }], documentAgeMs: 5000 } }, 'dynamic-announcement', '4.1.3');
  assert.match(withFact.liveRegionBirths.note, /emptiedAtMs = the region's content was REMOVED/);
  assert.ok(withFact.liveRegionBirths.note.startsWith(without.liveRegionBirths.note), 'strictly additive — the base note is a prefix');
});

// ─────────────────────── #18 — the FOCUSABLE role-less F42 variant ───────────────────────

test('#18 gate: an emulatedControlFocusable element is admitted to control-semantics-v0 (defensive: sibling collector fact)', () => {
  const collect = { elements: [{ xpath: '/div[1]', emulatedControlFocusable: true }, { xpath: '/div[2]' }] };
  const ledger = [
    { xpath: '/div[1]', sc: '1.3.1', claimFamily: 'control-semantics', autoPartial: true },
    { xpath: '/div[2]', sc: '1.3.1', claimFamily: 'control-semantics', autoPartial: true },
  ];
  const subs = llmAdj.selectRubricSubjects(collect, ledger, R, {});
  const ids = subs.filter((s) => s.rubricId === 'control-semantics-v0').map((s) => s.xpath);
  assert.deepEqual(ids, ['/div[1]'], 'the focusable-variant element fires the rubric; the flagless element does not');
});

test('#18 signal: the focusable-variant premise is surfaced so the judge does not read focusability as refuting the rubric', () => {
  const s = llmAdj.precomputeSignals({ xpath: '/div', emulatedControlFocusable: true }, 'grouping-and-reading-order', '1.3.1');
  assert.ok(s.emulatedControlFocusable);
  assert.match(s.emulatedControlFocusable.uncertainReason, /focusability is the PREMISE of this variant, not a refutation/);
  const none = llmAdj.precomputeSignals({ xpath: '/div' }, 'grouping-and-reading-order', '1.3.1');
  assert.equal(none.emulatedControlFocusable, undefined, 'byte-inert while the sibling fact is absent');
});

test('#18 rubric: the premise branch is pinned', () => {
  const t = R['control-semantics-v0'].text;
  assert.match(t, phrase('A SECOND ADMITTED SHAPE — the FOCUSABLE role-less variant'));
  assert.match(t, phrase('Do not reject the premise because the element\nis focusable'.replace('\n', ' ')));
  assert.match(t, phrase('a keyboard user CAN reach it, but assistive'));
});

// ─────────────────────── #22 — titleInstanceConflict (volunteered token, never an absent one) ───────────────────────

test('#22 threading: struct.titleInstanceConflict rides into signals.pageTitle when present, byte-identical when absent', () => {
  const struct = { title: 'Annual statement 2019', headings: [] };
  const without = llmAdj.precomputeSignals({ xpath: oracle_page_xpath(), __pageStructure: struct }, 'page-structure', '2.4.2');
  assert.ok(without.pageTitle);
  assert.equal(without.pageTitle.titleInstanceConflict, undefined);
  const conflict = { titleToken: '2019', pageToken: '2020', kind: 'year' };
  const withFact = llmAdj.precomputeSignals({ xpath: oracle_page_xpath(), __pageStructure: { ...struct, titleInstanceConflict: conflict } }, 'page-structure', '2.4.2');
  assert.deepEqual(withFact.pageTitle.titleInstanceConflict, conflict);
});
// the page-title subject is a pseudo-element; any xpath works for precomputeSignals, kept in a helper for clarity
function oracle_page_xpath() { return '/page-level::page-title'; }

test('#22 rubric: the volunteered-instance-token clause is pinned, and it can NEVER fire on an absent token', () => {
  const t = R['page-title-v0'].text;
  assert.match(t, /signals\.pageTitle\.titleInstanceConflict/);
  assert.match(t, phrase('This clause is about a token the title CONTAINS — it can\nNEVER fire on an ABSENT token'.replace('\n', ' ')));
  assert.match(t, phrase('adds no richness requirement'));
  assert.match(t, phrase('Absent this signal, draw no such inference yourself'));
  // the anti-richness firewall it must not erode
  assert.match(t, phrase('INSTANCE-UNIQUENESS IS NOT A BARRIER CONDITION'));
});

// SOUNDNESS FIX F3 (batch-3 adversarial review): the clause used to promise the judge more than the
// collector checks — "a year/date/number/edition marker" (it reads YEARS only) and surfaces that
// "consistently assert" the other token (it checks a corroborated MAJORITY, never unanimity). The reworded
// clause must state the guarantee exactly, and must not re-grow either overclaim.
test('#22 rubric (F3): the clause claims YEARS only and a MAJORITY, never dates/editions or unanimity', () => {
  const t = R['page-title-v0'].text;
  assert.match(t, phrase('The token is a **YEAR, and only a year**'));
  assert.match(t, phrase('no dates, numbers, editions or version markers'));
  assert.match(t, phrase('a MAJORITY of the page\'s identity surfaces against the title — NOT unanimity'));
  assert.match(t, phrase('carried either by a PRIMARY identity surface'));
  assert.match(t, phrase('"established/founded/since" constructions stripped out'));
  assert.match(t, phrase('Read `surfaces[]` before you use it'));
  assert.doesNotMatch(t, phrase('a year/date/number/edition marker'), 'the overclaimed token kinds are gone');
  assert.doesNotMatch(t, phrase('those surfaces consistently assert'), 'the unanimity overclaim is gone');
});

// ─────────────────────── #25 — occludedBy + initial-focus facts ───────────────────────

test('#25 threading: initialFocus rides into signals.focusOrder and the note documents the occlusion facts ONLY when they exist', () => {
  const bare = { forward: [{ xpath: '/a[1]' }, { xpath: '/a[2]' }], backward: [] };
  const without = llmAdj.precomputeSignals({ xpath: '/pg', __focusOrder: bare }, 'focus-management', '2.4.3');
  assert.ok(without.focusOrder);
  assert.equal(without.focusOrder.initialFocus, undefined);
  assert.ok(!/occludedBy/.test(without.focusOrder.note), 'no facts ⇒ the note is unchanged');

  const withFacts = llmAdj.precomputeSignals({
    xpath: '/pg',
    __focusOrder: { forward: [{ xpath: '/a[1]', occludedBy: '/div[9]' }, { xpath: '/a[2]' }], backward: [], initialFocus: { xpath: '/div[9]/a[1]' } },
  }, 'focus-management', '2.4.3');
  assert.deepEqual(withFacts.focusOrder.initialFocus, { xpath: '/div[9]/a[1]' });
  assert.equal(withFacts.focusOrder.forward[0].occludedBy, '/div[9]', 'per-stop occludedBy rides through untouched');
  assert.match(withFacts.focusOrder.note, /`occludedBy`/);
  assert.match(withFacts.focusOrder.note, /`initialFocus`, the stop the\s+PAGE ITSELF placed focus on at load/);
  assert.ok(withFacts.focusOrder.note.startsWith(without.focusOrder.note), 'strictly additive — the base note is a prefix');
});

test('#25 rubric: the containment sentence consumes occludedBy + initialFocus as the deterministic visual-modal case', () => {
  const t = R['focus-modal-containment-v0'].text;
  assert.match(t, /per-stop `occludedBy`/);
  assert.match(t, /signals\.focusOrder\.initialFocus/);
  assert.match(t, phrase('judge containment exactly as if those stops carried'));
});

// ─────────────────────── #1b — bare `err` class token (browser test) ───────────────────────

const puppeteer = require('puppeteer');
const { collectAtRestErrorState } = require('../../lib/collect-error-summary.js');
const { BROWSER_ARGS } = require('../../lib/browser-args.js');
const CHROME = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — batch-3 #1b browser test SKIPPED');

test('#1b collectAtRestErrorState recognises the bare `err` class token (whole-token, delimiter-bounded)', { skip: !chromeOK }, async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'b3-err-fx-'));
  // The message text deliberately contains NO ERROR_WORD stem — detection must ride on the class token alone.
  const fx = path.join(dir, 'err.html');
  fs.writeFileSync(fx, `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Order</title></head><body>
    <form action="/x" method="post" novalidate>
      <div><label for="a">Reference</label><input id="a" value="QQ-9">
        <span class="err">Use the printed reference from your letter</span></div>
      <div><label for="b">Town</label><input id="b" value="Kings Heath"></div>
      <button type="submit">Send</button>
    </form></body></html>`);
  const browser = await puppeteer.launch({ headless: 'new', executablePath: CHROME, args: BROWSER_ARGS });
  try {
    const page = await browser.newPage();
    await page.goto('file://' + fx, { waitUntil: 'load' });
    const r = await page.evaluate(collectAtRestErrorState);
    const bad = r.find((x) => x.label === 'Reference');
    assert.ok(bad, 'the field is described');
    assert.equal(bad.flaggedAtRest, true, 'the class-err message flags the field at rest');
    assert.match(String(bad.adjacentErrorText), /printed reference/i, 'the message text is captured as adjacent error text');
    // …and the delimiter bound holds: a class merely CONTAINING the letters must not flag.
    const fx2 = path.join(dir, 'errand.html');
    fs.writeFileSync(fx2, `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Notes</title></head><body>
      <form action="/x" method="post" novalidate>
        <div><label for="a">Reference</label><input id="a" value="QQ-9">
          <span class="errand-note">Use the printed reference from your letter</span></div>
        <div><label for="b">Town</label><input id="b" value="Kings Heath"></div>
        <button type="submit">Send</button>
      </form></body></html>`);
    await page.goto('file://' + fx2, { waitUntil: 'load' });
    const r2 = await page.evaluate(collectAtRestErrorState);
    const same = r2.find((x) => x.label === 'Reference');
    // the prefilled gate still opens (values retained), but nothing may be FLAGGED off the near-miss class
    assert.ok(!same || same.flaggedAtRest === false, 'a token that merely contains the letters does not flag');
    await page.close();
  } finally { await browser.close(); }
});

// ─────────────────────── late-landing sibling handoffs (same batch-3 session) ───────────────────────

test('#16b-threading: captionText surfaces as a name-role-state signal only when the collector marked it', () => {
  const withCap = llmAdj.precomputeSignals({ xpath: '/img', captionText: 'stages and the paths between them' }, 'name-role-state', '1.1.1');
  assert.ok(withCap.captionText, 'signal present');
  assert.equal(withCap.captionText.text, 'stages and the paths between them');
  assert.match(withCap.captionText.note, /collected separately/);
  const without = llmAdj.precomputeSignals({ xpath: '/img' }, 'name-role-state', '1.1.1');
  assert.equal(without.captionText, undefined, 'byte-inert on unmarked elements');
  const wrongSkill = llmAdj.precomputeSignals({ xpath: '/img', captionText: 'x y z words' }, 'color-and-visual-text', '1.4.1');
  assert.equal(wrongSkill.captionText, undefined, 'gated to the 1.1.1 skill');
});

test('#16b rubric: long-description names signals.captionText as the authoritative caption source', () => {
  const t = R['long-description-completeness-v0'].text;
  assert.match(t, /`signals\.captionText`/);
  assert.match(t, phrase('do not\n  declare the caption unverifiable because the `enclosingHtml` excerpt looks cut off'.replace(/\n\s*/g, ' ')));
});

test('#19c: fieldsetsWithoutControls threads through structuralMarkupFacts with its reading-rule note', () => {
  const collect = { elements: [], structure: { fieldsetsWithoutControls: [{ xpath: '/fieldset[1]', legendText: 'A', textSample: 'B' }] } };
  const ledger = [{ xpath: '/page-level::info-relationships', sc: '1.3.1', claimFamily: 'info-relationships', autoPartial: true }];
  const subs = llmAdj.selectRubricSubjects(collect, ledger, R, {});
  const s = subs.find((x) => x.rubricId === 'info-relationships-v0');
  assert.ok(s, 'page subject selected');
  assert.ok(s.element.__structuralMarkupFacts && s.element.__structuralMarkupFacts.fieldsetsWithoutControls, 'fact threaded');
  const sig = llmAdj.precomputeSignals(s.element, 'grouping-and-reading-order', '1.3.1');
  assert.ok(sig.fieldsetsWithoutControls, 'signal surfaced');
  assert.match(sig.fieldsetsWithoutControls.note, /CHECKED absence/);
  assert.match(sig.fieldsetsWithoutControls.note, /absence claims nothing/);
});

test('#19c rubric: the fieldset-without-controls reading rule is pinned (abstract, both directions guarded)', () => {
  const t = R['info-relationships-v0'].text;
  assert.match(t, /`signals\.fieldsetsWithoutControls`/);
  assert.match(t, phrase('presentation dressed as structure'));
  assert.match(t, phrase('truthfully introduces a grouped set of controls is correct markup, never a finding'));
});

test('#20: labelGeometryMismatch surfaces on grouping-skill subjects with the two-pairings framing', () => {
  const el = { xpath: '/input', isFormField: true, labelGeometryMismatch: { ownLabelText: 'A', visuallyAdjacentLabelText: 'B', visuallyAdjacentLabelFor: 'b', gapPx: 6 } };
  const s = llmAdj.precomputeSignals(el, 'grouping-and-reading-order', '1.3.1');
  assert.ok(s.labelGeometryMismatch);
  assert.equal(s.labelGeometryMismatch.ownLabelText, 'A');
  assert.match(s.labelGeometryMismatch.uncertainReason, /never a\s+verdict/);
  const none = llmAdj.precomputeSignals({ xpath: '/input', isFormField: true }, 'grouping-and-reading-order', '1.3.1');
  assert.equal(none.labelGeometryMismatch, undefined, 'byte-inert without the fact');
});

test('#20 rubric: field-programmatic-association consumes the geometry fact and blocks the for/id-settles-it shortcut', () => {
  const t = R['field-programmatic-association-v0'].text;
  assert.match(t, /`signals\.labelGeometryMismatch`/);
  assert.match(t, phrase('Do not reason "for/id resolves, therefore\nthe association is correct" past this fact'.replace(/\n/g, ' ')));
  assert.match(t, phrase('Absent the signal, do not derive cross-pairing from the crops alone'));
});

test('#10 (kbd handoff): the clause-C gate opens on a reveal containmentLeak with leakedStops > 0 — and ONLY then', () => {
  const R2 = R;
  const mk = (fo) => llmAdj.selectRubricSubjects(
    { elements: [] },
    [{ xpath: '/page-level::focus-order', sc: '2.4.3', claimFamily: 'focus-order', autoPartial: true }],
    R2, { focusOrder: fo },
  ).some((s) => s.rubricId === 'focus-modal-containment-v0');
  const leak = { forward: [{ xpath: '/a', reveal: { containmentLeak: { modalXpath: '/d', openedStops: 3, leakedStops: 2, leakedSample: [] } } }], backward: [] };
  const contained = { forward: [{ xpath: '/a', reveal: { containmentLeak: { modalXpath: '/d', openedStops: 3, leakedStops: 0, leakedSample: [] } } }], backward: [] };
  const noAgg = { forward: [{ xpath: '/a', reveal: {} }], backward: [] };
  assert.equal(mk(leak), true, 'leakedStops > 0 opens the containment clause');
  assert.equal(mk(contained), false, 'a contained modal (0 leaks) does not');
  assert.equal(mk(noAgg), false, 'a null/absent aggregate does not');
});

test('#10 rubric: focus-modal-containment documents the opened-ring aggregate with the same fact test', () => {
  const t = R['focus-modal-containment-v0'].text;
  assert.match(t, /`reveal\.containmentLeak`/);
  assert.match(t, phrase('`leakedStops: 0` with the aggregate present is measured containment'));
  assert.match(t, phrase('a null/absent\naggregate means no modal was rendered open during that walk and claims nothing'.replace(/\n/g, ' ')));
});

test('#29-tightened: the colourKeyText clearance requires ALL THREE legs jointly and key presence is never a clear', () => {
  const t = R['use-of-color-v0'].text;
  assert.match(t, phrase('The presence of the key text is NEVER itself a\nclear'.replace(/\n/g, ' ')));
  assert.match(t, phrase('cleared ONLY when ALL THREE hold JOINTLY'));
  assert.match(t, phrase('may BE the colour-only instruction'));
  assert.match(t, phrase('When any leg fails, judge the key text\nunder the instruction/key tests below'.replace(/\n/g, ' ')));
});

test('#34a: mutatedFragment is read as the exact announced text, judged under the stand-alone check', () => {
  const t = R['status-message-v0'].text;
  assert.match(t, /`mutatedFragment`/);
  assert.match(t, phrase('apply the stand-alone check below to the\n   FRAGMENT'.replace(/\n\s*/g, ' ')));
});
