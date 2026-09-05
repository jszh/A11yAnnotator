# case-09 — Workspace icon links named by an external visible tool key

## Pair and category

Paired PASS for **case-01**. Batch `context-extraction-26-v4`; category `context-extraction`.

## Exact repair

Keep the icon toolbar and add a visible workspace-tool key outside it, referenced by all three links.

## Primary selector

`.tools a.iconlink[aria-labelledby]`

## Accessibility mechanism

Search workspace, Settings, and Inbox resolve in AX names but are absent from the toolbar-parent extraction.

## GenA11y payload contract

The exact `extract_links` payload must omit the normalized text of every non-self IDREF used by the selected target, while Chromium’s accessibility tree must expose that text in the target name or description. External IDs are intentionally opaque.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required alternative or link purpose.

## Citation

**Reference:** wcag-techniques/html/H30.html

> When an image is the only content of a link, the text alternative for the image describes the unique function of the link.
