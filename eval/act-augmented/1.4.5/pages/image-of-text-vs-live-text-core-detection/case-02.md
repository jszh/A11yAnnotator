# case-02 — Body-prose passage rasterized inside an SVG <image>, decoyed by SVG <title>/<desc>, beside live SVG <text>

## Scenario
The Lakeshore Public Library online reading room presents public-domain classics. The
"Featured excerpt" (the opening of *The Little Prince*) is a genuine raster **PNG** of a
six-line paragraph of body prose, embedded with `<svg role="img"><image href="data:image/png;base64,...">`.
The SVG carries a decoy `<title>`/`<desc>` ("The Little Prince, opening passage") so it has a
non-empty accessible name. A second block on the same page — "Today's poem" — renders Whitman
as **live, selectable SVG `<text>`**: visually similar styled lines, but real text in the DOM.
The two blocks look like sibling typographic features; one is an image of text (FAIL), the
other is text (PASS/inapplicable).

## Attribute tuple
- **Content domain:** higher-ed / public library digital collections (long-form editorial)
- **UI component / pattern:** "reading room" article cards with an inline SVG figure
- **Host-language construct:** inline `<svg>` with `<image href="data:image/png;base64,...">` (raster) plus decoy `<title>`/`<desc>`; contrasted with `<svg>` containing live `<text>`
- **Locale / i18n:** en
- **Failure mechanism:** image-of-text shipped as a real PNG raster behind an SVG accessible-name decoy, visually indistinguishable from a sibling live-`<text>` block

## Developer persona
A library digitization intern wanted the featured excerpt to keep an exact letterpress
texture from a scan-derived export, so they pasted the paragraph in as a PNG. Knowing scans
"need alt text", they wrapped it in `<svg role="img">` and wrote a `<title>`/`<desc>` naming
the book. For the poem block they had copied an SVG snippet from a tutorial that used live
`<text>`, never realizing the two blocks differ fundamentally in accessibility.

## Element / selector carrying the issue
`svg.excerpt-svg[aria-labelledby="excerpt-title excerpt-desc"] > image[href^="data:image/png"]`
— the six-line passage is raster pixels. (The "Today's poem" `svg` using `<text>` is the PASS
foil, not the issue.)

## Exact accessibility mechanism
A sighted reader reads the paragraph. A low-vision reader who needs a larger or higher-contrast
typeface cannot reflow or recolor it — it is a fixed PNG; the page even offers an "A+ Larger
text" control that visibly fails to enlarge it. A screen-reader user gets only the decoy name
"The Little Prince, opening passage" — the *information* of the passage is not the SC's concern
here; 1.4.5 is about the *visual presentation* of that body text being user-adjustable, and it
is not, because the text is an image. The same effect (serif body prose) is trivially achievable
with `@font-face` / live HTML — proven by the adjacent Whitman block, which is live SVG `<text>`
that selects, scales, and recolors. No essential/logotype exception applies to a paragraph of a
novel. So: image-of-text where the presentation was achievable → fail.

## Expected ACT-style outcome
**failed** (SC 1.4.5) for the *Little Prince* `<image>` block. The Whitman live-`<text>` block
is **inapplicable/passed** (it is text, not an image of text) and is included only to sharpen
the boundary.

## Why automated tools miss it
The PNG is delivered via an `<svg><image>` that has an accessible name from `<title>`/`<desc>`,
so axe/WAVE find no missing-alt / unnamed-image issue. Lighthouse sees a named graphic. None of
them OCRs the embedded PNG to discover it is a full paragraph of body prose (vs. a photo or
decorative scan), and none can tell that the visually-similar sibling block is live `<text>`
while this one is a raster — both are `<svg role="img">` with names. Distinguishing
rasterized-prose-that-should-be-live-text from genuinely-text requires reading the pixels and
judging achievability — human OCR-like detection.

## Citation
**Reference:** WCAG 2.2 Understanding — Images of Text, Intent (`wcag-understanding/images-of-text.html`)
> "If authors can use text to achieve the same visual effect, they should present the information as text rather than using an image."

**Reference:** WCAG 2.2 Understanding — Images of Text, definition note (`wcag-understanding/images-of-text.html`)
> "This does not include text that is part of a picture that contains significant other visual content. Examples of such pictures include graphs, screenshots, and diagrams which visually convey important information through more than just text."

**Reference:** Trusted Tester v5.1.3 SC 1.4.5, How to Test (`refs/trusted-tester/sc-1.4.5-images-of-text.md`)
> "Determine if text can be used instead of the image of text to present the **same effect and information**."
