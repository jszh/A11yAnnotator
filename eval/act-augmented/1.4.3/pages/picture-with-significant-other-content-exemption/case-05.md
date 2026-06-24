# case-05 — Bookstore: same stylized title is exempt inside cover artwork, in scope as a flat banner (fails)

## Scenario
A Harborlight Books product page for the novel "The Quiet Tide." The same stylized title
appears twice, and the 1.4.3 exemption flips between them:

- **(A) Book-cover image — EXEMPT.** Full cover artwork: a moonlit night sea, a lighthouse
  beam, two gulls, the moon, the author's name, a publisher mark. The title is a low-contrast
  purple display script **integrated into the composition** — a picture with significant other
  visual content. Not measured.
- **(B) Staff-Pick banner — IN SCOPE, FAILS.** Lower on the page, the same title "THE QUIET
  TIDE" is lifted out and set on a flat purple panel as a promo banner — no cover artwork, no
  other significant content. Lettering `#9488bf` on `#4a3f6e` = **2.93:1**, below 4.5:1. Here
  the title is an image of text for the display look, so it is in scope and fails.

## Attribute tuple
- **Content domain:** e-commerce / publishing (independent bookstore)
- **UI component / pattern:** product cover image + "staff pick" promotional banner
- **Host-language construct:** two `<img>` elements (inline-SVG `data:` URIs), each with transcribing `alt`
- **Locale / i18n:** en
- **Failure mechanism:** the identical stylized title is exempt as cover art but in scope as a standalone image-of-text banner that renders at 2.93:1

## Developer persona
A bookstore marketing assistant exported a "Staff Pick" banner from the same design file as the
book cover, reusing the cover's purple palette and display lettering "to keep it on-brand." On
the flat banner background the purple-on-deep-purple lost contrast, but they never checked it
because "the cover uses the same colors and that's fine" — not realising the cover is exempt as
artwork while the standalone banner is an in-scope image of text.

## Element / selector carrying the issue
`section.staff img#staffImg[alt="Staff Pick of the Month: The Quiet Tide"]` carries the FAILURE
(in-scope image of text, 2.93:1). `div.cover img` is the EXEMPT counterpart (the stylized title
is part of cover artwork with significant other visual content and must not be measured).

## Exact accessibility mechanism
On the cover, the low-contrast script title is part of a rich picture; the cover's purpose is
the artwork, and the title is integrated into it, so the SC exempts it from contrast (and the
book's identity is conveyed by the live `<h1>` "The Quiet Tide" and the alt). On the Staff-Pick
banner, the very same words are presented as a flat image of text purely for the display look;
a low-vision user faced with purple-on-deep-purple at 2.93:1 cannot reliably read it and cannot
restyle an image. Because that banner is an image of text done to get a particular look — with
no significant other visual content — it is in scope and must meet 4.5:1; at 2.93:1 it fails. A
tester confirms with the Colour Contrast Analyser eyedropper on the banner only.

## Expected ACT-style outcome
**failed** (SC 1.4.3). ACT afw4f7 is inapplicable to both images (no live text nodes). The
in-scope banner image of text renders at 2.93:1 < 4.5:1, so the page fails; the exempt cover
does not rescue it.

## Why automated tools miss it
Both images are `<img>` with non-empty alt, so no alt error. Contrast checkers measure only
live text nodes and cannot read text inside either image, so no contrast error fires. The page
turns entirely on the human judgment that the SAME stylized title is exempt inside cover artwork
(significant other visual content) but in scope as a flat image-of-text banner — a composition/
purpose distinction, followed by an eyedropper measurement, neither of which any scanner can do.

## Citation
**Reference:** WCAG 2.2 Understanding SC 1.4.3 (`wcag-understanding/contrast-minimum.html`)
> "In this provision there is an exception that reads "that are part of a picture that contains significant other visual content,". This exception is intended to separate pictures that have text in them from images of text that are done to replace text in order to get a particular look."

**Reference:** Trusted Tester v5.1.3 SC 1.4.3 (`refs/trusted-tester/sc-1.4.3-contrast-minimum.md`)
> "If the page contains an image of text alone (or an image with text and no other significant content), test the image of text with CCA (ANDI: color contrast cannot detect text inside images)."
