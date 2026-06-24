# case-01 — Wire-limit help tooltip auto-hides after 4s while still hovered/focused

## Scenario
A business-banking "New wire transfer" form has a circular `?` help button next to the
Amount field. On hover or keyboard focus it reveals a `role="tooltip"` explaining the
$25,000 daily wire limit. The tooltip is hoverable and Esc-dismissible — but a
`setTimeout(…, 4000)` removes it four seconds after it appears, **even while the trigger
is still hovered or focused**. A low-vision magnifier user who needs those seconds to
pan onto the tip and read the limit loses it mid-read.

## Attribute tuple
- **content-domain**: online banking / fintech dashboard (business wire transfer)
- **UI-component/pattern**: APG tooltip on an icon help button
- **host-language construct**: `<button>` trigger + `role="tooltip"` + `setTimeout` auto-hide
- **locale/i18n**: en
- **failure-mechanism**: time-based auto-dismiss (`setTimeout`) while hover/focus retained

## Developer persona
A fintech front-end dev copied a "self-cleaning tooltip" snippet from Stack Overflow
that auto-hides after a few seconds to "avoid orphaned tooltips piling up." It worked in
their quick mouse test (they moved on before 4s), so the timer that breaks Persistent
shipped unnoticed.

## Element / selector carrying the issue
- `#limitTip[role="tooltip"]` — removed by the `setTimeout(…, 4000)` in `showTip()`.
- Trigger: `button#limitHelp.help`.

## Exact accessibility mechanism
The tooltip appears correctly on both pointer hover and keyboard focus, is hoverable, and
responds to Esc — so Dismissible and Hoverable pass. The Persistent condition requires the
content to stay visible until the user removes hover/focus, dismisses it, or its
information becomes invalid. Here a timer hides it after 4 seconds with the user still
hovering/focused and the limit information still fully valid. A magnifier user (small
viewport, needs to move the pointer onto the tip) or a cognitively-fatigued user reading
slowly never gets to finish. AT-wise: a screen-reader user who focuses the button hears
the described text, but a sighted-magnifier user watching the rendered popup sees it
vanish for a disallowed reason (elapsed time, not lost hover/focus).

## Expected ACT-style outcome
**failed** — auto-closes after a time while hover/focus retained (SCR39 hover-check #2 /
focus-check #1).

## Why automated tools miss it
axe/WAVE/Lighthouse see well-formed `role="tooltip"`, a real `<button>` with an accessible
name, `aria-describedby`, hover+focus triggers, a hoverable popup, and an Esc handler —
every static check passes. The defect is purely temporal: a 4-second timer removes the
content while it is still valid and still hovered. A scanner cannot distinguish this
disallowed auto-dismiss from a legitimate information-invalidation (case-05/case-06); that
needs a human watching the timeline and reasoning about whether the info is still valid.

## Citation
> **WCAG Technique SCR39 — Tests, Procedure (hover #2 / focus #1):** "The additional
> content stays visible and does not automatically close after a time."
> (wcag-techniques/client-side-script/SCR39.html)

> **WCAG 2.2 Understanding 1.4.13 — Persistent:** "Once it appears, the content should
> remain visible until: The user removes hover or focus from the trigger and the
> additional content … The user dismisses the additional content … or The information
> conveyed by the additional content becomes invalid, such as a 'busy' message that is no
> longer valid." (wcag-understanding/content-on-hover-or-focus.html)
