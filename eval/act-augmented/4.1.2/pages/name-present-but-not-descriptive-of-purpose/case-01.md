# case-01 — Editor toolbar of five icon buttons all named "button"

## Scenario
A lightweight document editor (Quillpad) shows a formatting toolbar with five icon-only
`<button>`s: cut, copy, paste, undo, redo. Each renders a clear, distinct inline-SVG glyph
(scissors, overlapping pages, clipboard, two curved arrows) and performs a distinct action.
But every button carries the identical accessible name `aria-label="button"`. The names are
non-empty and the roles/states are correct, so a screen-reader user tabbing the toolbar
hears "button, button, button, button, button (dimmed)" and cannot tell which control cuts,
which pastes, or which redoes.

## Attribute tuple
- **Content domain:** SaaS productivity — document editor
- **UI component / pattern:** toolbar (APG `role="toolbar"`) of icon-only buttons
- **Host-language construct:** native `<button>` with inline `<svg aria-hidden="true">` and `aria-label`
- **Locale / i18n:** en
- **Failure mechanism:** generic semantically-empty token ("button") reused as the accessible name on every functionally-distinct control

## Developer persona
A junior front-end dev scaffolded the toolbar from a UI-kit snippet whose template literal
was `aria-label="button"` as a placeholder meant to be filled per control. They wired up the
`data-cmd` handlers and the icons, shipped, and never replaced the placeholder label — it was
invisible in the rendered UI (icons looked fine) and the linter stayed green because the
attribute was present and non-empty.

## Element / selector carrying the issue
`.toolbar button.tbtn[aria-label="button"]` — all five. The true purpose lives only in each
button's `data-cmd` value and its rendered SVG glyph, neither of which reaches the
accessible name.

## Exact accessibility mechanism
The accessible name of each button is computed from `aria-label`, which wins over the
`aria-hidden="true"` SVG. So AccName = "button" for all five. A screen reader announces
"button, button" with no differentiation; voice-control users saying "click cut" find no
matching name; the disabled redo announces "button dimmed" but still not "redo." The role
(button) and the `disabled` state are correctly conveyed — the NAME is the sole defect, and
it carries zero information about what the control does.

## Expected ACT-style outcome
**failed** (SC 4.1.2). Each button has a non-empty accessible name, so ACT rule "Button has
non-empty accessible name" PASSES on every one. The page nonetheless fails 4.1.2 because the
name does not "clearly communicate the purpose of components" (ARIA14) / does not provide
"important and appropriate information" identifying the control (Understanding).

## Why automated tools miss it
axe-core, WAVE, and Lighthouse check only that each interactive element has a non-empty
accessible name; `"button"` satisfies that on all five, so they report no violation. No
4.1.2 automated rule assesses name quality or descriptiveness, and the only uniqueness-aware
ACT rule ("elements with identical accessible names have equivalent purpose") is scoped to
`<iframe>`, not to buttons. Recognizing that "button" fails to identify a cut/copy/paste
control requires reading the rendered scissors/clipboard icons and inferring purpose — a
visual-semantic human judgment no scanner performs.

## Citation
**Reference:** WCAG Technique ARIA14 (`wcag-techniques/aria/ARIA14.html`)
> "While it might be visually clear that the button with the “×” symbol closes the dialog, users with assistive technologies rely on accessible names that clearly communicate the purpose of components, in this case “Close”."

**Reference:** WCAG 2.2 Understanding Name, Role, Value (`wcag-understanding/name-role-value.html`)
> "additional measures need to be taken to ensure that the controls provide important and appropriate information to assistive technologies and allow themselves to be controlled by assistive technologies."
