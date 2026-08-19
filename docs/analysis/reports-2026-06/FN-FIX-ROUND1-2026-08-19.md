# FN round 1 — implementing the four-SC root cause

Implements the ranked change list in [FN-ROOTCAUSE-4SC-2026-08-19.md](FN-ROOTCAUSE-4SC-2026-08-19.md).
Base commit `842aad09`. All work validated in an ISOLATED worktree (`842aad09` + only these files), so a
second agent's concurrent edits to `act-page-collect.js` / `sensory-lexicon.js` / `eval-page.js` /
`run-annotated-suite.js` cannot contaminate any measurement here.

## 1. What shipped

| # | report item | change | file |
|---|---|---|---|
| 1 | 4.1.3 enforce the stand-alone check | `applyStandaloneCheck` — a clear that skipped the check is re-asked as its OWN decomposed question, handed each announced string paired with the accessible name of the control that caused it. Fails closed: only a `REPRODUCED` from the focused pass moves the verdict. | `llm-adjudicator.js` |
| 1b | make it auditable | `reasoning` persisted into the scored artifact (it was generated, used only by the default-off refute cascade, and dropped) | `fp-experiments/score-lib.js` |
| 2 | point the rubric at the measured referents | new signal item 7 (`triggerLabel` / `sectionHeading`), and the stand-alone check's leg (ii) now names them | `llm-rubrics/status-message-v0.md` |
| 3 | 1.4.1 delta subjects | each `colourStateDeltas` row with `textAlsoChangedNearby: false` mints a `use-of-color-v0` subject on ITS OWN element, so the xpath match the signal note demands can succeed | `llm-adjudicator.js` |
| 4 | 1.4.13 persistent facet | `persistentFacetFromVanish` — a vanish observed after the dwell revises the facet the dwell assigned. **Corrected after the scored A/B (§7): a TIME-attributed vanish is UNMEASURED, only a SCROLL-attributed one scores.** | `exp-runners.js` |
| 5 | 2.4.3 undeclared modal | `occludedStopsUnderOverlay` opens the containment clause on the GEOMETRIC modal shape, not only on `dialog[open]`/`aria-modal` | `llm-adjudicator.js` |
| 6 | 2.4.3 declared order | `intrinsicOrdinalViolation` + a precedence carve-out in the systematic-traversal licence | `order-check.js`, `run-instruments.js`, `llm-adjudicator.js`, `llm-rubrics/focus-order-meaning-v0.md` |
| 7 | 1.4.13 measured `hoverable: false` | **re-diagnosed — see §2** | `applicability-observer.js` |
| 9a | field state styling | `boxShadow` captured on the field and on the peer rows that differ, with a neutral note | `collect-colour-peers.js`, `llm-adjudicator.js` |
| 10 | 1.4.13 scroll | scroll-held probe, self-verifying and scroll-restoring | `exp-runners.js` |

Item 8 required no code and item 9's doctrine half was deliberately not decided — §2.

## 2. Two corrections to the report's own plan

**Item 7 was misdiagnosed.** The report called it a rubric-authority problem: a measured `hoverable: false`
that the judge overrode. That is not what happened. `hoverable: false` ALREADY feeds `anyPropertyFails`, so
the deterministic lane had minted a barrier — and the builder threw it away at Rule-15 binding:

```
evidence not bound: independent applicability observer disagrees on …/svg[1]/rect[1]:
hasHoverFocusTrigger: runner=true observer=false (Rule 15)
```

The independent observer re-derives the trigger from declarative attributes and from CSS rules keyed on
`:hover`. An SVG `<title>` is an ELEMENT, not an attribute, so `hasAttribute('title')` cannot see it, and a
chart whose bars are `<rect>`s with a JS-wired overlay declares nothing either axis recognises. A fully
proven barrier (`valid`, `completed`, every support requirement met) therefore degraded to a deterministic
PARTIAL and never reached the shadow lane. This is the same "the runner SUCCEEDING is what caused the miss"
shape the observer's existing widening comment was written for, one layer down. Fixed by adding two more
DECLARATIVE axes — an SVG `<title>`/`<desc>` child, and an inline hover/focus handler attribute — neither
copied from the runner. `addEventListener`-wired reveals stay a documented residual: listeners are not
readable from in-page script, and the observer runs in-page by design.

**Item 8 needed no new channel.** The text-less colour-token lane already exists
(`collect-colour-peers.js`), gated behind `V3_COLOUR_TOKEN_LANE=1` pending the census in
[DEFERRED-TODO item L](../../DEFERRED-TODO.md). Measured directly against the page the report says mints
nothing: with the flag on it nominates the status-dot matrix correctly — 12 members, legend text captured,
zero groups with the flag off. So that miss closes by running item L's census + slice protocol, not by
writing a candidate channel. No code was added and no default was flipped.

**Item 9's doctrine half was left to the user, as the report said it should be.** `box-shadow` is now
captured — a real evidence gap, since a field whose coded state is a shadow ring was described to the judge
as carrying only its border. Whether F81's lightness escape should be narrowed to TEXT cues as F81 words it
("from the other text", "if viewed in black and white") is unchanged and still open. The new note is
deliberately two-sided so it grants no escape on its own.

## 3. Adversarial review of these fixes

Reviewed as a hostile reader of my own diff, on the standing principle that implementers fit fixes to their
own tests twice. Four findings, all fixed before any measurement was taken.

| # | severity | finding | fix |
|---|---|---|---|
| 1 | HIGH | The scroll-held probe left the page SCROLLED. The hoverable and dismissible probes run next and act on coordinates captured at the ORIGINAL reveal — the pointer travel walks to the tip's recorded box, Escape is graded against it. Any page where the probe fired would have had both facets silently corrupted. This is the `#31` stale-geometry defect class exactly. | scroll restored (and settled) the moment it has been read |
| 2 | MEDIUM | The focused 4.1.3 pass handed the judge a flat pool of EVERY trigger label on the page next to every announced string, inviting it to pair an announcement with an unrelated control's name — a manufactured referent. | each string now travels with `byControl`, the name of the control that actually caused it |
| 3 | MEDIUM | `standaloneCheckPerformed` accepted a 2-character announcement as "quoted" if those characters appeared anywhere in the reasoning — waving through exactly the clears the gate exists to catch, on the hardest case (a bare numeral from a non-atomic update). | floor raised to 3 chars; a shorter string can never satisfy the test and is always re-asked |
| 4 | LOW | The gate could re-open a clear that the refutation cascade had just produced by overturning a barrier, handing the same subject back and forth. | skips when `_refutedFrom` is set |

## 4. Leak prevention

- `prompt-corpus-leak.test.js`: 5/5.
- Four fixture strings in the new tests did occur in corpus pages (`Recalculate`, `Postcode`, `Tile`,
  `Your basket`); all four replaced with vocabulary that occurs in zero corpus pages and re-verified.
- **Re-scanned after the §7b correction, restricted to the PROMPT-BOUND surfaces** — the two rubric markdown
  files (sent verbatim) and every line added to `llm-adjudicator.js`. 203 added lines vs 2008 corpus pages:
  **7 five-gram matches, all benign and individually inspected.** Four are standard WCAG/ARIA vocabulary
  (`the accessible name of the` ×2, `the announced string does not`, `that already appears inside the`), one
  is a generic wizard phrase (`step 2 of 2 the`), and two are the tokenizer reading CODE punctuation out of
  `.replace(/\s+/g, ' ')`, not prose at all. None carries a scenario, domain, page or answer. The 5-gram
  test is deliberately over-sensitive; reporting the matches and their disposition beats an absolute claim.
- The wider scan over ALL added lines (including non-prompt code) found 12 matches, of which the only
  non-coincidental one is a COMMENT in `exp-runners.js` describing the measured scroll case that motivated
  the probe. Runner comments are never serialized into a prompt, so it is documentation, not a leak — but it
  is recorded here rather than filtered out of the count.
- Every fixture in both new test files is invented; the file headers say so.
- The new prompt-bound prose (rubric items, the focused-pass block, the two signal notes) is generic: it
  names FIELDS and SHAPES, never a scenario, domain, or page.

## 5. Tests

FINAL, on the shipped code (§7a correction + §7b bar): **`npm test` 1464 tests, 1463 pass, 0 fail, 1 skip.**
New coverage: `fn-rootcause-4sc-2026-08-19.test.js` (22 tests, pure) and `…browser.test.js` (3 tests,
Chrome), both confirmed to be picked up by the `npm test` glob rather than orphaned. Every fix is
pinned in BOTH polarities — the shape it must catch and the neighbouring shape it must leave alone.

Three existing pins moved, and every one was updated to be STRONGER, not weaker:

- `hover-persistence.test.js` asserted `persistent: true` on a tooltip that hides itself on a timer while the
  pointer rests on the trigger. Post-correction it pins the FINAL contract: the contradicted facet is DELETED
  (absent, not false), the deletion is declared in `reshowIntegrity.facetsUnmeasured`, and the barrier that
  fixture does carry is attributed to `hoverable` — the timed removal contributes no failing facet at all.
- `batch3-hover-tri.test.js` `#31 restart analog` — see §7a. Now asserts the husk shield did not fire rather
  than asserting the `reshowIntegrity` artifact is absent.
- A fourth suite, `kbd-graph` `F14`, failed once under Chrome contention from parallel probes and passes in
  isolation; it touches nothing in this batch.
- `status-evidence-pure.test.js` is a SOURCE-TEXT pin. Its name reads "persistence facts ride in
  measurement, never in outcome flags", but the invariant it actually enforces is "no NEW key on the closed
  `typedOutcomes` schema, which `schemas.js` validates". That invariant still holds: the revision writes to
  the EXISTING `persistent` flag and adds no key. The pin was updated to the new source shape with the
  distinction spelled out in the assertion message.

## 6. Deterministic A/B — routing and barriers

Method: two worktrees at `842aad09`, differing ONLY in these files. Each page collected + orchestrated with
`runLlm` on a recording stub (no API calls), dumping the four things these changes can move — deterministic
shadow observations, ledger dispositions, the SELECTED rubric subjects (captured at `selectRubricSubjects`,
so a rubric's vision-frame gate cannot hide a routing change), and the 1.4.13 facet payloads.

### 6a. Target pages — every fix fires where the root cause said it would

| page | pre | post |
|---|---|---|
| 1.4.13 `applicability-author-vs-ua-title-tooltip/case-05` | no 1.4.13 observation | `BARRIER_OBSERVED` ×2 (the rects whose travel dies) |
| 1.4.13 `persistent-auto-timeout…/case-02` | autoPartial | `BARRIER_OBSERVED` ×2 |
| 1.4.13 `persistent-auto-timeout…/case-03` | autoPartial | `BARRIER_OBSERVED` ×2 (scroll-held probe) |
| 1.4.1 `ui-status-action-color-only-no-text-cue/case-03` | subjects = the 4 date inputs | + 4 `use-of-color-v0` subjects on the `<tr>`s that flip |
| 2.4.3 `modal-focus-not-contained-both-directions/case-03` | no containment subject | + `focus-modal-containment-v0` |
| 2.4.3 `css-reorder-tab-vs-visual-meaning/case-07` | `intrinsicOrdinals` absent | `violated: true` |

Three of the six now resolve DETERMINISTICALLY (no LLM lane involved), which is a stronger outcome than the
report projected for them.

### 6b. Full corpus over-fire check

140 pages (every 1.4.1 / 1.4.13 / 2.4.3 page, plus a 4.1.3 control slice) × 2 trees, run on the GCE box
(`a11y-perf-c4`, 16 cores) because the laptop could not hold the browsers. **280/280 completed, 0 errors.**

**Result: zero over-fires, zero barriers lost.** Six pages moved, every one of them GT-`failed`:

| page | GT | delta |
|---|---|---|
| 1.4.13 `applicability-author-vs-ua-title-tooltip/case-05` | failed | +2 deterministic `hover-content-tri` BARRIERs (observer widening) |
| 1.4.13 `persistent-auto-timeout…/case-02` | failed | +2 BARRIERs (persistent-facet revision) |
| 1.4.13 `persistent-auto-timeout…/case-03` | failed | +2 BARRIERs (scroll-held probe) |
| 1.4.1 `ui-status-action-color-only-no-text-cue/case-03` | failed | +4 `use-of-color-v0` subjects on the delta's own rows |
| 2.4.3 `modal-focus-not-contained-both-directions/case-03` | failed | + `focus-modal-containment-v0` routed |
| 2.4.3 `css-reorder-tab-vs-visual-meaning/case-07` | failed | `intrinsicOrdinals.violated` false → true |

No GT-`passed` or GT-`inapplicable` page gained an in-scope barrier or subject. On the three 1.4.13 pages the
`hover-persistent-v0` / `hover-hoverable-v0` subjects DISAPPEAR, which is correct: the obligation is now
deterministically disposed, so it is no longer auto-PARTIAL and the LLM lane is not asked a settled question.

The remaining 13 changed pages differ only in the `facets` payload — the additive `via` (which authority read
each persistence sample) and `vanishedOnScrollWhileHeld` keys. No outcome, ledger, or routing effect.

**Four apparent deltas were investigated and are NOT attributable to this change.** All are OFF the SC under
test (1.4.3 / 2.1.1 / 2.4.7 / 1.3.5 / 3.3.2 observations on elements the other run never reached) on pages
with dynamic content. `restrictScs` bounds the LLM subjects, not the deterministic experiment lane, so
whole-page collection variance leaks into a shadow-observation diff. Proven by re-running those four pages
THREE times on the PRE tree with no code change at all:

| page | pre run 1 | pre run 2 | pre run 3 | post |
|---|---|---|---|---|
| 1.4.13 `persistent-auto-timeout…/case-06` | 27 | 37 | 37 | 30 |
| 2.4.3 `css-reorder…/case-01` | 11 | 14 | 14 | 13 |
| 2.4.3 `css-reorder…/case-02` | 15 | 15 | 15 | 15 (ledger-only, off-SC) |
| 2.4.3 `css-reorder…/case-03` | 1 | 16 | 16 | 5 |

Three of the four swing by more WITHIN the unmodified tree than the pre↔post "delta" they appeared to show,
and every post value sits inside the pre range. None involves a mechanism these changes touch: the widened
observer flag (`hasHoverFocusTrigger`) is declared by `hover-content-tri` alone, so it cannot bind a 1.4.3 or
2.1.1 observation. Recorded here rather than silently dropped, because on a first read this looked like four
over-fires.

*Method note.* The first diff reported 138/140 pages changed. That was a bug in the DIFF TOOL, not a finding:
`intrinsicOrdinals` does not exist on the pre tree, so `null` vs `{violated:false}` flagged every page. Only
`violated === true` is a claim; absent and false are the same statement. The 4.1.3 control slice going clean
afterwards is the check that caught it — those pages' changes are LLM-lane only and MUST NOT move this sweep.

## 7. Scored A/B — measured over replicates

156-case four-SC slice on the GCE box (Gemini 3.7 flash, tools on, 32 pages / 8 browsers / 256 tabs / 32
instrument lanes): one baseline replicate on the pristine `842aad09` tree, two on the fixes as first shipped,
and **three on the final tree**.

`fixed` = the FINAL tree (§7a correction + §7b bar), **three replicates**, because one replicate is not
enough to state a rate on a slice this size.

| SC | before (1 rep) | as first shipped (2 reps) | **fixed (3 reps: r1 / r2 / r3)** |
|---|---|---|---|
| 1.4.1 | 26/28 = 92.9% | 26/28, 26/28 | 26/28, 26/28, 26/28 — **unchanged** |
| 1.4.13 | 24/25 = 96.0% | 25/25, 25/25 | 25/25, 24/25, 25/25 |
| 2.4.3 | 28/30 = 93.3% | 30/30, 30/30 | **30/30, 30/30, 30/30** |
| 4.1.3 | 27/32 = 84.4% | 29/32, 29/32 | 29/32, 28/32, 28/32 |
| **recall** | **105/115 = 91.3%** | 110/115, 110/115 | **110, 108, 109 /115 — mean 94.8%** |
| **FP** | **0/41 = 0%** | **1/41 = 2.4%** (both reps) | **1, 0, 0 /41 — mean 0.8%** |

**Net: recall 91.3% → ~94.8% (range 93.9–95.7%) at an FP rate of 0–1 case in 41.** Precision 100% → 99.1–100%.

Read per SC, only **2.4.3 is unambiguous** (+2, stable in 3/3). 4.1.3 gains 1–2 of 5 and 1.4.13's gain is
inside its own noise except for the deterministic `case-03` catch, which is stable. **1.4.1 gained nothing in
any replicate** — item 3 is routed but not earning its keep, and should be revisited or dropped.

**A structural finding worth more than the delta.** The two replicates of the DEFECTIVE build agreed on all
156 cases; the three replicates of the CORRECT build do not (108/109/110). The defective version was more
stable precisely because it was over-claiming deterministically — a deterministic verdict never wobbles, even
when it is wrong. Moving that decision into the LLM lane trades run-to-run stability for correctness. Any
future comparison that rewards stability will therefore reward over-claiming; the metric must be paired with
a specificity check or it points the wrong way.

Six cases move off the baseline, five correct catches and one false positive:

| case | GT | before | as shipped | fixed (3 reps) |
|---|---|---|---|---|
| 1.4.13 `persistent-auto-timeout…/case-02` | failed | caught (LLM) | caught (det.) | caught (LLM again) |
| 1.4.13 `persistent-auto-timeout…/case-03` | failed | missed | **caught** (det.) | **caught** (det., 3/3) |
| 1.4.13 `persistent-auto-timeout…/case-06` | **passed** | correct miss | **FALSE POSITIVE** | correct miss 2/3 |
| 2.4.3 `css-reorder-tab-vs-visual-meaning/case-07` | failed | missed | **caught** | **caught** 3/3 |
| 2.4.3 `modal-focus-not-contained…/case-03` | failed | missed | **caught** | **caught** 3/3 |
| 4.1.3 `announced-text-lacks-visual-context/case-04` | failed | missed | **caught** | **caught** |
| 4.1.3 `partial-update-no-atomic…/case-04` | failed | missed | **caught** | **caught** |

`case-02` is the check that the correction did not trade the FP for an FN: it leaves the deterministic lane
and the LLM lane picks it up again, as at baseline.

**`case-06` after the correction is an LLM-lane residual, not a plumbing defect.** `v3Barrier` is FALSE in
every replicate — the deterministic fix holds — and the one flag came from `hover-persistent-v0` returning
`LIKELY_BARRIER` where it returned `LIKELY_OK` in the other four judge-consulted runs (4/5 correct). The page
is built to be structurally identical to its failing siblings with only MEANING to separate them, so routing
it to the judge is right and the judge being ~80% reliable on it is the honest state of the lane.

*Harness note (not a finding of this batch).* `run-annotated-suite.js` defaults `MODEL` to `claude-sonnet-4-6`
regardless of `--provider`, so `--provider=gemini` without `V3_LLM_MODEL` hands a Claude model id to the
Gemini endpoint: 394 silent `transport-null`s, a run that exits 0, and a plausible-looking recall of 25/105.
One such run was produced and discarded here. A provider/model mismatch deserves the same FATAL the missing
key already gets.

### 7a. The false positive, and the correction it forced

`1.4.13 persistent-auto-timeout-vs-valid-info-invalidation/case-06` — a seat-hold tooltip whose countdown
genuinely expires: the hold ends, "held for you" becomes false, and the popup is removed. That is the SC's own
**information-no-longer-valid** exception, so the page is a PASS, and it is written to be *structurally
identical* to its FAIL siblings on purpose.

Item 4 as first shipped scored ANY corroborated vanish-while-held as a deterministic barrier. That is not
decidable here. "Removed by an arbitrary timer" and "removed because the information expired" are the SAME
measurement — a `setInterval` and a live region — and only the second is licensed. Worse, whether the expiry
lands inside the 1–7 s sample window is a RACE, so the barrier was a function of run timing.

**That is also why §6b's sweep reported zero over-fires and was wrong to reassure.** The page did not fire in
the 140-page sweep and fired in BOTH scored runs, on the identical tree. A deterministic sweep cannot see a
verdict that races the page's own clock; only repeated scored runs under production concurrency exposed it.
Read §6b with that bound: it proves no *stable* over-fire, not no over-fire.

**The fix** splits the two vanish kinds in `persistentFacetFromVanish`:

* **time-attributed** ⇒ `'unmeasured'`. The facet is deleted (never inverted), the samples stay in the
  payload, and the LLM lane answers the info-invalidation question — which at baseline it answered correctly
  (`LIKELY_OK`, citing the countdown).
* **scroll-attributed** ⇒ still scores `'false'`. Scrolling is none of the three licensed reasons, the removal
  is attributable to the scroll the probe itself dispatched, and the probe re-verifies the trigger is still
  held and still on screen. Nothing semantic is left to settle.

Verified on the live pages with a deterministic probe: `case-03` still emits both barriers, `case-06` emits
none. Pinned by `E1` (a time vanish is unmeasured however well corroborated) and `E3b` (identical
corroboration, opposite verdicts, the only difference being which probe saw the vanish). One existing pin
moved with it — `batch3-hover-tri` `#31 restart analog` asserted `reshowIntegrity` was ABSENT on a
full-strength re-reveal, but that artifact is also where a declared facet deletion is published, and that
fixture's 2.5 s auto-hide is a time vanish. The pin now asserts what it was really protecting: that the husk
shield did NOT fire, i.e. `hoverable`/`dismissible` stayed SCORED and `anyPropertyFails` is still true.

### 7b. The same scrutiny applied to the correction itself

The correction leaves ONE misattribution path open, and it was closed before shipping. The scroll probe only
runs after the content has survived every timed sample; it then nudges and re-reads within ~400 ms. A page
timer firing inside THAT window would be recorded as scroll-caused — the identical error class, one layer
down. The discriminator is a re-reveal at the RESTORED scroll position: content hidden BY a scroll comes back
at full strength on a fresh hover/focus, whereas content whose information became invalid cannot (the hold
expired, the save finished, the thing it described is gone). `scrollHeld.reshowIntact` is now a REQUIRED
conjunct for the facet to score, and an unrecorded value is not a pass. Pinned by `E3c`.

Measured on the failing page: `case-03` still emits both barriers, with `triggerStillHeld: true`,
`presentAfter: false`, `reshowSig 1000134 ≥ hovered`, `reshowIntact: true` — the attribution is now
corroborated, not assumed. The bar can only make the deterministic lane MORE conservative, so it cannot
introduce a false positive; the risk it carries is losing a true catch, which is why it was measured.

*Generalisable rule, worth carrying past this round:* **a deterministic lane may only score a cause it can
attribute.** Where the SC's exception is a claim about MEANING, the deterministic lane's job is to delete the
facet and hand the measurement over — inverting it trades a false negative for a false positive on precisely
the pages the corpus built to separate them.

## 8. Held-out gate

**What the gate can and cannot prove here, stated before the result.** The 581-case ACT corpus carries NO
case labelled 1.4.1, 1.4.13, 2.4.3 or 4.1.3 — its SCs are 4.1.2 (211), 1.1.1 (94), 1.3.1 (74), 2.4.4 (70),
1.4.3 (34), 2.4.6, 2.1.1, 2.4.2, 2.1.2, 1.4.5, 2.4.10, 2.4.7, 3.3.1. So the gate does not validate the four
detectors this batch changed. It tests the thing CLAUDE.md actually asks it to test: COLLATERAL DAMAGE on
rules nobody tuned against. `hover-content-tri`, the tab-order instrument, the applicability observer and the
colour-peer collector run on every page regardless of a case's label — landing in the 195 out-of-scope
observations and in each row's `v3Summary` shadow / barrier / cleared counts. The comparison is therefore
row-level on those counts, not just on the headline tp/fn/fp, so a change that has not yet moved a decision
still shows up.

Direct evidence for the four SCs is §6 (140-page deterministic sweep) and §7 (scored 156-case slice). A green
gate here means "nothing else broke", not "the fixes work".

### 8a. Result — PASS, no v3 decision changed

`upstream-evidence/v3-act-subset-fn-r1-gate/` vs the reference `v3-act-subset-r4-gate/`
(`node eval/checker-comparison/run-v3-act-suite.js --subset --local --proposed --limit=0 --max-auto=100000`,
581/581, on the GCE box).

| | ref (`r4-gate`) | new | |
|---|---|---|---|
| tp | 13 | 13 | identical |
| fn | 101 | 101 | identical |
| **fp** | **1** | **1** | identical |
| tn | 261 | 262 | +1, from the resolved error below |
| error | 1 | **0** | one reference error-flake completed this time |
| outOfScope / tnWithClear / clearOnFailed | 195 / 9 / 0 | 195 / 9 / 0 | identical |

**Not one row changed its bucket or its `v3Flag`, and `barriersObserved` is 0 on every differing row in both
runs.** 8 of 581 rows differ, and every difference is confined to the raw shadow-observation COUNT:

| rule | SC | expected | ref → new (shadow) |
|---|---|---|---|
| `5c01ea` | 4.1.2 | passed | *error* → `tn`, 2 |
| `674b10` | 4.1.2 | failed | 1 → 0 |
| `674b10` | 4.1.2 | passed | 1 → 0 |
| `80af7b` | 2.1.2 | failed | 7 → 9 |
| `80af7b` | 2.1.2 | failed | 7 → 6 |
| `80af7b` | 2.1.2 | passed | 7 → 8 |
| `0ssw9k` | 2.1.1 | passed | 5 → 4 |
| `c487ae` | 2.4.4 | passed | 2 → 1 |

Row-level justification, per the gate policy — but note this section's justification was INCOMPLETE and is
superseded by §8b. At this point the argument was: four of the seven counts go DOWN, which no change in this
batch can produce (the applicability widening and `intrinsicOrdinals` only ever ADD observations); the rules
involved (`4.1.2`, `2.1.2`, `2.1.1`, `2.4.4`) are none of the four targeted; and two `80af7b` rows move in
OPPOSITE directions within the same rule in the same run. That is true but insufficient, because five of the
rows reproduced on a second run of the same tree — stable deltas need a cause, not a variance story. §8b
finds it: the reference was produced on a different OS. Recorded as written rather than retro-edited, because
"it's probably flake" was the wrong instinct and the pristine same-machine baseline is what settled it.

*Scope note repeated because it matters:* no gate case is labelled 1.4.1 / 1.4.13 / 2.4.3 / 4.1.3, so this
result is a collateral-damage clearance for the shared collectors and instruments — which is what the policy
asks the gate for — and not evidence about the four detectors themselves.

### 8b. Second gate on the FINAL tree, and a same-machine pristine baseline

§7b's `reshowIntact` bar landed after gate 8a, so a second full 581 run was executed on the final tree rather
than leaning on the per-fix targeted-recheck clause: the batch boundary is here, and no scored run may ride
an ungated deterministic change. Artifact `v3-act-subset-fn-r1-gate2/`.

**Then the attribution was redone properly.** The `r4-gate` reference was produced on macOS; both of these
gates ran on Linux. Five of 8a's differing rows reproduced across BOTH my gates, so they could not be waved
off as run variance — and a stable cross-OS difference is not evidence about code either way. A PRISTINE
`842aad09` gate was therefore run on the SAME box (`~/a11y-fn-pre`, verified byte-identical to the commit on
all seven changed files). Artifact `v3-act-subset-fn-r1-pregate/`.

| comparison | v3 counts | rows differing |
|---|---|---|
| **pristine (Linux) vs FINAL tree (Linux)** | **all identical** — tp 13 / fn 101 / **fp 1** / tn 262 / err 0 | **2**, both `80af7b` 2.1.2, shadow ±1 |
| macOS `r4-gate` vs pristine (Linux) | err 1→0, tn 261→262 | 7 |
| macOS `r4-gate` vs FINAL tree | err 1→0, tn 261→262 | 6 |

**This settles it.** The five stable deltas appear in the PRISTINE Linux run too, so they are a macOS↔Linux
platform effect, not this batch. The only rows separating pristine from final are two 2.1.2 shadow counts
that wobble in every run of every tree (gate1 9/8 → gate2 7/7 → pristine 5/8 on identical or unrelated code),
and `barriersObserved` is 0 on both in all runs.

**GATE VERDICT: PASS.** No v3 decision changes anywhere in 581 cases against a same-machine pristine baseline.

*Method note worth keeping:* comparing a gate against a reference produced on a DIFFERENT OS silently
manufactures deltas that look stable and therefore look like code. Run the pristine baseline on the machine
that runs the gate.

## 9. LLM lane

Covered by §7 rather than deferred: the 4.1.3 enforcement pass, both rubric edits, the new 1.4.1 subjects and
the `boxShadow` evidence are all LLM-lane changes, and the three-replicate scored slice is their measurement.
Per the holdout policy no separate LLM holdout run is owed — rubric/prompt-text changes are validated by
targeted scored slices, which is exactly what §7 is, and the deterministic gate (§8) never executes rubrics.

Open, and deliberately not fixed here:

1. **`hover-persistent-v0` on the info-invalidation boundary** — 4/5 correct on `case-06`. The rubric has the
   countdown in evidence and cites it when it clears; the failure mode is not missing evidence. A rubric edit
   would need its own targeted slice and is better done with the other 1.4.13 judgment work (DEFERRED-TODO M).
2. **Item 3 (1.4.1 delta subjects)** — routed in every replicate, converted nothing in any of them.
3. **1.4.1 `noObligation` miss** — needs no code; DEFERRED-TODO item L's census + slice is what is owed (§2).
