// USER RULINGS 2026-08-18 (BATCH3-RCA-FIX-PLAN.md "2026-08-18 user rulings") — the two prompt-side
// doctrine decisions, pinned.
//
// Ruling 1 (removal-06, Reading A): the state-change softening — "a flow whose only outcome rows are
// state-changes/visibility-flips is not the textual-status-lost shape" — is SCOPED to flows that never
// announced an interim busy/progress message. A flow that announced one and then removed/emptied it has
// established that the operation reports status as announced text; an attribute flip is not that announced
// follow-up. The unscoped wording was measured (four-arm replay, item 36) suppressing a real catch at least
// as hard as the pre-remediation tree while the scoped wording keeps the attribute-flip FP win with zero
// collateral.
//
// Ruling 2 (inline-links-05, F73 cue-parity): use-of-color-v0's deferral to an axe link-in-text-block PASS
// gains a measured-parity carve-out, fact-gated on the linkCueParity census (collect-link-facts.js style
// math). The signal must reach the judge for the clause to be decidable, so the adjudicator grows a
// linkCueParity block — key-guarded, colour-skill-confined, strictly additive.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const llmAdj = require('../../lib/llm-adjudicator.js');

const RUBRICS = path.join(__dirname, '..', '..', 'llm-rubrics');
const useOfColor = fs.readFileSync(path.join(RUBRICS, 'use-of-color-v0.md'), 'utf8');
const statusMessage = fs.readFileSync(path.join(RUBRICS, 'status-message-v0.md'), 'utf8');

// ═══ Ruling 1 — the softening is scoped, in BOTH prompt surfaces ═══════════════════════════════════════

test('ruling 1: status-message-v0 item 4 scopes the state-change softening to flows with no announced interim status', () => {
  // the softening must still exist (the attribute-flip FP win is kept) …
  assert.match(statusMessage, /state-change/, 'the state-change reading is still present');
  // … but conditioned on the flow never having announced interim status
  assert.match(statusMessage, /never announced an interim busy\/progress message/i,
    'the softer reading is explicitly scoped to flows that never announced interim status');
  assert.match(statusMessage, /not the announced follow-up/i,
    'an attribute flip is stated NOT to be the announced follow-up an established channel owes');
});

test('ruling 1: the adjudicator statusTimelines note carries the same scoping', () => {
  const el = {
    xpath: '/html/body',
    __statusTimelines: [{ trigger: 'apply', rows: [{ atMs: 40, kind: 'state-change' }] }],
  };
  const s = llmAdj.precomputeSignals(el, 'status-messages', '4.1.3');
  assert.ok(s.statusTimelines, 'timeline signal present');
  const note = String(s.statusTimelines.note);
  assert.match(note, /ONLY IF no announced busy\/progress message preceded/i,
    'the softening in the note is conditioned on no preceding announced interim status');
  assert.match(note, /not that announced follow-up/i,
    'the note states an attribute flip does not discharge an established announced channel');
  assert.match(note, /never a verdict/i, 'the facts-not-verdict frame survives the edit');
});

// ═══ Ruling 2 — linkCueParity reaches the judge (mirrors the fieldColourState §3 pattern) ══════════════

// Invented in-prose link; no corpus page is the source of any string here.
const LINK_EL = {
  xpath: '/html/body/main[1]/p[2]/a[1]', tag: 'a', axRole: 'link',
  linkCueParity: {
    linkColor: 'rgb(120, 30, 60)', linkWeight: '700', linkDecoration: 'none', underlined: false,
    proseColor: 'rgb(40, 40, 40)', proseWeight: '400', contrastLinkVsProse: 2.1,
    nonLinkSameStyleCount: 2,
    nonLinkSameStyleSamples: ['harbour ferry timetable', 'winter sailing notice'],
  },
};
const stripKey = (el) => { const { linkCueParity, ...rest } = el; return rest; };

test('ruling 2: precomputeSignals surfaces linkCueParity for a colour-skill link subject', () => {
  const s = llmAdj.precomputeSignals(LINK_EL, 'color-and-visual-text', '1.4.1');
  assert.ok(s.linkCueParity, 'the measured cue-parity facts reach the signals block');
  assert.equal(s.linkCueParity.nonLinkSameStyleCount, 2);
  assert.equal(s.linkCueParity.contrastLinkVsProse, 2.1);
  assert.match(String(s.linkCueParity.note), /authoritative over the crop/i,
    'the note carries the computed-styles-over-crop precedence rule');
  assert.match(String(s.linkCueParity.note), /not a verdict/i, 'facts, not a verdict');
});

test('ruling 2: the signal is CONFINED to the colour skill', () => {
  const s = llmAdj.precomputeSignals(LINK_EL, 'links-and-navigation', '2.4.4');
  assert.equal(s.linkCueParity, undefined, 'a 2.4.4 subject on the same element is untouched');
});

test('ruling 2: ADDITIVE — an element without the key produces signals identical to the same element with it deleted', () => {
  const a = llmAdj.precomputeSignals(stripKey(LINK_EL), 'color-and-visual-text', '1.4.1');
  const b = llmAdj.precomputeSignals(LINK_EL, 'color-and-visual-text', '1.4.1');
  delete b.linkCueParity;
  assert.deepEqual(b, a, 'the branch adds one key and perturbs nothing else');
  const hash = (o) => crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex');
  assert.equal(hash(b), hash(a), 'byte-identical once the new key is removed');
});

test('ruling 2: no key ⇒ no key — nothing is fabricated for a link whose block had no surrounding prose', () => {
  const s = llmAdj.precomputeSignals(stripKey(LINK_EL), 'color-and-visual-text', '1.4.1');
  assert.equal('linkCueParity' in s, false, 'absent, not null');
});

// ═══ Ruling 2 — the rubric clause is fact-gated in both directions ═════════════════════════════════════

test('ruling 2 (iter-3 form): the carve-out dispatches on the computed cueParityClass, never judge-side arithmetic', () => {
  // the deferral itself must survive (it is the carve-out's host, and the default path)
  assert.match(useOfColor, /link-in-text-block/, 'the axe deferral sentence is still present');
  assert.match(useOfColor, /cueParityClass/, 'the clause dispatches on the computed class token');
  assert.match(useOfColor, /identical-to-prose/, 'the precondition class is routed away from the exception');
  assert.match(useOfColor, /distinct-shared/, 'the true exception class is named');
  assert.match(useOfColor, /distinct-unique/, 'the no-parity class is named');
  assert.match(useOfColor, /never reason "identical, therefore\s+barrier"/i, 'the precondition inversion stays forbidden');
  assert.match(useOfColor, /underlined/, 'the underline guard is stated');
  assert.match(useOfColor, /f73LightnessEscapeMet/, 'the precomputed escape verdict is wired in');
  // and the measured ratio replaces estimation for the existing >=3:1 escape
  assert.match(useOfColor, /contrastLinkVsProse/, 'the measured link-vs-prose ratio is wired to the F73 escape');
});

test('ruling 2 (iter-3): the signal computes the class and the escape verdict deterministically', () => {
  // LINK_EL: differs from prose (700 vs 400) with census 2 → distinct-shared; ratio 2.1 → escape not met
  const s = llmAdj.precomputeSignals(LINK_EL, 'color-and-visual-text', '1.4.1');
  assert.equal(s.linkCueParity.cueParityClass, 'distinct-shared');
  assert.equal(s.linkCueParity.f73LightnessEscapeMet, false);
  assert.match(String(s.linkCueParity.note), /CLASS distinct-shared/, 'the note carries the class sentence');
  // identical-to-prose: same colour+weight → precondition class, whatever the census says
  const ident = { ...LINK_EL, linkCueParity: { ...LINK_EL.linkCueParity, linkColor: 'rgb(40, 40, 40)', linkWeight: '400', contrastLinkVsProse: 1, nonLinkSameStyleCount: 9 } };
  const si = llmAdj.precomputeSignals(ident, 'color-and-visual-text', '1.4.1');
  assert.equal(si.linkCueParity.cueParityClass, 'identical-to-prose');
  assert.match(String(si.linkCueParity.note), /APPLICABILITY PRECONDITION/i, 'the note states the precondition conclusion');
  assert.match(String(si.linkCueParity.note), /never for a barrier|never of one|Do not flag/i, 'and forbids flagging identity-indistinguishability');
  // distinct-unique with a clearing ratio: the escape verdict is precomputed true
  const uniq = { ...LINK_EL, linkCueParity: { ...LINK_EL.linkCueParity, nonLinkSameStyleCount: 0, contrastLinkVsProse: 3.91 } };
  const su = llmAdj.precomputeSignals(uniq, 'color-and-visual-text', '1.4.1');
  assert.equal(su.linkCueParity.cueParityClass, 'distinct-unique');
  assert.equal(su.linkCueParity.f73LightnessEscapeMet, true);
  // null ratio → null verdict, never a fabricated boolean
  const nul = { ...LINK_EL, linkCueParity: { ...LINK_EL.linkCueParity, contrastLinkVsProse: null } };
  assert.equal(llmAdj.precomputeSignals(nul, 'color-and-visual-text', '1.4.1').linkCueParity.f73LightnessEscapeMet, null);
});

test('ruling 2 (iter-3): colourKeyLightnessWorded answers leg (i) deterministically, hue words alongside notwithstanding', () => {
  const mk = (key) => llmAdj.precomputeSignals({
    xpath: '/html/body/form[1]/input[1]', tag: 'input', isFormField: true,
    fieldColourState: { label: 'Sample', colourKeyText: key, group: {} },
  }, 'color-and-visual-text', '1.4.1').fieldColourState.colourKeyLightnessWorded;
  assert.equal(mk('Mandatory rows use a paler tint; the rest are a deep slate.'), true, 'lightness-worded key qualifies');
  assert.equal(mk('Compulsory entries appear in crimson; the rest in teal.'), false, 'hue-only key is disqualified');
  assert.equal(mk('Starred entries use a lighter crimson; the rest a dark teal.'), true, 'mixed phrasing qualifies — hue words do not defeat it');
  const noKey = llmAdj.precomputeSignals({
    xpath: '/html/body/form[1]/input[1]', tag: 'input', isFormField: true,
    fieldColourState: { label: 'Sample', group: {} },
  }, 'color-and-visual-text', '1.4.1').fieldColourState;
  assert.equal('colourKeyLightnessWorded' in noKey, false, 'no key text ⇒ the boolean is absent, not fabricated');
  // and leg (i) in the rubric defers to the boolean
  assert.match(useOfColor, /leg \(i\) is ANSWERED FOR YOU/, 'the rubric wires leg (i) to the boolean');
});

// ═══ Ruling follow-ups (measured at the rulings baseline, 3/3-stable 1.4.1 FPs) ════════════════════════

test('follow-up: the F81 guard is measured-only, names the border/label contrast facts, and carries the mixed-key tie-break', () => {
  // the default still stands — the guard was over-broad, not wrong
  assert.match(useOfColor, /an\s+additional non-colour indicator \(icon, text, asterisk, shape, border\) is required/i,
    'the F81 default (non-colour indicator required) survives');
  assert.match(useOfColor, /MEASURED-ONLY/, 'the escape is explicitly measured-only');
  assert.match(useOfColor, /borderColourContrasts/, 'the border-pair measurement is named as the qualifying number');
  assert.match(useOfColor, /never a ratio you estimated|never estimate/i, 'estimation off the crop stays forbidden');
  assert.match(useOfColor, /names BOTH a hue and a lightness/i, 'the mixed-phrasing key tie-break exists');
  assert.match(useOfColor, /SOLE\s+discriminating handle/i, 'hue-only keys stay disqualified');
  // and the no-number branch fails closed
  assert.match(useOfColor, /No measured\s+number on the matching property/i, 'no measured number ⇒ escape unavailable');
});

test('follow-up: the fieldColourState note tells the judge borderColourContrasts is the escape number, never self-derived', () => {
  const el = {
    xpath: '/html/body/form[1]/input[1]', tag: 'input', isFormField: true,
    fieldColourState: { label: 'Sample', border: '2px solid rgb(1, 2, 3)', group: {} },
  };
  const llm = require('../../lib/llm-adjudicator.js');
  const s = llm.precomputeSignals(el, 'color-and-visual-text', '1.4.1');
  assert.match(String(s.fieldColourState.uncertainReason), /borderColourContrasts/,
    'the note names the new measurement');
  assert.match(String(s.fieldColourState.uncertainReason), /never derive a ratio yourself/i,
    'and forbids self-derived ratios');
});

// Iteration 2 (measured on the same frozen packs): the first wording over-fired on two GT-inapplicable
// pages (prose-identical links max the census trivially) and the key tie-break sat only in the CRITICAL
// GUARD while judges apply the fieldColourState three-leg test. Both refinements pinned here.
test('iter-2→3: the identical-link shape is routed to the applicability precondition, away from the exception', () => {
  const t = fs.readFileSync(path.join(RUBRICS, 'use-of-color-v0.md'), 'utf8');
  assert.match(t, /`identical-to-prose`[\s\S]{0,400}?THIS IS NOT THE EXCEPTION/i,
    'the precondition class explicitly disowns the exception');
  assert.match(t, /never reason "identical, therefore\s+barrier"/i, 'the precondition inversion is named and forbidden');
});

test('iter-2: the mixed-key tie-break lives in the three-leg fieldColourState test itself', () => {
  const t = fs.readFileSync(path.join(RUBRICS, 'use-of-color-v0.md'), 'utf8');
  const legI = t.slice(t.indexOf('ALL THREE hold JOINTLY'), t.indexOf('**(ii)**'));
  assert.match(legI, /ALONGSIDE hue words/i, 'leg (i) itself carries the tie-break');
  assert.match(legI, /SOLE discriminating handle/i, 'and the hue-only disqualifier');
});
