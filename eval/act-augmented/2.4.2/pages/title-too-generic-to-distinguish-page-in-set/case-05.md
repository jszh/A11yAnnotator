# case-05 — Government service page titled only the department name

## Scenario
A specific government service page on the Marisol DMV site: "Renew your driver license
online." The mega-menu lists sibling services (Vehicles, Driver licenses, ID cards,
Tests & scheduling, plus renew/replace/permit sub-services), and the `<h1>`, eligibility
callout, "What you'll need" list, and "How it works" steps make the page specifically the
license-renewal service. The `<title>` is only the agency name **"Department of Motor
Vehicles"** — the same string every DMV service page carries. It names the department, not
this service, so it cannot distinguish the renewal page from "Register a vehicle" or
"Schedule a road test."

## Attribute tuple
- **Content domain:** government / civic-services portal
- **UI component / pattern:** mega-menu navigation (APG mega menu / disclosure) + breadcrumb + step lists
- **Host-language construct:** `<title>` carrying the department-name-only string
- **Locale / i18n:** en (US gov design-system styling)
- **Failure mechanism:** F25 — agency/department name reused as the title of every service page in the set

## Developer persona
An agency content team migrated to a government design-system CMS. The page-type template
for "Service" pages sets `<title>` from the *site name* field ("Department of Motor
Vehicles") because the migration script mapped the wrong CMS field — it should have used
`{service.name} | {site.name}`. The visible H1 is authored per page, so editors reviewing
in the CMS preview saw distinct headings and never noticed the document title was the
department name on every service.

## Element / selector carrying the issue
`head > title` (value: `Department of Motor Vehicles`). The service identity is in
`main h1`, `.crumb`, and `nav.mega a[aria-current="page"]` — never reflected in the title.

## Exact accessibility mechanism
A resident using a screen reader who opens "Renew online" and "Register a vehicle" in two
tabs to compare requirements hears "Department of Motor Vehicles" for both. The title —
the SC's orientation cue for tabs, history, bookmarks, and search results — cannot tell
the services apart. Voice-control and braille users relying on the page title to confirm
they reached the renewal task get only the agency name. The on-screen `<h1>` is correct
but is not the cross-page title cue.

## Expected ACT-style outcome
**failed** (SC 2.4.2). Title present and non-empty (2779a5 passes) but is the agency name
only, identical across services, and does not distinguish this service page within the set
(fails c4a8a4 / Trusted Tester 12.B / F25).

## Why automated tools miss it
"Department of Motor Vehicles" is a present, non-empty `<title>`, so axe/WAVE/Lighthouse
pass. They cannot read the body to learn the page is the license-renewal service, and they
have no view of the sibling service pages to notice the department name is repeated as
every title — the distinguish-within-set judgment is human-only.

## Citation
**Reference:** WCAG Technique F25 (`wcag-techniques/failures/F25.html`)
> "This describes a failure condition when the web page has a title, but the title does not identify the contents or purpose of the web page."

**Reference:** Trusted Tester v5.1.3 (`refs/trusted-tester/sc-2.4.2-page-titled.md`)
> "Determine whether the Page Title is a meaningful representation or indication of page content."
