# case-02 — Two-column benefits form: "First name is required" sits under the Last name field

## Scenario
A State of Oregon SNAP-benefits application, Section 1 (Applicant details), rendered as a
two-column CSS grid. Row 1 holds **First (given) name** (left, value "Maria") and
**Last (family) name** (right, value "Delgado-Ruiz"). After a failed submit, the inline
error "First name is required." is rendered in the right-column cell, directly under the
**Last name** input — and the Last name input is the one given `aria-invalid="true"`. The
First name field actually has a value and is not in error. No `aria-describedby` links the
message to any control.

## Attribute tuple + developer persona
- **content-domain:** government / civic benefits portal
- **UI-component/pattern:** two-column grid form inside a `<fieldset>`/`<legend>` name group
- **host-language construct:** `display:grid; grid-template-columns:1fr 1fr` with one
  `.cell` per field; an error summary `role="alert"` at the top
- **locale/i18n:** en-US
- **failure-mechanism:** error text names the left-column field but is placed in the
  right-column cell; `aria-invalid` is also on the wrong input; no association
- **persona:** A government contractor wired server-side validation. The template loops the
  fields in DOM order and emits the error span into the *current* cell, but an off-by-one in
  the loop (the error for index `i` is emitted into cell `i+1`) shifted the First-name error
  into the Last-name cell. The error summary at the top is generic ("review the highlighted
  fields"), so QA saw "an error showed" and signed off.

## Element / selector carrying the issue
`.grid2 .cell:nth-of-type(2) .inline-error` — the `<span class="inline-error">First name is
required.</span>` placed in the Last-name cell (and `#lname` carries `aria-invalid="true"`).

## Exact accessibility mechanism (what AT experiences / why it fails)
- No `aria-describedby`: a screen reader on `#lname` announces "Last (family) name,
  invalid data, edit, Delgado-Ruiz" (from `aria-invalid`) but never reads the message,
  which is an unlinked sibling span — and `aria-invalid` is on the *wrong* field anyway.
- A **sighted** user reading the grid column-by-column reads "First name is required"
  against the Last name field. Both the message position and the red border point at Last
  name, but the text names First name, which is filled and valid.
- The presentation identifies a different field than the one the text names, and neither
  matches the field actually in error — so the item in error is not identified.

## Expected ACT-style outcome
**failed** — identification "through presentation" points at Last name, contradicting the
message text (First name); SC 3.3.1's "the item that is in error is identified" is not met.

## Why automated tools miss it
The error text is present, visible, and descriptive; the form has proper labels and a
`role="alert"` summary, so structural scanners pass. Tools have no spatial model of the
two-column grid, cannot read the message to learn it names First name, and cannot tell that
its column position (and the misplaced `aria-invalid`) point at a different field. Catching
it needs human reading + spatial reasoning.

## Citation
- **Reference:** WCAG 2.2 Understanding Error Identification, Intent —
  `wcag-understanding/error-identification.html`
  > "This SC requires that users be provided with information about the nature of the error,
  > including the identity of the item in error."
- **Reference:** Trusted Tester v5.1.3, Test 5.F — `refs/trusted-tester/sc-3.3.1-error-identification.md`
  > "The form field with the error is identified in text (e.g., \"Error: Password field.\")."
