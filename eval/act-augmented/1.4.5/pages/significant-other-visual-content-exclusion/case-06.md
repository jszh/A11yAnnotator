# case-06 — A pricing comparison delivered as one image: a grid with check/cross icons whose cells are all words (redundant graphics ≠ significant visual content)

## Scenario
An insurance broker's landing page presents three plan tiers (Essential / Plus / Premier) as a single
comparison image (inline-SVG `data:` URI). It looks table-ish AND has graphic elements: a "Most
popular" ribbon on the Plus column, green check (✓) and grey cross (✗) glyphs in the coverage rows,
and column dividers. A tester might argue those checkmarks/ribbon are "significant other visual
content" and grant the 1.4.5 exclusion. The deciding question: do those graphics convey information
the text does not? They do not. The ✓/✗ are pure redundancy — each marks a coverage row whose
yes/no fact is already a word; the ribbon just repeats "Most popular," also printed. Every datum —
plan names, monthly prices, deductibles, coverage limits, the yes/no facts — is text laid out in a
grid. Strip the icons and ribbon and no information is lost. It is a comparison TABLE rendered as an
image of text.

## Attribute tuple
- **Content domain:** insurance quote / comparison landing page
- **UI component / pattern:** pricing/feature comparison grid (tiered plans) as one hero image
- **Host-language construct:** `<img alt>` with inline-SVG `data:` URI (grid + ✓/✗ glyphs + ribbon)
- **Locale / i18n:** en (USD)
- **Failure mechanism:** redundant-graphics trap — the icons/ribbon merely repeat the text, so the non-text content is not "significant"; the picture is a table-as-image and 1.4.5 applies

## Developer persona
A marketing agency themed a template and the design lead built the plan comparison in Figma so the
checkmarks, the green "Most popular" ribbon, and the price typography would render pixel-perfectly
across browsers. They exported it as one PNG-like asset and dropped it in with an `alt` transcript,
reasoning "it has icons and a ribbon, so it's a graphic, not text." But the icons are decorative
duplicates of the words; the artifact is a data table that should be a live, responsive `<table>`.

## Element / selector carrying the issue
`figure img[alt^="Home insurance plan comparison."]` — the entire comparison (names, prices,
deductibles, coverage limits, yes/no facts) lives only as pixels.

## Exact accessibility mechanism
The image's accessible name is the `alt` transcript, satisfying 1.1.1/`image-alt`. 1.4.5 fails: the
comparison is presented AS an image RATHER THAN as text. A low-vision user cannot enlarge the prices/
deductibles without pixelation, cannot recolour the grid, and cannot reflow a wide table on mobile
(the image overflows). A screen-reader user gets one long string instead of a navigable `<table>`
with row/column headers, so "Premier — Water backup — yes" cannot be read cell-by-cell. Because the
✓/✗ icons and the ribbon convey nothing beyond the words, the non-text content is not *significant*,
and the 1.4.5 exclusion does not apply. (A true data visualization — e.g. a coverage heatmap where
colour intensity encoded a value — WOULD be excluded; this is the tight borderline.)

## Expected ACT-style outcome
**failed** (SC 1.4.5; also implicates 1.4.10). The comparison should be a live HTML `<table>`.

## Why automated tools miss it
`image-alt` passes (full transcript). No scanner can judge that the ✓/✗ icons and "Most popular"
ribbon are redundant decoration rather than informational graphics — and therefore that the picture
is a table-as-text in scope of 1.4.5. Deciding whether the non-text visual content is "significant"
(carrying unique meaning) versus redundant is exactly the human judgment the SC requires.

## Citation
**Reference:** Understanding SC 1.4.5 Images of Text (`wcag-understanding/images-of-text.html`)
> "This does not include text that is part of a picture that contains significant other visual content. Examples of such pictures include graphs, screenshots, and diagrams which visually convey important information through more than just text."

**Reference:** Trusted Tester v5.1.3 SC 1.4.5 (`refs/trusted-tester/sc-1.4.5-images-of-text.md`)
> "Determine if text can be used instead of the image of text to present the same effect and information."

**Reference:** WCAG Technique C22 (`wcag-techniques/css/C22.html`)
> "Text within images has several accessibility problems, including the inability to: be scaled according to settings in the browser; be displayed in colors specified by settings in the browser or rules in user-defined style sheets; honor operating system settings, such as high contrast"
