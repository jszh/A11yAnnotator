# case-01 — Bistro menu exported as one image-of-text (custom script), normal-size sepia-on-parchment at 2.70:1 (in scope, fails)

## Scenario
A restaurant page for "Maison Verde" posts tonight's dinner menu as a single exported graphic
(delivered here as an inline-SVG `data:` URI, so the dish names and prices are image pixels, not
live DOM text). The owner does this to lock in a licensed hand-script face that survives every
browser. The graphic is a plain parchment `#f3ead7` fill plus the menu lettering in sepia
`#9c8e6f` — **no photo, no scene, no illustration, no other significant visual content**. So it is
not a "picture that contains significant other visual content"; it is an image of text *done to
get a particular look*, which is **in scope** of 1.4.3. The lettering renders at **2.70:1**,
below the 4.5:1 required for normal-size text, so the page **fails**. The surrounding page —
header, intro prose, hours, reservation button — is all live, high-contrast text that passes.

## Attribute tuple
- **Content domain:** hospitality / restaurant (fine-dining menu)
- **UI component / pattern:** posted menu rendered as one exported graphic (`<figure>` + `<img>` + figcaption)
- **Host-language construct:** `<img>` whose `src` is an inline-SVG `data:` URI (image of text), with a truthful transcribing `alt`
- **Locale / i18n:** en (US currency)
- **Failure mechanism:** normal-size image-of-text-for-look (in scope) rendered at 2.70:1, while the page's only live text passes

## Developer persona
A bistro owner asked their web person to "just use the menu we already have laid out." They
exported the nightly menu from the design file as a single image so the house script font would
render identically everywhere, and wrote an `alt` that transcribes every dish and price (so
1.1.1 is covered). They picked the soft sepia-on-parchment "because it reads like a real printed
carte," never contrast-checking it — it was an exported asset, not a CSS color token their
linter would inspect, and on their warm studio monitor it looked perfectly legible.

## Element / selector carrying the issue
`figure#menu img.menu` — the menu glyphs are SVG `<text>` rendered as image pixels
(`fill="#9c8e6f"`) on the parchment `#f3ead7` image background. There is no live text node, so no
CSS `color`/`background-color` pair exists for a checker to read or compute.

## Exact accessibility mechanism
For a low-vision diner (or anyone with reduced contrast sensitivity), the sepia-on-parchment
menu at 2.70:1 is hard to resolve; and because it is an image, the user cannot remap its colors
with a custom stylesheet or a reader mode the way they could with live text. A screen reader DOES
announce the menu (the `alt` transcribes it, so 1.1.1 passes), but the SC at issue is 1.4.3: the
*visual presentation of an image of text* must meet 4.5:1 for normal-size text. This image is an
image of text "done to replace text in order to get a particular look," so the
"picture-with-significant-other-content" exemption does not apply, and 2.70:1 is a failure. A
tester confirms it by eyedropping the least-contrast lettering pixel and the adjacent parchment
pixel with the Colour Contrast Analyser (the manual image-of-text path), getting 2.70:1 < 4.5:1.

## Size note (why 4.5:1 is the right threshold, and why size cannot rescue this)
The menu text is set NORMAL weight at `font-size="22"` inside a `760`-wide viewBox displayed at
`width:min(560px,92%)`. Measured rendered glyph size is **~16px on a wide desktop and ~9px on a
phone** — well below the large-scale thresholds (24px for normal, 18.5px for bold). So the text
is normal-scale and the **4.5:1** threshold applies; 2.70:1 fails it. As a deliberate
belt-and-suspenders against the large-text loophole, 2.70:1 is *also* below the **3:1**
large-scale threshold, so even a reviewer who wrongly judged the text large-scale would still
arrive at a failure. There is no pass interpretation.

## Expected ACT-style outcome
**failed** (SC 1.4.3). ACT rule afw4f7 "Text has minimum contrast" is INAPPLICABLE to the menu
(no live text node — the rule only applies to text in the accessibility tree), so an automated
pass of afw4f7 over the live header/intro/hours does not exonerate the page. The image of text is
in scope, is normal-size, and renders at 2.70:1 < 4.5:1, so the page fails.

## Why automated tools miss it
axe-core, WAVE, and Lighthouse compute contrast only for live text nodes (CSS `color` vs the
resolved background). The menu is image pixels, so there is no node to measure — the scanner
skips it silently and reports no contrast error. The `<img>` has a non-empty `alt`, so no alt
error fires either. No automated tool reads/OCRs text inside an image, samples its pixels,
judges its rendered size, or makes the human judgment that this particular image is an
image-of-text-for-look (in scope) versus an exempt picture with significant other content. The
classification, the size determination, and the eyedropper measurement are all human-only.

## Citation
**Reference:** WCAG 2.2 Understanding SC 1.4.3 (`wcag-understanding/contrast-minimum.html`)
> "This requirement applies to situations in which images of text were intended to be understood as text."

**Reference:** WCAG 2.2 Understanding SC 1.4.3 (`wcag-understanding/contrast-minimum.html`)
> "This exception is intended to separate pictures that have text in them from images of text that are done to replace text in order to get a particular look."

**Reference:** Trusted Tester v5.1.3 SC 1.4.3, Thresholds (`refs/trusted-tester/sc-1.4.3-contrast-minimum.md`)
> "Normal text: **4.5:1**; Large-scale text (≥18pt or ≥14pt bold): **3:1**."
