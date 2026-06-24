# case-05 — RTL Arabic transit-refund form: red asterisk intensifies on the bad field, no fix text

## Scenario
A government transit authority's Arabic (RTL) ticket-refund form, re-rendered after the resident
typed a **9-digit** national-ID number when the ID must be **exactly 10 digits and begin with 1 or
2**. The server rejected it and added `class="bad"` to the field, which **darkens and enlarges the
already-present red required asterisk** and gives the input a red border + pink fill. There is **no
Arabic error text, no `aria-invalid`, no hidden text** — the knowable correction ("must be 10
digits and start with 1 or 2") is stated nowhere. The required asterisk has no legend at all, so
even its meaning is colour/symbol-only. The ticket and IBAN fields DO carry Arabic help text;
only the errored field lost its guidance.

## Attribute tuple
- **content-domain:** government / civic transit services portal
- **UI-component/pattern:** server-rendered RTL `<form>` with CSS-generated required asterisks
- **host-language construct:** `::after { content:" *" }` red asterisk that intensifies via `.bad`, plus red field styling; `lang="ar" dir="rtl"`
- **locale/i18n:** Arabic, RTL; locale-specific national-ID format (10 digits, starts with 1/2)
- **failure-mechanism:** detected format error with a knowable correction, signalled only by an asterisk colour/weight shift + red border; no text suggestion; G84 "in text" limb

## Developer persona
An e-government vendor localised an English form template to Arabic. The original template put the
required asterisk in via a CSS `::after` rule and styled invalid fields with a `.bad` class that
darkens the asterisk and reddens the input — no message element involved. The localisation team
translated the labels and help strings but, under deadline, never wrote the per-field error
strings (the resource keys for them shipped empty), so the server renders the `.bad` styling with
no message. Nobody added an asterisk legend ("الحقول المعلَّمة بـ * مطلوبة"), assuming "everyone
knows the red star means required."

## Element / selector carrying the issue
`.field.req.bad` wrapping `input#nid` (value `103847562`). Its intensified red `::after` asterisk
(now `#8e1a0e`, `1.15em`) + 2px red border + pink fill are the sole error indicators; no Arabic
correction text exists. The asterisk has no explanatory legend anywhere on the page.

## Exact accessibility mechanism (what AT experiences, why it fails)
A screen-reader user in Arabic tabs to the field and hears "رقم الهوية الوطنية، تحرير،
103847562" ("National ID number, edit, 103847562"). The required asterisk is injected via CSS
`::after content`, which most screen readers do not announce as part of the accessible name, so
the user does not even reliably learn the field is required — let alone that it errored. The
input is plain `type="text"` with a well-formed value, so `validity.valid` is `true`, the
accessibility tree reports `invalid:false`, and there is no `aria-invalid`. The field announces
identically to a valid one. Even a sighted Arabic reader gets only a slightly darker/bigger red
star and a red box — no statement of the required 10-digit format, although the form already
demonstrates per-field help (ticket, IBAN). The knowable correction is conveyed by colour, weight
and a symbol, which G84 says does not satisfy the SC.

## Expected ACT-style outcome
**failed** — a format error was detected with a knowable correction, but it is signalled only by an
asterisk colour/weight change and colour, with no Arabic text suggestion.

## Why automated tools miss it
- `lang="ar"`, `dir="rtl"`, and `<label for>` on every input are all correct; nothing is empty or
  malformed, so structural/i18n linters pass.
- The field is `type="text"` with a well-formed value, so `validity.valid === true`, the
  accessibility tree shows `invalid:false`, and there is no `aria-invalid`.
- The required marker is a CSS `::after` pseudo-element — outside the DOM that scanners parse — so
  even the asterisk is invisible to a static markup check.
- No tool can read Arabic semantics, know the 10-digit/starts-with-1-or-2 rule, or tell that the
  asterisk colour-shift + red border is the only error carrier. Judging that the missing element
  is the *correction suggestion text* (not mere identification) requires reading the page in
  Arabic and reasoning about the format — human judgment.

## Citation
> **WCAG Technique G84 (Providing a text description when the user provides information that is
> not in the list of allowed values), Description:** "The 'in text' portion of the success
> criterion underscores that it is not sufficient simply to indicate that a field has an error by
> putting an asterisk on its label or turning the label red. A text description of the problem
> should be provided."
>
> Source file: `wcag-techniques/general/G84.html`
