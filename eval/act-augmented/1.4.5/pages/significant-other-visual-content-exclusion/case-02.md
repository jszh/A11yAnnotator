# case-02 — A restaurant menu published as one ornately-framed image: decoration is not "significant other visual content"

## Scenario
A neighbourhood restaurant ("Olive & Thyme Kitchen") publishes its daily menu as ONE designed image
(inline-SVG `data:` URI, so the words are pixels). The designer wrapped the menu in a double border,
a small laurel/dot monogram at the top, an italic display title, an ornamental rule between courses,
and a fork-and-knife glyph at the bottom. These flourishes make the picture FEEL like "a picture
with significant other visual content," tempting a tester to grant the 1.4.5 exclusion. But the
ornament carries no information: the actual content — courses, dish names, descriptions, prices,
the soup of the day, the allergen note — is entirely text, merely laid out decoratively. Remove the
laurel/border/glyph and nothing informational is lost. So this is an image of text.

## Attribute tuple
- **Content domain:** restaurant menu & ordering (local hospitality)
- **UI component / pattern:** single hero `<figure>` menu image inside a CMS page
- **Host-language construct:** `<img alt>` with a base64-encoded inline-SVG `data:` URI
- **Locale / i18n:** en (USD prices)
- **Failure mechanism:** decorative-frame trap — ornamental graphics dress up a block of text but do not "convey important information through more than just text," so the exclusion does not apply

## Developer persona
The owner's daughter designs the menus in Canva each morning to keep the brand's serif look and
hand-drawn border, then uploads the flattened export to the site's "Menu" page through a limited
CMS that only accepts an image and an alt string. She wrote a faithful alt transcript, assuming the
decorative border and monogram make it "a picture, not text," and that the alt covers accessibility.
The border is pure decoration; the menu is text that should be live HTML.

## Element / selector carrying the issue
`#menu img` — the single framed menu image; the dish names, descriptions and prices live only as
pixels inside it.

## Exact accessibility mechanism
The image's accessible name is the `alt` transcript, so 1.1.1/`image-alt` is satisfied. 1.4.5 still
fails: the menu is presented AS an image RATHER THAN as text. A low-vision diner cannot enlarge the
$ prices without pixelation, cannot apply a high-contrast or larger user stylesheet, cannot reflow
the two-column price layout on a phone, and cannot select/translate "roasted parsnip." The laurel,
border and monogram are non-text content but they are not *significant* — they convey no information
— so they do not move the picture into the excluded "graphs/screenshots/diagrams" category.

## Expected ACT-style outcome
**failed** (SC 1.4.5; also implicates 1.4.10 reflow). The menu should be live HTML text with CSS for
the decorative frame, or at minimum offered as text in addition to the image.

## Why automated tools miss it
`image-alt` passes (the alt is present and rich). No automated tool decides whether the laurel/border/
monogram is "significant other visual content" (which would exclude the image) or mere decoration
around an image of text (in scope). Judging that the ornament is doing no informational work —
distinct from a real graph/diagram where geometry carries meaning — is exactly the human gestalt the
SC requires.

## Citation
**Reference:** Understanding SC 1.4.5 Images of Text (`wcag-understanding/images-of-text.html`)
> "This does not include text that is part of a picture that contains significant other visual content. Examples of such pictures include graphs, screenshots, and diagrams which visually convey important information through more than just text."

**Reference:** Understanding SC 1.4.5 Images of Text (`wcag-understanding/images-of-text.html`)
> "If authors can use text to achieve the same visual effect, they should present the information as text rather than using an image."

**Reference:** Trusted Tester v5.1.3 SC 1.4.5 (`refs/trusted-tester/sc-1.4.5-images-of-text.md`)
> "Determine if text can be used instead of the image of text to present the same effect and information."
