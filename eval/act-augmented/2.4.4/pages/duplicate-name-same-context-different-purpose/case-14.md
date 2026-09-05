# case-14 — Buy-now links named by remote plan names

## Pair and category

Paired PASS for **case-04**. Batch `initial-79-context-v3`; category `context-extraction`.

## Exact repair

Give each plan name an ID and combine each Buy now link’s own text with the matching remote plan name.

## Primary selector

`.buyrow a.buy[aria-labelledby]`

## Accessibility mechanism

Each link’s parent contains only “Buy now”; Sprout or Greenhouse resolves in the accessibility tree but is absent from the extracted link context.

## GenA11y payload contract

The exact `extract_links` payload must omit the normalized text of every non-self IDREF used by the selected target, while Chromium’s accessibility tree must expose that text in the target name or description.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required alternative or link purpose.

## Citation

**Reference:** act-rules/extracted/fd3a94.md

> These two HTML a elements have the same accessible name and context, but go to different resources. Their purpose is disambiguated for sighted users by the alignment of the links with the images above.
