# case-15 — Organisation chart described by external reporting relationships

## Pair and category

Paired PASS for **case-07**. Batch `context-extraction-26-v4`; category `context-extraction`.

## Exact repair

Keep the org chart and complete its caption with every reporting relationship, referenced by aria-describedby.

## Primary selector

`figure > svg[role="img"][aria-describedby="cx-066"]`

## Accessibility mechanism

The AX description supplies the hierarchy while the isolated SVG payload contains only the chart title and opaque IDREF.

## GenA11y payload contract

The exact `extract_visual_elements` payload must omit the normalized text of every non-self IDREF used by the selected target, while Chromium’s accessibility tree must expose that text in the target name or description. External IDs are intentionally opaque.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required alternative or link purpose.

## Citation

**Reference:** WCAG Techniques — F67 (wcag-techniques/failures/F67.html)

> Check that the long description serves the same purpose or presents the same information as the non-text content.
