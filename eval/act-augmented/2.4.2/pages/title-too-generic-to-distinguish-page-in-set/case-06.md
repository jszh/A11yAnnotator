# case-06 — PASS boundary: portal section page whose title carries page-level info

## Scenario
Same structural family as the failing cases — an inner page of an obvious multi-page set
(MyHealth Patient Portal) with sibling section nav (Dashboard, Appointments, **Lab
results**, Messages, Medications, Billing), a footer, and a specific `<h1>`/body. The page
is specifically the Lab Results view (a recent CBC panel with a flagged value and a
provider note). The **difference** that makes this PASS: the `<title>` is **"Lab Results —
MyHealth Patient Portal"**, which leads with page-level information (the section "Lab
Results") and then the site-level part. It therefore distinguishes this page from its
siblings — the exact property the failing cases lack.

## Attribute tuple
- **Content domain:** healthcare / patient portal
- **UI component / pattern:** portal section side-nav (APG navigation) + breadcrumb + results data table
- **Host-language construct:** `<title>` combining page-level + site-level info (G88-style ordering)
- **Locale / i18n:** en
- **Mechanism:** correct — title distinguishes the page within the set; site-name-only failure deliberately avoided

## Developer persona
The portal team uses a layout that builds `<title>` as `{{ page.section }} — {{
app.name }}`, so every route emits a page-specific leading segment. This is the
counter-example to the agency/template-default cases: the same kind of multi-page set, but
the template was wired correctly.

## Element / selector carrying the issue
`head > title` (value: `Lab Results — MyHealth Patient Portal`). It agrees with `main h1`
and `nav.side a[aria-current="page"]`, and its leading segment is page-specific.

## Exact accessibility mechanism
A screen-reader user with Lab Results, Appointments, and Billing open in tabs hears "Lab
Results — MyHealth Patient Portal," "Appointments — MyHealth…," "Billing — MyHealth…" —
distinct titles that identify each page and place it within the portal. History,
bookmarks, and search results stay distinguishable. The title satisfies the SC's intent:
it identifies the current location and distinguishes the page from its siblings.

## Expected ACT-style outcome
**passed** (SC 2.4.2). Title is present, non-empty, descriptive of this page's topic, and
distinguishes it within the set (passes c4a8a4 / Trusted Tester 12.B / G88).

## Why automated tools "miss" it (i.e. why a human is still required even for the PASS)
An automated tool sees only a present, non-empty `<title>` — exactly what it sees on the
five failing cases too. It cannot confirm that the leading "Lab Results" segment actually
matches this page's role and distinguishes it from siblings; that confirmation is the same
human judgment the failures require. This case exists to anchor what a *correct*
distinguishing inner-page title looks like, so the failing cases are judged against a real
control rather than in the abstract.

## Citation
**Reference:** WCAG Technique G88 (`wcag-techniques/general/G88.html`)
> "A web page is published by a group within a larger organization. The title of the web page first identifies the topic of the page, then shows the group name followed by the name of the parent organization."

**Reference:** Trusted Tester v5.1.3 (`refs/trusted-tester/sc-2.4.2-page-titled.md`)
> "The Page Title accurately identifies the contents or purpose of the web page, AND ... accurately distinguishes the web page from other pages in the web site."
