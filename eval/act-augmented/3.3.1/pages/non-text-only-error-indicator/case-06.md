# case-06 — Expense line flagged only by a yellow-highlighted fieldset; descriptive text omitted

## Scenario
A corporate intranet expense-claim editor. One claim line ("Line 2 — Meals", a £139 dinner)
breaches the company's £75 per-meal cap. The in-house validator flagged it using the company's
documented convention — "sections needing attention are highlighted in yellow" — by adding
`class="attention"` to that whole `<fieldset>` (a `#fff7d6` yellow background + yellow border).
But the descriptive text that should accompany the highlight (e.g. "Meal exceeds the £75 cap")
was never rendered. The legend stays the plain "Line 2 — Meals"; there is no message, no hidden
text, no `aria` state. The yellow fieldset is the only error indicator.

## Attribute tuple
- **content-domain:** enterprise / finance back-office (expense reimbursement)
- **UI-component/pattern:** repeating `<fieldset>` line-item editor
- **host-language construct:** `<fieldset class="attention">` with a yellow `background-color`
- **locale/i18n:** en-GB (GBP, UK date format)
- **failure-mechanism:** error conveyed by a background highlight on a container, with the
  intended accompanying description omitted

## Developer persona
An internal-tools developer implemented the validation rules and the firm's house style of
"highlight the problem section in yellow." He built the highlight class first and left a TODO to
inject the per-rule explanation text — then shipped before doing so, because the highlight
"already shows which line is wrong." The omitted description means the yellow box now carries the
entire error meaning by itself.

## Element / selector carrying the issue
`fieldset.attention` wrapping Line 2 (the £139 meal). Its yellow background is the sole indicator
that this line is in error.

## Exact accessibility mechanism (what AT experiences, why it fails)
A screen-reader user reads Line 2 exactly like the valid lines: "Line 2 Meals, Date, edit,
03/06/2026, Amount GBP, edit, 139.00, Category, Meals dinner." The fieldset's
`background-color` is never announced and is not part of any accessible name; there is no message
text, no `aria-invalid`, no hidden description. So a non-visual reviewer has no way to know that
Line 2 breached the cap or that the claim cannot be submitted as-is, whereas a sighted reviewer
sees the yellow block immediately. The error meaning is conveyed by a background colour alone,
never in text.

## Why this is the WCAG "highlight in yellow" example gone wrong
WCAG's own Understanding text offers yellow highlighting as a *good* multi-cue example — but
explicitly *in addition to* a text description. This page keeps the yellow and drops the text,
inverting the example into a failure: the permitted supplementary cue has become the sole cue.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
The markup is exemplary — real `<fieldset>`/`<legend>` per line, every control labelled, good
contrast on the yellow. A background colour on a container is never treated as an error indicator
by axe/WAVE/Lighthouse; there is nothing structurally wrong to flag. No tool reads the amounts,
applies the £75 business rule, notices the yellow fieldset, and infers "this encodes a cap breach
stated nowhere in text." ACT 36b590 finds no error text and does not fire. Recognising the yellow
block as the lone error signal, and confirming the explanation is absent from text, is a
rendered-visual + domain-semantic judgment beyond automation.

## Citation
> **WCAG 2.2 Understanding 3.3.1 — Examples, "Providing multiple cues":** "In addition to
> describing the error and providing a unique character to make it easy to search for the fields,
> the fields are highlighted in yellow to make it easier to visually search for them as well."

(Verbatim from `wcag-understanding/error-identification.html`. Yellow highlighting is sanctioned
only *in addition to describing the error*; this page highlights in yellow but omits the
description, leaving the highlight as the sole cue.)

> **WCAG 2.2 Understanding 3.3.1 — Examples note:** "It simply requires that errors also be
> identified using text."

(Verbatim from `wcag-understanding/error-identification.html`. The yellow highlight is not a text
identification of the error, so the page fails this requirement.)
