# case-03 — "Required fields are red": required cue conveyed only by red label color + a one-time prose note

## Scenario
An auto-insurance quote wizard ("Driver details") states once at the top, in a styled note, "Fields shown in red are required to generate your quote." The required fields (first name, last name, date of birth, driver's license number) have their `<label>` text colored red via a `.required` CSS class. Optional fields (middle name, years with prior insurer) are black. There is no `*`, no "(required)" token, no `required` attribute, and no `aria-required` anywhere — the mandatory status is carried purely by color plus an unassociated sentence.

## Attribute tuple
- **content-domain:** insurance quote wizard
- **UI-component / pattern:** mixed required/optional text-input form
- **host-language construct:** `<label for>` (correct) + a CSS class that recolors required labels; a standalone `<p class="req-note">`
- **locale / i18n:** en-US, LTR
- **failure-mechanism:** required-field cue conveyed only by red color and a global prose note; not programmatically tied to the field (no `aria-required`, no in-label text token)

## Developer persona
A designer-led team built the form to a brand spec that said "use our red (#c0182b) to flag required fields, keep labels clean — no asterisks." A developer implemented exactly that with a `.required` class, added the explanatory note, ran Lighthouse and axe (both green because every input is labelled), and considered it done. The notion that "required" must also be exposed programmatically never came up.

## Element / selector carrying the issue
`label.required` (four labels) + their inputs `#first`, `#last`, `#dob`, `#license` — required state shown by red text only; the governing instruction is `p.req-note`, associated to nothing.

## Exact accessibility mechanism (what AT experiences, why it fails)
- Every input has a valid accessible name from `<label for>` — e086e5 passes.
- A screen-reader user hears "Legal first name, edit text" with NO indication it is required; the red color is not exposed to AT and the "Fields shown in red are required" note is a free-floating paragraph with no `aria-describedby` linking it to any field.
- A user who cannot perceive red (color-blind, monochrome braille, forced-colors mode) cannot tell required from optional fields at all — required and optional labels are textually identical except for color.
- TT 5.C requires the combination of name + description + programmatic associations to include all relevant instructions and cues, "including when fields are required." Here that cue is conveyed visually and never programmatically, so it fails.

## Expected ACT-style outcome
**failed** (SC 1.3.1 — the required-field cue, shown only by color and an unassociated note, is not programmatically determinable per field).

## Why automated tools miss it
There is no automated rule asserting that a field a page visually marks as required must expose `aria-required` or `required` — a scanner cannot know which fields the author intends as mandatory, because that intent lives in a prose sentence and a color. e086e5 passes (all fields named). The color-only overlap is conceptually a 1.4.1 Use-of-Color concern, which Understanding 1.3.1 explicitly carves OUT of this SC, so even a color-contrast or use-of-color heuristic would not surface the missing programmatic required association. Determining that "red label" means "required", that the top note governs those specific fields, and that the cue never reaches AT, requires reading the note, mapping it to the red labels, and judging the programmatic gap — human contextual reasoning.

## Citation
> "ANDI Output includes all relevant instructions and cues for the form element, including when fields are required"
— refs/trusted-tester/sc-1.3.1-info-and-relationships.md (Test 5.C, Evaluate Results #1)

> "Some technologies do not provide a means to programmatically determine some types of information and relationships. In that case then there should be a text description of the information and relationships. For instance, \"all required fields are marked with an asterisk (*)\". The text description should be near the information it is describing (when the page is linearized), such as in the parent element or in the adjacent element."
— wcag-understanding/info-and-relationships.html (Intent)
