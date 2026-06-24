# case-01 — Wordmark (exempt) stacked above the marketing tagline baked into an image (not exempt)

## Scenario
A fintech homepage masthead contains two images of text, stacked and styled as one "brand
lockup". The top image is the one-word company **wordmark** "Northwind" in a custom italic
display face — a genuine logotype whose visual presentation is its identity, so 1.4.5
exempts it. Directly beneath, in the same centered branding zone and the same brand colours,
sits a second flat image whose pixels spell the full **marketing tagline** "Northwind — the
smartest way to manage your money, every day." That sentence is ordinary informational/
marketing prose; it is not a brand mark and could trivially be live, resizable, recolourable
text. Dressing it in the brand face and exporting it as pixels so it "matches the logo" is
exactly the logotype-exemption dodge. The two images carry opposite verdicts on one page.

## Attribute tuple
- **Content domain:** online banking / fintech marketing site
- **UI component / pattern:** centered masthead "brand lockup" (wordmark + tagline)
- **Host-language construct:** two `<img>` elements with inline-SVG `data:` URIs (glyphs as pixels), non-empty `alt`
- **Locale / i18n:** en
- **Failure mechanism:** marketing-sentence image-of-text styled to read as part of the logo, falsely claiming the logotype/branding exemption

## Developer persona
A brand designer delivered the homepage as a Figma export. To guarantee the tagline rendered
in the exact licensed display font on every device, they flattened the wordmark AND the
tagline into the same SVG/PNG "logo lockup" and handed it to the front-end dev as one asset.
The dev dropped both images into the header, wrote honest alt text matching what each says,
and assumed "it's the logo, logos are allowed as images" — without separating the wordmark
(legitimately exempt) from the sentence (which is just text).

## Element / selector carrying the issue
`header.masthead img.tagline-banner[alt="Northwind — the smartest way to manage your money, every day"]`
— the FAIL element. The sibling `img.wordmark[alt="Northwind"]` is the PASS twin.

## Exact accessibility mechanism
Both images render their text as SVG `<text>` glyphs (verifiable: the strings never appear in
`document.body.innerText` or as selectable text; at 200% browser zoom they rasterise/blur). A
low-vision user who needs 24px text in their own high-contrast palette cannot restyle the
tagline because it is pixels, not text — the precise harm 1.4.5 targets. The wordmark image
shares that limitation but is *permitted* because its specific presentation is essential to
the brand identity (logotype). The tagline image is *not* permitted because the same
information ("we are the smartest way to manage your money") can be conveyed with text using
the author's existing technologies, so text must be used instead.

## Expected ACT-style outcome
**failed** (SC 1.4.5). The page contains at least one image of text — the tagline — that
could be real text and is neither a logotype nor user-customisable. The wordmark image alone
would be **passed/inapplicable** (logotype exemption); the page fails because of the tagline.

## Why automated tools miss it
axe-core, WAVE, and Lighthouse confirm each `<img>` has non-empty, accurate `alt`, so
`image-alt` passes for both — there is no missing-attribute defect to flag. No automated tool
performs OCR to discover the pixels contain a sentence, and crucially none can reason that the
"Northwind" image is a brand identity (exempt) while the identically-styled tagline image is
ordinary marketing text (not exempt). That distinction is the human-only judgment 1.4.5 / TT
step 1a turns on.

## Citation
**Reference:** WCAG 2.2 Understanding — Images of Text, "A logo containing text" example
(`wcag-understanding/images-of-text.html`)
> "The logo contains logotype (text as part, or all, of the logo). The visual presentation of the text is essential to the identity of the logo and is included as a gif image which does not allow the text characteristics to be changed."

**Reference:** WCAG 2.2 Understanding — Images of Text, Intent (`wcag-understanding/images-of-text.html`)
> "If authors can use text to achieve the same visual effect, they should present the information as text rather than using an image. ... This includes instances where a particular presentation of text is essential to the information being conveyed, such as type samples, logotypes, branding, etc."

**Reference:** Trusted Tester v5.1.3 SC 1.4.5, How to Test step 1a
(`refs/trusted-tester/sc-1.4.5-images-of-text.md`)
> "Logotypes (text that is part of a logo or brand name) cannot be replaced by text."
