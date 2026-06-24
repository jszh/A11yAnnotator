# case-03 — Job-application form: validity by green vs red outline with HIGH mutual contrast (still fails — pure-colour reliance)

## Scenario
A reviewed job-application form shows each field's validity by outline colour only: a light-green border = accepted, a dark-red border = needs attention. The two outline colours have ~6.4:1 contrast WITH EACH OTHER — well above 3:1 — so a naive evaluator might think the lightness escape hatch saves it. It does NOT: the meaning depends on perceiving WHICH hue (green = ok vs red = problem), and per the Understanding note an additional indicator is required REGARDLESS of contrast. There is no icon, no "Looks good"/"Required" text, no aria-invalid.

## Attribute tuple
- **content-domain:** job board / ATS application form
- **UI-component / pattern:** form with per-field validity state (inline validation result)
- **host-language construct:** `<div class="field valid|invalid">` toggling input `border-color`
- **locale / i18n:** en-US
- **failure-mechanism:** validity meaning depends on a particular hue (green-good vs red-bad) — fails regardless of the >=3:1 inter-element contrast (limb b, the "trap" case)

## Developer persona
A developer wired client-side validation that adds `.valid`/`.invalid` classes recolouring the input border. They picked a LIGHT green and a DARK red on purpose, having half-remembered "make the colours differ in lightness so it's colour-blind safe." They believed the lightness gap made it compliant — not realising the rule is that hue-DEPENDENT meaning (which colour means valid) fails irrespective of contrast.

## Element / selector carrying the issue
`.field.valid input/select` (border `#86d98f`) and `.field.invalid input/select/textarea` (border `#7a1414`). The invalid fields are **Work email** and **Years with Go** and **Why this role?**.

## Exact accessibility mechanism (what AT experiences / why it fails)
- Whether a field is accepted or needs attention is communicated SOLELY by the hue of its outline. The user must know that green means ok and red means problem.
- A user with red-green colour-vision deficiency sees six outlined boxes whose outlines all look like a similar mid-dark line and cannot reliably tell which fields still need fixing.
- The ~6.4:1 contrast BETWEEN the green and red outlines is irrelevant: the Understanding note states that when meaning relies on differentiating a particular colour, an additional visual indicator is required regardless of the contrast ratio between those colours.
- No second indicator exists: no check/alert icon, no "Looks good"/"Required" text, no message, no `aria-invalid`.

Verified by rendering (light-green vs dark-red outlines, clearly different in lightness yet hue-coded) and contrast computation: green/red inter-element = 6.37:1; the failure is despite — not because of — contrast.

## Expected ACT-style outcome
**failed** (SC 1.4.1 — field validity relies on perceiving which hue; an additional non-colour indicator is required regardless of the contrast between the outline colours).

## Why automated tools miss it
The inputs are all properly labelled (`<label for>`), the 2px borders pass SC 1.4.11 non-text contrast, and the markup is valid, so axe/WAVE/Lighthouse report no errors. No automated rule models "the outline hue is the only thing distinguishing valid from invalid." Worse, the large >=3:1 inter-element contrast would mislead a tool (or a hasty human) into thinking the lightness escape hatch applies. Catching this requires applying the specific pure-colour-reliance rule — that hue-dependent meaning fails irrespective of contrast — a judgement only a human reasoning about meaning makes.

## Citation
> "However, if content relies on the user's ability to accurately perceive or differentiate a particular color an additional visual indicator will be required regardless of the contrast ratio between those colors. For example, knowing whether an outline is green for valid or red for invalid."
— wcag-understanding/use-of-color.html (Intent note — pure-colour reliance)

> "This objective of this technique is to describe the failure that occurs when a required field or an error field is marked with color differences only, without an alternate way to identify the required field or error field."
— wcag-techniques/failures/F81.html (Description)
