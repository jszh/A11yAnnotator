# case-01 — Settings dashboard: four bordered cards, every card title a styled `<div>`

## Scenario
A SaaS admin "Workspace settings" page (Lumen Analytics) laid out as a 2×2 grid of four
bordered cards: **Account**, **Billing**, **Notifications**, **Security**. To a sighted user
each card is unmistakably a separate section — it has a box border, a tinted header strip with
a colored status dot, and a 19px/700 bold title. But every card title is
`<div class="card-title">`, not a heading element and not `role="heading"`. The only
programmatic heading on the page is the single `<h1>Workspace settings</h1>`.

## Attribute tuple
- **Content domain:** SaaS analytics dashboard (admin/settings)
- **UI component / pattern:** card grid (boxed sections)
- **Host-language construct:** `<div>` styled to look like a heading; section grouping via
  `<section aria-label>` (region landmark) but no heading inside
- **Locale / i18n:** en
- **Failure mechanism:** visual-only section boundary (CSS border + tinted strip + bold type)
  with no programmatic heading per section
- **Visual-only conveyance (facets.json):** "font-weight/size alone implies heading or emphasis"

## Developer persona
A React team built the settings page from a design-system `<Card>` component. The component's
`title` prop renders a `<div className="card-title">` because the designer wanted full control
over the title's size/spacing and "headings looked too big / added default margins." Each card
was also wrapped in `<section aria-label={title}>` to satisfy a landmark-region lint rule — so
the team believed structure was "handled," not realizing a named region is not a heading and
that 2.4.10 specifically asks for section *headings*.

## Element / selector carrying the issue
`div.card-title` (×4: "Account", "Billing", "Notifications", "Security"). Verified in Chromium:
the page exposes exactly **one** programmatic heading — `h1` "Workspace settings". None of the
four card titles is a heading or has `role="heading"`.

## Exact accessibility mechanism
A screen-reader user navigating by heading (NVDA/JAWS `H`, VoiceOver rotor "Headings") gets a
list with a single entry — the page `<h1>` — and cannot jump to Account / Billing /
Notifications / Security. The four settings groups, which are obvious sections to a sighted user,
are absent from the heading-based mental model the SC exists to provide. The `<section aria-label>`
wrappers create named regions, but regions are a *separate* mechanism (2.4.1-adjacent) and many
screen readers do not announce region boundaries during linear reading; the SC 2.4.10 obligation
to provide a *heading* for each section is unmet.

## Expected ACT-style outcome
**failed** — the page is organized into four sections and none of them has a heading. (047fe0,
the only ACT rule mapped to 2.4.10, still passes because the non-repeated content carries the
`<h1>`; this defect is exactly the limb 047fe0 does not test.)

## Why automated tools miss it
Nothing is missing or empty: there is a valid `<h1>`, every control is labelled, contrast passes,
and the markup is well-formed — a default `axe.run` reports zero violations and 047fe0 passes.
No checker can infer from "1px border + `#f6f8fc` header strip + 19px/700 text" that the four
cards are content *sections* that each require a heading. Deciding that the card layout
communicates four headed-looking sections to sighted users, and that none of those titles is a
programmatic heading, is a visual + semantic human judgment.

## Citation
> "Other page elements may complement headings to improve presentation (e.g., horizontal rules
> and boxes), but visual presentation is not sufficient to identify document sections."
— WCAG 2.2 Understanding, *Section Headings*, Intent (`wcag-understanding/section-headings.html`)
