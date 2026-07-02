// Round-4 de-fitting audit (D:rubrics) — findings #3, #4, #6, #8, #11. Each rubric edit generalizes a
// clause that was fitted to a specific ACT-Rules / DHS Trusted-Tester fixture back to the GENERAL rule
// (F73, H79, G21, TT 10.B/10.C, H69). Rubrics are PROMPTS: their live behavior is validated by LLM
// runs (see the coordinator's rubric-validation-plan), so — per the house pattern established in
// rubric-vision.test.js ("pins the clause against silent removal") — these tests pin the load-bearing
// wording. Every finding gets BOTH directions: an OVER-FIRE guard (the clause that stops the rubric
// flagging the now-legal variant, plus proof the old fitted predicate is GONE) paired with a RECALL
// guard (the barrier direction the generalization must NOT lose).
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadRubrics } = require('../../lib/rubric-loader.js');

const R = loadRubrics().rubrics;
const SKILL_MD = fs.readFileSync(path.join(__dirname, '..', '..', '..', '..', 'skills', 'color-and-visual-text.md'), 'utf8');

// rubric prose is hard-wrapped; pin PHRASES whitespace-tolerantly so a re-wrap is not a false failure.
const phrase = (s) => new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'));

// ─────────────────────────── #3 — 1.4.1 use-of-color: F73's ≥3:1-lightness pass ───────────────────────────

test('#3 RECALL: equal-luminance hue-only links (<3:1) remain the F73 barrier', () => {
  const t = R['use-of-color-v0'].text;
  assert.match(t, /F73/, 'cites the general failure technique, not a fixture');
  assert.match(t, phrase('hue swap at similar lightness'), 'a hue-only swap at similar lightness still fails');
  assert.match(t, /<3:1/, 'the equal-luminance residual barrier is quantified (<3:1 luminance separation)');
});

test('#3 OVER-FIRE guard: a ≥3:1 lightness difference is a satisfying non-color cue (F73 Procedure verbatim)', () => {
  const t = R['use-of-color-v0'].text;
  // F73's Procedure list — underline / weight / italic / shape-icon / lightness — not just "underline or weight".
  assert.match(t, phrase('underline, distinct weight, italic, a shape/icon affordance, OR a sufficient lightness difference between link and surrounding text'),
    'the satisfying-cue list is F73\'s Procedure, including the lightness escape');
  assert.match(t, phrase('≥3:1 luminance separation, not merely a different hue at similar lightness'),
    'the lightness escape is read as ≥3:1 luminance separation');
  assert.match(t, phrase('MAY credit a visible link-vs-surrounding-text LIGHTNESS difference'),
    'the caveat carves out the RELATIVE link-vs-prose comparison from the 1.4.3 contrast-adequacy bar');
  assert.match(t, phrase('`link-in-text-block` signal reports PASS, DEFER'),
    'an axe link-in-text-block PASS is deferred to (it measured exactly this separation)');
});

test('#3 1.4.3 boundary KEPT: absolute contrast adequacy is still not judged here', () => {
  const t = R['use-of-color-v0'].text;
  assert.match(t, phrase('Do not judge ABSOLUTE contrast adequacy here'), 'the 1.4.3/1.4.11 ownership bar survives the carve-out');
  assert.match(t, /1\.4\.11\/1\.4\.3/, 'still names the owning SCs');
});

test('#3 CRITICAL F81 guard: the ≥3:1 escape does NOT extend to specific-color states (verifier clause)', () => {
  const t = R['use-of-color-v0'].text;
  assert.match(t, phrase('do NOT extend it to F81 states'), 'the escape is explicitly F73-only');
  assert.match(t, phrase('SPECIFIC color (green=valid / red=invalid'), 'names the shape: meaning rides on WHICH color');
  assert.match(t, phrase('REGARDLESS of contrast ratio'), 'an additional indicator is required regardless of ratio');
});

test('#3 skill: the chart-series clause carries the parallel ≥3:1 escape (and the F81 exception)', () => {
  assert.match(SKILL_MD, phrase('≥3:1 luminance separation'), 'the lightness escape reached the skill');
  assert.match(SKILL_MD, phrase('`stroke` (no `stroke-dasharray`, no text label) at SIMILAR lightness (<3:1 between the series colors)'),
    'series-by-stroke is a barrier only at similar lightness — the chart-series clause has the escape');
  assert.match(SKILL_MD, phrase('EXCEPTION (F81)'), 'the F81 specific-color exception rides the skill too');
  assert.match(SKILL_MD, phrase('REGARDLESS of contrast ratio'), 'skill: no ≥3:1 escape for specific-color states');
});

// ─────────────────────────── #4 — 2.4.4 link-purpose: WHICH record a colspan header governs ───────────────────────────

test('#4 RECALL: a multi-row group/colspan header is a CATEGORY — the format-only failure STANDS', () => {
  const t = R['link-purpose-v0'].text;
  assert.match(t, phrase('GOVERNS THIS link\'s specific record'), 'the governance test is stated');
  assert.match(t, phrase('spans MULTIPLE data rows that each carry their OWN subject in a data cell'),
    'the group/section-caption shape (one header over many distinct-subject rows) is named');
  assert.match(t, phrase('prefer the record\'s associated ROW header (`cellRowHeaders`)'), 'the row header is preferred as the record subject');
  assert.match(t, phrase('un-associated sibling `<td>`, the format/action-only failure STANDS'),
    'no row header + subject in a sibling td ⇒ the failure stands (recall direction)');
  assert.match(t, phrase('`surrounding-region` crop to check whether the covering header spans multiple rows'),
    'the judge is told HOW to verify the span (the crop)');
});

test('#4 OVER-FIRE guards: single-record colspan header still resolves; attribute cells are not competing subjects', () => {
  const t = R['link-purpose-v0'].text;
  // ACT 5effbb Passed Ex 6 shape: one book, one download row, <th colspan> title — must still clear.
  assert.match(t, phrase('spanning header over a SINGLE record\'s row(s)'),
    'the single-record colspan-header shape is distinguished (ACT Passed-Ex-6 recall guard)');
  assert.match(t, phrase('governs that record and DOES resolve it'), 'and it still clears');
  assert.match(t, phrase('even when "Ulysses" arrives as a `cellColHeaders`'),
    'the Ulysses illustration is retained (as an e.g. of the governs-this-record rule)');
  // verifier scope clause: a filesize/date data cell must not defeat a governing header.
  assert.match(t, phrase('a filesize, a date, a version number) are NOT "competing subjects"'),
    'legitimate attribute cells of the record are not competing subjects');
});

test('#4 unchanged failure mode: a generic category header still resolves nothing', () => {
  const t = R['link-purpose-v0'].text;
  assert.match(t, phrase('GENERIC CATEGORY or ACTION label (e.g. "Books", "Downloads", "Format", "Links")'),
    'the generic-header ("Books") failure mode is intact');
  assert.match(t, /H79/, 'cites the general technique, not a fixture');
});

// ─────────────────────────── #6 — 2.1.2 keyboard-trap: exit advice must be REACHABLE from inside ───────────────────────────

test('#6 RECALL: a working exit key documented only OUTSIDE the trapped user\'s reach ⇒ REPRODUCED', () => {
  const t = R['keyboard-trap-v0'].text;
  assert.match(t, phrase('A working exit key whose ONLY documentation is unreachable from inside the trap'),
    'the new REPRODUCED clause exists');
  assert.match(t, phrase('a collapsed disclosure downstream of the loop, a hover-only `title=`, a mouse-only opener'),
    'the unreachable-carrier shapes are enumerated');
  assert.match(t, /G21/, 'grounded in G21 (advice within the subset, keyboard-accessible), not a fixture');
});

test('#6 decide clause is two-part: (i) reachable-from-inside advice AND (ii) the press exits the set', () => {
  const t = R['keyboard-trap-v0'].text;
  assert.match(t, phrase('(i) the exit advice is perceivable/operable by a KEYBOARD user already inside the trap'),
    'condition (i): perceivable/operable from inside');
  assert.match(t, phrase('visible before/at trap entry, or revealed by a help control that is itself keyboard-reachable from inside the trapped set'),
    'reachability is defined: visible at entry, or a keyboard-reachable in-trap revealer');
  assert.match(t, phrase('(ii) the advised key press moves focus OUT of the trapped set'), 'condition (ii): the key actually exits');
  assert.match(t, phrase('CONFIRM the advice CARRIER is keyboard-reachable'),
    'tool guidance: verify the carrier, not mere presence in page text');
});

test('#6 OVER-FIRE guards: the in-panel hint and the help-link-INSIDE-the-trap shapes stay NOT REPRODUCED', () => {
  const t = R['keyboard-trap-v0'].text;
  // ACT 80af7b shape: the revealer is itself a trapped member — reachable by definition.
  assert.match(t, phrase('visible in-panel hint naming a working exit key'), 'recall guard 1: the visible in-panel hint still clears');
  assert.match(t, phrase('help link that is ITSELF a trapped member'), 'recall guard 2: the in-trap help revealer still clears');
  assert.match(t, phrase('"How to go to the next element" link'), 'the reveal-then-press tool flow is retained');
});

// ─────────────────────────── #8 — 1.3.1 TT 10.C: containment-FIRST, size-independent ───────────────────────────

test('#8 RECALL: a PARENT coded DEEPER than its own subsections is a barrier even when every size matches its level', () => {
  const t = R['info-relationships-v0'].text;
  assert.match(t, phrase('judge CONTAINMENT FIRST, size second'), 'containment is the primary predicate');
  assert.match(t, phrase('FIRST identify from the `viewport` whether the earlier heading visually introduces a block that CONTAINS the following heading(s) as subsections'),
    'the judge is told to establish containment before any size reasoning');
  assert.match(t, phrase('PARENT coded DEEPER than its own subsections'),
    'the DHS 405382-14 shape (h6 parent over h4/h5 children) is the stated barrier');
  assert.match(t, phrase('EVEN WHEN each heading\'s font-size individually matches its own level'),
    'size-matching does not clear a containment inversion');
  assert.match(t, phrase('Do NOT clear this shape because the shallower child renders larger'),
    'the expected-rendering false-clear path is closed');
  assert.match(t, /405382-14/, 'provenance citation retained (confirmed on DHS 405382-14)');
});

test('#8 the old INVERTED-only predicate no longer offers the false-clear path', () => {
  const t = R['info-relationships-v0'].text;
  // The fitted clearance rule told the judge to clear by "pointing to an actually-larger rendering of the
  // shallower heading" — on the real 405382-14 barrier that rendering is EXPECTED, so it handed a false clear.
  assert.doesNotMatch(t, phrase('an actually-larger/bolder rendering of the shallower heading'),
    'the size-cue clearance escape hatch is gone');
  assert.match(t, phrase('SECONDARY confirmation'), 'size-vs-prominence survives only for the non-containment sibling case');
  assert.match(t, phrase('numerically-SHALLOWER heading (e.g. h4) rendering SMALLER/less prominent'),
    'the original sibling-sequence barrier (shallower renders smaller) is still recall-covered');
});

test('#8 OVER-FIRE guard: the benign deep-callout carve-out now requires BOTH no-subsections AND outline-resume', () => {
  const t = R['info-relationships-v0'].text;
  assert.match(t, phrase('(a) NO following heading is a subsection of the deep-level callout'), 'conjunct (a)');
  assert.match(t, phrase('(b) the main outline RESUMES correctly after it'), 'conjunct (b)');
  assert.match(t, phrase('lone-h6 contact callout with no children, outline resuming at h2'),
    'the TT 10.B-shape benign case (over-fire guard) still clears');
  // the fitted size-based clear ("its size matches its level" alone) must be gone as a clearing rule
  assert.doesNotMatch(t, phrase('Do not flag a small callout\'s deep level as "illogical skips" when its size matches its level'),
    'the size-matches-level standalone clear is removed');
  assert.match(t, phrase('size-matching is irrelevant to a containment inversion'), 'and explicitly disavowed for the containment shape');
});

test('#8 correctly-nested outlines stay un-flagged (no-suspect fast path intact)', () => {
  const t = R['info-relationships-v0'].text;
  assert.match(t, phrase('heading sequence with NO suspect entries needs no special heading-level scrutiny'),
    'h2>h3>h4 well-nested pages (no suspect flag) are still exempt from 10.C scrutiny');
});

// ─────────────────────────── #11 — 1.3.1 visual-heading cue: ANY presentational means ───────────────────────────

test('#11 RECALL: a visual heading distinguished by caps/color/rule (not size) is now in scope', () => {
  const t = R['info-relationships-v0'].text;
  assert.match(t, phrase('visually distinguished from surrounding body text by ANY presentational means (size, weight, color, all-caps/'),
    'the cue list is general — not size-only');
  assert.match(t, phrase('letter-spacing, extra spacing, or a top/bottom rule/underline'), 'caps/spacing/rule cues are in scope (H69 does not require larger/bolder)');
  assert.doesNotMatch(t, phrase('clearly larger/bolder than the body text'), 'the narrowed size-only cue is gone');
});

test('#11 OVER-FIRE guards KEPT: the negative controls and the labels-a-block-below conjunct are intact', () => {
  const t = R['info-relationships-v0'].text;
  assert.match(t, phrase('AND labelling a distinct block of content BELOW it'),
    'the subordinate-block conjunct survives (it, not size, clears the DHS lorem-page FP)');
  assert.match(t, phrase('site title / logo / masthead wordmark'), 'negative control: masthead');
  assert.match(t, phrase('banner or hero tagline'), 'negative control: hero tagline');
  assert.match(t, phrase('first line of a paragraph, a byline, a pull-quote, or inline emphasis'),
    'negative controls: first-line/byline/pull-quote/emphasis');
  assert.match(t, /zero headings[\s\S]*?inapplicable/, 'a zero-heading page stays inapplicable, not a barrier');
});
