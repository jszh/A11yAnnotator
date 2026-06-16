# Harness 3.0 — Response to the Third-Pass Independent Audit

Remediation record for [V3-THIRD-PASS-INDEPENDENT-AUDIT.md](V3-THIRD-PASS-INDEPENDENT-AUDIT.md)
(audited `99c2a1c`). Every Critical, High, and Medium finding is addressed at its **root cause** with
code + a regression test reproducing the audit's probe. The two independent real-Chrome wrong-verdict
probes (non-uniform contrast, cross-stacking obscuration) and the forged-publication probe are closed.

## Root-cause framing

The three High findings are one error repeated: **a definite verdict on a universally-quantified
geometric property derived from finite point-samples or local `z-index` arithmetic.** H1 sampled the
backdrop at one point; H2 sampled coverage on a grid; H3 compared `z-index` across stacking contexts.
The Critical is a different keystone: the publication boundary **authenticated assertions the bundle
author writes** rather than evidence lineage. Both are fixed structurally, not probe-by-probe.

## Critical

- **V3R3-C1 — publication authenticated assertions, not lineage.** New trust anchor outside the
  bundle: a real catalog runner HMAC-**signs** the lineage-bearing subset of each result
  (`experimentId, claimId, targetXpath, sc, observationScope, outcome, applicabilityEvidence, valid,
  completed, runner, runnerVersion`) with a secret key held in a protected location
  ([attestation.js](../scripts/v3/lib/attestation.js)). At the **publication boundary only**, the
  builder recomputes the digest from the result's own content and verifies the MAC with that key —
  loaded from `opts`/`env`, **never the bundle** ([build-v3.js](../scripts/v3/lib/build-v3.js)).
  Consequences: a bundle author who lacks the key cannot forge a valid attestation ⇒ shadow;
  tampering with **any** covered field changes the digest ⇒ the MAC fails ⇒ shadow; `valid`,
  `completed`, and applicability are now **attested**, not mutable fields trusted from the same
  bundle. The digest binds `claimId/targetXpath/sc/scope` **and the runner-observed run/page identity**
  (see the self-adversarial section), so a valid attestation cannot be **replayed** onto a different
  claim or into a foreign bundle for an unmeasured page. Promotion
  provenance is verified the same way: an on-disk verifier resolves each `gold/sealed/rater/suite` ref
  to bytes and checks its sha256 ([authority.js](../scripts/v3/lib/authority.js)); the production CLI
  supplies it. Attestation is checked **only at the leap to authoritative**, so default-shadow
  behaviour is unchanged (gate-passing-but-unattested observations are still recorded as shadow).
  The exact audit probe (hand-authored complete+promoted bundle, `valid:true`, invented flags) now
  yields `authoritative:0`. Tests: `lineage.test.js` — forged/no-attestation, fabricated-mac,
  tamper, replay-resistance, on-disk provenance fail, no-key-safety, and the legitimate publish.

## High

- **V3R3-H1 — centre-point contrast can false-clear over non-uniform paint.** `measureContrast`
  ([exp-runners.js](../scripts/v3/lib/exp-runners.js)) now proves uniformity over the **whole text
  rect**: it samples the centre + four inset corners (same opaque **base element** and same composited
  colour required at every sample), requires that base + every translucent layer **fully contains**
  the text rect, and — the structural catch a point sample cannot make — runs a **geometric
  enumeration**: any non-ancestor element painting a background that **intersects the text rect**
  (an absolutely-positioned sibling/overlay, incl. `pointer-events:none`) makes the backdrop
  non-uniform ⇒ a clear is impossible (PARTIAL). A clearing verdict needs **proven** uniformity.
  Test: `experiments.test.js` R3-H1 (`fx-v3-r3-h1.html`, black|white split). All prior contrast
  fixtures (clear/barrier/gradient/animation/rgba/mixed-run/sibling) still verdict correctly.
- **V3R3-H2 — finite-grid sampling cannot prove a component is entirely obscured.** `measureObscured`
  replaces the sample grid with **exact rectangle-union coverage**: each provably-opaque overlay that
  paints above the target contributes its border-box ∩ target rect; the component is entirely obscured
  **iff** rectangle subtraction leaves no remainder. A 1px strip leaves an exact remainder ⇒ not
  obscured. Test: `experiments.test.js` R3-H2 (`fx-v3-r3-h2.html`, 1px strip).
- **V3R3-H3 — cross-stacking-context `z-index` arithmetic is not a paint order.** The obscuration
  scan now determines "above" via **true paint order** (`document.elementsFromPoint`, which honours
  the stacking tree exactly), after temporarily **neutralising `pointer-events:none`** on intersecting
  elements so former PE-none overlays participate in hit-testing (paint is unaffected; restored in a
  `finally`). Paint order between two elements is positionally invariant, so one hit-test in the
  overlap decides it. A `z-index:999` child inside a `z-index:0` parent correctly paints below a
  `z-index:10` target ⇒ not a barrier. The opaque `pointer-events:none` overlay that genuinely covers
  (R2-M2) still barriers. Test: `experiments.test.js` R3-H3 (`fx-v3-r3-h3.html`).

## Medium

- **V3R3-M1 — same-source applicability/promotion.** Applicability now rides inside the **attested**
  digest (tamper-evident) and promotion provenance is on-disk-verified (above). A truly **independent**
  applicability observer (a separate process, not the runner's own flags) remains documented future
  work — disclosed, shadow-gated.
- **V3R3-M2 — reflow data-table exception is a semantic heuristic.** Reframed as a **semantic
  adjudication boundary**, not a proven exception: `measureReflow` surfaces `dataTableExemptionApplied`
  so "0 barriers" is never read as "proven no reflow barrier". The runner is barrier-only, so the
  exemption can only **suppress** a barrier (a surfaced false-negative), never manufacture a clear.
- **V3R3-M3 — complete bundle not mandatory at the loader.** The production build
  ([build-v3-results.js](../scripts/v3/tools/build-v3-results.js)) now requires the full lineage
  (`collect+drive+candidates+plan+experiments+proposals`) at the loader **and** enforces the same
  `requiredStages` in the cross-artifact gate; `--shadow-debug` is the explicit, labelled mode for an
  incomplete inspection build (which can only ever be shadow/partial). Tests: `lineage.test.js`
  production-required / shadow-debug / gate-enforcement.

## Self-adversarial red-team (found + fixed beyond the audit)

After implementing the above I ran **two** multi-agent red-team rounds (independent adversaries on
real Chrome). They surfaced **nine real soundness bugs the third-pass audit had not**, each now fixed
with a regression test. The H1 cases are all one root cause — *enumerating CSS paint sources can never
be complete* — so the fix is structural: a **rendered-pixel** backdrop oracle (below).

**C1 (attestation):**
- **cross-run replay** — the signed lineage bound no run/page identity, so a genuinely-attested clear
  could be **replayed verbatim** into a forged bundle for a never-measured page. Fix: `lineageOf`
  binds the runner-observed `{file, runId, pageDigest}` and the builder requires
  `boundToRun(result, bundle.collect)` (fail-closed on any missing/partial field).
- **`atBaseline` injection** — the Rule-12 AT-baseline gate `claims.js` reads wasn't in the digest,
  so it could be injected after signing. Fix: `atBaseline` is now part of the signed lineage.

**H1 (contrast) — five false clears via painters CSS enumeration can't see, closed at root by pixels:**
pseudo-element (`::before`) backdrop; text **overflowing** its box onto a different canvas; an **SVG**
`<rect>` sibling; a `<canvas>` sibling; a `::first-line` background making line 1 black-on-black. Fix:
a CLEAR now also requires a **rendered-pixel** uniformity proof — screenshot the text ink region with
glyphs forced to two distinct sentinel colours (locating glyph geometry even for *invisible* text) and
to transparent, then require the backdrop is a single colour **across the glyph pixels** (so inline
line-box leading never pollutes the sample). This captures SVG/canvas/img/pseudo/shadow-DOM painters
that property enumeration misses. The geometric channel is retained as corroboration (both must agree).

**H2/H3 (obscuration):**
- **sub-pixel false barrier** — a 0.5px coverage tolerance treated a real ~0.4px visible strip (≈1
  device px at Retina) as covered. Fix: near-zero tolerance — any positive remainder defeats "entirely
  obscured". (Same pass fixed a recall miss: identity/`translateZ(0)` overlays now correctly barrier.)
- **rotated-ancestor false barrier** — `getBoundingClientRect` reflects ancestor transforms, so an
  axis-aligned overlay inside a `rotate()` ancestor had an AABB that over-claimed coverage. Fix: the
  **whole ancestor transform chain** must be axis-aligned to trust the border-box.

Tests: `lineage.test.js` (replay, atBaseline, boundToRun-partial) and `experiments.test.js`
R3-H1b/H1c/H1d/H1e/H2b/H2c/H2d. A confirmation round re-attacked all closures (40/40 C1 attacks
blocked; all H1/H2 closures + regressions held).

## Verification

- `119/119` v3 tests pass (was 94): +16 `lineage.test.js` (attestation lineage + replay/atBaseline/
  boundToRun + M3 lineage) and +9 real-Chrome R3 regressions, including the full
  orchestrate→sign→verify→publish path.
- `139/139` existing pure tests pass. **Total: 258, 0 fail.**
- Every reproduced probe — both audit wrong-verdicts and all nine self-adversarial probes (non-uniform
  contrast split, cross-stacking obscuration, 1px + sub-pixel strips, rotated-ancestor, pseudo-element /
  text-overflow / SVG / canvas / ::first-line backdrops) plus the forged-publication / cross-run-replay
  probes — verified closed on real Chrome.
- CLI smoke: production build over the complete lineage succeeds and **replays byte-identical** (the
  pixel channel does not perturb determinism); production build over an incomplete dir **REFUSES**
  (exit 2, writes nothing); `--shadow-debug` builds it with the shadow-debug label.
- Everything remains **shadow by default**; the publication boundary now also fails closed on
  unverified evidence lineage, replayed/cross-run evidence, and unverified promotion provenance.

## Remaining (honestly scoped)

The trust anchor is a symmetric HMAC key — a key-holding runner is trusted; a separate signing
identity per runner / asymmetric attestation is future hardening. An **independent** applicability
observer (separate from the runner's own flags) is still future work. Contrast remains intentionally
conservative — a non-uniform backdrop yields PARTIAL rather than a per-region barrier (sound, lower
recall). The oracle remains a Phase-0 partial inventory.
