# case-05 — Modal consent text whose backdrop is a translucent glass panel over a dim over the bright page

## Scenario
A healthcare patient portal ("HealthBridge") shows a consent modal. The dialog panel has **no
solid background**: `.modal { background: rgba(255,255,255,0.55); backdrop-filter: blur(2px) }`
(a "glass" panel), sitting on a light dim scrim `.overlay { background: rgba(20,30,45,0.35) }`,
which sits over a bright white app with a light-blue banner. The consent body copy uses the
design system's muted token `#8a93a0`. The text's effective backdrop is the full composite —
55%-white glass over a 35%-navy dim over the bright page — which resolves to a light panel, so
`#8a93a0` lands at ~2.2:1.

## Attribute tuple
- **content-domain:** healthcare / patient portal (data-sharing consent)
- **UI-component/pattern:** APG dialog (modal) with a translucent "glass" panel and a semi-transparent dim
- **host-language construct:** stacked translucent layers — `rgba` panel over `rgba` overlay over a bright page; muted text via a CSS token
- **locale/i18n:** en-US
- **failure-mechanism:** the effective backdrop is a multi-layer alpha composite (panel → dim → page); a tool reading the panel's single rgba misses it
- **diversity-seed:** construction strategy #5 (modal with no dialog background; backdrop + page show through), plus the "glass UI / backdrop-filter" long-tail

## Developer persona
A product engineer adopted a trendy "glassmorphism" modal from a component library. The library's
demo used a *dark* app behind the dim, so the translucent panel read dark and the muted text was
fine. HealthBridge's app is bright white; when the engineer dropped the modal in, the glass panel
turned pale, but he tested against the library's dark demo background and his contrast checker
reported the panel's `rgba(255,255,255,0.55)` as near-white-solid, where the muted token still
nominally passed — so he shipped it.

## Element / selector carrying the issue
`.modal p` (consent body and fine print, `#8a93a0`) inside the translucent `.modal` panel, over
the `.overlay` dim, over the bright `.app` / `.banner`.

## Exact accessibility mechanism
A low-vision sighted user reading the consent — "To coordinate your care, HealthBridge can share
your visit summaries…" — sees muted gray text on a pale glass panel at ~2.2:1, below 4.5:1; the
fine print about marketing and research is even harder. The dialog's ARIA (`role="dialog"`,
`aria-modal`, `aria-labelledby`, `aria-describedby`) is correct and a background is declared, so
nothing is *missing*; the failure is that the rendered backdrop is the composite of three
translucent layers, not the single `rgba` a tool reads off `.modal`. The least-contrast judgment
must flatten panel-over-dim-over-page.

## Expected ACT-style outcome
**failed** — SC 1.4.3 (Contrast (Minimum), Level AA). The consent body text is ~2.2:1 against
its true composited backdrop.

## Why automated tools miss it
The dialog passes every linter: correct ARIA, non-empty `<title>`, declared text color, declared
background. A CSSOM contrast tool reads `.modal`'s background as one color, `rgba(255,255,255,
0.55)`. It then either (a) ignores the alpha and treats it as near-solid white — on which the
muted `#8a93a0` may nominally pass or marginally fail without the true context — or (b) cannot
flatten a translucent panel at all and skips. No scanner composites the 55% glass over the 35%
navy dim over the bright page to recover the actual light backdrop. Reasoning through z-stacked
semi-transparent layers (including `backdrop-filter`) to the real rendered backdrop is the human
visual judgment this aspect targets.

## Citation
> **Reference:** WCAG Technique F24 (`wcag-techniques/failures/F24.html`)
>
> **Quote (verbatim):** "If an element's `background` color has not been defined, the element
> will have a transparent background, so authors need to ensure that at least one of the
> element's ancestors has a defined background color."
>
> **Reference:** WCAG Understanding 1.4.3 — Contrast (Minimum)
> (`wcag-understanding/contrast-minimum.html`)
>
> **Quote (verbatim):** "This success criterion applies to text in the page, including
> placeholder text and text that is shown when a pointer is hovering over an object or when an
> object has keyboard focus. If any of these are used in a page, the text needs to provide
> sufficient contrast."
>
> **Reference:** Trusted Tester v5.1.3 — Test 13.C `1.4.3-contrast`
> (`refs/trusted-tester/sc-1.4.3-contrast-minimum.md`)
>
> **Quote (verbatim):** "If the background is varied, choose a pixel that provides the **least
> contrast**."
