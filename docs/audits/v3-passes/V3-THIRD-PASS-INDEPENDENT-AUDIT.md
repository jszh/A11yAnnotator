# Harness 3.0 Third-Pass Independent Audit

**Audited commit:** `99c2a1cfd73b605b2dadb93b1083ce043c4d275e`  
**Compared against:** `7f6b59448ccb6c74172523ec436c9d7389bfda6b`  
**Audited v3/docs/fixtures digest:** `sha256:0492307299cd49ed5d92a4e97cc91f2b7b3a60fee9c077dd5dafc16b22e335da`

## Executive Conclusion

This pass is a meaningful remediation. It closes most of the exact second-pass counterexamples,
integrates all eight experiments into the normal candidate/scheduler path, and substantially
improves schema checking and conservative fallback behavior.

It does **not** yet support the builder's strongest claim that promotion "cannot be breached by
forged or partial inputs." A fully hand-authored bundle can still publish an authoritative claim
when its records are internally consistent and say `valid:true` / `completed:true`. The builder
checks the presence of a catalog experiment ID and named promotion references, but does not verify
that the catalog runner produced the evidence or that the named readiness artifacts exist and match.

Independent Chrome probes also found definite wrong verdicts beyond the new fixtures:

- text spanning multiple solid painted backgrounds can be false-cleared for 1.4.3;
- a one-pixel visible strip can still be declared "entirely obscured" under 2.4.11;
- a visually lower overlay child in a lower CSS stacking context can be mistaken for obscuring the
  focused control.

Everything remains shadow by default, which continues to be the most important current safety
property. The correct status is: **materially stronger shadow-mode harness; still unsafe to promote
without closing the publication lineage and definite wrong-verdict paths below.**

## Findings

### Critical

#### V3R3-C1: The publication boundary still authenticates assertions, not evidence lineage

The remediation requires `valid:true`, `completed:true`, a known catalog experiment ID, the presence
of drive/candidate/plan stages, readiness booleans, and non-empty provenance strings. Each of those
facts can still be authored directly by the bundle producer:

- [`build-v3.js`](../scripts/v3/lib/build-v3.js#L73) treats a known experiment ID as evidence from a
  "catalog runner" and accepts self-authored `valid` / `completed` booleans.
- [`build-v3.js`](../scripts/v3/lib/build-v3.js#L77) defines completeness as the mere presence of
  `bundle.plan`, `bundle.candidates`, and `bundle.drive`.
- [`authority.js`](../scripts/v3/lib/authority.js#L56) requires named provenance strings but does not
  resolve or verify them.
- [`schemas.js`](../scripts/v3/lib/schemas.js#L129) permits an empty `{}` drive or manifest.

Confirmed adversarial probe:

```text
bundle:
  collect: hand-authored
  drive: {}
  candidates/plan: hand-authored and internally consistent
  experiment: known text-contrast-pixel ID, invented typed flags,
              valid:true, completed:true
  authority: invented readiness:true and fictional non-empty provenance refs

buildV3 result:
  ok:true
  authoritative:1
```

The new checks close the prior `valid:false` and incomplete-three-stage probes, but not forged
positive assertions. Before promotion, bind publication to a protected run manifest containing
artifact hashes, runner identity/version, request/result lineage, and verified promotion artifacts.
`valid`, `completed`, applicability, and provenance must be derived or attested facts, not mutable
fields accepted from the same bundle.

### High

#### V3R3-H1: Center-point contrast sampling can false-clear text over non-uniform solid paint

[`measureContrast()`](../scripts/v3/lib/exp-runners.js#L50) examines the paint stack at only the
element rectangle's center. It then sets `backdropIsSolidUniform:true` when that one sampled stack is
solid, without establishing that the backdrop is uniform across the rendered text.

Confirmed real-Chrome probe:

```text
white text spans two absolutely positioned sibling backgrounds:
  left/center: black
  right: white

runner:
  backdropIsSolidUniform:true
  ratio:21
  direction:NO_BARRIER_OBSERVED
```

The text is visibly unreadable over the white portion. `elementsFromPoint()` fixed the exact
single-sibling fixture but does not close the paint universe. A clearing verdict needs rendered-pixel
or sufficiently complete multi-point/glyph-region analysis that proves the minimum contrast across
the entire text run. Until then, non-trivial or unproven backdrop uniformity must remain `PARTIAL`.

#### V3R3-H2: Dense-grid sampling still cannot prove a component is entirely obscured

[`measureObscured()`](../scripts/v3/lib/exp-runners.js#L284) replaces nine samples with an
approximately 3-8px grid, but still equates all sampled points being covered with the full focused
component being hidden.

Confirmed real-Chrome probe:

```text
100x100 focused button
opaque overlays leave a 1px visible vertical strip between sample points

runner:
  entirelyObscuredByAuthorContent:true
  obscuringLayerOpaqueAndBlocking:true
  direction:BARRIER_OBSERVED
```

WCAG 2.4.11's failure condition is that the component is **entirely hidden**. Any finite sample grid
can miss a visible region, so this predicate cannot support a definite barrier. Use exact rendered
region/pixel coverage, or keep the result `PARTIAL`.

#### V3R3-H3: The pointer-transparent overlay scan mis-models CSS stacking contexts

The added `pointer-events:none` repair compares each candidate overlay's numeric `z-index` directly
with the target's numeric `z-index`:
[`exp-runners.js`](../scripts/v3/lib/exp-runners.js#L263) and
[`exp-runners.js`](../scripts/v3/lib/exp-runners.js#L275).

Numeric `z-index` values are not globally comparable across stacking contexts. A child with
`z-index:999` inside a parent stacking context at `z-index:0` remains visually below a target in a
sibling stacking context at `z-index:10`.

Confirmed real-Chrome probe:

```text
target: position:fixed; z-index:10
overlay parent: position:fixed; z-index:0; pointer-events:none
overlay child: z-index:999; geometrically covers target but paints below it

runner:
  entirelyObscuredByAuthorContent:true
  direction:BARRIER_OBSERVED
```

The button remains visible, so this is a definite false barrier. The geometric fallback needs a
paint-order-aware method, ideally rendered-pixel comparison, rather than local `z-index` arithmetic.

### Medium

#### V3R3-M1: Applicability and promotion readiness remain same-source assertions

The response correctly discloses this as remaining work. Experiment runners construct their own
`applicabilityEvidence`, and the builder checks that the copied flags are true. Promotion readiness
similarly checks strings and booleans without verifying the referenced artifacts.

This is part of the publication breach in V3R3-C1, but also affects ordinary claim soundness:
internally consistent outcome and applicability flags can positively support one another without an
independent observer. Preserve shadow-only status until these facts have independent lineage.

#### V3R3-M2: Reflow's data-table exception is still a semantic heuristic

[`measureReflow()`](../scripts/v3/lib/exp-runners.js#L195) now correctly stops blanket-exempting every
`<table>`, but automatically exempts any table containing `th` or `caption`. Those features are good
signals of a data table, not proof that two-dimensional layout is required for usage or meaning.

This currently causes conservative `PARTIAL`/false-negative behavior rather than a definite false
conformance verdict because the runner is barrier-only. It should remain documented as a semantic
adjudication boundary rather than described as a proven exception.

#### V3R3-M3: "Complete bundle" is not mandatory at the loader or schema boundary

The build path shadows a supported claim when drive/candidates/plan are absent, which closes
authoritative publication from an incomplete bundle. However,
[`bundle-loader.js`](../scripts/v3/lib/bundle-loader.js#L20) and
[`cross-artifact.js`](../scripts/v3/lib/cross-artifact.js#L58) still require only collect,
experiments, and proposals by default.

Consequently, incomplete runs can still be accepted and built as non-authoritative output, and the
meaning of "complete" is split between loader, cross-artifact gate, and a presence check in the
builder. Make the production v3 build CLI require all lineage stages, while retaining an explicitly
named shadow/debug mode for incomplete bundles.

## Second-Pass Remediation Matrix

| Previous finding | Third-pass result |
|---|---|
| V3R2-C1 forged `valid:false` / incomplete bundle | Exact probes closed; broader forged-positive publication remains open as V3R3-C1 |
| V3R2-C2 text-input / arrow-widget activation | Closed; both now remain `PARTIAL` |
| V3R2-C3 sibling-painted backdrop | Exact fixture closed; broader non-uniform paint false clear remains open as V3R3-H1 |
| V3R2-H1 experiments absent from candidate generation | Closed; all eight are wired through the normal pipeline |
| V3R2-H2 unassociated visible label under 3.3.2 | Closed conservatively; now inconclusive |
| V3R2-H3 sampled-strip obscuration | Exact 12px fixture closed; finite-sampling flaw remains open as V3R3-H2 |
| V3R2-H4 advised alternate keyboard exit | Closed conservatively; recognized advice suppresses a definite trap |
| V3R2-H5 hover Dismissible/geometry | Exact fixture closed; bounded selector/geometry approach remains a recall limitation |
| V3R2-H6 partial schemas/bundle | Improved substantially; mandatory lineage and provenance remain open |
| V3R2-H7 bare promotion booleans | Improved to named refs; refs remain unverified |
| V3R2-M1 blanket table exemption | Improved to a narrower heuristic; semantic exception remains unresolved |
| V3R2-M2 pointer-transparent overlay missed | Exact fixture closed; stacking-context false barrier introduced/open |
| V3R2-M3 oracle coverage framing | Closed in documentation; explicitly partial Phase-0 inventory |
| V3R2-M4 formatting | Closed |

## What Is Sound Now

- All eight experiments are available through candidate generation, scheduling, execution, and the
  generic proposal path.
- The exact text-input and composite-widget activation misclassifications remain `PARTIAL`.
- The 3.3.2 runner no longer treats programmatic association as a normative 3.3.2 requirement.
- Typed outcome keys and values, `valid`/`completed` types, unrun records, and selected plan/candidate
  fields receive materially stronger validation.
- Evidence explicitly marked invalid/incomplete, or carried by an incomplete stage bundle, no
  longer publishes an authoritative claim.
- Default-shadow remains enforced for every current mechanism.
- Candidate/request/result reconciliation, family-aware obligations, strict legacy-label rejection,
  and deterministic replay continue to hold.

## Verification Performed

- `node --test scripts/v3/tests/*.test.js`: **94/94 passed**, including real-Chrome fixtures.
- `node --test scripts/tests/unit.test.js scripts/tests/result.test.js scripts/tests/docs.test.js scripts/tests/meta.test.js`:
  **139/139 passed**.
- Total verified: **233 passed, 0 failed**.
- `git show --check 99c2a1c`: no whitespace errors.
- Independently reproduced:
  - authoritative publication from a hand-authored complete/promoted bundle;
  - a 1.4.3 false clear across two solid sibling-painted backgrounds;
  - a 2.4.11 false barrier with a one-pixel visible strip;
  - a 2.4.11 false barrier from incorrect cross-stacking-context `z-index` comparison.

## Recommended Order

1. Keep all mechanisms shadow-only.
2. Close publication lineage: protected manifest, artifact hashes, verified runner execution, and
   verified promotion/gold references.
3. Replace the contrast center-point assertion with whole-text rendered evidence.
4. Replace sampled/heuristic obscuration proof with exact rendered-region evidence.
5. Make complete lineage stages mandatory in the production build CLI and retain incomplete builds
   only under an explicit shadow/debug mode.
6. Continue treating semantic exceptions, including reflow's two-dimensional-layout exception, as
   `PARTIAL` until positively adjudicated.
