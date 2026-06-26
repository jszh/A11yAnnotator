# case-02 — Single product (SKU) page titled only "NorthWind Outfitters"

## Scenario
An e-commerce product detail page for ONE specific SKU. The body fully identifies the
item: `<h1>` "Summit 65L Internal-Frame Backpack — Charcoal", `SKU: NWO-BP-SUM65-CHR`,
a price, a specs table, an add-to-cart form, and a footer "You are viewing 1 of 4,180
products in the catalog." The `<title>` is just **"NorthWind Outfitters"** — the store
name, which is identical on every one of the 4,180 product pages.

## Element / selector carrying the issue
`head > title` (value: `NorthWind Outfitters`), judged against `h1`, `.sku`, the
`table.specs`, and `footer` ("1 of 4,180 products").

## Exact accessibility mechanism (what AT experiences and why it fails)
A shopper using a screen reader often opens several products in separate tabs to
compare them. The tab / window name and the document accessible name come from
`<title>`, so all of them announce the identical **"NorthWind Outfitters"**. The user
cannot tell the 65L Summit pack tab from the tent tab from the stove tab; tab
switching, browser history, and bookmarks are all keyed off a string that is constant
across the whole catalog. The distinguishing identity — the product name and SKU —
exists only in the body `<h1>`/`.sku`, never in the title. This is exactly the
WCAG-Understanding benefit case for a web application that "dynamically generates
titles for each web page" (e.g. a per-account, per-statement title); here the title is
NOT generated per page, so the set-distinguishability limb of SC 2.4.2 fails.

## Why automated tools cannot detect this
"NorthWind Outfitters" is a present, non-empty, perfectly grammatical title that is
genuinely relevant to the page (it is the store). axe-core/WAVE/Lighthouse only check
that a non-empty `<title>` exists and is not boilerplate junk ("Untitled Document"),
so they pass. Recognising that the title is the catalog-wide constant — rather than a
per-product name — requires reading the SKU/specs body, inferring catalog membership,
and knowing siblings reuse the string. No single-page checker can do that.

## Expected ACT-style outcome
**failed** (SC 2.4.2, Level A — Limb 2 distinguishability)

## Citation
> **WCAG 2.2 Understanding, `wcag-understanding/page-titled.html` (Intent):**
> "The intent of this success criterion is to help users find content and orient themselves within it by ensuring that each web page has a descriptive title."

> **WCAG Technique F25 (Failure), `wcag-techniques/failures/F25.html`:**
> "A site generated using templates includes the same title for each page on the site. So the title cannot be used to distinguish among the pages."
