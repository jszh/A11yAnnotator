# case-01 — Checkout collects billing AND shipping as two identical address blocks with no group heading

## Scenario
An e-commerce checkout (Maple & Birch Home Goods), the "Addresses" step. Two address sets
sit side by side in a two-column grid. The LEFT block is the billing address (its inputs
are named `b_name`, `b_street`, `b_city`, `b_state`, `b_zip`); the RIGHT block is the
shipping address (`s_*`). Every field is a native input with a correctly associated
`<label>` — "Full name", "Street address", "City", "State", "ZIP" — but those labels are
IDENTICAL across the two blocks, and there is no visible "Billing" / "Shipping" heading,
legend, or any text anywhere telling the user which block is which. The only thing
distinguishing them is left-vs-right position.

## Attribute tuple + developer persona
- **content-domain:** e-commerce checkout
- **UI-component/pattern:** two parallel address forms in a CSS grid (billing + shipping)
- **host-language construct:** `<section>` columns with native `<input>` + `<label for>`
- **locale/i18n:** en-US
- **failure-mechanism:** a group-level description ("Billing" vs "Shipping") is REQUIRED to
  disambiguate two structurally identical sets, but is conveyed only by column position —
  no legend, no heading, no text
- **persona:** A junior developer building a custom React checkout deleted the two `<h3>`
  headings during a "tighten the spacing" design pass because the mock showed the columns
  visually close together and the headings "looked redundant next to the obvious left/right
  layout." They tested by tabbing through and saw every field had a label, so the linter
  was green and they shipped. They never used a screen reader, where the left/right cue
  vanishes entirely.

## Element / selector carrying the issue
`form .grid > section.addr` — the two address `<section>` blocks. Neither carries any
group-level accessible name (no `<legend>`, no `aria-labelledby`, no preceding heading).
The first input of each is `#a1-name` (billing) and `#a2-name` (shipping).

## Exact accessibility mechanism (what AT experiences / why it fails)
- Each input individually passes name/role checks: e.g. `#a1-street` is named "Street
  address" via its `<label for>`. So 4.1.2 and the missing-label heuristic are satisfied.
- But "Street address" read alone does not say WHOSE address — billing or shipping. The set
  of five fields needs a group description, and per H71 that is exactly the case where "an
  additional heading to provide a description specific to that particular group" is needed.
- A screen-reader / Braille user reading linearly hears: "Full name … Street address … City
  … State … ZIP … Full name … Street address … City … State … ZIP" — two identical groups,
  no description for either. They cannot tell which address they are filling.
- A sighted user gets only column position, and even that is uninformative: there is no
  "Billing" / "Shipping" label on either column, so left-vs-right is meaningless.
- Result: labels/instructions sufficient for users to know what input is expected are NOT
  provided for these groups — SC 3.3.2 fails (F82 generalized beyond phone numbers).

## Expected ACT-style outcome
**failed** — the page requires a group-level label to identify which address each set
collects; that label is absent (present only as visual column position), so users do not
know what information to enter into which block.

## Why automated tools miss it
Every input has a programmatically associated, non-empty, visible `<label>`, so axe/WAVE/
Lighthouse report "form elements have labels" and pass. No fieldset is required by any rule
(H71 itself says a visible heading can suffice), and the presence/absence of a legend is
neither necessary nor a reliable signal — two fully-labeled address blocks pass every
linter while being genuinely ambiguous. Detecting the fault requires (a) recognizing the
page collects two DIFFERENT addresses, (b) judging that "Street/City/ZIP" alone is
insufficient to say which, and (c) confirming no group description exists in text — a
semantic + visual-context judgment no scanner performs.

## Citation
- **Reference:** WCAG Technique H71 (Providing a description for groups of form controls
  using fieldset and legend elements), Description — `wcag-techniques/html/H71.html`
  > "For instance, several fields that collect a user's address might be grouped together
  > with a `legend` of "Address", thus providing a group level description for these
  > controls. As a rule of thumb, it can be said that where a group of controls within a
  > larger form requires an additional heading to provide a description specific to that
  > particular group, the use of fieldset and legend elements is appropriate."
- **Reference:** WCAG 2.2 Understanding Labels or Instructions, Intent —
  `wcag-understanding/labels-or-instructions.html`
  > "The intent of this success criterion is to have content authors present instructions
  > or labels that identify the controls in a form so that users know what input data is
  > expected."
