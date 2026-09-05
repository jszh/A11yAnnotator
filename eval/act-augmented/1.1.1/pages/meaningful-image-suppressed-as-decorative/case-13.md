# Verification badge is redundant with visible status text

- Expected: `passed`
- Category: Redundant graphic or visual cue
- Source pair: `case-01.html` in this aspect
- Exact repair: Retained the hidden green check badge and added visible “Verified seller” text in the same seller row.
- Primary selector: `.seller-row .seller-status`

## Why this passes

The listing-specific verification status is now directly available to sighted and non-sighted users. The checkmark is only redundant decoration and may remain hidden.

## Accessibility-tree / visual evidence

The tree exposes “Verified seller” immediately beside the seller name while the presentational SVG stays absent.

## Why automated tools may miss the boundary

Correctness depends on comparing the badge's contextual meaning with the new status text, not merely seeing `aria-hidden`.

## Citation

- Document: `wcag-techniques/failures/F39.html`
- Verbatim quote: “When an image is used for decoration, spacing or other purpose that is not part of the meaningful content in the page then the image has no meaning and should be ignored by assistive technologies.”
