# case-04 — Hebrew invoice: `<bdo dir="rtl">` misused to force-reverse a backwards-typed invoice number

## Scenario
A Hebrew (RTL) invoice page must display an LTR invoice number as `INV-2024-0731`. Inside the
RTL document the trailing segment of the number sometimes drifted, so the author "fixed the
visual" with the wrong tool: they wrapped the number in `<bdo dir="rtl">`, which **forcibly
reverses the glyph order on screen** but does **not** change the logical/source character
order. To make the forced reversal look correct, they then typed the characters **backwards**
in the source (`1370-4202-VNI`). On screen `<bdo>` reverses that to a perfect `INV-2024-0731`,
but the logical order exposed to AT is the reversed, meaningless string.

## Attribute tuple
- **content-domain:** finance / SMB invoicing (design studio)
- **UI-component / pattern:** invoice metadata field (definition-list-style key/value rows)
- **host-language construct:** `<bdo dir="rtl">` wrapping an LTR identifier whose characters were typed in reverse
- **locale / i18n:** he (Hebrew, `dir="rtl"`) with an embedded LTR alphanumeric identifier
- **failure-mechanism:** G57 inverse case — `<bdo>` (an override that reverses display) misused so the *visual* is fixed by reversing reversed source, scrambling the logical order delivered to AT

## Developer persona
A freelance designer using a self-built invoice template. They had seen `<bdo>` mentioned as
"the bidi element" and assumed it was the right wrapper for any LTR string in an RTL document.
When `<bdo dir="rtl">` flipped the number on screen, they "compensated" by typing the invoice
number backwards in the source so the flip produced the right picture — a classic
cargo-cult fix.

## Element / selector carrying the issue
`.field .v bdo` (the `<bdo dir="rtl">` wrapping the invoice number in the "מספר חשבונית" row).

## Exact accessibility mechanism (what AT experiences, why it fails)
- VERIFIED with a Puppeteer rendering harness:
  - LOGICAL (DOM/source order, what a screen reader / copy-paste / programmatic read returns): `1370-4202-VNI`
  - VISUAL (laid out on screen): `INV-2024-0731`
- A sighted reader sees a perfectly correct invoice number.
- `<bdo>` only overrides the **display** direction; the DOM text node is still
  `1370-4202-VNI`. So a screen reader announces "one-three-seven-zero dash four-two-zero-two
  dash V-N-I," a user copying the field gets the reversed string, and any programmatic
  consumer (search, validation, export) sees garbage.
- Per G57, markup should be used to make the content correct **both** visually and to AT
  (`<bdi>` or `dir` with the digits in proper logical order). Using `<bdo>` to reverse a
  deliberately-reversed source fixes only the visual → fail.

## Expected ACT-style outcome
**failed** (SC 1.3.2 — the programmatically-determined sequence is the reversed, meaningless
character order; the correct reading sequence cannot be programmatically determined).

## Why automated tools miss it
`<bdo dir="rtl">` is perfectly valid, syntactically correct HTML; the page passes every linter
and the visual rendering is flawless. No automated tool flags a `<bdo>` whose contents happen to
be a reversed string, because deciding that the *logical* order is wrong requires reading the
identifier, recognising it is reversed relative to its intended value, and knowing that `<bdo>`
reverses display without reordering the source. axe, WAVE, and Lighthouse make no such judgment.

## Citation
> "The content is both rendered in the correct order visually and exposed to assistive technology in the correct order by using markup to override the bidirectional algorithm."
— wcag-techniques/general/G57.html (Description)

> "Use code to preserve meaningful content order."
— wcag-understanding/meaningful-sequence.html (In brief — What to do)
