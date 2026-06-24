# case-03 — CSS multiple backgrounds: a near-white gradient scrim layered over a skyline photo

## Scenario
A news site ("The Meridian") has a feature banner that uses CSS *multiple backgrounds* on one
element: a `linear-gradient(...)` scrim listed **first** (so it paints on top) over a
`url(skyline.jpg)` photo. The developer copied a "darken the photo for legibility" snippet but
the gradient's stops are near-white at the top (`rgba(255,255,255,0.35)`) with only a faint dark
stop at the bottom. Over the bright upper sky of the skyline, the composite stays light, so the
near-white headline (`#fbfaf6`) drops well below 4.5:1.

## Attribute tuple
- **content-domain:** news / long-form editorial
- **UI-component/pattern:** article feature banner using a CSS multiple-background (gradient scrim over image)
- **host-language construct:** `background: linear-gradient(rgba(255,255,255,.35) … rgba(0,0,0,.25)), url(photo)` on one element
- **locale/i18n:** en-US
- **failure-mechanism:** effective backdrop = the gradient's top stop composited over the bright sky region of the photo, not the photo alone nor the gradient alone
- **diversity-seed:** "text over image-overlay hero captions" from the WebAIM-Million pattern (`_seeds/by-sc/1.4.3.json`), specialized to a multiple-background gradient stack

## Developer persona
A newsroom developer under deadline grabbed a Stack Overflow answer titled "darken background
image with CSS gradient" and pasted the `background:` shorthand. The accepted answer used
`rgba(0,0,0,.6)`; he tweaked the alphas to "let more of the skyline show" and accidentally made
the top stop a light wash. The headline looked crisp against the dark buildings in his preview
(which happened to scroll the bright sky out of view), so it went live.

## Element / selector carrying the issue
`.feature h1` (headline `#fbfaf6`) and `.feature .eyebrow` / `.byline`, whose backdrop is the
`.feature` multiple-background stack — the `linear-gradient` scrim layered over the
skyline `url(...)` photo.

## Exact accessibility mechanism
A low-vision sighted reader sees the headline "Skyline tax plan splits council ahead of Friday
vote" rendered in near-white over a pale sky region softened by a near-white gradient stop;
the contrast there is roughly 1.25:1, illegible. A background **is** declared (the multiple
backgrounds), and the headline color is declared, so this is not a bare F24 omission — the
defect is which of the stacked layers actually renders behind the glyphs. The effective backdrop
is `rgba(255,255,255,0.35)` composited over the brightest photo region, and the least-contrast
judgment must be made there, not against the photo's dark buildings or the gradient in
isolation.

## Expected ACT-style outcome
**failed** — SC 1.4.3 (Contrast (Minimum), Level AA). The headline's contrast against its true
composited backdrop (gradient-over-sky) is well below 4.5:1.

## Why automated tools miss it
Everything lints clean: `<title>` present, headline color declared, background declared. A CSSOM
contrast tool encounters a `background` shorthand containing a gradient *and* an image — it
cannot reduce that to a single solid color, so it skips the contrast computation (or, in some
engines, falls back to white, which would mis-pass the near-white text). No scanner composites
the gradient's *top* stop over the *upper* (brightest) region of the skyline photo and selects
the worst-case area behind the headline. Resolving the layer order of a multiple-background
stack and compositing the correct stop over the correct photo region is precisely the human
visual judgment F24/F83 call for with background images.

## Citation
> **Reference:** WCAG Technique F24 (`wcag-techniques/failures/F24.html`)
>
> **Quote (verbatim):** "Color and background color may be specified at any level in the
> cascade of preceding selectors, by external stylesheets or through inheritance rules."
>
> **Quote (verbatim):** "With background images, authors will need to check text contrast
> against the various colors of the background image that will be behind the text, and may also
> want to consider contrast when images are not displayed."
>
> **Reference:** WCAG Technique F83 (`wcag-techniques/failures/F83.html`)
>
> **Quote (verbatim):** "When there is not sufficient contrast between the background image and
> the text, features of the background image can be confused with the text making it difficult
> to accurately read the text."
>
> **Reference:** WCAG Understanding 1.4.3 — Contrast (Minimum)
> (`wcag-understanding/contrast-minimum.html`)
>
> **Quote (verbatim):** "Provide sufficient contrast between text and its background."
