# case-08 — paired counterfactual PASS for case-02

## Pair and scenario
This page is the passing counterpart of **case-02** in the same aspect. The Cedar & Pine FAQ keeps the real h1 and all five styled questions from case-02.

## Exact repair
Replace only the five div.q question labels with h2.q elements.

All other realistic content, presentation, controls, and page structure from case-02 are retained.

## Element / selector
`h2.q`

## Expected ACT-style outcome
**passed** — SC 1.3.1. Each question that titles an answer now participates in the document heading outline.

## Why this is a hard negative
A detector must recognize that the same prominent questions now have real heading semantics. It is deliberately paired with case-02, so a detector must distinguish the repaired semantic or behavioral boundary rather than rely on the page topic or visual template.

## Citation
**Reference:** refs/trusted-tester/sc-1.3.1-info-and-relationships.md
> If ANDI does not identify a visually apparent heading → not defined programmatically.
