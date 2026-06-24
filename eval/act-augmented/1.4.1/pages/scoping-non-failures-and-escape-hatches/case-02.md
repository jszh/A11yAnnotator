# case-02 — Restaurant menu: spice level by green vs red dish name at the SAME lightness (no escape hatch)

## Scenario
A restaurant lunch menu signals each dish's spice level purely by the colour of the dish name: green = mild, red = spicy. The green and red are deliberately at the SAME lightness, so the contrast between the two hues is ~1.06:1 — far below 3:1. There is no chilli icon, no "mild"/"spicy" word per dish, and no other cue. This is the discriminating twin of case-01: same colour-coding concept, but no lightness gap, so it FAILS.

## Attribute tuple
- **content-domain:** restaurant menu & ordering
- **UI-component / pattern:** menu list (name + description + price rows)
- **host-language construct:** `<span class="name mild|hot">` with colour-only styling
- **locale / i18n:** en (South-Indian cuisine names)
- **failure-mechanism:** category (spice level) conveyed by hue alone, two hues at equal lightness (<3:1 between them) — limb a twin / pure-colour reliance

## Developer persona
A restaurant owner used a website-builder menu block and applied the theme's "green for mild, red for hot" colour preset to the dish titles. Both presets happen to be vivid mid-tone colours that look equally dark; the owner never checked them in greyscale and assumed colour-coding was enough. The legend at the bottom only restates the colour key.

## Element / selector carrying the issue
`.dish .name.mild` (`#2e7d32`) and `.dish .name.hot` (`#c0392b`) throughout the `Small plates` and `Mains` sections.

## Exact accessibility mechanism (what AT experiences / why it fails)
- Spice level is encoded ONLY in the hue of the dish name. A user with deuteranopia/protanopia, or anyone viewing in greyscale, sees both mild and spicy dish names rendered at the SAME darkness (inter-element contrast ~1.06:1) and cannot tell which dishes are spicy.
- Each colour individually has fine contrast against the cream page (~5:1), so this is NOT a SC 1.4.3 problem — the failure is purely use-of-colour.
- The legend ("green = mild, red = spicy") merely re-encodes the same colour distinction and is useless to someone who cannot perceive the hue. There is no icon, no per-dish text label, no chilli count.

Verified by rendering (the green and red names look equally dark) and by contrast computation: mild/hot inter-element = 1.06:1; mild/bg ~5.1:1; hot/bg ~5.4:1.

## Expected ACT-style outcome
**failed** (SC 1.4.1 — spice level conveyed by colour alone, no lightness escape hatch and no non-colour indicator).

## Why automated tools miss it
Every colour on the page passes SC 1.4.3 (~5:1 against the cream background), so contrast checkers report no problem. axe/WAVE/Lighthouse have no rule that detects "two foreground hues at the same lightness are the sole carrier of a semantic category." Recognising that the green/red of the dish names encodes spice level — and that the legend doesn't rescue it for colour-blind users — requires reading the menu's meaning and reasoning about colour perception, which automation cannot do.

## Citation
> "If content is conveyed through the use of colors that differ not only in their hue, but that also have a significant difference in lightness, then this counts as an additional visual distinction, as long as the difference in relative luminance between the colors leads to a contrast ratio of 3:1 or greater."
— wcag-understanding/use-of-color.html (Intent note — by negation, equal-lightness hues do NOT qualify)

> "Displaying content in grayscale may help identify content that uses only color to convey information."
— refs/trusted-tester/sc-1.4.1-use-of-color.md (Identify Content)
