# case-01 — Rowspan advertisement: "top!" stitched ahead of the clause it completes (F49 case 1)

## Scenario
A spring-sale promo banner for "Summit Provisions," a mountaineering outfitter. The hero is a layout `<table>` with the wordmark in the top-left cell and a giant italic "top!" in a `rowspan="2"` cell on the right, bottom-aligned so it visually finishes the sentence in the row below: "Summit Provisions gets you to the **top!**". Read in two dimensions the slogan is perfect. Linearized cell-by-cell, the source order is wordmark → "top!" → "Summit Provisions gets you to the", so the punch word arrives before the clause that needs it.

## Attribute tuple
- **content-domain:** e-commerce — outdoor / mountaineering retail promo
- **UI-component / pattern:** marketing hero banner built as a layout table
- **host-language construct:** `<table role="presentation">` with a `rowspan="2"` bottom-aligned cell (the F49 ad pattern)
- **locale / i18n:** en-CA
- **failure-mechanism:** F49 case 1 — a meaningful sequence (a slogan) split because the rowspan reorders the cells in the source content stream

## Developer persona
A solo marketing contractor recreated the brand's old print ad in HTML for an email-to-web promo. In print, the designer set "top!" as a big flourish at the lower right and let the eye assemble the line; the contractor mirrored that visual exactly with a rowspan, never linearizing it. The layout looks pixel-faithful to the print original, so it shipped.

## Element / selector carrying the issue
`table.ad td.kicker[rowspan="2"]` — the "top!" cell. Its source position (read immediately after the logo, before the slogan clause) is what scrambles the sequence.

## Exact accessibility mechanism (what AT experiences, why it fails)
- A sighted user reads the 2-D arrangement: the small clause on the lower-left and the huge "top!" on the right combine into "Summit Provisions gets you to the top!".
- A screen reader linearizes the table per F49: first cell of first row to last cell of last row, full content of each cell. Reading order is: "Summit Provisions Mountaineering Outfitters" → "top!" → "Summit Provisions gets you to the".
- The user hears the exclamation "top!" announced *before* the clause "...gets you to the", which then trails off unfinished. The slogan — a sequence whose order carries the meaning — is destroyed. The selling line is incoherent to a non-visual user.

## Expected ACT-style outcome
**failed** (SC 1.3.2 — F49: an HTML layout table that does not make sense when linearized; the meaningful sequence of the slogan is lost).

## Why automated tools miss it
A layout table is valid HTML and WCAG explicitly permits it, so axe/WAVE/Lighthouse raise nothing: `role="presentation"` is the *correct* marking for a layout table, every cell has text, contrast passes, and no attribute is missing. There is no rule that reads the linearized cell stream and decides the prose stopped making sense. Catching it requires a human to mentally linearize the cells and judge that "...top! ...gets you to the" no longer tells the intended story.

## Citation
> "&lt;td rowspan="2" valign="bottom"&gt;top!&lt;/td&gt;"
— wcag-techniques/failures/F49.html (Example: "A layout table that does not linearize correctly")

> "The reading order from this example would be: XYZ mountaineering top! / XYZ gets you to the"
— wcag-techniques/failures/F49.html (Example: "A layout table that does not linearize correctly")

> "screen readers present this two-dimensional content in linear order of the content in the source, beginning with the first cell in the first row and ending with the last cell in the last row."
— wcag-techniques/failures/F49.html (Description)
