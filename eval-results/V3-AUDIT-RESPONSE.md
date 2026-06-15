# Harness 3.0 — Response to the First-Pass Independent Audit

This is the builder's remediation record for [V3-FIRST-PASS-INDEPENDENT-AUDIT.md](V3-FIRST-PASS-INDEPENDENT-AUDIT.md).
Every Critical and High finding is addressed in code with a regression test that reproduces the
audit's probe and asserts it is now closed. The audit's central judgment is accepted: the first pass
was a walking skeleton, not a safe publication architecture. The conclusion that the remaining
experiments were "template-fill" was wrong — the holes were **shared architectural controls**, and
they are now fixed at the contract layer before any further experiments are built.

## Root-cause framing

The 13 Critical/High findings collapse to four root causes, fixed as shared controls:

| Root cause | Generated findings | Fix |
|---|---|---|
| **A. Identity was never canonical or bound across artifacts** | C1, C5, H3, H5, support-refs | Atomic `(xpath, sc, claim-family)` obligation identity + evidence binding on `(claimId, experimentId, SC, target, scope)` + duplicate/conflict rejection |
| **B. "Independent" enumeration read a generated field** | C3 | A separate applicability **oracle** derives obligations from raw facts; fail-closed on zero-obligation/drift |
| **C. Measurement was re-implemented weakly and self-certified** | C4, H4 | Real pixel/spatial verdict + border + alpha awareness; completeness no longer self-asserted |
| **D. The publication boundary was porous** | C2, H1, H2, H6, H7, H8 | Default-**shadow** authority promotion; strict per-stage schemas; full reconciled bundle; scoped legacy scan |

The keystone is **D/C2**: authority defaults to *shadow*, so even a slipped binding bug cannot enter
the authoritative corpus. `focus-visual-retry` now publishes **nothing** authoritative (both
directions shadow) until its gold + sealed-set + measurement readiness gates pass.

## Finding-by-finding

### Critical
- **V3-C1 (evidence not bound to SC/target/scope).** [`claims.js`](../scripts/v3/lib/claims.js) now refuses any proposal whose cited experiment does not measure its exact SC and claim-family. [`build-v3.js`](../scripts/v3/lib/build-v3.js) links evidence only when `(experimentId, sc, targetXpath, observationScope)` all match the proposal; any mismatch ⇒ unbound ⇒ PARTIAL. Tests: `adversarial.test.js` *cross-target* and *cross-SC* probes.
- **V3-C2 (shadow/authority not enforced).** New [`authority.js`](../scripts/v3/lib/authority.js): per-`(experiment, direction)` promotion, default shadow, fail-closed on unmet readiness. The builder demotes every gate-passing-but-unpromoted claim to a recorded `shadowObservation`. Tests: `adversarial.test.js` *V3-C2 default-shadow* and *unmet-readiness*, `foundation.test.js` shadow-vs-promoted.
- **V3-C3 (ledger not independently enumerated).** New [`applicability-oracle.js`](../scripts/v3/lib/applicability-oracle.js) derives obligations from raw collector facts, never from `applicableScs`. Non-empty evaluable page with zero obligations, or any `applicableScs` that disagrees with the oracle, **fails closed**. Tests: `obligations.test.js` independence/fail-closed/drift; `adversarial.test.js` V3-C3.
- **V3-C4 (false-clear / false-barrier measurement).** [`run-experiments.js`](../scripts/v3/lib/run-experiments.js) now judges focus-dependence from a real element-clip **pixel/spatial** diff (the validated R2 technique) and an **alpha-aware** computed read that includes **borders**. A transparent shadow ⇒ no pixels ⇒ not obviously visible (no false clear); a focus-dependent red border ⇒ pixels change ⇒ not a stable absence (no false barrier). New fixture `assets/saved/fx-v3-focus-adversarial.html`. Tests: `adversarial.test.js` real-Chrome V3-C4 probes (both pass on live Chrome).
- **V3-C5 (element×SC not atomic).** Obligation identity is now `(xpath, sc, claim-family)`; skill aggregation is **family-aware** (`focus-indicator-visible` maps only to focus-visibility, not focus-management). Tests: `obligations.test.js` enumeration + family-aware aggregation.

### High
- **V3-H1 (incomplete bundle).** The orchestrator now assembles and the gate now reconciles the complete bundle (collect, drive, candidates, plan, experiments, proposals). [`bundle-loader.js`](../scripts/v3/lib/bundle-loader.js) loads candidates+plan; [`cross-artifact.js`](../scripts/v3/lib/cross-artifact.js) identity-checks them.
- **V3-H2 (no strict schema).** New [`schemas.js`](../scripts/v3/lib/schemas.js): required fields, enums, non-empty constraints, unknown-key rejection on harness-authored records, unknown-stage rejection, and a `catalogVersion` drift check. Tests: `adversarial.test.js` unknown-stage / unknown-field.
- **V3-H3 (agent plan can retarget/re-SC).** [`scheduler.js`](../scripts/v3/lib/scheduler.js) `mergeAgentPlan` now requires exact candidate identity (target+SC), an experiment in the candidate's `allowedExperiments`, AND that the experiment measures the candidate's SC. The malformed "2.1.2 candidate using focus-visual-retry" test was corrected. Tests: `scheduling.test.js` retarget/re-SC/unknown.
- **V3-H4 (self-attested applicability/completeness).** `modeCompletenessProven` is computed from "simple single-mode control" (role/tag), not a bare `reached`. Completeness reads genuinely-measured pixel facts.
- **V3-H5 (order-dependent duplicate evidence).** Two results sharing a `claimId` are a conflict ⇒ unbound ⇒ PARTIAL, independent of order. Test: `adversarial.test.js` V3-H5 both orders.
- **V3-H6 (experiments disappear silently).** The runner emits explicit `unrun` records (skipped/failed/deferred); the gate reconciles every plan request to exactly one result-or-unrun and every candidate to a scheduling disposition. Deduped candidates are escalated, not dropped.
- **V3-H7 (legacy scan hits page content).** The scan now matches legacy tokens only in **schema positions** (object keys, or values of verdict-bearing fields). A collected accessible name `"N/A"` passes; a `legacyVerdict` value does not. Test: `adversarial.test.js` V3-H7.
- **V3-H8 (gold is scaffolding).** Shadow is now the *enforced* gate: a mechanism cannot be promoted without `goldSized`/`sealedEval`/`independentRaters`/`measurementValidated`. `scoreClears` scores shadow would-be clears against gold. The full selective-classification matrix / difficulty strata / cluster uncertainty remain future work (see *Remaining* below) — but the publication gate they protect is now real.

### Medium
Addressed: Chrome path via `PUPPETEER_EXECUTABLE_PATH`/`CHROME_PATH`; richer `environment`
(`headless-chromium/<version>/<platform>`); `hydrationReady` now also awaits `fonts.ready` + a paint
settle; results no longer blanket-marked `trusted`/`isolated` (a `valid` flag reflects measurement
validity); support refs derived from the bound experiment only.

## Remaining (honestly scoped, not "template-fill")
- Full gold benchmark machinery beyond the shadow gate: selective-classification matrix, failure
  recall, difficulty strata, cluster-aware uncertainty, sealed-set promotion runs, independent rater
  provenance for real labels. The *gate* exists; the *evaluation depth* does not yet.
- `hydrationReady` is a settle heuristic, not a true under-hydration detector.
- `pageDigest` is still self-asserted (not recomputed from the served bytes).
- The other eight experiments (C1/C3–C9), the Level-3 LLM planner, and the semantic judgment skills
  are unbuilt — and now correctly blocked behind the corrected shared contracts.

## Verification
- `59/59` v3 tests pass (was 43), including `6` real-Chrome tests: the original fixture trio plus the
  new transparent-shadow and red-border adversarial measurement probes.
- `139/139` existing pure tests pass; no v2/browser code was modified.
- CLI end-to-end on real Chrome: `0 authoritative, 3 shadow, 9 auto-PARTIAL` over 12 obligations;
  replay over the emitted bundle is byte-identical.
