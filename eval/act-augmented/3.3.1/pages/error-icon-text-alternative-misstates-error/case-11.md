# case-11 — paired PASS repair of case-04

## Scenario and source pair

The complete two-column Loomfield checkout, both invalid postcode values, and identical visible warning sprites are preserved from the failed source.

**Paired failed source:** `case-04.html`

**Balance batch:** `gena11y-fp-50-v2`

**Hard-negative type:** `accessibility-evidence-omitted`

## Exact counterfactual repair

Changed only the two SVG wrappers’ accessible names so each identifies its own postcode value and constraint. Their shared sprite and visual appearance are unchanged.

## Primary selector

`#ship-zip-ico, #bill-zip-ico`

## Accessibility mechanism

The shipping icon states that 9021 must contain five digits; the billing icon states that SW1A 0AA! contains a disallowed exclamation mark. Each input already references its matching icon.

## Expected ACT-style outcome

**passed** — SC 3.3.1

## Why this is a hard negative

A screenshot exposes two identical red warning glyphs and no visible explanatory sentence. The decisive evidence exists only in the accessibility-tree names and per-field IDREFs, which visual-only evidence omits.

## Citation

> **wcag-understanding/error-identification.html:**
> “This SC requires that users be provided with information about the nature of the error, including the identity of the item in error.”
