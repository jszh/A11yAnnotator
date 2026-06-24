# case-04 — CSS-only category flyout offset 20px to the right with a diagonal dead-zone; the natural diagonal path collapses the submenu before the cursor arrives (FAIL)

## Scenario
An e-commerce shop has a vertical category sidebar. Hovering a top-level category ("Camp & Hike") reveals
a flyout submenu offset to the right. The reveal is CSS-only: `li.cat:hover > .flyout { visibility:visible }`.
The flyout is a real DOM child of the category, but it is positioned at `left:230px` while the category
row is ~210px wide — leaving a ~20px transparent horizontal corridor between them. Because the flyout is
taller than the parent row, reaching the lower submenu links requires moving the pointer diagonally
down-and-right. That diagonal path passes through the empty area that belongs to *neither* the category
row nor the flyout, so `:hover` on `li.cat` becomes false, the CSS rule stops matching, and the flyout
collapses before the cursor reaches it.

## Attribute tuple
- **Content domain:** e-commerce product browsing
- **UI component / pattern:** mega-menu / flyout submenu (APG menu / disclosure)
- **Host-language construct:** CSS-only `:hover`/`:focus-within` reveal of a nested `.flyout`; absolute positioning with `left:230px` (a horizontal gap) and no JS hover-intent bridge
- **Locale / i18n:** en-US
- **Failure mechanism:** F95 diagonal dead-zone — popup is a DOM descendant but not geometrically contiguous; the natural diagonal travel vector exits both hot-zones and ends the `:hover` state

## Developer persona
A front-end developer themed an off-the-shelf storefront and wanted the flyout to "float" a little off the
sidebar for a card-like look, so they bumped `left` from the sidebar width (210px) to 230px for breathing
room and added a tiny shadow. They knew JS-free menus are "more accessible" and avoided JavaScript on
principle — which also means there is no hover-intent timer or invisible bridging triangle that real
menu libraries use to span the corner. They tested by hovering categories and seeing the flyout appear;
they never tried to move slowly and diagonally onto a *lower* submenu item, which is where the dead-zone
bites.

## Element / selector carrying the issue
`li.cat` (trigger) and its child `.flyout`. The defect is the geometry: `.flyout{left:230px}` against a
210px row, combined with the CSS rule `li.cat:hover > .flyout` and no bridging hot-zone for the corner.

## Exact accessibility mechanism
A user (especially with a tremor, low pointer accuracy, or magnification) hovers "Camp & Hike"; the
flyout opens to the right. To click "Sleeping pads" (a lower item), they move the pointer toward it.
The shortest natural motion is diagonal — down and to the right. Partway, the pointer is below the
category row (no longer over `li.cat`) and still left of the flyout (`left:230px`, not yet over
`.flyout`): it is over neither. `li.cat:hover` evaluates false, `li.cat:hover > .flyout` stops applying,
and the flyout is set back to `visibility:hidden` — it disappears mid-travel. The additional content
cannot be hovered into along the natural path; the Hoverable condition fails. (The menu opens on
`focus-within` too, so this is specifically a hoverable/pointer-travel failure, not a keyboard failure.)

## Expected ACT-style outcome
**failed** (SC 1.4.13, Hoverable; Failure technique F95).

## Why automated tools miss it
No automated tool checks 1.4.13. Worse, the most plausible static heuristic is actively fooled: the
flyout *is* a DOM child of the trigger, so "popup nested inside trigger? then it's probably hoverable"
returns PASS — yet DOM nesting does not imply geometric contiguity here. The markup is a clean nested
`<ul>`/`role=group`, links have good contrast, and `:focus-within` provides keyboard reveal. The failure
is purely spatial: a ~20px corridor plus differing row/flyout heights means the diagonal cursor vector
leaves both `:hover` regions. Judging it requires tracing a realistic diagonal pointer path against the
two bounding boxes and the gap between them — geometry no scanner simulates.

## Citation
**Reference:** WCAG 2.2 Understanding 1.4.13 — Hoverable (`wcag-understanding/content-on-hover-or-focus.html`)
> "A technique to view the content fully in both situations is to move the mouse pointer directly from the trigger onto the new content.  This capability also offers significant advantages for users who utilize screen reader feedback on mouse interactions.  This condition generally implies that the additional content overlaps or is positioned adjacent to the target."

**Reference:** WCAG 2.2 Understanding 1.4.13 — Intent (`wcag-understanding/content-on-hover-or-focus.html`)
> "Examples of such interactions can include custom tooltips, sub-menus and other non-modal popups which display on hover and focus."

**Reference:** WCAG Technique F95 — Tests, Procedure (`wcag-techniques/failures/F95.html`)
> "The pointer can be moved over the new content without the additional content disappearing."
