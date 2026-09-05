# case-12 — paired PASS repair of case-04

## Scenario and source pair

The complete Northwind quarterly-disclosures page and its visibly raw report URL are preserved from the failed source.

**Paired failed source:** `case-04.html`

**Balance batch:** `gena11y-fp-50-v2`

**Hard-negative type:** `residual-cue-tunnel-vision`

## Exact counterfactual repair

Added one destination-specific accessible name to the anchor. The full visible URL, typography, surrounding generic phrase, and destination remain untouched.

## Primary selector

`a.rawlink[href="https://example.com/products/2024/q3-report.pdf"]`

## Accessibility mechanism

The computed name begins with the complete visible URL and adds “Northwind Industries Q3 2024 quarterly report (PDF),” making purpose explicit while satisfying label-in-name ordering.

## Expected ACT-style outcome

**passed** — SC 2.4.4

## Why this is a hard negative

A model that fixates on the residual raw-URL cue can repeat the source verdict even though the accessibility tree now exposes a complete purpose. The visible appearance alone is intentionally unchanged.

## Citation

> **wcag-understanding/link-purpose-in-context.html:**
> “Alternatively, authors may choose to use an ARIA technique to associate additional text on the page with the link.”
