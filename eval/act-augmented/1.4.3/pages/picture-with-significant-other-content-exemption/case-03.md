# case-03 — Product page: exempt packaging photo paired with an in-scope image-of-text banner (fails)

## Scenario
An "Olivar del Sol" olive-oil product page carries two images that are the same DOM shape
(`<img>` + non-empty alt) but split on the 1.4.3 exemption:

- **(A) Product photo — EXEMPT.** A photograph of the bottle on a kitchen counter: bottle,
  cork, counter, an olive sprig, a shadow — significant other visual content. The bottle's
  printed label reads "ARBEQUINA / EXTRA VIRGIN" in low-contrast olive ink (~1.6:1). That is
  the label of a real object photographed in a scene — incidental text in a picture with
  significant other visual content. Not tested.
- **(B) Promo banner — IN SCOPE, FAILS.** A separate flat marketing banner ("FREE SHIPPING
  OVER $40 / harvest sale ends sunday") is an image of text done for a custom display look —
  flat brown fill, no other content. Lettering `#c79a5a` on `#6b4f2a` = **2.95:1**, below
  4.5:1 for normal text. It fails.

A correct review must classify each image, skip (A), and eyedropper (B).

## Attribute tuple
- **Content domain:** e-commerce product detail (specialty food)
- **UI component / pattern:** product gallery image + sitewide promo banner
- **Host-language construct:** two `<img>` elements, both with transcribing `alt`, both inline-SVG `data:` URIs
- **Locale / i18n:** en (US currency); product origin Catalonia
- **Failure mechanism:** an image-of-text-for-look promo banner rendered at 2.95:1, adjacent to an exempt packaging photo that a careless reviewer might measure instead

## Developer persona
A Shopify store owner using a themed Dawn storefront added a "FREE SHIPPING" banner in Canva
with the shop's serif display font and exported it as one image to guarantee the type. They
chose tan-on-brown because it matched the brand, never contrast-checking it because it was an
exported asset. The product photo is a normal studio shot whose label happens to be low
contrast — and that one is fine to leave.

## Element / selector carrying the issue
`img.promo[alt="Free shipping over $40. Harvest sale ends Sunday."]` carries the FAILURE
(in-scope image of text, 2.95:1). `div.gallery img` is the EXEMPT decoy (packaging photo whose
label text is incidental and must not be measured).

## Exact accessibility mechanism
A low-vision shopper sees a faint tan-on-brown shipping banner and may not be able to read the
$40 threshold or that the sale ends Sunday — information rendered as an image purely for look,
which the SC requires to meet 4.5:1. Because the banner is an image of text (no significant
other content), the exemption does not apply, and 2.95:1 is a failure; a tester confirms with
the Colour Contrast Analyser's eyedropper (least-contrast lettering pixel vs the fill). The
bottle photo, by contrast, is a picture with significant other visual content whose label text
is incidental, so its ~1.6:1 label is exempt and is not measured. The page fails on (B) alone.

## Expected ACT-style outcome
**failed** (SC 1.4.3). ACT afw4f7 "Text has minimum contrast" is inapplicable to both images
(no live text nodes). The in-scope banner image of text renders at 2.95:1 < 4.5:1, so the page
fails; the exempt product photo does not rescue it.

## Why automated tools miss it
Both images are `<img>` with non-empty alt, so axe/WAVE/Lighthouse raise no alt error, and
they compute contrast only for live text nodes — neither image has one — so no contrast error
fires. No tool reads text inside either image, samples pixels, or decides which image is an
exempt picture versus an in-scope image-of-text-for-look. The whole page hinges on that
two-way human classification plus an eyedropper measurement, none of which is automatable.

## Citation
**Reference:** WCAG 2.2 Understanding SC 1.4.3 (`wcag-understanding/contrast-minimum.html`)
> "This exception is intended to separate pictures that have text in them from images of text that are done to replace text in order to get a particular look."

**Reference:** Trusted Tester v5.1.3 SC 1.4.3, Test 13.C step 4 (`refs/trusted-tester/sc-1.4.3-contrast-minimum.md`)
> "If the page contains an image of text alone (or an image with text and no other significant content), test the image of text with CCA (ANDI: color contrast cannot detect text inside images)."
