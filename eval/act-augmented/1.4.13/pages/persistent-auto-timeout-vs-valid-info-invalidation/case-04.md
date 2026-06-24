# case-04 — Seed-shop badge popup auto-fades to opacity:0 via pure CSS @keyframes while hovered (no JS timer)

## Scenario
An e-commerce product page ('Cherokee Purple' heirloom tomato seeds) has pill "badge"
triggers ("Hardiness zone", "Shipping & viability"). On hover/focus each reveals a
`role="tooltip"` with multi-sentence guidance. The auto-dismiss is implemented entirely in
CSS: a `@keyframes peekThenVanish` animation runs on `:hover`/`:focus` that starts at
`opacity:1`, holds, then animates to `opacity:0` with `animation-fill-mode: forwards`. So
after ~3.5 seconds the popup is invisible **while the badge is still hovered/focused** —
and there is **no `setTimeout`/`setInterval` anywhere** for a source grep to find.

## Attribute tuple
- **content-domain**: e-commerce product & checkout (garden-seed storefront)
- **UI-component/pattern**: icon/pill badge tooltip
- **host-language construct**: CSS `@keyframes` + `animation-fill-mode: forwards` (no JS)
- **locale/i18n**: en
- **failure-mechanism**: pure-CSS time-based auto-fade to opacity:0 while hover/focus retained

## Developer persona
A designer building the page in a visual/no-code-style workflow added a tasteful "fade
in, then gently fade out" entrance/exit animation to the tooltips for polish, not
realizing the exit half makes the content auto-dismiss on a timer. Because it is CSS, the
back-end dev's "no auto-hide timers in the JS" review never caught it.

## Element / selector carrying the issue
- `.pop[role="tooltip"]` (`#zonePop`, `#shipPop`) — animated to `opacity:0` by
  `@keyframes peekThenVanish` under `.badge:hover .pop`, `.badge:focus .pop`.
- Triggers: `span.badge[role="button"]`.

## Exact accessibility mechanism
The popups appear on hover and focus, are positioned adjacent, are hoverable
(`pointer-events:auto`), and never obscure the trigger — Hoverable passes and the
markup/names/roles are valid. Persistent requires the content to stay until lost
hover/focus, user-dismiss, or info-invalidation. Here the CSS animation drives the popup
to fully transparent after ~3.5s while the user is still hovering/focused and the
zone/germination information is still valid. A low-vision magnifier user — exactly the
user the Persistent condition exists for, who needs extra seconds to change magnification
and pan onto the popup — watches it fade out before they finish reading the frost/zone
guidance. AT-wise, the visual content is gone for a disallowed reason (elapsed animation
time), with no user action.

## Expected ACT-style outcome
**failed** — content auto-closes after a time (via CSS animation) while hover/focus
retained and information still valid (1.4.13 Persistent).

## Why automated tools miss it
This is the trap variant: there is no JS timer, so a tool or reviewer grepping for
`setTimeout`/`setInterval` finds nothing and might wrongly pass the page. The auto-dismiss
lives in a CSS `@keyframes` animating to `opacity:0` with `animation-fill-mode:forwards`.
axe/WAVE/Lighthouse see valid `role="tooltip"` markup, correct names/roles, hover+focus
triggers, and a hoverable popup; CSS animation timing/opacity over time is invisible to
static analysis. Only a human watching the rendered timeline sees still-valid, still-
hovered content fade away.

## Citation
> **WCAG Technique SCR39 — Tests, Procedure (hover #2):** "The additional content stays
> visible and does not automatically close after a time."
> (wcag-techniques/client-side-script/SCR39.html)

> **WCAG 2.2 Understanding 1.4.13 — Persistent (intent):** "The intent of this condition
> is to ensure users have adequate time to perceive the additional content after it
> becomes visible. Users with disabilities may require more time for many reasons, such as
> to change magnification, move the pointer, or simply to bring the new content into their
> visual field." (wcag-understanding/content-on-hover-or-focus.html)
