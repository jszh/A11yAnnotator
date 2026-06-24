# case-04 — Restaurant specials over alternating ceramic tiles: every other character fails

## Scenario
A restaurant (Azulejo Cantina, Lisbon) "today's specials" board. The headings and dish names are
dark text over a ceramic-tile background image whose tiles alternate cream and charcoal-glaze at
roughly one letter-advance per tile. Over the cream tiles the dark text reads (~5–13:1); over the
charcoal tiles it collapses to ~1.2:1. The result is a comb of failing glyphs — readable letters
alternating with vanished ones.

## Attribute tuple
- **content-domain:** restaurant menu & ordering (specials board)
- **UI-component/pattern:** card "board" with heading + list rows over a tiled texture
- **host-language construct:** CSS `background-image` (local PNG, alternating tiles) under dark `<h2>` + rows
- **locale/i18n:** pt-PT (Portuguese dish names)
- **failure-mechanism:** F83 background-image least-contrast — a periodic light/dark tile pattern so alternate characters cross a dark tile and fall to ~1.2:1

## Developer persona
The owner used a WordPress restaurant theme and swapped the section background for a photo of the
restaurant's signature azulejo tiles "for atmosphere." The theme's default specials block used
dark text, which looked fine over the lighter promo image it replaced. Nobody checked it against
the new high-contrast tile pattern, where the dark text periodically lands on a dark tile.

## Element / selector carrying the issue
`.board h2` (and the `.board .dish` rows) — dark text over `bg-04-tiles.png`; the failing glyphs
are whichever characters land over a charcoal tile.

## Exact accessibility mechanism
The board text is real DOM text (`color:#222`) over a `background-image`. Sampling the rendered
pixels behind the heading box:
- worst-case contrast anywhere behind the text: **1.18:1** (a glyph over a charcoal tile) — far
  below 4.5:1.
- best-case pixel in the band: **~13.7:1** (dark text over a cream tile).

For a low-vision reader the heading reads as a flickering half-word: "TO_A_'S _PE_IA_S" — every
other character drops out. ACT's best-case algorithm samples the cream tile (~13.7:1) and passes;
the per-letter least-contrast check finds the ~1.2:1 characters over the dark tiles.

## Expected ACT-style outcome
**failed** — F83 applies. Quickcheck against the darkest tile behind the dark text fails, and the
per-letter check shows alternating characters below 4.5:1.

## Why automated tools miss it
Scanners cannot sample the tile raster; against the board's solid fallback `#ece2cf` the dark text
is ~12:1 and "passes." No tool models a periodic background where the failing pixels recur under
specific letters, nor the resulting "every other character vanishes" legibility loss. It requires
a human to scan letter-by-letter which characters sit on a dark tile.

## Citation
> **WCAG Technique F83 — Failure Example 2** (`wcag-techniques/failures/F83.html`):
> "Black text overlays an image with dark gray areas. Wherever the text crosses a dark gray area
> the contrast is so bad that the text cannot be read."

> **WCAG 2.2 Understanding 1.4.3** (`wcag-understanding/contrast-minimum.html`):
> "The intent of this success criterion is to provide enough contrast between text and its
> background, so that it can be read by people with moderately low vision or impaired contrast
> perception, without the use of contrast-enhancing assistive technology."
