# case-09 — paired PASS repair of case-01

## Scenario and source pair

The complete convention-hotel page, pooled Quick links bar, group-label list items, and six repeated short links are preserved from the failed source.

**Paired failed source:** `case-01.html`

**Balance batch:** `gena11y-fp-50-v2`

**Hard-negative type:** `heading-context-or-explicit-name`

## Exact counterfactual repair

Added visible-label-first accessible names to the six existing links, naming the correct hotel for each destination. The pooled layout and all headings remain unchanged.

## Primary selector

`.resource-bar ul > li > a`

## Accessibility mechanism

Each link has an independently sufficient name such as “Map — Royal Palm Hotel” or “Book now — Hotel Three Rivers,” so it no longer depends on the severed H80 grouping.

## Expected ACT-style outcome

**passed** — SC 2.4.4

## Why this is a hard negative

The visible bar still contains duplicate Map, Photos, and Book now labels beneath a generic heading. A surface-pattern evaluator can over-report unless it reads each explicit computed name.

## Citation

> **wcag-understanding/link-purpose-in-context.html:**
> “Alternatively, authors may choose to use an ARIA technique to associate additional text on the page with the link.”
