# case-06 — TRUE-NEGATIVE (PASS): #3366CC links on black at 3.9:1 lightness (G183 escape hatch)

## Scenario
A nonprofit "Where your gift goes" donation/impact page. Inline links are medium-light blue
`#3366CC` with **no** underline; body text is black `#000000` on white. This is the *literal*
G183 worked example: the link-vs-text lightness contrast is 3.91:1, at/above the 3:1 escape
hatch, so the links are distinguishable by lightness (not hue alone) even for users with no
color perception or viewing in grayscale. A `:hover`/`:focus-visible` underline is added as a
bonus but is not what carries conformance. This page exists to exercise the escape-hatch
boundary — an over-eager evaluator/tool would wrongly flag the underline-free links.

## Attribute tuple
- **content-domain:** nonprofit / donation & impact reporting
- **UI-component/pattern:** article-style body copy + `<figure>`/`<blockquote>` testimonial + `<aside class="stats">` flex stat strip; inline links in prose
- **host-language construct:** static HTML5; link color chosen to meet the 3:1 link-vs-text lightness rule
- **locale/i18n:** en-GB (£), place names in Malawi
- **failure-mechanism:** NONE — G183 escape hatch satisfied (this is the negative/PASS control)

## Developer persona
A foundation's web volunteer read WCAG technique G183, picked the exact recommended
`#3366CC` on black (which the technique certifies as 3.9:1 link-vs-text and 4.5:1+ on white),
and added a hover/focus underline on top as belt-and-braces. They did it correctly.

## Element / selector carrying the issue
`.body-copy a` — `color:#3366CC; text-decoration:none` at rest, underline on hover/focus.
This is the element under test; it PASSES.

## Exact accessibility mechanism
Link `#3366CC` vs black body text is **3.91:1** lightness contrast — meeting the 3:1
threshold the Understanding note and G183 define as an additional visual distinction beyond
hue. So a user who cannot perceive the blue still sees the links as *lighter* text and can
locate them; the distinction does not rely on color perception. Link-vs-white-background is
5.37:1 (1.4.3 satisfied). The hover/focus underline is supplementary confirmation, consistent
with G183 — and the page does not *depend* on it, which is the point (hover/focus alone would
not be sufficient, but here it isn't relied upon).

## Expected ACT-style outcome
**passed** — G183: links differ from surrounding text by a relative-luminance (lightness)
contrast of 3:1 or greater, satisfying the 1.4.1 escape hatch without relying on hue.

## Why automated tools miss it
This is the inverse blind spot: an over-eager "flag every underline-free colored link" tool
would *false-positive* here, and a strict 1.4.3-only tool sees nothing either way because it
never measures link-vs-text contrast. Correctly *clearing* this page requires computing the
3.91:1 link-vs-text lightness ratio and applying the 3:1 escape hatch — exactly the
measurement+judgment no axe/WAVE/Lighthouse rule performs. It tests that an evaluator does
not over-report.

## Citation
> **WCAG Technique G183** (`wcag-techniques/general/G183.html`):
> "The hypertext links in a document are medium-light blue (`#3366CC`) and the regular text
> is black (`#000000`). ... Because the blue text is light enough, it has a contrast of 3.9:1
> with the surrounding text and can be identified as being different from the surrounding text
> by people with all types of color vision deficiency, including those individuals who cannot
> see color at all."
