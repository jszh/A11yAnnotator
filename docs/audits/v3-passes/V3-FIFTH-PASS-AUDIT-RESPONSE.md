# Harness 3.0 — Response to the Fifth-Pass Independent Audit

**Audited commit:** `6dba0e55170a6d418590cfde5e4228534193b8d8` (the working tree, unchanged from the audit)
**Audit reviewed:** `eval-results/V3-FIFTH-PASS-INDEPENDENT-AUDIT.md`

All eight findings (2 Critical, 3 High, 3 Medium) were root-caused against the live code and fixed
tool-side, each pinned by a regression test. Every fix was adversarially re-checked; two of the
auditor's suggested fix directions were corrected after empirical verification (noted below).

## Test status

| Suite | Original audit | + Response-audit (R5R) |
|---|---|---|
| Pure (`unit`/`result`/`docs`/`meta`) | 139/139 | **139/139** |
| v3 (`scripts/v3/tests/*.test.js`) | 172/173 (R2-F1 flaky-fail) → 179/179 | **182/182** |
| Regressions (`fifth-pass.test.js`) | 6/6 | **9/9** |

> **Addendum (2026-06-15):** a follow-up audit of this response
> (`V3-FIFTH-PASS-RESPONSE-INDEPENDENT-AUDIT.md`) confirmed the green suite and found two High
> incompletenesses in the C2 and H1 fixes above, plus two minor items — all now addressed. See
> **"Addendum: response-audit (R5R-*)"** at the end.

The one previously-failing test (`R2-F1`) was **flaky, not deterministically broken** — it *passed*
in this environment and *failed* in the auditor's, because the guard depended on screenshot timing.
After the H2 fix it passes deterministically (verified by 5 consecutive isolated runs).

## Findings, root causes, fixes

### V3R5-C1 (Critical) — Production replay could not verify its own manifest
**Root cause.** The orchestrator builds an `applicability` artifact and the manifest hashes it
(`manifest.js` `HASHED_STAGES`), but `run-evaluation.js` never wrote `applicability.json` and
`bundle-loader.js` never declared/loaded it. On replay the manifest hashed a stage the reloaded
bundle lacked → `verifyManifest` returned `integrityBroken: manifest hashes an absent stage
"applicability"`.
**Fix.** `bundle-loader.js`: `applicability` added to `STAGE_FILES`, `PRODUCTION_REQUIRED`, and the
default `optional` list; `run-evaluation.js` writes `applicability.json`. Verified end-to-end
(orchestrate → write → load → `verifyManifest` clean).
**Coupled with the judgments fix (M3).** `judgments` was *also* in `HASHED_STAGES` but is produced by
the builder *after* the orchestrator finalizes the manifest, so persisting+reloading it would
reintroduce the same "absent/extra hashed stage" break the moment any judgments existed. It is now
**removed from `HASHED_STAGES`** (it rides as an optional, non-integrity-bound stage), closing the
latent hazard the C1 verifier flagged.

### V3R5-C2 (Critical) — Independent applicability was optional for authoritative publication
**Root cause.** `build-v3.js` only ran the independent-observer agreement check when
`bundle.applicability != null`. A signed, promoted, complete bundle with **no** applicability stage
skipped the check and published `authoritative`. (Rule 15: applicability cannot self-attest.)
**Fix.** Authoritative publication now also requires `bundle.applicability != null`. Per-target
observer *agreement* was already enforced at bind time (a missing/disagreeing observation makes the
claim PARTIAL before the gate), so requiring **presence** at the gate closes the absent-stage hole
while still recording the claim as a shadow observation. The `withPipeline` test helper now ships a
corroborating applicability stage; a new test proves a resealed bundle with the stage **deleted**
cannot publish authoritative.

### V3R5-H1 (High) — Obligation enumeration was incompatible with the real collector shape
**Root cause.** The oracle and the (independently-authored) coverage registry read `el.hasText` and
`el.role`, but the real collector (`scripts/eval-page.js`) emits `text` (string) and `roleAttr`.
Because *both* readers used the same absent names, they agreed on "nothing" and the cross-check
passed vacuously — silently under-enumerating text-contrast and name-role-value obligations on real
artifacts (~24 families/page where ~46 were due).
**Fix.** Added a shared collector-field contract — `factHasText(el)` / `factRole(el)` — in the oracle,
used by `isEvaluable`/`familiesFor`/`applicableScsFor` and imported by the coverage registry. The
family **logic** stays independently declared (the drift cross-check is preserved); only the
field-extraction **contract** is shared and explicit. `focusable` and `isFormField` already matched
the collector, so they were left as-is. Regression test enumerates the recovered families from a
real-shaped element.

### V3R5-H2 (High) — Focus-animation guard was flaky
**Root cause.** Stability was inferred from two unfocused screenshots taken ~120 ms apart; for an
animated element this samples one phase of the cycle and is timing-dependent, so `stableUnfocused`
flipped between runs (the auditor saw it fail; this environment saw it pass).
**Fix.** `readIndicator` now reports `hasActiveAnimations`, computed **deterministically** from
animation *state* (`getAnimations({subtree:true})` running animations + computed `animationName`, on
the target, its subtree, and its ancestors) rather than sampled pixels. When an animation is running
the stability check **fails closed to unstable** (→ INCONCLUSIVE), with null-safety so a failed
indicator read is never treated as "stable" (the regression the verifier flagged). `R2-F1` now passes
5/5 consecutive runs.
*Note:* the auditor also suggested broadening to ancestor inspection — done (the ancestor walk is
included), so the guard is not limited to the target element.

### V3R5-H3 (High) — 3.3.1 form-error experiment was inoperable under its own AT gate
**Root cause.** The catalog marked `form-error-probe`'s `BARRIER_OBSERVED` direction AT-dependent, so
the claim resolver demanded an `atBaseline` the runner never emits → every barrier resolved PARTIAL.
**Fix (soundness-checked).** The runner's barrier is `errorNotIdentified` = *no* error surface of any
channel appeared after an invalid submit (no native validation block, no visible error text/styling,
no live region — `exp-runners.js probeFormError`). "No error conveyed to **anyone**" is
AT-independent, so the barrier direction is reclassified `accessibilitySupportDependent:
{ BARRIER_OBSERVED: false }`, mirroring `field-label-probe`. A *clear* would still be AT-dependent,
but this runner is barrier-only and never clears.
**Auditor correction.** The audit's adversarial reviewer asked to *also* remove `3.3.1` from
`registry.js` `AT_DEPENDENT_CLEAR`. Empirically this is **unnecessary and would be wrong**:
`3.3.1/BARRIER_OBSERVED` has no registry entry (the registry only builds clearing-direction entries),
so the registry branch in `claims.js` contributes nothing to the barrier's AT-dependence — only the
catalog does. And `AT_DEPENDENT_CLEAR` correctly governs *clears*, which should stay AT-dependent if
ever built. Verified directly: after the catalog change alone, the barrier resolves to a definite
`BARRIER_OBSERVED` with no baseline.

### V3R5-M1 (Medium) — Manifest signed a *copied* page digest
**Root cause.** The orchestrator passed `observedPageDigest: collect.pageDigest` — the collector's own
claim — so the manifest's "observed page identity" was not independently observed.
**Fix.** `manifest.deriveObservedPageDigest(experiments)` returns the single digest all signed
per-result attestations agree on (null on absence/disagreement — fail closed). The orchestrator uses
it for signed runs (`attestationKey ? derive : collect.pageDigest`). `buildManifest`'s
`observedPageDigest` parameter is now **undefined-distinguishing**: omitted ⇒ back-compat fallback to
the collector digest; passed (including `null`) ⇒ honored verbatim — so a derived `null` cannot
silently fall back to the collector's unattested claim (the security regression the verifier flagged).
The existing `verifyManifest` identity gate (`observedPageDigest === collect.pageDigest`) then refuses
any manifest whose independent observation disagrees with the collector — confirmed live (a run whose
runner observed a different page than the collector claimed is now refused).

### V3R5-M2 (Medium) — Level-3 planner exists but production never creates Level-3 work
**Assessment:** the audit itself frames this as "fine as a safe scaffold, not yet the Phase-2
feature" — a deferred feature, not a defect. **Fix = explicit deferral.** `candidate-generator.js`
now documents the Phase-2 gap and exposes the `selectionLevel` seam on the `add()` helper (default 1)
so Phase 2 can emit Level-3 candidates without re-plumbing. No behavior change: production remains
all-Level-1, as designed.

### V3R5-M3 (Medium) — Bundle loader did not know about `judgments.json`
**Root cause.** `build-v3.js` processes `bundle.judgments`, but the loader never declared the stage,
so the replay/CLI contract couldn't carry it.
**Fix.** `judgments` added to `STAGE_FILES` and the default `optional` list (kept **out** of
`PRODUCTION_REQUIRED` — it is non-authoritative), and removed from `HASHED_STAGES` (see C1) so a
present judgments stage never breaks manifest verification. Phase 0 still writes none; an absent
judgments stage deterministically yields `adjudicationRecommendations: []`.

## Files changed

- `scripts/v3/lib/bundle-loader.js` — applicability + judgments stages; production-required applicability (C1, M3)
- `scripts/v3/lib/manifest.js` — drop `judgments` from `HASHED_STAGES`; `deriveObservedPageDigest`; undefined-distinguishing `observedPageDigest` (C1, M1, M3)
- `scripts/v3/lib/orchestrator.js` — derive the manifest's observed identity for signed runs (M1)
- `scripts/v3/lib/build-v3.js` — mandatory applicability stage for authoritative publication (C2)
- `scripts/v3/lib/applicability-oracle.js` — `factHasText`/`factRole` collector-field accessors (H1)
- `scripts/v3/lib/coverage-registry.js` — read the shared collector-field contract (H1)
- `scripts/v3/lib/run-experiments.js` — deterministic animation guard + null-safety (H2)
- `scripts/v3/lib/catalog.js` — `form-error-probe` barrier is AT-independent (H3)
- `scripts/v3/lib/candidate-generator.js` — document the Level-3 deferral + `selectionLevel` seam (M2)
- `scripts/v3/tools/run-evaluation.js` — write `applicability.json` (C1)
- `scripts/v3/tests/helpers.js` — `withPipeline` ships a corroborating applicability stage (C2)
- `scripts/v3/tests/fifth-pass.test.js` — new: C1/C2/H1/H3/M1/M3 regressions (H2 pinned by the now-deterministic R2-F1)

## Corrections to the audit's suggested fixes
1. **H3** — editing `registry.js` `AT_DEPENDENT_CLEAR` is unnecessary (and wrong); the catalog
   per-direction flag fully governs the barrier. Verified empirically.
2. **H2** — the auditor's first draft fix had a null-safety regression (`unfocused` null ⇒ could read
   "stable"); fixed with an explicit `unfocused !== null` guard, plus the ancestor walk.
3. **M1** — a naive `derived || collect.pageDigest` fallback would have re-introduced the very bug
   (signing an unattested digest when derivation returns null); resolved with undefined-distinguishing
   parameter semantics so a `null` derivation fails closed.

---

## Addendum: response-audit (R5R-*)

The follow-up audit found that two of the fixes above closed *presence/normalization* but left an
*identity/coverage* gap. Both High issues — and the two minor items — are now fixed and regression-tested.

### R5R-C1 (High) — Applicability stage identity was not cross-artifact bound
**Root cause.** Making applicability *present* (C2) was necessary but not sufficient: the stage's
identity (`file`/`runId`/`pageDigest`) was never checked, so a **wrong-run** applicability artifact
whose facts happened to agree still published `authoritative`. Reproduced: mutate
`applicability.file/runId/pageDigest`, reseal the manifest, build promoted → `authoritative:1`.
**Fix.** `applicability` is now in the cross-artifact identity gate (`cross-artifact.js` `arts`),
treated **strictly** (not leniently like `drive`/`manifest`), so every identity field must match the
collector exactly; and `schemas.validateBundle` now calls `validIdentity(bundle.applicability, …)`.
After the fix the same probe is **refused** (`ok:false`, 3 identity-mismatch errors) while a correct
applicability still publishes. Pinned by `R5R-C1`.

### R5R-H1 (High) — Native role channels were still under-enumerated
**Root cause.** `factRole` read only `role`/`roleAttr`, but native controls (`<a>`, `<button>`,
`<input>`) carry `roleAttr:null` and report their role via `sampledRole`/`axRole` (confirmed against
real `collect.json`: `tag=a roleAttr=None sampledRole=link axRole=link`). So native widgets lost their
`name-role-value` (4.1.2) obligations — exactly the class H1 set out to close.
**Fix.** `factRole` now reads the full collector role contract first-non-empty: `role` → `roleAttr`
→ `sampledRole` → `axRole`. Native `<a>`/`<button>`/`<input>` now enumerate `name-role-value`;
non-widget AX roles (`Iframe`, `graphics-symbol`, `StaticText`, `generic`) correctly do **not**
(no over-enumeration — verified 0 enumeration errors across 12 real saved-page artifacts). The
coverage registry reads the same shared accessor. Pinned by `R5R-H1`.

### R5R-L1 (Low) — All-unrun signed runs failed closed at the manifest
**Root cause.** `deriveObservedPageDigest` returns `null` for zero results (correct — no independent
observation exists), but the orchestrator then signed a `null` identity → schema failure → the whole
build refused. A legitimate all-unrun sweep page would be rejected.
**Fix.** The orchestrator now distinguishes an **empty** run (no results → record the collector
identity; nothing publishes authoritative, so it cannot mislead a trust decision) from a
**result-bearing** run that fails to derive (disagreement/unsigned → stays `null`, fail closed). M1's
protection for result-bearing runs is unchanged. Pinned by `R5R-L1`.

### R5R-M1 (Medium) — judgments outside manifest integrity: accepted, tracked
The auditor agrees this is acceptable **while** judgments are non-authoritative recommendations that
cannot influence published claims — which is structurally true today: `build-v3` routes
`bundle.judgments` only into `adjudicationRecommendations` and never into the claim/disposition/ledger
path, and `fifth-pass.test.js` pins that judgments are not manifest-hashed. If a future phase promotes
semantic judgments into any publication-influencing path, they must become a hashed/identity-bound (or
separately signed post-manifest) artifact at that time. No code change now; logged as a phase-boundary
obligation.

### Files changed (addendum)
- `scripts/v3/lib/cross-artifact.js` — bind `applicability` identity strictly (R5R-C1)
- `scripts/v3/lib/schemas.js` — `validIdentity` on the applicability stage (R5R-C1)
- `scripts/v3/lib/applicability-oracle.js` — `factRole` reads `sampledRole`/`axRole` (R5R-H1)
- `scripts/v3/lib/orchestrator.js` — empty-run manifest identity fallback (R5R-L1)
- `scripts/v3/tests/fifth-pass.test.js` — R5R-C1 / R5R-H1 / R5R-L1 regressions
