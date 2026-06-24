# case-03 — SaaS marketing hero in a `<table summary="layout table for hero section">`

## Scenario
A scheduling-SaaS landing page ("Cadence") lays out its hero — a headline + call-to-action
on the left and a decorative calendar illustration on the right — as a two-column `<table>`.
The `<table>` carries a non-empty `summary="layout table for hero section"`. There is no
tabular data: the two cells are a marketing pitch and an `aria-hidden` illustration. The
non-empty `summary` provides a textual description of the table to AT, falsely presenting a
layout container as a (described) table.

## Attribute tuple
- **Content domain:** B2B SaaS marketing landing page
- **UI component / pattern:** two-column hero / marketing splash
- **Host-language construct:** native `<table>` for layout, with a non-empty (obsolete) `summary` attribute
- **Locale / i18n:** en
- **Failure mechanism:** non-empty `summary` on a layout table — a table-describing attribute used purely for presentation (F46)

## Developer persona
A growth-marketing developer cloned the hero from an old high-converting landing page that
predated the team's CSS-grid system. The original used table layout, and a previous author
had "documented" the table inline with `summary="layout table for hero section"` thinking it
helped screen readers understand the section. The dev kept the table to avoid breaking the
pixel-perfect design and never removed the summary. Their accessibility scanner did not flag
the summary as a 1.3.1 issue, so it shipped.

## Element / selector carrying the issue
`table.hero[summary]` — the `summary="layout table for hero section"` attribute on the
layout `<table>`.

## Exact accessibility mechanism
The `summary` attribute "provides a textual description of the table that describes its
purpose and function" and "assistive technologies make the summary attribute information
available to users" (F46). On a layout table the AT therefore announces the table along with
"layout table for hero section" — describing presentational scaffolding as if it were a data
table the user should navigate. F46 specifically calls out describing a table as a "layout
table" via summary as a failure: "When spoken, this information does not provide value and
will only distract users." There is no row/column data relationship, so the description is
attached to false structure.

## Expected ACT-style outcome
**failed** (SC 1.3.1). No header/`headers`/`scope` rule fires (the table has none). A
checker may emit an *obsolete-attribute* warning (HTML5 removed `summary`), but that is a
validity signal, not a 1.3.1 verdict — and an *empty* summary on a layout table is
explicitly acceptable, so the failure is the non-empty + layout combination. The page fails
1.3.1 under F46/TT 14.C.

## Why automated tools miss it
axe/WAVE/Lighthouse do not treat a non-empty `summary` on a `<table>` as a 1.3.1 violation —
historically `summary` was *encouraged* for data tables, so its presence is not flagged as a
relationship failure. The HTML obsolescence lint (if present) only says "summary is obsolete",
which is not the same as "this layout table fabricates data semantics." Recognizing the
failure requires judging that the `<table>` is layout (hero pitch + decorative illustration,
no data) — exactly the TT 14.C human determination that no scanner makes.

## Citation
**Reference:** WCAG Technique F46 (`wcag-techniques/failures/F46.html`)
> "The summary attribute on the table element provides a textual description of the table that describes its purpose and function. Assistive technologies make the summary attribute information available to users."

**Reference:** WCAG Technique F46 (`wcag-techniques/failures/F46.html`)
> "Do not include a summary attribute and do not use the summary attribute to describe the table as, for instance, \"layout table\". When spoken, this information does not provide value and will only distract users navigating the content via a screen reader. Empty summary attributes are acceptable on layout tables, but not recommended."
