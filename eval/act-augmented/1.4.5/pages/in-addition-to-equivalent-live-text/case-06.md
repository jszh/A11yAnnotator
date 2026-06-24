# case-06 — Bilingual (English + Spanish) water-shutoff notice posted as one image of text; the live-text "in addition to" version reproduces only the English half, leaving the Spanish block image-only => FAIL

## Scenario
A residents association ("Maple Court") posts a planned water-shutoff notice. The building is roughly
half Spanish-speaking, so the property manager designs the flyer bilingually and posts it as a single
image of text (raster-equivalent inline-SVG `data:` URI) containing an **ENGLISH** block AND an
**ESPAÑOL** block, both giving the same details: Tuesday 23 June, 9:00 AM–2:00 PM, Building 3 only,
store water. "In addition to" the image, the resident portal renders a live "Text version" — but a
volunteer transcribed only the **English** half. The Spanish block exists nowhere as live text; it is
present only in the image pixels.

## Attribute tuple
- **Content domain:** community / multi-tenant residential building notice
- **UI component / pattern:** building notice — bilingual flyer image + a "Text version" block
- **Host-language construct:** `<img>` inline-SVG `data:` URI (bilingual image of text) + a live `<section>` with the English text only
- **Locale / i18n:** en + es — the image is bilingual; the live equivalent drops one language entirely
- **Failure mechanism:** partial equivalence along a language boundary — the in-addition-to text omits the Spanish half

## Developer persona
A property manager who designs bilingual flyers in a graphics app (so both languages share one
branded layout) and a bilingual-by-accident volunteer who "typed up the text" for the portal. The
volunteer reads English comfortably and transcribed what they could read, leaving the Spanish in the
picture. No malice and no obvious gap to a casual English-reading reviewer — the page looks fully
captioned in English.

## Element / selector carrying the issue
`section.text-version` — the live text reproduces only the English block from the bilingual image. The
Spanish block in `.flyer img` has no live-text counterpart anywhere on the page.

## Exact accessibility mechanism
An English-reading screen-reader or low-vision user is served: they get the English notice as
restyleable live text. A **Spanish-reading** resident who is blind, or who has low vision and needs to
enlarge/recolour the text, gets their language only as immutable image pixels — they cannot resize,
recolour, or have a screen reader read the Spanish (the image's alt is just a label). For that user the
image of text is used *instead of* text. The "in addition to" met-condition requires the accompanying
text to convey *the same information* as the image; dropping an entire language means it does not, so
1.4.5 is not met for the Spanish content.

## Expected ACT-style outcome
**failed** (SC 1.4.5; the Spanish content also implicates 1.1.1). Both an image and live text are
presented, but the live text is not equivalent because it omits the Spanish half that the image carries.

## Why automated tools miss it
The image has a reasonable alt, the live English block is valid and could even be lang-correct, and
contrast is fine, so axe-core, WAVE, and Lighthouse stay green. No tool OCRs the flyer to discover it
contains a Spanish block, and none reasons that the live "Text version" reproduces only one of the two
languages the image carries. Spotting the dropped language requires a human who can read both languages
in the image, read the live text, and notice the Spanish half is image-only — semantic + visual +
multilingual judgment no automated checker performs.

## Citation
**Reference:** Understanding SC 1.4.5 Images of Text (`wcag-understanding/images-of-text.html`)
> "Where images of text are used in addition to text to convey the same information, and where both are presented to the user, this success criterion is met."

**Reference:** WCAG Technique F30 (`wcag-techniques/failures/F30.html`)
> "If the text in the \"text alternative\" cannot be used in place of the non-text content without losing information or function then it fails because it is not, in fact, an alternative to the non-text content."
