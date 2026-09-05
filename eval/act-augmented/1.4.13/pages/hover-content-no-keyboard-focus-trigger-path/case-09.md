# Analytics metric tooltip has equivalent focus behavior

- Expected: `passed`
- Category: Accessibility-tree boundary
- Source pair: `case-03.html` in this aspect
- Exact repair: Kept the focusable help button and full attribution tooltip, positioned the fixed popup with a 1px overlap so there is no pointer dead corridor, and added focus reveal, popup-hover persistence, delayed boundary closure as backup, and Escape dismissal.
- Primary selector: `button#conv-help[aria-describedby="metric-tip"]`

## Why this passes

Pointer and keyboard users receive the identical seven-day attribution explanation. The popup remains available during pointer travel, persists while focus or hover is relevant, and Escape closes it without moving focus.

## Accessibility-tree / interaction evidence

The button remains named “What counts as a conversion?” and references the full tooltip. Focus shows it, the popup overlaps the trigger by 1px, moving onto it keeps it visible beyond the backup delay, and Escape hides it while the button stays focused.

## Why automated tools may miss the boundary

Static markup is nearly identical to the source; only complete runtime state testing establishes the pass.

## Citation

- Document: `wcag-techniques/client-side-script/SCR39.html`
- Verbatim quote: “The additional content stays visible and does not automatically close after a time.”
