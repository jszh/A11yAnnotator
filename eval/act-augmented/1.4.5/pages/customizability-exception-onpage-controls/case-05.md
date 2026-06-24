# case-05 — Dynamically generated quote image with a size selector that re-requests the same low-res raster, so enlarging pixelates

## Scenario
A newspaper's "Quote of the Day" pull-quote is a **dynamically generated image of text**
produced by an in-house typesetting service. A "Display size" `<select>` (Small / Medium /
Large / Extra large) re-requests the image at a larger size — the textbook
dynamically-generated-image customization control from the Understanding doc. The control
genuinely works: the quote card visibly grows. But the quote engine only ever holds one
**low-resolution master raster**; every larger "size" is that same small bitmap displayed
bigger, so the italicised text turns blurry and blocky as it enlarges. The customization is
present and functional, yet it fails the no-pixelation sub-requirement (TT note 2a): you can
make the image of text bigger, but not legibly bigger.

## Attribute tuple
- **content-domain:** news / long-form editorial (pull-quote)
- **UI-component/pattern:** dynamically-generated-image size selector (`?size=` re-request)
- **host-language construct:** `<img>` of text (data: raster) re-requested + CSS-upscaled; `image-rendering: pixelated`
- **locale/i18n:** en
- **failure-mechanism:** size customization works but produces pixelated/blurry output (no high-resolution re-render) — fails TT note 2a

## Developer persona
A CMS engineer built a "quote generator" microservice that renders each quote to a single
modest PNG sized for the column. To honour an accessibility request ("let readers enlarge
the quote"), they added a size selector that re-requests `/quote?size=N`. But the service
caches one master raster per quote and just sends it back; nobody regenerated it at higher
DPI. In a quick test the quote "got bigger", which looked like a win — the blockiness at
Extra large went unnoticed because the dev never zoomed in to read it.

## Element / selector carrying the issue
The dynamically generated image of text: `#quoteImg` (`<img>` of an italic quote). The
control: `#qsize` (`<select>` whose handler re-requests the same master raster and CSS-scales
it up, so larger sizes are pixelated — see `image-rendering: pixelated`).

## Exact accessibility mechanism
A low-vision user picks "Large" or "Extra large" expecting a crisper, bigger quote. The card
grows, but because the only available raster is low-resolution, the enlarged glyphs are
soft-edged and stair-stepped — harder to read than the small original, defeating the point
of enlarging. For 1.4.5 the customizability exception requires that adjusting the image of
text's size does **not** pixelate (TT note 2a explicitly ties font-size customization to
"the ability to adjust the size without pixelation"). A control that scales a low-res bitmap
instead of regenerating sharp text does not meet it. So the quote is an image of text whose
nominal size control fails the equivalence/legibility bar — a (borderline) fail.

## Expected ACT-style outcome
**failed** — SC 1.4.5 (Images of Text, Level AA). The pull-quote is an image of text with a
size-customization control, but enlarging it pixelates rather than re-rendering sharp text,
so the "can be visually customized" route is not satisfied (TT 7.E condition 2, note 2a).

## Why automated tools miss it
The `<img>` has a complete `alt` reproducing the quote and attribution (so 1.1.1 passes),
the size `<select>` is a real labelled control, and the page is well-formed. axe-core, WAVE
and Lighthouse cannot OCR the raster to know it is a styled quote of text, and — decisively —
they cannot select "Extra large" and *visually judge* that the enlarged glyphs are blurry
and blocky rather than sharp. Pixelation-after-enlargement is a perceptual call: the tester
must operate the size control and look at the result. (This is the case the TT note about
"using the browser resize functionality to resize images" is written for.)

## Citation
> **Reference:** Trusted Tester v5.1.3 — Test 7.E `1.4.5-image-of-text`, How to Test 2a
> (`refs/trusted-tester/sc-1.4.5-images-of-text.md`)
>
> **Quote (verbatim):** "Customizing font size for an image of text also implies the ability
> to adjust the size without pixelation (typically evident when simply using the browser
> resize functionality to resize images)."
>
> **Reference:** WCAG 2.2 Understanding 1.4.5 Images of Text — Examples (Dynamically
> Generated Images) (`wcag-understanding/images-of-text.html`)
>
> **Quote (verbatim):** "A web page uses server-side scripting to present text as an image.
> The page includes controls that allow the user to adjust the font size and foreground and
> background colors of the generated image."
