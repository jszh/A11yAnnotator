# case-14 — Dosing pictogram named by complete external directions

## Pair and category

Paired PASS for **case-04**. Batch `initial-79-context-v3`; category `context-extraction`.

## Exact repair

Expose the unchanged dosing graphic as an image and replace its vague caption with complete visible directions referenced by aria-labelledby.

## Primary selector

`.schedule svg[role="img"][aria-labelledby]`

## Accessibility mechanism

The image’s computed name supplies every dose and both safety instructions, but the external directions are absent from the isolated SVG payload.

## GenA11y payload contract

The exact `extract_visual_elements` payload must omit the normalized text of every non-self IDREF used by the selected target, while Chromium’s accessibility tree must expose that text in the target name or description.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required alternative or link purpose.

## Citation

**Reference:** refs/trusted-tester/sc-1.1.1-non-text-content.md

> The image is **NOT** the only means of conveying important information.
