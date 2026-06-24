# case-04 — Joint loan application: Applicant fully tabbed before Co-applicant (G59 PASS mirror)

## Scenario
"Meridian Credit Union" joint personal-loan application. Two side-by-side boxed sections
under headings — **Applicant** (left) and **Co-applicant** (right) — each with the same four
fields in the same order: Full name, Date of birth, Annual income, Employer. Visually it is
near-identical to the *failing* interleaved cases in this aspect (two grouped cards, four
matching fields each). The decisive difference is the **focus order**: each section is a
real `<fieldset>` that contains its own four fields in source order, so the DOM keeps each
group whole and the tab order is applicant-name → applicant-dob → applicant-income →
applicant-employer → co-name → co-dob → co-income → co-employer. Focus completes the entire
Applicant group before entering the Co-applicant group. This is the G59 sufficient technique
and it **passes** SC 2.4.3.

## Attribute tuple
- **content-domain:** online banking / credit-union lending
- **UI-component / pattern:** two side-by-side applicant `<fieldset>` groups (same visual
  signature as the failing dual-section cases)
- **host-language construct:** two real `<fieldset>`/`<legend>` blocks, each containing its
  fields in order; natural DOM order keeps each group contiguous; no `tabindex`
- **locale / i18n:** en-US, USD
- **failure-mechanism:** NONE — this is the passing counter-example (G59); group-complete
  focus order across the section boundary

## Developer persona
A backend-leaning developer built the joint form the obvious way: one `<fieldset>` for the
applicant with all its inputs, then a second `<fieldset>` for the co-applicant with all of
its inputs, and let CSS grid place the two fieldsets side by side. Because each fieldset is
self-contained, the natural source order already follows the content relationships, so the
keyboard order is correct without any thought about `tabindex`. This is what "doing it
plainly" yields — and it is exactly right.

## Element / selector carrying the issue
No issue. The relevant structure is the two `<fieldset>` elements (`legend` "Applicant" and
"Co-applicant"). Primary selector to inspect: `#c-name` — the first co-applicant field,
which correctly receives focus **only after** the last applicant field (`#a-employer`), not
interleaved among the applicant fields.

## Exact accessibility mechanism (what AT experiences, why it passes)
- **Sighted mouse user:** fills the left card, then the right card. Fine.
- **Keyboard / screen-reader user:** Tab moves a-name → a-dob → a-income → a-employer (the
  entire Applicant group, top to bottom), then c-name → c-dob → c-income → c-employer (the
  entire Co-applicant group). The user completes one person's details as a coherent block
  before moving to the next person — the mental model "I'm entering the primary applicant"
  is preserved for the whole group, then cleanly handed off. Focus does not follow the
  visual left-then-right column order field-by-field; it follows the *meaningful* order
  (one applicant, then the other), which the Understanding doc explicitly allows.
- **Verified with Puppeteer** (real Tab key presses): the focused element's x-coordinate is
  `95, 95, 95, 95` (all four applicant fields, left column) then `536, 536, 536, 536` (all
  four co-applicant fields, right column) — no zig-zag; each group is completed before the
  next.

## Expected ACT-style outcome
**passed** (SC 2.4.3 — focus order follows the sequences and relationships in the content
per G59; each applicant group is navigated as a whole, preserving meaning).

## Why automated tools miss it
Automated tools also report "no violation" here — but for the *wrong* reason: they cannot
distinguish this passing page from the failing interleaved pages, because both have valid
labels, valid names, no `tabindex`, and two grouped sections. A tool sees the same clean
markup in both. Only a human (or a model reasoning about content) can confirm that *here*
the focus order keeps each applicant whole, whereas in the failing cases it crosses the
group boundary mid-sequence. Including this PASS proves the discriminator must be the
focus-order-vs-meaning judgment, not mere "two groups exist" detection.

## Citation
> "A form contains two, side-by-side sections of information. One section contains
> information about an applicant; the other section contains information about the
> applicant's spouse. All the interactive elements in the applicant section receive focus
> before any of the elements in the spouse section. The elements in each section receive
> focus in the reading order of that section."
— wcag-techniques/general/G59.html (Examples)

> "Focus order does not necessarily need to follow the visual layout of the web page, as
> long as the order in which elements receive focus is logical, and the hierarchy and
> relationship of content implied by the visual presentation is preserved."
— wcag-understanding/focus-order.html (Intent of Focus Order)
