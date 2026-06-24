# case-05 — CSS flex columns make the product heading *visually* above its links, but in the DOM the links have no preceding heading (FAIL)

## Scenario
A hardware vendor compares two sensor variants (S2 Standard, S2 Pro). Each product offers identical
download links: "Datasheet (PDF)", "CAD model (STEP)", "Firmware". Visually it is a clean two-column compare
table — each product's `<h2>` sits at the top of its column with that product's links directly beneath. But
the layout is built with CSS grid: in DOM/source order the author placed **both** headings first (`#h-std`,
`#h-pro`) and then **both** link blocks (`#l-std`, `#l-pro`), and used `grid-column`/`grid-row` placement to
paint them as two columns (heading-1 above links-1, heading-2 above links-2). This is the F63-adjacent / visual-only boundary called out in the aspect: the heading is
genuinely above the link *visually*, but it is not the link's preceding heading in the DOM — it is in a
sibling container, so it is not the link's programmatically determined context.

## Attribute tuple
- **Content domain:** hardware / technical product documentation (machine-vision sensors)
- **UI component / pattern:** two-product spec comparison "columns" with per-product download links
- **Host-language construct:** CSS grid columns; headings and link blocks are separate grid items in one container, source order all-headings-then-all-links, visually re-paired into columns by `grid-row`/`grid-column`
- **Locale / i18n:** en-US
- **Failure mechanism:** visual-only conveyance — spatial layout implies the heading governs the links, but no DOM/heading/ARIA association exists; the heading is not the link's preceding heading

## Developer persona
A developer who built the comparison with a CSS-grid mindset: "drop all the headings and all the link blocks
into one grid, then place them by row/column so each heading lands above its product's links." They reasoned
visually and never read the resulting DOM/source order aloud.
Because the rendered page looks exactly like a correct H80 layout, they assumed the heading-link association
was real. They did not realise that for assistive tech the links appear in a block with no heading in front
of them, and that the two link blocks are byte-identical ("Datasheet (PDF)" twice, etc.).

## Element / selector carrying the issue
`.links-block a` (`#l-std a`, `#l-pro a`) — the six download links. The intended carriers (`#h-std` "S2
Standard", `#h-pro` "S2 Pro") precede the links *visually* (one above each column) but in DOM/source order
both `<h2>` headings come before *both* link blocks; the heading immediately preceding the link blocks is
"S2 Pro", and the two `.links-block` containers are not distinguished by any heading or label that the link
blocks contain.

## Exact accessibility mechanism
H80 says to "find the heading element that precedes the link" — in DOM order the headings come first (both
of them, together) and then a links container with no heading inside it, so the heading immediately
*preceding* the "Datasheet (PDF)" links is "S2 Pro" for BOTH blocks (the last heading before the links),
which is wrong for the first block and ambiguous for the second. A screen reader reading top-to-bottom hears
"S2 Standard … S2 Pro …" then six links: "Datasheet (PDF), CAD model (STEP), Firmware v3.4, Datasheet (PDF),
CAD model (STEP), Firmware v4.1" — with no heading separating the two product groups. The visual column
alignment that tells a sighted user which datasheet is which is conveyed purely by CSS position and is not
available programmatically. Two "Datasheet (PDF)" links are indistinguishable; the spatial grouping is
visual-only. The link text combined with its (mis-ordered / absent) preceding heading does not convey
which product the datasheet is for.

## Expected ACT-style outcome
**failed** (SC 2.4.4 — the purpose of the duplicated "Datasheet (PDF)" / "CAD model (STEP)" links is not
determinable from the link text plus a programmatically determined preceding heading; the disambiguating
product context is conveyed only by CSS-driven visual column position).

## Why automated tools miss it
Every link has clear non-empty text, so c487ae / axe `link-name` passes. The headings are real `<h2>`
elements in a valid order, so heading-structure rules pass. There is no ARIA error. The failure exists only
when you compare the *visual* (rendered, CSS-positioned) layout against the *DOM/AT reading order*: a tool
analysing the static DOM sees headings-then-links and cannot tell that the rendered columns re-pair them, nor
that two "Datasheet (PDF)" links are visually-but-not-programmatically tied to different products. Detecting
this requires a human to see the rendered columns AND read the DOM order and notice they disagree.

## Citation
**Reference:** WCAG Technique F63 — Failure due to providing link context only in content that is not related to the link (`wcag-techniques/failures/F63.html`)
> "This describes a failure condition when the context needed for understanding the purpose of a link is located in content that is not programmatically determined link context."
> "If the user must leave the link to search for the context, the context is not programmatically determined link context and this failure condition occurs."

**Reference:** WCAG 2.2 Understanding — Link Purpose (In Context) (`wcag-understanding/link-purpose-in-context.html`)
> "This can be achieved by putting the description of the link in the same sentence, paragraph, list item, or table cell as the link ... because these are directly associated with the link itself."
