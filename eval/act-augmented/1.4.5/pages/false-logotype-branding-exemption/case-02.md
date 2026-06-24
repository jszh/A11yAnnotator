# case-02 — Section heading "Our 2026 Pricing Plans" rendered as an image and wrapped class="logo" role="img"

## Scenario
A SaaS pricing page. The real brand name "Quanta" appears as live text in the top bar, so
the actual logo is not the problem. Further down, the pricing section's heading "Our 2026
Pricing Plans" is delivered as a flat inline-SVG `<text>` image, wrapped in
`<div class="logo" role="img" aria-label="Our 2026 Pricing Plans">` and set in the brand
display face. The author rationalises that "the section title is part of the brand look, so
it's branding and therefore exempt from 1.4.5." But a section heading is ordinary
informational text — WCAG's canonical first example of "Images of Text" is literally "Styled
Headings" that should be CSS, not bitmaps. A heading is not a logo or brand name; the
logotype/branding exemption does not reach it.

## Attribute tuple
- **Content domain:** SaaS analytics dashboard (pricing page)
- **UI component / pattern:** section heading styled as a "logo" block (`class="logo" role="img"`)
- **Host-language construct:** `<div role="img" aria-label>` wrapping an `<img alt="">` with an inline-SVG `data:` URI
- **Locale / i18n:** en
- **Failure mechanism:** a styled heading exported as an image and labelled as "branding" to claim the logotype exemption

## Developer persona
A growth designer wanted the pricing section title to use the company's licensed marketing
typeface, which is not a web font on the site. To force the exact look, they exported the
title from Figma as an image and, copying a pattern they saw used for the header logo,
wrapped it in `class="logo" role="img"` with an `aria-label` so "screen readers still get the
words." They believed wrapping it as a logo made it exempt, not realising a section heading is
informational text that must remain live, resizable CSS.

## Element / selector carrying the issue
`main .section-head .logo[role="img"][aria-label="Our 2026 Pricing Plans"] > img` — the
heading text exists only as SVG glyphs inside this image.

## Exact accessibility mechanism
The `role="img"` element exposes the accessible name "Our 2026 Pricing Plans" via `aria-label`,
so a screen-reader user *hears* the words. But the criterion under test is 1.4.5, which is
about visual customisation, not name exposure: the heading is pixels, so a low-vision user who
needs the title at 200% in their own colours gets a blurred raster instead of reflowed,
recoloured text. The exemption the author invokes (logotype/branding) applies only when the
specific presentation is essential to a brand identity; a section heading's information ("Our
2026 Pricing Plans") is fully expressible as styled live text with the author's technologies,
so text must be used.

## Expected ACT-style outcome
**failed** (SC 1.4.5). The image of text is a heading, not a logotype or user-customisable
image; text could achieve the same effect, so the image-of-text is not permitted.

## Why automated tools miss it
The `role="img"` container has a non-empty accessible name (`aria-label`), so axe-core's
`role=img` / `image-alt` name checks pass — there is no empty-name defect. No automated tool
OCRs the SVG to learn the pixels are the section heading, and none can decide that a styled
heading is informational text rather than a brand mark. Distinguishing "branding" from "a
heading dressed as branding" is a human semantic/contextual judgment.

## Citation
**Reference:** WCAG 2.2 Understanding — Images of Text, "Examples", Styled Headings
(`wcag-understanding/images-of-text.html`)
> "Rather than using bitmap images to present headings in a specific font and size, an author uses CSS to achieve the same result."

**Reference:** WCAG 2.2 Understanding — Images of Text, Intent (`wcag-understanding/images-of-text.html`)
> "If authors can use text to achieve the same visual effect, they should present the information as text rather than using an image."

**Reference:** Trusted Tester v5.1.3 SC 1.4.5, How to Test step 1
(`refs/trusted-tester/sc-1.4.5-images-of-text.md`)
> "Determine if text can be used instead of the image of text to present the same effect and information."
