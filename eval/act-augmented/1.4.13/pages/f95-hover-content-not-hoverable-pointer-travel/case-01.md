# case-01 — Billing "?" tooltip rendered 30px below the trigger across a transparent gap, bound only to the trigger's mouseout (FAIL)

## Scenario
A SaaS analytics product's Plan & Billing page has a "?" help button beside the "Seat overage" line
item. Hovering the "?" shows a custom dark tooltip explaining how overage is priced. The tooltip is
positioned 30px *below* the trigger, separated from it by a deliberately transparent 30px spacer
(`.gap`, `pointer-events:none`). Show/hide is wired only to the trigger button's `mouseover`/`mouseout`.
The tooltip element has no hover handler of its own and is not a descendant of the trigger. Moving the
pointer downward to read the tooltip leaves the trigger's box, fires `mouseout`, and the tooltip is
hidden before the pointer can reach it — there is no continuous pointer path that keeps the content
visible.

## Attribute tuple
- **Content domain:** SaaS analytics dashboard — plan & billing
- **UI component / pattern:** icon-button help tooltip (APG tooltip)
- **Host-language construct:** JS `mouseover`/`mouseout` on the trigger toggling `hidden` on a separate `span[role=tooltip]`; an absolutely-positioned empty `.gap` spacer creating physical distance
- **Locale / i18n:** en-US, currency-formatted billing content
- **Failure mechanism:** F95 pure dead-zone — trigger-to-popup geometry is a transparent gap (not adjacency/overlap), and the popup carries no `mouseenter`, so mouseout fires on the travel path

## Developer persona
A mid-level front-end developer building the billing screen wanted the tooltip to "point up at" the
help icon, so they nudged it `top:50px` to leave room for a decorative arrow, then added a small spacer
div to fine-tune the arrow gap. They tested only by hovering the icon and glancing at the tip — they
never tried to *move onto* the tip, because with a normal mouse at default zoom you can read it without
moving. The 30px gap and the trigger-only `mouseout` together make it unhoverable, but that only
surfaces under magnification or with a large pointer.

## Element / selector carrying the issue
`#ov-trigger` (the `button.help`) and its associated `#ov-tip` (`span[role=tooltip]`). The transparent
`.gap` spacer between them and the `top:50px` offset on `[role="tooltip"]` create the dead-zone.

## Exact accessibility mechanism
A low-vision user magnifies the page; the 250px-wide tooltip extends below the magnified viewport, so to
read "...billed at $14/seat/mo, prorated daily. This cycle has 3 overage seats..." the user must move the
pointer down onto the tooltip to pan the magnified view. The moment the pointer leaves the 20px "?"
button — which it must, to travel the 30px down to the tip — the trigger's `mouseout` fires and sets
`tip.hidden = true`. Because the tooltip has no `mouseenter`/`mouseover` handler and is not nested inside
the trigger, nothing re-shows it; the content disappears on the path to it. The Hoverable condition
("additional content which may appear on hover of a target may also be hovered itself") is violated.

## Expected ACT-style outcome
**failed** (SC 1.4.13, Hoverable; matches Failure technique F95).

## Why automated tools miss it
axe-core, WAVE, and Lighthouse ship no 1.4.13 hoverable/dismissible/persistent rule at all. Every
attribute a linter could check is correct here: a real `<button>` trigger, `role="tooltip"`,
`aria-describedby` wiring, `aria-label`, the tip also appears on `focus`, and the visible text has ~16:1
contrast. A static "does a tooltip toggle on hover?" heuristic returns PASS. The failure is purely
geometric and behavioral: it requires mentally tracing the pointer from the 20px trigger downward across
a 30px *transparent* gap and reasoning that `mouseout` fires before the pointer reaches the tip. No
static scanner simulates pointer travel or measures the dead-zone between trigger and popup.

## Citation
**Reference:** WCAG 2.2 Understanding 1.4.13 — Hoverable (`wcag-understanding/content-on-hover-or-focus.html`)
> "The intent of this condition is to ensure that additional content which may appear on hover of a target may also be hovered itself.  Content which appears on hover can be difficult or impossible to perceive if a user is required to keep their mouse pointer over the trigger."

**Reference:** WCAG 2.2 Understanding 1.4.13 — Hoverable (`wcag-understanding/content-on-hover-or-focus.html`)
> "A technique to view the content fully in both situations is to move the mouse pointer directly from the trigger onto the new content.  This capability also offers significant advantages for users who utilize screen reader feedback on mouse interactions.  This condition generally implies that the additional content overlaps or is positioned adjacent to the target."

**Reference:** WCAG Technique F95 — Examples (`wcag-techniques/failures/F95.html`)
> "A pop-up opens on pointer hover. Due to the chosen screen magnification, the content is only partially visible. However, as soon as the pointer is moved away from the trigger towards the pop-up content so it can be read, the pop-up automatically closes."
