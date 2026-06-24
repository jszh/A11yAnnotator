# case-07 — PASS control: class-pass promo image whose alt reproduces the displayed text including code FLEX15

## Scenario
A yoga studio ("Anchor Yoga") promo banner is itself a flattened image of text (`<img>`,
inline-SVG `data:` URI) carrying the same kind of load-bearing offer copy as the failing
cases: "NEW STUDENT OFFER / 5 classes for $15 / Use code **FLEX15** online / Offer ends
Friday, March 6". The difference is the `alt`: here it transcribes every displayed word,
including the promo code and deadline —
`alt="New student offer: 5 classes for $15. Use code FLEX15 online. Offer ends Friday, March 6."`
A screen-reader user receives the identical information a sighted user reads in the image:
they can enter FLEX15 and know the deadline.

## Attribute tuple
- **Content domain:** local services / fitness (yoga studio)
- **UI component / pattern:** promotional hero banner (same component family as case-01)
- **Host-language construct:** `<img>` with `alt`, `src` = inline-SVG `data:` URI; offer text as SVG `<text>`
- **Locale / i18n:** en
- **Failure mechanism:** NONE — the alt reproduces the same text the image displays (the correctly-authored boundary)

## Developer persona
The studio's manager built the banner in a design tool but had taken an accessibility
workshop. When filling the alt field they deliberately typed out the full offer verbatim —
including the code and the date — reasoning "a screen-reader user has to be able to use this
code too." This is the page that isolates that the defect in the other cases is
transcription, not the existence of an image of text.

## Element / selector carrying the issue
`img.promo` — its `alt` contains the verbatim displayed text. (No issue is present; this is the
positive control.)

## Exact accessibility mechanism
The image's accessible name is the full offer string. The accessibility tree exposes one
image node whose name includes "FLEX15" and "March 6" (verified: both present in a11y tree =
true). Replacing the image with its alt would lose no information — the code and deadline both
survive. For an image of meaningful text the alternative must contain the same text, and here
it does, so 1.1.1 is satisfied.

## Expected ACT-style outcome
**passed** (SC 1.1.1). The image is meaningful text, its accessible name reproduces that text
(TT 7.A.1.d), and the alternative could substitute for the image without losing information
(G94). Presence and descriptiveness rules pass, and the manual transcription-equivalence
check also passes.

## Why automated tools miss it
The same OCR-and-compare step automation cannot do to FAIL the other cases is the step needed
to CONFIRM this one passes. `image-alt` and qt1vmo pass here exactly as they do on case-01,
so a scanner cannot distinguish this correct page from the failing one — only a human reading
the image and the alt can tell that THIS alt actually reproduces the words (pass) while
case-01's does not (fail). The pass/fail boundary is invisible to automated tools, which is
why a positive control is included.

## Citation
**Reference:** Trusted Tester v5.1.3 SC 1.1.1, Test 7.A step 1.d (`refs/trusted-tester/sc-1.1.1-non-text-content.md`)
> "If the image is of **meaningful text**, ANDI Output must contain the **same text**."

**Reference:** WCAG Technique G94 (`wcag-techniques/general/G94.html`)
> "When non-text content contains words that are important to understanding the content, the alt text should include those words."

**Reference:** WCAG Technique G94 — procedure (`wcag-techniques/general/G94.html`)
> "If the non-text content contains words that are important to understanding the content, the words are included in the text alternative."
