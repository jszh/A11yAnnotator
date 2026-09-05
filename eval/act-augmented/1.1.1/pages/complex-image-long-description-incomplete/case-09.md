# case-09 — PASS paired repair of case-02

## Scenario and source pair

This is the counterfactual PASS partner for **case-02** in the same aspect. It preserves the
source page’s domain, layout, content, visual treatment, and interaction complexity. The paired
source scenario is:

> Finance dashboard with a four-bar quarterly-revenue chart showing three quarters of growth then a sharp red-highlighted Q4 collapse annotated '↓ port strike'. The aria-describedby caption recites the four dollar figures but never states the trend, which bar is the outlier, or the on-chart cause.

## Exact repair

Completed the existing chart description with the encoded trend, Q4 outlier, and port-strike cause. No unrelated target-SC condition was removed.
The HTML includes a machine-readable pairing comment naming case-02 and this repair.

## Primary selector

`svg[role="img"][aria-describedby]`

## Accessibility mechanism

The description retains all four revenue values and now explicitly says revenue rose through Q3, dropped $36M in Q4, identifies the red Q4 bar as the outlier, and gives the chart’s port-strike explanation.

## Expected ACT-style outcome

**passed** — this is a deliberately close negative example at the target SC boundary. The original
failure context remains, but the information or interaction path required by the criterion is now
available.

## Why this is a useful hard negative

This hard-negative control is intentionally near-identical to failing case-02. Presence-only or static heuristics can easily treat the pair alike; the correct pass depends on verifying the precise repaired boundary: completed the existing chart description with the encoded trend, Q4 outlier, and port-strike cause.

## Citation retained from the source case

**Reference:** WCAG Techniques — G92 (wcag-techniques/general/G92.html)

> The long description would read "Bar Chart showing sales for October. There are 6 salespersons. Maria is highest with 349 units. Frances is next with 301. ... The primary use of the chart is to show leaders, so the description is in sales order."


## GenA11y payload contract

The exact `extract_visual_elements` payload omits the normalized text of every non-self IDREF used by `svg[role="img"][aria-describedby]`, while Chromium exposes that text in the target name or description. The external IDs are intentionally opaque.

**Validated batch:** `initial-79-context-v3`
