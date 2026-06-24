# case-06 — BOUNDARY PASS: inline email error correctly placed under the email field, no aria-describedby

## Scenario
A community-garden ("Brightleaf") waitlist form with three stacked, distinctly-labelled
fields: **Full name** (valid), **Email address** (value `priya.nair@`, invalid), **Phone
(optional)** (valid). The inline error "Email address is incomplete — add the part after the
@." is rendered inside the Email field's own block, directly under the Email input, and the
Email input carries the red `.invalid` border. There is **no** `aria-describedby` / `for`/`id`
error linkage — identification rests entirely on presentation (proximity), done correctly.

## Attribute tuple + developer persona
- **content-domain:** nonprofit / community signup
- **UI-component/pattern:** stacked single-column form, one `.field` block per input
- **host-language construct:** each input and its message live in the same `.field`
  container; the message is the input's next sibling
- **locale/i18n:** en-US
- **failure-mechanism:** NONE — proximity correctly identifies the field in error
- **persona:** A careful developer who deliberately relies on inline proximity (errors next
  to the specific field) as the identification method, knowing WCAG's Understanding document
  endorses it. They keep each error inside the same `.field` wrapper as its input so the
  mapping cannot drift, and flag the matching input.

## Element / selector carrying the issue (the discriminator, not a defect)
`.field:nth-of-type(2) .field-msg` — the email error inside the Email `.field` block,
visually under `#email` (the invalid field), text naming the Email field.

## Exact accessibility mechanism (what AT experiences / why it passes)
- No `aria-describedby` — same as the failing sibling cases — so there is no programmatic
  association, and identification depends on presentation.
- A **sighted** user sees the red message directly under the flagged Email field; both the
  position and the text name Email, and Email is the field actually in error. Visual
  adjacency and message semantics agree and point at the correct field.
- Per the Understanding document, "errors inline, with error messages next to the specific
  fields that are in error" is an acceptable method — and here it is satisfied.

## Expected ACT-style outcome
**passed** — Expectation 1 is met via presentation: the message correctly identifies the
field in error. (Programmatic association is not required by SC 3.3.1.)

## Why automated tools cannot distinguish this from the failing cases
This page is structurally identical to the failing siblings — distinct stacked fields, an
inline red message, **no** `aria-describedby`. A static scan sees the same thing on every
page: present, visible, descriptive error text and no association to flag. The ONLY thing
that flips pass↔fail is whether the message's rendered position points at the field its text
names and that is actually in error — a human visual-spatial + semantic judgment. Including
this passing boundary proves the discriminator is the spatial/semantic match, not "missing
ARIA" and not "inline errors are bad".

## Citation
- **Reference:** WCAG 2.2 Understanding Error Identification — inline-error method (note) —
  `wcag-understanding/error-identification.html`
  > "In other cases, it may be more appropriate to show errors inline, with error messages
  > next to the specific fields that are in error."
- **Reference:** WCAG 2.2 Understanding Error Identification — programmatic info not required —
  `wcag-understanding/error-identification.html`
  > "This type of programmatic information is not required for this success criterion, but
  > may be covered by other criteria such as 4.1.2 Name, Role, Value."
