# case-02 — Near-white hero text on a translucent white scrim composited over a bright photo

## Scenario
A wellness microsite ("Coastal Yoga Collective") has a hero section whose background is a
bright beach/sky photo. The designer laid a "frosted glass" overlay over it —
`.frost { background: rgba(255,255,255,0.4) }` — to soften the image, then placed near-white
hero text (kicker `#eef4f2`, tagline `#f3f6f4`, subtitle `#e7eeea`) on top. Because the
40%-white scrim is composited over an already-bright photo, the resulting panel is pale, and
the near-white text nearly disappears (~1.1–1.6:1).

## Attribute tuple
- **content-domain:** health / wellness (yoga studio)
- **UI-component/pattern:** hero banner with a translucent "frosted glass" overlay over a photographic background
- **host-language construct:** `position:absolute` `.frost` layer with `rgba(255,255,255,0.4)` over a `background-image` photo; light text on a sibling layer above
- **locale/i18n:** en-US
- **failure-mechanism:** rendered backdrop = translucent white scrim composited over a bright photo (a pale panel); light text on a light composite fails
- **diversity-seed:** Carrd/website-builder "low-opacity text over hero photo" pattern (`_seeds/by-sc/1.4.3.json`), here inverted to a white scrim raising the backdrop luminance

## Developer persona
A solo studio owner built the site in a drag-and-drop builder and dropped in a "frosted hero"
block from the template gallery. The template ships light text plus a white overlay tuned for
*dark* stock photos; she swapped in her own bright sunrise beach shot. On her bright laptop in
a dim room the text "read as airy and elegant," so she published it.

## Element / selector carrying the issue
`.hero .kicker`, `.hero .tagline`, `.hero .sub` — near-white text sitting above
`.frost` (`rgba(255,255,255,0.4)`), which is itself composited over the `.hero`
`background-image` photo.

## Exact accessibility mechanism
For a low-vision or contrast-impaired sighted user, the tagline "Breathe with the tide,
sunrise sessions on the sand" and the supporting copy are illegible: near-white glyphs on a
pale (white-scrim-over-bright-photo) backdrop measure well under 4.5:1, and over the sun/sky
region they approach 1:1. The author declared both a foreground color and a background (the
photo + scrim), so the page is not a bare F24 "no background" case — the failure is that the
*effective composited* backdrop is light, not dark as the template assumed. The least-contrast
judgment must be made against the brightest region of the scrim-over-photo composite behind the
glyphs.

## Expected ACT-style outcome
**failed** — SC 1.4.3 (Contrast (Minimum), Level AA). Text contrast against its true
composited backdrop is far below 4.5:1.

## Why automated tools miss it
The text colors and a background are both declared, so F24 linting passes; the `<title>` is
non-empty and no attribute is missing. A CSSOM contrast tool tries to resolve the text node's
background: the nearest box-tree background is `.frost`, whose computed value is a *translucent*
color over an *image*. There is no single solid background color to sample, and the real
backdrop also includes the photo pixels under the scrim. Tools either (a) skip the node as
having an incomputable background, or (b) ignore the alpha and the photo entirely. Neither
composites `rgba(255,255,255,0.4)` over the brightest photo region to find the actual pale
backdrop. That alpha-compositing-over-image reasoning — exactly the case F24 and F83 flag for
background images — is human visual judgment.

## Citation
> **Reference:** WCAG Technique F24 (`wcag-techniques/failures/F24.html`)
>
> **Quote (verbatim):** "Background color may also be specified using a background image with
> the CSS property `background-image` or with the CSS `background` shorthand (with the URI of
> the image, e.g., `background: url("images/bg.gif")`). With background images, authors will
> need to check text contrast against the various colors of the background image that will be
> behind the text, and may also want to consider contrast when images are not displayed."
>
> **Reference:** WCAG Technique F83 — "Failure of Success Criterion 1.4.3 and 1.4.6 due to
> using background images that do not provide sufficient contrast with foreground text"
> (`wcag-techniques/failures/F83.html`)
>
> **Quote (verbatim):** "To satisfy Success Criterion 1.4.3 Contrast (Minimum) and 1.4.6
> Contrast (Enhanced), there must be sufficient contrast between the text and its background.
> For pictures, this means that there would need to be sufficient contrast between the text and
> those parts of the image that are most like the text and behind the text."
>
> **Reference:** Trusted Tester v5.1.3 — Test 13.C `1.4.3-contrast`
> (`refs/trusted-tester/sc-1.4.3-contrast-minimum.md`)
>
> **Quote (verbatim):** "If the background is varied, choose a pixel that provides the **least
> contrast**."
