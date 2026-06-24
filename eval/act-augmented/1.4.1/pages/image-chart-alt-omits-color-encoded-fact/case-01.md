# case-01 — Sales bar-chart image; alt lists all four figures and states "red = below quota" but never names Fred and Bob

## Scenario
A SaaS sales-analytics product ("Northwind Sales Insights") shows a quarterly board-pack panel:
a bar chart of four field reps' FY24 annual sales against a $3.0M quota. The chart is a flattened
`<img>` (inline-SVG `data:` URI), so the bars and their fills are image pixels, not DOM elements.
Mary ($3.1M) and Andrew ($3.4M) are over quota and drawn in green; Fred ($2.6M) and Bob ($2.2M)
are under quota and drawn in red, with a dashed quota line at 3.0M. The `alt` is a fluent paragraph
that gives all four dollar figures, states the quota, and explicitly states the colour rule — "the
bars shown in red indicate sales that were below the yearly quota" — but it never says WHICH reps
are red. Fred and Bob are identifiable as below-quota only by reading the red fill off the picture.

## Attribute tuple
- **Content domain:** SaaS sales-analytics dashboard (B2B)
- **UI component / pattern:** static chart image inside a `<figure>` board-pack panel
- **Host-language construct:** `<img alt>` whose `src` is an inline-SVG `data:` URI (raster-equivalent chart)
- **Locale / i18n:** en
- **Failure mechanism:** F13 — alt restates the colour RULE ("red = below quota") and all data values but omits the RESOLVED fact (which reps are below quota)

## Developer persona
A BI developer built the chart in a Looker/Plotly-style tool and exported it as a single PNG-like
image to drop into the quarterly board deck and the internal dashboard. The export tool let them
type an alt string; they wrote a thorough-sounding description that copies the legend caption
("red bars indicate sales below quota") and recites the numbers, assuming that "explaining what the
colours mean" is the same as describing the chart. It is not — they restated the key, not the answer.

## Element / selector carrying the issue
`figure img[alt^="Bar chart of FY24 annual sales"]` — the salient distinction (Fred and Bob are the
two below-quota bars) lives only in the red fill of the 2nd and 3rd bars inside the image pixels.

## Exact accessibility mechanism
The image's accessible name is computed from `alt`. A screen-reader user hears: four names, four
dollar amounts, "the quota is 3.0 million", and "the bars shown in red indicate sales that were
below the yearly quota." Nowhere in the DOM, the accessibility tree, or the alt do the strings
"Fred …below" or "Bob …below" appear; the below-quota membership exists only as the colour of two
bars in a raster image. A user with protanopia/deuteranopia, or anyone on a greyscale display, sees
the chart but cannot reliably separate the red bars from the green ones either. So no non-text,
non-colour path conveys the one fact the chart was built to communicate: Fred and Bob missed quota.

## Expected ACT-style outcome
**failed** (SC 1.4.1, via F13; also implicates 1.1.1). The alt-presence rule (e.g. ACT 23a2a8
"image has non-empty accessible name") PASSES, and a descriptiveness heuristic would also pass —
the name is a long, accurate-sounding description. The page still fails 1.4.1 because the
information carried by the colour difference is not available in text (or in any other non-colour
visible form), which is exactly the F13 failure condition.

## Why automated tools miss it
axe-core, WAVE, and Lighthouse verify only that `alt` exists and is non-empty (it is) and at most
that it is not obviously redundant — `image-alt` passes cleanly. None of them OCRs the chart to
discover the 2nd and 3rd bars are red, none parses the alt to confirm Fred and Bob are never named
as below quota, and none compares the two meanings. That read-the-pixels / read-the-prose /
compare-meaning step is the manual F13 procedure ("Check that the information conveyed by color
differences is not included in the text alternative") — pure human semantic judgment.

## Citation
**Reference:** WCAG Technique F13 (`wcag-techniques/failures/F13.html`)
> "A bar chart of sales data is provided as an image. The chart includes yearly sales figures for four employees in the Sales Department. The text alternative for the image says, \"The following bar chart displays the yearly sales figures for the Sales Department. Mary sold 3.1 Million; Fred, 2.6 Million; Bob, 2.2 Million; and Andrew, 3.4 Million. The red bars indicate sales that were below the yearly quota\". This text alternative fails to provide the information which is conveyed by the color red in the image. The alternative should indicate which people did not meet the sales quota rather than relying on color."

**Reference:** WCAG Technique G14 (`wcag-techniques/general/G14.html`)
> "The objective of this technique is to ensure that when color differences are used to convey information ... the information conveyed by the color differences are also conveyed explicitly in text."

**Reference:** Understanding SC 1.4.1 (`wcag-understanding/use-of-color.html`)
> "If the information is conveyed through color differences in an image (or other non-text format), the color may not be seen by users with color deficiencies. In this case, providing the information conveyed with color through another visual means ensures users who cannot see color can still perceive the information."
