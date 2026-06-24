# case-05 — Platform code "B7" faded into a station-floorplan image is the only platform cue (meaningful → failed)

## Scenario
A transit ticket shows a big platform code "B7" overprinted on a faded station-floorplan
graphic. The designer treated the numeral as a decorative "map stamp" and pale-inked it
(`#c8cdca`) so it blends into the artwork. But "B7" is the ONLY place the platform is named
anywhere on the ticket — the leg list below has boarding group, car, and fare, but no
platform. The code therefore carries information the rider needs (where to walk), so it is
in scope for contrast and must NOT be treated as the pure-decoration exemption. Because it
rides on a background IMAGE rather than a solid CSS color, its contrast is not even
computable by a checker.

## Attribute tuple
- **content-domain:** public transit / rail ticketing
- **UI-component/pattern:** mobile ticket card with a graphic platform "tile" (text overprinted on an SVG floorplan)
- **host-language construct:** hand-authored HTML5; the platform code is a `<span>` layered over an inline-SVG `data:` background image (`role="img"` tile, no external resource)
- **locale/i18n:** en-US
- **failure-mechanism:** meaningful, non-substitutable platform code faded onto a non-uniform background image; contrast ranges ~1.4:1 down to ~1.1:1 and is NOT CSSOM-computable, so a checker emits no violation

## Developer persona
A product designer built the platform tile from a "map stamp" effect in a UI kit, where a
giant letter sat on a stylized map purely for flavor. She kept the faded ink so the code
"reads like part of the map art" and dropped the numeral onto the floorplan image. In the
kit the letter was decorative; in the live ticket the same faded treatment now hides the one
value the rider actually has to read — and because it sits on the image, neither she nor any
automated scanner gets a contrast warning.

## Element / selector carrying the issue
`.platform .code` — the `<span class="code">B7</span>`, `color:#c8cdca` at `font-size:88px;
font-weight:800`, layered over the `.platform` element's inline-SVG floorplan background
image (the dark `.platform .tag` label "Platform" passes and is unaffected).

## Exact accessibility mechanism
"B7" is the sole platform indicator on the ticket; without perceiving it the rider does not
know which platform to walk to (the leg list names boarding group, car, and fare only). The
code cannot be rearranged or substituted without changing the page's meaning — a different
code sends the rider to a different platform — so it is meaningful text in scope for SC
1.4.3, NOT decoration. Sampling the worst-case pixels under the glyph, the contrast is no
better than ~1.4:1 (over the palest floorplan region) and falls to ~1.1:1 over the darker
tiles. At 88px the code is large-scale text, so the relaxed 3:1 threshold applies — and it
fails even that. A low-vision or contrast-impaired rider cannot read the platform. Result:
1.4.3 failure.

## Expected ACT-style outcome
**failed** — meaningful, non-substitutable platform text at ~1.4:1-or-worse; the
pure-decoration exemption does NOT apply because the code carries the platform information.

## Why automated tools miss it
Two layers defeat a scanner. First, the contrast is not CSSOM-computable: axe-core / WAVE /
Lighthouse derive color-contrast from the foreground color versus a resolved background
COLOR, but here the background is an image (the inline-SVG floorplan), so the color-contrast
rule cannot resolve a background color and returns "incomplete / needs review" — it emits no
violation, so there is nothing for a static rule to fail. Second, even granted a pixel
measurement, the tool cannot decide the exemption: the faded "B7" is visually identical to a
genuinely decorative "map stamp", and ruling it in-scope requires reading the code,
recognizing it is the only platform cue, and confirming no other element names the platform.
Both the over-image measurement (Trusted Tester's CCA eyedropper path) and the meaning
judgment are human-only.

## Citation
> **WCAG 2.2 Understanding — Contrast (Minimum)** (`wcag-understanding/contrast-minimum.html`):
> "Text that is decorative and conveys no information is excluded. For example, if random
> words are used to create a background and the words could be rearranged or substituted
> without changing meaning, then it would be decorative and would not need to meet this
> criterion."
