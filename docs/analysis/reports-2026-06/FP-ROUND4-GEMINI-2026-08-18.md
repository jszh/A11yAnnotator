# FP round 4 — Gemini 3.7 Flash annotated-suite run (2026-08-18)

Scope: minimise false positives on the current-harness Gemini run **without losing recall**.

## The run

Two server batches on the identical tree (commit `48fa8580`), merged for analysis:

| batch | cases | recall | FP |
|---|---:|---:|---:|
| `annot-overlap6-gemini37-current-48fa8580` (1.1.1 1.3.1 2.1.2 2.4.2 2.4.4 3.3.1) | 233 | 188/195 | 2/38 |
| `annot-rest4-gemini37-current-48fa8580` (1.4.1 1.4.13 2.4.3 4.1.3) | 156 | 103/115 | 4/41 |
| **merged** | **389** | **291/310 = 93.9 %** | **6/79 = 7.6 %** |

Model `gemini-3.7-flash`, tools + vision on, strata `unflagged,clear,fixed` (needs-validation excluded).

## The six FPs, root-caused

Stability was checked against every prior annotated-suite artifact (Claude s9–s12, the 2026-08-15 post-fix run,
the early-July Gemini run) — see the table. Each was then reproduced locally with the deterministic pipeline
(`collect + orchestrate(runLlm:false)`), and the judge's claim checked against the page source and the
instrument facts handed to it.

| case (GT passed) | mechanism | stable? | classification |
|---|---|---|---|
| 3.3.1 `inline-error-adjacent-to-wrong-field/case-06` | deterministic `form-error-probe` BARRIER (`v3Barrier:true`), LLM UNCERTAIN on the other fields | FP on **every** run, both models | **harness defect (A2)** — field declared invalid at rest (`class="invalid"`, retained bad value, message beneath it, no `aria-describedby`); the probe's synthetic invalid-submit on a static page surfaces nothing new ⇒ "not identified" |
| 3.3.1 `error-icon-text-alternative-misstates-error/case-07` | deterministic `form-error-probe` BARRIER | FP on every run, both models | **harness defect (A1 + A2)** — the referenced surface IS an `<img alt="…specific message…">`; `visibleText(img)` read '' (descendant-only alt fold) so the referenced surface was skipped |
| 1.4.13 `hover-content-no-keyboard-focus-trigger-path/case-05` | LLM `hover-hoverable/persistent/dismissable` BARRIER (`v3Barrier:false`) | FP on every run, both models | **harness defect (B1 + B2)** — the runner had already applied the #30 redundancy exemption (`contentIsAdditional:false`, `redundant:true`) but (i) returned its *default* `dismissible:false, hoverable:false, persistent:false` which the orchestrator forwarded as MEASURED failures ("disappears on a timer" — there is no timer), and (ii) the LLM facet lane ignored the exemption the deterministic lane had made |
| 1.4.13 `persistent-auto-timeout-vs-valid-info-invalidation/case-06` | LLM `hover-hoverable` BARRIER | FP on every run, both models | **corpus-defect candidate** — the tooltip sits at `top:115%` and is hidden on the trigger's `mouseleave` (`visibility:hidden` immediately; `pointer-events` never reach it), so it is genuinely NOT hoverable under 1.4.13's Hoverable condition. `hoverable` was *unmeasured* deterministically only because the 8 s countdown expires before the re-reveal; the judge's inference from source is correct |
| 2.4.3 `f85-focus-return-after-dismissal/case-03` | LLM `focus-modal-containment` BARRIER; return/adjacency/order all OK | FP on Gemini + Claude s9; clear on Claude s10–s12 | **corpus-defect candidate** — `role="alertdialog" aria-modal="true"` with NO focus trap (no Tab handling, no `inert`, no background `aria-hidden`); instrument-measured `containmentLeak: {openedStops:7, leakedStops:5}` |
| 2.4.3 `f85-focus-return-after-dismissal/case-06` | LLM `focus-modal-containment` BARRIER; return/adjacency/order all OK | same pattern | **corpus-defect candidate** — same: `role="dialog" aria-modal="true"`, no trap; `containmentLeak: {openedStops:9, leakedStops:5}` (header nav + opener) |

Why the three are corpus defects and not harness defects:
- The corpus's own doctrine treats an untrapped modal as a 2.4.3 failure (aspect `modal-focus-not-contained-both-directions`, whose GT-passed cases 05/06 DO trap and are judged OK by the same rubric). GT-failed `f85 case-02` is caught **only** via the containment leak (its return facet judged OK) — silencing the leak in the harness would trade 1 TP for 2 FPs and contradict the corpus.
- The 1.4.13 case-06 tooltip fails Hoverable by construction, and the page's OWN doc already claims "the popup appears on hover/focus, **is hoverable**, Esc-dismissible" — so the page contradicted its documented mechanism. The harness verdict was factually right about the page.

**Resolution (user decision, 2026-08-18): the three pages were REPAIRED, not retagged.** See "Corpus repairs" below.

## Harness fixes (this round)

| id | file | change |
|---|---|---|
| A1 | `scripts/v3/lib/exp-runners.js` `probeFormError.visibleText` | fold in the surface node's OWN `alt`/`aria-label` (img/svg/role=img), not only descendants' |
| A2 | same, before any mutation | **author-declared at-rest error state** (`aria-invalid="true"` or a token-anchored error-class token on the CONTROL — the collector's `ERROR_CLASS` lexicon) ⇒ credit a referenced visible surface (`customIdentifies`) or ABSTAIN with reason — never BARRIER. Deliberately narrow: `:invalid`+retained value is not a trigger (silent-redisplay stays probeable), block class is not read (ACT 36b590 failed examples are pristine fields ⇒ unaffected) |
| A3 | `scripts/v3/lib/collect-error-summary.js` `collectAtRestErrorState` | `aria-describedby`/`aria-errormessage` resolve an `<img alt>` like accessible-description computation; new fact `blockOtherText`(+xpath): other visible text in the field's block when both lexicon channels are empty; note documents `blockOtherText`/`blockIconAlt` |
| A4 | `scripts/v3/llm-rubrics/error-identification-v0.md` | at-rest reading rule lists the two facts: `blockOtherText` read against `retainedValue`; `blockIconAlt` is a text alternative — names the problem ⇒ identification, only signals "some error" ⇒ REPRODUCED |
| B1 | `exp-runners.js` `runHoverContentTri` | facets never measured are DELETED (absent ⇒ orchestrator `null`), never the boolean-false defaults |
| B2 | `orchestrator.js` hoverFacets, `llm-adjudicator.js` `hoverFacetOpen` + note | thread `redundantWithVisibleText`; close all three hover-facet rubrics on the POSITIVE redundancy fact (contentIsAdditional:false && redundant:true) — any other not-additional stays open; note: `null` = unmeasured, `redundant:false` = additional |

Regression tests: `scripts/v3/tests/coverage/fp-round4-gemini-2026-08-18.test.js` (16 tests incl. the review pins, invented
fixtures, two polarities each). Existing pins updated: none needed (P9's `customIdentifies` credit is preserved by
crediting a referenced visible surface inside the at-rest branch).

## Corpus repairs (the three pages the harness was right about)

Each page kept its `expected` label, its scenario, and its documented mechanism; only the unrelated defect
that made it fail a *different* condition was repaired. Every repair was verified with a deterministic
before/after probe, not by re-running the judge.

| page | defect | repair | measured before → after |
|---|---|---|---|
| `1.4.13/persistent-auto-timeout-vs-valid-info-invalidation/case-06` | tooltip at `top:115%` left a **7 px dead band**, and the trigger's `mouseleave` hid it immediately, so a pointer travelling toward it extinguished it — a real **Hoverable** failure, contradicting the page's own doc ("is hoverable") | `top:100%` + an 8 px **transparent top border** as a hit-testable bridge (`background-clip:padding-box` keeps the visual offset), plus a 400 ms hide grace cancelled by `mouseenter` on either element | fine-step pointer travel onto the tip: **tooltip dies (`visible:false`) → survives**; gap **7 px → −1 px** |
| `2.4.3/f85-focus-return-after-dismissal/case-03` | `role="alertdialog" aria-modal="true"` with **no focus containment** — 5 background chip controls tabbable while open | Tab/Shift+Tab cycle handler scoped to the dialog (`getClientRects()` visibility filter, disabled/hidden controls excluded), removed on close | `containmentLeak` **{openedStops 7, leakedStops 5} → {2, 0}** |
| `2.4.3/f85-focus-return-after-dismissal/case-06` | same: `role="dialog" aria-modal="true"`, header nav + opener tabbable while open | same | `containmentLeak` **{openedStops 9, leakedStops 5} → {4, 0}** |

**Scenario-preservation regression probes** (all pass):
- 1.4.13 case-06 — countdown ticks ٠٠:٠٨ → ٠٠:٠٥ while hovered (Persistent holds); at expiry the popup is
  emptied and hidden, the seat loses `held`, `aria-describedby` is removed and the pay button reads
  "انتهت مهلة الحجز" — the info-invalidation exception the case exists to test. Escape still dismisses
  immediately on BOTH the hover and focus paths (the grace timer does not delay it).
- 2.4.3 case-03 — open on "payments" → focus `#rm-cancel`; Tab×6 cycles `rm-confirm`↔`rm-cancel` (contained);
  confirm → chips `[bug, needs-repro, p1]`, focus on the **next** chip's × (the F85 logical-neighbour path);
  Escape → chip survives, focus back on its ×; after deleting every chip → focus **+ Add label**. All four
  documented branches intact.
- 2.4.3 case-06 — open → `f-headline`; Tab×7 cycles `f-headline → f-location → wiz-cancel → wiz-next → wrap`
  (contained; disabled Back and hidden Done correctly excluded); **Done** commits the edited value and returns
  focus to `#edit-profile`; **Escape** and **Cancel** return there without committing.

**Routing check** (the real gate, `selectRubricSubjects`): the repaired pages no longer summon
`focus-modal-containment-v0` at all (leakedStops 0 ⇒ clause gate closed), while GT-failed `f85 case-02`
(leakedStops 12) and `modal-focus-not-contained/case-01` still do — the FP source is removed at the routing
layer and the sibling recall path is untouched.

**Corpus sweep for the same defect classes.** All 923 corpus pages scanned: of the GT-passed pages that
declare `role="dialog"/"alertdialog"` or `aria-modal="true"`, only these two lacked containment. The one
remaining hit, `2.4.3/f85-revealed-dialog-not-adjacent/case-03`, declares `aria-modal="false"` — an
explicitly non-modal dialog that owes no containment (measured: no leak, containment rubric not summoned),
so it is correct as-is. Two `3.3.2` pages carry incidental untrapped dialogs but 3.3.2 is not in the scored
SC set and each case is scored under `restrictScs`, so they cannot produce an FP here — noted, not touched.
Among GT-passed 1.4.13 pages, only case-06 measured a facet failure; the rest measure all-true.

Two doc lines were added (`case-03.md`, `case-06.md`) recording that each dialog now backs its `aria-modal`
declaration with real containment, so a later edit does not silently remove it.

## Adversarial review (opus, read-only) and what it changed

The first cut was reviewed adversarially before any run. Findings acted on:

| # | sev | finding | fix |
|---|---|---|---|
| 1 | HIGH | A2 reused the loose surface-scan `ERR_CLASS` (unanchored substrings incl. `required`, `alert`, `toast`…) as the DECLARATION test — `class="required"` (jQuery-Validate/Drupal required marker) would silence the probe on a pristine form, while the collector's tighter lexicon emits no compensating `atRestErrorState` ⇒ two-lane blackout invisible to the ACT gate | declaration lexicon = the collector's token-anchored error-only `ERROR_CLASS`; the collector's gate now opens exactly when the probe abstains (pinned: `class="required"`/`"alert"` still barrier) |
| 2 | MED | `abstainReason`/`atRestDeclaredInvalid` were computed and dropped (no consumer) — abstain and "no barrier" byte-identical in artifacts | published in the probe `measurement` |
| 3 | MED | folding descendant img alts into the `ERROR_WORD`-gated channel let a decorative "error icon" promote a hint to `associatedErrorText` | alt folded ONLY for a node with no text of its own; nested icons inside text-bearing containers are the container's decoration |
| 4 | MED | note claimed `adjacentErrorText` was alt-aware; it was not | adjacent scan alt-aware (same rule) |
| 5 | MED | `blockOtherText` ignored `aria-labelledby` labels and took the first match (a preceding hint could hide the message) | labels via `el.labels` + `aria-labelledby` excluded; prefer the first candidate AFTER the control; ≤3 candidates ride as `blockOtherTexts` |
| 6 | MED | B2 closes the ENTIRE 1.4.13 LLM surface for a redundant reveal (the three facet rubrics are all there is); the rest-visibility predicate counted `left:-9999px` text as visible | off-canvas rest text excluded from the redundancy predicate (pinned). The obscuring-redundant-tooltip risk is the stance #30 already priced ("adopts the corpus's redundancy-decisive 1.4.13 stance") — kept, and recorded as a priced risk below |
| 7 | MED/LOW | judge note asserted "adds text" for text-free (graphical) reveals; `reason` dropped in transit | `reason` threaded; sentence conditioned on `revealedText` |
| 8 | LOW | comments over-claimed accessible-name parity | comments corrected; `img[aria-label]` added |
| 9 | LOW | A1 credited a bare-symbol alt while the rubric says it identifies nothing | floor: ≥2 letters |
| 10 | LOW | A2 returned phantom `nativeWouldBlock:false` on an unmeasured path | `null` |
| 11 | LOW | two code comments carried near-verbatim corpus strings (prompts were clean) | genericised |
| 12 | LOW | rubric barrier sentence did not enumerate the new channels | aligned |

Verified sound by the review: serialization safety (all helpers declared before use; browser globals only), B1
downstream (`null` coercion, `!== true` gates, schema tolerates missing keys, no pinned test on the unmeasured
path), A2 is a no-op on ACT 36b590 (no control there carries `aria-invalid` or a class), prompt leakage clean.

**Priced risk (deliberate, recorded):** with #30 + B2, a hover reveal whose whole text is already visible at rest
next to the trigger is judged by NO lane, even if it obscures neighbouring content and ignores Escape. That is
the corpus's redundancy-decisive stance the deterministic lane already adopted; the cheap refinement (compute
`tip.obscures` before the additional-content branch and keep `hover-dismissable-v0` open when a redundant
reveal obscures) is a candidate for DEFERRED-TODO if the user wants the SC-literal reading.

## Recall exposure analysis (before running anything)

- 3.3.1: of 30 GT-failed cases caught, only 4 were caught by the deterministic probe ALONE (no LLM barrier):
  `error-icon…case-01`, `error-summary-incoherent…case-02`, `inline-error-adjacent…case-05`,
  `silent-redisplay…case-05`. Under A2, `case-01`'s email (aria-invalid) is routed to the LLM lane
  (at-rest facts: flagged, `blockIconAlt` a bare category word, no text) — the only recall exposure;
  the other three keep their probe barrier (their probed fields are pristine/valid at rest).
- 1.4.13: a deterministic sweep of all 31 annotated cases (pre-change tree) shows the redundancy exemption
  fires on exactly ONE case — the FP itself. B2 has zero recall exposure. B1's null-facets: the one
  GT-failed case whose facets were unmeasured (pseudo-element tooltip) was caught by source reasoning, not
  by the phantom falses.

## Validation

**Unit tests.** `fp-round4-gemini-2026-08-18.test.js` 16/16; the full v3 suite green (1428 pass / 0 fail / 1 skip
before the review fixes; re-run on the final code — see the commit note).

**Deterministic pre/post sweeps (Mac, `collect + orchestrate(runLlm:false)` per case).**
- 3.3.1, all 35 annotated cases vs the run's `v3Barrier` flags: exactly **4 page-level flips**, all
  declared-invalid-at-rest fields — the two FPs cleared, and GT-failed icon-01 / icon-05 hand off to the LLM
  lane. Eight further fields abstained without changing their page's flag (another field still barriers, or
  the page was already det=0). Everything else identical.
- 1.4.13, all 31 cases, base vs post: **identical** deterministic flags and identical
  appeared/additional/redundant measurements on every trigger; case-05 → 0 LLM subjects (gate closed).

**Targeted LLM slice (holdout policy), server, `48fa8580` + fixes, Gemini 3.7 flash, tools ON, 3 reps
(`results/annot-r4-slice-331-1413-rep{1,2,3}/`; rep3 = final code incl. the slow-reveal retry).** Base = the
same 66 cases from the merged run.

| | base | rep1 | rep2 | rep3 |
|---|---|---|---|---|
| 3.3.1 recall / FP | 28/29 · 2/6 | 28/29 · 0/6 | 27/29 · 0/6 | 28/29 · 0/6 |
| 1.4.13 recall / FP | 22/25 · 2/6 | 24/25 · 1/6 | 24/25 · 2/6 | 23/25 · 1/6 |

Per-case: `adjacent-06` → LIKELY_OK "identified and described in text directly adjacent to the invalid
field"; `icon-07` → LIKELY_OK "identified in text via the error summary and programmatic description";
`icon-01` and `icon-05` (the two GT-failed cases whose deterministic barrier hands off to the LLM lane under
A2) → caught in **3/3** reps, icon-01 with the right reason ("generic alt text … without any text identifying
the specific problem"); across both SCs **no GT-failed case lost its catch in all three reps**; `hover-content-05` → noVerdict (gate closed) in rep1 and rep3 — in rep2 one of its three
triggers' hover reveal was not measured under 16-shard load (fail-open ⇒ judge, CSS reasoning ⇒ FP); the same
page reads redundant on all three triggers 12/12 unloaded on the same server, so a slow-reveal retry (one
re-read after +300 ms with the pointer held) was added and rep3 cleared it. `persistent-02` GT-failed flipped
to caught in 3/3 (its det flag 1/0/1 across reps is the pre-existing hover-runner timing variance also seen
between the base run and the Mac sweeps). The recall ±1s — `non-text-only-06` (2/9 → 0/9 barrier verdicts in
rep2 only; Gemini has always been at 2/9 on it while Claude ranges 1–9/9; old-vs-new collector output on that
page is byte-identical) and `applicability-05` — are judge variance, not attributable to the change.

**Post-repair slice — the decisive measurement.** With the three corpus repairs in place, the same server
config over ALL THREE affected SCs (3.3.1 + 1.4.13 + 2.4.3, 112 cases, 2 reps,
`results/annot-r4-slice-3sc-rep{1,2}/`):

| SC | base recall / FP | post recall / FP |
|---|---|---|
| 3.3.1 | 28/29 · 2/6 | 27/29 · **0/6** |
| 1.4.13 | 22/25 · 2/6 | 24/25 · **0/6** |
| 2.4.3 | 28/30 · 2/16 | 28/30 · **0/16** |
| **total** | 78/84 · **6/28** | **79/84 · 0/28** (rep2: 78/84 · **0/28**) |

**All six FPs cleared in 2/2 reps; recall held (rep2) or +1 (rep1).** Case-level churn is exactly 9 rows: the 6 FPs, two recall GAINS
(`applicability-author-vs-ua-title-tooltip-05`, `persistent-auto-timeout-02` — both previously
`missedAgree`), and one loss, `non-text-only-error-indicator-06`, which is the known Gemini-marginal case
(2/9 barrier verdicts historically, and it flipped `caught`/`uncertain` across the earlier 3 reps on
UNCHANGED code) — judge variance, not attributable to the change.

**Projected on the full 389: FP 6 → 0 (7.6% → 0%), recall 291/310 → 292/310 (93.9% → 94.2%).**

**ACT 581 held-out gate — PASS** (required: shared collector + experiment runner changed). Run in an isolated
worktree = `48fa8580` + the 5 changed files (`git worktree`, QualWeb deps symlinked so the checker lane is
live like the reference), Mac, `--subset --local --proposed --limit=0 --max-auto=100000
--out=v3-act-subset-r4-gate`, compared row-for-row to `v3-act-subset-b3-gate`.

| | reference `b3-gate` | `r4-gate` |
|---|---|---|
| v3 tp / fn / fp | 13 / 101 / 1 | **13 / 101 / 1** |
| tn (+withClear) | 262 (+8) | 261 (+9) |
| decisionAgreement | 0.7294 | 0.7287 |
| flag-lane recall/FP (v3 · qualweb · system) | 0.073·0.599·0.633 / 0.002·0.002·0.005 | **identical** |

**Every ACT decision is unchanged.** Exactly **3 of 575 rows** differ, all flake-class, each justified and
rechecked:
1. `fd406bed…` (afw4f7, 1.4.3) — **errored in the reference**, completes here as `tnWithClear` (a plain
   `text-contrast-pixel` NO_BARRIER shadow obs). This is the same case named as the single delta in the
   b2→b3 comparison. Single-rule recheck `--rule=afw4f7`: 34/34, **0 errors**, tp 8 / fn 3 / fp 1 / tn 15 /
   tnWithClear 7 — the reference's decisions plus the previously-errored case landing as a clear TN.
2. `2c80908…` (5c01ea, 4.1.2) — `tn` in the reference, **errored here** (the error simply moved: both runs
   report `error: 1`). Single-rule recheck `--rule=5c01ea`: 17/17, **0 errors** — transient resource flake
   under full-corpus load, not a code defect.
3. `f5ea9fd3…` (80af7b, 2.1.2) — bucket unchanged (`fn`); one extra **shadow** (non-authoritative) 2.4.7
   `focus-visual-retry` NO_BARRIER on the second link. Proven flake by A/B: the page carries an `onblur`
   self-refocus trap, which makes focus-visual measurement timing-sensitive; the **pristine 48fa8580 tree
   flips on it too** (`valid:false` in the first A/B run, `valid:true` in 3/3 repeats, same as the patched
   tree). Not attributable to the change, and it cannot affect a decision — the 2.4.7 lane is shadow.

No delta touches 3.3.1 or 1.4.13 (the SCs this round changed): the ACT subset's 3.3.1 rule (36b590) is
byte-identical, which the review predicted — none of its fixtures carries `aria-invalid` or a class on a
control, so A2's trigger cannot fire there.
