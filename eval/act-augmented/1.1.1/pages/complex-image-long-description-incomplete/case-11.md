# case-11 — Loan flowchart completed by an external branch description

## Pair and category

Paired PASS for **case-03**. Batch `initial-79-context-v3`; category `context-extraction`.

## Exact repair

Reference a complete visible branch description from the unchanged flowchart instead of leaving the flat node list unassociated.

## Primary selector

`figure > svg[role="img"][aria-describedby]`

## Accessibility mechanism

The accessibility tree exposes both branch decisions and outcomes through aria-describedby, while GenA11y’s SVG-only payload omits that external description.

## GenA11y payload contract

The exact `extract_visual_elements` payload must omit the normalized text of every non-self IDREF used by the selected target, while Chromium’s accessibility tree must expose that text in the target name or description.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required alternative or link purpose.

## Citation

**Reference:** WCAG Techniques — F67 (wcag-techniques/failures/F67.html)

> Without a long description that provides complete information, a person may not be able to comprehend or interact with the web page.
