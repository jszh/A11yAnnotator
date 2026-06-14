# Round 2.2 Independent Verification

Date: 2026-06-14
Pinned branch/commit: `round2-remediation` at `49784dd267469442356055e3c6c8c420eaacea97`
Delta reviewed: `9ab5f90` through `49784dd`

## Executive conclusion

Round 2.2 fixes the exact Round 2.1 adversarial fixtures and materially improves the
harness. In particular, the empty-record case is rejected, the four-control and
Escape-modal fixtures behave correctly, the original 10px stylesheet-resized checkbox
and uppercase navigation-label examples no longer auto-pass, target size now exposes
a tri-state, and best-practice observations can use a non-SC rule identifier.

However, fresh adversarial probes found remaining Critical and High paths that can
produce validated incomplete results, order-dependent normative totals, missed
keyboard traps, and definite false 2.5.8 passes. The statement that the remaining
limitations are now incapable of producing a definite false conformance verdict is
therefore not yet true.

**Recommendation: do not start W7 corpus regeneration at `49784dd`.** The remaining
issues are bounded, but the Critical result-gate defects and High trap/target-size
defects should be fixed before regeneration.

## Verification performed

- Inspected all six Round 2.2 commits at the exact pinned SHA.
- Ran the requested pure suite: **73 passed, 0 failed, 0 skipped**.
- Ran the deterministic evidence suite: **13 passed, 0 failed, 0 skipped**.
- Ran fresh browser fixtures for trap-only, large-cycle trap, same-size author-styled
  checkbox, lowercase navigation labels, transformed target, and consent inventory.
- Ran adversarial result-builder and validator probes.
- Validated interpretations against W3C Understanding documents for
  [2.1.2 No Keyboard Trap](https://www.w3.org/WAI/WCAG22/Understanding/no-keyboard-trap.html)
  and
  [2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

## Critical findings

### R22-C1 - The mandatory gate still validates an unevaluated page

Requiring one element and all three `pageSkills` keys blocks the exact empty-record
counterexample, but it does not establish that evaluation happened.

A record containing one dummy element, all ten element skills set to evidence-free
`N/A`, and all three page skills set to evidence-free `N/A` validates successfully as
a complete zero-finding result. Replacing every verdict with evidence-free
`NOT REPRODUCED` also validates.

This contradicts `AGENT-PLAN.md`, which requires a one-line reason for `N/A`, and
allows an agent or failed workflow to stamp an effectively blank evaluation as valid.
Page structure, grouping/reading order, and reflow are page-level evaluation
categories; merely requiring their keys does not prove they were assessed.

**Required fix**

- Require evidence/reason for every verdict, including `N/A` and `NOT REPRODUCED`.
- Disallow page-level `N/A` where the category is inherently applicable, or require a
  specific validated reason.
- Require provenance/completeness fields tying records to the sampled collect/drive
  inputs, rather than accepting an arbitrary dummy element.
- Add all-`N/A`, all-`NOT REPRODUCED`, and dummy-element adversarial tests.

### R22-C2 - Deduplication makes normative totals depend on element order

`issueKey()` deduplicates by scope, skill, first SC, and the first 120 normalized
evidence characters. It omits verdict, bucket, rule, level, and xpath.

An independent probe created two otherwise identical focus findings:

- element A: `PARTIAL`, SC 2.4.7, evidence `"same defect"`;
- element B: `REPRODUCED`, SC 2.4.7, evidence `"same defect"`.

When A appeared first, the builder emitted the PARTIAL issue and
`normativeFailures:0`. When B appeared first, it emitted the REPRODUCED issue and
`normativeFailures:1`. Both outputs passed validation.

The claimed full-object gate also still accepts:

- a corrupted advisory `rule`;
- a duplicate `summary.issues` entry, because comparison uses a `Set`;
- arbitrary extra element/page skills and extra summary fields.

The full issue comparison omits `rule`, and `Set` comparison cannot detect duplicate
objects.

**Required fix**

- Define deterministic merge precedence, such as `REPRODUCED` over `PARTIAL`.
- Include verdict/bucket/rule and the complete evidence in the dedup identity, or
  explicitly merge records before tallying.
- Compare arrays or canonical rebuilt JSON exactly, not sets.
- Reject unexpected schema keys and include `rule` in issue comparison.
- Add order-reversal, duplicate-issue, corrupted-rule, and unexpected-key tests.

## High findings

### R22-H1 - Generalized trap detection still misses valid traps

The new four-control and Escape-modal fixtures pass, but the algorithm still depends
on unreached page focusables and a ten-stop `recent` window.

Independent browser probes found:

- A page whose only two controls form an inescapable Tab/Shift+Tab loop emitted
  `trapDetected:false` after all 120 stops. Because every counted focusable was seen,
  `totalFocusables > seenAll.size` never became true.
- An inescapable twelve-control component with controls before and after it emitted
  `trapDetected:false`. Controls outside the ten-stop `recent` window were mistaken
  for an escape, and the output labeled the component escapable via Tab.

W3C 2.1.2 requires that focus can move away from a component using a keyboard
interface; this does not depend on another unreached focusable existing elsewhere.

**Required fix**

Detect repeated focus sequences independently of `totalFocusables`, derive the actual
cycle rather than a fixed recent window, and distinguish leaving the repeated
component from moving to another member omitted from that window. Add trap-only and
greater-than-ten-control fixtures.

### R22-H2 - 2.5.8 still emits definite false passes

The exact Round 2.1 examples are fixed, but the replacement heuristics still do not
prove the normative exceptions or target geometry.

Independent browser probes produced these definite passes:

1. A checkbox styled with `appearance:none`, author CSS, and the same 13x13 dimensions
   as the iframe default emitted `uaControl:true` and `verdict:"pass"`. Matching default
   dimensions does not prove that the author did not modify the control.
2. Lowercase navigation boilerplate around an inline link was classified as
   `inSentence:true` and auto-passed. Two consecutive lowercase words do not prove
   sentence or line-height-constrained non-target context.
3. An 18x18 link rotated 45 degrees had a 25x25 bounding box, was not marked
   non-rectangular, and auto-passed `"meets 24x24"`. Its page-aligned target cannot
   contain the required 24x24 square.

W3C states that the User Agent Control exception requires size to be unmodified by the
author, and that a page-aligned solid 24x24 square must fit completely within the
target. Rounded, transformed, and other complex target shapes require shape-aware
judgment.

**Required fix**

- Treat any author styling that can affect native control appearance/size as
  `needs-judgment`; size equality alone is not proof of the exception.
- Treat inline classification as `needs-judgment` unless sentence/line-height context
  is robustly established.
- Detect transforms, every non-zero rounded corner that may prevent square fit, SVG/
  complex hit regions, and other non-rectangular target areas; otherwise return
  `needs-judgment`.
- Add same-size `appearance:none`, lowercase-nav, transformed, and rounded-corner
  fixtures.

### R22-H3 - Non-isolation confidence calibration is not operational

`AGENT-PLAN.md` now says a verdict resting on a non-isolated probe must be PARTIAL.
However, the driver emits no per-probe isolation status that lets the evaluator apply
that rule.

Within an element, hover, keyboard, arrows, and activation can still share state. In
particular, native activation is not reloaded after hover unless another condition
triggers reload. The concrete PARTIAL rules cover synthetic click/form/keyboard flags,
but there is no corresponding `isolated:false` flag. The docs test only checks for
words in the plan and cannot prove the rule is usable or followed.

**Required fix**

Emit explicit trust and isolation metadata for every behavioral probe, reload before
each mutating probe where feasible, and have the result validator reject definite
behavioral verdicts whose cited evidence is synthetic or non-isolated.

## Medium findings

### R22-M1 - Consent inventory can create false findings and unsupported conclusions

The selector-level container dedup and `aria-labelledby` resolution are improvements.
The inventory still counts non-visible/non-focusable controls and does not provide the
data that the plan asks the agent to evaluate.

An independent fixture with one consent container, one named visible button, and one
hidden input emitted:

```json
{"containers":1,"focusable":2,"unlabelledControls":1}
```

The plan directly maps `unlabelledControls` to 4.1.2, so this can create a false
finding for a hidden input. The inventory records only a heading count and no consent
trap evidence, yet the plan asks the agent to assess heading order and the overlay's
own focus trap. `consentHidden.count` also counted three selector matches for the one
deduplicated container.

Keep consent findings PARTIAL/static until visible controls, resolved accessible
names, heading records, and keyboard behavior are actually collected.

### R22-M2 - Documentation and contract drift remains

- `AGENT-PLAN.md` still documents the old 2.4.13 fields
  `minThicknessPx`, `maxContrastChange`, and `meetsIfEnforced`, although the emitted
  proxy fields were renamed.
- It still says every issue verdict must carry a valid SC, contradicting the new
  best-practice/AT-compat `rule` support.
- `RESULT-CONTRACT.md` hard invariants do not describe non-SC `rule` observations or
  the new completeness behavior.
- The result validator does not enforce the plan's requirement that every `N/A`
  verdict carry a reason.

## Confirmed closures

- The exact empty `elements:[]` and missing-page-skill cases are rejected.
- Complete summary fields and the originally tested corrupted issue fields are checked.
- Best-practice observations can use a `rule` instead of a fake SC.
- The four-control trap fixture is detected.
- The Escape-releasable modal fixture is not failed.
- The original 10x10 stylesheet-resized checkbox is not treated as a UA control.
- The original uppercase navigation-label fixture is not treated as a sentence.
- Target-size no-geometry, unresolved inline, and selected non-rectangular cases expose
  `needs-judgment`.
- The deterministic test plan now accurately calls 2.4.13 fields diagnostic proxies.
- Consent containers matching multiple selectors are deduplicated in `containers`.

## Disposition

Round 2.2 is another substantial improvement, but the regeneration gate is not yet
met. Fix R22-C1, R22-C2, R22-H1, and R22-H2 before W7. R22-H3 and the consent path can
remain partially automated only if their outputs are mechanically prevented from
becoming definite conformance verdicts.
