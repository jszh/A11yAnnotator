# case-03 — Analytics column-glossary popup closes on grid scroll (disallowed reason) while hover retained

## Scenario
A SaaS analytics "cohort retention" grid has dotted-underline column-header terms ("W1
retention", "W4 retention"). On hover/focus each reveals a `role="tooltip"` definition.
The grid body scrolls inside a fixed-height container with a **sticky header**, so the
term and the pointer stay in view while you scroll the rows. A `scroll` listener on the
container hides the popup the instant the user nudges the grid to read a lower row — even
though hover/focus on the term is retained and the definition is still valid.

## Attribute tuple
- **content-domain**: SaaS analytics dashboard (cohort retention table)
- **UI-component/pattern**: data-grid header glossary tooltip (sticky-header scroller)
- **host-language construct**: `role="button"` term + `role="tooltip"` + container `scroll` handler
- **locale/i18n**: en
- **failure-mechanism**: content closes for a disallowed reason (scroll), hover retained

## Developer persona
A dashboard dev tried to "reposition tooltips on scroll" so they wouldn't detach from a
sticky header, but only shipped the hide half of the plan (hide-on-scroll, never
re-show). With a sticky header the trigger never leaves the viewport, so the hide fires
while the user is still hovering the term.

## Element / selector carrying the issue
- `.gloss[role="tooltip"]` (e.g. `#g-w1`, `#g-w4`) — hidden by the `#grid` `scroll` handler.
- Triggers: `span.term[role="button"]` in the sticky `<thead>`.

## Exact accessibility mechanism
The popups appear on hover and focus, are hoverable, and respond to Esc — Hoverable and
Dismissible pass. Persistent requires the content to end only on lost hover/focus,
user-dismiss, or info-invalidation. Here the close is triggered by scrolling, which is
none of those: the sticky header keeps the term under the pointer (hover retained) and the
definition ("share active in days 22–28…") is still true. A low-vision magnifier user
typically scrolls/pans to read a large grid; doing so destroys the very definition they
were reading. AT-wise, a sighted-magnifier or pointer user watching the rendered popup
sees it vanish for a disallowed reason (a scroll event), not because they left the trigger.

## Expected ACT-style outcome
**failed** — content disappears for a disallowed reason (scroll) while hover/focus
retained and information still valid (1.4.13 Persistent).

## Why automated tools miss it
Markup is clean: `role="button"` triggers, `role="tooltip"` content, `aria-describedby`,
hover+focus+Esc handling, hoverable popups. Every static rule passes. The defect is a
scroll event handler that hides still-valid content while the trigger remains hovered —
no scanner scrolls a sub-container while holding a hover and re-checks tooltip visibility.
A reviewer must reason that hover was not relinquished and the info is still valid, so the
scroll-triggered close is a disallowed persistence-end.

## Citation
> **WCAG 2.2 Understanding 1.4.13 — Persistent:** "Once it appears, the content should
> remain visible until: The user removes hover or focus from the trigger and the
> additional content, consistent with the typical user experience; The user dismisses the
> additional content via the mechanism provided to satisfy the Dismissible condition; or
> The information conveyed by the additional content becomes invalid, such as a 'busy'
> message that is no longer valid." (wcag-understanding/content-on-hover-or-focus.html)

> **WCAG 2.2 Understanding 1.4.13 — Dismissible (magnifier panning rationale):** "Mouse
> users frequently move the pointer to pan the magnified viewport and display another
> portion of the screen." (wcag-understanding/content-on-hover-or-focus.html)
