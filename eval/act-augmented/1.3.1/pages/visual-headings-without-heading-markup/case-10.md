# case-10 — paired heading-context hard negative for case-05

## Pair and category
Full counterpart of **case-05**. Batch `gena11y-fp-50-v2`; category `heading-context-or-explicit-name`.

## Exact repair
Change only the visually heading-like “Method” and “Notes & Substitutions” `div`s to `h2`s, preserving their shared class, copy, order, and styling.

## Selector and mechanism
`h2.step-head` — all three peer recipe sections now appear in the heading outline with names matching their visible labels.

## Expected outcome
**passed** — SC 1.3.1.

## Why tools may miss
The repaired and failed headings render alike. The pass requires reconciling visual section context with effective heading roles rather than counting one existing `h2`.

## Citation
**Reference:** `refs/trusted-tester/sc-1.3.1-info-and-relationships.md`
> Each programmatically determinable heading is serving as a visual heading ... AND each visual heading is programmatically defined.
