# case-13 — Arabic PDF icon link named by an external download instruction

## Pair and category

Paired PASS for **case-05**. Batch `context-extraction-26-v4`; category `context-extraction`.

## Exact repair

Keep the recipe icon and add a visible Arabic PDF-download instruction outside its header, referenced by the link.

## Primary selector

`a.pdf-link[aria-labelledby]`

## Accessibility mechanism

The computed name identifies downloading the chicken-kabsa recipe PDF; the header-parent extraction omits that external instruction.

## GenA11y payload contract

The exact `extract_links` payload must omit the normalized text of every non-self IDREF used by the selected target, while Chromium’s accessibility tree must expose that text in the target name or description. External IDs are intentionally opaque.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required alternative or link purpose.

## Citation

**Reference:** wcag-understanding/link-purpose-in-context.html

> In cases where the link takes one to a document or a web application, the name of the document or web application would be sufficient to describe the purpose of the link (which is to take you to the document or web application).
