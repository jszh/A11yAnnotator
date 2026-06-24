# case-06 — PASS control: bar chart with a complete data table + a trend sentence

## Scenario
A municipal open-data page shows a five-year bar chart of residential water use. Unlike cases
01–05, the long description here *fully reconstructs* the image: an associated `<table>` gives
every year's exact value, and a sentence states the trend the bars show (a steady year-on-year
decline, the 26% total drop, and the largest single-year drop). Removing the chart would lose no
information. This is the boundary control that sharpens the aspect — it demonstrates that
*presence* of a long description was never the question; *completeness* is.

## Attribute tuple
- **content-domain:** government / civic open-data portal
- **UI-component / pattern:** inline `<svg role="img">` bar chart + `<table>` data + trend prose
- **host-language construct:** SVG with `aria-label` (name) + `aria-describedby` → table id + trend-paragraph id
- **locale / i18n:** en
- **failure-mechanism:** none — this is the conformant counter-example (G92 satisfied)

## Developer persona
A civic-data team that follows an internal "every chart ships with its data table" rule. The
table is the source of truth; the chart is generated from it; the analyst adds one plain-language
sentence describing the trend. Accessibility was designed in, not bolted on.

## Element / selector carrying the issue (here: the feature that makes it pass)
`svg[role="img"][aria-label][aria-describedby="waterTable waterTrend"]` →
`table#waterTable` (exact values) + `p#waterTrend` (the trend). Together they reproduce the
chart's full information.

## Exact accessibility mechanism
A screen-reader user hears "Bar chart of Marsden residential water use, 2025 to 2029," then can
read the table cell-by-cell to get every value, and hears the trend sentence stating the decline,
the 26% total, and the largest drop (2027→2028). Everything the sighted user reads off the bars
is available in text. Per G92's test: removing the image and substituting the descriptions leaves
the page with the same information.

## Expected ACT-style outcome
**passed** — the long description (table + trend sentence) serves the same purpose and presents
the same information as the chart (G92 satisfied; F67 does not apply).

## Why automated tools miss it
Automated tools would also (correctly) report no error here — but for the *wrong reason*: they
pass it on name+description presence, the identical signal that wrongly greenlights cases 01–05.
This control proves a checker cannot distinguish the complete description (case-06) from the
incomplete ones (01–05): all six look identical to a presence check. Only a human comparing the
text against the image can tell that this one actually reconstructs the data and the others do
not.

## Citation
> **Reference:** WCAG Techniques — G92 (`wcag-techniques/general/G92.html`)
>
> "Combined with the short text alternative, the long description should be able to substitute
> for the non-text content. ... If the non-text content were removed from the page and
> substituted with the short and long descriptions, the page would still provide the same
> function and information."
