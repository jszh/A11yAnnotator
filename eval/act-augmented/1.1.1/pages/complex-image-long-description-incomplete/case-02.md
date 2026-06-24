# case-02 — Quarterly revenue bar chart: caption gives the four totals but drops the trend and the highlighted outlier

## Scenario
A finance dashboard ("Northwind Logistics") shows a four-bar revenue chart for FY2029. The bars
visually encode a story: three quarters of steady growth ($42M → $48M → $55M) followed by a
sharp Q4 collapse to $19M, which the chart highlights with a *red* bar and an on-chart
"↓ port strike" annotation. The `aria-describedby` long description recites the four dollar
figures and nothing else — no trend, no statement that Q4 is the anomaly, no cause.

## Attribute tuple
- **content-domain:** SaaS analytics / corporate finance dashboard
- **UI-component / pattern:** card-based dashboard with inline `<svg role="img">` bar chart
- **host-language construct:** SVG with `aria-label` (name) + `aria-describedby` → figure caption
- **locale / i18n:** en
- **failure-mechanism:** long description lists data points but omits the trend and the outlier the chart is built to surface (F67)

## Developer persona
A data-engineer wired the chart to an auto-generated caption: a templated string that
interpolates each quarter's value ("Q1 was $X, Q2 was $Y..."). The template predates the Q4
incident and has no logic for trend or anomaly. Because the caption always contains real
numbers, accessibility scans stay green and nobody revisits it.

## Element / selector carrying the issue
`svg[role="img"][aria-label]` paired with `p#chartCap` (the `aria-describedby` target). The
caption is present and factually correct yet incomplete.

## Exact accessibility mechanism
A screen-reader user hears "Bar chart of FY2029 freight division revenue by quarter," then four
isolated figures. A sighted user instantly reads the shape — growth then a steep drop — sees the
red Q4 bar marking it as exceptional, and reads "↓ port strike" giving the cause. None of the
trend, the which-bar-is-the-outlier, or the annotation reaches the non-sighted user, so they
miss the entire point of the figure while believing they have the data. G92's test ("if the
non-text content were removed and substituted with the descriptions, the page would still
provide the same information") fails.

## Expected ACT-style outcome
**failed** — F67 (long description does not serve the same purpose / present the same
information). Name and description presence both PASS.

## Why automated tools miss it
The SVG has a non-empty `aria-label` and an associated description; axe/WAVE/Lighthouse report
no issue and qt1vmo passes (the name correctly identifies the chart). No tool reads the bar
heights to compute the trend, recognises that the red bar + annotation flag Q4 as the outlier,
or checks that the caption states either. Recognising "the numbers are present but the *message*
is absent" is a human reasoning step over the rendered pixels.

## Citation
> **Reference:** WCAG Techniques — G92 (`wcag-techniques/general/G92.html`)
>
> "A chart showing sales for October has a short text alternative of \"October sales chart\".
> The long description would read \"Bar Chart showing sales for October. There are 6
> salespersons. Maria is highest with 349 units. ... The primary use of the chart is to show
> leaders, so the description is in sales order.\""
>
> (The conformant example states the *message* — who leads — not just the numbers; case-02's
> caption gives only the numbers and drops the trend/outlier, the F67 failure.)
