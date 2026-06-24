# case-01 — Coupon banner image; alt labels it "promotional banner" but drops the code SAVE20

## Scenario
A marketing email from "Lumen Coffee Roasters" leads with a flattened promo banner. The
banner is a single `<img>` whose `src` is an inline-SVG `data:` URI, so its pixels — not any
live DOM text — read "SUMMER SALE / 20% OFF EVERYTHING / Use code **SAVE20** at checkout /
Ends Sunday, August 31". The `alt` is non-empty and truthfully identifies the image
(`alt="Summer sale promotional banner"`), but it reproduces none of the displayed words. A
sighted shopper reads the discount code and the deadline; a screen-reader user hears only
"Summer sale promotional banner, image" and can never enter SAVE20 at checkout.

## Attribute tuple
- **Content domain:** retail / email marketing (coffee e-commerce)
- **UI component / pattern:** hero promotional banner in an HTML email layout
- **Host-language construct:** `<img>` with `alt`, `src` = inline-SVG `data:` URI (raster-equivalent image of text)
- **Locale / i18n:** en
- **Failure mechanism:** non-empty alt that *labels* the image instead of *transcribing* the load-bearing words (code + deadline) baked into its pixels

## Developer persona
A small-business owner designed the banner in Canva to get the exact brand typography, then
exported it as one flat graphic and dropped it into their email tool. The tool required an
alt value, so they typed a quick description of the picture — "Summer sale promotional
banner" — never realising that the discount code lived only inside the image and had to be
written into the alt too.

## Element / selector carrying the issue
`img.hero[alt="Summer sale promotional banner"]` — the offer text (headline, the code
`SAVE20`, the end date) exists only as SVG `<text>` glyphs inside the image's pixels.

## Exact accessibility mechanism
The image's accessible name is computed from `alt` = "Summer sale promotional banner". The
Chrome accessibility tree exposes exactly one image node with that name; the strings
"SAVE20" and "August 31" appear nowhere in the DOM text or the accessibility tree (verified
with Puppeteer: `DOM innerText contains SAVE20: false`; a11y image node name = the alt
only). So AT conveys that *a* banner exists but not *what it says*. Because the image is of
meaningful text, the alternative is required to contain the same text (TT 7.A step 1.d); it
does not, so the equivalent-purpose requirement of 1.1.1 is unmet.

## Expected ACT-style outcome
**failed** (SC 1.1.1). The presence rule (ACT 23a2a8 "Image has non-empty accessible name")
PASSES — alt is non-empty. The descriptiveness rule (ACT qt1vmo "Image accessible name is
descriptive") can also pass, because the name *is* an accurate label of the image. The page
still fails 1.1.1 because the alternative does not serve the equivalent purpose: the words
the image displays are lost to AT.

## Why automated tools miss it
axe-core, WAVE, and Lighthouse only verify that `alt` is present and non-empty — it is, so
`image-alt` passes. None of them performs OCR to discover that the banner's pixels spell
"Use code SAVE20", and none compares any extracted text against the alt. Deciding that the
alt must *reproduce* the displayed code and deadline — rather than merely label the image —
is a transcription-equivalence judgment that requires reading both the picture and the alt.
That is precisely the manual carve-out at Trusted Tester 7.A.1.d.

## Citation
**Reference:** Trusted Tester v5.1.3 SC 1.1.1, Test 7.A step 1.d (`refs/trusted-tester/sc-1.1.1-non-text-content.md`)
> "If the image is of **meaningful text**, ANDI Output must contain the **same text**."

**Reference:** WCAG Technique G94 (`wcag-techniques/general/G94.html`)
> "When non-text content contains words that are important to understanding the content, the alt text should include those words."

**Reference:** WCAG Failure F30 (`wcag-techniques/failures/F30.html`)
> "If the text in the "text alternative" cannot be used in place of the non-text content without losing information or function then it fails because it is not, in fact, an alternative to the non-text content."
