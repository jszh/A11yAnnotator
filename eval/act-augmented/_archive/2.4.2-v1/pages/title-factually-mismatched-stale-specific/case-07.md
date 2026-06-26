# case-07 — Event page titled with a stale campaign (wrong season and date)

## Scenario
A seasonal retail-event landing page. The `<title>` reads **"Spring Sale — March 15 |
Brookline Outfitters"** — last quarter's campaign, never updated when the page was reused
for the next event. The body is entirely the **Summer Sale on June 20, 2026**: the hero
`<h1>` ("Summer Sale"), the date line ("Saturday, June 20, 2026"), a countdown card
targeting a machine-readable `<time datetime="2026-06-20T09:00">`, an "About the Summer
Sale" section, a details list ("Event: Summer Sale 2026", "Date: Saturday, June 20,
2026"), an event card headed "Summer Sale — June 20, 2026", and an RSVP button ("RSVP
for the June 20 Summer Sale"). The body even states "This is the Summer Sale; our Spring
Sale wrapped up back in March." The title shares the store's "Sale" vocabulary and is
descriptive-shaped, but names the wrong season *and* the wrong date.

## Element / selector carrying the issue
- `head > title` — `Spring Sale — March 15 | Brookline Outfitters`
- Contradicted by `header.promo h1` (`Summer Sale`), `header.promo .when`
  (`Saturday, June 20, 2026`), `.countdown time[datetime="2026-06-20T09:00"]`,
  `dl.details dd` (`Summer Sale 2026` / `Saturday, June 20, 2026`), and `#card-h`
  (`Summer Sale — June 20, 2026`).

## Exact accessibility mechanism (what AT experiences and why it fails)
Promotional/event pages are reused across campaigns, so the title's job is to say *which*
event and *when*. AT announces "Spring Sale — March 15"; a user scanning for the summer
event, or returning via a bookmark/tab, is told this is the March spring sale. If they
trust the announced title without reading on, they may believe they missed the event
(March already passed) and leave, or plan around the wrong date. The body is the June 20
Summer Sale, so the title actively misinforms about the page's defining specifics (event
identity and date). The title does not identify the contents of this page. Limb-2
(descriptiveness) failure per F25.

## Why automated tools cannot detect it
"Spring Sale — March 15 | Brookline Outfitters" is non-empty, unique, well-formed, and
fully descriptive in shape — it passes 2779a5 and any descriptiveness heuristic, and it
shares the body's "Sale"/store vocabulary so overlap checks are satisfied. Notably, the
body contains a *machine-readable* `<time datetime="2026-06-20">`, so a tool could in
principle read the true date — but no accessibility checker is built to extract the
event's date/identity and compare it against the free-text claim in `<title>` ("Spring
Sale", "March 15"). There is no rule that says "the title's season/date must match the
body's event facts." Catching it requires reading the event, extracting its salient
specifics (Summer, June 20), and noticing the title states a different, stale campaign —
human semantic cross-checking.

## Expected ACT-style outcome
**failed** (SC 2.4.2, technique F25 — title does not identify the contents of the web page).

## CITATION

> **Reference:** WCAG Techniques — F25 (Failure of Success Criterion 2.4.2)
> File: `wcag-techniques/failures/F25.html`
>
> "A site generated using templates includes the same title for each page on the site. So the title cannot be used to distinguish among the pages."

> **Reference:** Trusted Tester v5.1.3 — SC 2.4.2 Page Titled, Test 12.B (How to Test)
> File: `refs/trusted-tester/sc-2.4.2-page-titled.md`
>
> "Evaluate the purpose and content of the web page. Determine whether the Page Title is a **meaningful representation or indication** of page content."
