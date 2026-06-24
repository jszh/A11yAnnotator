# case-06 — PASS counter-fixture: museum object-label glossary popover that is hoverable, dismissible (doc-level Esc, focus retained), and persistent

## Scenario
An online museum object label for a Japanese lacquer writing box has a dotted-underline
glossary term, **"maki-e"**, inside the materials line. On hover AND on keyboard focus it
opens a definition popover that **overlaps the trigger's own line and covers the body
paragraph below it** — so the "don't obscure" Method 1 is *not* relied upon and the dismiss
mechanism is load-bearing. The component gets all three SC 1.4.13 conditions right:
**Hoverable** (the popover carries its own pointer listeners and overlaps the trigger with no
dead gap, so the pointer can travel from the term onto the popover without it closing),
**Dismissible** via Method 2 (a **document-level** Escape handler hides it **while focus stays
on the term**, and activating the term toggles it closed), and **Persistent** (it never
auto-closes on a timer). This is the single passing counter-fixture that makes the five
failing siblings legible by contrast.

## Attribute tuple
- **content-domain**: online museum / digital-collection object label (not banking, health, docs, gov, or SaaS — distinct from siblings)
- **UI-component/pattern**: inline glossary/definition popover on a superscript-free dotted term
- **host-language construct**: shared hover state across trigger+popover + `document`-scoped Escape + activate-to-toggle, gated by an explicit `dismissed` flag
- **locale/i18n**: en
- **failure-mechanism**: NONE — correct, complete Dismissible/Hoverable/Persistent (control case)

## Developer persona
A museum-CMS front-end engineer who read both SCR39 and the F95 hoverable failure. To avoid
F95 they positioned the popover so it overlaps the term (no gap to "fall into") and gave the
popover its own pointer listeners via a single wrapping hit-box, so leaving the term and
entering the popover are coalesced under one close-timer. For Dismissible they bound Escape to
`document` (so it works regardless of focus location) and made sure the handler does **not**
move focus, then added activate-to-toggle as a documented second dismissal. They tested with a
real mouse (term → popover, it stays) and with the keyboard (focus the term, Escape, watch the
focus ring stay on "maki-e").

## Element / selector carrying the issue
- PASS: `button#term` (the "maki-e" trigger) + popover `#defn` — appears on hover/focus,
  overlaps the trigger and obscures the paragraph below, is hoverable, persistent, and
  dismissible via a document-level Escape (focus retained) and via activating the trigger.

## Exact accessibility mechanism
A low-vision magnifier user hovers "maki-e" and the definition opens, covering the paragraph
below. Because the popover overlaps the term with no dead gap and listens for the pointer
itself, the user can move the pointer **off the term onto the popover** to read text that the
large pointer or a narrow viewport had obscured, and it stays open (Hoverable). It does not
time out while they read (Persistent). When they are done, they press Escape: the
document-level handler hides the popover and **leaves focus exactly where it was — on
"maki-e"** — so they can now pan the magnified viewport over the previously-covered paragraph
without re-triggering anything (Dismissible Method 2). Re-activating the term toggles it
closed as a second documented path. This satisfies all three SC 1.4.13 conditions exactly as
SCR39 prescribes, so the page passes for this aspect.

## Expected ACT-style outcome
**passed** — additional content on hover/focus that is hoverable (pointer can move onto it
without it disappearing), persistent (no auto-timeout), and dismissible without moving
hover/focus away from the trigger (document-level Escape that retains focus, plus
activate-to-toggle).

## Why automated tools miss it
This passing case is statically *indistinguishable* from the five failing siblings: same
`role="tooltip"` popover, same named `<button>` trigger, a `keydown`/Escape listener present
in markup. An automated tool cannot tell that *here* the popover overlaps the trigger with no
gap and has its own pointer listeners (so it is hoverable, where case-06's old self and the
F95 examples were not), that the Escape handler is document-scoped and fires while the trigger
keeps focus and does not move focus, or that nothing auto-closes on a timer. Those are the
exact runtime properties that flip the look-alike handlers in cases 01–05 from fail to pass.
Confirming the pass requires a human to: hover the term and slide the pointer onto the popover
(does it stay?), wait (does it persist?), then focus the term and press Escape (does it clear
*with focus retained*?). The pass/fail boundary is a runtime/scope/geometry judgment, which is
exactly why this aspect is uncovered by automated checkers.

## Citation
> **WCAG 2.2 Understanding 1.4.13 — Hoverable**
> "A technique to view the content fully in both situations is to move the mouse pointer
> directly from the trigger onto the new content.  This capability also offers significant
> advantages for users who utilize screen reader feedback on mouse interactions.  This
> condition generally implies that the additional content overlaps or is positioned adjacent
> to the target."

> **WCAG Technique SCR39 — Tests, Procedure (content that appears on focus)**
> "The content can be closed without moving the focus way from the trigger. Either by
> pressing Esc, by  pressing another other documented keyboard shortcut, or by activating
> the trigger."
