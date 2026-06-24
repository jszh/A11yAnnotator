# case-03 — Analytics metric-definition popover dismissible only by Tab-into the X button

## Scenario
A SaaS analytics dashboard shows a "Cart-to-purchase conversion" KPI with a "?" badge.
Focusing or hovering the badge opens a definition popover that **covers the device-breakdown
list** beneath it. The popover is hoverable and persistent (good), but its **only** dismiss
affordance is a close ("×") button positioned *inside* the popover. To press it, a keyboard
user must Tab forward — **moving focus off the trigger and into the additional content**.
There is no Escape handler and activating the trigger does not toggle it. SCR39 requires the
content be closable *without moving focus away from the trigger*; dismissing here is
impossible unless focus enters the pop-up — which can itself re-obscure or disorient.

## Attribute tuple
- **content-domain**: SaaS analytics dashboard (conversion funnel)
- **UI-component/pattern**: KPI metric "definition" popover with internal close button
- **host-language construct**: in-popover `<button aria-label="Close">` as sole dismiss path
- **locale/i18n**: en
- **failure-mechanism**: close affordance reachable only by Tab-into the popup (focus must move into content)

## Developer persona
A product engineer modeled the popover on a modal-dialog pattern they'd built before —
"every dismissible thing has an × in the corner." For a true modal that's fine because focus
is *supposed* to move into it. They reused the muscle memory for a hover/focus tooltip,
where SC 1.4.13 instead demands you can dismiss *without* moving focus into the content. The
× looks like thorough, accessible work; nobody questioned that it forces focus off the
trigger.

## Element / selector carrying the issue
- FAIL: popover `#defPop` and its close button `#defClose` — the only dismissal requires
  Tab-ing focus from `#defBadge` (the trigger) into the popover. No `keydown`/Escape path
  exists.

## Exact accessibility mechanism
A magnifier user focuses the "?" badge to read how conversion is computed. The popover opens
and covers the Desktop/Mobile/Tablet breakdown. To clear it, the user must Tab into the
popover to reach the × — but the moment focus enters the pop-up, the magnified viewport
follows focus *into* the popover, which can re-center the obscuring content over the very
data they wanted to read, and they have lost the trigger as an anchor. The SC's Dismissible
condition exists precisely so the user can keep focus on the trigger and just press Escape.
Because no such no-move dismiss exists, the page fails. A sighted mouse user is fine (they
click the ×); the barrier is specific to keyboard/low-vision operation.

## Expected ACT-style outcome
**failed** — obscuring content on focus/hover with the only dismiss path requiring focus to
move into the additional content, violating "closed without moving the focus away from the
trigger."

## Why automated tools miss it
The popover has an explicitly labelled close button (`aria-label="Close definition"`), valid
`role="tooltip"`, and a named trigger — so every automated check passes, and a scanner that
looks for "is there a close button?" would wrongly mark this as dismissible. No tool can
judge that reaching that button *requires moving focus into the content*, which is the exact
condition SCR39 forbids. The discriminator — "can the user dismiss this while focus stays on
the trigger?" — requires a human to focus the trigger, attempt Escape (nothing), and reason
that Tab-ing to the × violates the no-move rule. That is interaction-and-scope judgment, not
a static property.

## Citation
> **WCAG Technique SCR39 — Tests, Procedure (content that appears on focus)**
> "The content can be closed without moving the focus way from the trigger. Either by
> pressing Esc, by  pressing another other documented keyboard shortcut, or by activating
> the trigger."

> **WCAG 2.2 Understanding 1.4.13 — Dismissible**
> "They need a keyboard method of dismissing something that is obscuring the current focal
> area."
