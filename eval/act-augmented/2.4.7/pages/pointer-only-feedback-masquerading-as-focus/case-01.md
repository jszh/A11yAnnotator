# case-01 — Bistro primary nav: `:hover` pill, `:focus { outline: none }`

## Scenario
A farm-to-table restaurant marketing site. The primary navigation links (Menu, Our
Story, Partner Farms, Private Events, Visit) light up with a pale-mint pill the moment
the cursor hovers or presses them. The browser's default focus ring was removed. A
keyboard user pressing Tab through the menu sees nothing change on the focused link.

## Attribute tuple
- **content-domain:** restaurant / hospitality marketing
- **UI-component / pattern:** horizontal primary navigation bar (links)
- **host-language construct:** `<nav><ul><li><a>` + CSS `:hover` / `:active` / `:focus`
- **locale / i18n:** en-US
- **failure-mechanism:** visible feedback bound to pointer states (`:hover`, `:active`) only; `:focus { outline: none }` with no keyboard replacement

## Developer persona
A small studio rebuilt the bistro's site and pasted the navigation styling block from
their previous marketing-template project. That block was authored to make the menu
"feel premium" on a mouse-driven desktop site: a soft mint pill on hover. The lead
designer asked them to "kill the ugly browser outlines," so they added
`nav.primary a:focus { outline: none }` and never circled back to add a keyboard cue.

## Element / selector carrying the issue
`nav.primary a` — feedback exists only in `nav.primary a:hover, nav.primary a:active`
(`background-color:#dcffff`); `nav.primary a:focus { outline: none }` strips the UA ring
with no replacement. The same pattern is repeated on `.reserve:focus`.

## Exact accessibility mechanism
The pale-mint pill is bound exclusively to pointer-modality pseudo-classes. `:hover`
fires only for a pointing device; `:active` is the press state and reverts on release.
Tab fires `:focus`, whose only declared rule sets `outline: none`. Result: a keyboard
user has no perceptible indication of which nav link currently holds focus. A screen-
reader user is unaffected (the link is still announced), but a **sighted keyboard user**
— exactly the population SC 2.4.7 protects — is left blind to focus position.

## Expected ACT-style outcome
**failed** (oj04fd "Element in sequential focus order has visible focus"). Under
programmatic/keyboard focus the focused `<a>` is visually identical to its idle state.
*(Verified in Chromium: focusΔ = 0 visual properties on every nav link.)*

## Why automated tools miss it
`outline: none` is legal CSS, and a valid focus indicator could plausibly be supplied via
`:hover`/`:focus`/`box-shadow`/a class. There is no reliable automated oracle for
SC 2.4.7. A scanner cannot reason that the only state carrying a perceptible change
(`:hover`) is pointer-triggered and never responds to keyboard focus. Confirming the
failure requires a human to tab through and observe that the focused link looks the same
as its neighbours.

## Citation
> **WCAG Technique C45 — Using CSS `:focus-visible`** (`wcag-techniques/css/C45.html`):
> "Styles defined with the regular `:focus` pseudo-class are applied whenever an element
> has focus, regardless of how it received focus. In contrast, user agents apply
> additional heuristics and logic to decide when to show `:focus-visible` styles – in
> particular, browsers always show these styles when a user is navigating using the
> keyboard, but will generally *not* show them as a result of a mouse/pointer interaction
> (with the exception of elements that also support keyboard input, such as `<input>`
> elements)."

> **WCAG Failure F78** (`wcag-techniques/failures/F78.html`):
> "The following CSS example will remove the default focus indicator, which fails the
> requirement to provide a visible focus indicator. `:focus {outline: none}`"
