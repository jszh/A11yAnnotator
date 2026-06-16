# Harness 3.2 — the PROVISIONAL disposition: a calibrated LLM verdict fills the gap

> **Status: FULLY IMPLEMENTED (2026-06-16).** All 12 work items are built, adversarially hardened
> (5-skeptic total), and green (v3 273, pure 190). The default is `provisionalMode:'ungated'`: a build
> with an `llm`/`judgments` artifact FILLS auto-PARTIAL obligations with non-authoritative PROVISIONAL
> rows (a behaviour change from 3.1's annotation-only lane); `provisionalMode:'gated'` reproduces 3.1
> output until a mechanism earns canary on gold. Two things still need the ON-HOLD harness run, not more
> code: (a) the hand-labelled GOLD for the new families — the loader + worksheet are wired, the labels
> come from the post-run labelling pass; (b) the real browser-captured vision frames + drive-page
> state-before/after pairs fed into `visionByXpath` — the capture module + multimodal plumbing are wired
> and probe-verified, the frames are produced when the run executes.

## Objective

Let a **gold-calibrated** LLM verdict (pass / fail / partial) actually *fill* the obligations that
the deterministic + instrument lanes leave at **auto-PARTIAL** — for the three coverage tiers that
default to "undetermined":

- **D− barrier-only** runners (`1.4.10`, `1.4.13`, `3.3.1`, `2.4.11`): can flag a barrier, never clear
  → every non-barrier obligation is auto-PARTIAL.
- **I instrument-only** SCs (`2.4.3`, `1.3.2`, `4.1.3`): instruments emit findings on a side lane that
  never enters reconciliation → the obligation is auto-PARTIAL.
- **○ data-collected-no-runner** SCs (`2.5.8`, `2.5.5`, `2.4.2`, `2.5.3`): the collector has the facts
  but no consumer enumerates an obligation at all → the SC is invisible to reconciliation.

Today the LLM lane already *expresses* all three outcomes (`RUBRIC_VERDICT_MAP` /
`V2_9_VERDICT_MAP` → `BARRIER_OBSERVED` / `NO_BARRIER_OBSERVED` / `INCONCLUSIVE`) but every
`source:'llm'` observation is a **pure annotation** kept out of `dispositions[]`
([build-v3.js §266-296](../../scripts/v3/lib/build-v3.js)). 3.2 connects the calibrated subset into the
ledger as a new, clearly-labelled, **non-authoritative** disposition.

## The spine: authority state → disposition tier

`authority.js` already has three states; `canary` currently has no distinct effect (it still routes to
shadow/PARTIAL — noted as a gap in 3.1). 3.2 gives `canary` its meaning. The disposition tier **mirrors
the mechanism's authority state for that (sc, direction)**:

| Authority state | Disposition | Authoritative? | Who can reach it |
|---|---|---|---|
| `authoritative` | **CLAIM** | yes | deterministic catalog runners only |
| `canary` | **PROVISIONAL** *(new)* | **no** | any calibrated mechanism — incl. `llm-agent`, `llm-rubric:*` |
| `shadow` | **PARTIAL** (annotated) | no | default; uncalibrated |

This is the whole idea: **PROVISIONAL ≡ a disposition contributed by a `canary`-state mechanism.** It
unifies the LLM lane with the (already-capped-at-canary) policy and reuses the entire existing
calibration/scoring stack — nothing about the authoritative corpus changes. (In **research mode** —
below — `canary` is granted to every mechanism by a single switch instead of earned per-mechanism; the
never-authoritative cap and the honest labelling still hold.)

## What PROVISIONAL is, precisely

A `PROVISIONAL` ledger row fills an obligation that has **no deterministic disposition** (it was
auto-PARTIAL) with a calibrated LLM outcome:

- `observationOutcome: NO_BARRIER_OBSERVED` → **provisional clear** (pass)
- `observationOutcome: BARRIER_OBSERVED` → **provisional barrier** (fail)
- `observationOutcome: INCONCLUSIVE` → **no PROVISIONAL row** — the obligation stays auto-PARTIAL, now
  carrying the LLM annotation. (An abstention is not a disposition; it must not look like one.)

Invariants that DO NOT change:
- `authoritative: false` always; `conformanceOutcome: NOT_ASSESSED` always. PROVISIONAL is an
  **observation** disposition, never a conformance ruling and never authoritative (H4: an LLM does not
  generalize off gold like fixed code — `MAX_LLM_STATE = 'canary'` still holds).
- A deterministic **CLAIM always wins**. PROVISIONAL is only ever computed for obligations with no
  deterministic CLAIM and no deterministic gate-passing shadow — i.e. the `autoPartial` set that
  `selectSubjects` already targets.
- The free-text rationale stays in the side `llmRationale` / `judgments` artifact; the ledger row is
  **structured-only** (enum / xpath / SC / mechanism / opaque ref), so the strict legacy scanner cannot trip.

## The safety crux — asymmetric promotion (clears vs barriers)

A false **barrier** is review-noise; a false **clear** is a real accessibility harm (we told someone a
broken thing passes). The codebase already encodes this asymmetry — 3.2 reuses it verbatim and only
lifts the categorical ban on LLM clears:

- **Provisional BARRIER → canary-eligible** under the existing `scoreBarriers` gate:
  `falseBarrierRate ≤ barrierThreshold` (default 10%) **and** `decisionCoverage ≥ coverageFloor`
  (default 50%, the H2 abstention guard).
- **Provisional CLEAR → canary-eligible** only under the **strict** clear gate: `scoreClears`
  `promotionEligible` (zero observed false clears, **zero unlabelled clears**) **and** the
  false-clear 95% upper bound is under target — i.e. `labelledClears ≥ requiredZeroEventN(target)`
  (149 for a 2% bound). Coverage floor still applies. This is materially harder than a barrier and
  much harder than a deterministic clear, by design.

The **only** code-policy change in `metrics.js` is to replace the hard-coded
*"a clear NEVER auto-promotes"* in `scoreMechanism` with a `clearCanaryEligible` flag computed from the
strict gate above. Deterministic clears still go straight to `authoritative` via their own path; this
new flag governs only the `canary`/PROVISIONAL tier.

> **Decision flagged (default chosen): provisional clears are ENABLED** per your "emit fail, pass,
> partial." The 149/zero-false-clear bar is the *production* guard; in **research mode (below) it is a
> measurement, not a gate** — clears flow ungated and the score rides along so you know how far to trust them.

## Research mode (the prototype default)

The full gold gate — 149-sample bounds, sealed eval, provenance hashes — is the right bar for a
*shipping* claim, but far too heavy to be a *blocker* on a research prototype: it keeps the whole
PROVISIONAL lane dark until a 149-case gold set exists per mechanism. So 3.2 ships with the gate
**inverted by default**, behind a single `opts.provisionalMode` switch:

- `provisionalMode: 'ungated'` **(default — prototype):** every mechanism that produced a `source:'llm'`
  (or instrument-adjudicated) verdict fills its auto-PARTIAL obligation as a PROVISIONAL row **without
  consulting the registry**. No per-mechanism promotion, no provenance refs, no `validateAuthority`
  burden — the registry path is bypassed for this lane (so we never fabricate fake `canary` entries).
  The gold scorer in `metrics.js` **still runs** and its per-mechanism numbers are **attached** to each
  row (`calibration: { falseClearRate, coverage, labelledN }` when gold exists, else `null`) —
  measurement, not gate.
- `provisionalMode: 'gated'` **(production):** the registry-driven path from the rest of this plan — a
  mechanism fills PROVISIONAL only at `canary`, earned through the gold gate.

**Channel provenance is preserved in BOTH modes — this is the thing you actually need.** Every
PROVISIONAL row is fully attributable to the channel that produced it, so any analysis can filter or
group by it:

- `source` — `'deterministic' | 'instrument' | 'llm'` (the evidence-source axis).
- `mechanism` — the exact producer: `'llm-agent'`, `'llm-rubric:<id>'`, an instrument detector
  (`'keyboard-trap'`, `'vsr-reading-order'`, …), or a catalog runner id.
- `confidence`, `rationaleRef` (→ the free-text basis in the side artifact), `evidenceRefs`
  (→ the instrument finding / VSR step / signal the verdict rested on).
- `calibration` — the per-mechanism gold numbers if any gold exists, else `null`.

So ungated never means anonymous: you always know *which channel said pass/fail and on what basis*.

What ungated mode is **not** — the floors that hold regardless (they're free, so we keep them):

1. **Never authoritative.** Ungated PROVISIONAL is still capped below CLAIM — never in the authoritative
   corpus, never sets `conformanceOutcome`, always `authoritative:false`. The one guard that protects a
   downstream reader, at zero cost.
2. **Honestly labelled.** Every ungated row carries `calibrated: false, mode: 'ungated'` — the numbers
   never *masquerade* as gold-validated; they're just un-gated, with their channel attached.
3. **Barrier-dominates-clear + structured-only + CLAIM-wins** all still hold (correctness, not calibration).

Honest caveat for any write-up: an **ungated provisional clear is an unvalidated LLM "pass"** — the
dangerous direction. You *get* the row plus its `calibration` block (if gold exists) and its channel; it
is on the analysis to weight it. Flip to `gated` for any result you want to stand behind as validated.

## Precedence & conflict

Per obligation, pick the highest available tier: **CLAIM ▸ PROVISIONAL ▸ PARTIAL**. Within PROVISIONAL,
when calibrated mechanisms disagree on a single obligation, **barrier dominates clear** (fail-closed
for safety): any calibrated `BARRIER_OBSERVED` blocks a provisional clear; the row is recorded as a
provisional barrier with the conflicting clear noted, never silently cleared. Two mechanisms that agree
collapse to one row (highest confidence wins the `mechanism` attribution; both are listed in `supportRefs`).

## Per-tier application

**D− barrier-only.** No new enumeration needed — the obligations already exist. When the runner finds a
barrier → CLAIM (unchanged). When it doesn't → the obligation is `autoPartial` and a calibrated LLM
`NO_BARRIER_OBSERVED`/`BARRIER_OBSERVED` fills it as PROVISIONAL. This is the headline win: it gives
`1.4.10`/`1.4.13`/`3.3.1`/`2.4.11` a (calibrated) *pass* signal for the first time, which deterministic
open-scope code can never soundly produce.

**I instrument-only.** The obligation is `autoPartial` (instruments don't reconcile). The instrument
*finding* becomes **evidence** the agent prompt embeds (`evidenceRefs`/`decisionCoverageRef`), so the
LLM adjudicates the instrument's signal into a disposition (e.g. "the VSR reading-order divergence at
this node is/ isn't a meaningful-sequence barrier"). Instrument findings remain on their own lane too —
unchanged, non-authoritative.

**○ data-collected-no-runner.** These have **no obligation today**, so step 1 is to *enumerate* one:
register the family in BOTH `applicability-oracle.FAMILIES` + the `familiesFor` branch AND the
independent `coverage-registry.SURFACES` (they must agree or `coverageErrors` fails the build):

| SC | Family (new) | Skill | Surface predicate (raw collector fact) |
|---|---|---|---|
| 2.5.8 | `target-size-minimum` | reflow-and-pointer-affordances | `el.box` present + interactive |
| 2.5.5 | `target-size-enhanced` (AAA) | reflow-and-pointer-affordances | same |
| 2.4.2 | `page-title` (page-level) | page-structure | `page.title` slot present |
| 2.5.3 | `label-in-name` | name-role-state | visible label text + accessible name both present |

Once enumerated, the obligation is `autoPartial` and the LLM fills it provisionally exactly as the
other tiers. **Note (graduation):** `2.5.8`/`2.4.2` should ultimately get a *deterministic* runner —
`evalTargetSize` is a finished pure function and the neighbor rects are already collected — at which
point the deterministic CLAIM supersedes the provisional row. The LLM provisional is the stopgap that
buys coverage now; registering the family is the shared prerequisite for both paths.

## LLM skill set: a v3.2 re-scope is required (not reuse)

The v1/v2 [`skills/*.md`](../../skills/) are **investigation procedures** for an agent that drove its
own tools — "`--eval` for `<label for>`", "confirm via `/ax-node`", "drive a submit and capture". In
v3.2 the LLM does **not** investigate: the collector + deterministic runners do, and the adjudicator
*injects* their measures (`precomputeSignals` reuses `a11y-eval` verbatim) plus the VSR transcript and
(below) vision. So the rubric's job flips from **"how to investigate and decide"** to **"judge meaning
over the evidence you're handed, and defer where a deterministic runner already decided."** Three
concrete changes, per rubric:

1. **Scope to the gap.** A v3.2 rubric covers only the **auto-PARTIAL residue** for its skill — the
   meaning/adequacy calls no runner can make (`1.1.1` alt adequacy, `2.4.4` link purpose, `3.3.3` error
   suggestion, `2.4.6` heading descriptiveness, `1.3.1` info-and-relationships) and the **clear
   direction** for the barrier-only SCs ("is this actually fine?"). Where a deterministic CLAIM exists,
   the rubric says *defer — do not re-litigate* (the builder already enforces this; `selectSubjects`
   only hands it `autoPartial` obligations). This removes the v1/v2 overlap where the LLM re-judged
   `1.4.3` contrast the runner now owns.
2. **Reframe as judge-over-evidence.** Replace the "run `--eval` / drive a submit" steps with "here are
   the precomputed signals + VSR + vision crops; weigh them." **Keep** the WCAG soundness caveats — the
   `3.3.1` "C2" note (*don't infer a failure from a missing `aria-invalid`*) is exactly the guidance
   that stops a false clear, and it's mechanism-agnostic.
3. **Atomize + version — mandatory.** Each judgment becomes a narrow `llm-rubric:<id>-v<n>` mechanism
   (the tests already use `llm-rubric:alt-text-adequacy-v0`). Because `authority.js` calibrates **per
   mechanism**, a reworded rubric is a *different* mechanism: a v1 rubric's gold calibration can never
   transfer to a v3.2 rewrite. The version tag is required and the rubric file's hash goes in the
   `promptHash` provenance slot (which already exists).

Net: the broad `skills/*.md` survive as the **`llm-agent` whole-obligation** rubric (re-scoped per the
above); the new **atomic `llm-rubric:*` set** is what becomes individually calibratable and feeds
PROVISIONAL. The WCAG knowledge carries over; the *procedures* are rewritten for the new division of labor.

## Vision evidence (per-skill, before/after where state matters)

Any judgment vision can improve must be **handed the pixels** — this matches how the gold itself is
produced (screenshot the state, read it, judge it). Today the lane is text-only; 3.2 makes vision a
first-class part of each rubric's evidence.

- **Each rubric declares its vision needs** — a `visionEvidence` enum: `element-crop`,
  `surrounding-region`, `state-before` / `state-after`, `viewport`, `viewport-320`. The adjudicator
  supplies exactly those, so a contrast judgment gets a crop, a reflow judgment gets the 320px viewport,
  a focus/hover/submit judgment gets the before/after pair.
- **Capture happens upstream, where the page lives.** Static crops come from the collector
  (`eval-page.js`); the **before/after** pairs come from `drive-page.js`, which already drives exactly
  the focus / hover / submit transitions we need — it just also screenshots them. The frames are threaded
  into the (still browser-free) `runAdjudication` via a `visionByXpath` map, **exactly** like
  `transcriptByXpath` today, so the adjudicator stays a pure function over its inputs.
- **The prompt goes multimodal.** `buildPrompt` → `buildMessages` returns text + image blocks;
  `runAgent(messages, subject)` is the injected multimodal adapter (default still **refuses**, so no run
  accidentally hits a paid vision API).
- **Images live in a side artifact, never in `results`.** Binary can't pass the strict text scanner, so
  crops go in an `llmVision` artifact (like `llmRationale`), referenced by opaque id in `evidenceRefs`.
  The structured ledger row stays text-only; the strict scanner is untouched.
- **Gold parity, not gold leakage.** The hand-annotator labels from the **same crops** (blinding is from
  the LLM's *verdict*, not its evidence — annotator and model see the same pixels; only the answer is hidden).

Per-skill vision map (the gap SCs each rubric judges):

| Skill (rubric) | Gap SCs | Vision evidence supplied |
|---|---|---|
| color-and-visual-text | 1.4.1, 1.4.5, 1.4.11 | `element-crop` + `surrounding-region` (color-only meaning, text-as-image, UI-component contrast) |
| focus-visibility | 2.4.7 (clear), 2.4.13 | `state-before`/`state-after` crop around the control (the ring) |
| reflow-and-pointer | 1.4.10, 2.5.8, 2.5.5 | `viewport-320` (overflow) + `element-crop` with neighbors (target spacing) |
| forms-instructions-errors | 3.3.1, 3.3.2, 3.3.3 | `state-before`/`state-after` of the field+error region across submit; field+label crop |
| dynamic-announcement | 4.1.3 | `state-before`/`state-after` crop of the region the action changed |
| name-role-state | 1.1.1, 2.4.4, 2.5.3 | `element-crop` (does the visual match the announced name; icon-only control?) |
| page-structure | 2.4.2, 2.4.6, 1.3.1 | `viewport` / region (visual heading hierarchy vs the semantic outline) |
| grouping-and-reading-order | 1.3.2, 2.4.3 | `viewport` (visual order vs DOM / VSR / tab order) |

Vision strengthens the *judgment*; it does **not** change the lane's standing — a vision-grounded LLM
verdict is still a non-authoritative PROVISIONAL row, channel-tagged and (in gated mode) gold-scored.

## Output schema changes (additive, back-compatible)

- `obligationLedger[]` rows gain `disposition: 'PROVISIONAL'` as a third value, plus
  `provisional: { source, mechanism, mode, calibrated, outcome, confidence, rationaleRef, evidenceRefs, calibration, conflict? }`
  — `source`/`mechanism` are the **channel** (always present); `mode` is `'ungated'|'gated'`; `calibrated`
  is `false` in research mode. Existing CLAIM/PARTIAL rows are byte-identical.
- `summary` gains `provisionalCleared`, `provisionalBarrier`, `provisionalByMechanism{}`. The
  authoritative `cleared` / `barriersObserved` counts stay **deterministic-only** (unchanged meaning).
- `elementSkillSummaries` gain `provisionallyCleared` / `provisionalBarrier` fields; the existing
  `cleared` (every child a deterministic clear) and `anyBarrier` (a deterministic CLAIM barrier) are
  untouched, so no consumer that reads authoritative aggregates sees drift (Rule 14 preserved).
- `adjudicationRecommendations` stays the derived review-queue view; a row whose mechanism reached
  canary now reports `promotedTo: 'PROVISIONAL'` instead of `eligibleForAuthority` only.

## Work items

| # | File | Change |
|---|---|---|
| 1 | `lib/v3-schema.js` | add `DISPOSITIONS = ['CLAIM','PROVISIONAL','PARTIAL']`; a `provisional()` constructor mirroring `claim()`/`partial()` (structured-only, `authoritative:false`). |
| 2 | `lib/authority.js` | give `canary` a return contract: `authorityFor` returns `{ state:'canary', mayPublish:false, mayProvision:true }`. Add `provisionFor(mechanism, direction)` — same readiness checks as a canary LLM promotion (`sealedEval`, `modelRef`, `promptHash`, `goldBlindedRef`), still capped at canary. |
| 3 | `lib/metrics.js` | replace the hard-coded "clear never auto-promotes" in `scoreMechanism` with `clearCanaryEligible` (strict gate: zero false + zero unlabelled clears + `labelledClears ≥ requiredZeroEventN(target)` + coverage floor). Add `provisionEligibility(mechanism)` returning per-direction canary verdicts. No change to the deterministic→authoritative path. |
| 4 | `lib/obligations.js` | `reconcile` accepts `kind:'PROVISIONAL'`; precedence CLAIM ▸ PROVISIONAL ▸ PARTIAL; barrier-dominates-clear conflict rule; `aggregateElementSkill` adds the two provisional fields without touching `cleared`/`anyBarrier`. |
| 5 | `lib/build-v3.js` | after reconciliation, for each `autoPartial` obligation look up the matching `source:'llm'` shadow obs by `(target, sc, family)` and emit a PROVISIONAL disposition into a SECOND reconciliation pass over the `autoPartial` subset only (no duplicate-disposition collision — §266 invariant preserved). `provisionalMode:'ungated'` (**default**): emit for any such obs, stamp `mode/source/mechanism/calibrated:false` + attached `calibration`, bypass the registry. `'gated'`: emit only if the mechanism `mayProvision` for that direction (+ strict clear gate). |
| 6 | `lib/applicability-oracle.js` + `lib/coverage-registry.js` | register the four ○-tier families in lockstep (oracle `FAMILIES` + `familiesFor` branch + coverage `SURFACES`); add page-level `page-title` enumeration beside the existing reflow page obligation. |
| 7 | `lib/catalog.js` | register the new families as known (validateCatalog cross-check) even before a deterministic runner exists, so the family set stays consistent (no runner entry yet for ○). |
| 8 | gold + `eval/gold/v3` | extend the blinded gold set to label the new families' obligations (H3 blinding); a mechanism cannot reach `canary`/PROVISIONAL on a tier with no labelled gold (the strict gate's `unlabelledClears===0` enforces this automatically). |
| 9 | new `lib/llm-rubrics/` + loader | author the **v3.2 atomic rubric set** (scoped to the gap, judge-over-evidence, versioned `…-v0`, declaring `visionEvidence` needs); a ~10-line loader reads `skills/*.md` + the atomic rubrics into `opts.llmRubrics`; pin each rubric's content hash into `promptHash` provenance. |
| 10 | `skills/*.md` | **re-scope** the broad skill rubrics for `llm-agent`: defer to the deterministic runner where a CLAIM exists; replace tool-driving procedures with judge-over-supplied-evidence; keep the WCAG soundness caveats. |
| 11 | `eval-page.js` + `drive-page.js` | **capture vision evidence** per the rubric declarations: static `element-crop`/`surrounding-region`/`viewport-320` from the collector; `state-before`/`state-after` pairs from the focus/hover/submit transitions the driver already performs. Emit a `visionByXpath` map keyed by (xpath, state). |
| 12 | `llm-adjudicator.js` | `buildPrompt`→`buildMessages` (multimodal text + image blocks); thread `visionByXpath`; store crops in a side `llmVision` artifact referenced by opaque `evidenceRefs`; `runAgent(messages, subject)` injected adapter (default **refuses**). |

## Invariants preserved (the red-team checklist)

1. **No false authority.** PROVISIONAL is `authoritative:false`, capped at canary, never in the
   authoritative corpus. The deterministic→authoritative path is byte-unchanged.
2. **Clears are the guarded direction.** In `gated` mode a provisional clear needs the zero-false-clear
   + 149-bound gate; a barrier needs only the ≤10% + coverage gate. In `ungated` mode both flow, but the
   measured rates ride along on each row (`calibration`) with the channel attached, and the
   never-authoritative cap still holds — so a false clear can mislead an *analysis*, never the corpus.
3. **No silent clearing.** A provisional row is created only where the obligation was `autoPartial`;
   it never overrides a deterministic CLAIM/shadow, and barrier-dominates-clear on conflict.
4. **No abstention inflation (H2).** Coverage floor gates both directions; INCONCLUSIVE produces no
   disposition, so a mechanism cannot manufacture precision by answering only easy cases.
5. **Gold-blinded + pinned (H3/H5).** In `gated` mode `provisionFor` requires `modelRef`/`promptHash`/
   `goldBlindedRef` — the same provenance a canary LLM promotion already requires in `validateAuthority`.
   `ungated` mode bypasses the registry, so it skips enforcement — the run still records the model +
   promptHash on the `llm` artifact for provenance, it just isn't *required*.
6. **Coverage can't silently shrink (Rule 16).** New ○ families land in the oracle AND the independent
   coverage registry together; a mismatch fails the build closed.
7. **One calibration gate (3.1 unify).** Every mechanism — deterministic, `llm-agent`, `llm-rubric:*` —
   still promotes only through `authority.js`. PROVISIONAL is the canary *rung* of that one ladder, not a
   parallel path.
8. **Structured-only output.** Ledger rows carry enums/refs; rationale stays in the side artifact. The
   strict scanner still refuses any legacy token in `results`.

## Phasing

1. **Schema + gate + rubrics (no browser):** items 1–4 + 7, plus the v3.2 rubric set + loader (9–10).
   Pure functions / static files, unit-testable with stub gold + a stub agent; proves the spine
   (authority state → disposition), the asymmetric clear gate, and that the real rubric (not the
   placeholder) drives the prompt.
2. **Wire the builder:** item 5. PROVISIONAL rows appear for D− and I tiers (their obligations already
   exist) the moment a mechanism is marked canary in the registry; until then, zero behavior change.
3. **○ enumeration + vision capture (browser):** item 6 (new families → auto-PARTIAL → fillable) and
   items 11–12 (capture before/after crops in the driver; multimodal prompt). Vision rides the existing
   browser stages — no new run, just screenshots on the transitions already driven.
4. **Gold + calibrate (only to LEAVE research mode):** item 8. In the default `ungated` mode, PROVISIONAL
   rows appear as soon as phase 2 lands — no gold required. This phase is what you do to *graduate* a
   mechanism: label, score per mechanism, promote the ones that clear their gate to canary, then run
   `provisionalMode: 'gated'` for a result you can stand behind.

Resting state depends on the mode. In `ungated` (prototype default) PROVISIONAL rows flow as soon as the
LLM lane runs — channel-tagged, `calibrated:false`, capped below CLAIM. In `gated` (production)
default-shadow is the resting state: with an unpromoted registry the lane is dark and the output is
identical to 3.1; PROVISIONAL appears only for a mechanism that earned canary on gold.

---

## Implementation status (2026-06-16)

**Built + adversarially hardened + green (v3 261, pure 190): the PROVISIONAL spine, items 1–7.**

- **1 `v3-schema.js`** — `DISPOSITIONS = ['CLAIM','PROVISIONAL','PARTIAL']`; `provisional()` constructor
  (structured-only, `authoritative:false`, coerces source/mechanism/refs).
- **2 `authority.js`** — `canary` now returns `mayProvision:true`; `provisionFor(mechanism, direction)`
  (canary + OWN LLM provenance: `sealedEval`/`modelRef`/`promptHash`/`goldBlindedRef`).
- **3 `metrics.js`** — `clearCanaryEligible` (strict: zero-false + zero-unlabelled + `labelledClears ≥
  requiredZeroEventN(0.02)=149` + coverage); `provisionEligibility`; barrier stays the lenient gate.
- **4 `obligations.js`** — `reconcile` gained the PROVISIONAL tier (fills ONLY obligations with no
  deterministic disposition — the duplicate-detection invariant is untouched; barrier-dominates-clear
  merge); `aggregateElementSkill` added `provisionallyCleared`/`provisionalBarrier` without touching
  the deterministic `cleared`/`anyBarrier`.
- **5 `build-v3.js`** — the LLM lane is processed BEFORE reconciliation; a §5b fill loop emits a
  PROVISIONAL disposition per qualifying obs (ungated default; gated requires the authority **and**
  metrics gate). `summary` gained `provisionalCleared`/`provisionalBarrier`/`provisionalByMechanism`;
  `adjudicationRecommendations` reports `promotedTo:'PROVISIONAL'`. The authoritative counts and the
  deterministic→ledger path are byte-unchanged when no LLM artifact is present.
- **6 `applicability-oracle.js` + `coverage-registry.js`** — the four ○-tier families
  (`target-size-minimum` 2.5.8, `target-size-enhanced` 2.5.5, `page-title` 2.4.2, `label-in-name` 2.5.3)
  registered in lockstep (identical predicates; proven equivalent across 8,316 element shapes). Strict
  raw-fact predicates so the minimal synthetic fixtures never trigger them.
- **7 `catalog.js`** — no change required: `validateCatalog` only constrains experiments, so families
  without a runner are consistent (verified by the green suite).

**Design deltas the implementation forced (each a correctness fix):**
- PROVISIONAL fills ONLY obligations with no deterministic disposition. The plan's "modify reconcile +
  second pass" reduce to this: an autoPartial slot has no competing row, so a CLAIM/PARTIAL is never
  overridden and the deterministic duplicate-detection is preserved (a forged duplicate still errors).
- The default switched to `ungated` per the plan; the one 3.1 test asserting "annotation-only / stays
  auto-PARTIAL" is now the `gated`-without-gold contract.

**Adversarial hardening (3 skeptics; all MED fixed + regression-tested):**
- Own-property provenance in `provisionFor`/`validateAuthority` — an inherited (prototype-chain)
  provenance ref no longer satisfies the gated gate (parity with the readiness discipline).
- `goldIndex` degrades on a `null`/non-object gold row instead of fail-crashing.
- `mergeProvisional` fails CLOSED (no row) on a non-decisive set instead of throwing (reconcile is a
  public entry point).
- The 149-bound / coverage floor are CLAMPED for the clear direction — `provisionOpts` can only make
  the clear gate stricter, never weaker.
- Plus LOW fixes: null-proto `provisionalByMechanism`; stale-conflict stripped in the merge;
  `oracleCorroborates` page-title branch; `observationScope.actionTargetRef` must equal `targetXpath`.
- Proven sound: never-authoritative floor, CLAIM-always-wins, ghost-verdict-dropped (no out-of-inventory
  refusal), no strict-scan leak via the provisional block, oracle↔coverage equivalence, and the
  asymmetry (barrier promotes at N=1; clear blocked until 149).

**The evidence-QUALITY + browser/data layer (items 8–12) — IMPLEMENTED (2026-06-16).** These improve
*how good* the LLM verdict is; the spine's soundness is unchanged. Adversarially hardened (2 skeptics: 2
HIGH + 3 MED/LOW fixed with regressions).
- **8 gold** (`lib/gold-loader.js`) — `loadGold()` flattens the per-mechanism gold files
  (`{mechanism, sc, labels[]}`) into the flat `[{xpath,sc,goldOutcome}]` array build-v3/metrics consume,
  and enforces the floor: only an **adjudicated** label gates (a draft is inert). Hardened against a
  `null`/primitive gold doc (degrades, never crashes). Worksheet rows added for the new families. The
  real labels are produced by the post-run blinded labelling pass (on hold) — this is the wiring.
- **9 rubrics + loader** (`lib/rubric-loader.js` + `scripts/v3/llm-rubrics/*.md`) — the atomic, versioned,
  gap-scoped `llm-rubric:<id>-v0` set (8 rubrics, each declaring its `visionEvidence`) + a loader that
  reads `skills/*.md` + the atomic set into `opts.llmRubrics`, PINNING each rubric's content hash (now
  binding the body AND `visionEvidence`/`sc`, so a reworded/re-scoped rubric is a different mechanism that
  can't inherit gold). Duplicate ids are deterministic (sorted, first-wins) + recorded.
- **10 skills re-scope** — every `skills/*.md` gained a v3.2 "division of labor" header: do NOT
  investigate/drive tools; JUDGE meaning over the handed evidence; DEFER where a deterministic CLAIM
  exists (the builder enforces this — `selectSubjects` hands only auto-PARTIAL obligations); keep the WCAG
  soundness caveats.
- **11 vision capture** (`lib/vision-capture.js`) — `captureVision(page, xpaths)` produces the
  `visionByXpath` map (element-crop / surrounding-region / viewport / viewport-320), probe-verified on
  real Chrome (tight vs padded crops; the 320px reflow render genuinely differs; viewport crops captured
  ONCE and shared; off-screen/edge/zero-size/hidden elements skipped without crashing; the viewport is
  ALWAYS restored — even under `defaultViewport:null`). `mergeVision` folds in drive-page's
  state-before/after pairs. The actual run-time frames are produced when the harness executes.
- **12 multimodal plumbing** (`llm-adjudicator.buildMessages` + the `runAdjudication` vision branch) —
  text + image blocks; the adjudicator supplies EXACTLY the rubric-declared frames the collector captured;
  crops live in a side `llmVision` artifact (base64 — content-bound by M5, NEVER in the strict-scanned
  results), referenced by opaque id in `evidenceRefs`; `runAgent(messages, subject)` stays injected
  (default refuses). Vision-frame ids are stable per subject, so a dropped verdict can never bind the
  wrong element's crop.

**Known caveat (by design, flagged for the re-run workflow):** the oracle now derives 2.5.8/2.5.5 for any
boxed interactive element, so a STALE pre-3.2 `collect.json` whose precomputed `applicableScs` omits them
trips the enumeration-drift check (fail-closed). Fresh runs are self-consistent (the candidate-generator
re-annotates from the same oracle); re-scoring old artifacts requires re-running the collector.
