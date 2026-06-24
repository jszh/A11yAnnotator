# case-04 — PASS control: nav collapses to a WORKING hamburger disclosure that reveals all six links; sidebar repositioned, not deleted (PASS)

## Scenario
A developer API reference ("Pulsegate / docs — Webhooks") shows six primary links — Authentication,
Events, Webhooks, Rate limits, Errors, SDKs — as a horizontal nav at desktop width, with an "On this
page" sidebar on the left. At `max-width:820px` the horizontal nav is hidden and a hamburger button
appears, but here the button is a real disclosure: a native `<button aria-expanded aria-controls>`
wired to a tiny dependency-free script that toggles `aria-expanded` and the panel's open class. When
opened at 320px it renders all six links — the same set shown at desktop width. The left sidebar is
not deleted either; it is repositioned into the single column above the article so its links stay
reachable. The page reflows cleanly with no horizontal scroll and no content lost.

## Attribute tuple
- **Content domain:** developer documentation / API reference (SaaS)
- **UI component / pattern:** primary nav collapsing to a *working* hamburger disclosure + an on-page sidebar that repositions
- **Host-language construct:** `<button aria-expanded aria-controls>` + JS toggle revealing the same `<nav><ul>`; sidebar moved (not hidden) by the media query
- **Locale / i18n:** en-US, technical register
- **Failure mechanism:** NONE — positive met-condition: the replacement mechanism genuinely surfaces the dropped links and the sidebar is repositioned rather than removed

## Developer persona
A senior front-end engineer on the docs team built the responsive nav from the WAI-ARIA Authoring
Practices disclosure pattern, deliberately wiring `aria-expanded`/`aria-controls` and verifying at
400% zoom that every link reachable on desktop is reachable in the open menu. They also chose to
*reposition* the on-this-page sidebar above the content on small screens rather than hide it, precisely
because they knew hiding it would drop content. This is the careful counterpart to the contractor in
case-03 who shipped the CSS without the behaviour.

## Element / selector carrying the issue
No issue. The relevant elements are `button.menu-toggle` (the working disclosure trigger),
`nav.docnav#primary-nav` (the panel it reveals, containing all six links), and `aside.onpage` (the
sidebar repositioned by `@media (max-width:820px)` from a side column to a static block above the
article).

## Exact accessibility mechanism
At ≥821px the six nav links and the sidebar are all visible and operable. At 320px the horizontal nav
is hidden, but activating the hamburger sets `aria-expanded="true"` and opens a panel containing the
same six links — a keyboard or screen-reader user reaches every destination through the disclosure.
The sidebar's "On this page" links are not removed; they are rendered in a static block above the
article, so they too remain in the reading order and focusable. Because all information and
functionality available at desktop width remains available after reflow to 320px — offered "in some
other way" via the disclosure, and "repositioned in a single column" for the sidebar — the F102 failure
condition does not apply.

## Expected ACT-style outcome
**passed** (SC 1.4.10). The narrow rendering reflows without horizontal scroll and loses no content:
the hamburger genuinely reveals the dropped nav links and the sidebar is repositioned rather than
deleted. This is the boundary mirror of case-03 (identical-looking collapse, dead button → FAIL).

## Why automated tools miss it
This is the crux the aspect exists to expose: a static scanner cannot distinguish this PASS from
case-03's FAIL. Both pages have a named `<button>` and the six `<a>` links present in the DOM. axe-core,
WAVE, and Lighthouse never activate the hamburger at a 320px viewport, never observe that the panel
opens, and never confirm that the dropped links became reachable. Certifying that *this* page passes —
that the replacement mechanism truly surfaces the same content and the sidebar truly repositioned —
requires a human to operate the control after reflow and compare reachable content across the two
widths. The tools can neither flag a violation here nor certify the met-condition.

## Citation
**Reference:** WCAG Technique F102 (`wcag-techniques/failures/F102.html`)
> "This content, however, should still be available after reflow to 320px viewport width, either by being repositioned in a single column view, or through some interaction offering the information in some other way, for example, in a disclosure area, a dialog, or via a link to another view."

**Reference:** Understanding SC 1.4.10 Reflow — Adjusting content into a single column (`wcag-understanding/reflow.html`)
> "Modern websites and applications commonly employ responsive web design best practices to adjust or relocate sections of content to fit within smaller viewports. Neither adjusting or relocating content is considered a loss of information or functionality, so long as users are still able to access the content."
