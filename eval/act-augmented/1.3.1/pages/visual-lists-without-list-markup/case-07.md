# case-07 — paired counterfactual PASS for case-01

## Pair and scenario
This page is the passing counterpart of **case-01** in the same aspect. The Verdant product page retains the same six visibly bulleted features from case-01.

## Exact repair
Replace only the paragraph, literal bullets, and br separators with ul/li markup.

All other realistic content, presentation, controls, and page structure from case-01 are retained.

## Element / selector
`ul.features`

## Expected ACT-style outcome
**passed** — SC 1.3.1. The six related features now expose unordered-list grouping and item count.

## Why this is a hard negative
The visible bullets and text are unchanged, making this a direct semantic counterfactual. It is deliberately paired with case-01, so a detector must distinguish the repaired semantic or behavioral boundary rather than rely on the page topic or visual template.

## Citation
**Reference:** refs/trusted-tester/sc-1.3.1-info-and-relationships.md
> 1. All content with the visual appearance of a list is defined programmatically as a list, by type:    a. Unordered list (with/without bullets) → `ul`; b. Ordered list → `ol`; c. Terms+descriptions → `dl`.
