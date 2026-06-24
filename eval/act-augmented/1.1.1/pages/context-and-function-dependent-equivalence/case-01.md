# case-01 — Newspaper front-page thumbnail link whose alt describes the cover photo, not the publication

## Scenario
A "Today's Front Pages" news aggregator (NewsKiosk) renders a grid of newspaper
front-page thumbnails. Each thumbnail is wrapped in an `<a>` that links to that
newspaper's **homepage**. The first card's image is the front page of *The Riverside
Courier*, and its `alt` accurately describes the large photograph printed on that front
page: `"Front page photo of a flooded town square under grey skies"`. That is a true,
descriptive caption of the masthead image in isolation — but the link's purpose is to
open *The Riverside Courier*, and the alt never names the publication. A screen-reader
user navigating the links list hears a weather-photo description and cannot tell which
newspaper they are about to open. The second card is correctly labelled (`alt="The Harbor
Gazette"`) for contrast.

## Attribute tuple
- **Content domain:** news / media aggregation
- **UI component / pattern:** linked thumbnail card grid (image is the sole content of the link)
- **Host-language construct:** `<a href>` wrapping a single `<img>` (inline SVG data URI)
- **Locale / i18n:** en
- **Failure mechanism:** alt describes the depicted image (the cover photo) instead of serving the link's purpose (the publication name)

## Developer persona
An agency front-end developer built the aggregator and wired each card's alt from a
"describe the image" content brief handed to a junior copywriter. The copywriter dutifully
wrote a vivid description of each cover photo — exactly what you would do for an editorial
photo caption — without being told the thumbnails are *links to homepages*. The result is
descriptive, non-empty alt that satisfies every "images need good alt" review, while
silently failing the linked-thumbnail rule.

## Element / selector carrying the issue
`.grid .card:first-child a[href*="riversidecourier"] > img[alt^="Front page photo"]` — the
link's accessible name is computed entirely from that image's alt, so the link is named
"Front page photo of a flooded town square under grey skies" instead of "The Riverside
Courier".

## Exact accessibility mechanism
Because the `<img>` is the only content of the `<a>`, the image's `alt` becomes the link's
accessible name (per accname). A screen-reader user pulling up the list of links hears the
photo description for the destination, not the publication name; two different newspapers
whose covers happen to share a weather photo would be indistinguishable by link name. The
image's pixels genuinely look like a flooded-town front page, so this is not an identity
mismatch — the alt is *correct about the depiction* yet *wrong for the function*. The
second card demonstrates the fix: its alt is the publication name, which is what the link
does.

## Expected ACT-style outcome
**failed** (SC 1.1.1, link-purpose / G94 equivalence-in-context). The text alternative does
not serve the same purpose as the non-text content in this context: the purpose is to open
*The Riverside Courier*, and that information is absent from the alternative. qt1vmo and
generic "descriptive alt" checks would call it a pass because the alt does describe the
image.

## Why automated tools miss it
Every `<img>` has a non-empty, genuinely descriptive `alt`, so axe-core/WAVE/Lighthouse pass
`image-alt`; every `<a>` therefore has a non-empty accessible name, so `link-name` passes
too. No automated tool resolves the link's destination (a newspaper homepage) or knows the
established convention that a linked front-page thumbnail must be named for the publication
it opens. Deciding that "a flooded town square" fails as the name of a link to *The
Riverside Courier* requires understanding the link's purpose-in-context — human semantic
judgment.

## Citation
**Reference:** WCAG 2.2 Understanding Non-text Content (`wcag-understanding/non-text-content.html`)
> "A thumbnail image of the front page of a newspaper links to the home page of the \"Smallville Times\". The text alternative says \"Smallville Times\"."

**Reference:** WCAG Technique H30 (`wcag-techniques/html/H30.html`)
> "When an image is the only content of a link, the text alternative for the image describes the unique function of the link."
