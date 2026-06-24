# case-05 — Focusable tab strip of `<div>`s (tabindex=0) exposing a generic role

## Scenario
The **Plumeline Analytics** "Funnel report" has a tab strip below the title: *Overview /
Acquisition / Retention*, drawn as underline tabs. The active tab is darker with a teal
underline; the others are grey. Clicking one switches the panel below. Crucially, each tab is
**keyboard-focusable** — `tabindex="0"`, a visible focus ring, and an `onkeydown` handler so
Enter/Space activate it. This is the harder F42 sub-case: the controls are focusable and fully
operable, yet each is `<div class="tab" tabindex="0" onclick onkeydown>` with **no
`role="tab"` / `role="button"`**, and the wrapper is **not** a `role="tablist"`.

## Attribute tuple
- **content-domain:** SaaS analytics dashboard (funnel / KPI report)
- **UI-component / pattern:** tab strip switching content panels
- **host-language construct:** `<div tabindex="0" onclick onkeydown>` (focusable but role-less; no `role=tab`/`tablist`)
- **locale / i18n:** en-US
- **failure-mechanism:** scripted, focusable element presented as a tab whose exposed role is **generic**; selected state conveyed by colour/underline only (F42)

## Developer persona
A conscientious dashboard engineer who *had heard* "make custom controls keyboard-accessible."
So they added `tabindex="0"` and an Enter/Space `keydown` handler and a focus ring — and
stopped there, believing that focusability plus keyboard operation was the whole job. They
didn't know the ARIA tabs pattern (`role="tablist"`/`tab"/"tabpanel"`, `aria-selected`,
roving tabindex), so the strip is operable but exposes no role and no selected state. Because
it *is* keyboard-reachable, their keyboard smoke-test passed and they considered it done.

## Element / selector carrying the issue
- `.tabs > .tab` — three focusable `<div>` tabs that switch panels but expose a generic role
  with no tab/button semantics, no `aria-selected`, and no enclosing `role="tablist"`. The
  active state is communicated by colour + underline only.

## Exact accessibility mechanism (what AT experiences)
A sighted user sees a standard selected/unselected tab strip and knows exactly which section
is active. A screen-reader user can Tab to each control (they are focusable) but on focus hears
only the label with a **generic** role — no "tab", no "button", no grouping ("tablist, 1 of
3"), and, decisively, **no selected/unselected state**: which tab is active is conveyed solely
by colour and the teal underline. So the user can land on the controls but cannot determine
that they are tabs, that they form one group, or which one is currently chosen. The control
relationship and the selected-state relationship that the styling conveys are not
programmatically determinable — precisely the "focusable thing with no role" failure.

## Expected ACT-style outcome
**failed** — SC 1.3.1 Info and Relationships, F42 emulated-control path: focusable elements
presented as a tab strip expose a generic role (and a colour-only selected state), so the
control and selection relationships are not programmatically determinable.

## Why automated tools miss it
There is **no `role` attribute anywhere**, so the 1.3.1 role-validity rules (4e8ab6, 674b10)
never apply, and the "tablist must contain tabs" structural rule never fires because nothing
claims to be a tablist. The `<div>`s **are** focusable and **are** keyboard-operable, so no
keyboard rule trips either. axe / WAVE / Lighthouse see focusable `<div>`s with click/keydown
handlers and text content — nothing static flags them. Recognising that this is a tab strip
with a selected tab, and that its exposed generic role (and colour-only selection) contradict
that presentation, is human visual reasoning no attribute-driven checker performs.

## Citation
**Reference:** WCAG Techniques — *F42: Failure of Success Criteria 1.3.1, 2.1.1, 2.1.3, or
4.1.2 when emulating links* (`wcag-techniques/failures/F42.html`).

> "This example uses script to make a `div` element behave like a link. Although the author has
> provided complete keyboard access and separated the event handlers from the markup to enable
> repurposing of the content, the `div` element will not be recognized as a link by assistive
> technology."

**Supporting reference:** Trusted Tester v5.1.3 — *SC 1.3.1, Test 10.B (heading-determinable
note on visual-vs-programmatic parity)* (`refs/trusted-tester/sc-1.3.1-info-and-relationships.md`).

> "content styled and functioning like a heading should be programmatically a heading."
