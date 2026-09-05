# case-11 — Social icon links named by an external visible network key

## Pair and category

Paired PASS for **case-03**. Batch `context-extraction-26-v4`; category `context-extraction`.

## Exact repair

Keep the four social icons and add visible network names outside the navigation, referenced by each link.

## Primary selector

`nav.social a[aria-labelledby]`

## Accessibility mechanism

Each AX name identifies its network, while the social-nav extraction contains only opaque references and SVGs.

## GenA11y payload contract

The exact `extract_links` payload must omit the normalized text of every non-self IDREF used by the selected target, while Chromium’s accessibility tree must expose that text in the target name or description. External IDs are intentionally opaque.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required alternative or link purpose.

## Citation

**Reference:** wcag-understanding/link-purpose-in-context.html

> It is also a best practice for links with different purposes and destinations to have different link text.
