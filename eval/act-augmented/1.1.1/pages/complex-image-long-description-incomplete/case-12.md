# case-12 — Venue map described by complete external spatial directions

## Pair and category

Paired PASS for **case-01**. Batch `context-extraction-26-v4`; category `context-extraction`.

## Exact repair

Keep the venue map and replace its incomplete caption with a complete visible spatial description referenced by aria-describedby.

## Primary selector

`figure > svg[role="img"][aria-describedby="cx-063"]`

## Accessibility mechanism

The AX description exposes venue positions, streets, river, rail line, and travel relationships; the SVG payload omits the external prose.

## GenA11y payload contract

The exact `extract_visual_elements` payload must omit the normalized text of every non-self IDREF used by the selected target, while Chromium’s accessibility tree must expose that text in the target name or description. External IDs are intentionally opaque.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required alternative or link purpose.

## Citation

**Reference:** WCAG Techniques — F67 (wcag-techniques/failures/F67.html)

> While this description provides useful information, it does not convey the same information as the image because it provides no specific location information such as the address or the distance of each location from some fixed point.
