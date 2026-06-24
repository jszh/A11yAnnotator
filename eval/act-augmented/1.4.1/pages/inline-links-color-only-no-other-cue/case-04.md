# case-04 — Gov portal: bold weight injected only on :focus-visible; resting state color-only

## Scenario
A city government "Renew your resident parking permit" service page. Inline guidance links
inside a step-by-step card are gov-blue `#2453a6` at rest with no underline and normal
weight. The only non-color cue — `font-weight:700` — is applied via `:focus-visible`, so it
appears **only** when a keyboard user focuses the link. Mouse, touch, and visually-scanning
users in the resting state, and anyone who cannot perceive the blue/black hue difference, get
color-only links. The focus outline satisfies 2.4.7 but does not address 1.4.1's
visual-distinction requirement for the resting state.

## Attribute tuple
- **content-domain:** government / civic services portal
- **UI-component/pattern:** `<main>` with a `<section class="card">` containing an `<ol class="steps">` procedural list (links live inside ordered-list steps)
- **host-language construct:** modern `:focus-visible` pseudo-class providing a keyboard-only weight change
- **locale/i18n:** en-GB (£ fee, "blue-badge", "metered-only")
- **failure-mechanism:** F73 focus-only — the non-color cue (bold) appears only on `:focus-visible`; resting state is hue-only at ~2.35:1

## Developer persona
A government-digital-service developer added `:focus-visible { font-weight:700; outline:... }`
to satisfy a 2.4.7 Focus Visible audit finding and considered link styling "handled." They
conflated keyboard-focus visibility with the resting visual distinction 1.4.1 requires, and
kept the designer's underline-free resting look.

## Element / selector carrying the issue
`.card a` (resting: `color:#2453a6; text-decoration:none; font-weight:400`). The non-color
cue is only in `.card a:focus-visible { font-weight:700 }`.

## Exact accessibility mechanism
At rest, link `#2453a6` vs body `#1b1b1b` is **2.35:1** lightness — under 3:1 — and hue is
the sole differentiator. The bold cue requires keyboard focus to appear, so a mouse user, a
touch user, or anyone simply reading the page never sees it; a color-blind/grayscale user
never benefits from the hue. F73 states a cue that appears only when the link "receives
focus" is still a failure. Both colors pass 1.4.3 vs the page background (6.96:1 / 16.34:1).

## Expected ACT-style outcome
**failed** — F73: a non-color cue provided only on focus does not rescue the color-only
resting state.

## Why automated tools miss it
axe/Lighthouse evaluate the resting computed style, see a 1.4.3-passing colored link, and
have no link-vs-text rule. They also see a *present* `:focus-visible` style and a focus
outline, which superficially "looks accessible" and may even satisfy their focus checks.
Recognizing that the bold cue is keyboard-focus-gated and therefore irrelevant to 1.4.1's
resting-state requirement is a human judgment requiring comparison of resting vs focused
renders and knowledge of the F73 focus-only rule.

## Citation
> **WCAG Technique F73** (`wcag-techniques/failures/F73.html`):
> "If the non-color cue only happens when the mouse hovers over the link or when the link
> receives focus, it is still a failure."
