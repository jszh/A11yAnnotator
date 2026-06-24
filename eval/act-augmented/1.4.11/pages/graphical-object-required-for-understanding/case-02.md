# case-02 — Pale bar chart (~1.3:1 bars) BUT every bar captioned with its exact value → Not Applicable

## Scenario
A district council publishes "Household recycling rate by year, 2021–2025" as an inline-SVG bar
chart. The five bars are pale mint (`#C8E6C9` / `#B2DFB4`) on a white plot area: bar-to-plot
contrast is ~1.34:1 and bar-to-bar is ~1.1:1 — far below 3:1. **However**, every bar is
captioned, in conforming 1.4.3 text, with its exact numeric value (42, 45, 48, 51, 55) and its
year. Because the labels **and** values convey the same information the bar heights would, the
bars are not "required for understanding," and the low bar contrast does **not** fail 1.4.11.
This is the boundary case that sharpens the aspect: the *same low-contrast graphic* is a FAIL
without text (case-01) and **Not Applicable** with visible labels+values here.

## Attribute tuple
- **content-domain:** government / civic services portal (local-government waste statistics)
- **UI-component/pattern:** inline-SVG vertical bar chart with per-bar value labels
- **host-language construct:** `<svg role="img">` with `<rect>` bars + `<text>` value labels
- **locale/i18n:** en-GB (UK council)
- **failure-mechanism:** *none that fails* — the equivalent-text exemption applies; included as
  the NA boundary that demonstrates when low graphical-object contrast is permitted.

## Developer persona
A council data analyst built the chart in a spreadsheet add-in and exported SVG. The
corporate template uses a soft mint brand colour for "environment" pages, so the bars came out
pale — but the analyst, following the council's accessibility checklist item "always print the
value on every bar," dutifully labelled each bar with its exact percentage. That single habit
is what makes the page conform: the data is in the text, so the pale bars are exempt.

## Element / selector carrying the issue
The low-contrast graphical objects are the `<rect>` bars (`svg.bars rect[fill]`), ~1.34:1
against the white plot `<rect>`. The exempting elements are the per-bar value labels
`svg.bars text.barval` (42/45/48/51/55) — visible, conforming text adjacent to each bar.

## Exact accessibility mechanism (what AT experiences, why it passes/NA)
A low-vision user who cannot perceive the pale bar heights can still read the bold dark value
printed above each bar ("42", "45", "48", "51", "55") — the exact data is available without
relying on bar contrast. A screen-reader user gets the trend summary in the `aria-label` and,
crucially, the values are real `<text>` glyphs at conforming contrast. Per the Understanding
"Required for Understanding" list, a graphic "with text embedded or overlaid [that] conveys the
same information, such as labels *and* values on a chart" does not need to meet the contrast
requirement. The bars are therefore not required for understanding, and 1.4.11 does not apply to
their contrast → **Not Applicable**.

## Expected ACT-style outcome
**inapplicable**

## Why automated tools miss it
A scanner that *did* parse the SVG would likely flag the pale bars (~1.34:1 against the white
plot) as a non-text-contrast failure — a **false positive**. No automated tool can read the
`<text>` value nodes, associate each value with its bar, and conclude that the graphic carries
equivalent text and is therefore exempt. The judgment "is there a visible label **and** value
for each graphical object, conveying the same information?" — which flips the verdict from Fail
to Not Applicable — is exactly the human reading-the-chart determination automation cannot make.
(Automated tools also simply do not have a 1.4.11 graphical-object rule at all, so they report
nothing either way.)

## Citation
> **WCAG 2.2 Understanding, Non-text Contrast — Required for Understanding:**
> "However, that is not a requirement when: A graphic with text embedded or overlaid conveys the
> same information, such as labels *and* values on a chart."

(Verbatim from `wcag-understanding/non-text-contrast.html`. The bars are exempt precisely
because each carries a visible label and value conveying the same information.)

> **WCAG 2.2 Understanding, Non-text Contrast — Pie Charts example (Not applicable):**
> "The pie chart has visible labels *and* values that convey equivalent information to the
> graphical objects (the pie slices)."

(Verbatim from `wcag-understanding/non-text-contrast.html`. The same logic that makes that pie
chart Not Applicable makes this low-contrast bar chart Not Applicable: visible labels and values
render the graphical objects non-essential.)
