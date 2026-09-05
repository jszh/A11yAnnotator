# case-18 — Raw URL named by an external filing title

## Pair and category

Paired PASS for **case-04**. Batch `context-extraction-26-v4`; category `context-extraction`.

## Exact repair

Keep the visible raw URL and add a visible filing title outside its paragraph, referenced after the link’s own text.

## Primary selector

`a.rawlink[aria-labelledby]`

## Accessibility mechanism

The computed name identifies the Northwind Q3 2024 report PDF; the filing title is absent from the extracted parent snippet.

## GenA11y payload contract

The exact `extract_links` payload must omit the normalized text of every non-self IDREF used by the selected target, while Chromium’s accessibility tree must expose that text in the target name or description. External IDs are intentionally opaque.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required alternative or link purpose.

## Citation

**Reference:** WCAG Techniques G91 (wcag-techniques/general/G91.html)

> The objective of this technique is to describe the purpose of a link in the text of the link. ... The URI of the destination is generally not sufficiently descriptive.
