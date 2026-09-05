# case-09 — PASS paired repair of case-02

## Scenario and source pair

This is the counterfactual PASS partner for **case-02** in the same aspect. It preserves the
source page’s domain, layout, content, visual treatment, and interaction complexity. The paired
source scenario is:

> Brightwater Energy tariff comparison whose peak price, off-peak price, standing charge, and average annual bill for three plans are painted as pixels on `canvas#rateChart`. The source canvas has `role="presentation"` and no fallback content, so all pricing data is suppressed from assistive technology.

## Exact repair

Replaced role=presentation on the unchanged tariff canvas with role=img and a complete accessible name containing every tariff value. No unrelated target-SC condition was removed.
The HTML includes a machine-readable pairing comment naming case-02 and this repair.

## Primary selector

`canvas#rateChart[role="img"][aria-label]`

## Accessibility mechanism

The canvas still paints the same comparison, but it is no longer declared decorative. Its accessible name enumerates every plan, unit price, standing charge, and annual bill, so no pricing datum is lost.

## Expected ACT-style outcome

**passed** — this is a deliberately close negative example at the target SC boundary. The original
failure context remains, but the information or interaction path required by the criterion is now
available.

## Why this is a useful hard negative

This hard-negative control is intentionally near-identical to failing case-02. Presence-only or static heuristics can easily treat the pair alike; the correct pass depends on verifying the precise repaired boundary: replaced role=presentation on the unchanged tariff canvas with role=img and a complete accessible name containing every tariff value.

## Citation retained from the source case

**Reference:** wcag-understanding/non-text-content.html

> The intent of this success criterion is to make information conveyed by non-text content accessible through the use of a text alternative. Text alternatives are a primary way for making information accessible because they can be rendered through any sensory modality (for example, visual, auditory or tactile) to match the needs of the user.
