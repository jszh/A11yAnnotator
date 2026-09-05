# case-14 — Invoice actions explicitly named by external invoice titles

## Pair and category

Paired PASS for **case-03**. Batch `initial-79-context-v3`; category `context-extraction`.

## Exact repair

Assign each invoice title an ID and combine each action’s own text with the matching title through aria-labelledby.

## Primary selector

`.actions a[aria-labelledby]`

## Accessibility mechanism

All nine names remain action-first and become unique through external invoice context omitted from isolated link snippets.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required relationship or purpose. A target-only extractor can omit the decisive evidence, which is the intended specificity stressor.

## Citation

**Reference:** WCAG Technique H80 (wcag-techniques/html/H80.html)

> The preceding heading provides context for an otherwise unclear link. The description lets a user distinguish this link from links in the web page that lead to other destinations and helps the user determine whether to follow the link.

## GenA11y payload contract

The exact `extract_links` payload omits the normalized text of every non-self IDREF used by `.actions a[aria-labelledby]`, while Chromium exposes that text in the target name or description. The external IDs are intentionally opaque.
