# case-05 — Custom delivery-slot listbox: active option recolored via JS, focus never moves

## Scenario
A grocery checkout step ("Choose your delivery slot") implemented as a custom
`role="listbox"`. Real keyboard focus sits on the container (`tabindex="0"`); its native
focus ring is removed (`outline: none`). Arrow keys do **not** move focus — instead JS adds
an `.is-active` class (a pale-green `background-color`) to a sibling option `<div>` to show
the "current" slot, and the container does **not** use `aria-activedescendant`. In a
default render, arrowing changes which row is tinted green, so pixels change and oj04fd
passes.

## Attribute tuple
- **content-domain:** e-commerce / grocery delivery checkout
- **UI-component / pattern:** custom ARIA listbox (APG component) of selectable time slots
- **host-language construct:** container `:focus { outline: none }` + JS toggling a `background-color` class on sibling `role="option"` divs; no `aria-activedescendant`
- **locale / i18n:** en-GB, GBP
- **failure-mechanism:** focus stays on the container and is recolored on a *sibling* (G165 "color sections in response to user action"), so AT cannot track it; the pale background tint also flattens in forced-colors mode

## Developer persona
A mid-level developer hand-rolled the listbox from a half-remembered APG example. They got
the roles and `aria-selected` right but skipped `aria-activedescendant` and kept focus on
the wrapper "to make arrow-key handling simpler," indicating the choice with a background
class — the SCR31 "change the background on focus" idea applied to the wrong element. It
arrow-keys fine with a mouse-cursor watching, so it shipped.

## Element / selector carrying the issue
`.listbox:focus` (real focus, ring removed) and `.opt.is-active` (the recolored sibling).
The combination: the focused element (the container) shows no visible change, and the only
cue is a `background-color` tint moved between sibling `<div>`s with no programmatic focus
association.

## Exact accessibility mechanism (what AT experiences, why it fails)
- **Default render, sighted keyboard user:** arrowing visibly moves a pale-green tint down
  the list, so a sighted user can follow it. oj04fd's snapshot sees a pixel change → pass.
- **Screen-reader user:** real focus never leaves the container, and there is no
  `aria-activedescendant`, so AT announces only "listbox" and never tracks which option is
  "current." The cue is a recolored sibling section of the page — exactly the G165 case
  where "AT will not usually be able to find your focus indicator."
- **Forced-colors / Windows High Contrast user:** the `.is-active` cue is a thin author
  `background-color`; in forced colors author background colors collapse to the system
  `Canvas`, so the active option is no longer distinguishable from the others. With the
  container's outline also removed, no focus/active indicator survives.
- All of this is really implemented (focus stays on the wrapper; only a class toggles), so
  AT and forced-colors users genuinely experience the failure.

## Expected ACT-style outcome
**failed** (SC 2.4.7). The keyboard-operable widget provides no focus indicator on the
actually-focused element and conveys the "current option" only by recoloring a sibling,
which AT cannot track and which forced-colors mode flattens — so there is no robust mode in
which focus is visible/trackable.

## Why automated tools miss it
- The roles are present (`listbox`/`option`/`aria-selected`), `tabindex="0"` is valid, and
  `outline: none` is legal given a "replacement" cue exists, so axe/WAVE find nothing.
- A default-render pixel diff sees the green tint move and passes; it cannot reason that
  *focus never moved* and that AT has nothing to announce — that requires understanding the
  widget's focus model (`aria-activedescendant` vs. roving tabindex).
- No tool simulates forced colors to notice the pale tint collapses.

## Citation
> **WCAG Technique G165 (Using the default focus indicator for the platform…),
> Description:** "If you draw your own focus indicator, for example by coloring sections of
> the page in response to user action, these settings will not carry over, and AT will not
> usually be able to find your focus indicator."
