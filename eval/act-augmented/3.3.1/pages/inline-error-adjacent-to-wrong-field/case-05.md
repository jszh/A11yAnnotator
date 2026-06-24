# case-05 — Blood-pressure intake: "Diastolic must be 40–120" rendered under the Systolic field

## Scenario
A Cedar Valley patient-portal "Record blood pressure" form. Inside one BP group, two
side-by-side number inputs: **Systolic** (left, value `118`, normal) and **Diastolic**
(right, value `135`, out of range). The inline error "Diastolic must be between 40 and 120
mmHg." is placed in the **Systolic** column, directly under the Systolic input — and the
Systolic input carries the red `.alert` border. The Diastolic input (the actually-out-of-
range value) has no message. No `aria-describedby` anywhere.

## Attribute tuple + developer persona
- **content-domain:** healthcare / patient portal (vital signs)
- **UI-component/pattern:** paired numeric inputs with a `/` separator (systolic/diastolic)
- **host-language construct:** flex row of two `.vital` blocks; per-vital `.v-error`
- **locale/i18n:** en-US, clinical units (mmHg)
- **failure-mechanism:** range error for the right input rendered in the left input's slot;
  red border also on the wrong input; no association
- **persona:** A clinician-developer built the EHR vitals widget. The validation function
  returns `{ field, message }` but the render helper writes the message into the *first*
  `.vital` block when both numbers are present, regardless of `field`. With a normal systolic
  and a high diastolic, the diastolic message renders under systolic. Demoed with two
  in-range numbers, the bug never surfaced.

## Element / selector carrying the issue
`.bp-inputs .vital:first-child .v-error` — the `<div class="v-error">Diastolic must be
between 40 and 120 mmHg.</div>` placed under `#sys`, while its text names the **Diastolic**
field (and `#sys` wrongly carries the `.alert` border).

## Exact accessibility mechanism (what AT experiences / why it fails)
- No `aria-describedby`: a screen reader on `#sys` or `#dia` never hears the message linked
  to either control.
- A **sighted** clinician sees the red Systolic field with a "Diastolic must be 40–120"
  message under it. The presentation says Systolic is in error; the text says Diastolic is.
  The genuinely out-of-range value (diastolic 135) shows no message.
- This is a patient-safety mislead: the reader could "correct" the normal systolic value
  while the abnormal diastolic stays. Presentation identifies the wrong vital sign.

## Expected ACT-style outcome
**failed** — presentation (proximity + red border) identifies Systolic, but the field in
error is Diastolic; the item in error is not correctly identified.

## Why automated tools miss it
The message is present, visible, in the accessibility tree, and even states the valid range
(strong on cause/suggestion); there is no `aria-describedby` to flag. A scanner cannot read
"Diastolic" and compare it to the column the span sits in, nor know that `135` (not `118`)
is the out-of-range value. Determining that the message's position points at a different
vital than its text — and than the data — is a semantic + spatial + domain judgment.

## Citation
- **Reference:** WCAG 2.2 Understanding Error Identification — input-error definition —
  `wcag-understanding/error-identification.html`
  > "information that is provided by the user but that falls outside the required data format
  > or allowed values."
- **Reference:** ACT Rule 36b590, Expectation 1 — `act-rules/extracted/36b590.md`
  > "at least one of the form field error indicators allows the identification of the related
  > test target, through text , or through non-text content , or through presentation ."
