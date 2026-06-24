# case-06 — Summary flags "Country must be selected", but the Country control is disabled and pre-set (could not have produced input)

## Scenario
Step 2 of a home-insurance quote wizard (Aldermont Insurance). A red `role="alert"` summary says
**"Please fix 2 things: Country must be selected. Year the property was built must be a 4-digit year."**
The Year-built field is genuinely flagged (holds "nineteen eighty", red border, `aria-invalid="true"`,
inline message). But the **Country** control is a **disabled `<select>`** pre-set to "United Kingdom"
(the quote product is UK-only, so it is locked) — it is greyed, not focusable, not editable, carries no
`aria-invalid`, and has a helper note explaining it is fixed. A disabled, pre-filled control cannot have
produced a user input error and cannot be corrected by the user, so blaming it in the summary is
incoherent with the page state.

## Attribute tuple + developer persona
- **content-domain:** insurance quote wizard (home insurance)
- **UI-component/pattern:** multi-step quote form; top-of-form `role="alert"` summary; disabled pre-set `<select>`
- **host-language construct:** `<select disabled>` with a single pre-selected `<option>`; `aria-invalid` only on the real error field
- **locale/i18n:** en-GB
- **failure-mechanism:** summary names a disabled/locked field that could not have produced input and cannot be fixed
- **developer persona:** The form previously let users choose a country, with a `required` rule on the Country select. Product later restricted the quote to the UK and the front-end dev **disabled the select and hard-set it to "United Kingdom"** — but the **server-side validator still ran the old `required`/`selected` rule** against a request payload that omits disabled fields (browsers don't submit disabled controls). So the server sees an empty country value, emits "Country must be selected" into the summary, while the visibly-disabled control offers the user no way to act. QA tested the UK-only flow visually but never inspected the summary on a multi-error submit.

## Element / selector carrying the issue
`.errbox ul li:first-child` (summary line "Country must be selected"). The referenced control is
`#country` — a `select[disabled]` with `option[selected]="United Kingdom"`, no `aria-invalid`, greyed
and non-editable. The incoherence: the summary asserts an error for a control whose state (disabled,
pre-set) makes a user input error impossible and a user correction impossible.

## Exact accessibility mechanism (what AT experiences, why it fails)
A screen-reader user hears: "Please fix 2 things. Country must be selected." They navigate to the
Country control — the screen reader announces it as **"Country, combo box, dimmed / unavailable, United
Kingdom"** (disabled). They cannot open it, cannot change it, and it is already populated. The summary
demands an action the page makes impossible, and identifies as "in error" an item that the user neither
filled in nor can edit. The user cannot "determine what is wrong" or act on it, defeating the purpose of
the top-of-form description. The Year-built indicator is well formed (passing 36b590), but the summary
as a whole misidentifies an inert control as an item in error.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
A disabled `<select>` with a label and a pre-selected option is entirely valid markup; the summary is a
valid visible live region with fluent specific text; the real error field is correctly wired
(`aria-invalid` + associated message), so 36b590 passes. No structural rule encodes "a summary should not
attribute an input error to a disabled, non-editable control." Recognising the contradiction requires
knowing that disabled controls are not submitted and cannot be user-corrected, then matching that against
the summary's demand to "select" the country — a contextual reconciliation no automated checker performs.

## Citation
> **WCAG 2.2 Understanding 3.3.1 (Intent), `wcag-understanding/error-identification.html`:**
> "An 'input error' includes: information that is required by the web page but omitted by the user, or
> information that is provided by the user but that falls outside the required data format or allowed
> values."

> **WCAG 2.2 Understanding 3.3.1 (Intent), `wcag-understanding/error-identification.html`:**
> "The intent of this success criterion is to ensure that users are aware that an error has occurred and
> can determine what is wrong."

(An "input error" presupposes user input; a disabled pre-set control admits no user input, so labelling
it "in error" misidentifies the item and leaves the user unable to determine or fix "what is wrong.")
