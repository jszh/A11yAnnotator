# case-08 — PASS paired repair of case-01

## Scenario and source pair

This is the counterfactual PASS partner for **case-01** in the same aspect. It preserves the
source page’s domain, layout, content, visual treatment, and interaction complexity. The paired
source scenario is:

> Building-society loan card whose headline rate '19.3% APR Typical Variable' lives only as pixels in a stylesheet background-image SVG; the visible DOM prose says only 'Where else would you find a better interest rate?' (verbatim F3 example 1).

## Exact repair

Added the exact APR and rate type as real DOM text beside the unchanged CSS rate flag. No unrelated target-SC condition was removed.
The HTML includes a machine-readable pairing comment naming case-01 and this repair.

## Primary selector

`p#bestinterest`

## Accessibility mechanism

The CSS background flag is unchanged, but the paragraph now contains “Representative rate: 19.3% APR Typical Variable” as ordinary text. The rate therefore survives the accessibility tree, CSS-background suppression, and forced-colors use.

## Expected ACT-style outcome

**passed** — this is a deliberately close negative example at the target SC boundary. The original
failure context remains, but the information or interaction path required by the criterion is now
available.

## Why this is a useful hard negative

This hard-negative control is intentionally near-identical to failing case-01. Presence-only or static heuristics can easily treat the pair alike; the correct pass depends on verifying the precise repaired boundary: added the exact APR and rate type as real DOM text beside the unchanged CSS rate flag.

## Citation retained from the source case

**Reference:** wcag-techniques/failures/F3.html

> In this example, the image TopRate.png is a 180 by 200 pixel image that contains the text, "19.3% APR Typical Variable."

