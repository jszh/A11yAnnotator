# case-03 — Five-star rating widget where every star button is named "star"

## Scenario
The "Write a review" form for a restaurant listing (Casa Lumiere on Tablesaver). The overall
rating is an interactive five-star widget: five `<button>`s in a row, where activating the
Nth button sets the rating to N stars. Each button renders a star glyph and is given the
identical accessible name `aria-label="star"`. A screen-reader user moving through the group
hears "star, star, star, star, star" and has no way to know which button assigns one star and
which assigns five — yet the rating value is the entire purpose of the control.

## Attribute tuple
- **Content domain:** restaurant reviews / ratings
- **UI component / pattern:** rating-stars widget (APG-style) inside a review form fieldset
- **Host-language construct:** five native `<button aria-pressed>` controls with `aria-label`
- **Locale / i18n:** en
- **Failure mechanism:** one identical generic token ("star") shared across five functionally-distinct controls that each set a different value

## Developer persona
A mid-level dev built the rating widget by looping over `[1,2,3,4,5]` to emit five buttons,
and set `aria-label="star"` once in the shared button template "because they're all stars."
The visual fill logic (highlight the chosen star and those to its left) was the focus of QA;
the announced name was never heard because the team tested with a mouse. The fill behavior is
driven by JS and `aria-pressed`, so state is correct — only the name is wrong.

## Element / selector carrying the issue
`.stars .star-btn[aria-label="star"]` — all five. The distinguishing value lives only in each
button's `data-value` (1–5) and its left-to-right position; neither reaches the accessible
name. The correct names would be "Rate 1 star", "Rate 2 stars", … "Rate 5 stars".

## Exact accessibility mechanism
AccName for each button = "star" (from `aria-label`; the SVG is `aria-hidden`). A screen
reader announces five buttons all named "star"; the `aria-pressed` state updates correctly
when one is chosen, but the user still cannot target a specific rating because the names do
not encode the value. Activating any of them moves the rating, but the user cannot
intentionally choose "4 stars" — the name fails to communicate which value each control sets.

## Expected ACT-style outcome
**failed** (SC 4.1.2). Each button has a non-empty accessible name, so the ACT "Button has
non-empty accessible name" rule PASSES on all five. The page fails 4.1.2 because the names do
not communicate the controls' purpose (each sets a distinct rating value) — they are
indistinguishable.

## Why automated tools miss it
All five buttons have non-empty names, so axe/WAVE/Lighthouse pass them. The single ACT rule
that flags identical accessible names without equivalent purpose is scoped to `<iframe>`
elements, never to buttons, so it does not apply. Detecting the defect requires knowing the
widget assigns 1–5 stars by position and judging that "star" fails to distinguish the five
values — behavioral/semantic reasoning beyond static analysis.

## Citation
**Reference:** WCAG Technique ARIA14 (`wcag-techniques/aria/ARIA14.html`)
> "users with assistive technologies rely on accessible names that clearly communicate the purpose of components, in this case “Close”."

**Reference:** WCAG 2.2 Understanding Name, Role, Value (`wcag-understanding/name-role-value.html`)
> "If custom controls are created, however, or interface elements are programmed (in code or script) to have a different role and/or function than usual, then additional measures need to be taken to ensure that the controls provide important and appropriate information to assistive technologies"
