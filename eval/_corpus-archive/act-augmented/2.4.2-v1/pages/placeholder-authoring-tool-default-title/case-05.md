# case-05 — Government tax-form instructions titled "spk12.html"

## Scenario
A substantive government **tax-form instruction page** — "Instructions for Form SPK-12:
Self-Employment Health Insurance Deduction," with a who-must-file callout, line-by-line
instructions, and an age-banded premium-limit table. The `<title>` is the opaque internal
**filename `spk12.html`** — the literal non-descriptive-filename example F25 cites — under
which the agency serves the document.

## Element / selector carrying the issue
- `head > title` — text node `spk12.html`.
- Contradicting evidence: `main h1` ("Instructions for Form SPK-12: Self-Employment Health
  Insurance Deduction"), the breadcrumb, and the line-by-line `<ol>`.

## Exact accessibility mechanism
- A screen-reader user hears the page name as **"spk12.html"** — an unspeakable internal
  slug. Government sites publish hundreds of similarly-coded pages (spk11.html, spk13.html,
  …); the title cannot **distinguish** this page from its siblings, which is a second,
  set-level failure mode the SC calls out: when a page is part of a set, the title must let
  the user tell it apart.
- The body is unambiguous and important (a tax deduction with dollar limits), making the
  title's opacity especially harmful for a user managing many open form pages. Limb 1
  passes; limb 2 fails on both descriptiveness and set-distinctiveness.

## Expected ACT-style outcome
**failed** — ACT rule c4a8a4.

## Why automated tools miss it
`spk12.html` is non-empty and valid HTML. An automated checker has no way to know that
`spk12` is an internal document code rather than a meaningful name, and certainly cannot
fetch the rest of the form set to determine that the title fails to distinguish this page
from its siblings. Both judgments — "this is an opaque slug" and "it doesn't identify the
SPK-12 deduction content" — require human reading.

## Citation
> **Reference: WCAG Techniques — F25** (`wcag-techniques/failures/F25.html`)
>
> "Filenames that are not descriptive in their own right, such as report.html or
> spk12.html"

> **Reference: Trusted Tester v5.1.3 — Test 12.B `2.4.2-page-title-purpose`**
> (`refs/trusted-tester/sc-2.4.2-page-titled.md`)
>
> "If the web page is part of a set of web pages, determine whether the Page Title is
> sufficient to distinguish the web page from other pages."
