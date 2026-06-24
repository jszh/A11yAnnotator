# case-04 — TIN format rule placed in a "Notes" block AFTER the submit button

## Scenario
A university graduate financial-aid form (Lakemont State University, "Taxpayer information",
Section 4 of 6). The **Taxpayer identification number** field requires exactly 9 digits with no
dashes or spaces. That format rule genuinely exists on the page — readable, accurate,
high-contrast — but it is collected into a "Notes" block placed **after the "Save and continue"
submit button**. In both visual order and DOM reading order the instruction follows the action,
so a user who fills the fields and presses the button never encounters it at the point of entry.

## Attribute tuple + developer persona
- **content-domain:** higher-ed / financial-aid intake (tax/payroll)
- **UI-component/pattern:** multi-section wizard step with a trailing "Notes" footnote block
- **host-language construct:** `<button type="submit">` followed by a `.post-notes` `<ul>` of hints
- **locale/i18n:** en-US
- **failure-mechanism:** the field's format instruction is positioned after the submit action, so
  it cannot inform the field at the point of entry (orphaned by post-action placement)
- **persona:** An agency dev migrating a legacy PDF form to the web preserved the PDF's structure
  literally: the paper form had a "Notes" section at the bottom of the page listing how to fill in
  each numbered field. They reproduced it as a trailing `<ul>` after the action area, assuming
  "all the help is on the page." Because the legacy layout put notes last, the web version inherited
  an instruction that sits past the button, where no one reads it before submitting.

## Element / selector carrying the issue
`.post-notes` (the `<ul>` after `<button type="submit">`), specifically the list item stating the
TIN must be "9 digits with no dashes or spaces". It governs `#tin`, which is rendered far above it
with no adjacent hint.

## Exact accessibility mechanism (what AT experiences / why it fails)
- A **sighted** user completes Legal name → TIN → Number type → Citizenship and reaches the
  prominent "Save and continue" button. The natural action is to click it; the Notes block below
  is past the visual end of the task and is not read. They enter `123-45-6789` (the customary SSN
  format) and the entry is rejected — the instruction existed but was positioned where it could
  not inform the field.
- A **screen-reader** user navigating in DOM order hits the submit button before the Notes list,
  so the format rule comes after the control it governs in the reading sequence too; a user who
  acts on the button never reaches it.
- The instruction is on the page but, by position, is not presented to the user *for that control*
  at the moment of input — it follows the action instead of informing the field.

## Expected ACT-style outcome
**failed** — the TIN format instruction exists and is readable but is positioned after the submit
button (in visual and reading order), so it is not presented to the user for the field at the
point of entry; the user is forced into navigation/back-tracking the SC warns against.

## Why automated tools miss it
The instruction is non-empty, high-contrast, readable, and present in the DOM, and the TIN field
has a proper visible `<label>` — so "instruction exists?" and "field labelled?" both pass.
axe/WAVE/Lighthouse have no notion of whether an instruction is positioned *before or after* the
control/action it governs, nor that a trailing "Notes" list explains a field rendered far above
it. Determining that the instruction sits where it cannot inform the field requires reading the
text, mapping it to its field, and reasoning about reading/visual order relative to the submit
action — a layout judgment.

## Citation
- **Reference:** WCAG 2.2 Understanding Labels or Instructions, Intent —
  `wcag-understanding/labels-or-instructions.html`
  > "The goal is to make certain that enough information is provided for the user to accomplish the
  > task without undue confusion or navigation."
- **Reference:** WCAG 2.2 Understanding Labels or Instructions, Benefits —
  `wcag-understanding/labels-or-instructions.html`
  > "Providing labels and instructions (including identification of required fields) can prevent
  > users from making incomplete or incorrect form submissions, which prevents users from having
  > to navigate once more through a page/form in order to fix submission errors."
- **Reference:** Trusted Tester 5.1.3, SC 3.3.2 — Notes —
  `refs/trusted-tester/sc-3.3.2-labels-or-instructions.md`
  > "The label or instruction must be visible when the form field has focus."
