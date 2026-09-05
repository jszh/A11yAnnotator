# case-11 — paired PASS repair of case-04

## Scenario and source pair

The complete Brightwater donation redisplay, $0 amount, unselected frequency group, and page context are preserved from the failed source.

**Paired failed source:** `case-04.html`

**Balance batch:** `gena11y-fp-50-v2`

**Hard-negative type:** `error-identification`

## Exact counterfactual repair

Changed the false thank-you banner into a visible alert naming both errors, associated it with the amount and frequency fieldset, and marked the invalid amount. Also replaced the inherited success-page title, green success class, and green palette with an error-specific title, class, and high-contrast red error treatment so no contradictory success cue remains. No entered value or choice changed.

## Primary selector

`#donation-errors`

## Accessibility mechanism

The document title identifies the error state, and the visible `role="alert"` states that the amount must be at least $5 and that a donation frequency must be selected. Both erroneous items reference that exact text; the banner’s error styling agrees with its meaning.

## Expected ACT-style outcome

**passed** — SC 3.3.1

## Why this is a hard negative

All original invalid values and the donation template remain, but the source’s title and green success presentation no longer create an unrelated contradiction. Correct evaluation requires reading the repaired alert and its two associations instead of inferring silent failure from the retained $0 and empty radios.

## Citation

> **wcag-understanding/error-identification.html:**
> “This SC requires that users be provided with information about the nature of the error, including the identity of the item in error.”
