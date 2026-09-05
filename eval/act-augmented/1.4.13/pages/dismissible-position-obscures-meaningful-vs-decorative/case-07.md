# case-07 — PASS paired repair of case-01

## Scenario and source pair

This is the counterfactual PASS partner for **case-01** in the same aspect. It preserves the
source page’s domain, layout, content, visual treatment, and interaction complexity. The paired
source scenario is:

> Long-form policy article: an inline glossary-term tooltip (Emissions Trading System) opens downward on hover/focus with no Esc dismiss, landing on the first ~3 lines of the next body paragraph. Method 2 absent, so Method 1 is the only path — and it obscures meaningful body text.

## Exact repair

Added an Escape-controlled dismissed state so the unchanged overlapping glossary tooltip can be cleared without moving hover or keyboard focus. No unrelated target-SC condition was removed.
The HTML includes a machine-readable pairing comment naming case-01 and this repair.

## Primary selector

`#tip-ets`

## Accessibility mechanism

The glossary popup’s content and overlapping placement are unchanged. Pressing Escape forces the tooltip to display:none while the term retains focus, satisfying the dismissal alternative even though the popup obscures prose.

## Expected ACT-style outcome

**passed** — this is a deliberately close negative example at the target SC boundary. The original
failure context remains, but the information or interaction path required by the criterion is now
available.

## Why this is a useful hard negative

This hard-negative control is intentionally near-identical to failing case-01. Presence-only or static heuristics can easily treat the pair alike; the correct pass depends on verifying the precise repaired boundary: added an Escape-controlled dismissed state so the unchanged overlapping glossary tooltip can be cleared without moving hover or keyboard focus.

## Citation retained from the source case

**Reference:** WCAG 2.2 Understanding 1.4.13

> Position the additional content so that it does not obscure any other content including the trigger, with the exception of white space and purely decorative content, such as a background graphic which provides no information.

