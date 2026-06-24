# case-03 — RTL Arabic invitation over zellige tiles: the reading-start letters wash out over pale tiles

## Scenario
An Arabic-language event invitation (calligraphy evening) with the headline set in white over a
zellige (Moroccan geometric tile) background image. The document is RTL, so the line **starts on
the right** — and the right third of the tile raster is a band of pale sand-coloured tiles. The
first (rightmost, reading-start) word "يسرّنا" washes out to ~1.4:1 white-on-sand, while the rest
of the line over the deep teal/cobalt tiles reads at ~10:1+.

## Attribute tuple
- **content-domain:** events / ticketing (cultural invitation)
- **UI-component/pattern:** invitation card with overlaid headline over a decorative tile pattern
- **host-language construct:** `dir="rtl" lang="ar"` document + CSS `background-image` (local PNG zellige)
- **locale/i18n:** Arabic (RTL); reading order starts at the right edge where the pale tiles sit
- **failure-mechanism:** F83 background-image least-contrast — light text over a light tile band that, due to RTL, lands behind the FIRST glyphs of the line

## Developer persona
A web agency localised an English event template into Arabic for a Rabat client. The English
headline had been left-aligned and sat over the dark tiles, so it passed in the original. After
flipping the layout to RTL the agency confirmed the translation rendered and the gold accents
looked right, but never re-checked contrast — they didn't realise that mirroring the line moved
the opening word onto the pale tiles on the right.

## Element / selector carrying the issue
`.invite h1` — the white RTL headline; the failing glyphs are the reading-start word "يسرّنا"
(rightmost), which falls over the pale-sand tile band on the right of `bg-03-zellige.png`.

## Exact accessibility mechanism
The headline is real DOM text (`color:#fff`) over a `background-image`. Sampling the rendered
pixels behind each word:
- behind "يسرّنا" (reading-start, rightmost): worst-case contrast **1.38:1** — far below 4.5:1.
- behind "الخط" (later in the line, over teal tiles): worst-case **10.25:1** — passes.
- best-case pixel across the headline: **~14:1** (white over the darkest cobalt tile).

A low-vision reader, beginning at the right as Arabic requires, hits an invisible first word and
loses the opening of the sentence. ACT samples the best-case (darkest tile) pixel (~14:1) and
passes; the per-letter least-contrast check on the right-hand glyphs finds 1.4:1.

## Expected ACT-style outcome
**failed** — F83 applies. The Quickcheck against the lightest tile behind the white text fails on
the right, and the per-letter check shows the reading-start word below 4.5:1.

## Why automated tools miss it
Scanners cannot read the zellige raster and fall back to the section's solid `#0c4660`, where
`#fff` is ~7:1 and "passes." They also have no concept of reading order, so even if they could
sample the image they would not flag that the failing tiles sit behind the *first* word a screen
reader / low-vision user encounters. The interaction of RTL reading order with a per-region
luminance variation is a contextual, visual judgment.

## Citation
> **WCAG Technique F83** (`wcag-techniques/failures/F83.html`):
> "To satisfy Success Criterion 1.4.3 Contrast (Minimum) ... there must be sufficient contrast
> between the text and its background. For pictures, this means that there would need to be
> sufficient contrast between the text and those parts of the image that are most like the text
> and behind the text."

> **Trusted Tester v5.1.3 — SC 1.4.3** (`refs/trusted-tester/sc-1.4.3-contrast-minimum.md`):
> "If text is not selectable or appears on a background image, determine the contrast using the
> Colour Contrast Analyser (CCA). ... If the background is varied, choose a pixel that provides
> the least contrast."
