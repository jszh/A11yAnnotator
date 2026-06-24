# case-02 — Gallery exhibit: artwork description shredded by interleaved nav links (F49 case 2)

## Scenario
An exhibition page for "Thornbury Gallery." A layout `<table>` puts a left-hand nav column (Wall Texts, Audio Guide, Membership, etc.), then a tall vertical artwork image, then to its right a placard, an "About this work" heading, and a five-paragraph description of the painting. Visually the placard + heading + description form one coherent column of prose about the work. But the artwork/placard cells are `rowspan`-stretched while the nav links sit one-per-row in the leftmost column, so linearized the description's paragraphs are interleaved with "Audio Guide", "Membership", "Plan Your Visit"… — the single story about the painting is cut to ribbons by intervening links.

## Attribute tuple
- **content-domain:** arts / museum-gallery exhibition page
- **UI-component / pattern:** side navigation alongside an image + placard + long-form description, all in one layout table
- **host-language construct:** `<table role="presentation">` with `rowspan="8"` image cell and nav links in per-row leftmost cells
- **locale / i18n:** en-GB
- **failure-mechanism:** F49 case 2 — navigation links interleaved with a content sequence in the linearized cell stream, so the description cannot be read as one block

## Developer persona
A gallery's part-time webmaster inherited a 2000s-era table-based template and just swaps the artwork and copy each show. The template predates CSS layout; the nav was always the leftmost column and the artwork copy the right column. It looks right on the projector, so it has survived a decade of exhibitions untouched.

## Element / selector carrying the issue
`table.layout` — specifically the interleaving of `td.navcol nav.side a` links between the `td.desc` description paragraphs in source order. The `td.artwork[rowspan="8"]` and per-row nav cells are what force the interleave.

## Exact accessibility mechanism (what AT experiences, why it fails)
- A sighted user reads down the right column: placard, "About this work", then five flowing paragraphs — one continuous account of the painting.
- A screen reader linearizes the table top-to-bottom, full content of each cell. The order becomes: "Currents: Coastal Light" (link) → artwork → placard → "Wall Texts" (link) → "Audio Guide" (link) → "About this work" → "Artist Talks" (link) → description ¶1 → "Membership" (link) → description ¶2 → "Plan Your Visit" (link) → description ¶3 → and so on.
- The description is delivered in fragments separated by unrelated navigation links. The user cannot perceive it as the single meaningful sequence it visually is; each paragraph is orphaned from the next by a link, exactly as F49 describes the museum page.

## Expected ACT-style outcome
**failed** (SC 1.3.2 — F49: navigation links interleaved with content so the meaningful sequence cannot be presented when linearized).

## Why automated tools miss it
Every link has text and an href, the image carries a text alternative, the heading is a real `<h2>`, and `role="presentation"` correctly identifies the layout table. No attribute is missing or wrong, so axe/WAVE/Lighthouse report nothing. Recognizing that the description is one meaningful block that the linearized cell order severs with nav links is a semantic reading judgment over the 2-D structure — outside any automated checker.

## Citation
> "Because the navigation bar links are interleaved with the content describing the image, screen readers cannot present the content in a meaningful sequence corresponding to the sequence presented visually."
— wcag-techniques/failures/F49.html (Example: "A layout table that separates a meaningful sequence when linearized")

> "The image, placard text, Description heading, and text of the description form a meaningful sequence."
— wcag-techniques/failures/F49.html (Example: "A layout table that separates a meaningful sequence when linearized")

> "At a larger granularity, controlling the placement of blocks of content in an HTML document using layout tables may produce a rendering in which related information is positioned together visually, but separated in the content stream."
— wcag-techniques/general/G57.html (Description)
