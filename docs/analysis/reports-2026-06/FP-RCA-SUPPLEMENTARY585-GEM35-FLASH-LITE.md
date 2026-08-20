# Root cause of the 49 false positives — `supplementary585-gemini35-flash-lite-97d00f4`

Run: 585 cases, Gemini 3.5 Flash Lite, harness `97d00f43+worktree-c200e423`, tools+vision on, 0 transport
failures, 0 execution errors. Reported FP = 49 / 275 non-failures (17.8%), recall 78.1%.

## 1. Headline: the FP rise is a model effect confined to one corpus slice

The same 585 pages have an existing **Gemini 3.7 Flash** result set (assembled per
`supplementary585-three-tools-gem37-flash-existing-comparison.md`). Joining case-by-case on `testcaseId`
(585/585 keys matched, `scratchpad/cmp37.js`):

| slice | n | 3.5 Flash Lite | 3.7 Flash |
| --- | ---: | ---: | ---: |
| generated-negative (all `passed`) | 196 | **FP 41 (20.9%)** | FP 15 (7.7%) |
| human-annotated non-failures | 79 | FP 8 (10.1%) | FP 6 (7.6%) |
| human-annotated failures (recall) | 310 | TP 242 (78.1%) | TP 291 (93.9%) |

Two things follow, and they matter more than the headline FP count:

1. **On human-annotated negatives the two models are indistinguishable** — 8 vs 6 FP on n=79. The entire
   FP blow-up (15 → 41, 2.7×) lands on the **generated-negative** slice.
2. FP rate *rose* while recall *fell*. A model that were merely "more aggressive" would trade one for the
   other. Both moving the wrong way is the signature of a model that cannot make the discrimination and
   is being carried by whichever direction the prompt pushes hardest — see §3.

Per-FP cross-model attribution: **40 of 49 are 3.5-lite-only** (3.7 returned `missedAgree` on the same
page), **9 also fire under 3.7**. All 9 model-independent FPs are on generated negatives.

By lane: **47 of 49 are LLM-lane** (`v3Barrier=false`, `inScopeBarrierFilled>0` — a rubric verdict filling
an auto-PARTIAL obligation). **2 are deterministic** (§4).

## 2. Why the generated-negative slice is where it hurts

The generated negatives are *paired-pass* fixtures: a failing page with a minimal, targeted repair applied.
By construction the page still **looks** like the failure — only the programmatic layer changed. That is
precisely the discrimination a weak judge cannot make, and the FP mass lands there.

Worked example, `1.1.1::image-of-text-alt-omits-the-text::case-12` (the repair keeps a generic `alt` and
adds `aria-labelledby` to a visible blockquote holding the full quote):

```html
<img alt="Decorative pull-quote graphic in the article" aria-labelledby="cx-037" src="…">
<blockquote id="cx-037">"The future is already here — it's just not very evenly distributed." — William Gibson, 1993</blockquote>
```

CDP resolves this correctly (`scratchpad/axname.js`):

```
role=image name="“The future is already here — it’s just not very evenly distributed.” — William Gibson, 1993"
           via=relatedElement[aria-labelledby]>attribute[alt]
```

and `llm-adjudicator.js:498-512` surfaces it to the rubric as `s.accessibleName.value` for every
`name-role-state` skill. The model was handed the resolved name and answered:

> "…hidden from screen reader users via aria-labelledby pointing to a duplicate text block, while its alt
> attribute incorrectly marks it as purely decorative."

It read the raw `alt` and inverted accessible-name precedence. **This is not an evidence-plumbing gap** —
the correct value was in the pack.

The 17 SC 1.1.1 FPs (35% of all FPs, 38.6% FPR for that SC) fall into four clusters:

- **A. accname precedence ignored** (~9 verdicts) — `alt='photo'` flagged while `aria-labelledby` names the
  adjacent heading. Cases `-10`, `-13`, `-17`, `image-of-text…-12`.
- **B. functional-image standard mis-set** (~7) — "Add to Apple Wallet describes the depicted object rather
  than the control's function"; the name *is* the action. See §3.
- **C. exculpating fact stated, then overruled** (~4) —
  `informative-css-background-image::case-12` is a weather widget whose documented repair is *"added visible
  Rain, Cloudy, or Sunny text beside each condition"*. The model wrote "…**while adjacent text already
  communicates the condition**" and returned LIKELY_BARRIER anyway.
- **D. arguable** (~3) — `meaningful-image-suppressed-as-decorative`, `canvas role=presentation`.

## 3. Rubric calibration is tuned for a stronger model

Precision per barrier verdict, this run:

| rubric | barrier verdicts | on FP cases | share |
| --- | ---: | ---: | ---: |
| `field-programmatic-association-v0` | 12 | 8 | **67%** |
| `decorative-image-verification-v0` | 7 | 3 | 43% |
| `alt-text-adequacy-v0` | 88 | 28 | 32% |
| `long-description-completeness-v0` | 11 | 3 | 27% |
| `error-identification-v0` | 32 | 8 | 25% |
| `link-purpose-v0` | 56 | 10 | 18% |
| `link-name-equivalence-v0` | 60 | 5 | 8% |
| `status-message-v0` | 28 | **0** | 0% |

Two concrete defects, both **model-independent** (they fire under 3.7 too):

**(a) `alt-text-adequacy-v0` failure mode 4 is a pre-emptive rebuttal block.** It enumerates and forbids
every exculpatory argument:

> "NAMING THE FUNCTION IS THE REQUIREMENT, NOT ONE ACCEPTABLE OPTION… inadequate **even when it is an
> accurate, well-observed, well-written description of the picture**. Accuracy of description … must never
> be offered as the reason to clear. Nor may you rescue it by reasoning that the icon is conventional, that
> most users would infer the action…"

This is calibrated anti-FN pressure. On a strong judge it recovers recall. On a weak one it removes the
licence to clear, and the rule fires mechanically on any name containing a noun — including names that
*state the action*. That asymmetry is why FP and FN worsened together.

**(b) `field-programmatic-association-v0` has no group-wrapper clause.** Both 1.3.1 FPs are the same Arabic
split-date fixture, whose documented repair is `role="group" aria-labelledby="dob-question"
aria-describedby="dob-hint"` on the wrapper plus `title` on each sub-field:

```
role=textbox name="سنة" via=attribute[title]>placeholder[placeholder]>attribute[title]
```

The names resolve. But the rubric (line 30) says a name that "silently falls back to something else (a
placeholder, a `title`) … — REPRODUCED", and it evaluates the field in isolation with no clause crediting an
enclosing named group. The rubric text *instructs* this FP. Worst per-verdict precision in the run (67%).

**Corollary — the two 0% FPR SCs.** 1.4.13 and 4.1.3 recorded FPR 0.0%, and `status-message-v0` produced 28
barrier verdicts with none on an FP case. Those are the SCs where a deterministic instrument owns the
disposition. **Where the harness decides, the weak model costs nothing; where the rubric decides, it costs a
lot.**

## 4. Two deterministic detector bugs (model-independent, will recur every run)

### 4a. `form-error-probe` fires on a field it could not make invalid — REPRODUCED today

`3.3.1::inline-error-adjacent-to-wrong-field::case-11`. The page's real error is on **Diastolic** and is
correctly identified (`aria-invalid`, `aria-describedby` → "Diastolic must be between 40 and 120 mmHg").
The probe fires BARRIER_OBSERVED on **Systolic** — a different, error-free field:

```
mech=form-error-probe out=BARRIER_OBSERVED ref=…/div[1]/div[1]/div[1]/input[1]   ← #sys
measurement: nativeWouldBlock=false customIdentifies=false unassociatedSurface=null
             pageReacted=false pageIntercepted=false        → errorNotIdentified=true
```

The `detectionUnproven` abstain gate (`exp-runners.js:923-925`) did not engage. Every term holds except
`conditionFabricated = validAtRest && invalidAfterInject`:

- `#sys` is `type="number"` with **no** `min`/`max`/`required` → `hasConstraint` true via
  `/^(email|url|number|tel)$/.test(type)` (`exp-runners.js:600`), so the field is *applicable*;
- injecting a non-numeric string into `type=number` triggers value sanitization → `value === ''`;
- an unconstrained, non-required number input with `''` is **valid** → `invalidAfterInject = false`.

So the gate covers "the probe fabricated a *detectable* invalid condition" but not "the probe could not
fabricate any invalid condition at all" — which is a *stronger* reason to abstain. This is a residual gap in
the fix shipped at `1b0cef86`, not a regression: probing a detached worktree at `48fa8580` produces the
**identical** BARRIER_OBSERVED, so the defect predates that commit.

The same shape holds for `type="tel"` (no format constraint at any time) and `type="number"` without a
range. Static exposure scan over the corpus (`scratchpad/exposure.js`): **25 of 585 pages** carry such a
field inside a `<form>`, **12 of them expected non-failures**. One converted to an FP here; the other 11 are
standing exposure.

Suggested fix, at the applicability gate rather than the abstain gate: a type that the probe's own injection
cannot violate is not a *constraint*. Require `min`/`max`/`step`/`pattern`/`required` alongside
`number`/`tel`, or add `!invalidAfterInject` as an independent abstain term.

### 4b. The 2.1.2 advised-exit detector matches one phrasing and no chords

`2.1.2::documented-exit-reachability-and-accuracy-beyond-ctrlm::case-07` is the family's only `passed` case:
focus is contained, and the exit is documented **inside** the region and wired via
`aria-describedby` — *"To move focus back out to the rest of the page using only the keyboard, press
Ctrl+M."* WCAG 2.1.2 is satisfied when the user is advised of the method.

`exp-runners.js:1350-1354` reads that text and applies:

```js
advised: /\bto\s+(leave|exit|close|escape|dismiss)\b/i
key:     /press\s+(?:the\s+)?["']?([A-Za-z])["']?\s+(?:key\s+)?to\s+(?:leave|exit|close|escape|dismiss|continue)/i
```

Evaluated directly against every advisory string in the family — all return `{advised:false, key:null}`:

| case | advisory text | result |
| --- | --- | --- |
| 07 / 01 | "To move focus back out …, press Ctrl+M" | `advised:false, key:null` |
| 04 | "To return focus to the page, press Ctrl+K" | `advised:false, key:null` |
| 05 | "To move focus back out …, press Ctrl+W" | `advised:false, key:null` |
| 06 | "press Esc" | `advised:false, key:null` |
| — | "press Z to leave this dialog" | `advised:true, key:"Z"` |

Three independent failures: the verb set misses "move focus out"/"return to"; the pattern requires
`press X to …` order and the corpus writes `To …, press X`; and `([A-Za-z])` accepts a **single character**,
so no modifier chord can ever match — in a family literally named `…beyond-ctrlm`.

Consequence: `advice.advised` is always false, so `o.trapProven = !anyEscapes && !advice.advised && …`
reduces to the trap test. The family scores 5/6 *for the wrong reason* and 1 FP. This one did **not**
reproduce on macOS (the fixture's trap is a `blur`→`setTimeout(0)`→`focus()` race), but fired on the server
under **both** models.

Note the exception has a second half the current code does not check either: 2.1.2 requires the advice to be
**accurate**. Widening the phrasing without also verifying the advised keystroke actually works would convert
these FPs into FNs — cases 03/04/05/06 are all "advice present but the named keystroke does not work". Fix
both halves together.

## 5. Two demonstrably defective fixtures

Not harness problems — the model is right and the label is wrong. Both are `2.4.2` paired-passes whose
repair changed the title to something that still fails:

- `title-loses-meaning-out-of-context::case-10` — repair set `<title>Chapter 3: Safe Scaffolding
  Assembly</title>`; the page's `<h1>` is *"Newton's Laws of Motion"* and its sections are inertia, F=ma, and
  action/reaction. The title is now specific **and about the wrong subject**.
- `title-describes-secondary-not-primary-topic::case-11` — repair set `<title>Cedar Falls Tribune — Local
  News</title>` on an article whose `<h1>` is *"Council approves $214M Cedar Falls budget…"*. A site-wide
  section label is the canonical 2.4.2 failure, and the aspect is *literally* "title describes secondary not
  primary topic".

Both are `also-FP-in-3.7`. Recommend retagging to `failed` or regenerating the pair.

## 6. Confidence carries no signal for this model

| barrier verdicts | `high` | `medium` | `low` |
| --- | ---: | ---: | ---: |
| on FP cases | **76** | 0 | 0 |
| on true catches | 372 | 1 | 0 |

Every one of the 76 wrong barrier verdicts is `high`. Across the whole run only **35 of 1,539** verdicts are
`UNCERTAIN` (2.3%) — the model essentially never abstains. No confidence threshold and no abstain-on-doubt
gate can separate these populations. (Consistent with the earlier controlled finding that confidence-abstain
does not work; this run is a starker instance — the field has *zero* variance on barrier verdicts.)

## 7. Summary of causes

| # | cause | FPs | model-dependent? | actionable |
| --- | --- | ---: | --- | --- |
| 1 | Judge cannot read paired-pass fixtures (accname precedence, redundancy, functional-image) | 39 | yes (3.5-lite only) | model choice, not a harness bug |
| 2 | `field-programmatic-association-v0`: no group-wrapper clause, `title` ruled out | 2 (8 verdicts over 6 FP cases) | **no** | rubric edit |
| 3 | `alt-text-adequacy-v0` mode 4: anti-FN rebuttal block over-fires on weak judges | 4 (amplifier on many more) | **no** | rubric edit |
| 4 | `form-error-probe` scores an unfalsifiable field | 1 (+11 exposed) | **no** | detector fix |
| 5 | 2.1.2 advised-exit regexes match one phrasing, no chords | 1 | **no** | detector fix (both halves) |
| 6 | Defective 2.4.2 paired-pass fixtures | 2 | **no** | corpus retag |

Rows 2-6 partition the 9 model-independent FPs plus the 1 deterministic 3.3.1 case (which the cross-model
join cannot classify, because the detector's disposition changed downstream between the two snapshots):
6 rubric-attributable + 2 deterministic + 2 corpus. Row 1 is the remainder.

**The harness-attributable share is small — 2 deterministic bugs and 6 rubric-driven cases, 8 of 49.** Two
more are corpus defects; the remaining 39 are the judge. That is the finding: swapping Gemini 3.7 Flash for
3.5 Flash Lite costs **28 extra false positives and 49 lost catches** on the same 585 pages (21 → 49 FP,
291 → 242 TP), and no gating recovers it, because the model reports maximum confidence on every wrong
answer.

## 8. Caveats

- `eval/act-augmented/` labels are **not validated** (pooled κ=0.628, anchored not blind). This is a
  directional probe, not an authoritative gate; §5 shows the label set does contain defects.
- The 3.7 comparison is assembled from six component runs spanning more than one harness snapshot
  (`48fa8580` and others), not a single controlled invocation. It is an exact case-level join, but snapshot
  drift is a confound for any single row — §4a is the one place that mattered, and it was settled by probing
  the older commit directly.
- Local reproduction ran against the working tree (which carries another agent's uncommitted edits), not the
  run's exact `+worktree-c200e423` snapshot. §4a was additionally confirmed at `48fa8580`.
- macOS local vs Linux server: §4b did not reproduce locally; §4a did.

---

# Fixes (2026-08-19)

All four harness-attributable causes from §7 are repaired. Corpus items (§5) are not touched — they are a
retag decision, not a code change.

## F1 — 3.3.1: the probe must not score a field it could not put in error

Two changes in `probeFormError` (`scripts/v3/lib/exp-runners.js`):

**(a) Break the range, not the type.** `el.value = 'abc'` on a `type=number` runs the value-sanitization
algorithm and leaves `''`, which is valid for an optional field. Where `min`/`max` exist there IS a violable
rule, so the probe now injects an out-of-range number instead and measures what it meant to measure.

```js
const numAttr = (v) => (v === null || String(v).trim() === '' ? NaN : Number(v));
const numMin = numAttr(el.getAttribute('min')); const numMax = numAttr(el.getAttribute('max'));
const outOfRange = Number.isFinite(numMax) ? String(numMax + 1) : Number.isFinite(numMin) ? String(numMin - 1) : null;
```

The `numAttr` guard is load-bearing and was got wrong first time: `Number(null)` and `Number('')` are both
`0`, so reading an absent bound as a real one synthesised `"1"` for *every* rangeless number field and
injected a perfectly valid number — a silent recall regression across the SC, caught by the new pins below.

**(b) A condition that does not exist cannot be unidentified.** The old gate asked only whether the probe
*manufactured* a condition the page treats as valid. It could not fire when the probe manufactured
*nothing*:

```js
const conditionFabricated = validAtRest && invalidAfterInject;
const conditionAbsent     = validAtRest && !invalidAfterInject;      // NEW
const noDetectableCondition = conditionAbsent || (!!form.noValidate && conditionFabricated);
const detectionUnproven = noDetectableCondition && !pageReacted && !ariaInvalidAppeared
  && !pageIntercepted && !_clientValidatorActive;
```

`conditionAbsent` carries no `novalidate` qualifier — with or without it, a field the browser considers valid
has no *automatically detected* error, and 3.3.1 attaches only to errors that are. Every positive detection
channel still overrides, which is what keeps the soft-required frameworks (where native validity is
irrelevant by construction) and hand-rolled validators on the hook.

## F2 — 2.1.2: the advised-exit exception, both halves

Three changes, because the FP needed all three and the grammar alone would not have moved it.

**(a) One grammar, shared.** `parseAdvisory` / `pressAdvised` now live in `kbd-graph.js` and both 2.1.2 lanes
call them. Parsing happens in Node over already-extracted text, so the grammar is unit-testable without a
browser and cannot drift into two private copies again — the same failure the close-control escape had.
Four defects fixed: the verb set (authors write what the key *does* — "to move focus back out"), word order
(prose leads with the goal), key shape (no modifier chord or function key could ever match — the
instrument's own documentation example, `press Alt+F6 to exit`, did not parse under the instrument's own
grammar), and the word-gap bound.

The verb set for *key extraction* is deliberately wide; the separate `ADVISORY_HINT_RE` used for
*suppression* stays narrow, because that is the one direction where a loose match costs a missed trap.

Two further corrections came out of reviewing the parser rather than from the corpus, and both matter:

- **Single keys are lowercased.** An advisory writes `Ctrl+M` for readability, but pressing the capital sends
  a *shifted* keystroke, and a page listening for `e.key === 'm' && e.ctrlKey` would never see it. A genuine
  Shift is carried in `mods` and held around the press, so lowercasing the base key is the faithful reading.
- **The English article is not a keystroke.** `"press a key to leave"` / `"to leave, press a button"` parsed
  as key `a`. That is worse than not parsing at all: the probe would press `a`, watch nothing happen, and
  report a *tested-and-failed* advisory — which **asserts** a trap. Vague advice must land on the untestable
  side, where it suppresses. Bare `a` with no modifier is now rejected; `Alt+A` still parses. The cost is
  failing to verify an unmodified `"press A to leave"`, which then suppresses instead — a missed trap, never
  a manufactured one, which is the direction this whole gate is supposed to err in.

**(b) Advice must be verified, not merely present.** The old assertion was
`!anyEscapes && !advice.advised` — presence alone cleared. That was survivable only while the grammar never
fired; widening it would have turned every page advertising a keystroke it never bound into a silent pass.
2.1.2's exception is conjunctive, so a parsed key is now pressed and must actually free focus:

```js
const adviceUnverifiable = !!advice.advised && (!advice.key || !!advice.reserved);
o.trapProven = !anyEscapes && !adviceUnverifiable && o.focusStaysInDocument && cycledBackToStart;
```

**(c) The advisory scope, when region identification collapses.** This was the half that actually bit.
`TRAP_REGION_SEL` recognises dialog-ish roles and modal-ish class names; a plain named `<section>` that
confines focus matches none, so `closest()` returns the *control itself*, whose `textContent` is empty. On
such a page no advisory could ever be in scope. The advisory read now widens to the nearest naming ancestor
— **for the read only, never for focus tracking**, since a too-generous advisory scope costs at worst a
missed trap, while widening the focus-tracking region would make "focus never left" easier to satisfy and
could manufacture traps across every form in the corpus.

The narrow region identification is a real, separate defect. It is deliberately **not** repaired here: it
changes trap mechanics and needs its own measurement.

## F3/F4 — the two rubrics

`alt-text-adequacy-v0` gains an explicit discriminator *before* the prohibition block: read the announced
name and ask whether it already states what activating the control does — and if it does, the failure mode
does not apply. A name still states the action when it also names the object the action involves, which is
how actions are ordinarily written. The anti-FN language is untouched; it now has a gate in front of it
rather than being the first thing a weak judge meets.

`field-programmatic-association-v0` gains a composite-input-group clause: where one value is collected
through several adjacent controls (date parts, phone parts, amount units, address lines), the label belongs
to the *group* and each box carries only a short part-name — a correct structure when the wrapper is a named
`<fieldset>`/group. Judge the group's naming, not the part's. Failure mode 1's `title`/`placeholder` warning
is scoped to its actual subject: a field whose *visible* label was never wired to it.

## Verification

| check | result |
| --- | --- |
| `3.3.1 inline-error…/case-11` (the FP page) | Systolic now `conditionAbsent:true, detectionUnproven:true`, no barrier; Diastolic still correctly identified at rest |
| `2.1.2 documented-exit…/case-07` (the FP page) | `advised:true, advisedKey:"M"` (was `advised:false`), `advisedKeyEscapes:true`, `trapProven:false`, NO_BARRIER_OBSERVED |
| new pins `kbd-trap-advised-exit.test.js` | 7/7 — grammar (pure, incl. article rejection and cross-sentence guard), working chord clears, lying chord still traps, untestable advisory inconclusive, collapsed-region read, no-invented-advice guard |
| advisory regex on adversarial input | 2 MB of near-miss prose parses in 3 ms — no backtracking blowup on the new lazy verb-first pattern |
| new pins in `form-error-detection-gate.test.js` | 5/5 — unfalsifiable field abstains, authored range still violable, and a page that *does* detect is still caught |
| 2.1.2-adjacent existing suites (6 files) | 96/96 |
| LLM/rubric suites incl. `prompt-corpus-leak` | 520/520 |

Both fixture families are invented (a seed-catalogue stock panel; an allotment water-meter form) and the
rubric edits name no case, product or corpus term.

One limitation worth stating: neither FP page reproduces its *confinement* under headless macOS — the
2.1.2 fixture's trap is a `blur`→`setTimeout`→refocus race that only engages on the server. What is verified
locally is the mechanism: the advisory is read, the chord parses, pressing it frees focus, and that feeds
`anyEscapes`. The disposition half is pinned on the deterministic browser fixtures instead.

## Pre-gate predictions (recorded before the 581 run finished)

Static scans over the held-out corpus, to bound each change's blast radius *before* seeing the gate — a
prediction made in advance is worth more than a post-hoc reading of whatever the deltas turn out to be.

**2.1.2 — the suppression path has no surface here.** The FN risk of F2(b) is a page whose text trips the
narrow `ADVISORY_HINT_RE` but yields no testable key, because that now suppresses a trap assertion. Scanning
all 602 corpus pages: **3** contain advisory phrasing at all, and **all 3 yield a testable key**. Zero
unverifiable, zero reserved chords. So the suppression cannot cost recall on this corpus, and those 3 pages
move from *blanket-cleared on presence* to *actually pressed* — which can only convert a false clear into a
catch. (Whole-page text is an upper bound on the region-scoped read the runner actually performs.)

**3.3.1 — at most 5 pages.** Only 8 corpus pages contain a `<form>`. Of those, **5** hold an optional
`number`/`tel` field with no range, which is where `conditionAbsent` can now abstain. **0** pages have a
ranged number field, so the injection change (F1a) rewrites nothing here and is exercised only by the new
unit pins.

**Named rows, not just counts.** All 3 advisory pages belong to rule **`80af7b`** ("Focusable element has no
keyboard trap") — precisely the rule the exception is written for — and all three advertise `Ctrl+M`:

| testcase | ACT example | expected | old disposition | new disposition |
| --- | --- | --- | --- | --- |
| `62fd24e7…` | Failed Example 5 | **failed** | SUPPRESSED — `advised` matched "to Exit", no key extractable | PRESS `Ctrl+M`; it does not work ⇒ assert |
| `ab24c77e…` | Passed Example 4 | passed | SUPPRESSED | PRESS `Ctrl+M`; it works ⇒ clear |
| `e3902f01…` | Passed Example 5 | passed | SUPPRESSED | PRESS `Ctrl+M`; it works ⇒ clear |

This is the sharper prediction, and it inverts the expected sign of the change: the old loose `advised`
regex *did* fire on "Press Ctrl+M to Exit" — it just could not extract the chord — so the old code cleared
**Failed Example 5 by assumption**. That is a false negative sitting in the held-out set, produced by exactly
the presence-only suppression F2(b) replaces.

**The mechanism is confirmed, not inferred.** All three pages load the ACT test asset whose escape handler is
`if (e.keyCode === 77 && e.ctrlKey)`, bound via `onkeydown` on the buttons. Driving `pressAdvised` with the
parsed advisory delivers exactly `{keyCode: 77, key: 'm', ctrlKey: true, shiftKey: false}` — so the chord
reaches the handler, and the lowercasing correction matters here: pressing the capital would have added a
`shiftKey` this asset does not expect. The two Passed Examples bind that handler on their buttons; Failed
Example 5 binds `onfocus`/`onblur` only and has no `onkeydown`, so `Ctrl+M` genuinely does nothing there.
That difference in the fixtures is what the prediction rests on.

**Noise floor, measured on this machine before comparing my own runs.** Diffing two *existing* same-machine
gate artifacts from earlier today (`r4-gate` → `fx2-gate`, no deterministic change between them beyond an
unrelated batch) gives 1 bucket change (an `error` resolving to `tn`) but **6 rows with internal movement** —
shadow-observation counts wobbling by ±1 on rules `674b10`, `c487ae`, `5c01ea`, `80af7b`, `0ssw9k`. So
sub-bucket wobble of that size is the corpus's own run-to-run noise, not evidence of a change. Only bucket
transitions, and only on `2.1.2`/`3.3.1`, count as attributable to this batch; anything else needs the
flake-class single-rule recheck rather than a story.

Predicted gate shape: **+1 true positive** on `80af7b` Failed Example 5, the two Passed Examples unchanged
(cleared for a verified reason rather than an assumed one), and at most a handful of 3.3.1 rows. Anything
outside that needs row-level justification rather than acceptance — in particular, a Passed Example flipping
to a false positive would mean `Ctrl+M` does not fire under headless Chrome, and the change would need
rethinking rather than defending.


---

# Gate and validation results (2026-08-19)

## ACT 581 held-out gate — the first attempt FAILED, and caught a real regression

Baseline at HEAD and proposed on the same machine, same corpus, deterministic lane only. Predicted: +1 TP on
`80af7b`, a handful of 3.3.1 rows. **Measured: −4 TP, all on ACT rule `36b590`.**

| testcase | before | after |
| --- | --- | --- |
| `3bb6b76d2dd8` | tp | **fn** |
| `a51e05dc7b64` | tp | **fn** |
| `e76345ab4164` | tp | **fn** |
| `ddcd6a3065a7` | tp | **fn** |

**Root cause: F1(b) dropped the `novalidate` qualifier**, on a justification written into the code — *"with or
without it, a field the browser considers valid has no automatically detected error"* — that is simply wrong.
WITHOUT `novalidate` the user agent performs constraint validation itself, so the page HAS automatic
detection; it is just not this field's own constraint doing the detecting. The error a user meets sits
elsewhere in the form and is reported by a pre-rendered generic message. All four `36b590` pages are exactly
that shape: a plain `<form>`, no scripts, a bare `type="number"`, and a message that never says what is wrong.

The pre-existing comment in that function *named these four cases* as the reason the qualifier existed. It was
read, restated in the new comment, and then removed anyway. The unit suite could not catch it because every
fixture in `form-error-detection-gate.test.js` was written `novalidate`, so the broken version passed all of
them.

Fix: `noDetectableCondition = !!form.noValidate && (conditionAbsent || conditionFabricated)`. A pin now covers
the gap — a UA-validated form where `conditionAbsent` holds but the barrier must still fire (6/6 green), and
all four pages emit `BARRIER_OBSERVED` again while the act-augmented FP page (which *is* `novalidate`) still
abstains.

## ACT 581 gate — corrected run

| | tp | fn | fp | tn | err |
| --- | ---: | ---: | ---: | ---: | ---: |
| baseline (HEAD) | 13 | 101 | 1 | 262 | 0 |
| proposed | 13 | 101 | 1 | 262 | 0 |
| **delta** | **0** | **0** | **0** | **0** | **0** |

Three rows show internal shadow-count movement, all on `80af7b`, all ±1 — inside the noise floor measured
beforehand on two unrelated same-machine artifacts (6 such rows with no code change at all). No bucket
transitions anywhere.

## The `80af7b` prediction was wrong

No `+1 TP` appeared; `62fd24e7` (Failed Example 5) did not move. Probing it directly: `advised: false`,
`advisedKey: null`. Two independent reasons, neither of which the prediction accounted for:

1. **The widened advisory scope does not reach.** That page's buttons sit directly in `<body>`, which matches
   nothing in `ADVISORY_GROUP_SEL`, so `closest()` returns null and the scope falls back to the control — the
   same region-identification defect F2(c) works around for *named* containers and deliberately does not fix.
2. **The confinement is not detected there at all** — `tabEscapes: true`, `cycledBackToStart: false`. The
   fixture's `blur`→`setTimeout`→refocus trap does not engage under headless Chrome.

The `keyCode 77` mechanism check verified the LAST link in the chain and the prediction assumed the earlier
ones. That is the same error F2(c) exists to correct — a repair upstream of a working mechanism can leave it
unreachable — repeated one level up. The recall opportunity is real but belongs with the region-identification
defect, as one deferred change with its own gate.

## Rubric edits — NOT validated

Fixed-evidence replay on the server (`freeze-augmented.js` → `replay-judge.js`), 176 packs (88 failed / 88
passed), 3 replicates per arm, `gemini-3.5-flash-lite`, byte-identical evidence, only the two `.md` files
differing:

| arm | FP / 88 | recall / 88 |
| --- | ---: | ---: |
| HEAD rubrics | 19.3 (19, 19, 20) | 68.3 (68, 69, 68) |
| edited rubrics | 18.7 (20, 17, 19) | 69.0 (68, 69, 70) |

FP −0.6, recall +0.7 — inside the sd≈1.06 fixed-evidence noise floor, with fully overlapping per-rep ranges.
Case-level it is churn: 4 FPs reduced, 3 introduced, 4 recall gained, 3 lost.

The two edits fail for **different** reasons, and the distinction decides what to do with each:

- **`alt-text-adequacy-v0` — tested and ineffective.** Its target population reproduces stably (the
  `alt-not-an-alternative-filename-placeholder` FPs sit at 3/3 in both arms) and the action-first
  discriminator moved almost none of them. The diagnosis holds — the rubric text does instruct the FP — but a
  gate placed in front of the prohibition does not move a judge that already ignores the resolved accessible
  name it was handed.
- **`field-programmatic-association-v0` — untested, not refuted.** All five
  `form-label-and-group-relationships-by-context` FPs, including the two model-independent ones the
  composite-group clause was written for, do **not reproduce in the replay**: `missedAgree` in both arms.
  Replay fidelity overall is 14 of the 23 original FPs — the same count, a different composition — and the
  nine that vanish cluster in exactly that family. The 585 run had tools ON; this replay is single-shot
  tools-OFF, so the evidence differs.

**Recommendation: revert both rubric edits.** This batch has already demonstrated that a confidently-reasoned
justification can be wrong (the `novalidate` qualifier), and these are prompt changes carried by a story with
no measurement behind them. The detector fixes stand on their own evidence; the rubric edits do not. Testing
the composite-group clause properly would need a tools-ON replay to reproduce that family, and would settle
only one of the two.
