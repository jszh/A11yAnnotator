# case-04 — Pricing comparison flattened into one image; alt="Pricing plans comparison" drops every price

## Scenario
A SaaS marketing page ("Cadence") renders its entire three-tier pricing comparison as a
single exported image (`<img>`, inline-SVG `data:` URI) so the bespoke layout survives across
browsers. The pixels carry the commercial terms: Starter $0/mo (1 seat, 100 events), Team
$29/mo (10 seats, 50,000 events, "MOST POPULAR"), Scale $99/mo (unlimited seats, 1,000,000
events). The `alt` is non-empty and accurate as a label
(`alt="Pricing plans comparison"`), but no plan name, price, seat count, or limit reaches
AT. A blind prospect cannot tell that Team is $29, or that a Scale tier exists at all.

## Attribute tuple
- **Content domain:** B2B SaaS marketing (developer tooling)
- **UI component / pattern:** pricing comparison table / tier cards
- **Host-language construct:** `<img>` with `alt`, `src` = inline-SVG `data:` URI; all tier data as SVG `<text>`
- **Locale / i18n:** en
- **Failure mechanism:** structured tabular text (plans + prices) rendered as one image; alt labels the image instead of reproducing the tiers

## Developer persona
A growth designer built the pricing section in Figma and used "export as image" so marketing
could swap it without a code deploy. The dev who placed it wrote a sensible-sounding alt
("Pricing plans comparison") to clear the linter, not appreciating that the prices and plan
names existed only as pixels and needed to be real, transcribed text.

## Element / selector carrying the issue
`img[alt="Pricing plans comparison"]` — the tier names, prices ($0, $29, $99), seat counts,
and event limits exist only as SVG `<text>` glyphs inside the image.

## Exact accessibility mechanism
The image's accessible name is "Pricing plans comparison". The accessibility tree exposes one
image node with that name; "$29", "Scale", "Starter", and the limits are absent from the DOM
text and a11y tree (verified: "$29" and "Scale" present in a11y tree = false). AT users learn
a comparison exists but not its contents — they cannot compare or choose a plan. Because this
is an image of meaningful (here, structured) text, the alternative must present the same
information; a one-line label cannot. WCAG G94 notes that when the text is more than fits in a
short alternative, a long text alternative with the complete text is required — none is
provided.

## Expected ACT-style outcome
**failed** (SC 1.1.1). Presence rule passes (alt non-empty); qt1vmo can pass (the name truly
labels the image as a pricing comparison). The page fails because the alternative omits the
plan names, prices, and limits the image conveys.

## Why automated tools miss it
`image-alt` passes on the non-empty alt. No scanner OCRs the graphic to recover "$29/mo",
"50,000 events", "Scale $99/mo", nor checks that the alt enumerates the tiers. Tools cannot
even tell the picture *is* a price table that should have been live HTML. Recognising the
omission requires reading the rendered table and the alt and comparing — a human visual and
contextual judgment.

## Citation
**Reference:** Trusted Tester v5.1.3 SC 1.1.1, Test 7.A step 1.d (`refs/trusted-tester/sc-1.1.1-non-text-content.md`)
> "If the image is of **meaningful text**, ANDI Output must contain the **same text**."

**Reference:** WCAG Technique G94 (`wcag-techniques/general/G94.html`)
> "If the text in the image is more than can fit in a short text alternative then it should be described in the short text alternative and a long text alternative should be provided as well with the complete text."

**Reference:** WCAG Failure F30 (`wcag-techniques/failures/F30.html`)
> "If the text in the "text alternative" cannot be used in place of the non-text content without losing information or function then it fails because it is not, in fact, an alternative to the non-text content."
