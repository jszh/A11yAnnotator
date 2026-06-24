# case-05 — Benefits-wizard step where several buttons all say "Submit" (plus one "Action") for different functions

## Scenario
Step 3 of a council benefits application has multiple `<button>`s. Three of them are
labelled **"Submit"** but perform three different functions: one *adds a typed household
member to the list*, one *uploads the chosen evidence file* (staying on the step), and one
*saves the whole application and advances to step 4*. A fourth button is labelled
**"Action"**. Each label is a real, loosely-true word (every button does submit/act on
something) but none of them tells the user what its button will actually do — exercising
the **button-label sub-limb** of 2.4.6 (TT Test 5.B, second condition).

## Attribute tuple
- **content-domain**: government / civic services — council-tax-reduction application wizard
- **UI-component/pattern**: multi-step form wizard with an inline "add to list" control, a file upload, and a save/continue control
- **host-language construct**: native `<button>` elements whose visible text *is* their accessible name
- **locale/i18n**: en-GB (GOV.UK-style service)
- **failure-mechanism**: generic, undifferentiated button labels ("Submit" x3, "Action") that fail to convey each button's distinct function

## Developer persona
A contractor built the wizard from a generic form-component library where the default
primary-button label is "Submit" and a utility button defaults to "Action". They wired up
the three different click handlers but never overrode the default labels, reasoning that
"it's a form, so Submit is correct." On screen the buttons sit beside different fields, so
*positionally* a sighted mouse user can guess — but the labels themselves carry none of
that meaning.

## Element / selector carrying the issue
- FAIL: the "add person" `button.btn.secondary` (text "Submit") inside the *People who live
  with you* fieldset — its function is "add this name to the list," not submit the form.
- FAIL: the "upload" `button.btn.secondary` (text "Submit") inside the *Proof of income*
  fieldset — its function is "upload the selected file."
- FAIL: the final `button[type=submit].btn` (text "Submit") — saves the application and goes
  to step 4.
- FAIL: the trailing `button.btn.secondary` (text "Action") — most generic of all.

## Exact accessibility mechanism
A screen-reader user tabbing through the step hears "Submit, button … Submit, button …
Submit, button … Action, button." Three identically-named "Submit" buttons that do
different things are indistinguishable by name, and "Action" conveys nothing. A
voice-control user saying "click Submit" has three ambiguous targets. The buttons are all
*named* (4.1.2 passes) and *labelled* (3.3.2 passes), but the labels are not sufficiently
descriptive for the user to know each button's function — the second PASS condition of
TT 5.B. Because the labels are technically relevant (all are submit-ish actions) this is a
descriptiveness failure, not the deliberate-mismatch case ACT already covers.

## Expected ACT-style outcome
**failed** — the button labels are present and named but not sufficiently descriptive of
each control's distinct function.

## Why automated tools miss it
Every `<button>` has a non-empty accessible name, so axe-core (`button-name`), WAVE, and
Lighthouse pass. Some tools flag *duplicate* accessible names only for links in a list
context, not for buttons that legitimately repeat — and even a duplicate-name heuristic
cannot tell whether the repetition is *appropriate* (three "Add to cart" buttons in a
product grid are fine) or *confusing* (three "Submit" buttons doing different things).
Deciding that "Submit"/"Action" fails to convey each button's function requires a human to
read each button against the action it performs — a meaning judgment no checker performs.

## Citation
> **WCAG 2.2 Understanding 2.4.6 — Benefits**
> "Form input controls with labels that clearly and accurately describe the content that is
> expected to be entered helps users know how to successfully complete the form."

> **WCAG Techniques — G131: Providing descriptive labels**
> "The objective of this technique is to ensure that the label for any interactive
> component within web content makes the component's purpose clear."

> **Trusted Tester 5.1.3 — Test 5.B (`2.4.6-label-descriptive`)**
> "Each visual button label is sufficiently clear and descriptive, so users know its
> function."
