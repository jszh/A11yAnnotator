# Harness 3.0 — Response to the Second-Pass Independent Audit

Remediation record for [V3-SECOND-PASS-INDEPENDENT-AUDIT.md](V3-SECOND-PASS-INDEPENDENT-AUDIT.md)
(audited `680d5b9`…`7f6b594`). Every Critical, High, and Medium finding is addressed with code + a
regression test reproducing the audit's probe. All nine reproduced real-Chrome wrong-verdict probes
and the forged-evidence builder probe are now closed.

## Critical
- **V3R2-C1 — promotion published self-authored/invalid evidence.** The builder now requires, for any
  definite direction, that the evidence come from a CATALOG runner and be `valid:true && completed:true`
  ([build-v3.js](../scripts/v3/lib/build-v3.js)); AUTHORITATIVE publication additionally requires the
  COMPLETE reconciled bundle (collect+drive+candidates+plan+experiments+proposals) — an incomplete
  3-stage bundle stays shadow. Tests: `foundation.test.js` *incomplete-bundle-stays-shadow* and
  *forged completed:false/valid:false cannot publish*.
- **V3R2-C2 — keyboard-activation false clear/barrier.** The experiment is now restricted to a
  REGISTERED Enter/Space activation recipe ([exp-runners.js](../scripts/v3/lib/exp-runners.js)): text
  inputs (Space types) and roving/composite widgets (`role=tab/option/slider/…`, even on a native
  `<button>`) are out of recipe ⇒ applicability fails ⇒ PARTIAL, never a clear or barrier. Tests:
  `experiments.test.js` R2-C2.
- **V3R2-C3 — contrast false clear over a sibling backdrop.** The backdrop is resolved through the
  ACTUAL paint stack at the glyph location (`document.elementsFromPoint`), capturing absolutely-
  positioned siblings/overlays the ancestor walk missed; any background-image/filter/blend in the
  paint layers makes the composition non-trivial ⇒ cannot clear. Test: `experiments.test.js` R2-C3.

## High
- **V3R2-H1 — experiments not in candidate generation.** [candidate-generator.js](../scripts/v3/lib/candidate-generator.js)
  now emits a candidate per enumerated (element, family) obligation bound to that family's catalog
  recipe, plus the page-level reflow candidate. The CLI runs all 8 experiments end-to-end (verified:
  focus + keyboard-activation + text-contrast + ax-state-diff over the fixture). Test: `scheduling.test.js`.
- **V3R2-H2 — 3.3.2 wrongly required programmatic association.** The barrier now fires ONLY when there
  is no label/instruction at all (no name, no visible associated label, no nearby visible labeling
  text); an unassociated-but-visible label ⇒ inconclusive, not a barrier (association is 1.3.1; name is
  4.1.2). Test: `experiments.test.js` C6 (div[4] now inconclusive).
- **V3R2-H3 — sampled-strip false obscuration.** `measureObscured` uses a DENSE (~4px) grid and requires
  EVERY point covered AND every covering opaque. A visible strip ⇒ not entirely obscured. Test: R2-H3.
- **V3R2-H4 — advised keyboard exit ignored.** The trap runner detects advisory text ("press Z to
  leave"), tries the advised key, and never asserts a trap when an advised exit exists. Test: R2-H4.
- **V3R2-H5 — hover Dismissible exception + geometry.** The runner binds the actual appearing content
  region, decides whether it OBSCURES other content, and applies the 1.4.13 Dismissible EXEMPTION when
  it does not; the pointer is moved to the real content region for Hoverable. A non-obscuring,
  non-dismissible tooltip is correctly NOT a barrier; an obscuring one is. Test: `experiments.test.js` ADV C9.
- **V3R2-H6 — partial bundle/schema.** Authoritative publication requires the complete bundle (above);
  schemas now CLOSE the outcome shape (every flag must be a declared `typedOutcome`, boolean-valued),
  validate `valid/completed` as booleans, validate candidate/plan records, `unrun` records, and
  drive/manifest baselines. (The schema closure caught a real bug — C3 emitted an undeclared `hydrationReady`.)
- **V3R2-H7 — promotion was bare booleans.** An authoritative promotion now requires NAMED provenance
  artifacts (`goldRef`, `sealedRef`, `raterRef`, `measurementSuiteHash`) in addition to readiness
  ([authority.js](../scripts/v3/lib/authority.js)). On-disk hash verification of these artifacts remains
  documented future work; naming them is the new floor.

## Medium
- **V3R2-M1 — reflow blanket table exemption.** Only DATA tables (th/caption or grid/table role) are
  2D-exempt; a bare layout table that overflows at 320px is a barrier. Test: R2-M1.
- **V3R2-M2 — opaque pointer-events:none overlay missed.** `measureObscured` adds a geometric scan for
  opaque overlays painted above the target (including `pointer-events:none`, which `elementsFromPoint`
  skips). Test: R2-M2.
- **V3R2-M3 — oracle coverage framing.** The oracle header now states explicitly it is a PARTIAL
  Phase-0 inventory, not complete independent coverage; absence of a family branch is a coverage gap,
  surfaced via `outOfScopeElements`, not a conformance proof.
- **V3R2-M4 — trailing blank line** in V3-EXPERIMENTS-PLAN.md removed.

## Verification
- `94/94` v3 tests pass (was 86), including the 6 new second-pass real-Chrome regression tests and the
  new builder-boundary tests. `139/139` existing pure tests pass.
- All nine reproduced wrong-verdict probes verified closed on real Chrome (text-input clear,
  arrow-tab barrier, sibling-backdrop clear, visible-strip barrier, advised-key barrier, non-obscuring
  hover barrier, layout-table false-negative, pointer-events:none miss) plus the forged-evidence probe.
- CLI end-to-end runs all 8 experiments through the normal pipeline; replay is byte-identical.
- Everything remains **shadow** by default; the publication boundary now also fails closed on invalid
  evidence and incomplete bundles, so a promotion cannot be breached by forged or partial inputs.

## Remaining (honestly scoped)
Independent applicability OBSERVATION (a separate observer, not the same runner's flags) and on-disk
verification of promotion artifacts (hashing gold/sealed sets) are still future work — the gates that
guard them are now real, but the artifact verification is named, not yet computed. The oracle remains
a Phase-0 partial inventory.
