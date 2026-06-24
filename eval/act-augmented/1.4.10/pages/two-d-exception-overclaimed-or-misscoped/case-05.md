# case-05 — Promo "banner" is really styled non-wrapping text claimed exempt as a graphic (wrong exception claim)

## Scenario
A public-library "Summer Reading Challenge" page has a bold orange promotional banner with a giant
headline and tagline. It looks like a graphic, and the author treats it as an exempt fixed-size
"graphic/media". But it is NOT an image — it is live, selectable, CSS-styled HTML text set
`white-space: nowrap` at a fixed `width: 1100px`. Because the text refuses to wrap, it forces a
page-level horizontal scrollbar at 320 CSS px, even though the article prose below reflows fine. The
exemption claim is wrong: styled text that merely looks banner-like is not a fixed-dimension graphic and
must reflow. This is the long-tail "I called it a graphic, so it's exempt" over-claim.

## Attribute tuple
- **Content domain:** public library / civic community programme
- **UI component / pattern:** promotional hero banner (styled text mistaken for a graphic)
- **Host-language construct:** `div` with `white-space:nowrap` + fixed `width:1100px` holding live text
- **Locale / i18n:** en-GB
- **Failure mechanism:** non-excepted styled text mis-claimed as an exempt graphic/media, so it 2D-scrolls

## Developer persona
A library volunteer built the page and wanted a punchy header "like the posters". Rather than make an
image (they had no design tool), they styled a big headline with CSS gradients and a single nowrap line
so it "stayed on one row like the printed banner." When the horizontal scrollbar was raised at 400% zoom,
they answered "banners are graphics and graphics are exempt from reflow" — not realizing it was plain
text the whole time, with no `<img>` and no `role="img"`.

## Element / selector carrying the issue
`div.promo` — the `white-space: nowrap; width: 1100px` text banner. It contains `.big` and `.sub` spans
of real text and forces page-level horizontal overflow.

## Exact accessibility mechanism
At 320 CSS px a low-vision user is forced to scroll horizontally to read the headline and tagline — text
that has no fixed-dimension requirement and would wrap perfectly into the narrow column. The article
prose below already reflows (`max-width: 65ch`), so the page's 2D scroll is caused solely by the
mis-classified "exempt" banner text. The 1.4.10 exception is for content that genuinely requires 2D
layout (tables, maps, graphics, video); CSS-styled headline text is not such content, so the banner must
reflow. The page therefore fails because non-excepted text does not adapt to the viewport.

## Why automated tools miss it
There is no `<img>`, no `role="img"`, no missing alt — nothing a linter flags. The banner is real text,
so a checker cannot OCR or measure an image, and it cannot decide whether the overflowing region is
"text that should wrap" or "a legitimately fixed-size graphic." A scanner has no model of the 1.4.10
exception's content-meaning test. Recognizing that this banner is styled text whose exemption claim is
invalid — versus case-07's genuine fixed-dimension video, which IS exempt — is exactly the human
semantic/visual judgment the SC turns on. axe/WAVE/Lighthouse also do not render at 320px to see the
overflow.

## Expected ACT-style outcome
**failed** (SC 1.4.10). The "banner" is non-excepted styled text and does not reflow.

## Citation
**Reference:** Understanding SC 1.4.10 Reflow (`wcag-understanding/reflow.html`)
> "Not all content can fully reflow into smaller viewports without degradation of information or functionality. As already mentioned, this includes tabular data, graphics, maps, presentations, interfaces that require persistent toolbars for use, and two-dimensional layouts where consistent orientation to related sections of content is important for understandability, functionality, or both."

**Reference:** Understanding SC 1.4.10 Reflow (`wcag-understanding/reflow.html`)
> "The most basic form of reflow occurs on a text-only page. By default, a long line of text will wrap to fit within the available viewport."

**Reference:** Understanding SC 1.4.10 Reflow (`wcag-understanding/reflow.html`)
> "This criterion requires non-excepted sections of content that are written in horizontal languages reflow when narrowed to a width equivalent to 320 CSS pixels."
