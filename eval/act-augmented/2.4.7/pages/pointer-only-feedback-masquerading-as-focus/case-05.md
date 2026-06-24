# case-05 — ARIA combobox: active option highlighted only on `mousemove`

## Scenario
A checkout "shipping country" field built as an ARIA combobox with
`aria-activedescendant`. Real keyboard focus stays on the `<input>`; the "focused option"
is conveyed to AT by `aria-activedescendant`. The blue option highlight (`.opt.hot`) is
toggled exclusively by `mousemove` / `mouseleave`. ArrowUp/ArrowDown correctly update
`aria-activedescendant` but never paint the active option, and no CSS targets the active
descendant — so a sighted keyboard user arrowing the list sees nothing move.

## Attribute tuple
- **content-domain:** e-commerce checkout (international shipping)
- **UI-component / pattern:** APG combobox / listbox with `aria-activedescendant`
- **host-language construct:** `<input role="combobox" aria-activedescendant>` + `<ul role="listbox"><li role="option">`; JS keydown vs mouse listeners
- **locale / i18n:** multi-region country list (FR/DE/IT/ES/NL/SE/PT)
- **failure-mechanism:** focus indicator on the **active descendant** is driven by pointer-only JS; keyboard updates the ARIA pointer but applies no visible style

## Developer persona
A developer ported a mouse-era autocomplete widget. Its original highlight logic lived in
`mousemove`/`mouseleave` handlers that marked the hovered option `.hot`. When they added
ARIA keyboard support, they wired `keydown` to move `aria-activedescendant` (so screen
readers announce the right option) and called it done — assuming the existing highlight
"would follow." It does not: nothing paints the active descendant for keyboard users, and
the CSS has no `[aria-activedescendant]`-correlated selector, only the pointer `.hot` class.

## Element / selector carrying the issue
`#country-list .opt`. Visual highlight = `.opt.hot { background:#2563eb; color:#fff }`,
added only in the `mousemove` handler. The `keydown` handler updates
`aria-activedescendant` and scrolls the option into view but never adds `.hot`. No CSS
rule styles the option referenced by `aria-activedescendant`.

## Exact accessibility mechanism
In an `aria-activedescendant` widget the visually-indicated active option **is** the focus
indicator the keyboard user needs (DOM focus never leaves the input). Here the highlight
is bound to `mousemove`, a pointer event keyboard navigation cannot fire. *(Verified in
Chromium: two ArrowDown presses moved `aria-activedescendant` to `opt-it` (Italy) with
**zero** options visually highlighted; a pointer `mousemove` over Spain painted `opt-es`
`rgb(37,99,235)`.)* A screen-reader user hears the active country; a sighted keyboard user
sees the highlight frozen on whatever the mouse last touched, or nothing — they cannot
tell which option Enter will select.

## Expected ACT-style outcome
**failed** (oj04fd, interpreted at the active-descendant level). The keyboard-active
option has no visible focus indication.

## Why automated tools miss it
The ARIA plumbing is textbook-correct: valid roles, the input has an accessible name
(`aria-labelledby`), and `aria-activedescendant` references a real option and updates on
arrow keys — axe actively rewards this. No scanner correlates "the keyboard moves the
active descendant" with "no CSS ever makes that descendant look different," because the
highlight is gated behind pointer-only JS listeners. Catching it requires a human to arrow
through and watch whether the visible highlight follows the keyboard.

## Citation
> **WCAG Technique C45** (`wcag-techniques/css/C45.html`), Tests / Procedure:
> "For each user interface component that can receive keyboard focus: 1. Set focus to the
> interface component using the keyboard (generally, navigating to the component using
> Tab/Shift+Tab) 2. Verify that once the component has received focus, a focus indicator
> is visible."

> **WCAG 2.2 Understanding 2.4.7 — Intent** (`wcag-understanding/focus-visible.html`):
> "Authors are responsible for providing at least one mode of operation where the focus is
> visible."
