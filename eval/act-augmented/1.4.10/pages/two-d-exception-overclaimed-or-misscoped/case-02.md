# case-02 — Business-banking ledger: wide table correctly scoped to overflow:auto while summary/filters/load-more reflow (PASS boundary)

## Scenario
A business-banking "Account Ledger" shows a wide, genuine transaction table (posting date, value date,
description, reference, category, debit, credit, running balance). The table needs two-dimensional
layout and is correctly excepted — and crucially it is scoped correctly: it sits inside a
`div.table-scroll { overflow: auto }` region so it scrolls in 2D on its own, while the account header,
the three balance-summary cards, the filter form, the "Load 30 more" button, and the disclosure note
all reflow into one 320px column. This is the PASSING half of the Understanding
`reflow-table-pass-fail` figure and exists to make the aspect boundary tight.

## Attribute tuple
- **Content domain:** online banking / fintech dashboard (business operating account)
- **UI component / pattern:** scrollable data table region + filter form + "load more" + summary cards
- **Host-language construct:** `div{overflow:auto}` keyboard-focusable region (`role="region"`, `tabindex="0"`)
- **Locale / i18n:** en
- **Failure mechanism:** none — correct exception scoping (the control case the evaluator must NOT flag)

## Developer persona
A senior front-end engineer at a fintech read the WCAG Understanding figure for tables and deliberately
wrapped the ledger in a focusable `overflow:auto` region, gave the page no `body` min-width, used
`flex-wrap` for the summary and filters, and capped the "Load more" button at `max-width:320px`. They
left the page intentionally as a regression fixture: "a horizontal scrollbar appears, but only on the
table container — everything else reflows, so it passes."

## Element / selector carrying the issue
No issue. The contrast anchors are `div.table-scroll` (the correctly-scoped excepted table region) and
the reflowing non-excepted regions `section.summary`, `form.filters`, `.loadmore button`, `p.note`. A
naive evaluator might wrongly flag the visible horizontal scrollbar on `.table-scroll`.

## Exact accessibility mechanism
At 320 CSS px, a low-vision user reads the heading, balance cards, filter fields, "Load more" button,
and footnote in a single vertical column with no horizontal scrolling. The wide ledger is reachable via
its own labelled, keyboard-focusable scroll region (so it is operable for keyboard users too), and its
2D scrolling is permitted by the exception. Because every non-excepted region reflows and the table's
2D scroll is confined to its container, the page conforms — this is exactly the implementation the
Understanding doc presents as the pass.

## Expected ACT-style outcome
**passed** (SC 1.4.10). The table is excepted and correctly scoped; all non-excepted content reflows.

## Why automated tools miss it
A scanner can detect that `.table-scroll` produces a horizontal scrollbar but cannot determine whether
that scrollbar is legitimate (an excepted table confined to its own container) or a failure
(non-excepted content overflowing). Lighthouse/axe/WAVE have no notion of "this region is excepted
data, the rest must reflow." They would either ignore Reflow entirely or risk a false positive on the
scrollbar. Confirming the page PASSES requires the same human scoping judgment as confirming a failure.

## Citation
**Reference:** Understanding SC 1.4.10 Reflow (`wcag-understanding/reflow.html`)
> "A data table relies on two-dimensional layout for understanding, but by presenting the table in its own scrollable container it allows other content which does not meet a two-dimensional layout exception to reflow as its containing element adjusts."

**Reference:** Understanding SC 1.4.10 Reflow (`wcag-understanding/reflow.html`)
> "Pass: On the right, a table is preceded by a heading and search input, and followed by a pagination component, all within the visible viewport. The table is excepted from Reflow, and is rendered within a scrollable container. The heading and pagination are not excepted, and have been adjusted to fit within a zoomed in viewport."

**Reference:** EN 301 549 Annex C — C.9.1.4.10 (`docs/analysis/en301549/EN301549-ANNEX-C-RELEVANT-CLAUSES.md`)
> "Result  Pass: Check 1 is true  Fail: Check 1 is false"
