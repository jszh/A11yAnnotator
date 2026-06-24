# case-04 — Listing 2's nav `aria-labelledby` still points at Listing 1's heading; "Floor plan" announces the wrong property (FAIL)

## Scenario
A real-estate site lists two new properties. Both cards use the H80 hotel-block pattern *correctly in form*:
an `<h2>` names the property and the per-listing `<nav>` of "Floor plan / Map / Book viewing" is associated
to that heading via `aria-labelledby`. But the second card was copy-pasted from the first and the developer
forgot to update one attribute value: the second `<nav aria-labelledby="listing-maple">` still references
the FIRST listing's heading id. So the association mechanism *is* present and *does* resolve — to the wrong
property. This is the present-but-misleading variant: the heading is wired as the carrier, but it is the
wrong heading, so "Floor plan" inside the Birch Lane card is announced as belonging to "14 Maple Court".

## Attribute tuple
- **Content domain:** real estate / property listings
- **UI component / pattern:** per-listing `<nav>` of identical resource links, `aria-labelledby` to the listing heading (H80 done as ARIA grouping)
- **Host-language construct:** `<nav aria-labelledby="...">` whose IDREF resolves to the wrong `<h2>` (stale duplicated value)
- **Locale / i18n:** en-US, USD pricing
- **Failure mechanism:** the programmatic association points at the wrong heading — purpose is present but misleading, tying the links to the wrong property

## Developer persona
A developer building card components by duplicating the first working card and editing the visible text and
hrefs. They updated `<h2>` text, the id, the price, the blurb, and all three hrefs in the second card — but
overlooked the `aria-labelledby` on the `<nav>`, which kept the original `listing-maple` value. Because the
*visible* layout is perfect and the heading sits right above its own nav, nothing looked wrong in the
browser; the broken association is invisible without inspecting the accessibility tree.

## Element / selector carrying the issue
`section.listing:nth-of-type(2) > nav.listing-links[aria-labelledby="listing-maple"]` — the second card's
nav. Its three links (`a[href="/listings/birch-lane/floorplan"]`, `/map`, `/viewing`) inherit the wrong
group label. The correct target would have been `id="listing-birch"`.

## Exact accessibility mechanism
`aria-labelledby="listing-maple"` makes the second `<nav>`'s accessible name "14 Maple Court — Old Town".
When a screen-reader user enters that navigation region, the SR announces the group as the Maple Court
property, even though the links actually go to Birch Lane URLs and the `<h2>` directly above reads "8 Birch
Lane". A user reviewing properties by navigation landmark, or relying on the group name to know which
property a "Book viewing" link books, is told the wrong property. The link text combined with its
*programmatically associated* heading describes the WRONG purpose — strictly worse than no association,
because the user is actively misled into thinking they are booking a viewing for Maple Court. The H80
mechanism (link text + its heading context) is in place but produces an incorrect, misleading result.

## Expected ACT-style outcome
**failed** (SC 2.4.4 — for the second listing's links, the link text together with its programmatically
determined link context conveys an incorrect purpose: the wrong property; the user cannot correctly
determine the link's purpose).

## Why automated tools miss it
The `aria-labelledby` IDREF is valid and resolves to a real, non-empty heading element, so accname computes
a perfectly valid non-empty accessible name — c487ae, axe `link-name`, and aria-reference integrity checks
all pass. There is no broken/dangling reference and no duplicate-id error (the two headings have distinct
ids; the nav simply points at the wrong existing one). Detecting the fault requires comparing the announced
group name ("Maple Court") against the links' actual destinations and the visible `<h2>` ("Birch Lane") and
recognising the semantic mismatch — a meaning-level cross-check no static checker performs.

## Citation
**Reference:** WCAG Technique H80 — Identifying the purpose of a link using link text combined with the preceding heading element (`wcag-techniques/html/H80.html`)
> "&lt;nav aria-labelledby=\"royal-heading\"&gt; ... &lt;li&gt;&lt;a href=\"royal-palm-hotel_map.html\"&gt;Map&lt;/a&gt;&lt;/li&gt;"
> "Check that the text of the link combined with the text of that heading describes the purpose of the link."

**Reference:** WCAG 2.2 Understanding — Link Purpose (In Context) (`wcag-understanding/link-purpose-in-context.html`)
> "Alternatively, authors may choose to use an ARIA technique to associate additional text on the page with the link."
