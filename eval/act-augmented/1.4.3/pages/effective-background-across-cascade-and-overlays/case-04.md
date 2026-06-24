# case-04 — Track title with mix-blend-mode:soft-light: declared color passes, composited render fails

## Scenario
A music-player "now playing" card ("Resonance"). The designer wanted the track title to "sink
into" the artwork panel like a printed tint, so they applied a CSS **compositing** effect:
`.track-title { mix-blend-mode: soft-light }`. The title's **declared** color is near-black
(`#262626`) and its panel is a **solid, opaque light gray** (`#c0c0c0`) — a CSSOM-resolvable pair
of ~8.3:1, comfortably above 4.5:1. But `soft-light` does not paint `#262626`: it re-derives each
glyph's painted color by compositing the layer color with the light panel beneath it, lifting the
dark source toward the backdrop's luminance. The title therefore **renders** as a slightly-darker
light gray on light gray — measured on the rendered pixels, ~**1.45:1**, illegible. The metadata
strip below (opaque dark bar, light text, no blend) stays fully legible.

## Attribute tuple
- **content-domain:** consumer media / music streaming ("now playing")
- **UI-component/pattern:** album-art card with a "tinted" track title
- **host-language construct:** `mix-blend-mode: soft-light` on the text element, over a solid opaque ancestor background; declared `color` and ancestor `background` are both present and high-contrast
- **locale/i18n:** en-US
- **failure-mechanism:** a CSS compositing operator (blend mode) re-derives the rendered glyph color so the *presented* contrast collapses, while the *declared* color/ancestor-background pair a tool reads still passes
- **diversity-seed:** cascade/compositing limb (construction strategy #4/#5) realised via a **blend mode**, not a translucent layer, background image, or off-tree overlay — the part of F24 about color/background resolved "through inheritance rules" and the cascade, here through a compositing step the CSSOM color does not reflect

## Developer persona
A front-end developer copied a trendy "let the title melt into the cover art" snippet from a
design-system demo. The demo used a *dark* cover behind the dark title, where `soft-light` left the
text readable; this build uses a light placeholder panel for tracks without artwork, and over that
the same blend washes the title out. In code review the title's color token (`#262626`) and the
panel token (`#c0c0c0`) both looked high-contrast, and the team's automated contrast check reported
a pass, so it shipped.

## Element / selector carrying the issue
`.track-title` ("Lantern in the Static") — declared `color:#262626`, sitting on the opaque
`.art` panel (`#c0c0c0`), with `mix-blend-mode: soft-light` compositing the two.

## Exact accessibility mechanism
A low-vision or contrast-impaired sighted user cannot read the track title: although the declared
color on the declared panel is ~8.3:1, the `soft-light` blend renders the glyphs at ~1.45:1 against
the panel — below 4.5:1 and below even the 3:1 large-text floor. Both a foreground color and a
background are declared (so this is not a bare F24 omission and nothing is translucent); the defect
is that a **compositing operator** changed the *effective, presented* foreground/background
relationship. Contrast must be judged on the colors the user agent actually presents, not on the
declared CSS color in isolation. The metadata text below has no blend and is fine, proving the
verdict turns on the compositing step, not the tokens.

## Expected ACT-style outcome
**failed** — SC 1.4.3 (Contrast (Minimum), Level AA). The track title's *rendered* (blend-composited)
contrast against its panel is ~1.45:1, far below 4.5:1.

## Why automated tools miss it
Everything the CSSOM exposes is clean: a non-empty `<title>`, a declared text `color` (`#262626`),
and a declared opaque ancestor `background` (`.art` = `#c0c0c0`). A contrast checker reads
`getComputedStyle().color` and walks the box tree to the first opaque background, computing
`#262626`-on-`#c0c0c0` ≈ 8.3:1 → a confident PASS. **Verified empirically:** axe-core 4.12.1
(vendored in `eval/checker-comparison/node_modules`) returns **no** color-contrast violation and
**no** needs-review for `.track-title` — it does not surface the element as a failure at all,
because `getComputedStyle` still reports the declared near-black color and axe does not simulate CSS
blend modes. To catch the failure a tool must (1) recognize that `mix-blend-mode` re-derives the
painted glyph color by compositing it with the backdrop, (2) compute that composited result, and
(3) judge contrast on the *rendered* colors. That compositing-aware, present-on-screen reasoning is
the F24 cascade/compositing hard case and is human visual judgment.

## Citation
> **Reference:** WCAG Technique F24 — "Failure of Success Criterion 1.4.3, 1.4.6 and 1.4.8 due to
> specifying foreground colors without specifying background colors or vice versa"
> (`wcag-techniques/failures/F24.html`)
>
> **Quote (verbatim):** "Color and background color may be specified at any level in the cascade of
> preceding selectors, by external stylesheets or through inheritance rules."
>
> **Reference:** WCAG Understanding 1.4.3 — Contrast (Minimum)
> (`wcag-understanding/contrast-minimum.html`)
>
> **Quote (verbatim):** "Because authors do not have control over user settings for font
> smoothing/anti-aliasing, when evaluating this Success Criterion, refer to the foreground and
> background colors obtained from the user agent, or the underlying markup and stylesheets, rather
> than the text as presented on screen."
>
> **Reference:** Trusted Tester v5.1.3 — Test 13.C `1.4.3-contrast`
> (`refs/trusted-tester/sc-1.4.3-contrast-minimum.md`)
>
> **Quote (verbatim):** "It must still conform to the contrast requirement **wherever it occurs**."
>
> **Reference:** EN 301 549 — C.9.1.4.3 SC 1.4.3 Contrast (minimum)
> (`docs/analysis/en301549/EN301549-ANNEX-C-RELEVANT-CLAUSES.md`)
>
> **Quote (verbatim):** "Check that the web page does not fail WCAG 2.2 Success Criterion 1.4.3
> Contrast (Minimum) according to WCAG Conformance Requirements stated in clause 9.6."
