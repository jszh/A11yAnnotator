# case-06 — Government form "?" tooltip with a shared hover region (wrapper-keyed reveal) and a popup that is itself hoverable; the content survives the trigger→popup pointer path (PASS)

## Scenario
A municipal "Apply for a residential parking permit" form has a "?" help button beside the "Parking
zone" select. This is the deliberate PASS anchor for the F95 aspect, built on the *same* component family
as the failing cases so PASS vs FAIL can both be grounded. The trigger button and the tooltip live in one
wrapper (`.help`), and show/hide is keyed to the *wrapper's* `mouseenter`/`mouseleave` (and
`focusin`/`focusout`). The wrapper's bounding box encloses both the button and the tooltip, so a
continuous pointer path from button to tooltip never leaves the hovered region. The tooltip is positioned
adjacent/overlapping (4px overlap, no transparent gap), has `pointer-events:auto`, and carries its own
`mouseenter` that keeps it open. A 120ms hide delay tolerates the sub-element transition. Esc dismisses it
without moving the pointer.

## Attribute tuple
- **Content domain:** government / civic services portal (parking permit application)
- **UI component / pattern:** icon-button help tooltip beside a form field (APG tooltip)
- **Host-language construct:** JS reveal keyed to a wrapper enclosing both trigger and popup; popup with `pointer-events:auto` + its own `mouseenter`; `setTimeout` hide-delay; Esc handler
- **Locale / i18n:** en-GB/US civic English
- **Failure mechanism (inverted):** none — shared hover region + hoverable popup + no dead-zone means the additional content can itself be hovered; satisfies the Hoverable condition

## Developer persona
An accessibility-aware government-contractor developer implemented the tooltip from the WAI-ARIA tooltip
pattern and the SCR39 sufficient technique. They deliberately wrapped the button and popup in one element
and bound hover to the wrapper so the whole "button + tip" forms a single hover region, added a short
close delay so the tip doesn't flicker as the pointer crosses from button to tip, made the tip itself
hoverable, and wired Esc to dismiss. They tested by moving the pointer onto the tip (it stays) and by
pressing Esc (it closes) — i.e., they actually performed the pointer-travel simulation.

## Element / selector carrying the issue
`#zone-help` (the `.help` wrapper that is the shared hover region), `#zone-trigger` (the button), and
`#zone-tip` (`role=tooltip`). The passing properties are: reveal keyed to the wrapper, `.tip { bottom:
calc(100% - 4px) }` (overlap, no gap), `.tip { pointer-events:auto }` plus a `tip.mouseenter` handler,
and the 120ms hide delay.

## Exact accessibility mechanism
A low-vision user hovers the "?" button; the tooltip opens overlapping it. To read the full text under
magnification, the user moves the pointer up onto the tooltip. The pointer travels from the button into
the tooltip while staying inside the `.help` wrapper the whole time, so the wrapper's `mouseleave` never
fires for a region outside the component; even at the exact button→tip boundary, the 120ms delay plus the
tooltip's own `mouseenter` (which calls `open()` and clears the pending close) keep it visible. The user
can rest the pointer on the content and read all of it. Pressing Esc closes it without moving the pointer
(Dismissible) and it never auto-closes on a timer (Persistent). The Hoverable condition is satisfied:
"additional content which may appear on hover of a target may also be hovered itself."

## Expected ACT-style outcome
**passed** (SC 1.4.13, Hoverable; aligns with sufficient technique SCR39).

## Why automated tools miss it
No automated engine evaluates 1.4.13, so a tool can neither flag nor *confirm* this PASS — it is silent
either way. Confirming the page actually passes requires a human to trace the pointer from the button
onto the tooltip and verify that the shared hover region, the popup's own `mouseenter`, and the hide
delay keep the content visible across the transition (and that Esc dismisses it). That is the same
pointer-travel simulation the failing cases demand, here resolving to PASS — which is exactly why a
correct PASS and a subtle FAIL look nearly identical to a scanner and can only be distinguished by human
geometric/behavioral judgment.

## Citation
**Reference:** WCAG 2.2 Understanding 1.4.13 — Hoverable (`wcag-understanding/content-on-hover-or-focus.html`)
> "A technique to view the content fully in both situations is to move the mouse pointer directly from the trigger onto the new content.  This capability also offers significant advantages for users who utilize screen reader feedback on mouse interactions.  This condition generally implies that the additional content overlaps or is positioned adjacent to the target."

**Reference:** WCAG Technique SCR39 — Tests, Procedure (`wcag-techniques/client-side-script/SCR39.html`)
> "The pointer can be moved over the additional content without the additional content disappearing."

**Reference:** WCAG Technique SCR39 — Description (`wcag-techniques/client-side-script/SCR39.html`)
> "web authors should therefore ensue that additional content stays visible when the pointer moves away from the trigger to the (mostly adjacent) additional content."
