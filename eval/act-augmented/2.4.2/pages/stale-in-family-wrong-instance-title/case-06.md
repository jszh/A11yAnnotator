# case-06 — Transit timetable: Saturday-schedule title MATCHES the Saturday body (PASS boundary)

## Scenario
A municipal transit timetable for one route. Timetables ship as a **set of near-identical
sibling pages** — Weekday, Saturday, Sunday & Holiday — which is exactly the situation
that breeds stale copy-paste titles (the failing cases in this aspect). Here the author
got the specific instance **right**: the `<title>` reads "Route 12 Riverside — Saturday
Schedule | Metro Transit", and the body is unambiguously the **Saturday** schedule for the
same route — the breadcrumb current page, the `<h1>`, the day-selector control (Saturday
marked `aria-current="page"`), the service note ("Saturday service runs every 30
minutes…"), the table `<caption>` ("Saturday departures — Route 12 Riverside"), the
"All times are Saturdays only" line, and the footer all say **Saturday / Route 12
Riverside**. Title and body share the route family and timetable vocabulary AND agree on
the one critical identifier (the service day). This is the in-family **match** that the
five failing cases are contrasted against.

## Attribute tuple + developer persona
- **content-domain:** municipal transit schedule
- **UI component / pattern:** day-of-service selector (tab-style nav) + departures timetable + breadcrumb
- **host-language construct:** `<title>` correctly composed as `Route + day + agency`, mirroring G88/G127 set conventions
- **locale / i18n:** en, 12-hour clock
- **failure-mechanism:** NONE — this is the correctly-titled sibling; included to sharpen the aspect boundary
- **developer persona:** A transit-agency web author maintaining the Weekday/Saturday/Sunday
  trio updated each sibling's `<title>` to name its own service day (as the agency style
  guide requires), so the Saturday page's title genuinely identifies the Saturday page and
  distinguishes it from its weekday/Sunday siblings.

## Element / selector carrying the issue
- `head > title` — `Route 12 Riverside — Saturday Schedule | Metro Transit` (CORRECT)
- Corroborated by `main h1#sched-h1` (`Route 12 Riverside — Saturday Schedule`),
  `nav.crumbs [aria-current="page"]` (`Saturday`), `nav.daytabs a[aria-current="page"]`
  (`Saturday`), `.svc-note` (`Saturday service…`), `table > caption` (`Saturday
  departures — Route 12 Riverside`), the "Saturdays only" line, and the footer.

## Exact accessibility mechanism (what AT experiences and why it passes)
A screen-reader user hears "Route 12 Riverside — Saturday Schedule | Metro Transit" on
tab announcement, page load, in a tab/window list, in history and in bookmarks. The body
confirms the page is the Saturday schedule for Route 12. The single identifier that
distinguishes this page from its sibling timetables — the service day — is the same in the
title and throughout the body. A blind rider juggling the weekday and weekend timetables
in separate tabs can rely on the announced title to pick the right one; the title
accurately identifies this page and distinguishes it within the set. No F25 failure: the
title is present AND identifies the contents AND distinguishes the page among siblings.

## Why this is the right boundary case (and why automation is irrelevant here)
This page is structurally and lexically a close cousin of the failing cases (same
"sibling pages with one differing identifier" family, same shared vocabulary between title
and body) — but the identifier **matches**. Automated tools (axe/WAVE/Lighthouse) would
report PASS here for the same shallow reason they wrongly PASS the failing cases: a
present, non-empty title (ACT 2779a5). The distinction that matters — whether the title's
service day agrees with the body's — is invisible to them. This case proves the human (or
model) judgment under test is "does the title's specific instance match the body's?", not
"does a title exist?": the correct verdict here is PASS precisely because the cross-check
succeeds, whereas in case-01 through case-05 the identical cross-check fails.

## Expected ACT-style outcome
**passed** (SC 2.4.2 — the title identifies the contents of the page and distinguishes it
within its set of sibling timetables).

## CITATION

> **Reference:** WCAG Techniques — G88 (Providing descriptive titles for web pages)
> File: `wcag-techniques/general/G88.html`
>
> "The title of each web page should: Identify the subject of the web page … A website that permits editions from different dates to be viewed titles its web page, \"National News, Front Page, Oct 17, 2005\"."

> **Reference:** Trusted Tester v5.1.3 — SC 2.4.2 Page Titled, Test 12.B (Evaluate Results — PASS if ALL true)
> File: `refs/trusted-tester/sc-2.4.2-page-titled.md`
>
> "The Page Title accurately identifies the contents or purpose of the web page, AND if the web page is part of a set of web pages, the Page Title accurately distinguishes the web page from other pages in the web site."

> **Reference:** WCAG 2.2 Understanding — Page Titled (Intent)
> File: `wcag-understanding/page-titled.html`
>
> "The intent of this success criterion is to help users find content and orient themselves within it by ensuring that each web page has a descriptive title."
