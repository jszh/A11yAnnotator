# case-02 — Hebrew stock notice: sentence period physically moved before an embedded English clause

## Scenario
A Hebrew (RTL) spice-shop product page shows an out-of-stock notice that embeds an English
status badge from the supplier feed. The intended sentence reads, visually,
`פריט זה אזל מהמלאי DUE TO HIGH DEMAND today.` ("This item is out of stock DUE TO HIGH DEMAND
today."). In natural source order the bidi algorithm rendered the final sentence period
floating to the far-left edge, visually detached from the English word "today" — which looked
wrong. Instead of isolating the English clause with `<bdi>`/`dir`, the author "fixed the
visual" by physically moving the period to the **front** of the English run in the source
(`… מהמלאי .DUE TO HIGH DEMAND today`). The bidi algorithm then mirrors it so on screen the
period sits correctly after "today.".

## Attribute tuple
- **content-domain:** e-commerce / specialty grocery (spice shop)
- **UI-component / pattern:** out-of-stock / availability notice banner
- **host-language construct:** RTL paragraph with an embedded all-caps English clause + sentence period, NO `<bdi>`
- **locale / i18n:** he (Hebrew, `dir="rtl"`) with an embedded LTR English clause
- **failure-mechanism:** G57 source-character reordering — the sentence-ending period relocated in the content stream so the bidi algorithm places it correctly, exposing the wrong logical order

## Developer persona
A junior developer wired the storefront to a supplier inventory API that returns English status
strings ("DUE TO HIGH DEMAND"). They concatenated the English clause into the Hebrew template,
noticed the trailing period jumped to the wrong side, and "fixed" it by retyping the period
just before "DUE" until the preview looked right — a one-character edit that quietly broke the
logical order.

## Element / selector carrying the issue
`p.notice` (the availability notice line).

## Exact accessibility mechanism (what AT experiences, why it fails)
- VERIFIED with a Puppeteer rendering harness (per-character client-rect sort):
  - LOGICAL (DOM/source order, what a screen reader reads): `פריט זה אזל מהמלאי .DUE TO HIGH DEMAND today`
  - VISUAL (laid out on screen): `פריט זה אזל מהמלאי DUE TO HIGH DEMAND today.`
- A sighted Hebrew reader sees a correct sentence ending in "today.".
- A screen reader reads the **logical** order, so it announces the sentence period **before**
  the English clause ("…out of stock. DUE TO HIGH DEMAND today") — the full stop is spoken in
  the wrong place, breaking the sentence into the wrong segments and detaching the period from
  the clause it terminates.
- Per G57 the fix is markup (`<bdi>` around the English clause, period in logical final
  position), not relocating the period in the byte stream → fail.

## Expected ACT-style outcome
**failed** (SC 1.3.2 — punctuation reordered in the content stream so the programmatic reading
sequence no longer matches the meaningful sentence order).

## Why automated tools miss it
The page is valid `lang="he" dir="rtl"` HTML with every attribute present and a visually
correct render. A relocated period is not a missing/empty attribute and trips no linter. Only
a human who reads both Hebrew and English and compares the period's logical position to its
visual position can see that the punctuation was moved in the source. axe, WAVE, and Lighthouse
do not perform that comparison.

## Citation
> "the bidirectional algorithm may position punctuation in the wrong location in the visual rendering. The visual rendering problem could be corrected by moving the punctuation in the content stream so that the bidirectional algorithm positions it as desired, but this would expose the incorrect content order to assistive technology."
— wcag-techniques/general/G57.html (Description)

> "Content that does not meet this Success Criterion may confuse or disorient users when assistive technology reads the content in the wrong order"
— wcag-understanding/meaningful-sequence.html (Intent of Meaningful Sequence)
