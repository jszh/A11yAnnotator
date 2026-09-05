# Search icon is named for its action

- Expected: `passed`
- Category: Accessibility evidence omitted
- Source pair: `case-02.html` in this aspect
- Exact repair: Added `aria-label="Search catalogue"` to the submit button and made its now-redundant magnifying-glass image decorative with `alt=""`.
- Primary selector: `form.search button[value="quick"][aria-label="Search catalogue"]`

## Why this passes

The unchanged icon still depicts a magnifying glass, while the control's computed name now communicates what activating it does.

## Accessibility-tree / visual evidence

The target is exposed as a button named “Search catalogue”; its child image contributes no competing shape description.

## Why automated tools may miss the boundary

Both versions have a named button. The hard distinction is whether the name describes the icon or the control's contextual purpose.

## Citation

- Document: `wcag-techniques/general/G94.html`
- Verbatim quote: “A search button uses an image of a magnifying glass.  The text alternative is "search" and not "magnifying glass".”
