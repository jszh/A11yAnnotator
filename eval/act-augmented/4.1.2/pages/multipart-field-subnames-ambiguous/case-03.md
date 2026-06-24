# case-03 — Segmented 16-digit card number, all four groups named "Card number"

## Scenario
A SaaS billing page ("Lumen Studio") collects a payment-card number as **four ordered
four-digit boxes** rendered "4242 ·· 4242 ·· 4242 ·· 4242". Every box carries
`aria-label="Card number"`. Each part has a non-empty accessible name, so the ACT
non-emptiness rule passes on all four. But the four identical "Card number" names do not say
which segment a box is (first group, second, third, or last four). A sighted user reads it
from position and the spacing gaps; a screen-reader user hears "Card number" four times.

## Attribute tuple
- **content-domain:** SaaS / subscription billing ("add a payment method")
- **UI-component / pattern:** segmented four-box card-number input in a `<div role="group">` (component-library style, not `<fieldset>`)
- **host-language construct:** four `<input>` each with `aria-label="Card number"`; spacers in `<span class="sep" aria-hidden="true">`
- **locale / i18n:** en-US
- **failure-mechanism:** same generic name on every ordered segment of one value; "which segment" is positional/visual only (F86 semantic variant)

## Developer persona
A React developer built a `<SegmentedCardInput>` component that renders four `<input>`s with
auto-advance between boxes. They gave the component one `label` prop ("Card number") and
spread it as `aria-label` onto every rendered input so each box would have an accessible
name and pass the team's jest-axe test. They never distinguished the segments because, to the
developer, "they're all the card number" — missing that an AT user who jumps to one box to fix
a typo can no longer tell which of the four they are in.

## Element / selector carrying the issue
- Four controls: `.CardNumber > input.Input[aria-label="Card number"]` (each `value="4242"`,
  `maxlength="4"`).
- The only "which segment" cue is the visual order plus the `.sep` spacer spans, all
  `aria-hidden="true"`.
- A redundant group caption `#cc-group-label` ("Card number") also names the group, reinforcing
  that the only available token is the generic whole-field name.

## Exact accessibility mechanism (what AT experiences)
Sequentially, a screen-reader user hears "Card number group. Card number, edit, 4242" four
times with no positional distinction. The real failure shows when navigation is non-linear:
using a screen reader's form-controls list, or arrowing back to correct a mistyped digit, the
user lands on a single box announced only as "Card number" and cannot tell whether it is the
first group or the last four — information a sighted user gets instantly from position and the
gaps. Auto-advance compounds it: when focus jumps to the next "Card number" box mid-entry, the
user gets no signal that they have moved to a new segment. The segment role is conveyed purely
visually; the accessible names are present but interchangeable.

## Expected ACT-style outcome
**failed** — SC 4.1.2 (F86). Per-rule: ACT rule **e086e5** returns *passed* for each of the
four inputs (each `aria-label` is the non-empty "Card number"), so automation sees four named
fields and reports nothing.

## Why automated tools miss it
e086e5 only checks each field's name is non-empty; "Card number" is non-empty on every box, so
all four pass. A tool would need to infer that the four boxes are *ordered segments of one
value*, that AT users navigate to them out of order, and that identical names therefore lose
the positional "which segment" information — none of which a per-field emptiness check, or any
static rule, can determine. (This case deliberately sits at the boundary: a defensible fix
uses positional names like "Card number, digits 1–4", which only a human reasoning about the
compound semantics would prescribe.)

## Citation
**Reference:** WCAG Technique F86 — *Failure of Success Criterion 4.1.2 due to not providing
names for each part of a multi-part form field* (`wcag-techniques/failures/F86.html`),
procedure:

> "For each subfield in the multi-part form field: Check that there is a programmatically
> determined name for the field."

(F86's per-subfield naming requirement is about each part carrying a name that identifies *that
part*; four identical "Card number" names do not satisfy the spirit of distinguishing the
subfields, even though each string is non-empty.)

**Supporting reference:** Understanding SC 4.1.2 — *Name, Role, Value*
(`wcag-understanding/name-role-value.html`):

> "The intent of this success criterion is to ensure that Assistive Technologies (AT) can
> gather appropriate information about, activate (or set) and keep up to date on the status of
> user interface controls in the content."
