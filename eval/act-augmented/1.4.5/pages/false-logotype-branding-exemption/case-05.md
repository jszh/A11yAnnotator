# case-05 — Promotional "free shipping over $50" badge as an inline SVG image with a matching title (not a logotype)

## Scenario
A fashion product page. Two circular badges sit beside the product copy. The first is a
genuine one-word wordmark badge ("AURELIA") — an exempt logotype. The second is a promotional
badge whose pixels read "FREE SHIPPING on orders over $50." It is drawn as an inline `<svg>`
with `role="img"` and a `<title>` of "Free shipping on orders over $50," so it has an accurate
accessible name and looks, to a captioned-image heuristic, fully compliant. But its content is
substantive promotional information — a free-shipping threshold of $50 — not a logo or brand
name. Setting that slogan in the brand badge style does not make it branding; the threshold is
exactly the kind of text a shopper may need to enlarge or recolour, so it must be live,
selectable, resizable text.

## Attribute tuple
- **Content domain:** e-commerce product & checkout (apparel)
- **UI component / pattern:** circular promotional badge ("rating/seal"-style mark)
- **Host-language construct:** inline `<svg role="img">` with a `<title>` accessible name and `<text>` glyphs (distinct from the data:-URI cases)
- **Locale / i18n:** en, USD currency
- **Failure mechanism:** a promotional slogan carrying a price threshold rendered as an image badge with a matching accessible name, defended as a "brand badge"

## Developer persona
A Shopify theme developer built a reusable "trust badge" component. To keep the badge looking
crisp at any size they drew the text as SVG `<text>` rather than HTML, and added a `<title>`
"so screen readers announce it." They reused the same component for the brand wordmark seal and
for the free-shipping promo, treating both as interchangeable "badges," without noticing that
one is a brand mark (exempt) and the other states an offer threshold (informational text).

## Element / selector carrying the issue
`.badges svg[aria-labelledby="ship-badge-title"]` — the free-shipping badge; its words exist
only as SVG `<text>` glyphs. The sibling `svg[aria-label="Aurelia"]` is the exempt wordmark.

## Exact accessibility mechanism
The `<svg role="img">` has an accessible name from `<title>` ("Free shipping on orders over
$50"), so a screen reader hears the offer (1.1.1 satisfied). The 1.4.5 harm is visual: the
"$50" threshold is rasterised glyphs, so a low-vision shopper who needs the figure at 200% in
their own palette gets a blurred badge, and forced-colors mode cannot recolour SVG-fill text
inside an image. The logotype/branding exemption covers marks whose presentation is essential
to a brand identity; a free-shipping offer's information is fully expressible as styled live
text, so text must be used. The wordmark badge legitimately invokes the exemption.

## Expected ACT-style outcome
**failed** (SC 1.4.5), driven by the free-shipping badge. The wordmark badge alone is
**passed/inapplicable** under the logotype exemption.

## Why automated tools miss it
The `<svg role="img">` carries a non-empty accessible name via `<title>`, so axe-core's
`svg-img-alt` / role=img name checks pass, and because that name matches the visible words a
"descriptive alt" heuristic is satisfied too. No automated tool reads the SVG glyphs to learn
the badge states an offer threshold, and none can decide that a promotional slogan is not
branding. The brand-mark-vs-promotional-information judgment requires a human.

## Citation
**Reference:** WCAG 2.2 Understanding — Images of Text, "In brief" (`wcag-understanding/images-of-text.html`)
> "Goal: Users can adjust how text is presented. What to do: Use text instead of pictures of text. Why it's important: People cannot alter how text looks in images."

**Reference:** WCAG 2.2 Understanding — Images of Text, "A logo containing text" example
(`wcag-understanding/images-of-text.html`)
> "The logo contains logotype (text as part, or all, of the logo). The visual presentation of the text is essential to the identity of the logo ..."

**Reference:** Trusted Tester v5.1.3 SC 1.4.5, How to Test step 1a
(`refs/trusted-tester/sc-1.4.5-images-of-text.md`)
> "Logotypes (text that is part of a logo or brand name) cannot be replaced by text."
