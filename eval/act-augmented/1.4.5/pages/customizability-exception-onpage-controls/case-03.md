# case-03 — Genuine C30 PASS: a canvas certificate heading that truly re-renders sharp at the user's chosen size and colour

## Scenario
A college credential-verification page renders its certificate heading, "Certificate of
Completion", into a `<canvas>` — a genuine **image of text** (bitmap pixels, not live HTML).
Near the top of the content, before the image, sits a real C30 customization control:
**A-  A+** for heading size and a colour `<select>` (navy / black / sepia / forest green).
Operating the control **re-renders the canvas glyphs** at the chosen font size and colour —
it redraws (does not CSS-scale), so the text stays sharp at every size with no pixelation,
and the full original wording is always drawn. This is the canonical PASS-by-customization
route, and it is confirmable only by operating the controls and watching the image re-render.

## Attribute tuple
- **content-domain:** higher-ed / credential verification
- **UI-component/pattern:** C30 customization control (A-/A+ size + colour select) placed before the image of text
- **host-language construct:** `<canvas>` re-rendered via 2D context at chosen size/colour
- **locale/i18n:** en
- **failure-mechanism:** none — this is the genuine PASS boundary variant (controls are real, re-render is sharp and equivalent)

## Developer persona
A senior engineer who had previously failed a 1.4.5 audit deliberately built the heading as
a canvas so the institutional certificate typeface is preserved, then implemented C30
properly: the customization control sits before the image, the canvas is *redrawn* (so it
never pixelates), the colour set includes a high-contrast black option, and the accessible
name is kept in sync with the rendered string. They tested it by enlarging to 60px and
switching to black, confirming the glyphs re-rasterized crisply.

## Element / selector carrying the issue (here, satisfying it)
The image of text: `#certTitle` (`<canvas role="img">`). The genuine customization control:
`.controls #inc` / `#dec` (size) and `#colorSel` (colour), each wired to a `render()` that
redraws the canvas glyphs at the requested size and colour.

## Exact accessibility mechanism
A low-vision user finds the size/colour control before the heading (per C30's "located near
the beginning of the page"), presses A+, and the heading is genuinely redrawn larger; they
pick "Black (high contrast)" and the glyphs are re-rasterized in black. Because each change
redraws the glyphs rather than stretching a fixed bitmap, the enlarged heading is sharp, not
pixelated — satisfying TT note 2a (size adjustment without pixelation). The image of text is
therefore visually customizable in font size and colour through controls the page provides,
so it meets the customizability exception. A screen-reader user still gets an accurate
`aria-label` equal to the rendered text.

## Expected ACT-style outcome
**passed** — SC 1.4.5 (Images of Text, Level AA). The heading is an image of text, but the
page provides working controls that re-render that image at the user's chosen size and
colour with no pixelation and no loss of content, satisfying the "can be visually
customized" route (TT 7.E condition 2 / C30).

## Why automated tools miss it
A canvas is opaque to scanners: axe-core/WAVE/Lighthouse cannot read the pixels to know they
spell "Certificate of Completion", cannot tell that the control re-renders rather than
CSS-scales, and cannot verify the enlarged output is sharp and complete. They would either
ignore the canvas or, at most, note its accessible name — they can neither *fail* it nor
*confirm the pass*. Establishing that this is a legitimate C30 customization (vs. the inert
twin in case-02) requires a human to operate the control, watch the canvas re-render, and
judge the result sharp and equivalent. The pass here is exactly as invisible to automation
as the failures are.

## Citation
> **Reference:** WCAG Technique C30 "Using CSS to replace text with images of text and
> providing user interface controls to switch" (`wcag-techniques/css/C30.html`)
>
> **Quote (verbatim):** "In addition, the control used to switch should be located near the
> beginning of the page."
>
> **Quote (verbatim):** "Check that when the control is activated the resulting page
> includes text (programmatically determined text) wherever images of text had been used."
>
> **Reference:** Trusted Tester v5.1.3 — Test 7.E `1.4.5-image-of-text`
> (`refs/trusted-tester/sc-1.4.5-images-of-text.md`)
>
> **Quote (verbatim):** "Customizing font size for an image of text also implies the ability
> to adjust the size without pixelation (typically evident when simply using the browser
> resize functionality to resize images)."
