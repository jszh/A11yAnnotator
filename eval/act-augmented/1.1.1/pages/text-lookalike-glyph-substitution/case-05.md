# case-05 — Clearance price "$300" with Cyrillic digit look-alikes (plus a legit-SKU near-miss)

## Scenario
A clearance product page for a backpack shows the headline sale price as **"$300."** The
three digits are Cyrillic capital letters chosen for their glyph shapes: `$ З О О` =
`U+0024` + `U+0417` (Cyrillic capital Ze, looks like 3) + `U+041E` + `U+041E` (Cyrillic
capital O, looks like 0). No `aria-label` and no visually-hidden real number. The page also
contains a deliberate near-miss: the model number "RX-O0OO" mixes a real Latin letter O
(`U+004F`) and a real digit 0 (`U+0030`) — ambiguous-looking but **correctly encoded**, so
it is NOT the F71 failure.

## Attribute tuple
- **content-domain:** outdoor gear / e-commerce clearance
- **UI-component / pattern:** price block with strikethrough "was" price and savings badge
- **host-language construct:** inline `<span class="now">` price text node
- **locale / i18n:** en (page `lang="en"`); substituted glyphs are Cyrillic letters used as digits
- **failure-mechanism:** F71 confusable NUMERALS on a load-bearing price; near-miss real-codepoint SKU as a distractor

## Developer persona
A merchandiser updates clearance prices by pasting them from a supplier's spreadsheet. One
supplier's export tool, localized for a Cyrillic market, had silently produced "prices"
using Cyrillic Ze/O glyphs that look like 3/0 in the sheet. The merchandiser copy-pasted the
cell straight into the CMS price field. It rendered identically to a normal price, so it
sailed through review; meanwhile the SKU field's O/0 ambiguity is genuine product data and
perfectly valid.

## Element / selector carrying the issue
- `.pricing > span.now` — text decodes to `U+0024 U+0417 U+041E U+041E` (visible: "$300");
  no `aria-label`, no hidden real-number alternative. **This is the F71 failure.**
- `.sku` ("RX-O0OO", `U+004F`+`U+0030`) — genuinely encoded, ambiguous-looking, **conformant**
  (present as a near-miss so a judge must isolate the real defect).

## Exact accessibility mechanism (what AT experiences)
A screen reader announces the headline price as the Cyrillic letters — e.g. "dollar Ze O O"
or a Russian-language reading — rather than "three hundred dollars." A blind shopper cannot
hear the actual sale price, the single most decision-relevant fact on a clearance page.
(F71 explicitly cites digit confusables: `U+0033` vs `U+04E0` both look like 3.) Per F71
the look-alike numerals have no text alternative. The SKU, by contrast, is read out as its
genuine characters and is fine.

## Expected ACT-style outcome
**failed** — SC 1.1.1 via **F71** (the confusable price). The SKU near-miss is *passed /
inapplicable* (correctly encoded text). No graphical element exists, so ACT 1.1.1 rules are
*Inapplicable*; the defect is the un-alternatived look-alike price.

## Why automated tools miss it
No img/svg/role=img, so axe-core, WAVE, and Lighthouse report nothing for 1.1.1. The price
node is valid, non-empty, high-contrast text. A scanner cannot distinguish "$300 written in
Cyrillic confusables" from a genuine "$300" — and the genuinely-encoded SKU on the same page
shows that not every odd-looking string is a defect. Telling them apart requires reading
each code point against the page language — human judgment.

## Citation
**Reference:** WCAG Technique F71 — *Failure of Success Criterion 1.1.1 due to using text
look-alikes to represent text without providing a text alternative*
(`wcag-techniques/failures/F71.html`).

> "The characters `U+0033` and `U+04E0` both look like the number "3", yet the second is
> actually a letter from the Cyrillic alphabet."

**Supporting reference:** same technique, on detection being a per-character language check.

> "If the characters used do not match the appropriate characters for the displayed glyphs
> in the human language of the content, then look-alike glyphs are being used."
