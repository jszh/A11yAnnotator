# case-01 — Payment row: "CVV must be 3 digits" floats under the Card number box

## Scenario
A retail (Northwind Outfitters) checkout, step 3 of 4. The payment row is a flex row with
three distinctly-labelled inputs: **Card number**, **Expiry (MM/YY)**, **CVV**. The CVV
value entered is `12` (two digits — the actually-invalid value). The inline error
"CVV must be exactly 3 digits." is rendered in the message slot directly beneath the **Card
number** input, and the Card number input (not the CVV input) carries the red `.invalid`
border. No `aria-describedby` / `for`/`id` linkage exists anywhere.

## Attribute tuple + developer persona
- **content-domain:** e-commerce checkout / payments
- **UI-component/pattern:** horizontal payment field row (Card / Expiry / CVV)
- **host-language construct:** flexbox row with a fixed per-field `.msg-slot`
- **locale/i18n:** en-US
- **failure-mechanism:** error text names field A (CVV) but is placed in field B's (Card
  number) reserved message slot; no programmatic association
- **persona:** An agency developer themed a Shopify-Dawn-style checkout. They built one
  reusable `.msg-slot` div per field and wire errors in from a validation map keyed by
  field name. A copy/paste while wiring put the CVV error string into the Card-number
  slot's render call. They visually QA'd on a full (valid) form, never seeing the misplaced
  error, and shipped.

## Element / selector carrying the issue
`.field.card-no .msg-slot .err` — the `<span class="err">CVV must be exactly 3 digits.</span>`
rendered inside the **Card number** field block, while its text names the **CVV** field.

## Exact accessibility mechanism (what AT experiences / why it fails)
- There is **no** `aria-describedby`, so no screen reader associates the message with any
  input; on focusing CVV the AT announces only "CVV, edit, 12" with no error.
- A **sighted** user (the population SC 3.3.1 most directly protects for inline proximity)
  reads the red message against the field it sits under. By proximity it reads as
  annotating **Card number**, but it names **CVV** — so the user is told the wrong field is
  in error. The truly invalid field (CVV) appears unflagged.
- Identification "through presentation" (proximity) is the only available cue, and that cue
  points at the wrong target. The item in error is therefore not correctly identified.

## Expected ACT-style outcome
**failed** — Expectation 1 of 36b590 ("identification of the related test target … through
presentation") is not met: the presentation identifies Card number, not the CVV field that
is actually in error.

## Why automated tools miss it
The message is non-empty, visible, in the accessibility tree, and describes the cause — so
every facet axe/WAVE/Lighthouse can check passes. With no `aria-describedby` there is no
association for a rule to flag, and 36b590 explicitly allows identification by presentation.
Detecting the fault requires (a) reading the message text to learn it names CVV, (b)
computing which field the span visually adjoins (Card number), and (c) noticing they
disagree — a visual-spatial + semantic judgment no static scanner performs.

## Citation
- **Reference:** ACT Rule 36b590 (Error message describes invalid form field value),
  Expectation 1 — `act-rules/extracted/36b590.md`
  > "Each test target either has no form field error indicators , or at least one of the
  > form field error indicators allows the identification of the related test target,
  > through text , or through non-text content , or through presentation ."
- **Reference:** WCAG 2.2 Understanding Error Identification, Intent —
  `wcag-understanding/error-identification.html`
  > "This SC requires that users be provided with information about the nature of the error,
  > including the identity of the item in error."
