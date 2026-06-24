# case-05 — Product page titled after a "You may also like" related-rail item

## Scenario
An e-commerce product-detail page (PDP) whose primary content is the
**"Aria 14 Ultralight Laptop Stand"** — gallery, price, description, a full technical
specification table, and an Add-to-cart button. The document `<title>` is
**"Veza Mechanical Keyboard (Walnut) | Lumen Goods"** — the name of one of the four items in
the "You may also like" related-products rail near the bottom of the page. The keyboard is a
genuine, present cross-sell suggestion, but it is *not* the product the page is about. The
title names the wrong product.

## Attribute tuple
- **content-domain:** e-commerce product & checkout
- **UI-component / pattern:** "You may also like" related-products carousel/rail
- **host-language construct:** `<title>` bound to a related-rail item's name instead of the PDP `<h1>` / canonical product
- **locale / i18n:** en-US
- **failure-mechanism:** present-but-wrong-region — title names a peripheral cross-sell item, not the primary product (F25)

## Developer persona
A storefront developer built a shared `<ProductCard>` component used both in the main buy-box
and in the related rail, and each card calls a `setPageTitle(product.name)` side-effect when
it mounts. Because the related-rail cards mount after the main product card in this layout,
the *last* card to mount (a related item) wins and overwrites `document.title`. The dev
tested the PDP visually — where the laptop stand is clearly the hero — and never noticed the
tab title settled on a suggested keyboard.

## Element / selector carrying the issue
- `head > title` — value: `Veza Mechanical Keyboard (Walnut) | Lumen Goods`
- Primary region: `section.pdp > .buybox > h1#ptitle` ("Aria 14 Ultralight Laptop Stand").
- Peripheral source region: `section.related .rail .card .name` (first card, "Veza Mechanical Keyboard (Walnut)").

## Exact accessibility mechanism (what AT experiences)
A screen-reader shopper who opens the laptop-stand product in a new tab hears it announced as
"Veza Mechanical Keyboard (Walnut), Lumen Goods." If they have several product tabs open to
compare, the laptop-stand tab is mislabeled as a keyboard; in browser history or a saved
bookmark the page is filed under the wrong product entirely. The title actively *misleads*
about the page's topic — worse than merely generic — and defeats the orientation/identification
purpose of SC 2.4.2. A `<title>` is present and non-empty, but it does not identify the
overall content of the document (limb b).

## Expected ACT-style outcome
**failed** (ACT rule c4a8a4 — the title describes a related/peripheral item, not the topic
of the page's primary product).

## Why automated tools miss it
The `<title>` is present and non-empty, so axe-core `document-title`, WAVE, and Lighthouse
pass. The keyboard's name appears verbatim in the related-rail DOM, so token-overlap between
title and page content is high and a naive descriptiveness heuristic is satisfied. No tool
models which product region is the page's canonical subject versus a "you may also like"
suggestion rail, and none compares the title against the primary product. Determining that
the laptop stand — not the suggested keyboard — is the page's topic requires human reading
and a sense of layout prominence.

## Citation
**Reference:** WCAG Technique F25 — *Failure of Success Criterion 2.4.2 due to the title of
a web page not identifying the contents* (`wcag-techniques/failures/F25.html`).

> "This describes a failure condition when the web page has a title, but the title does not
> identify the contents or purpose of the web page."

**Supporting reference:** WCAG Technique G88 — *Providing descriptive titles for web pages*
(`wcag-techniques/general/G88.html`).

> "Check that the title is relevant to the content of the web page."
