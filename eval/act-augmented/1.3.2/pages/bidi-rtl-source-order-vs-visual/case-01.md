# case-01 — Arabic product price: ".$50" physically reordered in source to render correctly via bidi

## Scenario
An Arabic (RTL) date-store product page shows a one-line price summary that should read,
visually, `سعر العلبة الواحدة شامل التوصيل داخل المدينة $50.` ("Price per box including
in-city delivery $50."). The price `$50` is an embedded LTR run with a trailing sentence
period. In natural source order the bidi algorithm renders the price as `50$.` (dollar after
the digits, period floating) — which looked wrong to the author. Instead of isolating the
price with `<bdi>`, the author "fixed the visual" by physically reordering the characters in
the source: the period and `$50` were moved to the **front** of the byte stream
(`.$50 سعر العلبة …`). The bidi algorithm then mirrors them so the screen shows a clean
`… $50.` at the visual (left) end.

## Attribute tuple
- **content-domain:** e-commerce / specialty food retail (dates store)
- **UI-component / pattern:** product price summary line
- **host-language construct:** RTL paragraph with an embedded LTR price run + trailing period, NO `<bdi>`/`<bdo>`
- **locale / i18n:** ar (Arabic, `dir="rtl"`) with embedded LTR currency
- **failure-mechanism:** G57 source-character reordering — punctuation + price moved in the content stream to satisfy the bidi algorithm, exposing the wrong logical order to AT

## Developer persona
A Shopify storefront owner localising an Arabic theme by hand. They pasted the price into the
RTL description field, saw the `$` and period land "on the wrong side," and dragged the price
to the start of the line in the visual editor until it "looked right" on screen — never
realising the WYSIWYG had reordered the actual characters in the stored markup.

## Element / selector carrying the issue
`p.summary` (the price summary line).

## Exact accessibility mechanism (what AT experiences, why it fails)
- VERIFIED with a Puppeteer rendering harness (per-character client-rect sort):
  - LOGICAL (DOM/source order, what a screen reader reads): `.$50 سعر العلبة الواحدة شامل التوصيل داخل المدينة`
  - VISUAL (laid out on screen): `… شامل التوصيل داخل المدينة $50.`
- A sighted Arabic reader sees a correct sentence ending in `$50.`.
- A screen reader / Braille display / copy-paste takes the **logical** character order, so it
  announces the period and the price **first**, detached from the Arabic clause ("dot, fifty
  dollars, price per box…"). The price is read out of sequence and the sentence boundary is
  broken.
- Per G57 the visual rendering should be corrected with **markup** that overrides the
  bidirectional algorithm (`<bdi>$50</bdi>` with the period in logical final position), NOT by
  relocating characters in the content stream. This page does the latter → fail.

## Expected ACT-style outcome
**failed** (SC 1.3.2 — source characters were reordered so the programmatically-determined
sequence does not match the meaningful order; the correct sequence cannot be programmatically
determined).

## Why automated tools miss it
The markup is well-formed, the page is `lang="ar" dir="rtl"`, no attribute is missing, and the
visual rendering is correct — nothing trips a linter or axe/WAVE/Lighthouse. Detecting the
defect requires reading Arabic, knowing it is RTL, and comparing the logical character order to
the visual order to see that the price and period were physically moved in the source. No
automated checker performs that multilingual logical-vs-visual comparison.

## Citation
> "For example, when mixing languages with different directionality in HTML, the bidirectional algorithm may position punctuation in the wrong location in the visual rendering. The visual rendering problem could be corrected by moving the punctuation in the content stream so that the bidirectional algorithm positions it as desired, but this would expose the incorrect content order to assistive technology. The content is both rendered in the correct order visually and exposed to assistive technology in the correct order by using markup to override the bidirectional algorithm."
— wcag-techniques/general/G57.html (Description)

> "It is important that it be possible to programmatically determine at least one sequence of the content that makes sense."
— wcag-understanding/meaningful-sequence.html (Intent of Meaningful Sequence)
