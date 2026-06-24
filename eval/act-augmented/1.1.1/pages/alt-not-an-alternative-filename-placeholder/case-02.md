# case-02 — Product gallery where each thumbnail's alt is its CMS slug (prod-9921-thumb-2)

## Scenario
An outdoor-gear e-commerce category grid ("Northfell Outfitters") shows four product cards.
Each thumbnail depicts a visually distinct item — a sun-yellow hooded rain jacket, a
forest-green hiking boot, a glacier-blue insulated bottle, an ember-orange daypack. The image
is the only visual telling a shopper what the product looks like. Every thumbnail's `alt` is
the CMS image slug (`prod-9921-thumb-2`, `prod-9930-thumb-1`, `prod-9944-thumb-1`,
`prod-9951-thumb-3`). The alt is non-empty so presence rules pass, but the slug conveys none
of the colour, shape, or category.

## Attribute tuple
- **Content domain:** e-commerce / outdoor retail catalog
- **UI component / pattern:** responsive product-card grid (`<ul>` of cards, each an image link)
- **Host-language construct:** `<a class="thumb"><img alt></a>` image link inside a card
- **Locale / i18n:** en
- **Failure mechanism:** CMS image slug / programming reference used as the alt on every product image

## Developer persona
An agency themed a Shopify-style storefront. The product-import script mapped each uploaded
asset's storage key (`prod-{sku}-thumb-{n}`) straight into the `<img alt>` field as a default
"so the field is never blank," intending merchandisers to overwrite it later. Merchandisers
fill the visible product title (which is descriptive) but never touch the per-image alt, since
it is invisible in the storefront. The CI a11y check passes because no image has an empty alt.

## Element / selector carrying the issue
`ul.grid li.card a.thumb img[alt^="prod-"]` — all four thumbnails. The descriptive product
name lives in the sibling `h3 > a`, which is a separate link/heading, not the image's
accessible name.

## Exact accessibility mechanism
Each image's accessible name is its `alt` = the slug, e.g. "prod-9921-thumb-2". A screen-reader
user browsing by image, or following the image link, hears "prod dash 9921 dash thumb dash 2,
image" and learns nothing about a yellow rain jacket. The slug cannot substitute for the
non-text content: removing the image and leaving "prod-9921-thumb-2" loses the entire visual
of the product. The visible `<h3>` title is descriptive but is exposed as separate text, not as
the image's text alternative; a user scanning images or relying on the image-link name still
gets only the slug.

## Expected ACT-style outcome
**failed** (SC 1.1.1). ACT rule 23a2a8 PASSES on every thumbnail (alt non-empty). The page
fails under F30: the alternative is a programming reference / filename-style slug, not a text
alternative that serves the equivalent purpose.

## Why automated tools miss it
Every `<img>` has a non-empty `alt`, so axe/WAVE/Lighthouse "image-alt" passes. qt1vmo (the
descriptive-name rule) can only flag a name that names a DIFFERENT identifiable asset; a CMS
slug like "prod-9921-thumb-2" names no identifiable brand asset, so qt1vmo cannot judge it
wrong against the pixels. Distinguishing a storage slug from a real description of a rain
jacket requires reading the string as a human and comparing it to the rendered product image.

## Citation
**Reference:** WCAG Technique F30 (`wcag-techniques/failures/F30.html`)
> "programming references that do not convey the information or function of the non-text content such as "picture 1", "picture 2" or "0001", "0002" or "Intro#1", "Intro#2"."

**Reference:** WCAG Technique G94 (`wcag-techniques/general/G94.html`)
> "The text alternative should be able to substitute for the non-text content. If the non-text content were removed from the page and substituted with the text, the page would still provide the same function and information."
