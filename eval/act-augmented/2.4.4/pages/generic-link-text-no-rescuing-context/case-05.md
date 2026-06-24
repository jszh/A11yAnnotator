# case-05 — Same ">>" glyph link: rescued beside a product name vs. alone in a paragraph

## Scenario
An electronics shop uses a ">>" (» chevron) glyph as a "go to product" affordance. It
appears twice with identical styling. In the **Editor's pick** block the glyph sits in the
same sentence as a named product ("the iPhone 15 Pro »"), and the link also carries
`aria-label="iPhone 15 Pro details"` — that link PASSES. In the **Also trending** block the
identical glyph sits alone in its own paragraph with no product name anywhere in the block —
that link FAILS. One page, one verdict each, separated only by context.

## Attribute tuple
- **content-domain**: e-commerce product spotlight
- **UI-component/pattern**: glyph/chevron "go" affordance used as a link
- **host-language construct**: `<a>` whose content is the `&raquo;` (») character; one with an `aria-label`, one without
- **locale/i18n**: en (typographic glyph as control)
- **failure-mechanism**: visual-only "more →" affordance whose meaning depends entirely on adjacent in-sentence text; present in one block, absent in the other

## Developer persona
A storefront developer built a reusable "chevron link" snippet for product spotlights and
dropped it after the product name in the first block, where it reads naturally and they
even added an `aria-label`. Rushing the second "Also trending" block before launch, they
reused the snippet but pasted only the glyph, forgetting both the product name and the
`aria-label` — leaving a lone "»" with nothing to anchor it.

## Element / selector carrying the issue
- PASS: `.spotlight:nth-of-type(1) a.chev[href="/products/iphone-15-pro"]` — accessible name
  "iPhone 15 Pro details" (aria-label) AND same-sentence product name.
- FAIL: `.spotlight:nth-of-type(2) a.chev[href="/products/aurora-bt-speaker"]` — accessible
  name is the bare glyph "»", alone in its paragraph, no product name in the block.

## Exact accessibility mechanism
For the PASS link, a screen-reader user reading the sentence hears "…the iPhone 15 Pro,
iPhone 15 Pro details, link" (and on a Links List the aria-label gives a meaningful entry).
The purpose is conveyed twice over — by the same-sentence product name (G53) and by the
explicit name. For the FAIL link, the accessible name computes to the punctuation glyph
"»", which a screen reader announces as "right pointing double angle quotation mark, link"
or simply "link" depending on punctuation settings — and the link's programmatically
determined context (its own paragraph) contains no product name, heading text, or ARIA
association. The user cannot determine that this glyph leads to the Aurora Bluetooth
speaker. Identical glyph, opposite outcomes, decided entirely by surrounding meaning.

## Expected ACT-style outcome
**failed** — the page contains a link (the lone "»") whose purpose cannot be determined from
its text plus programmatic context. (The Editor's-pick "»" link passes; the page-level
verdict is failed because at least one link fails the SC.)

## Why automated tools miss it
Both links have non-empty accessible names — one via `aria-label`, one via the glyph text
node — so ACT c487ae and axe `link-name` PASS for both. A glyph like "»"/">>" is not on
phrase blocklists, so heuristic "ambiguous link text" checkers flag neither. No tool can
read the Editor's-pick sentence, find "iPhone 15 Pro," and conclude it rescues the first
glyph while the second glyph — lacking any in-block product name — does not. That
discrimination is the irreducible human meaning judgment.

## Citation
> **WCAG Techniques — G53: Identifying the purpose of a link using link text combined with the text of the enclosing sentence**
> "The sentence enclosing the link provides context for an otherwise unclear link. The
> description lets a user distinguish this link from links in the web page that lead to
> other destinations and helps the user determine whether to follow the link."

> **WCAG 2.2 Understanding 2.4.4 — Intent**
> "In some situations, authors may want to provide part of the description of the link in
> logically related text that provides the context for the link. In this case the user
> should be able to identify the purpose of the link without moving focus from the link."
