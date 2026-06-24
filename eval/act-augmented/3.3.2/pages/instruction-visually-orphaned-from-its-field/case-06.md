# case-06 — PASS boundary: date-format instruction inline immediately beneath its field

## Scenario
An events / community-ticketing form (Harborfront Film Festival, "Reserve your screening pass").
The **Screening date** field uses the same kind of non-customary date format (`DD-MMM-YYYY`, e.g.
14-SEP-2026) that the failing cases in this aspect orphan — but here the instruction is rendered
as normal-sized, high-contrast text **immediately beneath the field**, visible to all users at the
point of entry, and additionally associated via `aria-describedby`. A sighted user unambiguously
binds the instruction to this control; nothing is distant, collapsed, sub-legible, post-action, or
in the wrong column. This is the contrast case that sharpens the aspect: the instruction is present
AND perceivably presented as the field's instruction.

## Attribute tuple + developer persona
- **content-domain:** events / ticketing (community film festival)
- **UI-component/pattern:** single-column form with inline per-field hint directly under the input
- **host-language construct:** `<p class="hint" id="date-hint">` directly after the input +
  `aria-describedby="date-hint"` and a matching `placeholder`
- **locale/i18n:** en-US; non-customary DD-MMM-YYYY format (so an instruction is genuinely needed)
- **failure-mechanism:** none — correct, perceivably-bound instruction (boundary PASS)
- **persona:** A developer following the WCAG example "a field for entering a date has text
  instructions to indicate the correct format for the date." They placed the format text on its
  own line right under the field, kept it at body-adjacent size and full contrast, and wired
  `aria-describedby` so AT users hear it on focus — exactly the adjacent, presented-to-all pattern
  the technique intends.

## Element / selector carrying the issue
None failing. `#date-hint` is the inline format instruction for `#show-date`, rendered immediately
beneath it, readable, visible to all users, and associated via `aria-describedby`.

## Exact accessibility mechanism (what AT experiences / why it passes)
- A **sighted** user reaching the Screening date field sees, right below it, "Use the format
  DD-MMM-YYYY … for example, 14-SEP-2026." The instruction is adjacent and legible, so it is
  perceivably the field's instruction at the moment of entry; no scrolling, expanding, or guessing.
- A **screen-reader** user focusing the field hears the name plus the described-by hint, so the
  format is announced in context.
- The instruction is both present and presented as this field's instruction to all users — the
  exact condition SC 3.3.2 requires. No orphaning mechanism is present.

## Expected ACT-style outcome
**passed** — labels/instructions for the field are provided and are presented to all users, with
the format instruction adjacent, legible, and bound to the control at the point of entry.

## Why automated tools miss it
Automated tools would also "pass" this page, but for the shallow reason that instruction text
exists — they cannot distinguish this genuinely-bound instruction from the orphaned ones in
case-01..05, where the same kind of text exists but is not perceivably presented. This page is
included so the aspect is evaluated on *perceivable binding to the control*, not on the mere
presence of instruction text, which is the only thing scanners check.

## Citation
- **Reference:** WCAG 2.2 Understanding Labels or Instructions, Examples —
  `wcag-understanding/labels-or-instructions.html`
  > "A field for entering a date has text instructions to indicate the correct format for the date."
- **Reference:** WCAG 2.2 Understanding Labels or Instructions, Intent —
  `wcag-understanding/labels-or-instructions.html`
  > "Instructions or labels may also specify data formats for data entry fields, especially if they
  > are out of the customary formats or if there are specific rules for correct input."
- **Reference:** Trusted Tester 5.1.3, SC 3.3.2 — Evaluate Results (PASS if) —
  `refs/trusted-tester/sc-3.3.2-labels-or-instructions.md`
  > "Visual labels or instructions are provided for each form element."
