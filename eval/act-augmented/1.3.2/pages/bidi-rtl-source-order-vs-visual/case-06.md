# case-06 — PASS (boundary trap): Arabic flight confirmation with embedded LTR runs isolated by `<bdi>`

## Scenario
An Arabic (RTL) flight-booking confirmation mixes RTL Arabic with several embedded LTR runs —
a flight code (`EK 0231`), a price (`$50.00`), a seat (`14C`), and a management URL
(`fly-emirates.example/manage`). It is the **same class of mixed-direction content** as the
failing cases, but done correctly: the logical/source character order is the natural,
meaningful order, and the visual order is achieved with **markup that overrides the bidi
algorithm** — each LTR run is wrapped in `<bdi>` — rather than by relocating characters in the
source. The result is correct **both** visually and to assistive technology.

## Attribute tuple
- **content-domain:** travel / airline booking confirmation
- **UI-component / pattern:** e-ticket / confirmation summary (sentence + key/value rows)
- **host-language construct:** RTL paragraphs with embedded LTR runs each isolated by `<bdi>`, logical order intact
- **locale / i18n:** ar (Arabic, `dir="rtl"`) with embedded LTR code, price, seat, and URL
- **failure-mechanism:** none — correct G57-conformant bidi handling (markup override, not source reordering)

## Developer persona
An airline front-end team that internationalised properly: their i18n lint rule requires every
embedded LTR datum (codes, prices, URLs) in an RTL string to be wrapped in `<bdi>`, and code
review rejects any string where the source order does not match the read-aloud order. This page
is what their pipeline produces.

## Element / selector carrying the issue
`p.line` (the confirmation sentence) and the `.field .v` rows — all using `<bdi>` correctly.
No element carries a defect; this is the negative control.

## Exact accessibility mechanism (what AT experiences, why it passes)
- VERIFIED with a Puppeteer rendering harness:
  - LOGICAL (DOM/source order, what a screen reader reads): `رحلتك رقم EK 0231 من دبي إلى عمّان أُكِّدت، وإجمالي المبلغ المدفوع هو $50.00.`
  - VISUAL (laid out on screen): renders `EK 0231`, `$50.00`, and the URL each in correct,
    contiguous order, matching the logical order.
- A sighted Arabic reader sees a correct confirmation; a screen reader reads exactly the same
  meaningful sequence (flight EK 0231 … total $50.00 …). No characters were relocated; `<bdi>`
  isolates each LTR run so the bidi algorithm positions it correctly without scrambling source.
- This page exists so the annotator does **not** reflexively flag every RTL+LTR mix: correct
  bidi markup with intact logical order satisfies SC 1.3.2.

## Expected ACT-style outcome
**passed** (SC 1.3.2 — the visual order is achieved via markup that overrides the bidi
algorithm; the logical/source order matches the meaningful order, so a correct reading sequence
can be programmatically determined).

## Why automated tools miss it
Symmetry note: just as automated tools cannot detect the failing reordered cases, they also
cannot *confirm* this page is correct — they have no model of the intended meaning to compare
against. A naive heuristic that flagged "RTL text containing LTR runs" or "uses `<bdo>`/`<bdi>`"
would false-positive here. Only a human reading both scripts can confirm the logical order
matches the meaningful order. This case guards against over-flagging.

## Citation
> "The content is both rendered in the correct order visually and exposed to assistive technology in the correct order by using markup to override the bidirectional algorithm."
— wcag-techniques/general/G57.html (Description)

> "Providing a particular linear order is only required where it affects meaning."
— wcag-understanding/meaningful-sequence.html (Intent of Meaningful Sequence — For clarity)
