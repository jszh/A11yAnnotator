# case-03 — Product page cloned from a sibling SKU: title says 500ml, the page is the 750ml

## Scenario
An e-commerce product detail page (PDP) duplicated from a **sibling variant**. A
merchandiser cloned the existing 500 mL Tundra bottle listing to create the 750 mL one
and updated the body throughout — the breadcrumb current page, the `<h1>`, the price line
SKU (`TND-750-SLT`), the Add-to-cart button, the description, every spec row (capacity
750 mL, height 27 cm, weight 415 g), the product-image SVG label, and the footer all read
**750 mL**. The `<title>`, however, still reads **"Tundra Stainless Steel Bottle 500ml —
Slate | NorthPeak Gear"**. Because 500 mL is a *real sibling SKU in the same product
line and finish*, the title looks entirely legitimate; only the capacity identifier is
the wrong instance.

## Attribute tuple + developer persona
- **content-domain:** e-commerce product & checkout
- **UI component / pattern:** PDP with gallery (**inline-SVG product image bearing the printed capacity**) + specifications table + breadcrumb
- **host-language construct:** `<title>` field on a duplicated product record; capacity also rendered as SVG text with `aria-label`
- **locale / i18n:** en, metric + US fl oz
- **failure-mechanism:** "duplicate product" workflow — body fields edited, the SEO/`<title>` field carried over from the source variant
- **developer persona:** A Shopify/headless store merchandiser used the storefront's
  "Duplicate product" action on the 500 mL listing, changed the title-on-page and all
  spec fields to 750 mL, but the theme builds `<title>` from a separate `seo.title`
  metafield that the duplicate copied verbatim and the merchandiser never opened. The
  500 mL listing still exists, so the stale title points at a genuine other page.

## Element / selector carrying the issue
- `head > title` — `Tundra Stainless Steel Bottle 500ml — Slate | NorthPeak Gear`
- Contradicted by `main h1#pdp-h1` (`… — 750 mL (Slate)`), `nav.crumbs [aria-current="page"]`
  (`… 750 mL (Slate)`), the gallery `svg[role="img"]` aria-label (`750 millilitres`),
  `.specs` (Capacity `750 mL`, SKU `TND-750-SLT`, weight `415 g`), the Add-to-cart button
  (`Add 750 mL bottle to cart`), and the footer (`750 mL, Slate`).

## Exact accessibility mechanism (what AT experiences and why it fails)
A screen-reader user hears "Tundra Stainless Steel Bottle 500ml — Slate" as the page
name on tab announcement, on load, in a tab list, in history, and in a shared link's
preview. The page is the **750 mL** product in every respect, including the SVG image's
`aria-label`. Capacity is the *only* attribute distinguishing this PDP from its 500 mL
sibling — exactly the case where the title must distinguish pages in a set. A blind
shopper comparing the two sizes across open tabs, or trusting the announced title to
confirm which bottle they are adding to cart, is told the wrong size by the primary
orientation cue and may order the 500 mL when they wanted the 750 mL (or vice versa).
This is the descriptiveness limb of F25: the title is present and on-topic but identifies
a *different variant* of the product, not this page.

## Why automated tools cannot detect it
axe-core, WAVE and Lighthouse verify only that a `<title>` exists and is non-empty
(ACT 2779a5). "Tundra Stainless Steel Bottle 500ml — Slate | NorthPeak Gear" is valid,
non-empty, unique, brand-qualified and on-topic — a model-citizen product title. A
keyword-overlap heuristic passes it because title and body share "Tundra", "Stainless
Steel Bottle", "Slate", "NorthPeak", and a millilitre figure. The deciding fact — that
the capacity should be 750, established by the H1, the spec table, the SKU, and the SVG
image's accessible name — requires reading and reconciling the body's identifiers. No
checker compares the title's "500ml" to the body's "750 mL"; both are valid capacity
strings. Only human (or model) cross-checking of the salient spec catches it.

## Expected ACT-style outcome
**failed** (SC 2.4.2, technique F25 — title does not identify this page; among sibling
size variants it names a different one).

## CITATION

> **Reference:** WCAG Techniques — F25 (Failure of Success Criterion 2.4.2 due to the title of a web page not identifying the contents)
> File: `wcag-techniques/failures/F25.html`
>
> "This describes a failure condition when the web page has a title, but the title does not identify the contents or purpose of the web page."

> **Reference:** WCAG 2.2 Understanding — Page Titled (Intent)
> File: `wcag-understanding/page-titled.html`
>
> "The intent of this success criterion is to help users find content and orient themselves within it by ensuring that each web page has a descriptive title. Titles identify the current location without requiring users to read or interpret page content."

> **Reference:** Trusted Tester v5.1.3 — SC 2.4.2 Page Titled, Test 12.B
> File: `refs/trusted-tester/sc-2.4.2-page-titled.md`
>
> "If the web page is part of a set of web pages, determine whether the Page Title is sufficient to **distinguish** the web page from other pages."
