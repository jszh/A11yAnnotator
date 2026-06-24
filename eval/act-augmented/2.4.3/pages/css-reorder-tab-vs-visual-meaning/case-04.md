# case-04 — Gov parking permit: left nav authored after main, CSS-positioned left, main tabs first (PASS)

## Scenario
A municipal "Apply for a Residential Parking Permit" page for the City of Aldergrove. It
renders as a classic two-column layout: a left-hand **"Parking services"** navigation
sidebar and a wide **main application form** on the right. The nav is authored in the HTML
**after** the `<main>`, and CSS Grid (`grid-template-areas`) paints the nav into the left
column while the form goes to the right. With **no positive tabindex and no script**, the
keyboard Tab sequence reaches the **main content (the permit form) first**, and only after
the form does it enter the secondary nav links. This is the **exact passing technique the
Understanding describes** ("left hand navigation occurring in the HTML after the main body
content, and styled with CSS to appear on the left hand side"). It is a deliberate PASS /
boundary case.

## Attribute tuple
- **content-domain:** government / civic services portal
- **UI-component / pattern:** left-nav sidebar + main task form (source-order trick)
- **host-language construct:** CSS Grid `grid-template-areas:"nav main"` with `<main>` authored before `<nav>` in the DOM; no `tabindex`, no JS
- **locale / i18n:** en-CA / en-US municipal English
- **failure-mechanism:** NONE — intentional source-order technique to put main content first in the tab order; meaning/operation preserved

## Developer persona
An experienced government web developer who has read WCAG's Understanding documents.
Knowing that keyboard and screen-reader users benefit from reaching the page's primary
task before wading through repeated section navigation, they deliberately placed the
`<main>` before the `<nav>` in the source and used CSS Grid to position the nav on the
left visually. This is a textbook, intentional accessibility technique — not a mistake.

## Element / selector carrying the issue
`nav.sidenav` (DOM-second, painted left via `grid-area:nav`) and `main.content`
(DOM-first, painted right via `grid-area:main`). The visual left-to-right order (nav, then
main) does not match the DOM/tab order (main, then nav) — by design, and correctly.

## Exact accessibility mechanism (what AT experiences, why it PASSES)
- **Sighted keyboard / switch user:** Tab focuses the permit form fields (plate, zone,
  email, submit) first, then the side-nav links. They accomplish the page's primary
  purpose — applying — without first tabbing through five navigation links. The hierarchy
  implied by the visual layout (a main task with secondary navigation beside it) is
  preserved: the main task is primary, and it receives focus first. Meaning and
  operability are intact.
- The Understanding lists this precise construction as a *passing* example, explicitly to
  "allow focus to move to the main body content first without requiring tabindex
  attributes or JavaScript."
- The nav and the form are independent regions; reaching the form first does not impede
  the nav, and vice versa.

## Expected ACT-style outcome
**passed** (SC 2.4.3). Source order differs from visual order, but the focus order is
logical and preserves the meaning/hierarchy implied by the visual presentation (primary
task first).

## Why automated tools miss it / over-flagging trap
- A naive "visual order ≠ DOM order" detector would flag this page even though it is the
  Understanding's own *passing* example. That is why no automated tool ships such a rule:
  whether a reorder preserves meaning is a human judgment. axe/WAVE/Lighthouse see a valid
  grid, labelled inputs, and a real `<nav>`/`<main>` structure — nothing to flag — and
  they are right to pass it. The case exists so a judge correctly recognizes an
  *intentional, passing* source-order technique rather than mechanically failing any
  reorder.

## Citation
> "An HTML web page is created with the left hand navigation occurring in the HTML after the main body content, and styled with CSS to appear on the left hand side of the page. This is done to allow focus to move to the main body content first without requiring tabindex attributes or JavaScript."
— wcag-understanding/focus-order.html (Examples of Focus Order — passing example)

> "While this example passes the Success Criterion, it is not necessarily true that all CSS positioning would. More complex positioning examples may or may not preserve meaning and operability"
— wcag-understanding/focus-order.html (Examples of Focus Order — note on the passing example)
