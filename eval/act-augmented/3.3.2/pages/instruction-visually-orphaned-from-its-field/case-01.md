# case-01 — DD/MM/YYYY note at the top of a long HMRC form; Date of birth field far below

## Scenario
A GOV.UK-style "Register for Self Assessment" form (HM Revenue & Customs). The only statement
of the required date format — "enter all dates using the format DD/MM/YYYY" — sits in a single
high-contrast notice at the **very top** of the form. The field it actually governs, **Date of
birth**, is a three-box (Day / Month / Year) input located after two full sections (Your name,
Contact details) and two `<hr>` dividers — well below the fold. At the point of entry the date
field has a proper visible label and a labelled group but **no inline format hint**, so a user
who scrolled past the top notice has no cue about the expected format when they reach the field.

## Attribute tuple + developer persona
- **content-domain:** government / civic tax-registration service
- **UI-component/pattern:** GDS three-field date input inside a long multi-fieldset form
- **host-language construct:** `role="note"` banner + `role="group"` date with `aria-labelledby`
- **locale/i18n:** en-GB; DD/MM/YYYY ordering (a genuinely out-of-customary format for some users)
- **failure-mechanism:** instruction stated once at top-of-form, governed field far below — the
  cue is not perceivable at the point of entry (orphaned by reading-order distance)
- **persona:** A content designer following the GDS "tell users important things once, at the
  top" pattern added a service-wide date-format notice to the page intro. The date-input
  component the team reused ships without a per-field hint slot, so no one re-stated the format
  beside the Date of birth field. On the design mock (short, single screen) the notice and the
  field were both visible at once, so the disconnect was never noticed; in production the form
  grew several sections and the field dropped below the fold.

## Element / selector carrying the issue
The governed control: `#dob-day` / `#dob-month` / `#dob-year` inside
`.date-parts[role="group"][aria-labelledby="dob-label"]` — which has **no** adjacent format
instruction. The instruction that should serve it lives in `.notice[role="note"]` far above,
separated by the name and contact sections.

## Exact accessibility mechanism (what AT experiences / why it fails)
- A **sighted** user who scrolls to "Date of birth" sees Day / Month / Year boxes with no
  indication that month is two digits, year is four, and the order is day-first. The governing
  notice scrolled off-screen sections ago; nothing at the field re-states it. They must scroll
  back up and re-read the top of the form — exactly the "undue navigation" the SC warns against.
- A **screen-reader** user navigating field-by-field (Tab, or form-controls list) lands on the
  date group and hears "Date of birth, group … Day, edit". The `role="note"` is not associated
  with the field via `aria-describedby`, so it is never announced in this context; the format
  guidance is only encountered if the user happens to read the whole page top-to-bottom and
  remembers it many fields later.
- The instruction is therefore present on the page but **not presented to the user for that
  control** at the moment of input.

## Expected ACT-style outcome
**failed** — SC 3.3.2 requires the instruction (a non-customary date format) to be presented to
all users for the control. The instruction is on the page but is orphaned from its field by
reading-order distance, so it is not presented for the Date of birth control at the point of use.

## Why automated tools miss it
The DD/MM/YYYY instruction is non-empty, high-contrast, and inside a `role="note"`; the date
field has a visible `<label>` and a labelled group. Every "instruction text exists?" and
"field has a name?" check therefore passes. axe/WAVE/Lighthouse have no model of the reading-order
or pixel DISTANCE between an instruction and the control it governs, and cannot decide whether a
human reaching the field would still perceive the top-of-page note as that field's instruction.
That is a rendered-layout / point-of-entry perception judgment.

## Citation
- **Reference:** WCAG 2.2 Understanding Labels or Instructions, Intent —
  `wcag-understanding/labels-or-instructions.html`
  > "The goal is to make certain that enough information is provided for the user to accomplish
  > the task without undue confusion or navigation."
- **Reference:** WCAG 2.2 Understanding Labels or Instructions, Intent —
  `wcag-understanding/labels-or-instructions.html`
  > "Instructions or labels may also specify data formats for data entry fields, especially if
  > they are out of the customary formats or if there are specific rules for correct input."
- **Reference:** Trusted Tester 5.1.3, SC 3.3.2 Notes —
  `refs/trusted-tester/sc-3.3.2-labels-or-instructions.md`
  > "The label or instruction must be visible when the form field has focus."
