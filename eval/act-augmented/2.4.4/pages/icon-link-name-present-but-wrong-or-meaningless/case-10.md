# case-10 — Back-arrow link named by the external article-navigation link

## Pair and category

Paired PASS for **case-02**. Batch `context-extraction-26-v4`; category `context-extraction`.

## Exact repair

Keep the back-arrow link and reference the existing fully named Transit stories link at the end of the article.

## Primary selector

`.artnav > a.iconnav[aria-labelledby]`

## Accessibility mechanism

The top icon link computes to Back to all Transit stories, but its extracted artnav parent omits the remote pager link.

## GenA11y payload contract

The exact `extract_links` payload must omit the normalized text of every non-self IDREF used by the selected target, while Chromium’s accessibility tree must expose that text in the target name or description. External IDs are intentionally opaque.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required alternative or link purpose.

## Citation

**Reference:** wcag-understanding/link-purpose-in-context.html

> The text of, or associated with, the link is intended to describe the purpose of the link.
