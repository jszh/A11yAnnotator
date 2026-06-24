# case-06 — Star rating "filled" shown by an inner glow at 1.48:1 on the star body (state mark fails its adjacent surface) — paired with a solid-fill PASS variant; the 1.4.1-vs-1.4.11 boundary

## Scenario
A restaurant review page ("Casa Lupita" on TableTalk) shows star ratings. To avoid a Use-of-Color
problem, every rating is *also* given as text ("4 of 5"), so 1.4.1 is satisfied — the difference is
not hue-only. The default reviews still **fail 1.4.11**: a "filled" star is distinguished from an
empty one only by a faint **inner glow** `#C99A3E` painted on the gold star body `#A67C2E`, which
is **1.48:1**. The mark that conveys the filled state does not contrast with its adjacent surface
(the star body). The "Editor's pick" review shows the conforming approach — solid dark fill
`#1A1A1A` (≈17:1) for filled vs an outline for empty — so the state mark contrasts. The page
deliberately separates the 1.4.1 issue (handled by the text) from the 1.4.11 issue (the glow).

## Attribute tuple
- **Content domain:** restaurant reviews / ratings (consumer)
- **UI component / pattern:** rating stars (APG rating) — inline SVG; two variants (inner-glow vs solid-fill)
- **Host-language construct:** `.glow-fill .inner-glow { fill:#C99A3E }` on `.star-body { fill:#A67C2E }`
- **Locale / i18n:** en (US; Spanish menu terms in prose)
- **Failure mechanism:** filled-state mark (inner glow) vs adjacent surface (star body) at 1.48:1, while the rating value is independently conveyed as text (so 1.4.1 is not the failure here)

## Developer persona
A designer wanted the filled stars to look "lit from within" rather than flatly colored, so a
filled star is the same gold body as an empty star plus a subtly lighter inner highlight. They were
careful about accessibility in one respect — they added the "4 of 5" text so colorblind users get
the value — and assumed that covered the rating. They never measured the inner glow against the
star body, treating it as decorative shading rather than as the *only* graphic that separates filled
from empty.

## Element / selector carrying the issue
- **Fails:** `.glow-fill .inner-glow` (`fill:#C99A3E`) drawn on `.star-body` (`fill:#A67C2E`) — the inner glow is the filled-state mark; its adjacent surface is the star body, giving **1.48:1**. Empty stars (`.glow-empty`) are the same gold body with no glow, so filled vs empty hinges entirely on that 1.48:1 mark.
- **Passes (boundary variant):** `.solid-fill .star-body` (`fill:#1A1A1A`, ≈17:1 vs page) vs `.solid-empty` outline — the state mark clearly contrasts.

## Exact accessibility mechanism
Screen-reader users get the rating from `role="img"` + `aria-label="Rated 4 out of 5 stars"` and the
adjacent "4 of 5" text — so both AT exposure and 1.4.1 are fine. The failure is visual, for a
sighted low-vision user looking at the stars: filled and empty stars are the same gold body, and
the only differentiator (the inner glow) is 1.48:1 against that body, so the user cannot tell how
many stars are filled from the graphic. The Understanding is explicit that a low-contrast star
*fill* is a 1.4.11 failure (its failing example is a yellow-on-white star at 1.2:1), distinct from
the hue-only case which fails 1.4.1. Here the value-as-text removes the 1.4.1 concern, isolating the
1.4.11 mark-vs-body contrast as the live failure. The solid-fill variant is the Understanding's
"solid fill to indicate a checked-state that has contrast" pass.

## Expected ACT-style outcome
**failed** (SC 1.4.11) — driven by the default (inner-glow) review widgets. The filled-state mark
does not meet 3:1 against its adjacent surface (the star body). The solid-fill editor's-pick widget
is a conforming contrast; it is included to mark the boundary, not as the violation. Note that
because the value is also text, a tester might be tempted to call the stars "not required for
understanding" — but they are presented as the primary rating graphic in each state, and a
low-contrast state mark on a presented control still fails 1.4.11.

## Why automated tools miss it
Both widgets have correct `role="img"` + `aria-label` and an adjacent text value, so name/role and
1.4.1 checks pass. axe/WAVE/Lighthouse compute no contrast for SVG fills and have no rule that
segments a star into "body" + "filled-state glow" and tests the glow against the body. A naive
star-vs-page sample lands on the gold body vs cream page (3.7:1), which passes. Recognizing that the
inner glow is the filled-vs-empty mark, that its adjacent surface is the star body, and that the
same gold makes filled and empty nearly identical, is human visual judgment. The markup is clean.

## Citation
**Reference:** WCAG 2.2 Understanding SC 1.4.11 Non-text Contrast (`wcag-understanding/non-text-contrast.html`)
> "The second example fails the Non-text contrast criterion due to the yellow (#FFF000) to white contrast ratio of 1.2:1."

**Reference:** WCAG 2.2 Understanding SC 1.4.11 Non-text Contrast (`wcag-understanding/non-text-contrast.html`)
> "Two examples which pass this success criterion, using either a solid fill to indicate a checked-state that has contrast, or a thicker border as well as yellow fill."

**Reference:** WCAG 2.2 Understanding SC 1.4.11 Non-text Contrast (`wcag-understanding/non-text-contrast.html`)
> "any visual information necessary to indicate state, such as whether a component is selected or focused must also ensure that the information used to identify the control in that state has a minimum 3:1 contrast ratio."
