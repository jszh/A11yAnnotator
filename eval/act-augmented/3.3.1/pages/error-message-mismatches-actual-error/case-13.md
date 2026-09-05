# case-13 — paired PASS repair of case-04

## Scenario and source pair

The complete German donation page and locale-correct value 1.234,56 are preserved, but the source’s false error state is converted into an accurate neutral confirmation.

**Paired failed source:** `case-04.html`

**Balance batch:** `gena11y-fp-50-v2`

**Hard-negative type:** `error-identification`

## Exact counterfactual repair

Removed the false invalid state, changed the description reference to a neutral confirmation, and replaced the foreign-format error sentence with “The entered amount corresponds to €1,234.56.” The value and locale are unchanged.

## Primary selector

`#betrag`

## Accessibility mechanism

Because the retained value is valid in de-DE, it is no longer identified as an error. Its programmatic description accurately confirms the parsed amount instead of demanding an incorrect en-US format.

## Expected ACT-style outcome

**passed** — SC 3.3.1

## Why this is a hard negative

The page retains the same amount, layout, and former validation component styling. An evaluator that memorizes the source mismatch or treats German punctuation as invalid can still report a nonexistent input error.

## Citation

> **wcag-understanding/error-identification.html:**
> “This SC requires that users be provided with information about the nature of the error, including the identity of the item in error.”
