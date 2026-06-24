# case-06 — PASS boundary: same grid + disclosure techniques, used correctly so visual order and state stay apt

## Scenario
An analytics weekly-report dashboard built with the **same risky techniques** as the
failing cases — a CSS `grid-template-areas` panel layout and a `<details>`/`<summary>`
disclosure — but applied **correctly**, so that rendered visual order and disclosure state
both keep every heading apt. The grid's area string lists areas in the same order as the
panels appear in the DOM (no area swaps, no `order` overrides), so "Traffic sources" sits
over the traffic-sources table, "Top pages" over the top-pages list, etc. The disclosure
summary "Methodology & data sources" expands to a methodology/data-sources explanation.

## Attribute tuple
- **content-domain**: SaaS analytics dashboard (weekly traffic report)
- **UI-component/pattern**: CSS `grid-template-areas` board + a `<details>` disclosure
- **host-language construct**: grid container with `grid-area` per panel; `<details><summary>`
- **locale/i18n**: en
- **failure-mechanism**: none — control case where flat-tree order, rendered order, and disclosure state all agree

## Developer persona
A careful front-end dev built the report board with named grid areas but deliberately
listed `grid-template-areas` in the same sequence as the DOM panels (sources, pages,
devices, retention) and avoided any `order` declarations, having been bitten before by a
layout that scrambled reading order. The methodology disclosure summary was written to
honestly preview its body.

## Element / selector carrying the issue
- No issue. `#sources h2` ("Traffic sources") renders over the sources table; `#pages h2`
  ("Top pages") over the pages list; `#devices`/`#retention` headings over their KPIs; the
  `<summary>` "Methodology & data sources" expands to a methodology paragraph. Every visible
  heading describes the content perceived beneath it in every state.

## Exact accessibility mechanism
Because the grid areas are declared in DOM order and no `order`/positioning override is
applied, the rendered top-to-bottom, left-to-right reading order matches the flat-tree
order: each heading is visually directly above the content it describes. The disclosure
summary accurately predicts its expanded body in both collapsed and expanded states. A
sighted, low-vision, screen-magnifier, or screen-reader user perceives a heading-to-content
relationship that is correct however they read the page — satisfying TT 10.A.

## Expected ACT-style outcome
**passed** (every visible heading describes the content a user perceives under it, in every
state; the disclosure summary matches its body).

## Why automated tools miss it
This case is included to sharpen the aspect: a tool that merely flags "this page uses CSS
grid areas" or "this page has a `<details>`" would wrongly fail it. A correct evaluator
must return **passed** here while failing case-01 through case-05 — and the only way to
distinguish them is to render the page, read the visible heading-to-content relationships,
exercise the disclosure, and judge meaning. The techniques are identical to the failing
cases; only the *divergence* (absent here) is the defect. Automated tools cannot make that
rendered-meaning distinction, so they would treat all six pages the same.

## Citation
> **WCAG 2.2 Understanding 2.4.6 — In brief / Goal**
> "A page's content is described in headings and labels … Provide descriptive headings and
> labels … People can orient themselves, especially those with cognitive or visual
> disabilities."

> **Trusted Tester v5.1.3 — Test 10.A (Evaluate Results)**
> "The heading describes the topic or purpose of its content."
