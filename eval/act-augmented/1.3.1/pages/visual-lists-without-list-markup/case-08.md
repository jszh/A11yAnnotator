# case-08 — paired counterfactual PASS for case-02

## Pair and scenario
This page is the passing counterpart of **case-02** in the same aspect. The AllerStop emergency instructions retain the same six numbered, order-critical steps from case-02.

## Exact repair
Change only the list container from ul to ol; all step content and warning text remain.

All other realistic content, presentation, controls, and page structure from case-02 are retained.

## Element / selector
`ol.steps`

## Expected ACT-style outcome
**passed** — SC 1.3.1. The required sequence is now programmatically represented as an ordered list.

## Why this is a hard negative
Both variants contain valid list items and visible numerals; only the ordered-list relationship distinguishes the pass. It is deliberately paired with case-02, so a detector must distinguish the repaired semantic or behavioral boundary rather than rely on the page topic or visual template.

## Citation
**Reference:** refs/trusted-tester/sc-1.3.1-info-and-relationships.md
> **Ordered** (`ol`) — numbered sequentially / hierarchically (1, 2, 2.a, 2.a.i) where sequence or      reference-by-number matters.
