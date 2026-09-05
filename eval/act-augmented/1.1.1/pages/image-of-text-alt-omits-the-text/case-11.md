# case-11 — Promotion image named by a complete external transcript

## Pair and category

Paired PASS for **case-01**. Batch `initial-79-context-v3`; category `context-extraction`.

## Exact repair

Keep the generic banner alternative and add a visible, externally referenced transcript containing every word in the promotion image.

## Primary selector

`img.hero[aria-labelledby]`

## Accessibility mechanism

The accessible image name contains the offer, code, and deadline, but GenA11y sends only the image element and omits the transcript paragraph.

## GenA11y payload contract

The exact `extract_visual_elements` payload must omit the normalized text of every non-self IDREF used by the selected target, while Chromium’s accessibility tree must expose that text in the target name or description.

## Expected ACT-style outcome

**passed** — the complete rendered page and accessibility tree expose the required alternative or link purpose.

## Citation

**Reference:** refs/trusted-tester/sc-1.1.1-non-text-content.md

> If the image is of **meaningful text**, ANDI Output must contain the **same text**.
