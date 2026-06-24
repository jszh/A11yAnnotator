# case-01 — Library "Renew" buttons whose only focus ring is a box-shadow glow

## Scenario
A logged-in "Current loans" page for the Brentwood Public Library account area. The
page's primary controls are `<button>` elements ("Renew this item", "Renew all eligible
items"). To give them a "soft modern glow" instead of the browser's default grey ring,
the stylesheet sets `.btn:focus { outline: none; box-shadow: 0 0 0 3px #fff, 0 0 0 6px
#1a73e8; }`. In a normal default render, tabbing to a button shows a clear blue halo — so
it looks correct and the ACT rule oj04fd (one default-mode snapshot) passes. The links on
the same page use a genuine `outline`, so they are fine; only the buttons rely on the
box-shadow.

## Attribute tuple
- **content-domain:** public-library / civic account self-service
- **UI-component / pattern:** list of items with per-row primary action `<button>`s
- **host-language construct:** `:focus { outline: none; box-shadow: ... }` with no outline fallback
- **locale / i18n:** en-GB civic English
- **failure-mechanism:** box-shadow-only indicator suppressed in forced-colors / Windows High Contrast mode, leaving no focus cue (C40 caveat)

## Developer persona
A library-IT contractor copied a button-focus snippet from a popular CSS "remove ugly
focus outlines, add a nice glow" blog post. It looked great on their Mac in the default
browser theme; QA clicked through with a mouse and signed off. Nobody enabled Windows
High Contrast / forced-colors mode, where the glow they relied on simply does not paint.

## Element / selector carrying the issue
`.btn:focus` (e.g. `button.btn[data-id="9781"]`, "Renew all eligible items"). The rule is
`outline: none; box-shadow: 0 0 0 3px #fff, 0 0 0 6px #1a73e8;` — the box-shadow is the
sole indicator and there is no `outline`/border replacement.

## Exact accessibility mechanism (what AT experiences, why it fails)
- **Default render (mouse or keyboard, normal theme):** tabbing to a Renew button shows a
  blue+white halo. Focus is clearly visible. oj04fd's single snapshot sees pixels change →
  pass.
- **Forced-colors / Windows High Contrast user:** the user agent enforces the system color
  palette and, per the C40 note, **commonly suppresses the `box-shadow` property**. With
  the box-shadow gone, `outline: none` still applies, so the focused button is rendered
  identically to the unfocused buttons — there is **no perceptible focus indicator at
  all**. A keyboard user in this mode cannot tell which "Renew" button is focused before
  pressing Enter, which on this page triggers an irreversible renewal.
- The defect is genuinely in the CSS, not faked: the cascade really resolves to
  `outline:none` + a single suppressible property.

## Expected ACT-style outcome
**failed** (SC 2.4.7). There is a keyboard-operable component (the Renew buttons) for which
the *only* author-provided focus indicator is a mechanism that is removed under a standard
user rendering mode, so there is not a robust mode of operation in which focus is visible
for forced-colors users.

## Why automated tools miss it
- `outline: none` is perfectly legal CSS *when a visible replacement exists* — and here a
  replacement (box-shadow) does exist, so no linter rule fires.
- In the default render the focus genuinely changes pixels, so oj04fd / any
  screenshot-diff focus checker passes.
- axe-core, WAVE and Lighthouse evaluate one default-theme render; none simulate
  forced-colors mode or reason about *which CSS property* carries the indicator. Knowing
  that `box-shadow` is dropped in forced colors (and that nothing else remains) is the
  human/spec knowledge the C40 note encodes.

## Citation
> **WCAG Technique C40 (Creating a two-color focus indicator…), Description note:** "Avoid
> setting `outline: none` to use `box-shadow` on its own. User agents commonly suppress the
> `box-shadow` property in forced-color modes, so authors should avoid relying on
> `box-shadow` alone to implement focus indicators. If `box-shadow` only styling is
> required, consider combining it with an `outline: 2px transparent solid` property to
> ensure compatibility with forced-color modes."
