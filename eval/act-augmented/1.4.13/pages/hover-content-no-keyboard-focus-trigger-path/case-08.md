# API abbreviation tooltip supports keyboard and pointer interaction

- Expected: `passed`
- Category: Accessibility-tree boundary
- Source pair: `case-02.html` in this aspect
- Exact repair: Kept the same tooltip and content, made the abbreviation a Tab stop, added focus/focus-within reveal, positioned the bubble with a 1px overlap so pointer travel has no dead corridor, retained it while its bubble is hovered, and added Escape dismissal with reset after leaving or blurring.
- Primary selector: `abbr.term[tabindex="0"]`

## Why this passes

The Token Bucket Algorithm detail is available through pointer hover and keyboard focus. It remains open during pointer travel, can be dismissed with Escape without moving focus, and otherwise persists until hover/focus ends.

## Accessibility-tree / interaction evidence

The focusable abbreviation contains the tooltip text in its subtree; computed visibility changes on hover and focus, the bubble overlaps the trigger by 1px and remains visible through pointer travel, and Escape adds the dismissed state while focus remains on the term.

## Why automated tools may miss the boundary

The repaired page retains the suspicious nested tooltip and hover rule. The verdict depends on executing all focus, travel, persistence, and dismissal states.

## Citation

- Document: `wcag-understanding/content-on-hover-or-focus.html`
- Verbatim quote: “Provide a mechanism to easily dismiss the additional content, such as by pressing Escape.”
