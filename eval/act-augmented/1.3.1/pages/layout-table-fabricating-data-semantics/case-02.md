# case-02 — Stationery shop header strip in a `<table>` with `<caption>Header layout</caption>`

## Scenario
An artisan-stationery shop ("Marlowe & Finch") positions its site header — brand logo on
the left, a centered product search, and a small Account/Cart utility nav on the right — in
a one-row, three-column `<table>`. The `<table>` carries a visually-hidden but non-empty
`<caption>Header layout</caption>`. There is no tabular data: the three cells are a logo, a
search form, and two links. The `<caption>` (and the very fact that this is a `<table>`)
falsely identifies the header strip as a table and announces "Header layout" as the table's
name to AT.

## Attribute tuple
- **Content domain:** e-commerce / retail (independent stationery shop)
- **UI component / pattern:** site header strip (logo + search + utility nav)
- **Host-language construct:** native `<table>` for layout, with a non-empty `<caption>`
- **Locale / i18n:** en-GB (£ pricing, British spelling)
- **Failure mechanism:** a `<caption>` on a layout table — a table-identifying element used purely for presentation (F46)

## Developer persona
A small web agency themed a generic shop template for the client. The original template's
header was a flexbox `<div>`, but a contractor "ported" an older table-based header and,
out of a vague sense that captions are good for accessibility, added
`<caption>Header layout</caption>` and then CSS-hid it so it would not show visually. The
agency's automated audit reported the table had an accessible name (the caption) and was
happy. Nobody asked whether a *header strip* should be a `<table>` at all.

## Element / selector carrying the issue
`table.siteheader > caption` — the non-empty `<caption>Header layout</caption>`. The whole
`table.siteheader` is the layout container that should not be a table.

## Exact accessibility mechanism
A `<caption>` is part of the table and identifies it. AT exposes this as "table, Header
layout, 1 row, 3 columns" and offers table-navigation commands across the logo / search /
cart cells. The user is told the page header is a *data table named "Header layout"* — a
purely presentational artefact that, when spoken, distracts and misinforms. F46 explicitly
warns against describing a layout table (e.g. as "layout table") because "this information
does not provide value and will only distract users navigating the content via a screen
reader." There is no row/column data relationship, so the table identification is false
structure.

## Expected ACT-style outcome
**failed** (SC 1.3.1). Caption-oriented automated checks are satisfied (a non-empty caption
is present and gives the table an accessible name), and no header-reference rule fires
because there are no `<th>`s. The page fails 1.3.1 under F46/TT 14.C because a layout table
must not carry a `<caption>`.

## Why automated tools miss it
A non-empty `<caption>` is exactly what accessibility scanners want on a `<table>` — it
gives the table a name and satisfies "table has caption/accessible name" heuristics. axe,
WAVE, and Lighthouse therefore see a well-named table and report nothing. They cannot
determine that the `<table>` is *layout* (logo + search + cart are page chrome, not data),
which is the necessary precondition for the `<caption>` to be a failure. That layout-vs-data
call is TT 14.C — human judgment about meaning and visual structure.

## Citation
**Reference:** WCAG Technique F46 (`wcag-techniques/failures/F46.html`)
> "Likewise, there is no need for an additional description of a table which is only used to layout content. Do not include a summary attribute and do not use the summary attribute to describe the table as, for instance, \"layout table\". When spoken, this information does not provide value and will only distract users navigating the content via a screen reader."

**Reference:** WCAG 2.2 Understanding Info and Relationships (`wcag-understanding/info-and-relationships.html`)
> "The intent of this success criterion is to ensure that information and relationships that are implied by visual or auditory formatting are preserved when the presentation format changes."
