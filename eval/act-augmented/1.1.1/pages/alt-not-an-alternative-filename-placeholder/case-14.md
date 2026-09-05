# case-14 — Tutorial screenshot named by external instructions

## Pair and category

Paired PASS for **case-05**. Batch `initial-79-context-v3`; category `context-extraction`.

## Exact repair

Keep the screenshot filename alternative but override it with the existing step heading and a visible screenshot-purpose caption.

## Primary selector

`ol.steps figure img[aria-labelledby]`

## Accessibility mechanism

The screenshot’s computed name identifies the Security panel, Two-factor authentication row, and Turn on button; that referenced text is outside the isolated image payload.

## GenA11y payload contract

The exact `extract_visual_elements` payload must omit the normalized text of every non-self IDREF used by the selected target, while Chromium’s accessibility tree must expose that text in the target name or description.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required alternative or link purpose.

## Citation

**Reference:** eval/act-augmented/1.1.1/pages/alt-not-an-alternative-filename-placeholder/case-05.md

> If the text in the "text alternative" cannot be used in place of the non-text content without losing information or function then it fails because it is not, in fact, an alternative to the non-text content.
