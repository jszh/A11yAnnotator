# case-01 — Hotel hero: white headline over a sunset photo, only the trailing word "Escape" washes out

## Scenario
A boutique-lodge landing page (Cape Reinga Lodge) with a full-bleed hero. The headline
"Book Your Sunset Escape" is live white text over a sunset background image that is deep
indigo on the left and ramps to a hot, blown-out sky on the right. The leading words sit on
the dark area and read at ~19:1; the trailing word **Escape** sits over the bright sky and
drops to ~1:1. Best-case and average contrast for the headline are excellent, so a best-case
algorithm passes it; only the last word fails.

## Attribute tuple
- **content-domain:** travel / hotel booking (boutique lodge)
- **UI-component/pattern:** full-bleed hero with overlaid headline + CTA
- **host-language construct:** CSS `background-image` (local PNG) + live `<h1>` text, `background-size:100% 100%`
- **locale/i18n:** en-NZ
- **failure-mechanism:** F83 background-image least-contrast — horizontal luminance gradient where only the trailing glyphs cross the bright region (worst-case white-on-sky ~1:1)

## Developer persona
A studio designer themed a Squarespace-style hero by dropping a stock sunset shot behind the
headline and setting the title to white "because white always works on hero photos." They
previewed it on a wide monitor where the title felt balanced and bright, never noticing that
on the cover-cropped image the last word lands on the bright part of the sky. They eyeballed
it once, it "looked premium," and shipped it.

## Element / selector carrying the issue
`.hero h1` — specifically the trailing word **Escape** (its glyphs span x-fraction ~0.39–0.53
of the `.hero` box, which is exactly where the baked sunset image turns bright).

## Exact accessibility mechanism
The headline is real DOM text (`color:#fff`) painted over a `background-image`. Measured in a
headless browser by sampling the actually-rendered background pixels behind each word:
- behind **Book** (leading word): worst-case contrast **19.35:1** — passes comfortably.
- behind **Escape** (trailing word): worst-case contrast **1.01:1** — far below 4.5:1.
- across the whole headline box the best-case (lightest-for-white = darkest) pixel is
  **~20:1**, and the worst-case is **1.0:1**.

A user with low vision reads "Book Your Sunset ______" — the last word is effectively
invisible against the sky. This is F83's failure: there is not sufficient contrast between the
text and the part of the image behind it. ACT's contrast rule scores the **best-case** pixel
pairing (~20:1) and reports pass; the Trusted Tester / F83 method eyedroppers the
**least-contrast** pixel behind the failing letters and finds 1:1.

## Expected ACT-style outcome
**failed** — F83 applies. Quickcheck (white vs the lightest pixel behind the text) is false in
the bright region, and the per-letter check confirms the trailing word's background does not
meet 4.5:1.

## Why automated tools miss it
axe-core, WAVE, and Lighthouse cannot read the pixels of a CSS `background-image`. They either
skip the contrast check for text over an image, or fall back to the element's solid
`background-color` (`#101019`), against which `#fff` is ~18:1 and "passes." They have no notion
of a per-region or per-letter worst-case pixel, and they never sample the bright part of the
photo where only the last word fails. Catching it requires a human to look at the rendered
image, notice the trailing word disappears, and eyedropper the least-contrast pixel behind it.

## Citation
> **WCAG Technique F83** (`wcag-techniques/failures/F83.html`):
> "This failure occurs when people with low vision are not able to read text that is displayed
> over a background image. When there is not sufficient contrast between the background image
> and the text, features of the background image can be confused with the text making it
> difficult to accurately read the text."

> **Trusted Tester v5.1.3 — SC 1.4.3** (`refs/trusted-tester/sc-1.4.3-contrast-minimum.md`):
> "Select the Foreground color-dropper, click a pixel in the text font. If the text color is
> varied, choose a pixel that provides the least contrast. ... Select the Background
> color-dropper, click a pixel in the background close to the text. If the background is
> varied, choose a pixel that provides the least contrast."
