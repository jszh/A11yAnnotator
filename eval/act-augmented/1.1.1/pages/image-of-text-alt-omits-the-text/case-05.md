# case-05 — Arabic (RTL) Eid sale banner image; English alt "seasonal sale graphic" drops the offer and code EID30

## Scenario
A Gulf-region fashion store ("متجر ندى للأزياء") runs an Eid promotion. The campaign banner
is a single flattened `<img>` (inline-SVG `data:` URI) whose pixels carry the whole offer in
Arabic plus a Latin discount code: عروض العيد (Eid offers) / خصم 30% على كل الفساتين
(30% off all dresses) / استخدم الرمز **EID30** (use code EID30) / حتى 15 شوال (until 15
Shawwal). The author set `alt="seasonal sale graphic"` — non-empty, generic, and in English
on an `lang="ar"` page. An Arabic screen-reader user hears an out-of-language label that omits
the discount, the category, the code EID30, and the deadline.

## Attribute tuple
- **Content domain:** international e-commerce (fashion, Gulf/Eid campaign)
- **UI component / pattern:** seasonal promo hero banner, RTL layout
- **Host-language construct:** `<img>` with `alt`, `src` = inline-SVG `data:` URI; offer text as Arabic SVG `<text>` + a Latin code
- **Locale / i18n:** ar (RTL); embedded Latin promo code; alt written in the wrong language (en)
- **Failure mechanism:** non-empty alt that neither reproduces the displayed words nor matches the content language; the code and deadline are pixels only

## Developer persona
An English-speaking agency assembled the Arabic storefront from a template. The localisation
team supplied the finished Arabic banner as a single image; the agency dev filled the alt
field from their own (English) campaign brief — "seasonal sale graphic" — never transcribing
the Arabic copy or the EID30 code into the alt, and never flagging that the alt language did
not match the page.

## Element / selector carrying the issue
`img.banner[alt="seasonal sale graphic"]` — the Arabic offer lines and the Latin code EID30
exist only as SVG `<text>` glyphs inside the image.

## Exact accessibility mechanism
The image's accessible name is "seasonal sale graphic". The accessibility tree exposes one
image node with that name; "EID30" is absent from the DOM text and the a11y tree (verified:
"EID30" present in a11y tree = false). So an Arabic AT user receives neither the offer terms
nor the code, and the alternative is in a different human language than the content. Because
this is an image of meaningful text, the alternative must contain the same text — here, in
the content's language (the Understanding note requires alternatives to match the human
language of the content).

## Expected ACT-style outcome
**failed** (SC 1.1.1). Presence rule passes (alt non-empty). The page fails because the
alternative reproduces none of the displayed Arabic offer text or the EID30 code, and is in
the wrong language.

## Why automated tools miss it
`image-alt` passes on the non-empty alt. No scanner OCRs Arabic text out of a raster image,
recognises the embedded Latin promo code, and verifies the alt reproduces those words in the
page's language. A `lang` mismatch between an alt string and the image content is not a check
any automated tool performs. Transcription equivalence across a script/language boundary is a
manual judgment.

## Citation
**Reference:** Trusted Tester v5.1.3 SC 1.1.1, Test 7.A step 1.d (`refs/trusted-tester/sc-1.1.1-non-text-content.md`)
> "If the image is of **meaningful text**, ANDI Output must contain the **same text**."

**Reference:** WCAG 2.2 Understanding Non-text Content — Note on alternatives matching the language of content (`wcag-understanding/non-text-content.html`)
> "Text alternatives and equivalents should match the human language of the original content (normally the default human language of the page)."

**Reference:** WCAG Technique G94 (`wcag-techniques/general/G94.html`)
> "When non-text content contains words that are important to understanding the content, the alt text should include those words."
