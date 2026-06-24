# SC 1.4.11 Non-text Contrast — augmented test corpus

The ACT rules and shipping automated checkers cover almost none of SC 1.4.11 in practice: there is no widely-deployed automated rule that measures UI-component or graphical-object contrast, and the parts of the SC that matter most in the field are exactly the parts that demand human judgment. The ACT suite does not exercise the *conditionality* of boundary contrast (a border only needs 3:1 when it is the sole cue a control exists), state-indicator contrast measured against the *correct* adjacent surface inside a component, which parts of a multi-part graphic are "required for understanding" (and whether equivalent text exempts them), focus indicators that are present but rendered indistinguishable (F78), the "adjacent colors" subsumption rule for picking the right comparison surface, focus-indicator geometry (inner / on-the-border / partly-outside), or the SC's many carve-outs and inclusions (inactive controls, hover-only treatments, the essential/author-choice-logo exception, and symbolic text characters).

This corpus adds seven human-judgment aspects, each with six hand-validated pages, covering precisely those gaps. Every aspect now meets and exceeds the 5-valid-page bar (6 valid pages each, 42 valid pages total; no aspect is short). Each page is marked `requiresHumanJudgment: true` and was independently verified: the conformance verdict, the cited normative passage, and the contrast mechanism were each checked against the rendered page and the WCAG 2.2 Understanding/Failure documents. Pages span genuine failures, deliberate PASS boundary cases, and Not-Applicable cases (the equivalent-text and essential exemptions), so the corpus tests the *reasoning split* (NA vs fail vs pass), not merely failure detection.

| aspect | valid pages | page statuses |
|---|---|---|
| boundary-is-only-cue-context-flip | 6 | valid, valid, valid, valid, valid, valid |
| state-indicator-contrast-adjacent-surface | 6 | valid, valid, valid, valid, valid, valid |
| graphical-object-required-for-understanding | 6 | valid, valid, valid, valid, valid, valid |
| f78-focus-indicator-occluded-but-present | 6 | valid, valid, valid, valid, valid, valid |
| adjacent-color-subsumption-and-comparison-surface | 6 | valid, valid, valid, valid, valid, valid |
| focus-indicator-geometry-inner-border-partly-outside | 6 | valid, valid, valid, valid, valid, valid |
| exemption-boundaries-inactive-hover-essential-symbolic | 6 | valid, valid, valid, valid, valid, valid |
