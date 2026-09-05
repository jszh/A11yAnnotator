# case-13 — Duplicate email links named by external purpose phrases

## Pair and category

Paired PASS for **case-03**. Batch `initial-79-actlike-v2`; category `external-reference`.

## Exact repair

Keep both visible “Email us” labels and reference nearby visible purpose phrases with self-first aria-labelledby.

## Primary selector

`.card a[aria-labelledby]`

## Accessibility mechanism

The destination-specific words are outside each anchor but become part of the computed name through IDREFs.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required relationship or purpose. A target-only extractor can omit the decisive evidence, which is the intended specificity stressor.

## Citation

**Reference:** act-rules/extracted/fd3a94.md

> This rule assumes that reading the URL, such as from the status bar when the link is focused, is not considered part of the context, and therefore, it does not disambiguate links.
