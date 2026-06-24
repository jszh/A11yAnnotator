# case-01 — Accessibility-widget font scaler resizes the live text but never touches the image-of-text hero headline

## Scenario
A boutique fashion site ("Maison Verte") has bolted a drop-in "accessibility" toolbar to
the top of every page: **A-  A  A+** buttons with a live "100%" readout. The campaign
headline, "The Spring Linen Edit", is delivered as an inline-SVG **image of text** to
preserve the exact italic Georgia treatment. Operating A+ visibly enlarges the lede, the
product names and prices (real HTML text), so the toolbar *looks* like the C30 / "user can
customize the font size" customization route. But the SVG headline never changes size,
because the widget only multiplies a CSS custom property that the live `.scalable` text
reads — the SVG is sized in absolute user units. The customization control is real and
functional, yet it does not customize the one thing that is an image of text.

## Attribute tuple
- **content-domain:** e-commerce (fashion / apparel)
- **UI-component/pattern:** third-party "accessibility overlay" font-size toolbar (A-/A/A+)
- **host-language construct:** inline `<svg><text>` image of text + CSS `calc(var(--fs))` scaler
- **locale/i18n:** en-GB with French/euro content
- **failure-mechanism:** customization control works for live text but has no effect on the image of text (controls present + functional, but not on the IoT)

## Developer persona
An agency dev was told by the client that an "accessibility widget would solve our ADA
risk", so they pasted in a self-hosted A-/A/A+ snippet from a CodePen and wired it to a
`--fs` variable. They tested it on a paragraph, saw the text grow, and shipped. Nobody
noticed the hero headline is an SVG that the variable never reaches — the demo looked like
it "made the text bigger", which was the box they were trying to tick.

## Element / selector carrying the issue
The hero image of text: `.hero svg[aria-label="The Spring Linen Edit"]`. The control that
falsely implies it is customizable: `.a11y-bar #inc` / `#dec` (they drive
`--fs`, which only `.scalable` HTML elements consume).

## Exact accessibility mechanism
A low-vision user who cannot read 46–54px italic serif relies on enlarging text. They find
the A+ control, press it, and watch the body copy grow to 150% — confirming the control
"works" — but "The Spring Linen Edit" stays exactly the same pixel size and cannot be made
larger, recoloured, or restyled. For 1.4.5 the image of text passes the customization limb
only if the page provides controls that adjust **that image's** font, size, colour and
background (TT Test 7.E condition 2). Here the controls adjust everything *except* the image
of text, so the headline is an image of text with no customization route and no
text-equivalent — a fail. A screen-reader user gets the `aria-label` (so 1.1.1 is met), but
the low-vision sighted user gets a fixed bitmap of text.

## Expected ACT-style outcome
**failed** — SC 1.4.5 (Images of Text, Level AA). The headline is an image of text that
could have been live text; the on-page customization control is real but does not
customize the image, so the customizability exception (TT 7.E condition 2 / C30) is not met.

## Why automated tools miss it
Every naive check passes: the SVG has `role="img"` and a non-empty `aria-label`, the page
title is present, contrast of the SVG fill against its background clears 4.5:1, and the
A-/A/A+ buttons have proper `aria-label`s. axe-core, WAVE and Lighthouse cannot OCR the SVG
to discover its `<text>` is a styled headline that should have been live text, and they
cannot *operate* the A+ control and visually compare before/after frames to learn that the
SVG didn't move while the paragraphs did. Distinguishing "control customizes the image of
text" from "control customizes only the surrounding live text" requires a human to push the
button and watch.

## Citation
> **Reference:** Trusted Tester v5.1.3 — Test 7.E `1.4.5-image-of-text`
> (`refs/trusted-tester/sc-1.4.5-images-of-text.md`)
>
> **Quote (verbatim):** "Determine if the image of text can be **visually customized**:
> adjust the font, size, color, and background with controls provided by the web page."
>
> **Reference:** WCAG Technique C30 "Using CSS to replace text with images of text and
> providing user interface controls to switch" (`wcag-techniques/css/C30.html`)
>
> **Quote (verbatim):** "Check that when the control is activated the resulting page
> includes text (programmatically determined text) wherever images of text had been used."
