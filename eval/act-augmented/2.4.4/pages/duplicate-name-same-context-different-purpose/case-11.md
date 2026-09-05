# case-11 — paired PASS repair of case-04

## Scenario and source pair

The complete Foliage pricing comparison and both identical visible “Buy now” links are preserved from the failed source.

**Paired failed source:** `case-04.html`

**Balance batch:** `gena11y-fp-50-v2`

**Hard-negative type:** `contextual-purpose`

## Exact counterfactual repair

Placed a short plan identifier and its unchanged Buy now link together inside one paragraph in each existing action cell. No link text, price, feature, or destination changed.

## Primary selector

`.buyrow p a.buy`

## Accessibility mechanism

Each generic link is now in a same-paragraph sentence that identifies its plan: “Sprout plan: Buy now” or “Greenhouse plan: Buy now.” That paragraph is programmatically determined link context.

## Expected ACT-style outcome

**passed** — SC 2.4.4

## Why this is a hard negative

Duplicate-text heuristics still see two links named “Buy now.” A correct evaluator must inspect their allowed paragraph contexts and distinguish valid duplication from the source’s visual-only grid association.

## Citation

> **wcag-understanding/link-purpose-in-context.html:**
> “This can be achieved by putting the description of the link in the same sentence, paragraph, list item, or table cell as the link, or in the table header cell for a link in a data table, because these are directly associated with the link itself.”
