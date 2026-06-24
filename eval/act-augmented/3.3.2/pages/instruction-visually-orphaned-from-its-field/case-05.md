# case-05 — Absolutely-positioned CVC note paints beneath the wrong field

## Scenario
A checkout "Payment details" step (Northwind Tickets). The **Security code** (CVC) field needs a
non-obvious instruction — how many digits and where to find them ("3 digits on the back; on Amex,
4 on the front"). That instruction genuinely exists, is readable and high-contrast, follows the
CVC input in source order, **and** is programmatically bound to it via `aria-describedby="cvc-note"`.
But the note is taken out of normal flow with `position:absolute` and pinned to the lower-left of
the Expiry/Security-code row, so its painted box lands in the empty band beneath the inputs,
**left-aligned under the full-width Card number field** — not beneath the Security code field on the
right, which is left with empty space and appears to have no instruction. A sighted user reads the
"enter 3 digits…" guidance as belonging to the Card-number / left column, while the field it
actually governs looks unexplained. The instruction is present and AT-associated but is not
*visually presented as the Security code field's instruction*.

## Attribute tuple + developer persona
- **content-domain:** e-commerce checkout / payments (ticketing)
- **UI-component/pattern:** flex row of two side-by-side fields (Expiry + Security code) beneath a
  full-width Card number field, with an out-of-flow helper note
- **host-language construct:** `position:absolute; left:0; bottom:0` helper paragraph inside a
  `position:relative` row, decoupling the note's painted position from its field
- **locale/i18n:** en-US (Visa/MC vs Amex CVC convention)
- **failure-mechanism:** the instruction is absolutely positioned so it renders under a *different*
  field, so proximity attaches it to the wrong control (orphaned by out-of-flow positioning)
- **persona:** A developer wanted the CVC help to read as a tidy footnote rather than crowd the
  narrow Security-code column, so they pulled it out of flow with `position:absolute` and nudged it
  to the form's left edge "in the spare space below." Because `aria-describedby` still pointed the
  note at the CVC input, screen readers got it on focus, so the dev considered it done. They tested
  by tabbing (AT hears it) and by reading their source (note follows the CVC input) — never stepping
  back to see that on screen the note now sits under the Card number field, with the Security code
  box left visually unexplained.

## Element / selector carrying the issue
`#cvc-note` (`.cvc-note`, `position:absolute`) — the format instruction for `#cvc` (Security code).
It is wired `aria-describedby="cvc-note"` and follows `#cvc` in source, but its rendered box is
column-aligned under `#card` (the full-width Card number field) and overlaps `#cvc` by only ~7%
horizontally, so proximity binds it to the wrong field / the left column rather than to the Security
code input.

## Exact accessibility mechanism (what AT experiences / why it fails)
- A **sighted** user scanning the laid-out form sees the Card number field, then an Expiry +
  Security code row, then a paragraph of "enter 3 digits — the small number on the back of your
  card…" sitting at the form's left edge directly under the Card-number/Expiry column. Proximity is
  the only visual cue tying instructions to fields here, and it points the note at the left column,
  not at the Security code box up and to the right (which has empty space beneath it). The user may
  read the CVC guidance as Card-number/Expiry help, or be unsure which field it governs; the
  Security code field is effectively without a perceivably-bound instruction.
- A **screen-reader** user focusing the Security code field *is* served the text, because
  `aria-describedby="cvc-note"` exposes it regardless of where it paints — illustrating the SC's own
  point that reaching AT users is not sufficient: 3.3.2 requires the instruction be presented to all
  users, and the sighted population sees it parked under the wrong field.
- The instruction is present and AT-associated, but its rendered position does not present it *as the
  Security code field's instruction* to sighted users; proximity attaches it elsewhere.

## Expected ACT-style outcome
**failed** — the Security-code format instruction exists, is readable, and is programmatically
associated, but `position:absolute` parks its painted box under a different field (Card number /
left column) rather than the Security code field it governs, so it is not perceivably presented as
that field's instruction; the sighted user must guess or hunt, which is the undue confusion the SC
guards against.

## Why automated tools miss it
Every field has a proper visible `<label>`, the instruction text is present, readable, and
high-contrast, it follows the CVC input in source order, AND it is correctly associated via
`aria-describedby="cvc-note"` — so "field labelled?", "instruction exists?", and "instruction
associated?" all pass cleanly (and `aria-describedby` pointing at the right field would, if
anything, make a scanner *more* confident the page is fine). The defect is purely the rendered
two-dimensional position: `position:absolute` flows the note's painted box under the wrong field.
axe/WAVE/Lighthouse reason about DOM order and programmatic association — both of which here point
at the CVC input — not about where the text actually paints relative to competing fields. They
cannot compute that absolute positioning has parked the instruction beneath the Card number field.
Recognizing the wrong-field proximity requires seeing the laid-out page and judging visual binding.

## Citation
- **Reference:** WCAG 2.2 Understanding Labels or Instructions, Intent (relationship to 4.1.2) —
  `wcag-understanding/labels-or-instructions.html`
  > "It is possible for controls and inputs to have an appropriate accessible name or description (e.g. using `aria-label="..."`) and therefore pass Success Criterion 4.1.2, but to still fail this success criterion (if the labels or instructions aren't presented to all users, not just those using assistive technologies)."
- **Reference:** WCAG 2.2 Understanding Labels or Instructions, Intent —
  `wcag-understanding/labels-or-instructions.html`
  > "The goal is to make certain that enough information is provided for the user to accomplish the task without undue confusion or navigation."
- **Reference:** Trusted Tester 5.1.3, SC 3.3.2 — Notes —
  `refs/trusted-tester/sc-3.3.2-labels-or-instructions.md`
  > "The label or instruction must be visible when the form field has focus."
