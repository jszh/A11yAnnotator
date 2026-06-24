# case-01 — Bank masthead wordmark is an SVG-in-background image of text, masked by an sr-only decoy

## Scenario
"Aurelia Trust", a retail/business bank, ships a marketing homepage. The site name in the
masthead is a styled serif wordmark. To guarantee the typography never shifts across
operating systems, the brand vector was dropped in as a CSS `background-image` (an inline
SVG `data:` URI whose `<text>` reads "Aurelia Trust") on the page `<h1>`. The `<h1>`'s only
real DOM text is a visually-hidden `sr-only` span that also says "Aurelia Trust", so a
screen reader announces a heading, but the *displayed* wordmark is pixels in a background
image — not live, resizable, recolorable text. A boundary foil ("Aurelia Savings" in
`#twin`) reproduces the identical serif look with **live** text to prove the masthead
treatment was avoidable.

## Attribute tuple
- **Content domain:** online banking / fintech
- **UI component / pattern:** site masthead / brand wordmark heading
- **Host-language construct:** `<h1>` styled with `background-image: url(data:image/svg+xml...)`; visible glyphs are SVG `<text>` inside the background; real text is an `sr-only` span
- **Locale / i18n:** en
- **Failure mechanism:** image-of-text delivered via CSS background-image with NO `<img>`/alt, and a programmatic-text decoy (`sr-only`) that makes checkers see a named heading

## Developer persona
A front-end dev rebuilt the site in a no-code design tool, then exported to hand-coded HTML.
A senior dev had warned that "an empty heading fails accessibility", so the junior dev added
a visually-hidden span with the brand name to "give the screen reader something to read",
while keeping the pixel-perfect vector wordmark as the visible heading via CSS background.
The fix they reached for satisfied the linter but left the displayed text non-resizable.

## Element / selector carrying the issue
`h1.brandmark` — its `background-image` is an SVG `data:` URI containing
`<text>...Aurelia Trust</text>`. The visible wordmark is that background; the `<h1>` text
node is only `span.sr-only`.

## Exact accessibility mechanism
A sighted user sees a 40px serif "Aurelia Trust". A low-vision user who zooms or applies a
user stylesheet (larger font, high-contrast colors) cannot change the wordmark at all — it is
a fixed-size background bitmap-equivalent; it pixelates on magnification and ignores
forced-colors / custom background settings. A screen-reader / braille user hears the heading
"Aurelia Trust" from the `sr-only` decoy, so the *information* is present, but the SC is about
the *visual presentation* being adjustable: the displayed text cannot be restyled because it
is an image of text. The identical effect is plainly achievable in live HTML/CSS (the `#twin`
"Aurelia Savings" heading does exactly that), so the achievability gate is met and no
exception (logotype/essential) applies — a bank's site name set in a common serif is not a
presentation that *must* be a fixed image.

## Expected ACT-style outcome
**failed** (SC 1.4.5). The visual presentation (serif, weight, spacing, color) is achievable
with the technologies in use, yet an image of text is used instead of text, and the content
is neither user-customizable nor an essential logotype.

## Why automated tools miss it
There is no `<img>`, so axe-core `image-alt` and WAVE's alt checks never engage. The `<h1>`
has a non-empty accessible name (the `sr-only` span), so "empty heading"/"heading must have
content" rules PASS. axe/WAVE/Lighthouse do not rasterize and OCR `background-image` SVGs to
discover the pixels spell words, do not compare those pixels to the `sr-only` text, and have
no rule for "this background image is text whose look is achievable in CSS". Recognizing the
wordmark is an image of text — and judging that a plain serif site name is achievable as
live text and is not an essential logotype exception — is exactly the OCR-like detection plus
achievability judgment WCAG assigns to a human.

## Citation
**Reference:** WCAG 2.2 Understanding — Images of Text (`wcag-understanding/images-of-text.html`)
> "If authors can use text to achieve the same visual effect, they should present the information as text rather than using an image."

**Reference:** WCAG 2.2 Understanding — Images of Text, Examples → Styled Headings (`wcag-understanding/images-of-text.html`)
> "Rather than using bitmap images to present headings in a specific font and size, an author uses CSS to achieve the same result."

**Reference:** Trusted Tester v5.1.3 SC 1.4.5 (`refs/trusted-tester/sc-1.4.5-images-of-text.md`)
> "the tester must first recognize that an image *contains text* (vs being a photo/diagram), then judge whether that text is essential (logotype) or could have been live text."
