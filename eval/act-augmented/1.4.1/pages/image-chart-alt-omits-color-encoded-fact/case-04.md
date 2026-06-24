# case-04 — Inline-SVG line graph; alt says "green = revenue, red = cost" and lists every value but never states which line is on top (profit vs loss)

## Scenario
A startup pitch slide shows a monthly P&L mini-chart as an **inline SVG** with two `<polyline>`
series across Jan–Jun: revenue (green) and cost (red). The two lines CROSS — cost is above revenue
(a loss) in Jan/Feb/Mar, then revenue climbs above cost (profit) from Apr onward. The whole point is
"we turned the corner in April." The SVG is `role="img"` with an `aria-label` that lists every monthly
value for both series and states the colour rule — "Revenue is the green line; cost is the red line."
But it never states which line is ON TOP in any month, i.e. it never resolves the profit/loss story.
The takeaway prose under the chart repeats the colour rule and the numbers but likewise never says
"we lost money Jan–Mar and were profitable Apr–Jun."

## Attribute tuple
- **Content domain:** fintech / startup financials (investor deck)
- **UI component / pattern:** dual-series line graph (two crossing trend lines)
- **Host-language construct:** inline `<svg role="img">` with two `<polyline>` series + a long `aria-label`
- **Locale / i18n:** en
- **Failure mechanism:** F13 with a temporal/comparative twist — alt names the line colours and all values but omits the colour-encoded comparison (which series is higher, i.e. profit vs loss, in each month)

## Developer persona
A founder/finance analyst built the chart in a spreadsheet-to-SVG tool for the seed deck. They added
an `aria-label` because an advisor told them charts need alt text, and they dutifully transcribed
every data point and noted the line colours. They never considered that "which line is on top" — the
crossover that proves the turnaround — is conveyed only by the relative vertical position of two
colour-coded lines, and that a red-green colour-blind viewer sees two near-identical lines weaving
around each other with no way to tell revenue from cost.

## Element / selector carrying the issue
`svg.lines[role="img"]` — the two `<polyline>` elements (green revenue, red cost). The colour-encoded
fact is the crossover: cost > revenue in Jan/Feb/Mar (loss), revenue > cost in Apr/May/Jun (profit).
Series identity is carried by line colour; the comparison is carried by relative position of those
colour-coded lines.

## Exact accessibility mechanism
AT exposes one image whose name is the `aria-label`: twelve numbers and "green = revenue, red = cost."
A screen-reader user must mentally pair the two six-value series and compare each pair to recover the
profit/loss months — and even then only if they correctly track which list is which. A viewer with
deuteranopia/protanopia sees two lines of nearly indistinguishable hue; with no other cue (no dashed
vs solid stroke, no markers, no data labels at the crossover) they cannot tell which line is revenue,
so "we turned the corner" is unreadable. The chart's headline conclusion is conveyed by the position
of two colour-coded lines and is never stated in text.

## Expected ACT-style outcome
**failed** (SC 1.4.1, via F13; also implicates 1.1.1). The graphic has a valid, information-rich
accessible name, so automated checks pass. It fails 1.4.1 because the colour-encoded comparison the
chart exists to communicate (which series is higher each month → profit vs loss) is available only by
distinguishing the two line colours and reading their relative position, with no text or non-colour
visible equivalent.

## Why automated tools miss it
The SVG is `role="img"` with a long `aria-label`; nothing is malformed. axe/WAVE/Lighthouse confirm a
named graphic and stop. No scanner traces the two polylines, detects the crossover points, decides
that "which series is on top" is the salient colour-encoded fact, and then checks the prose for that
statement. That requires reading the plotted geometry, understanding the comparison the colours set
up, doing the arithmetic, and confirming the prose never states it — human visual + semantic judgment.

## Citation
**Reference:** WCAG Technique F13 (`wcag-techniques/failures/F13.html`)
> "This can cause problems for people who are blind, have low vision, or have color vision deficiency, because they will not be able to perceive the information conveyed by the color differences."

**Reference:** Understanding SC 1.4.1 (`wcag-understanding/use-of-color.html`)
> "Examples of information conveyed by color differences: “required fields are red\", “error is shown in red\", and “Mary's sales are in red, Tom's are in blue\"."

**Reference:** WCAG Technique G14 (`wcag-techniques/general/G14.html`)
> "The objective of this technique is to ensure that when color differences are used to convey information ... the information conveyed by the color differences are also conveyed explicitly in text."
