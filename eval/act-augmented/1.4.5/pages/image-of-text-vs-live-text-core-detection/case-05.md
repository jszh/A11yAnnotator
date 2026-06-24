# case-05 — Bitmap section heading whose descriptive alt is a decoy; alt-present does not satisfy 1.4.5

## Scenario
The e-commerce store "Birchwood Outfitters" sets its "Summer Clearance Event" category
heading as a real raster **PNG** `<img>`, wrapped in an `<h2>`. Crucially, the `alt` is a
perfect, descriptive transcription of the displayed words — `alt="Summer Clearance Event"` —
and the image is a heading. Every automated check is satisfied: the image has meaningful alt,
the heading has accessible text. Yet the *displayed* heading is a fixed bitmap that pixelates
on zoom and cannot be recolored or resized by user settings. A descriptive alt resolves 1.1.1,
but it does **not** satisfy 1.4.5. A live-text foil heading ("New Arrivals for Fall") shows the
achievable treatment the clearance heading should have used.

## Attribute tuple
- **Content domain:** e-commerce (outdoor apparel)
- **UI component / pattern:** category/section heading above a product grid
- **Host-language construct:** `<h2><img alt="...exact text..." src="data:image/png;base64,..."></h2>` (raster image of text with a correct, descriptive alt)
- **Locale / i18n:** en
- **Failure mechanism:** decoy alt — an accurate transcription that satisfies 1.1.1 and naive heading checks, masking that the heading is a non-adjustable image of text (1.4.5)

## Developer persona
A store manager built the clearance banner heading in an image editor to match a seasonal
campaign's exact red and letterforms, then uploaded it through the storefront CMS. The CMS's
accessibility helper nagged "add alt text", so they conscientiously typed the exact words
shown in the image. They believed that writing accurate alt makes any image accessible — a
very common misconception — and never learned that a styled heading should be live text.

## Element / selector carrying the issue
`h2.img-heading > img[alt="Summer Clearance Event"]` — a raster PNG whose pixels are the
heading text; the alt is an exact transcription (the decoy). (The `h2.live-heading`
"New Arrivals for Fall" is the live-text PASS foil.)

## Exact accessibility mechanism
A screen-reader user hears "heading level 2, Summer Clearance Event" — so 1.1.1 is fine. But a
low-vision user who increases browser font size or applies a high-contrast / custom-color user
stylesheet sees no change to the heading: it is a fixed-resolution bitmap that blurs when
magnified and ignores forced-colors mode. The bold red display is plainly achievable with live
HTML + CSS (`<h2>` + `color` + `font-size` + `letter-spacing`) — demonstrated by the adjacent
"New Arrivals for Fall" live heading. The heading is not a logotype, not essential, and not
user-customizable, so the exception does not apply. Image of text where presentation was
achievable → fail, *despite* the correct alt.

## Expected ACT-style outcome
**failed** (SC 1.4.5). The presence of a descriptive alt is irrelevant to 1.4.5; the visual
presentation is achievable in text and is not customizable or essential, so using an image of
text fails.

## Why automated tools miss it
This is the trap: the image has a non-empty, *descriptive* alt, so axe-core `image-alt`, WAVE,
and Lighthouse all PASS — they are checking 1.1.1-style name presence, not 1.4.5
adjustability. None performs OCR to confirm the pixels are text (they trust the alt), and none
encodes the 1.4.5 rule that "a heading rendered as an image of text fails even with perfect
alt, because the visual presentation can't be adjusted and was achievable in CSS." Reaching
that verdict requires a human to recognize the heading is an image of text and to apply the
achievability gate — the alt actively misleads a tool into a clean report.

## Citation
**Reference:** WCAG 2.2 Understanding — Images of Text, In brief (`wcag-understanding/images-of-text.html`)
> "Goal: Users can adjust how text is presented. ... Why it's important: People cannot alter how text looks in images."

**Reference:** WCAG 2.2 Understanding — Images of Text, Examples → Styled Headings (`wcag-understanding/images-of-text.html`)
> "Rather than using bitmap images to present headings in a specific font and size, an author uses CSS to achieve the same result."

**Reference:** Trusted Tester v5.1.3 SC 1.4.5, How to Test step 2.a (`refs/trusted-tester/sc-1.4.5-images-of-text.md`)
> "Customizing font size for an image of text also implies the ability to adjust the size without pixelation (typically evident when simply using the browser resize functionality to resize images)."
