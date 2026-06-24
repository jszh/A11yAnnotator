# case-01 — Article ABOUT Garamond bakes its own body paragraphs into a Garamond image (font-representation exception abused)

## Scenario
A typography magazine ("The Serif Quarterly") publishes a feature, "Why Garamond still wins
for long reads." The writer reasoned that because the article is *about* Garamond, the body
copy should be shown *in* Garamond, so they exported the opening paragraphs as a single image
"typeset in genuine Garamond." But those paragraphs are ordinary informational prose — the
history of the typeface, an argument, a recommendation — not a specimen of letterforms.
Re-typesetting them in the reader's own font would lose nothing essential; the words are the
content. So the page misuses the "Representation of a font family" exception to justify
avoidable images of text. A true letterform specimen ("Hh Aa Gg Qq") is, correctly, kept as
live text for contrast — only the running prose was wrongly imaged.

## Attribute tuple
- **Content domain:** news / long-form editorial (typography magazine)
- **UI component / pattern:** article body / `<figure>` with an image of running prose
- **Host-language construct:** `<img>` whose `src` is an inline-SVG `data:` URI rendering multi-line body text
- **Locale / i18n:** en
- **Failure mechanism:** ordinary informational paragraphs delivered as an image of text, justified under the font-representation essential-presentation exception that does not apply

## Developer persona
A junior staff writer who had just read the WCAG Understanding example "Representation of a
font family" and concluded that any article discussing a typeface may present its text in
that typeface as an image. They opened the draft in InDesign, set the intro in EB Garamond,
exported it as a graphic, wrote a faithful alt, and shipped it — confident the exception
covered them because "substituting the font would change how the typeface looks."

## Element / selector carrying the issue
`article figure img[width="700"]` — the second figure. Its pixels are the article's opening
paragraphs (history + argument + recommendation), set in Garamond. (The first figure,
`p.specimen-live`, is live text and is fine.)

## Exact accessibility mechanism
The paragraphs exist only as SVG `<text>` glyphs inside the image; they are not live DOM
text. A user who needs a larger font, a different font family (e.g. a dyslexia-friendly
face), higher contrast, wider line spacing, or reflow at 200–400% zoom cannot adjust this
prose at all — it is a fixed raster and pixelates when enlarged. The information is the
words, not the letterforms, so the visual presentation is **not** essential: live HTML text
would convey the same effect and information while remaining adjustable. That is exactly the
condition 1.4.5 exists to prevent. (The alt fully transcribes the text, so screen-reader
users do get the words — which is why this is a 1.4.5 issue, not a 1.1.1 one.)

## Expected ACT-style outcome
**failed** (SC 1.4.5). The image of text can be replaced by live text with the same effect
and information; it is not a logotype, not customizable, and not a genuine font specimen, so
no exception applies.

## Why automated tools miss it
Every `<img>` has a non-empty, accurate `alt`, so axe-core / WAVE / Lighthouse `image-alt`
passes. The page has a real `<title>`, heading hierarchy, landmarks, and good contrast — no
linter rule fires. No automated tool OCRs the image to learn its pixels are running prose,
and none can decide whether that text is an *essential representation of a font* (exempt) or
*ordinary information that happens to be set in a font* (a violation). That distinction —
"the article ABOUT a font is not itself a font specimen" — is a human semantic judgment about
whether re-typesetting would destroy essential meaning.

## Citation
**Reference:** WCAG 2.2 Understanding Images of Text — Examples (`wcag-understanding/images-of-text.html`)
> "Representation of a font family ... A web page contains information about a particular font family. Substituting the font family with another font would defeat the purpose of the representation. The representation is included as a jpeg image which does not allow the text characteristics to be changed. The image has a text alternative."

**Reference:** WCAG 2.2 Understanding Images of Text — Intent (`wcag-understanding/images-of-text.html`)
> "If authors can use text to achieve the same visual effect, they should present the information as text rather than using an image."

**Reference:** Trusted Tester v5.1.3 SC 1.4.5, Test 7.E (`refs/trusted-tester/sc-1.4.5-images-of-text.md`)
> "Determine if text can be used instead of the image of text to present the **same effect and information**."
