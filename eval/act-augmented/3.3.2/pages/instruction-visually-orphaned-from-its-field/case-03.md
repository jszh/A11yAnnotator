# case-03 — Member ID format hint rendered at 9px in near-background grey

## Scenario
A healthcare patient portal ("Cedar Park Health — Add your insurance"). The **Member ID** field
needs a non-obvious format (3-letter carrier prefix + 9 digits, no spaces). The format
instruction is present in the DOM, complete and accurate, sits *directly beneath* the field, and
is wired with `aria-describedby`. But it is styled `font-size:9px; color:#cdd4da` on a white card
(~1.3:1) — far below readable size and contrast. A sighted user does not perceive it as the
field's instruction; effectively the field has no usable format guidance, even though the text is
spatially adjacent. The adjacent Group number field, by contrast, has a normal-sized, readable
hint, which makes the orphaning of the Member ID hint a styling defect rather than a missing node.

## Attribute tuple + developer persona
- **content-domain:** healthcare / patient portal (insurance intake)
- **UI-component/pattern:** stacked labelled text inputs with per-field helper text
- **host-language construct:** `<span class="microhint" id="member-hint">` + `aria-describedby`
- **locale/i18n:** en-US
- **failure-mechanism:** instruction is present and adjacent but rendered too small / too
  low-contrast to be read as the field's instruction (orphaned by sub-legible styling)
- **persona:** A designer created a `.microhint` token for "fine print we have to include but
  don't want to draw attention to" (the legal disclaimer) and set it to 9px in a pale grey from
  the muted end of the palette. A developer, told to "add the member-ID format as a hint, keep it
  subtle," reused `.microhint` instead of the readable `.normalhint` used elsewhere. It looked
  fine zoomed in on a 4K design tool; at 100% on a real card the text is unreadable. Everyone
  treated "the text is there and aria-describedby is set" as done.

## Element / selector carrying the issue
`#member-hint` (`.microhint`) — the Member ID format instruction, rendered at 9px in `#cdd4da` on
`#fff`, immediately beneath `#member`. The text exists and is associated, but is not perceivable
as the field's instruction by a typical sighted user.

## Exact accessibility mechanism (what AT experiences / why it fails)
- A **sighted** user reading the form sees the Member ID label and input with what looks like an
  empty gap below it (the 9px pale-grey line reads as a faint texture, not text). They get no
  format guidance and are likely to enter the ID with spaces or omit the prefix — the very error
  the instruction was meant to prevent. The instruction is present in source but not *presented*.
- A **screen-reader** user is served the text via `aria-describedby`, again showing the SC's
  point that reaching AT users is not sufficient: 3.3.2 requires the instruction be presented to
  all users, and the sighted population cannot read it.
- The neighboring Group number hint (`.normalhint`, readable) proves the page *can* present hints
  legibly; the Member ID hint is specifically orphaned by its sub-legible styling.

## Expected ACT-style outcome
**failed** — the required-format instruction exists and is adjacent but is rendered too small and
too low-contrast to be perceived as the field's instruction by sighted users, so it is not
presented to all users as 3.3.2 requires.

## Why automated tools miss it
The instruction is a complete sentence present in the DOM and associated via `aria-describedby`,
so "instruction exists / is associated" passes. The failure is visual and semantic: a human must
read the (technically present) text, judge that at 9px/1.3:1 it is not legible, and conclude that
the field's *required-format instruction* is therefore not presented. A contrast scanner might or
might not emit a generic low-contrast note (1.4.3 has size carve-outs and tools key on computed
style, not meaning), but it cannot infer that the unreadable text is the field's instruction and
that 3.3.2 is consequently failed. That inference is the human judgment.

## Citation
- **Reference:** WCAG 2.2 Understanding Labels or Instructions, Intent —
  `wcag-understanding/labels-or-instructions.html`
  > "It is possible for controls and inputs to have an appropriate accessible name or description
  > (e.g. using `aria-label=\"...\"`) and therefore pass Success Criterion 4.1.2, but to still fail
  > this success criterion (if the labels or instructions aren't presented to all users, not just
  > those using assistive technologies)."
- **Reference:** WCAG 2.2 Understanding Labels or Instructions, Benefits —
  `wcag-understanding/labels-or-instructions.html`
  > "Providing labels and instructions (including examples of expected data formats) helps all
  > users — but particularly those with cognitive, language, and learning disabilities — to enter
  > information correctly."
- **Reference:** Trusted Tester 5.1.3, SC 3.3.2 — How to Test —
  `refs/trusted-tester/sc-3.3.2-labels-or-instructions.md`
  > "Determine if each form element provides visual labels or instructions."
