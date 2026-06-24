# case-04 — Japanese transit route-detail page titled only the agency name

## Scenario
The weekday timetable / route-detail page for one specific bus route — 32系統 みなと循環線
(Route 32, the "Minato Loop") — on the Sakurai City Transit Bureau (桜井市交通局) site.
The route picker lists sibling routes (11, 21, **32**, 45, 58), and the `<h1>`, direction
tablist, and timetable table make the page specifically Route 32. The `<title>` is only
the agency name **「桜井市交通局」** — the identical string carried by every route page and
the agency home page. The title names the agency, not this route, so it cannot distinguish
Route 32's timetable from Route 11's.

## Attribute tuple
- **Content domain:** municipal transit schedule / civic services
- **UI component / pattern:** route chip-nav + tablist (direction) + timetable data table with `scope`
- **Host-language construct:** `<title>` carrying the agency-name-only string; `lang="ja"`
- **Locale / i18n:** Japanese (CJK) — body fully localized; the defect is set-distinguishing, not translation
- **Failure mechanism:** F25 — one site/agency name reused as the title of every route page

## Developer persona
A municipal IT contractor built the route pages from one PHP include. The shared header
partial sets `<title><?= $agencyName ?></title>` and the contractor intended to append
the route name later (`. ' — ' . $route->name`) but the ticket was deprioritised. The
visible `<h1>` is route-specific (it reads `$route->name`), so on screen the pages look
distinct; only the document title stayed agency-only across all routes.

## Element / selector carrying the issue
`head > title` (value: `桜井市交通局`). The route identity is in `main h1`, `.routebar
a[aria-current="page"]`, and the table `<caption>` — never surfaced into the title.

## Exact accessibility mechanism
A commuter using a Japanese screen reader (e.g. NVDA with a Japanese voice, or VoiceOver)
who opens Route 32 and Route 45 timetables in two tabs to compare departures hears
「桜井市交通局」 announced for both — the title gives no way to tell which tab is which
route. Browser history and bookmarks for every route collapse to the same agency name.
The visible `<h1>` distinguishes the route on screen, but `<title>` — the SC's cross-page
orientation cue — does not.

## Expected ACT-style outcome
**failed** (SC 2.4.2). Non-empty title present (2779a5 passes) but it is the site/agency
name only, identical across the route set, and does not distinguish this page
(fails c4a8a4 / Trusted Tester 12.B / F25).

## Why automated tools miss it
The `<title>` is present and non-empty, so axe/WAVE/Lighthouse pass the presence check.
They cannot parse the Japanese body to learn this is the Route 32 timetable, and they have
no sibling corpus to notice every route page carries the same agency name — so the
distinguish-within-set failure is invisible to them.

## Citation
**Reference:** WCAG Technique F25 (`wcag-techniques/failures/F25.html`)
> "A site generated using templates includes the same title for each page on the site. So the title cannot be used to distinguish among the pages."

**Reference:** Trusted Tester v5.1.3 (`refs/trusted-tester/sc-2.4.2-page-titled.md`)
> "If the web page is part of a set of web pages, the Page Title accurately distinguishes the web page from other pages in the web site."
