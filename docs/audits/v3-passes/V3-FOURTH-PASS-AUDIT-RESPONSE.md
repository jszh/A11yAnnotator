# Harness 3.0 — Response to the Fourth-Pass Independent Audit

Remediation record for [V3-FOURTH-PASS-INDEPENDENT-AUDIT.md](V3-FOURTH-PASS-INDEPENDENT-AUDIT.md)
(audited `f846d60`). The audit cleanly separates **concrete wrong-verdict / security bugs** (fixed
here) from **plan-completeness gaps** (honestly scoped below — not claimed closed).

> Scope note up front: the audit is correct that this remains a **partial deterministic v3 spine** —
> selected shadow-mode experiments with a real publication boundary — **not the completed Harness 3.0
> plan**. This response fixes the definite wrong verdicts and the publication-lineage/security holes;
> it does **not** claim to deliver Phase 0's full attested-manifest trust root, independent
> applicability/coverage (Rules 15/16), the agent planner (Phase 2), or semantic skills (Phases 3–4).
> Those remain open and are listed at the end.

## Critical

- **V3R4-C1 — attestation signed the declared plan identity, not the page measured.** `runPlan` now
  independently digests the **actual navigation response body** (`response.text()`, Node-side — immune
  to `file://` fetch restrictions) and signs it as `attestation.runIdentity.observedPageDigest`
  ([run-experiments.js](../scripts/v3/lib/run-experiments.js)). The builder's `boundToRun`
  ([attestation.js](../scripts/v3/lib/attestation.js)) requires that observed digest to equal
  `collect.pageDigest` — so a run that loaded a wrong / stale / swapped page (or a hand-authored
  bundle with a fictional `pageDigest`) fails closed to shadow. The digest is part of the signed MAC,
  so it is tamper- and replay-evident. A failed observation leaves the result **unsigned ⇒ shadow**
  (never a forgeable partial attestation). Verified on real Chrome: the runner's response-body digest
  equals the collector's `sha256(file)`; tests `lineage.test.js` (boundToRun observed-digest cases)
  and the orchestrate publish path (collect digest computed from the fixture).

## High

- **V3R4-H1 — rendered pixels proved uniformity but the ratio used a different colour.**
  `analyzeBackdrop` now returns the **representative backdrop colour behind the glyphs**, and a
  clear/barrier requires it to **agree** (±16/channel) with the CSS colour used in the ratio
  ([exp-runners.js](../scripts/v3/lib/exp-runners.js)); a disagreement ⇒ PARTIAL. Closes white text
  over a uniform white SVG that the CSS stack resolved against the black body (false 21:1 clear).
  Test: `experiments.test.js` R4-H1.
- **V3R4-H2 — rectangle-union coverage ignored ancestor clipping.** Coverage now uses each candidate's
  **clipped effective rect** — its border box intersected with every clipping ancestor's padding box
  (`overflow:hidden/clip/scroll/auto`); a `clip-path`/`mask`/rounded-overflow clip can't be reduced to
  a rect ⇒ the candidate is excluded. An overlay clipped to part of its width no longer over-claims.
  Test: `experiments.test.js` R4-H2.
- **V3R4-H3 — 2.1.1 inferred "all functionality" from markup.** Clearing authority **withdrawn**:
  `2.1.1/NO_BARRIER_OBSERVED` is now `open-scope-never-clearable` ([registry.js](../scripts/v3/lib/registry.js)) —
  markup cannot prove the absence of pointer-only secondary functionality (`ondblclick`,
  `addEventListener`). The keyboard runner also flags visible secondary pointer handlers
  (`singleModeControl:false`). 2.1.1 is now barrier-only. Tests: `experiments.test.js` R4-H3 +
  build-through (cleared:0), `foundation.test.js` (2.1.1 not clearable).
- **V3R4-H4 — provenance verification was optional at the programmatic boundary.** The builder now
  **fails closed** when no artifact verifier is configured: a promoted direction publishes only when a
  verifier is supplied AND every provenance ref verifies ([build-v3.js](../scripts/v3/lib/build-v3.js)).
  Test: `lineage.test.js` V3R4-H4.
- **V3R4-H5 — the production CLI never signed evidence.** `runPlan` and
  [run-evaluation.js](../scripts/v3/tools/run-evaluation.js) now load `V3_ATTEST_KEY` from the
  environment, so a real production run signs (and the build verifies) without an injected test key.

## Medium

- **V3R4-M1 — runner identity/version signed but unchecked.** The schema now **requires** non-empty
  `runner`/`runnerVersion` and a closed `runIdentity`, and the builder verifies `attestation.runner ===`
  the cited catalog experiment and `runnerVersion ===` the approved catalog build. Tests:
  `lineage.test.js` V3R4-M1 (schema + version-mismatch).
- **V3R4-M2 — disk-verifier sibling-prefix escape.** Path confinement now uses `path.relative`
  (rejecting `..`/absolute), not `startsWith` (which a sibling like `/tmp/repo-evil` escaped for root
  `/tmp/repo`). Test: `lineage.test.js` disk-verifier sibling-prefix case.
- **V3R4-M3 — body-mutation coverage only on 2.4.7.** A generic drop-any-required-obligation test now
  covers **every** clearable SC (1.4.3, 2.1.2, 3.3.2, 4.1.2). Test: `foundation.test.js` completeness
  mutation.

## Self-adversarial hardening (found + fixed beyond the audit)

A red-team of the fixes above found three more real bugs, now closed:
- **H1 / `-webkit-text-fill-color` & `filter` ink** — these override the rendered glyph ink while
  leaving `cs.color` unchanged. The ratio now reads the **fill colour** (low-contrast fakes ⇒ barrier),
  and `filter`/blend on the text element are caught by the existing non-trivial-composition channel.
  Tests: `experiments.test.js` R4b-H1.
- **H2 / `contain:paint` & `clip:rect`** — `clippedRect` now treats `contain:paint/strict/content`
  ancestors as clipping and intersects the candidate's own deprecated `clip:rect(...)`, closing two
  false barriers. Tests: R4b-H2.
- **C1 / byte domain** — the runner hashes the **raw navigation response bytes** (`response.buffer()`),
  the same domain the collector hashes, so the page-digest comparison is sound (the non-UTF-8 residual
  is Chrome re-encoding the response and fails closed).

## Phase-0 trust/contract gaps — H7/H8 closed; H6 advanced (bounded)

The audit was right that H6/H7/H8 were open. This pass implements them (see
[V3-GAP-FILLING-PLAN.md](V3-GAP-FILLING-PLAN.md)); a red-team verified G1/G2 hold (34 manifest attacks
blocked; coverage mutation-complete) and confirmed G3 is sound-but-bounded:
- **H7 / Rule 17 — attested run-manifest — CLOSED** ([manifest.js](../scripts/v3/lib/manifest.js)): the
  trusted orchestrator finalizes + signs a manifest binding the observed page identity AND a content
  hash of every stage; the builder recomputes the hashes, verifies the MAC, and verifies the signed
  catalog/runner build matches the live build (plan G1d). Tampering any stage ⇒ the build is
  **refused**; a forged/stale bundle can't publish ⇒ shadow; production requires it.
- **H8 / Rule 16 — independent coverage registry — CLOSED** ([coverage-registry.js](../scripts/v3/lib/coverage-registry.js)):
  a separately-authored surface→family table the builder requires the oracle to be a superset of, so
  removing a family branch from the shared oracle is caught (mutation-backstop test; red-team found no
  uncaught removal across 21 roles × 64 fact combinations).
- **H6 / Rule 15 — independent applicability — BOUNDED (not fully closed).** The builder corroborates
  every claim's family via the oracle (raw collector facts the runner never produced). Honest caveat
  the red-team surfaced: this **overlaps the existing obligation-reconciliation gate** (both derive from
  the oracle), so it adds an explicit, named Rule-15 check but no enforcement reconciliation didn't
  already provide. The faithful Rule-15 endpoint — a *separate observer* re-deriving the fine
  applicability flags — remains future work (G3 in the gap plan).

## Verification

- `143/143` v3 tests pass (was 119): +R4 / R4b Chrome regressions, the attestation lineage/identity/
  path tests, the all-SC completeness mutation, +run-manifest tests (incl. stale-build), +coverage/
  applicability tests.
- `139/139` existing pure tests pass. **Total: 282, 0 fail.**
- All reproduced V3R4 probes + the three self-adversarial probes verified closed on real Chrome /
  pure node. CLI: tampering any stage **refuses** the production build (exit 1, writes nothing); a
  complete run replays byte-identical.
- Default-shadow remains enforced; the boundary now also fails closed on a tampered bundle, an
  unobserved/mismatched page identity, an uncorroborated applicability family, and a coverage gap.

## Remaining — higher-phase plan scope, designed but not built

Honestly scoped in [V3-GAP-FILLING-PLAN.md](V3-GAP-FILLING-PLAN.md): a sized/sealed authority
benchmark (Rule 9), budgets + risk classes (Rule 8), dynamic subjects (Rule 13), AT capability
(Rule 12), the bounded agent planner (Phase 2), semantic judgment skills (Phase 3), and broader
state exploration (Phase 4). Each is designed to ride the same manifest/attestation/contract spine,
and default-shadow holds until each mechanism's benchmark gate is met.
