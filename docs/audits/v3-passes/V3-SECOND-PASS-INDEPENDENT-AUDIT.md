# Harness 3.0 Second-Pass Independent Audit

**Audited range:** `680d5b9` through `7f6b594`  
**Pinned HEAD:** `7f6b59448ccb6c74172523ec436c9d7389bfda6b`  
**Audited v3/docs/fixtures digest:** `sha256:a2f29e63bb8f3124cef1ebc6f63403bbfc8b93fc683d6b46e19d3774c2b70c23`

## Executive conclusion

The foundation hardening is a substantial improvement. The specific first-pass attacks against
cross-target/cross-SC binding, atomic obligation identity, duplicate evidence, shadow authority,
legacy page content, and the transparent-shadow/red-border focus cases are closed. Default-shadow
also prevents the newly found wrong verdicts from entering the authoritative corpus **today**.

However, the claim that the publication boundary held and the eight experiments are complete
end-to-end is not yet supported:

- under a promoted mechanism, a hand-authored result marked `completed:false` and `valid:false`
  published an authoritative clear through a three-stage bundle with no drive, candidates, plan,
  manifest, trusted-input proof, or runner provenance;
- the production candidate generator schedules only focus retry, so none of the eight new runners
  execute through the normal CLI pipeline;
- independent Chrome probes reproduced definite wrong verdicts in keyboard activation, contrast,
  field labels, focus obscuration, keyboard traps, and hover content.

The correct status is: **stronger shadow-mode research harness; not safe for promotion and not yet
integrated as a full v3 evaluation pipeline.**

## Findings

### Critical

#### V3R2-C1: Promotion turns self-authored typed flags into authoritative evidence

[`build-v3.js`](../scripts/v3/lib/build-v3.js#L31) validates that support flags are present but does
not require the evidence result to be `valid`, `completed`, trusted, isolated, produced by the
catalog runner, or bound through a protected manifest. [`schemas.js`](../scripts/v3/lib/schemas.js#L53)
permits `valid` and `completed`, but never validates or consumes them.

Confirmed adversarial probe:

```text
bundle stages: collect, experiments, claimProposals
experiment result: completed:false, valid:false
promoted text-contrast mechanism
result: ok:true, authoritative:1
```

This breaches the publication boundary once any direction is promoted. Default-shadow delays the
impact; it does not close the hole. Require a complete protected bundle, runner/manifest lineage,
exact request-result reconciliation, and positive catalog-defined trust/validity/completion
predicates before resolving any definite direction.

#### V3R2-C2: Keyboard activation produces definite false clears and false barriers

[`exp-runners.js`](../scripts/v3/lib/exp-runners.js#L355) treats every native `INPUT`, `SELECT`, and
`TEXTAREA` as a finite single-mode activation control. For native controls, any Enter-or-Space
effect is sufficient. The barrier direction does not require `singleModeControl` or a closed mode
inventory.

Confirmed real-Chrome probes:

- a plain text input produced `NO_BARRIER_OBSERVED` because Space inserted a character;
- a correctly arrow-operable `role=tab` produced `BARRIER_OBSERVED` because Enter and Space had no
  effect.

SC 2.1.1 concerns **all functionality**, not merely whether Enter or Space changes something.
Restrict the experiment to tightly registered control recipes. Barrier claims also need a proven
applicable recipe; failure of irrelevant keys must remain `PARTIAL`.

#### V3R2-C3: The contrast runner can false-clear visually invisible text

Despite its `text-contrast-pixel` name and design claim, [`measureContrast()`](../scripts/v3/lib/exp-runners.js#L25)
uses computed CSS colors only; it performs no rendered-pixel corroboration. It resolves backgrounds
only through the ancestor chain, missing overlapping/sibling paint layers, filters, blending, and
other rendered composition.

Confirmed real-Chrome probe: white text visually painted over an absolutely positioned white
sibling backdrop produced `NO_BARRIER_OBSERVED`, because the runner instead selected the black body
background.

Do not allow this mechanism to clear until rendered pixels or a demonstrably complete paint model
corroborate the computed ratio. The current `backdropIsSolidUniform` flag does not close the actual
paint universe.

### High

#### V3R2-H1: The eight experiments are runners, but are not integrated into candidate generation

[`candidate-generator.js`](../scripts/v3/lib/candidate-generator.js#L23) creates only
`focus-visual-retry` candidates. It creates no candidates for contrast, trap, field label,
activation, AX state, hover, reflow, or obscuration, even though the oracle enumerates those
obligations.

Confirmed probe: a synthetic collector containing text, a form field, modal control, hover trigger,
overlay-covered control, widget, and page-level reflow generated only two focus candidates.

Consequently, the normal CLI auto-PARTIALs the new obligations without running the new experiments.
The fixtures invoke runners directly and therefore do not establish end-to-end production wiring.

#### V3R2-H2: 3.3.2 incorrectly requires a programmatic name/association

[`field-label-probe`](../scripts/v3/lib/exp-runners.js#L118) publishes `BARRIER_OBSERVED` when a
visible label is not programmatically associated. The committed test explicitly expects an
unassociated visible label to be a 3.3.2 barrier.

W3C's Understanding document explicitly says 3.3.2 does **not** require labels/instructions to be
correctly marked up or associated; that is assessed under 1.3.1. It also separates accessible name
issues under 4.1.2. An unassociated but sufficiently clear visible label can therefore pass 3.3.2.

Reference: <https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html>

Route programmatic-association/name defects to the appropriate assertion family. The 3.3.2
experiment needs semantic evidence that visible labels or instructions identify what input is
expected.

#### V3R2-H3: Nine-point sampling can invent an "entirely obscured" 2.4.11 barrier

[`measureObscured()`](../scripts/v3/lib/exp-runners.js#L234) equates nine covered sample points with
the component being entirely hidden. It also sets `obscuringLayerOpaqueAndBlocking` true when any
sample's top layer is opaque, rather than proving the covering paint is opaque everywhere.

Confirmed real-Chrome probe: opaque overlays covered the nine sample points but left a visible
10-pixel vertical strip of the focused button; the runner emitted `BARRIER_OBSERVED`.

SC 2.4.11 permits partial visibility. Use dense/adaptive rendered-pixel coverage or retain
`PARTIAL` unless complete obscuration is positively proven.

Reference: <https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html>

#### V3R2-H4: The keyboard-trap runner ignores valid advised exit methods

[`keyboard-trap-escape`](../scripts/v3/lib/exp-runners.js#L308) tests only Tab, Shift+Tab, and Escape.
It asserts a barrier after a cycle when those do not escape, without checking whether the user is
advised of another keyboard exit.

Confirmed real-Chrome probe: a dialog that visibly advised “Press Z to leave” and correctly moved
focus out on Z produced `BARRIER_OBSERVED`.

WCAG 2.1.2 permits other keyboard exit methods when the user is advised. Such cases require an
agent-selected advised-key recipe or must remain `PARTIAL`.

Reference: <https://www.w3.org/WAI/WCAG22/Understanding/no-keyboard-trap.html>

#### V3R2-H5: Hover-content barriers ignore the Dismissible exception and actual content geometry

[`hover-content-tri`](../scripts/v3/lib/exp-runners.js#L541) sets `hasTrigger` unconditionally
(`... || true`), searches only a small selector list, guesses a downward hover path rather than
locating the appearing content, and requires Escape dismissal for every detected content instance.

Confirmed real-Chrome probe: a tooltip positioned far from and not obscuring/replacing any content
produced `BARRIER_OBSERVED` because it was not dismissible and the guessed hover path missed it.

SC 1.4.13 explicitly exempts additional content from Dismissible when it does not obscure or
replace other content. Detect and bind the actual appearing region, test geometry/exception
applicability, and move the pointer to that region.

Reference: <https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html>

#### V3R2-H6: "Complete bundle" and "strict schema" remain partial controls

[`bundle-loader.js`](../scripts/v3/lib/bundle-loader.js#L20) and
[`cross-artifact.js`](../scripts/v3/lib/cross-artifact.js#L71) still require only collect,
experiments, and proposals by default. Drive, candidates, plan, and manifest remain optional, so
the replay/publication CLI can bypass request/result/candidate reconciliation.

Schemas are strict only for selected records. Manifest and drive are not schema-validated;
candidate records, plan records, experiment `outcome`, applicability evidence, measurement, and
`unrun` records are not closed typed shapes.

Make the complete bundle mandatory at the builder boundary, not merely in the orchestrator's happy
path. Validate each catalog experiment's exact result schema and provenance.

#### V3R2-H7: Applicability and promotion readiness are still assertions, not independently verified facts

Experiment runners construct `applicabilityEvidence` from their own measurements, and
[`applicabilityHolds()`](../scripts/v3/lib/catalog.js#L78) checks only that those copied booleans are
true. Similarly, [`authority.js`](../scripts/v3/lib/authority.js) checks readiness booleans but does
not verify gold artifacts, sealed evaluation results, rater provenance, or measurement-suite
hashes.

This is stronger defaulting, but not the plan's independent applicability or builder-verified
promotion gate. Bind applicability and promotion to independently generated, provenance-bearing
artifacts.

### Medium

#### V3R2-M1: Reflow blanket-exempts tables/maps/SVG and own scrollers

[`measureReflow()`](../scripts/v3/lib/exp-runners.js#L172) treats any content inside a table, map,
SVG, grid, or own horizontal scroller as exempt. The WCAG exception applies only when
two-dimensional layout is required for usage or meaning, not by element type.

Confirmed probe: a simple two-cell layout table forced 908px page width at 320px and was treated as
exempt/inconclusive. This causes false negatives and needs semantic/adjudicated exception handling.

#### V3R2-M2: Opaque `pointer-events:none` author content is ignored by obscuration testing

`elementsFromPoint()` omits pointer-transparent paint. A fully opaque author overlay with
`pointer-events:none` visually hid the focused control, but the runner returned inconclusive.
Pointer event behavior is irrelevant to whether sighted keyboard users can see the component.

#### V3R2-M3: The applicability oracle remains a narrow shared mapping, not an independent coverage oracle

The oracle is independent from `applicableScs`, which fixes the first-pass circularity. However,
both annotation and obligation generation now delegate to the same manually authored
`familiesFor()` mapping. Missing a family branch does not fail closed; many role-only surfaces are
reported as generic out-of-scope rather than compared against a separately owned category/skill
coverage registry.

This is acceptable for an explicitly partial Phase-0 inventory, but it should not be described as
complete independent obligation coverage.

#### V3R2-M4: Minor repository quality issue

`git show --check` reports an extra blank line at EOF in
[`V3-EXPERIMENTS-PLAN.md`](V3-EXPERIMENTS-PLAN.md). No production effect.

## What is sound now

The following first-pass issues were independently rechecked and are closed:

- cross-target and cross-SC evidence laundering;
- missing evidence scope fail-open;
- atomic family-aware obligation identities;
- duplicate/conflicting evidence order dependence;
- default-shadow authority behavior;
- legacy `"N/A"` page-content false rejection;
- focus transparent-shadow false clear and visible-border false barrier;
- focus animation, motion, pseudo-ring, and offset-ring cases;
- unknown bundle-stage and proposal-field rejection;
- explicit `unrun` reconciliation when plan/candidate stages are present.

The architecture also continues to preserve scoped v3 triples, default-closed clearing directions,
strict-true support predicates, and deterministic replay over the same accepted bundle.

## Verification

- `86/86` v3 tests passed, including the committed real-Chrome experiment/adversarial tests.
- `139/139` existing pure tests passed.
- Builder's stated `225` total is correct.
- Independent real-Chrome probes reproduced:
  - text-input false clear under 2.1.1;
  - arrow-operable tab false barrier under 2.1.1;
  - unassociated-visible-label false barrier under 3.3.2;
  - sibling-painted-backdrop false clear under 1.4.3;
  - sampled-visible-strip false barrier under 2.4.11;
  - advised-key exit false barrier under 2.1.2;
  - non-obscuring hover-content false barrier under 1.4.13;
  - simple-layout-table false-negative exemption under 1.4.10;
  - opaque `pointer-events:none` overlay missed under 2.4.11.
- A promoted-builder probe published forged `completed:false`, `valid:false` evidence through an
  incomplete three-stage bundle.

## Recommended order

1. Keep every mechanism shadow-only.
2. Make the complete protected bundle and runner provenance mandatory; require valid/completed,
   catalog-typed outcomes and independent applicability.
3. Add production candidate-generation branches for each experiment and end-to-end CLI fixtures.
4. Correct the normative 3.3.2, 2.1.2, and 1.4.13 predicates.
5. Redesign C3 contrast, C4 keyboard activation, and C7 obscuration before expanding gold sets.
6. Replace blanket semantic exceptions such as all tables being 2D-required with `PARTIAL` plus
   agent/human adjudication.
7. Bind promotion to verified benchmark/sealed-set artifacts rather than readiness booleans.

## Release judgment

**Status: strong shadow-mode prototype; unsafe to promote; eight experiment runners are not yet
production-integrated.**

The keystone default-shadow property protected the corpus during this round. The stronger claim
that red-team attacks could not breach the publication boundary is false once a direction is
promoted.
