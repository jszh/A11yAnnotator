# case-14 — Clinical scatter plot described by external findings

## Pair and category

Paired PASS for **case-05**. Batch `context-extraction-26-v4`; category `context-extraction`.

## Exact repair

Keep the plot and extend its caption with the correlation and outlier-cluster findings, referenced by aria-describedby.

## Primary selector

`figure > svg[role="img"][aria-describedby="cx-065"]`

## Accessibility mechanism

Chromium exposes the positive correlation and seven-participant slow-metaboliser cluster; GenA11y’s SVG payload omits the caption.

## GenA11y payload contract

The exact `extract_visual_elements` payload must omit the normalized text of every non-self IDREF used by the selected target, while Chromium’s accessibility tree must expose that text in the target name or description. External IDs are intentionally opaque.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required alternative or link purpose.

## Citation

**Reference:** WCAG Techniques — G95 (wcag-techniques/general/G95.html)

> this technique is used to provide a short text alternative that briefly describes the non-text content. (A long text alternative is then provided using another technique such that the combination serves the same purpose and presents the same information as the original non-text content.)
