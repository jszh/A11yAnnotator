# case-03 — CI/CD pipeline diagram: pass/fail by box background color only, identical shape, no status label

## Scenario
A CI/CD release pipeline view shows six sequential stages (Checkout → Install → Unit Tests
→ Integration Tests → Build → Deploy to Staging) as a row of identical rounded boxes
connected by arrows. The pass/fail state of each stage is conveyed only by background tint:
mint-green boxes passed, pink-red boxes failed. The boxes are otherwise identical — same
border, same size, same text style — and the stage text gives the stage name and duration
but never the word "passed" or "failed." No check/cross icon, no border-color/shape change,
no pattern, and no status word distinguishes a failed stage from a passed one. This is the
G111 "flow chart … green background to point to the next step when the condition passes …
red background … when the condition fails" pattern, stripped of the dashed/dotted line and
the explicit pass/fail wording.

## Attribute tuple
- **content-domain:** developer tooling / DevOps build dashboard
- **UI-component/pattern:** horizontal pipeline / flow-chart of stage nodes
- **host-language construct:** HTML `<div class="stage pass|fail">` boxes (canvas-style diagram in CSS)
- **locale/i18n:** en-US
- **failure-mechanism:** boolean status (pass vs fail) distinguished by background hue only; identical shape; no icon/word/pattern (G111 not met)

## Developer persona
A frontend dev building the pipeline widget mapped the API's `status` field straight to a
CSS class that sets a background color, mirroring how the terminal output is "green = good,
red = bad." It looked obviously readable on their screen, and they assumed the color *was*
the status. They never added a status icon or text because "the color says it all," and the
summary line just describes the color key rather than adding a non-color cue.

## Element / selector carrying the issue
The status-tinted stage boxes: `.pipeline .stage.pass` (mint, status = passed) vs
`.pipeline .stage.fail` (pink, status = failed). The status distinction lives entirely in
the `background` declaration of those two classes; the boxes are structurally identical.

## Exact accessibility mechanism
The pass/fail outcome is a critical piece of information conveyed purely by background
color. A user with red-green color-vision deficiency, on a monochrome display, or viewing a
grayscale screenshot sees six near-identical boxes and cannot tell that Integration Tests,
Build, and Deploy failed while the first three passed. There is no redundant visual cue:
shape, border, size, and text are constant, and the stage text never states the outcome.
Trusted Tester is explicit that "an error indicator cannot use color alone as an
indicator," and G111's flow-chart example pairs the color with a distinct line style. Here
both the redundant pattern and the explicit wording are missing, so the status survives
only as hue.

## Expected ACT-style outcome
**failed** — SC 1.4.1 (Use of Color, Level A). Stage status (a conveyed-information /
distinguish-a-visual-element case) is encoded by background color alone with no non-color
visual alternative.

## Why automated tools miss it
Every box is well-formed and contains real text; there are no missing labels, and the text
contrast against each tint exceeds 4.5:1, so axe-core, WAVE, and Lighthouse find nothing.
The `role="img"` container even has a descriptive `aria-label`. No checker can render the
pipeline, recognize that two background tints encode the pass/fail semantic, verify that
nothing else (icon, word, border, shape, pattern) carries that semantic, and conclude that
the distinction collapses in grayscale. That is a meaning-level visual judgment outside any
automated rule.

## Citation
> **Reference:** WCAG Technique G111 "Using color and pattern"
> (`wcag-techniques/general/G111.html`)
>
> **Quote (verbatim):** "A flow chart describes a set of iterative steps to complete a
> process. It uses dashed, arrowed lines with a green background to point to the next step
> in the process when the specified condition passes. It uses dotted arrowed lines with a
> red background to point to the next step in the process when the specified condition
> fails."
>
> **Reference:** Trusted Tester v5.1.3 — Test 13.A `1.4.1-color-meaning`
> (`refs/trusted-tester/sc-1.4.1-use-of-color.md`)
>
> **Quote (verbatim):** "An error indicator cannot use color alone as an indicator."
