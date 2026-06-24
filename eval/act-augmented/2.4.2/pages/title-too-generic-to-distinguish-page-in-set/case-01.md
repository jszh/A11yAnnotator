# case-01 — Product page titled only "Online Store"

## Scenario
A specific product page in an obvious multi-page storefront (Riverstone Outdoors). The
body, breadcrumb trail, category nav, and `<h1>` unambiguously establish the page's role:
this is the detail page for a "Stainless Steel Insulated Water Bottle — 750 ml" (SKU
RVS-BTL-750-SLT). The `<title>`, however, is only the theme's shared default **"Online
Store"** — the identical string the Cart, every collection page, and every other product
page in this shop carries. The title is true about the site but carries no page-level
information, so it cannot distinguish this product from its siblings.

## Attribute tuple
- **Content domain:** e-commerce — product detail page
- **UI component / pattern:** breadcrumb + category nav + product buy-box (APG breadcrumb)
- **Host-language construct:** `<title>` element holding a shared store-level string
- **Locale / i18n:** en
- **Failure mechanism:** F25 example 2 — template-shared, site-name-only title across a set; accurate about the SITE, zero page-level signal

## Developer persona
An agency themed Shopify's free **Dawn** theme for the client and wired the product
template's `<title>` tag to the *shop name* setting ("Online Store" — the placeholder the
client never renamed in admin) instead of `{{ product.title }} – {{ shop.name }}`. Every
template inherits the one string. It looked fine in the browser tab during QA, so nobody
flagged it.

## Element / selector carrying the issue
`head > title` (value: `Online Store`). The page-level identity lives in
`main h1`, `nav.crumbs [aria-current="page"]`, and `.sku` — none of it reaches the title.

## Exact accessibility mechanism
A screen-reader user who opens this product in a new tab, or scans an open-tabs list, or
returns via browser history/bookmarks, hears/sees only "Online Store." With the Cart tab,
the Drinkware collection tab, and three other product tabs all announcing "Online Store,"
the title — the primary orientation cue named in the SC's intent — fails to tell them
which page this is. The on-page `<h1>` does identify the product, but `<title>` is what AT
exposes for tab/window/history/search-result orientation, and it is non-distinguishing.

## Expected ACT-style outcome
**failed** (SC 2.4.2). Title is present and non-empty (so 2779a5 passes) but is not
descriptive of this page and does not distinguish it within the set (fails c4a8a4 /
Trusted Tester 12.B / F25).

## Why automated tools miss it
axe-core `document-title`, WAVE, and Lighthouse check only that a non-empty `<title>`
exists; "Online Store" satisfies that. They have no sibling corpus to compare against and
cannot read the body to learn the page's specific role, so they cannot judge that the
title carries only site-level, not page-level, information.

## Citation
**Reference:** WCAG Technique F25 (`wcag-techniques/failures/F25.html`)
> "A site generated using templates includes the same title for each page on the site. So the title cannot be used to distinguish among the pages."

**Reference:** Trusted Tester v5.1.3 (`refs/trusted-tester/sc-2.4.2-page-titled.md`)
> "If the web page is part of a set of web pages, determine whether the Page Title is sufficient to distinguish the web page from other pages."
