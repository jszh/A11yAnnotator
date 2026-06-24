# case-02 — Museum wall label: a dark marble vein crosses behind some caption letters (F looks like E)

## Scenario
A museum gallery page. A wall-label caption is set in dark serif text over a digitised scan of
a polished Carrara marble slab. The marble is a pale cream where dark text is highly legible
(~13:1), but a bold dark-grey vein meanders down the caption column and crosses the strokes of
some letters on every line. Where a serif glyph crosses the vein, the dark stroke merges into
the dark vein — F83's canonical "the lines cross behind the letters making F's look like E's."

## Attribute tuple
- **content-domain:** arts / museum & gallery (sculpture exhibition)
- **UI-component/pattern:** `<figure>` plinth card with overlaid `<figcaption>`-style caption
- **host-language construct:** CSS `background-image` (local PNG marble) under a multi-line `<p>` caption
- **locale/i18n:** en-GB
- **failure-mechanism:** F83 background-image least-contrast — a dark vein behind dark text drops local contrast to ~1.6:1 on specific glyphs (the "lines cross behind letters" confusion)

## Developer persona
A junior CMS author building the exhibition microsite wanted the wall labels to feel like the
real stone, so they uploaded a high-res marble texture as the caption background and kept the
existing dark label ink. They tested with a short placeholder ("Lorem ipsum") that happened to
miss the vein, saw it was readable, and replaced it with the real caption — never re-checking
that the longer text now runs straight through the dark veining.

## Element / selector carrying the issue
`.plinth .caption` — the dark serif caption; the failing glyphs are those whose strokes cross
the meandering dark vein baked into `bg-02-marble.png` (it weaves through x-fraction ~0.20–0.52
down the caption column).

## Exact accessibility mechanism
The caption is real DOM text (`color:#1b1b1b`) over a `background-image`. Sampling the rendered
pixels behind the whole caption box:
- worst-case contrast anywhere behind the text: **1.59:1** (a dark glyph stroke sitting on the
  dark vein) — far below 4.5:1.
- best-case pixel in the band: **~15:1** (dark text on the pale marble away from the vein).

For a low-vision reader, the letters that cross the vein lose their distinguishing strokes:
the crossbar/serif detail merges into the vein so an **F** can read as an **E**, an **h** as an
**n**, etc. — exactly F83 Failure Example 1. ACT's best-case algorithm samples the lightest
marble pixel (~15:1) and passes; the per-letter least-contrast check finds the 1.6:1 strokes.

## Expected ACT-style outcome
**failed** — F83 applies. Quickcheck against the darkest pixel behind the dark text fails, and
checking the background behind each letter shows several letters crossing the dark vein below
4.5:1.

## Why automated tools miss it
Scanners cannot sample the marble raster; against the figure's solid fallback `#ece7df` the dark
text is ~12:1 and "passes." No automated tool models "a vein crossing the stroke of this
particular glyph," nor the perceptual confusion of an F reading as an E. Deciding that some
letters merge with the veining is an irreducibly visual, per-letter human judgment.

## Citation
> **WCAG Technique F83 — Failure Example 1** (`wcag-techniques/failures/F83.html`):
> "Black text overlays an image with black lines. The lines cross behind the letters making F's
> look like E's etc."

> **WCAG Technique F83 — Procedure** (`wcag-techniques/failures/F83.html`):
> "If the Quickcheck is false, then check to see if the background behind each letter has
> sufficient contrast with the letter."
