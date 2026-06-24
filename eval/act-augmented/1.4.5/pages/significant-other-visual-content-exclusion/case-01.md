# case-01 — A "campaign breakdown chart" that is really a styled data table rendered as an image (beside a genuine bar chart)

## Scenario
A marketing-analytics product ("Lumen Commerce") emails/renders a weekly performance digest with
two pictures side by side. BOTH are flat images (inline-SVG `data:` URIs, so glyphs are pixels),
and BOTH have a non-empty, accurate `alt`. The LEFT picture is a genuine bar chart: bar HEIGHTS
encode daily sessions, with a dashed 30k target line — a legitimate "graph" whose information lives
in geometry, with words only as axis labels. The RIGHT picture *looks* chart-ish (coloured title
strip, a "revenue" legend swatch, horizontal gridlines, a coloured cell per row) but encodes
NOTHING graphically: every "spend" rectangle is the identical fixed width for all four rows, so no
bar length, slice, or position carries meaning. All the data — campaign names, spend, revenue, ROAS
— is text laid out in a grid. The RIGHT image is therefore an image of text (a table-as-picture).

## Attribute tuple
- **Content domain:** SaaS marketing / sales analytics digest (B2B)
- **UI component / pattern:** two `<figure>` cards in a 2-up grid; one real chart, one fake chart
- **Host-language construct:** `<img alt>` with inline-SVG `data:` URI (raster-equivalent)
- **Locale / i18n:** en
- **Failure mechanism:** definition-exclusion limb — the picture mimics "significant other visual content" (a graph) but has zero graphical encoding, so it is an image of text, not an excluded graph

## Developer persona
A growth-ops analyst built the digest. The daily-sessions chart came straight out of the analytics
tool as a real chart export. For the campaign table, the brand designer wanted it "to match the
chart styling," so they recreated the data table in Figma — teal header bar, gridlines, a token
coloured chip next to each spend number "so it feels like a chart" — and exported it as one PNG-like
image. They believed wrapping a table in chart chrome made it a graph. It did not: the chrome is
cosmetic; the chips are all the same size and encode nothing.

## Element / selector carrying the issue
`#fake-chart img` — the right-hand "Paid campaign breakdown" image. (Contrast anchor: `#real-chart img`,
the genuine bar chart, which is correctly excluded.)

## Exact accessibility mechanism
The fake-chart image's accessible name is its `alt`, a full transcript. But the data is delivered AS
an image RATHER THAN as text: a low-vision user cannot enlarge the dollar values without pixelation,
cannot recolour the cells for contrast, cannot reflow the grid on a narrow viewport, and cannot
select/copy "$19,880" into a spreadsheet. A screen-reader user gets one long string instead of a
navigable `<table>` with row/column semantics. None of the visual content (chips, gridlines, legend)
conveys information beyond the words, so the 1.4.5 "significant other visual content" exclusion does
NOT apply — unlike the left chart, where bar heights genuinely carry the data.

## Expected ACT-style outcome
**failed** (SC 1.4.5). The right image should be a live HTML `<table>`. The left image is correctly
**inapplicable/passed** for 1.4.5 (an excluded graph) and exists to make the boundary tight.

## Why automated tools miss it
axe-core, WAVE, and Lighthouse confirm both `<img>` have non-empty `alt` (`image-alt` passes for
both). No scanner OCRs the two pictures, measures that the left bars vary in height (geometry carries
meaning -> excluded graph) while the right "bars" are all identical (geometry carries nothing ->
table-as-text), and concludes only the right one is an image of text. That classification — is the
non-text visual content *significant*? — is the subjective limb of 1.4.5 and pure human judgment.

## Citation
**Reference:** Understanding SC 1.4.5 Images of Text (`wcag-understanding/images-of-text.html`)
> "The definition of images of text contains the note: This does not include text that is part of a picture that contains significant other visual content. Examples of such pictures include graphs, screenshots, and diagrams which visually convey important information through more than just text."

**Reference:** Trusted Tester v5.1.3 SC 1.4.5 (`refs/trusted-tester/sc-1.4.5-images-of-text.md`)
> "EXCLUDE text that is part of a picture that contains significant other visual content such as CAPTCHA, graphs, screenshots, and diagrams, which visually convey important information more than just text."

**Reference:** WCAG Technique C22 (`wcag-techniques/css/C22.html`)
> "Text within images has several accessibility problems, including the inability to: be scaled according to settings in the browser; be displayed in colors specified by settings in the browser or rules in user-defined style sheets; honor operating system settings, such as high contrast"
