# case-01 — Two hotels' identical "Map / Photos / Book now" links pooled into one shared bar, headings no longer the link context (FAIL)

## Scenario
A convention committee lists two partner hotels (Royal Palm Hotel, Hotel Three Rivers). This is the
canonical H80 "blocks of information on hotels" shape — except the author refactored the layout. Instead
of each hotel heading being followed by its own `<nav>` of links, the two descriptions sit in the top
half of the page and ALL of the booking-resource links were pooled into a single "Quick links" bar at the
bottom. The bar contains two identical sets of `Map / Photos / Book now`, separated only by a plain-text
list item ("Royal Palm", "Three Rivers"). The repeated-link-set-under-different-headings pattern is the
canonical case where context is the only differentiator — and here that differentiator has been severed.

## Attribute tuple
- **Content domain:** travel / hotel booking (conference room blocks)
- **UI component / pattern:** repeated per-item link set (Map/Photos/Book now) — the H80 hotel-block shape
- **Host-language construct:** flat `<ul aria-labelledby>` pointing at a generic "Quick links" heading; per-hotel groupings are `<li class="group-label">` plain text, not headings
- **Locale / i18n:** en-US
- **Failure mechanism:** the preceding heading that should carry purpose (the hotel name) is no longer the link's context; the links are grouped under an unrelated "Quick links" heading

## Developer persona
A front-end dev was told by design to "consolidate the call-to-action clutter into one tidy quick-links
bar at the bottom so the descriptions read cleanly." They moved every link into one `<ul>`, added bold
text sub-labels to keep the visual grouping, and even wired `aria-labelledby` to the bar's heading so the
linter would not complain about an unlabeled list. They never considered that a screen-reader user pulling
up the links list now hears "Map, Photos, Book now, Map, Photos, Book now" with the hotel name available
only as a sibling text node the link does not reference.

## Element / selector carrying the issue
`.resource-bar ul > li > a` — specifically the second triad (`a[href="/hotels/three-rivers/map"]`,
`/gallery`, `/reserve`) and the first triad. The `<li class="group-label">` text nodes ("Royal Palm",
"Three Rivers") are NOT programmatically determined link context for the anchors that follow them.

## Exact accessibility mechanism
Per WCAG, programmatically determined link context is limited to text in the **same sentence, paragraph,
list item, or table cell** as the link (or an associated `aria-labelledby`/`aria-describedby`). Each "Map"
anchor lives in its own `<li>`; the "Royal Palm" / "Three Rivers" labels live in **separate** `<li>`
elements, so they are not in the link's list item and are not programmatically associated. The `<h2>` hotel
names are real headings, but they are no longer the *preceding* grouping heading of these links — the links'
nearest grouping heading is "Quick links". A screen-reader user navigating by link, or pulling up the links
dialog, hears two indistinguishable "Map / Photos / Book now" triads. They cannot determine *which* hotel's
map a given "Map" link opens. This is exactly the H80 failure mode: the link text combined with its actual
preceding heading ("Quick links") does NOT describe the purpose, and the heading that would ("Royal Palm")
is not the link's context.

## Expected ACT-style outcome
**failed** (SC 2.4.4 — the purpose of each "Map" / "Photos" / "Book now" link cannot be determined from the
link text together with its programmatically determined link context; the disambiguating hotel name is not
in the link's list item nor programmatically associated).

## Why automated tools miss it
Every link has non-empty, descriptive-looking text ("Map", "Photos", "Book now"), so c487ae / axe
`link-name` passes. The `<ul>` even has a valid `aria-labelledby` resolving to a real heading, so no
unlabeled-region warning fires. Two links named "Map" go to two different URLs — but they are *supposed* to
(they are different maps), which is legitimate, so a same-name/different-URL heuristic cannot decide whether
this is a real failure. Judging that the two triads are mutually indistinguishable, and that the hotel name
in an adjacent `<li>` is not the link's programmatic context, requires reading the page's meaning and the
H80 grouping rule — no static checker can make that call.

## Citation
**Reference:** WCAG Technique H80 — Identifying the purpose of a link using link text combined with the preceding heading element (`wcag-techniques/html/H80.html`)
> "The information for each hotel consists of the hotel name, a description and a series of links to a map, photos, directions, guest reviews and a booking form."
> "Find the heading element that precedes the link" / "Check that the text of the link combined with the text of that heading describes the purpose of the link."

**Reference:** Trusted Tester v5.1.3 — SC 2.4.4 Link Purpose (`refs/trusted-tester/sc-2.4.4-link-purpose.md`)
> "'Programmatically determined link context' is **limited** to same sentence/paragraph/list-item/table-cell or associated table header — not arbitrary nearby text."
