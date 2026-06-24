# case-04 — Three different charts on one page all carrying alt="Chart.jpg"

## Scenario
A SaaS company's quarterly investor-relations page embeds three DIFFERENT data charts as
images: a bar chart of revenue by quarter (38→41→44→48), a line chart of monthly active users
rising Jan–Jun, and a pie chart of revenue by region (NA 45% / EMEA 30% / APAC 18% / LATAM 7%).
Each chart is informative — the data and trend are the entire point. All three carry the
identical export-default `alt="Chart.jpg"` produced by the BI tool's "Export image" feature.
There is no adjacent data table. The alt is non-empty so presence rules pass, but a
screen-reader user gets "Chart dot j p g" three times and none of the numbers.

## Attribute tuple
- **Content domain:** finance / investor relations / data reporting
- **UI component / pattern:** dashboard of `<figure>` chart cards (bar, line, pie) in a grid
- **Host-language construct:** `<img alt="Chart.jpg">` rendering exported chart images
- **Locale / i18n:** en
- **Failure mechanism:** export-default filename ("Chart.jpg") — the verbatim example named in F30

## Developer persona
An analyst built the charts in a BI dashboard tool and used "Export image" to drop PNG/JPGs
into the IR page. The tool names every export `Chart.jpg`; the analyst pasted each into the CMS
and the CMS auto-filled the alt from the filename. On deadline nobody wrote per-chart alt text
or a data table. The marketing site's automated a11y scan passed: every image has alt text.

## Element / selector carrying the issue
`.charts figure img[alt="Chart.jpg"]` — all three charts. The headings (`<h2>`) and captions
describe the chart's TOPIC but the data itself (values, trend, regional split) lives only in
the pixels, and the image's accessible name is the filename.

## Exact accessibility mechanism
Each chart's accessible name is `alt` = "Chart.jpg". A screen-reader user hears "Chart dot j p
g, image" for the bar chart, again for the line chart, again for the pie chart — three
distinct datasets collapsed to one meaningless filename. The chart conveys quantitative
information (G94: charts with data need a short alt PLUS a long description/table); here the
short alt is a filename and there is no long description, so the information is unavailable
non-visually. "Chart.jpg" cannot substitute for the chart without losing all the data.

## Expected ACT-style outcome
**failed** (SC 1.1.1). ACT rule 23a2a8 PASSES on all three (alt non-empty). The page fails
under F30, whose own example list names "Chart.jpg" verbatim as a non-alternative.

## Why automated tools miss it
All three images have a non-empty `alt`, so axe/WAVE/Lighthouse "image-alt" passes. The three
share an identical name, but no 1.1.1 automated rule treats duplicate alt as a violation, and
"Chart.jpg" names no identifiable asset for qt1vmo to compare. Knowing that "Chart.jpg" is an
export filename and that each chart needs its data conveyed in text requires reading the
filename and the rendered chart as a human — exactly the F30 manual check.

## Citation
**Reference:** WCAG Technique F30 (`wcag-techniques/failures/F30.html`)
> "filenames that are not valid text alternatives in their own right such as "Oct.jpg" or "Chart.jpg" or "sales\oct\top3.jpg""

**Reference:** WCAG 2.2 Understanding Non-text Content (`wcag-understanding/non-text-content.html`)
> "A bar chart compares how many widgets were sold in June, July, and August. The short label says, "Figure one - Sales in June, July and August." The longer description identifies the type of chart, provides a high-level summary of the data, trends and implications comparable to those available from the chart."
