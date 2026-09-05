# case-16 — Format links explicitly named by remote definition terms

## Pair and category

Paired PASS for **case-06**. Batch `initial-79-context-v3`; category `context-extraction`.

## Exact repair

Give each format link an ID and combine its own format text with the preceding document-name term.

## Primary selector

`dl dd a[aria-labelledby]`

## Accessibility mechanism

GenA11y does not treat a definition list as an extraction ancestor, so the referenced Arabic document term is absent from every DD/link snippet while present in the computed name.

## GenA11y payload contract

The exact `extract_links` payload must omit the normalized text of every non-self IDREF used by the selected target, while Chromium’s accessibility tree must expose that text in the target name or description.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required alternative or link purpose.

## Citation

**Reference:** WCAG 2.2 Understanding Link Purpose (In Context) (wcag-understanding/link-purpose-in-context.html)

> This can be achieved by putting the description of the link in
