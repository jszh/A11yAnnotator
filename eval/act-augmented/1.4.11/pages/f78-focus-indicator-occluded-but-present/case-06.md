# case-06 — Real-estate listing card grid where a soft resting shadow could be confused with a focus ring, but the focus indicator is deliberately made perceptibly distinct (PASS — boundary)

## Scenario
Hearthline's "homes for sale" grid gives every listing card a permanent SOFT ambient drop shadow
(`box-shadow: 0 1px 3px rgba(16,24,40,.12)`) for depth. This is exactly the setup that, done wrong,
produces the F78 box-shadow-ring failure (a focus shadow indistinguishable from the resting shadow).
Here the author got it right: on keyboard focus the card receives a thick, high-contrast, clearly OFFSET
solid ring plus a wider colored halo (`outline: 3px solid #1b3a2b; outline-offset: 4px; box-shadow: 0 0
0 6px rgba(27,58,43,.18), ...`), which is unmistakably different in weight, color, offset, and character
from the subtle resting shadow. The page renders with the second card (*8 Meadowgate Ct*) focused; a
sighted keyboard user can immediately tell which listing has focus and that focus moved. This page is
included as the passing boundary so the judge must reason about *discernibility*, not mere presence of a
focus style.

## Attribute tuple
- **Content domain:** real-estate listings (property search results)
- **UI component / pattern:** clickable card grid of `<a class="card">` listing tiles
- **Host-language construct:** subtle resting `box-shadow` vs a `:focus-visible` (and `:focus` fallback) rule using a thick offset `outline` plus a wider halo `box-shadow`; `autofocus`
- **Locale / i18n:** en-US, USD
- **Failure mechanism:** NONE — this is the correct F78-avoidance pattern (focus indicator perceptibly distinct from resting decoration); it is the contrast/boundary case for the failing siblings

## Developer persona
A front-end developer who had previously shipped a card grid flagged in an audit for "focus shadow
looks the same as the hover/resting shadow" deliberately fixed the pattern after reading F78 and the
Understanding "Relationship with Focus Visible" guidance. They chose a focus ring that differs from the
resting shadow on multiple axes at once — solid vs soft, dark-green vs translucent grey, offset 4px vs
flush, plus a wide halo — so that there is no ambiguity about which card is focused. They verified by
tabbing through the grid and watching the indicator clearly jump from card to card.

## Element / selector carrying the issue
`.card` (resting: soft `box-shadow`) vs `.card:focus-visible` / `.card:focus` (thick offset solid
outline + wide colored halo). The focused element at load is the *8 Meadowgate Ct* card.

## Exact accessibility mechanism
A sighted keyboard or screen-magnifier user moving focus across the grid sees the focused card acquire a
3px solid dark-green ring set 4px off the card edge, surrounded by a 6px translucent green halo —
visually nothing like the barely-perceptible resting ambient shadow on the other cards. The focus
indicator therefore unambiguously communicates which control is focused and that focus advanced. The
solid green ring has ~9:1 contrast against the light page background, comfortably exceeding the 3:1
non-text-contrast threshold for the focus state, and it is perceptibly distinct from the resting
decoration, satisfying both the contrast requirement and the discernibility requirement that the failing
cases violate. This is the intended use of "a change of contrast for focus" (the basis for G195) rather
than reusing a decorative shadow as the focus ring.

## Expected ACT-style outcome
**passed** (SC 1.4.11). A focus indicator is present, has sufficient contrast (~9:1), and is perceivably
distinct from the persistent resting decoration, so the focused control can be identified.

## Why automated tools miss it
This is the symmetric point: just as axe-core / WAVE / Lighthouse cannot prove the failing F78 cases
fail, they cannot prove this case passes. No automated tool encodes a rule that confirms a focus
indicator is *perceptibly distinct* from a resting box-shadow — that judgment requires rendering the
resting card and the focused card and deciding a human can clearly tell them apart. A tool sees a
`:focus-visible` rule with an outline and box-shadow and could only guess; here a human confirms the
difference is unmistakable, so the page passes for a reason no static analyzer can establish.

## Citation
**Reference:** WCAG Technique F78 — Description (`wcag-techniques/failures/F78.html`)
> "Other styling may make it difficult to see the focus indicator even though it is present, such as outlines that look the same as the focus outline, or thick borders that are the same color as the focus indicator so it cannot be seen against them."

**Reference:** WCAG 2.2 Understanding 1.4.11 — Relationship with Use of Color / focus differentiation (`wcag-understanding/non-text-contrast.html`)
> "Using a change of contrast for focus and other states is a technique to differentiate the states. This is the basis for G195: Using an author-supplied, highly visible focus indicator, and more techniques are being added."
