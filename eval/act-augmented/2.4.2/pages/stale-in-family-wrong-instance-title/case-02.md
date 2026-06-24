# case-02 — Event gala: title carries last year's date (2025) on this year's (2026) event

## Scenario
A nonprofit's annual fundraising-gala page. To build the 2026 event the team **cloned
last year's page** and updated the body throughout — the SVG hero date banner
("SATURDAY · 14 MARCH 2026"), the "This year at a glance" date, the 2026 honoree, the
2026 ticket prices, the "Program for the evening of 14 March 2026", and the footer all
read **2026**. The `<title>`, however, still says **"Annual Hope Gala 2025 | Riverside
Children's Fund"** — the year token from the page it was cloned from. The title is
descriptive-shaped (right org, right recurring event name, plausible year); only the
year is stale, and the gala recurs annually so "2025" is a real sibling page in the set.

## Attribute tuple + developer persona
- **content-domain:** nonprofit / events & ticketing
- **UI component / pattern:** marketing hero with **image-of-text date rendered as inline SVG** + program schedule table
- **host-language construct:** `<title>` in a hand-edited HTML clone; date duplicated as designed SVG text with `role="img"` + `aria-label`
- **locale / i18n:** en, day-month-year
- **failure-mechanism:** annual template clone — body refreshed, `<title>` year left at the prior edition
- **developer persona:** A communications coordinator at a small charity duplicated the
  2025 gala HTML, did a careful find-and-replace in the visible body and the SVG banner,
  shipped it, and never looked at the `<head>` because the browser tab "looked right" at a
  glance. There is no CMS-generated title here — it is hand-authored markup.

## Element / selector carrying the issue
- `head > title` — `Annual Hope Gala 2025 | Riverside Children's Fund`
- Contradicted by the hero `svg[role="img"][aria-label="Saturday, 14 March 2026"]`,
  `dl.fast` (Date `Saturday, 14 March 2026`; "2026 Honoree"), `#prog`
  (`Program for the evening of 14 March 2026`), the CTA (`Reserve your seat for the 2026 Gala`),
  and the footer (`returns Saturday, 14 March 2026`).

## Exact accessibility mechanism (what AT experiences and why it fails)
A screen-reader user hears "Annual Hope Gala 2025" as the page name on tab announcement,
page load, in a tab/window list, in browser history, and in a bookmark. The body — and
the SVG banner's `aria-label`, which AT reads aloud — establish the event is **14 March
2026**. The title therefore names *last year's gala*. A blind donor scanning open tabs to
return to "this year's gala" page, or trusting the title to confirm which year's event
they are buying tickets for, is told the wrong year by the single most prominent
orientation cue. The risk is concrete: reserving against the belief it is the 2025 event,
or assuming the page is an archived past event and closing it. Note the SVG `aria-label`
is *correct* — the defect is isolated to the `<title>`, so AT receives two contradictory
year signals and the authoritative-for-orientation one (the title) is the wrong one.

## Why automated tools cannot detect it
axe-core, WAVE and Lighthouse confirm a `<title>` is present and non-empty (ACT 2779a5)
and stop. "Annual Hope Gala 2025 | Riverside Children's Fund" is a valid, non-empty,
unique, organization-qualified, on-topic title — exactly the well-formed shape G88 and
G127 recommend. A keyword-overlap tool passes it because the title and body share
"Annual Hope Gala", "Riverside Children's Fund", and a four-digit year. No automated
check reconciles the title's year against the body's date (which is partly conveyed *as
text inside an SVG*), so none can tell that "2025" should read "2026". Only a human (or
model) reading the body's true date catches that the title names the prior edition.

## Expected ACT-style outcome
**failed** (SC 2.4.2, technique F25 — title does not identify the contents of this page;
within an annually recurring set it names a different edition).

## CITATION

> **Reference:** WCAG Techniques — F25 (Failure of Success Criterion 2.4.2 due to the title of a web page not identifying the contents)
> File: `wcag-techniques/failures/F25.html`
>
> "This describes a failure condition when the web page has a title, but the title does not identify the contents or purpose of the web page."

> **Reference:** WCAG Techniques — G88 (Providing descriptive titles for web pages)
> File: `wcag-techniques/general/G88.html`
>
> "The title of each web page should: Identify the subject of the web page … A website that permits editions from different dates to be viewed titles its web page, \"National News, Front Page, Oct 17, 2005\"."

> **Reference:** Trusted Tester v5.1.3 — SC 2.4.2 Page Titled, Test 12.B
> File: `refs/trusted-tester/sc-2.4.2-page-titled.md`
>
> "The Page Title accurately identifies the contents or purpose of the web page, AND if the web page is part of a set of web pages, the Page Title accurately distinguishes the web page from other pages in the web site."
