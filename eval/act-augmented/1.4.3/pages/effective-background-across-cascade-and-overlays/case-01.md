# case-01 — Booking card text rendered over a body hero photo, not the dark rail a CSSOM walker finds

## Scenario
A vacation-rental site ("Boathouse Stays") has a narrow dark navigation rail down the left
and a full-bleed bright lakeside photo behind the page (set on `<body>`,
`background-attachment: fixed`). The "Lakeside Retreat" booking card is `position: absolute`
and shifted to `left: 360px` — entirely off the dark rail — so its paragraphs render directly
over the bright sky/sand region of the photo. The card has no background of its own
(transparent), and its body copy color (`#9b9b9b` light gray) is inherited from a `.copy`
wrapper, not set on the `<p>`.

## Attribute tuple
- **content-domain:** travel / vacation-rental booking
- **UI-component/pattern:** absolutely-positioned content card over a fixed body hero image, with a dark nav rail
- **host-language construct:** `position:absolute` card whose positioned ancestor `.stage` is the only declared background; color via inheritance from `.copy`
- **locale/i18n:** en-US
- **failure-mechanism:** the box-tree nearest-declared-background (dark rail `#1b1b1b`) differs from the rendered backdrop (bright body photo); light-gray text fails against the real backdrop

## Developer persona
A front-end contractor built the layout from a "sidebar + hero" template. They wanted the
booking card to "float over the lake," so they positioned it absolutely off the rail and made
it transparent. On their dark-rail-heavy mockup the gray copy looked fine; they never scrolled
the card off the rail in their head, and their contrast checker reported a pass (it measured
the card text against the rail's dark background), so it shipped.

## Element / selector carrying the issue
`.card .copy p` (and `.card .rate`) — the inherited `#9b9b9b` / `#cfcfcf` paragraphs inside the
absolutely-positioned, transparent `.card` that overlaps the bright `<body>` photo.

## Exact accessibility mechanism
A sighted user with low vision or contrast sensitivity loss sees the light-gray booking copy
sitting on pale sky and sun in the photo; the rental description, the "$189 / night" rate, and
the cancellation terms wash out to roughly 2.8:1 against the brightest regions — below the
4.5:1 threshold for normal text. The text *color* and *some* background are both declared in
the cascade (so F24's "missing background" condition is technically satisfied), but the
background that a naive ancestor-walk resolves (`.stage` `#1b1b1b`) is **not** the backdrop
that actually renders behind the glyphs. The effective backdrop is the body photo, against
which the foreground fails. AT (a screen reader) reads the text fine, but the SC protects
low-vision sighted users, for whom the rendered least-contrast judgment governs.

## Expected ACT-style outcome
**failed** — SC 1.4.3 (Contrast (Minimum), Level AA). The visual presentation of the booking
copy is below 4.5:1 against its true (photographic) backdrop.

## Why automated tools miss it
The markup is well-formed: a non-empty `<title>`, a declared text color, and a declared
background (`.stage`) all exist, so an F24-style "foreground without background" linter passes.
A CSSOM contrast checker walks the box tree from `.card`, finds no opaque background on the
transparent card, climbs to its positioned ancestor `.stage` (`#1b1b1b`), and computes
light-gray-on-near-black (~6.7:1) → PASS. It cannot tell that `position:absolute; left:360px`
places the card off the rail and over the bright fixed body photo. To catch the failure a tool
must render the page, identify which layer actually paints behind each glyph, and sample the
worst-case (lightest) photo region — a visual/structural judgment, not a CSSOM ancestor walk.

## Citation
> **Reference:** WCAG Technique F24 — "Failure of Success Criterion 1.4.3, 1.4.6 and 1.4.8 due
> to specifying foreground colors without specifying background colors or vice versa"
> (`wcag-techniques/failures/F24.html`)
>
> **Quote (verbatim):** "It is not necessary that the foreground and background colors both be
> defined on the same element. Foreground text `color` is inherited from ancestor elements. If
> an element's `background` color has not been defined, the element will have a transparent
> background, so authors need to ensure that at least one of the element's ancestors has a
> defined background color."
>
> **Quote (verbatim):** "Color and background color may be specified at any level in the
> cascade of preceding selectors, by external stylesheets or through inheritance rules."
>
> **Reference:** Trusted Tester v5.1.3 — Test 13.C `1.4.3-contrast`
> (`refs/trusted-tester/sc-1.4.3-contrast-minimum.md`)
>
> **Quote (verbatim):** "If text is not selectable or appears on a background image, determine
> the contrast using the **Colour Contrast Analyser (CCA)**."
>
> **Quote (verbatim):** "Select the **Background** color-dropper, click a pixel in the
> background close to the text. If the background is varied, choose a pixel that provides the
> **least contrast**."
