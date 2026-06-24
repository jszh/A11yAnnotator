# case-02 — Tariff comparison painted on a `<canvas role="presentation">` (prices lost to AT)

## Scenario
A "Brightwater Energy" tariff-comparison page. Under the heading "Tariff comparison (prices
include VAT)" the entire comparison — peak unit price, off-peak unit price, standing charge,
and average annual bill for three tariffs (Standard Saver / Day & Night / Green Fixed) — is
painted onto a single `<canvas>`. The canvas carries `role="presentation"` and has **no
fallback content** inside it, no HTML `<table>`, no `<dl>`, and no text duplicate of the
prices anywhere on the page. A sighted shopper reads every price and chooses a tariff; a
screen-reader shopper gets the heading, the marketing blurb, the `<select>`, and the button,
but **zero prices**, and cannot compare tariffs.

## Attribute tuple
- **content-domain:** utilities / energy retail e-commerce
- **UI-component/pattern:** tariff (price) comparison table
- **host-language construct:** `<canvas role="presentation">` with prices drawn as pixels (no fallback DOM, no `<table>`)
- **locale/i18n:** en-GB (pence / £ pricing)
- **failure-mechanism:** informative data painted to a `<canvas>` (pixels, not DOM) and declared decorative, so the data is genuinely absent from the accessibility tree (F38 applied contextually to informative content + no programmatic equivalent)

## Developer persona
A growth team A/B-tested a hand-coded comparison widget and found a `<canvas>`-rendered chart
animated more smoothly than their old HTML table, so they shipped it. To stop a screen reader
from announcing a bare, unlabeled "canvas" graphic, a developer added `role="presentation"` —
believing that "cleaning up" the announcement was the accessible choice. They never noticed
that, unlike an inline `<svg>` (whose `<text>` nodes stay in the tree), a `<canvas>` exposes
**nothing** to AT: its numbers exist only as rasterised pixels, so declaring it decorative
deleted the only copy of the pricing data for non-visual users instead of providing a real
table.

## Element / selector carrying the issue
`section.panel canvas#rateChart[role="presentation"]` (all prices are painted pixels; the
canvas has no fallback DOM content)

## Exact accessibility mechanism (what AT experiences, why it fails)
A `<canvas>` element contributes nothing to the accessibility tree unless it is given a
role/name or carries fallback DOM content; its drawing is pure pixels. Here the canvas has
neither a meaningful role nor any fallback content, and it additionally carries
`role="presentation"`, confirming the author intends it to be ignored. So
`Accessibility.getFullAXTree` shows the canvas as an ignored node with **no descendant
StaticText for any price** — verified: a screen-reader user reaches the "Tariff comparison
(prices include VAT)" heading, then the blurb, then the tariff `<select>`, but never any
peak/off-peak/standing-charge/annual-bill value. The prices convey information (the data
needed to compare and pick a tariff) and are the **only** means of conveying it (no table, no
text duplicate, no fallback), so SC 1.1.1 requires a text alternative or, better, real
tabular text. Marking the chart decorative invokes the decoration exception for content that
is plainly informational — a contextual F38 failure.

This is the technically-sound version of the "suppressed-as-decorative" boundary: the harm is
real because canvas pixels never enter the tree. (Contrast an inline `<svg role="presentation">`
whose descendant `<text>` cells would *remain* in the tree — that does **not** suppress the
data and is **not** the failure modeled here.)

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
A `<canvas role="presentation">` with no fallback content is valid,
decorative-by-construction markup. No automated tool OCRs the painted canvas pixels to
discover they form a price-comparison table, and none can know the pricing data appears
nowhere else on the page. axe/WAVE/Lighthouse see an intentionally-decorative canvas and a
properly-labelled `<select>` and report no issue. Recognising that this "decoration" is
actually the sole carrier of the tariff data requires reading the rendered prices and
confirming there is no text equivalent — a visual + contextual human judgment.

## Citation
> **WCAG 2.2 Understanding Non-text Content, Intent:**
> "The intent of this success criterion is to make information conveyed by non-text content accessible through the use of a text alternative.  Text alternatives are a primary way for making information accessible because they can be rendered through any sensory modality (for example, visual, auditory or tactile) to match the needs of the user."

(Verbatim from `wcag-understanding/non-text-content.html`. The tariff comparison "conveys
information" (the prices) and therefore needs a text alternative; painting it to a `<canvas>`
and declaring it `role="presentation"` denies that information to non-visual users.)

> **WCAG Technique F38 (failure), Description:**
> "This describes a failure condition for text alternatives for images that should be ignored by assistive technology (AT). If an image has the attribute `role="presentation"`, it will be ignored by AT."

(Verbatim from `wcag-techniques/failures/F38.html`. F38 confirms that `role="presentation"`
causes AT to ignore the element — exactly the behaviour the author relied on; applied here to
*informative* (not decorative) content, ignoring it is the failure, because the canvas is the
only carrier of the pricing data.)
