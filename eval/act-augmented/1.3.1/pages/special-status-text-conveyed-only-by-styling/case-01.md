# case-01 — "On sale" status conveyed only by bold + larger product name

## Scenario
A small hand-dyed-yarn storefront (a Shopify "Dawn"-style product grid). Five products are
listed; three are on sale. The **only** indication that a product is on sale is that its name
renders in **bold and one size larger** (`class="promo"` → `font-weight:700; font-size:1.18rem`)
than the regular-weight names. There is no "(Sale)" or "On sale" word, no struck-through
original price, no semantic markup, and — deliberately — no colour difference. The sale status
lives entirely in the typographic weight/size.

## Attribute tuple
- **content-domain:** e-commerce product listing (yarn / craft retail)
- **UI-component/pattern:** product grid card (`<ul>` of `<li class="card">`)
- **host-language construct:** `<h2 class="name promo">` styled with `font-weight`/`font-size`
- **locale/i18n:** en-GB (GBP pricing)
- **failure-mechanism:** special status ("on sale") conveyed by a non-color variation in text
  presentation with neither markup nor a text equivalent (F2; G117 not applied)

## Developer persona
A solo maker set up a Shopify store and customised the Dawn theme. The theme normally shows a
"Sale" badge, but the owner thought the badges looked "shouty" and removed them in the theme
editor. To still make discounted items "pop," they added a custom CSS class that bolds and
enlarges the product title for the items they manually marked down. They reasoned "people can
see which ones stand out" — never considering a shopper who cannot perceive font weight.

## Element / selector carrying the issue
`h2.name.promo` — the three product names "Harbour Teal", "Quartz Rose", and "Bracken Green"
(selector `.name.promo`). Their bold/larger rendering is the sole carrier of "on sale".

## Exact accessibility mechanism (what AT experiences, why it fails)
A screen-reader user arrowing through the product grid hears: "Slate Heather, £12.50, in stock
14 skeins … Harbour Teal, £9.00, in stock 6 skeins … Field Mustard, £12.50 …". Nothing in the
speech stream distinguishes the on-sale items — `font-weight` and `font-size` are not part of
the accessible name or any announced property, so all five names are read identically in tone.
A braille-display user gets the same flat list. A low-vision user who applies a user stylesheet
that normalises font weight (common for readability) loses the cue entirely. The relationship
"this product has special status — it is discounted" is conveyed by presentation alone and is
available neither programmatically nor in text, so these users cannot tell which yarns are on
sale. Per F2 this is a failure; applying G117 (e.g. appending the word "(Sale)") or H49-style
markup would fix it.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
The DOM is impeccable: real list, real headings, real prices, real buttons, every image has a
text alternative. `font-weight:700` and a larger `font-size` are ubiquitous, legitimate styles
— no checker flags them, because in the overwhelming majority of pages bold text is decorative
emphasis, not an information carrier. axe-core, WAVE and Lighthouse have no rule that reads the
surrounding copy, notices that three of five names are emphasised, and infers "the emphasis
encodes sale status that is stated nowhere else." Distinguishing meaningful emphasis from
decorative emphasis, and confirming the meaning is absent from the text, is exactly the
content-reading judgment automation cannot perform.

## Citation
> **WCAG Techniques, F2 — "Failure … due to using changes in text presentation to convey
> information without using the appropriate markup or text":**
> "This document describes a failure that occurs when a change in the appearance of text
> conveys meaning without using appropriate semantic markup."

(Verbatim from `wcag-techniques/failures/F2.html`. The bold/larger weight changes the
appearance of the on-sale product names to convey "on sale" with no markup or text.)

> **WCAG Techniques, G117 — "Using text to convey information that is conveyed by variations in
> presentation of text":**
> "When the visual appearance of text is varied to convey information, state the information
> explicitly in the text. Variations in the visual appearance can be made by changes in font
> face, font size, underline, strike through and various other text attributes."

(Verbatim from `wcag-techniques/general/G117.html`. The page varies font size/weight to convey
"on sale" but never states it in text, the exact gap G117 closes.)
