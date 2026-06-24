# case-06 — Food-bank shift buttons: box-shadow glow PAIRED with a transparent outline (PASS boundary)

## Scenario
A volunteer-shift sign-up page. The "Sign up" buttons use the same soft box-shadow "glow"
as the failing case-01 — but here the author follows the C40 note exactly: the focus rule
is `:focus-visible { outline: 2px solid transparent; outline-offset: 2px; box-shadow: 0 0 0
3px #fff, 0 0 0 6px #1f6feb; }`. The transparent outline is invisible in the default render
(the glow does the visual work), but in forced-colors mode it is forced to a system color
and becomes a real, focus-tracking ring. This page is the boundary twin of case-01: a
default-render checker cannot tell them apart, yet only this one is robust.

## Attribute tuple
- **content-domain:** nonprofit / charity volunteer scheduling
- **UI-component / pattern:** list of shifts with per-row primary `<button>`s
- **host-language construct:** `:focus-visible { outline: 2px solid transparent; box-shadow: … }` — the C40-recommended forced-colors-safe pairing
- **locale / i18n:** en-GB charity English
- **failure-mechanism:** NONE — included as the robust counter-example that survives forced colors

## Developer persona
A developer who had previously shipped a box-shadow-only page (and learned about the
forced-colors bug the hard way) now applies the WCAG C40 recommendation verbatim: keep the
glow for aesthetics, but back it with `outline: 2px solid transparent` so a real ring
appears in High Contrast. They tested by toggling Windows High Contrast and confirmed the
ring shows.

## Element / selector carrying the issue
`.btn:focus-visible` — uses `box-shadow` for the default-mode glow **and** `outline: 2px
solid transparent` (with `outline-offset`) as the forced-colors fallback. No element relies
on box-shadow alone.

## Exact accessibility mechanism (what AT experiences, why it passes)
- **Default render, keyboard user:** the box-shadow glow appears on focus; the transparent
  outline is not perceived but is harmless. Focus is clearly visible.
- **Forced-colors / Windows High Contrast user:** the user agent drops the `box-shadow`,
  but per the platform's forced-colors behaviour the `transparent` outline is replaced with
  a **system color**, rendering a real 2px ring that tracks the focused button. Focus
  remains visible — there is a robust mode of operation in both renders.
- Using `:focus-visible` keeps the indicator correctly tied to keyboard focus, and the ring
  is on the focused element itself (not detached), so it tracks the real focus position.

## Expected ACT-style outcome
**passed** (SC 2.4.7). Every keyboard-operable button has a visible focus indicator in the
default render, and the C40 transparent-outline pairing guarantees a visible, focus-tracking
ring under forced colors as well.

## Why automated tools miss it (i.e., why this is a meaningful boundary)
- To a default-render pixel checker (oj04fd, axe focus heuristics), this page is
  *indistinguishable* from case-01: both remove the conventional appearance and show a
  box-shadow ring; both "pass." The tool cannot see that only this one keeps a forced-colors
  fallback.
- Correctly judging this as a **pass** (and case-01 as a **fail**) requires the same human /
  forced-colors reasoning about the indicator mechanism — exactly the judgment the aspect is
  about. The presence of `outline: 2px solid transparent` is the load-bearing difference an
  automated default-mode checker is blind to.

## Citation
> **WCAG Technique C40, Description note:** "If `box-shadow` only styling is required,
> consider combining it with an `outline: 2px transparent solid` property to ensure
> compatibility with forced-color modes."
