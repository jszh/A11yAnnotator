# case-18 — Order-action icons named by visible sibling labels

## Pair and category

Paired PASS for **case-06**. Batch `context-extraction-26-v4`; category `context-extraction`.

## Exact repair

Keep both action graphics, replace their internal shape titles with visible purpose labels, and reference those siblings from each SVG and button.

## Primary selector

`button.ctl svg[aria-labelledby^="cx-"]`

## Accessibility mechanism

Cancel order and Track driver are exposed in the AX names but omitted from each isolated SVG payload.

## GenA11y payload contract

The exact `extract_visual_elements` payload must omit the normalized text of every non-self IDREF used by the selected target, while Chromium’s accessibility tree must expose that text in the target name or description. External IDs are intentionally opaque.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required alternative or link purpose.

## Citation

**Reference:** wcag-understanding/non-text-content.html

> For non-text content that is a control or accepts user input, such as images used as submit buttons, image maps or complex animations, a name is provided to describe the purpose of the non-text content so that the person at least knows what the non-text content is and why it is there.
