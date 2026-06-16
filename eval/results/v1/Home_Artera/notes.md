# Home_Artera evaluation notes

## Screenshot capture failure (all shots black)
- Every element screenshot (el1.png through el21.png, including all _focus.png variants) renders as a near-black image. The page appears to capture with an extremely dark or fully opaque overlay, likely from the cookie consent banner (cmplz-cookiebanner) which occupies the lower viewport and may darken the entire page during capture. This affected all visual confirmation checks.
- As a result, all focus-visibility skill verdicts for elements where `method='real-tab-diff'` with `visibleDiffPct=0` (el1–el3, el6, el10, el13–el15, el18) and `method='computed-only'` (el4, el5, el9, el16, el17) are marked PARTIAL because the visual diff could not be confirmed from the shot pair — only computed CSS properties are available.
- The one definite REPRODUCED focus failure (hamburger button, el11) is confirmed by driver evidence (`indicatorPresent:false`, `outlineOrShadow:false` in tabWalk) independent of visual shots.

## Structural issues worth noting
- `<header role="main">` — the page uses the site header element as the main landmark. This means the page has no real `<main>` element. The `header` element's implicit role is `banner`, so adding `role="main"` overrides it with an invalid combination (axe: aria-allowed-role). There is also no separate `<main>` or `[role=main]` landmark outside the header.
- Heading order: 8 H3 elements appear inside a nav that sits in the DOM before the first H1. This makes the heading outline start at H3 level, then jump up to H1. The nav H3 items appear to be section labels within a mega-nav or slider. Whether these are truly in the accessible heading tree or suppressed by the nav context requires further investigation.
- Two `<footer>` elements without `role=contentinfo` suppression — both expose as `contentinfo` landmarks causing a duplicate (axe: landmark-no-duplicate-contentinfo).
- `nav.image-controls` has `role="Capabilites"` (typo) — an invalid ARIA role (axe: aria-roles). This nav contains the 8 unnamed capability image links.

## Unnamed links — systemic issue
- 8 capability carousel nav links (cape1–cape8) have no text, no aria-label, and the background images are CSS `background-image` (not `<img alt="...">`). All 8 are unnamed; only 2 (cape5 and cape6) were sampled.
- Facebook social icon link is unnamed. LinkedIn link has SVG CSS text `.cls-2{fill:#fff}` leaking as accessible name — this is the CSS text content from a `<style>` element inside the SVG being read as text, making the LinkedIn link name `.cls-2{fill:#fff}` which is worse than unnamed.

## LinkedIn link specific issue
- SR speech for LinkedIn link: `link, .cls-2{fill:#fff}` — the inline `<style>` tag inside the SVG is being read as the link name. This should be flagged as a name-role-state REPRODUCED failure (4.1.2 / 2.4.4 — the computed name is meaningless CSS). Not captured as a sampled element (axe flags .LinkedIn under link-name).

## Forms
- No forms found on the page (`drive.forms = []`). No form evaluation needed.

## Reflow
- Passes cleanly at 320px (scrollW=320=clientW, bodyLen=2711).

## Target size — systemic issue
- All footer nav links render at approximately 15px height. There are 32+ footer nav link items all below the 24px WCAG 2.2 AA target size minimum. Cookie consent links in the banner are also only 15px tall. The prev/next carousel buttons ('< ' and '>') are only 15px wide.

## Pixel contrast tool note
- Pixel contrast for the "Accept" button returned 1.16:1 because the dark/black screenshot background confused the segmentation algorithm (text occupied only 1.2% of pixels). Computed contrast (black #000 on white #FFF = 21:1) was used instead, which is reliable for this solid-background element.
