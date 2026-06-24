# case-03 — Job posting titled after the company's footer mission tagline

## Scenario
An applicant-tracking-system (ATS) job-posting page whose entire main column is a single,
specific posting: **"Senior Backend Engineer (Payments)"** at Northwind Robotics, with the
role summary, responsibilities, requirements, compensation, and an Apply button. The
document `<title>` reads **"Building robots that give people their time back. — Northwind
Robotics"** — the company's generic mission-statement tagline, which appears on the page
only in the footer. The title describes the company brand (a peripheral footer block), not
the specific job that is the page's subject.

## Attribute tuple
- **content-domain:** job board / ATS application
- **UI-component / pattern:** footer brand tagline + apply-bar job posting
- **host-language construct:** `<title>` populated from a global footer tagline string, not the posting `<h1>`
- **locale / i18n:** en-US
- **failure-mechanism:** present-but-wrong-region AND non-distinguishing across a set of pages — every posting shares the footer tagline title (F25 "same title for each page")

## Developer persona
An agency configured the company's hosted ATS (Greenhouse/Lever-style) and set the
"default page title" field in the careers-site theme to the company's marketing tagline so
the brand shows up in browser tabs. The per-posting title token was never wired into the
template, so the same tagline is emitted as the `<title>` of every individual job page. The
recruiting team reviews postings in the ATS admin, never in a browser tab, so the duplication
is invisible to them.

## Element / selector carrying the issue
- `head > title` — value: `Building robots that give people their time back. — Northwind Robotics`
- Primary region: `main.container > .jobhead > h1#jtitle` ("Senior Backend Engineer (Payments)").
- Peripheral source region: `footer > p.tagline` ("Building robots that give people their time back.").

## Exact accessibility mechanism (what AT experiences)
A screen-reader user navigating an applicant's shortlist of open tabs hears every Northwind
job tab announced identically: "Building robots that give people their time back, Northwind
Robotics." There is no way to tell the Senior Backend Engineer tab from the Product Designer
tab or the Sales Lead tab — the title neither describes *this* page's topic (the specific
role) nor distinguishes it from the other postings in the set. F25 explicitly calls out a
template that "includes the same title for each page on the site" as a failure. A `<title>`
exists and is non-empty, but limb (b) of SC 2.4.2 is not met.

## Expected ACT-style outcome
**failed** (ACT rule c4a8a4 — the title does not describe the topic/purpose of the overall
content; it is a site-wide tagline duplicated across the posting set).

## Why automated tools miss it
The `<title>` is non-empty, so axe-core `document-title`, WAVE, and Lighthouse pass. The
tagline's words appear verbatim in the footer, so token-overlap heuristics also find a match.
Detecting that every posting carries the *same* tagline-title requires crawling and comparing
multiple pages, which single-URL scanners never do; and judging that the title fails to name
the specific job requires reading the posting and understanding it is the page's primary
subject. Both are human judgments.

## Citation
**Reference:** WCAG Technique F25 — *Failure of Success Criterion 2.4.2 due to the title of
a web page not identifying the contents* (`wcag-techniques/failures/F25.html`).

> "A site generated using templates includes the same title for each page on the site. So
> the title cannot be used to distinguish among the pages."

**Supporting reference:** Trusted Tester v5.1.3, Test 12.B — *2.4.2-page-title-purpose*
(`refs/trusted-tester/sc-2.4.2-page-titled.md`).

> "If the web page is part of a set of web pages, determine whether the Page Title is
> sufficient to **distinguish** the web page from other pages."
