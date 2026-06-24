# case-02 — Settings form whose fields are labeled "Value", "Setting 1", "Setting 2", "Setting 3"

## Scenario
A CRM's **Notification preferences** form has four real controls that do genuinely
different things: a digest-frequency `<select>`, a colour-theme `<select>`, an
interface-language `<select>`, and a quiet-hours-start `<input type=time>`. Each control
has a properly associated visible `<label>`, but the labels read **"Value"**,
**"Setting 1"**, **"Setting 2"**, **"Setting 3"**. Every label is technically a label, but
none of them tells the user what the field actually controls or what value to choose.

## Attribute tuple
- **content-domain**: SaaS analytics / CRM dashboard (account settings)
- **UI-component/pattern**: vertical settings form with sidebar nav, `<select>` + `<input type=time>` controls
- **host-language construct**: native `<label for>` correctly associated with each `<select>`/`<input>`
- **locale/i18n**: en
- **failure-mechanism**: present, programmatically-associated labels that fail to convey the control's purpose ("Value" / "Setting 1–3" over frequency / theme / language / quiet-hours)

## Developer persona
A backend engineer wired the settings screen from a generic key/value preferences table in
the database. The form was generated from a loop that rendered each row's `<label>` from a
placeholder ("Value", "Setting 1"…) intended to be swapped for the human-readable name
later. The friendly names lived only in a design spec that never made it into the template,
and because every field "has a label," the front-end lint and the QA pass both went green.

## Element / selector carrying the issue
- FAIL: `label[for="f-digest"]` ("Value") on the digest-frequency `<select>`.
- FAIL: `label[for="f-theme"]` ("Setting 1") on the theme `<select>`.
- FAIL: `label[for="f-lang"]` ("Setting 2") on the language `<select>`.
- FAIL: `label[for="f-quiet"]` ("Setting 3") on the quiet-hours `<input type="time">`.

## Exact accessibility mechanism
Each control is correctly named for assistive technology, so a screen reader announces, for
example, "Value, combo box, Once a day." The control is *named* (passes 4.1.2) and *has a
label* (passes 3.3.2), but the name does not make the control's **purpose** clear: a blind
or cognitively-disabled user navigating the form by Tab hears "Value", "Setting 1",
"Setting 2", "Setting 3" with no way to know that field one sets email frequency, field two
sets the theme, and field three sets the language. The descriptive answer lives only in the
free-text `.hint` paragraphs, which are not part of the label and which a user tabbing
control-to-control may skip. This is exactly Test 5.B: a visible form label must be
sufficiently descriptive so users know what input is expected; "Value" and "Setting 1" are
not.

## Expected ACT-style outcome
**failed** — the form labels are present and associated but not sufficiently descriptive of
each control's purpose.

## Why automated tools miss it
Every `<select>`/`<input>` has a non-empty `<label for>` correctly bound to it, so axe-core
(`label`, `select-name`), WAVE, and Lighthouse all report the controls as properly labelled
— their entire model of this SC is *presence + association*, which is satisfied. "Value"
and "Setting 1" are real words/strings, not empty, so no empty-label rule fires. Whether
"Value" adequately describes a digest-frequency control is a meaning judgment requiring a
human to compare each label against what its control actually does — no automated checker
has that semantic notion, and reviewers can reasonably disagree on the borderline.

## Citation
> **WCAG 2.2 Understanding 2.4.6 — Intent**
> "This success criterion does not require the use of labels; however, it does require that
> if labels are present, they must be accurate and sufficiently clear or descriptive."

> **WCAG Techniques — G131: Providing descriptive labels**
> "The objective of this technique is to ensure that the label for any interactive
> component within web content makes the component's purpose clear."

> **Trusted Tester 5.1.3 — Test 5.B (`2.4.6-label-descriptive`)**
> "Each visual form label is sufficiently clear and descriptive, so users know what input
> data is expected."
