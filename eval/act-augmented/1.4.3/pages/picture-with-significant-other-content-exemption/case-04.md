# case-04 — Public-health infographic saved as one image; pale-on-pale labels at 2.5:1 (in scope, fails)

## Scenario
A Northbridge Public Health page, "How to read a nutrition label," embeds the explainer as a
single flat infographic (one exported graphic, here an inline-SVG `data:` URI). The diagram has
boxes and connector lines, but the **significant content is the step text itself** — labels and
captions rendered as an image to achieve a designed layout. The body labels are lavender
`#8d84ac` on a pale-lilac panel `#ddd8e8` = **2.50:1**, far below 4.5:1 for normal text. This
is an image of text done for a particular look, not a picture with significant other visual
content, so it is in scope and **fails**.

## Attribute tuple
- **Content domain:** government / public-health civic information
- **UI component / pattern:** explanatory infographic (figure with figcaption)
- **Host-language construct:** single `<img>` infographic (inline-SVG `data:` URI) with a genuine long-description `alt`
- **Locale / i18n:** en
- **Failure mechanism:** image-of-text infographic whose body labels render at 2.5:1; the chart-like chrome tempts a reviewer to misread it as an exempt "picture"

## Developer persona
A health-department communications officer built the infographic in Canva to match the
agency's brand palette (soft lavenders) and exported it as one PNG/JPEG for the CMS. They wrote
a careful alt that summarizes all four steps (so 1.1.1 is satisfied) but never sampled the
label contrast, assuming "it's just an image, the alt covers it." The pale-on-pale palette
looked elegant on their high-quality monitor.

## Element / selector carrying the issue
`figure img[alt^="Infographic: a sample nutrition label"]` — the step labels are SVG `<text>`
with `fill="#8d84ac"` over `#ddd8e8` panels (2.50:1). They are the in-scope image-of-text whose
rendered contrast fails.

## Exact accessibility mechanism
A low-vision user looking at the infographic cannot resolve the lavender-on-lilac step text at
2.50:1, and because it is an image they cannot apply a high-contrast user stylesheet or reader
mode to it. The author intended these labels to be read as text (the diagram's whole purpose),
so they are images of text in scope of 1.4.3 and must meet 4.5:1. The "picture with significant
other visual content" exemption does not apply: the boxes and lines are decorative framing, not
significant content that makes the text incidental. A tester eyedroppers the worst label pixel
vs the panel with the Colour Contrast Analyser and gets 2.50:1 < 4.5:1. (The alt provides an
equivalent for non-sighted users, so 1.1.1 passes — the defect is specifically the visual
contrast for low-vision users who DO use the image.)

## Expected ACT-style outcome
**failed** (SC 1.4.3). No live text node exists for ACT afw4f7 to evaluate, so automated
contrast is silent; the in-scope image of text renders at 2.50:1, so the page fails.

## Why automated tools miss it
The infographic is one `<img>` with non-empty, descriptive alt — no alt error fires. axe/WAVE/
Lighthouse compute contrast only for live text nodes and cannot OCR or sample the pale labels
inside the image, so no contrast error fires either. Deciding that this diagram's significant
content is its text (making it an in-scope image of text, not an exempt picture) and then
measuring the worst label is a human-only classification-plus-eyedropper task.

## Citation
**Reference:** WCAG 2.2 Understanding SC 1.4.3 (`wcag-understanding/contrast-minimum.html`)
> "In this provision there is an exception that reads "that are part of a picture that contains significant other visual content,". This exception is intended to separate pictures that have text in them from images of text that are done to replace text in order to get a particular look."

**Reference:** WCAG Failure F83 (`wcag-techniques/failures/F83.html`)
> "To satisfy Success Criterion 1.4.3 Contrast (Minimum) and 1.4.6 Contrast (Enhanced), there must be sufficient contrast between the text and its background. For pictures, this means that there would need to be sufficient contrast between the text and those parts of the image that are most like the text and behind the text."
