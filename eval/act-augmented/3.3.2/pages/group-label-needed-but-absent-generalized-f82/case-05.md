# case-05 — Two identical attendee blocks whose "Attendee 1/2" group label is real text but is not bound to the field group

## Scenario
A conference checkout ("Register attendees" for DevNorth 2026) where the buyer entered two
passes and must now fill in each attendee. Each attendee's details sit in a visually distinct
card with a purple title bar reading "Attendee 1" / "Attendee 2". The two cards are
structurally identical, with byte-for-byte the same inner native labels: "Full name", "Email
for the ticket", "T-shirt size". The "Attendee 1" / "Attendee 2" titles ARE real text in the
DOM (a styled `<div class="ticket-bar">`, NOT CSS-generated content) — but each title is a
free-floating decorative element: it is not a `<legend>` of a `<fieldset>`, not a heading
inside the group, and is not referenced by the `<section>` or any control via
`aria-labelledby`/`aria-describedby`. So the disambiguating group label is present on screen
and present in the AX tree as StaticText, yet it is not the accessible name of any field and
not the accessible name of either group.

## Attribute tuple + developer persona
- **content-domain:** event / conference ticketing (multi-attendee registration)
- **UI-component/pattern:** repeated attendee cards with a styled "title bar" header
- **host-language construct:** native `<input>`/`<select>` + `<label for>` inside `<section>`
  cards; the group title is a plain `<div class="ticket-bar">Attendee N</div>` — no
  `<fieldset>`/`<legend>`, no heading, no `role=group`, no `aria-labelledby`
- **locale/i18n:** en-US
- **failure-mechanism:** the group label that disambiguates two identical blocks ("Attendee 1"
  vs "Attendee 2") is real visible/DOM text, but it is orphaned chrome — not programmatically
  the name of the field group and not part of any field's accessible name, so it is not
  presented as a label to AT users in the way they fill the form (control-by-control / forms
  mode)
- **persona:** A front-end developer built the card with a generic "section header" `<div>`
  styled as a banner (the design system's `.ticket-bar`). It looks like a section title, so it
  felt like one; they never wired it to the fields with a `<legend>` or `aria-labelledby`.
  They tested by tabbing through, saw every field had a `<label>`, ran axe (0 violations on
  the label rules), and shipped. They never listened with a screen reader in forms mode, where
  the banner text is not announced alongside the fields it visually heads.

## Element / selector carrying the issue
`section.ticket > .ticket-bar` — the two title `<div>`s containing real text "Attendee 1" /
"Attendee 2". Neither `<section>` has a `role`, `aria-label`, or `aria-labelledby`; there is
no `<fieldset>`/`<legend>` and no heading. The title text is therefore not the accessible name
of any group and not part of any input's accessible name.

## Exact accessibility mechanism (what AT experiences / why it fails)
Verified empirically with Chromium's accessibility tree (CDP `Accessibility.getFullAXTree`
and `getPartialAXTree`):
- The "Attendee 1" / "Attendee 2" titles ARE in the AX tree as `StaticText` nodes — this is
  real DOM text, so a screen reader reading in document/browse order WILL encounter them.
- BUT the computed accessible name of every field is just its own `<label>`:
  `#a1-name` and `#a2-name` are both `textbox "Full name"`; `#a1-email`/`#a2-email` are both
  `textbox "Email for the ticket"`; `#a1-shirt`/`#a2-shirt` are both `combobox "T-shirt size"`.
  The "Attendee N" title is NOT part of any field's accessible name.
- Neither `section.ticket` carries an accessible name (no `role`, no `aria-labelledby`, no
  `aria-label`), so the title is not the name of any group/region either.
- Consequence: when an AT user fills the form **control-by-control in forms/focus mode** (the
  usual way NVDA/JAWS/VoiceOver enter and complete forms), they move input→input and hear
  "Full name, edit … Email for the ticket, edit … Full name, edit …" with no "Attendee 1 /
  Attendee 2" boundary announced as they reach each group. The disambiguator the sighted user
  reads in the purple bar does not travel with the fields. Two byte-identical groups with no
  bound group label means the user cannot reliably tell which attendee a field belongs to and
  could enter both people into one card.
- This is F82's rationale generalized: the per-field labels are insufficient standalone, a
  group description is required (H71's "additional heading" rule of thumb), and here that
  description is supplied only as decorative chrome — present as text, but not provided as an
  actual label/legend/heading bound to the group, so it is not presented to all users as a
  label in the manner they consume the form.

## Expected ACT-style outcome
**failed** — the group label needed to tell the two identical attendee blocks apart is present
only as orphaned decorative text (a styled `<div>` that is neither a `<legend>`, a heading,
nor an `aria-labelledby` target). It is not a real label presented to all users in the way
they fill the form; an AT user navigating control-by-control gets no attendee disambiguation.

## Why automated tools miss it
Every input/select has an associated visible `<label>`, so axe/WAVE/Lighthouse pass the label
rules (verified: axe-core reports 0 violations; `label`, `label-title-only`, and
`form-field-multiple-labels` all pass). The form has an `aria-label`, and the "Attendee 1/2"
titles are real on-screen text, so contrast and text-presence checks see them too. Tools do
not reason that two byte-identical blocks NEED a group label that is programmatically bound to
the group, and they do not model forms-mode (control-by-control) navigation, where the visible
banner never reaches the user alongside the fields. Recognizing that the visible "Attendee
1/2" bar is doing labeling work it is not structurally wired to deliver is a
visual-vs-accessibility judgment a human must make.

## Citation
- **Reference:** WCAG 2.2 Understanding Labels or Instructions, Intent —
  `wcag-understanding/labels-or-instructions.html`
  > "It is possible for controls and inputs to have an appropriate accessible name or
  > description (e.g. using `aria-label="..."`) and therefore pass Success Criterion 4.1.2,
  > but to still fail this success criterion (if the labels or instructions aren't presented
  > to all users, not just those using assistive technologies)."
- **Reference:** WCAG Technique H71, Description — `wcag-techniques/html/H71.html`
  > "As a rule of thumb, it can be said that where a group of controls within a larger form
  > requires an additional heading to provide a description specific to that particular
  > group, the use of fieldset and legend elements is appropriate."
