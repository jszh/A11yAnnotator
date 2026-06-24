# case-03 — SVG-gradient wordmark as the only home link (eroded exemption, invisible to scanners)

## Scenario
A handmade-goods marketplace ("Mercato") renders its wordmark not as HTML text but as an
inline **SVG `<text>`** element with a rose-gold **`linearGradient`** fill on a white app
bar. The mark is wrapped in `<a href="/">` and is the **only** home affordance — there is
no separate "Home" nav item and no logo `<img>`. The gradient runs from `#d9a86b` (≈2.15:1
on white) to `#e0b483` (≈1.91:1); the **least-contrast pixel** is therefore ~**1.91:1**.
Because the logotype is acting as an interactive UI component (the home link), the brand
exemption is **eroded**, and no sufficient-contrast variant or equivalent control is
provided. The mark is large-scale display text (~30px bold ≈ 22–25pt), so the applicable
threshold is **3:1**, not 4.5:1 — yet 1.91:1 fails even 3:1. The page **fails**.

## Attribute tuple
- **content-domain:** e-commerce / online marketplace (handmade & vintage)
- **UI-component/pattern:** sticky app bar where an SVG wordmark is the sole home control
- **host-language construct:** inline `<svg><text fill="url(#…)">` inside `<a href="/">`
- **locale/i18n:** en-GB
- **failure-mechanism:** logotype-as-UI-component erosion delivered via SVG gradient text — a rendering channel contrast scanners do not evaluate, so the failing text is invisible to them

## Developer persona
A front-end developer shipped the brand refresh as an inline SVG so the rose-gold wordmark
would stay crisp at any DPI, and followed the ubiquitous "logo in the corner is the home
button" pattern by wrapping it in `<a href="/">`. They reasoned "logos are exempt from
contrast anyway," and were further reassured because the team's automated audit reported
**no** contrast error on the mark (the scanner skips SVG text and gives up on gradients).
Both assumptions are wrong: the logotype is now an interactive control, which erodes the
exemption, and "no tool flag" is not evidence of sufficient contrast.

## Element / selector carrying the issue
`header .brand-home svg text` — an SVG `<text>` with `fill="url(#rosegold)"` (stops
`#d9a86b`→`#e0b483`) on a `#ffffff` bar. Least-contrast pixel ≈ **1.91:1**. The `<text>` is
the accessible-name source of the sole home link (`<a class="brand-home" href="/">`).

## Exact accessibility mechanism
A low-vision user relies on the wordmark link to return to the storefront home, and the
mark renders at ~1.91:1 at its lightest — far under both 4.5:1 and the relaxed 3:1
large-text bar — so the primary navigation control is hard to perceive and target. The
logotype exemption does not rescue it: SC 1.4.3's Intent warns the carve-out "can be
problematic when logos or logotypes act as user interface components (such as a link or
other interactive control)," and directs authors to provide a sufficient-contrast variant
or an equivalent control. Neither exists. The text being drawn in SVG with a gradient does
not change its status — it is still text whose visual presentation must meet the criterion,
measured (per Trusted Tester 13.C) at the least-contrast pixel.

## Threshold note (large-scale text)
The wordmark is ~30px, bold (font-weight 700) — large-scale text (≥18pt, or ≥14pt bold), so
the **3:1** threshold applies, not 4.5:1. The least-contrast pixel at ~1.91:1 is below 3:1,
so the verdict (failed) holds under the correct, size-appropriate threshold.

## Expected ACT-style outcome
**failed** — SC 1.4.3 (Contrast (Minimum), Level AA). The sub-threshold text is a logotype
acting as the sole home control with no sufficient-contrast variant; the exemption is
eroded. At ~1.91:1 the large-scale text fails even its relaxed 3:1 threshold, so it fails AA.

## Why automated tools miss it (the inversion)
This case is the opposite of "tools and humans agree it fails." axe-core **ignores all SVG
elements as an image** for the color-contrast rule, so it never evaluates the wordmark; and
when a fill cannot be resolved to a single color (a gradient), axe reports the element as
**incomplete** ("could not be determined"), not a violation. WAVE and Lighthouse likewise
raise no contrast error on SVG `<text>` with a gradient fill. Net effect: scanners produce
**no 1.4.3 violation** — an automated pass (or a routinely-dismissed "needs review"). The
correct answer is the opposite. Reaching **failed** requires two human judgments no tool
makes: (1) recognizing the wordmark is the only home control, so the brand exemption is
eroded; and (2) eyedroppering the least-contrast pixel of the gradient SVG text against
white (~1.91:1) and comparing it to the size-appropriate 3:1 threshold. This is precisely
the logotype/erosion reasoning ACT rule 09o5cg declares out of scope.

## Citation
> **Reference:** WCAG 2.2 Understanding SC 1.4.3 — logotype note
> (`wcag-understanding/contrast-minimum.html`)
>
> **Quote (verbatim):** "However, this can be problematic when logos or logotypes act as
> user interface components (such as a link or other interactive control). In these cases,
> as a best practice, authors should consider choosing a variant of the logo or logotype
> that has sufficient text contrast, if allowed by the corporate identity or brand
> guidelines. Alternatively, authors should consider providing an equivalent user
> interface component which serves the same purpose and meets contrast requirements."
>
> **Reference:** WCAG 2.2 Understanding SC 1.4.3 — Intent (large-scale text)
> (`wcag-understanding/contrast-minimum.html`)
>
> **Quote (verbatim):** "Text that is larger and has wider character strokes is easier to
> read at lower contrast. The contrast requirement for larger text is therefore lower."
>
> **Reference:** Trusted Tester v5.1.3 — Test 13.C `1.4.3-contrast`
> (`refs/trusted-tester/sc-1.4.3-contrast-minimum.md`)
>
> **Quote (verbatim):** "If the text color is varied, choose a pixel that provides the
> **least contrast**."
