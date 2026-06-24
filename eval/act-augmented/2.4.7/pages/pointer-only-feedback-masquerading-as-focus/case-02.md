# case-02 — Loan application form: rich `:hover` border, stripped `:focus`

## Scenario
A credit-union "Personal Loan Application" multi-step form (step 2 of 4). Each text
input, number input, and `<select>` grows a vivid blue border + glow when the cursor
hovers over it. The `:focus` rule resets `outline: none` and defines no replacement, so
tabbing field-to-field through the form produces no visible focus cue on the active
control.

## Attribute tuple
- **content-domain:** banking / financial services (loan origination)
- **UI-component / pattern:** labelled form fields (text, email, number, native select)
- **host-language construct:** `<form><fieldset><label for>` + `<input>` / `<select>`; CSS `:hover` vs `:focus`
- **locale / i18n:** en-US, USD currency
- **failure-mechanism:** focus indicator value placed on `:hover` (pointer) while `:focus` is reset to `outline:none` with no border/box-shadow change

## Developer persona
A junior developer was told to "make the form feel premium like the design comp." They
found a CSS tutorial that animated a blue glow on inputs and copied its rule — but the
tutorial's demo used `:hover` to show off the effect, so `:hover` is what shipped. To keep
the look "consistent" they reset the focus outline (`input:focus { outline: none }`) and,
not realizing the glow lived on `:hover`, never moved it to `:focus`.

## Element / selector carrying the issue
`.field input[type="text"|"number"|"email"]` and `.field select`. The
`border-color:#1a73e8` + `box-shadow` glow are bound to `…:hover`. The `input:focus,
select:focus` rule contains only `outline: none` — no visible change for the focused
state. Submit/secondary buttons repeat `.btn:focus { outline: none }`.

## Exact accessibility mechanism
For text inputs, browsers normally show `:focus-visible` even on mouse-click (per C45's
`<input>` exception), so an author who relied on the UA default would be fine — but here
the UA outline was explicitly removed and the only author-supplied indicator
(`border-color` + glow) is gated behind `:hover`, a pointer-only state. A keyboard user
tabbing into "Gross annual income" or the repayment-term `<select>` sees the field
exactly as it sat idle; there is no caret-independent indication of which field is
focused (and `<select>` shows no caret at all). The form is operable but the keyboard
user cannot track their position.

## Expected ACT-style outcome
**failed** (oj04fd). Under keyboard focus the focused control's computed visual style is
unchanged from idle. *(Verified in Chromium: focusΔ = 0 on every input.)*

## Why automated tools miss it
Every control has a programmatic `<label for>`, the markup is valid, and `outline:none`
is legal. Tools reward the correct labelling and have no SC 2.4.7 check. A scanner cannot
determine that the perceptible state change (`:hover`) is pointer-only while the focus
state is inert. A human must tab through the form and notice the focused field is
indistinguishable from an unfocused one.

## Citation
> **WCAG Technique C15 — Using CSS to change the presentation … when it receives focus**
> (`wcag-techniques/css/C15.html`), Tests / Procedure:
> "For each element able to attain focus: 1. Using a keyboard, tab to the component.
> 2. Check that the focus indicator changes color. 3. Check that the focus indicator is
> removed when the component loses focus."

> **WCAG Technique C45** (`wcag-techniques/css/C45.html`):
> "…browsers always show these styles when a user is navigating using the keyboard, but
> will generally *not* show them as a result of a mouse/pointer interaction (with the
> exception of elements that also support keyboard input, such as `<input>` elements)."
