# case-06 — PASS control: genuine data table inside an `overflow:auto` scroll box while all prose reflows

## Scenario
An operations briefing presents a real data table (regions × monthly revenue/units/average-order
metrics) with proper row and column header relationships. The table genuinely needs a two-dimensional
layout to read — you compare a region row against the metric columns. It is wrapped in a
`overflow: auto` scroll container, so the table scrolls side-to-side inside its own box while every other
section (headings, intro prose, the table's caption/notes, the "what to watch" section) reflows into the
320 CSS-px column. This is the canonical CORRECT pattern, and it must NOT be flagged. It exists to test
the classification judgment, not mere overflow detection.

## Attribute tuple
- **Content domain:** SaaS / sales-operations briefing
- **UI component / pattern:** real `<table>` (data) inside a focusable scroll `region`
- **Host-language construct:** `.table-scroll { overflow: auto }` wrapping `table { min-width: 680px }`
- **Locale / i18n:** en (LTR)
- **Failure mechanism:** none — this is a legitimate two-dimensional-layout exception, contained correctly

## Developer persona
A front-end developer who has actually read the Reflow Understanding doc. They knew the data table is
excepted but wanted to avoid a page-level horizontal scrollbar that would make users hunt for non-
existent off-screen content, so they put the table in its own `overflow: auto` container with
`tabindex="0"` and an `aria-label` (so keyboard and AT users can reach and scroll it). The surrounding
prose uses `max-width` and reflows.

## Element / selector carrying the issue
`.table-scroll > table.data` — but here it is correctly handled: the wide table is contained, and
`main { max-width: 720px }` plus fluid prose ensures all non-excepted content reflows. The contrast
target for the whole aspect: this is what case-04 (layout table) and case-07 (uncontained table) get
wrong.

## Exact accessibility mechanism
At 320 CSS px the page itself does NOT grow a horizontal scrollbar: the prose has reflowed to one column.
Only the data table — which is excepted because its meaning depends on the two-dimensional header/cell
relationship — scrolls horizontally, and it does so inside its own bounded, keyboard-reachable box. A
magnifier user reads all the prose by scrolling only vertically, and scrolls the figures table
deliberately, in its own region, when they want to compare numbers. This is exactly the Understanding
doc's "table in its own scrollable container" guidance.

## Expected ACT-style outcome
**passed** (SC 1.4.10). The only horizontal scrolling is confined to genuinely excepted tabular data;
all non-excepted content reflows.

## Why automated tools miss it
A naive overflow detector that flags any `scrollWidth > clientWidth` element would FALSELY flag this
page's inner table box. Correctly passing it requires the human judgment that (a) the overflowing
element is a real data table whose meaning needs two dimensions (excepted), and (b) the non-excepted
prose around it reflows. Tools cannot distinguish this legitimate exception from the failures in case-04
and case-07; that classification is the irreducibly human part of 1.4.10.

## Citation
**Reference:** Understanding SC 1.4.10 Reflow (`wcag-understanding/reflow.html`)
> "A data table relies on two-dimensional layout for understanding, but by presenting the table in its own scrollable container it allows other content which does not meet a two-dimensional layout exception to reflow as its containing element adjusts."

**Reference:** Understanding SC 1.4.10 Reflow (`wcag-understanding/reflow.html`)
> "An element that contains a table with a minimum height, width or both, can be styled to provide bidirectional scrollbars allowing a user to scroll the table's content and mitigating bidirectional scrollbars appearing at the page level."

**Reference:** Understanding SC 1.4.10 Reflow (`wcag-understanding/reflow.html`)
> "Whenever possible it is in the best interest of the user to limit two-dimensional scrolling only to the individual sections of content which necessitate such scrolling, rather than allowing the page at large to scroll in two dimensions."
