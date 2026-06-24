# case-02 — Pull-quote rendered as a graphic; alt is "decorative pull-quote graphic", quote text lost

## Scenario
A long-form news article ("The Margin") drops in a stylised pull-quote. To preserve the
bespoke serif treatment the author baked the quotation and its attribution into a flattened
`<img>` (inline-SVG `data:` URI). The pixels read:
"*The future is already here — it's just not very evenly distributed.*" — William Gibson,
1993. The `alt` is non-empty but only labels the picture
(`alt="Decorative pull-quote graphic in the article"`), and the surrounding prose merely
alludes to "the line below" without restating it. A screen-reader user loses both the
quotation and its source — they hear "Decorative pull-quote graphic in the article, image".

## Attribute tuple
- **Content domain:** editorial / journalism (infrastructure reporting)
- **UI component / pattern:** article pull-quote / blockquote treatment
- **Host-language construct:** `<img>` with `alt`, `src` = inline-SVG `data:` URI; quote present only as SVG `<text>`
- **Locale / i18n:** en
- **Failure mechanism:** the meaningful text (a specific attributed quotation) is image pixels; alt summarises the image type instead of carrying the words, and no nearby prose restates them

## Developer persona
A CMS author building the article in a WordPress block editor used a "quote image" block
from the theme's media kit. The block accepts an uploaded graphic and an alt field; the
author wrote a description of what the block *is* ("decorative pull-quote graphic") rather
than retyping the quote, assuming the visible quotation was "obviously" available to everyone.

## Element / selector carrying the issue
`img.pullquote[alt="Decorative pull-quote graphic in the article"]` — the verbatim Gibson
quotation and the "— William Gibson, 1993" attribution exist only as glyphs inside the image.

## Exact accessibility mechanism
The image's accessible name is the alt, "Decorative pull-quote graphic in the article". The
quotation words and "Gibson" never appear in the DOM text or accessibility tree (verified:
"Gibson" present in a11y tree = false). The word "evenly" *does* appear elsewhere on the
page — in the `<title>`/`<h1>` "What 'evenly distributed' really means" — but that is page
chrome, not a restatement of the quotation, so the quote itself (full sentence + author +
year) is unavailable non-visually. Calling the image "decorative" is also wrong: it carries
information, so it is not pure decoration (TT 7.A evaluate-results step 1). For an image of
meaningful text the alternative must contain the same text; it does not.

## Expected ACT-style outcome
**failed** (SC 1.1.1). Presence rule passes (alt non-empty). qt1vmo could pass on a literal
reading (it *is* a pull-quote graphic). The page fails because the alternative drops the
load-bearing quotation and attribution.

## Why automated tools miss it
The alt is present and non-empty, so `image-alt` passes. No scanner OCRs the graphic to
learn it spells a specific quotation, nor checks the alt against those words. A tool also
cannot judge that the prose around the image fails to restate the quote — that requires
reading the article. The word "decorative" in the alt would, if anything, make naive tools
*more* confident it is fine. Recognising that a memorable, attributed quote has been turned
into pixels and then summarised away is a human semantic/visual call.

## Citation
**Reference:** Trusted Tester v5.1.3 SC 1.1.1, Test 7.A step 1.d (`refs/trusted-tester/sc-1.1.1-non-text-content.md`)
> "If the image is of **meaningful text**, ANDI Output must contain the **same text**."

**Reference:** WCAG Technique G94 (`wcag-techniques/general/G94.html`)
> "When non-text content contains words that are important to understanding the content, the alt text should include those words."

**Reference:** WCAG 2.2 Understanding Non-text Content (`wcag-understanding/non-text-content.html`)
> "Text alternatives are a primary way for making information accessible because they can be rendered through any sensory modality (for example, visual, auditory or tactile) to match the needs of the user."
