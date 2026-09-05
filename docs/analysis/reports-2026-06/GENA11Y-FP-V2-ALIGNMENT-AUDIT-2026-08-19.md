# GenA11y FP v2 fixture-alignment audit

Date: 2026-08-19

## Scope and method

This audit covers the 48 fixtures retained after removing:

- `1.3.1/visual-headings-without-heading-markup/case-09`, which still represented its lettered list with plain paragraphs.
- `2.4.4/preceding-heading-or-list-grouping-context-sufficiency/case-12`, which repaired one tariff link but left other format-only links without sufficient programmatic context.

For every retained case, the audit checked its batch entry, built-page record, failed source pair, stated repair, and the evidence GenA11y's SC-specific extractor actually sends to its model. It also compared the case with the completed Gemini 3.7 Flash GenA11y result. All 48 files render without JavaScript errors and every documented primary selector resolves.

Alignment labels:

- **Direct**: GenA11y supports the SC and the fixture exercises the claimed previously observed evidence/context failure mode.
- **Retag**: the fixture exercises a GenA11y weakness, but its current `hardNegativeType` names the wrong mechanism.
- **Weak**: valid negative fixture, but its decisive repair is directly exposed to GenA11y and does not strongly reproduce the claimed evidence-omission pattern.
- **Coverage control**: GenA11y does not support the SC and structurally abstains, so the fixture cannot measure a GenA11y false-positive weakness.

## Result

| Classification | Cases | Interpretation |
|---|---:|---|
| Direct | 35 | Correctly aligned as tagged |
| Retag | 3 | Relevant, but category metadata should change |
| Weak | 2 | Valid cases, weak evidence for the claimed GenA11y weakness |
| Coverage control | 8 | Useful cross-tool controls, not GenA11y FP cases |

Thus, 38 of the 40 GenA11y-supported cases are materially aligned with an observed weakness mechanism. Two are ordinary valid negatives rather than strong instances of their assigned mechanism. Eight additional fixtures were intentionally allocated to unsupported SCs and must be excluded from a GenA11y FP-rate denominator.

## Cases needing classification changes

| Case | Current type | Audit disposition | Reason |
|---|---|---|---|
| `1.3.1/form-label-and-group-relationships-by-context/case-11` | external-reference | Retag to accessibility-evidence-omitted | The source and repair both have the same valid `for`/`id` references. The decisive repair is rendered CSS placement, which GenA11y's 1.3.1 HTML extractor omits. |
| `1.3.1/visual-headings-without-heading-markup/case-10` | heading-context-or-explicit-name | Retag to accessibility-tree-boundary | The repair is native heading semantics matching unchanged visual styling. It is not a link-heading-context or explicit-name case. |
| `3.3.1/non-text-only-error-indicator/case-12` | accessibility-evidence-omitted | Retag to residual-cue-tunnel-vision | The error sentence is visibly rendered in the screenshot GenA11y receives. The challenge is ignoring the retained yellow cue and recognizing the visible textual identification, not recovering omitted evidence. |

## Weakly aligned cases

| Case | Why alignment is weak |
|---|---|
| `1.1.1/alt-not-an-alternative-filename-placeholder/case-11` | The filename cue is removed and replaced by a plainly descriptive `alt` value that appears directly in GenA11y's extracted `<img>`. It is a sound pass, but not a strong accessibility-evidence-omission trap. |
| `1.1.1/image-of-text-alt-omits-the-text/case-10` | The complete SVG `<title>` and all rendered SVG `<text>` nodes occur together in the extracted SVG markup. GenA11y receives the decisive repair directly, so little evidence is omitted. |

These two should remain in a general specificity set, but should be excluded or replaced if the set is intended to consist only of mechanism-faithful GenA11y adversarial negatives.

## Unsupported-SC coverage controls

The following eight cases do not exercise a GenA11y decision path because GenA11y structurally abstains for SC 1.4.13, 2.1.2, 2.4.3, and 4.1.3:

- `1.4.13/hover-content-no-keyboard-focus-trigger-path/case-08`
- `1.4.13/hover-content-no-keyboard-focus-trigger-path/case-09`
- `2.1.2/cross-format-embedded-application-trap-f10/case-09`
- `2.1.2/documented-exit-reachability-and-accuracy-beyond-ctrlm/case-07`
- `2.4.3/f44-positive-tabindex-breaks-meaning/case-07`
- `2.4.3/f85-revealed-dialog-not-adjacent/case-07`
- `4.1.3/non-textual-status-icon-sound-without-text-alt/case-08`
- `4.1.3/non-textual-status-icon-sound-without-text-alt/case-09`

They remain valid and useful for comparing broader harness coverage, but counting GenA11y's abstentions as true negatives produces a misleading FP-rate advantage.

## Directly aligned cases

### Accessibility evidence omitted

- `1.1.1/complex-image-long-description-incomplete/case-10`: the complete external figure description is outside the SVG markup GenA11y extracts.
- `1.1.1/context-and-function-dependent-equivalence/case-12`: the parent button's purpose name is outside the child image markup GenA11y extracts.
- `1.1.1/meaningful-image-suppressed-as-decorative/case-12`: the complete fallback data table is outside the presentational canvas element GenA11y extracts.
- `3.3.1/error-icon-text-alternative-misstates-error/case-11`: GenA11y receives only a screenshot, omitting the two icon names and their input IDREF associations. This produced an FP in the completed run.

### Accessibility-tree or applicability boundary

- `1.1.1/alt-not-an-alternative-filename-placeholder/case-12`
- `1.3.1/emulated-controls-wrong-or-missing-role/case-10`
- `1.3.1/structural-markup-misused-for-presentation/case-09`

These retain misleading raw or visual cues while correctness depends on effective roles, names, ownership, or native behavior.

### Redundant graphic or visual cue

- `1.1.1/context-and-function-dependent-equivalence/case-13`
- `1.1.1/meaningful-image-suppressed-as-decorative/case-13`
- `1.4.1/color-coded-graphics-no-pattern-or-label/case-10`
- `1.4.1/image-chart-alt-omits-color-encoded-fact/case-07`

The original graphic/color cue remains, but complete text, symbols, or names make it redundant. The pie-chart case produced a GenA11y FP.

### External reference

- `1.3.1/form-label-and-group-relationships-by-context/case-12`
- `2.4.4/context-outside-programmatic-link-context-f63/case-11`
- `2.4.4/context-outside-programmatic-link-context-f63/case-12`

The decisive group or link purpose is supplied by an IDREF outside the isolated target.

### Heading context or explicit name

- `2.4.4/preceding-heading-or-list-grouping-context-sufficiency/case-09`
- `2.4.4/preceding-heading-or-list-grouping-context-sufficiency/case-10`
- `2.4.4/preceding-heading-or-list-grouping-context-sufficiency/case-11`

All links now have universally sufficient explicit computed names while retaining repeated short visible labels and suspicious visual grouping.

### Residual-cue tunnel vision

- `1.4.1/color-coded-graphics-no-pattern-or-label/case-09`
- `1.4.1/error-validation-color-only/case-09`
- `1.4.1/inline-links-color-only-no-other-cue/case-09`
- `1.4.1/required-field-color-only/case-08`
- `1.4.1/ui-status-action-color-only-no-text-cue/case-09`
- `2.4.4/generic-link-text-no-rescuing-context/case-12`

Each retains the source's salient color, raw-URL, or styling cue after adding a decisive non-color or accessible-name repair. The error-validation case produced a GenA11y FP.

### Contextual purpose

- `2.4.2/non-identifying-artifact-title-strings/case-10`
- `2.4.2/stale-in-family-wrong-instance-title/case-09`
- `2.4.2/title-describes-secondary-not-primary-topic/case-10`
- `2.4.2/title-loses-meaning-out-of-context/case-09`
- `2.4.2/title-too-generic-to-distinguish-page-in-set/case-08`
- `2.4.4/duplicate-name-same-context-different-purpose/case-11`

These require semantic comparison with the primary page, current instance, sibling set, destination, or permitted paragraph context. The duplicate-link case produced a GenA11y FP.

### Error identification

- `3.3.1/error-icon-text-alternative-misstates-error/case-10`
- `3.3.1/error-message-mismatches-actual-error/case-13`
- `3.3.1/error-summary-incoherent-with-flagged-state/case-11`
- `3.3.1/inline-error-adjacent-to-wrong-field/case-11`
- `3.3.1/non-text-only-error-indicator/case-11`
- `3.3.1/silent-redisplay-after-real-error/case-11`

These require reconciling retained values and visual state with the exact error text, summary membership, field association, or locale rather than merely detecting an error-colored region.

## Superseded-fixture-result gap

“Superseded fixture result” is not a semantic HTML failure mode and cannot be faithfully represented by a negative page. The batch's `heading-context-or-explicit-name` cases are useful semantic tests, but they do not test stale results. That weakness needs a runner/provenance regression test which changes a fixture after a result is cached and verifies that the stale result is rejected or invalidated.

## Empirical check

After removing the two invalid fixtures, the completed historical run contains 40 still-valid GenA11y-supported cases. GenA11y produced four FPs among them (10.0%): one each in accessibility-evidence-omitted, redundant-graphic-or-visual-cue, residual-cue-tunnel-vision, and contextual-purpose. The other mechanism-derived cases remain useful generalization tests; they were not selected after observing this run, avoiding benchmark leakage.
