# Harness 3.3 — reconciled implementation plan

**Status:** implementation-ready. Reconciles [HARNESS-3.3-PLAN.md](HARNESS-3.3-PLAN.md) against the
committed code at `23bc4c9`, after verifying every claim the plan makes about runner authority, the
contrast clear path, the axe integration, the identity gate, and the orchestrator/CLI wiring.

This document supersedes the *sequencing and conflict* sections of the original plan. The original plan's
analysis (workstream rationale, WCAG alignment, gold-run protocol) still stands; this file records what
changed once the plan met the code.

---

## 0. The master reconciliation — nothing is authoritative yet

The `AUTHORITY` registry ([authority.js:40-51](../../scripts/v3/lib/authority.js#L40-L51)) contains exactly
one mechanism — `focus-visual-retry` — and both directions are `shadow`. `authorityFor()` fail-closes every
other mechanism to `mayPublish:false` ([authority.js:60-62](../../scripts/v3/lib/authority.js#L60-L62)).

**Consequence:** every deterministic runner today — contrast (1.4.3), keyboard-trap (2.1.2), form-error
(3.3.1), field-label (3.3.2), all of them — lands in `shadowObs`, never as a published CLAIM.
`summary.authoritative` is `0` on every page in the current build.

This resolves the original plan's central tension. The plan alternately calls A1/A2/A3 "false-clears" and
"not authoritative-verdict bugs." **Both are true:** they are false-clears in the *shadow record that seeds
gold*, never in a published verdict. 3.3 is therefore — correctly — a **shadow-evidence-quality release**.
The harm each A-item prevents is bad gold-annotation input and misplaced human trust, not a wrong published
claim. Authoritative promotion is a *separate, later* step (post-gold, via the `AUTHORITY` registry + the
metrics gate in `metrics.js`).

Read every item below as "fix the shadow row a human will hand-label," not "fix a published claim."

---

## 1. Conflicts reconciled

| # | Conflict in the plan | Resolution |
|---|---|---|
| C1 | **A1 residual vs. exit gate.** Exit gate forbids "any known reproduced false clear in a clearable runner," but A1 ships a residual under `range ≤ 12`. The clear uses the CSS-resolved ratio `a.ratio` ([exp-runners.js:283-285](../../scripts/v3/lib/exp-runners.js#L283-L285)) gated only by a `±16`/channel mean tolerance ([exp-runners.js:272](../../scripts/v3/lib/exp-runners.js#L272)). | **Compute the ratio against the worst-case backdrop extreme** in the contrast-reducing direction, using the **5th-percentile** backdrop luminance (not CSS `bgColor`, not the mean). `analyzeBackdrop` already has the per-channel sample; return a percentile instead of/alongside the mean. Dissolves both the `±16` tolerance hole and the worst-pixel residual → exit gate is honest with **no asterisk**. Antialiased glyph edges are already excluded from the backdrop sample (sentinel-delta > 40, [exp-runners.js:221-222](../../scripts/v3/lib/exp-runners.js#L221-L222)); the 5th percentile rejects 1–2 stray survivors. **[Decision A: worst-percentile.]** |
| C2 | **A5 ambivalence.** "Replace or quarantine" the gross-jump rule ([order-check.js:64](../../scripts/v3/lib/order-check.js#L64)), while J.1/J.2 admits the replacement (`delta≥1`/BAGEL) is *equally* ungrounded and geometry can't decide cross-column order. | **Quarantine, don't replace.** Force `review:true` + `calibrated:false` on every order finding; guarantee the builder never reads *absence of an order finding* as a 1.3.2/2.4.3 pass. Merges A5 into E (both → triage-only). No new threshold investment. |
| C3 | **A4 doesn't close B3.** A4's actions omit the insertion-only blindness it cites; the status instrument only watches `addedNodes`/`characterData` ([status-detector.js:79-83](../../scripts/v3/lib/status-detector.js#L79-L83)), blind to `hidden`/`display` toggles. | **Expose, don't fix, in 3.3.** Emit `coverageMode:'insertion-only'` on the status finding so humans know toggle-reveal status is unevaluated. **[Decision C: expose-limitation.]** Defer attribute-mutation observation past 3.3. |
| C4 | **F "2.5.8 may decide passes" vs. "not a new-automation release."** "Decide passes" reads authoritative. | **Shadow only.** Build the geometry runner but leave it non-authoritative (no `AUTHORITY` entry), scored against gold. Geometry-pass (≥24px / sufficient spacing) → shadow clear (exceptions only ever help a clear); geometry-fail → barrier-candidate to LLM/human for the exception check. Promotion is a post-corpus decision. **[Decision B: shadow-only.]** |
| C5/C6 | **Multi-signal collision + does axe/IBM revive the tie-break?** 2.5.3 gets three signals (det string pre-check + IBM + rubric); axe/IBM overlap several SCs. | See §2 (consolidation model). Short form: axe/IBM/det-precheck **never enter the obligation ledger**, so `reconcile()`'s duplicate-detection ([obligations.js:24-83](../../scripts/v3/lib/obligations.js#L24-L83)) never fires on them. They union as evidence on side artifacts; **zero new tie-breaks.** |
| C7 | **IBM CDN fetch vs. B reproducibility.** IBM pulls its rulepack from `cdn.jsdelivr.net` at runtime; B requires identity-bound, replayable artifacts. | Vendor + pin (version+hash) + **cache locally**; stamp `rulesetVersion`/`rulesetHash` into `checkerFindings.json`; emit `checkerUnavailable` rather than a degraded result if the bundle can't resolve. **Must be settled before the corpus run.** |
| C8 | **A2 darkens 3.3.1 before D feeds it.** A2 makes the 3.3.1 runner abstain; D supplies the form-submit vision the rubric needs. Between them 3.3.1 produces nothing. | **Co-validate A2 + D**, or gate the corpus run on both green. Reordered below so D lands with A2, not three steps later. |

---

## 2. Consolidation model (the answer to "how do multiple signals combine without a tie-break")

The 3.2 partition stops the two **LLM producers** co-firing on one obligation. axe, IBM, and the new
deterministic pre-checks do **not** threaten it, on one invariant:

> **They never enter the obligation ledger.** `reconcile()` only tie-breaks on *two deterministic
> dispositions for one obligation*. axe/IBM/string-precheck are cross-signals, not dispositions — they emit
> into **side artifacts** (`checkerFindings.json`, `triageCandidates.json`) with `authoritative:false`,
> exactly like `instrumentFindings`.

Multi-signal SCs therefore **accumulate evidence rather than adjudicate it.** One candidate per `(xpath, SC)`
carries a `signals[]` union and an `agreement` count (det-precheck + IBM + axe + rubric). No winner is
picked because none is authoritative; agreement just raises review priority and drives the §G "label all
hard findings" sampling. **For non-authoritative cross-signals: union the evidence, count agreement; never
consolidate to a verdict.** Tie-breaks live only in the authoritative ledger, which these never touch.

Mechanically this needs:
- `'axe'` and `'checker'` added to `EVIDENCE_SOURCES` ([v3-schema.js:16](../../scripts/v3/lib/v3-schema.js#L16)).
- `['instruments',…]`, `['checkerFindings',…]`, `['triageCandidates',…]` added to the identity gate's
  `arts` list ([cross-artifact.js:71-83](../../scripts/v3/lib/cross-artifact.js#L71-L83)) — which today
  gates LLM artifacts but **not even `instruments`** (a gap B closes).
- new summary buckets parallel to `instrumentFindings` ([build-v3.js:393-412](../../scripts/v3/lib/build-v3.js#L393-L412)).

---

## 3. Build sequence (five stages, by dependency + risk)

The corpus run over the 56 saved pages stays **inert / on-hold** through every stage. No stage auto-triggers
it. (`V3_LLM=1` + key gates the LLM lane; the corpus run is a separate, manual, paid step.)

### Stage 0 — C0 axe surfacing (free, lowest risk, first)
- Read `collect.axe` ([eval-page.js:203-218](../../scripts/eval-page.js#L203-L218)); map WCAG tag → SC with
  the existing regex (`/^wcag(\d)(\d)(\d+)$/`, reuse from
  [build-results.js:61-69](../../scripts/tools/build-results.js#L61-L69)); filter to the allow-list
  **1.3.5, 1.3.1, 1.4.4, 2.4.4, 3.1.x**; emit `checkerFindings[]` with `source:'axe'`,
  `authoritative:false`, `shadow:true`.
- Wire: source enum + identity gate + summary `checkerFindings` bucket.
- **Edge cases:** `axeRan===true` must gate (missing sentinel = "did not run" → fail-closed, do not emit
  "axe clean"); one violation may carry several WCAG tags (fan out to multiple SCs); axe flags far more than
  the five — surface **only** the allow-list, drop the rest (they are not decided coverage we're claiming);
  `collect.axe` may be absent on older artifacts (treat as not-run, not as zero findings).

### Stage 1 — B (identity + CLI visibility) before any new producer
- Add `['instruments',…]` + `['checkerFindings',…]` (+ `['triageCandidates',…]`) to the identity gate.
- CLI ([run-evaluation.js:33-58](../../scripts/v3/tools/run-evaluation.js#L33-L58)): add `V3_INSTRUMENTS`
  env, pass `runInstruments`, write `instruments.json`.
- Add an `evidenceMode` block to `summary` exposing `provisionalMode / runLlm / runInstruments / checkers`.
- Rationale: B first ⇒ every later artifact is born identity-bound and CLI-visible.

### Stage 2 — A1, A3, A2+D (reproduced shadow inaccuracies)
- **A1:** 5th-percentile worst-case backdrop ratio (Decision A). Tests: regress the white-on-SVG / body-gray
  false clear; add solid, large-text, gradient, antialiasing, mixed-color cases.
- **A3:** extract `kbd-graph`'s `TRAP_REGION_SEL` ([kbd-graph.js:83](../../scripts/v3/lib/kbd-graph.js#L83))
  + focusable-derived budget ([kbd-graph.js:169](../../scripts/v3/lib/kbd-graph.js#L169)) into a shared
  constant and use it in the runner ([exp-runners.js:733,749](../../scripts/v3/lib/exp-runners.js#L733)).
  *Edge case:* runner + kbd-graph both emit 2.1.2 signals in different lanes, both shadow → no collision.
  Tests: role-less `.modal` trap, role=dialog trap, APG modal with Escape, 13+ focusable clear, advised exit.
- **A2 + D (co-validated, per C8):** A2 — fix the `ERR_TEXT`-wins-over-`OK_TEXT` hole
  ([exp-runners.js:459-460](../../scripts/v3/lib/exp-runners.js#L459-L460)); demote red/keyword/class from
  *proof* to weak priors; newly-surfaced field-associated message → INCONCLUSIVE unless association/text is
  mechanically sufficient. D — add a `submit` transition to `STATE_TRANSITIONS` in vision-capture.js and an
  invalid-submit state-pair driver (submitted field, surrounding form, error-summary region, referenced
  description/error nodes, focus target, validation message, validity state, visible-text delta), isolated
  per field/form. Update `error-identification-v0.md` / `error-suggestion-v0.md` to treat color/class/English
  as weak priors and support non-English text. Tests: localized ES/DE/JA conforming messages must not
  barrier; color-only echo must not clear; "Thank you — please enter a valid email" must not clear.

### Stage 3 — A4, A5, E, F (instrument cleanup + triage-only candidates)
- **A4:** `coverageMode:'insertion-only'` (Decision C) + widen safe triggers beyond buttons + report
  `coverageTruncated` / `unprobedTriggers` ([status-detector.js:24,55-58](../../scripts/v3/lib/status-detector.js#L24)).
- **A5:** quarantine (C2) — `review:true` + `calibrated:false`; no absence-as-pass.
- **E:** `triageCandidates.json` (side artifact, **not** ledger) for 1.4.1 / 1.3.3 + instrument adjudication
  candidates for 1.3.2 / 2.4.3 / 4.1.3.
- **F:** 2.5.8 **shadow** geometry runner (Decision B) using existing 24px circle/spacing geometry; 2.5.3
  deterministic string pre-check (normalized visible label ⊄ accessible name → non-authoritative hard
  signal) feeding the 2.5.3 `signals[]` union.

### Stage 4 — C1 IBM (last: highest integration cost + network risk), then pilot
- Vendor + pin + cache the engine/ruleset (C7); add a `checkerFindings` producer stage.
- Normalize: `VIOLATION && FAIL` → hard finding; `POTENTIAL`/`MANUAL` → review prior only.
- Feed **only**: 1.4.12 + 2.5.3 hard evidence; 1.4.1 / 1.3.3 triage priors. **Not** 1.3.1 / 1.3.5 / 2.4.6
  (axe owns the first two; no tool decides 2.4.6).
- Pilot on 5–10 saved pages; inspect PARTIAL/PROVISIONAL/checker volumes and label burden **before** the
  full 56-page corpus run.

---

## 4. Decisions recorded

- **A — 1.4.3 worst-case:** 5th-percentile backdrop luminance in the contrast-reducing direction.
- **B — 2.5.8 tier:** shadow only in 3.3; promotion is a post-corpus decision.
- **C — A4/B3 scope:** expose `coverageMode:'insertion-only'`; defer the attribute-mutation fix.

---

## 5. Verified ground-truth index (so the next session doesn't re-derive it)

| Fact | Location |
|---|---|
| Dispositions CLAIM/PROVISIONAL/PARTIAL | [v3-schema.js:71-74](../../scripts/v3/lib/v3-schema.js#L71-L74) |
| Sources `deterministic/instrument/llm` | [v3-schema.js:16](../../scripts/v3/lib/v3-schema.js#L16) |
| AUTHORITY registry (only focus-visual-retry, both shadow) | [authority.js:40-51](../../scripts/v3/lib/authority.js#L40-L51) |
| `authorityFor` default-shadow fail-closed | [authority.js:60-62](../../scripts/v3/lib/authority.js#L60-L62) |
| Identity gate (ID_FIELDS + arts; no instruments/checker) | [cross-artifact.js:61-83](../../scripts/v3/lib/cross-artifact.js#L61-L83) |
| Summary assembly | [build-v3.js:393-412](../../scripts/v3/lib/build-v3.js#L393-L412) |
| Instrument findings normalize | [build-v3.js:358-371](../../scripts/v3/lib/build-v3.js#L358-L371) |
| Obligation reconcile / tie-break | [obligations.js:24-83](../../scripts/v3/lib/obligations.js#L24-L83) |
| 1.4.3 contrast: backdrop analyze + clear path | [exp-runners.js:212-291](../../scripts/v3/lib/exp-runners.js#L212-L291) |
| 2.1.2 runner (role-only sel, budget 12) | [exp-runners.js:720-810](../../scripts/v3/lib/exp-runners.js#L720-L810) |
| kbd-graph (broad sel, focusable budget) | [kbd-graph.js:83,169](../../scripts/v3/lib/kbd-graph.js#L83) |
| 3.3.1 form-error heuristics + B4 hole | [exp-runners.js:362-465](../../scripts/v3/lib/exp-runners.js#L362-L465) |
| 4.1.3 status (insertion-only, 12 triggers) | [status-detector.js:23-111](../../scripts/v3/lib/status-detector.js#L23-L111) |
| 1.3.2/2.4.3 order (gross-jump) | [order-check.js:33-76](../../scripts/v3/lib/order-check.js#L33-L76) |
| 3.3.2 field-label (barrier-only) | [exp-runners.js:296-341](../../scripts/v3/lib/exp-runners.js#L296-L341) |
| axe capture | [eval-page.js:203-218](../../scripts/eval-page.js#L203-L218) |
| axe consumed only by legacy build-results | [build-results.js:61-69](../../scripts/tools/build-results.js#L61-L69) |
| Orchestrator instruments + LLM stages | [orchestrator.js:47-116](../../scripts/v3/lib/orchestrator.js#L47-L116) |
| CLI artifact writes + env flags | [run-evaluation.js:33-58](../../scripts/v3/tools/run-evaluation.js#L33-L58) |
