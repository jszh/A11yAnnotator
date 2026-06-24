# case-01 — Bank statement: stale month in title (November) on the December statement

## Scenario
An online-banking statement view. The body unambiguously identifies the rendered
document as the **December 2005 statement for Account 1234-5678**: the breadcrumb's
current page, the `<h1>` ("December 2005 Statement"), the statement-period metadata
(1–31 December 2005), every transaction date (02–30 Dec 2005), the closing-balance row
(31 December 2005), the PDF download filename
(`meridian-statement-2005-12-acct-1234-5678.pdf`), and the footer all say **December**.
The `<title>`, however, reads **"Meridian Bank — November 2005 statement for
Account 1234-5678"**. The statement-rendering template carried over the prior month's
title string; only the month token is stale. This is the WCAG Understanding bank example
("Bank XYZ, December 2005 statement for Account 1234-5678") run in reverse: same bank,
same document type, same account, plausible month — one wrong specific.

## Attribute tuple + developer persona
- **content-domain:** online banking / fintech dashboard
- **UI component / pattern:** transactions data table + metadata definition list + breadcrumb
- **host-language construct:** server-rendered `<title>` built from a per-statement template variable
- **locale / i18n:** en, USD, day-month-year ("1 December 2005")
- **failure-mechanism:** copy-paste / off-by-one carry-over of the prior instance in a monthly series
- **developer persona:** A back-end engineer templated the page title as
  `"{{bank}} — {{month}} {{year}} statement for Account {{acct}}"` but, fixing a bug in
  the statement generator, hard-coded `month = "November"` in a fixture used to render
  the December batch and never reverted it. QA opened the tab, saw a bank statement with
  the right account, and signed off without reading the month against the body.

## Element / selector carrying the issue
- `head > title` — `Meridian Bank — November 2005 statement for Account 1234-5678`
- Contradicted by `main h1#stmt-h1` (`December 2005 Statement`), `dl.meta` (period
  `1 December 2005 – 31 December 2005`), `table > caption`
  (`Transactions for the December 2005 statement period`), `nav.crumbs [aria-current="page"]`
  (`December 2005`), and `a.btn[download]` (`…-2005-12-…pdf`).

## Exact accessibility mechanism (what AT experiences and why it fails)
A screen-reader user hears the page title first — on tab announcement, on page load, and
when scanning a window/tab list to re-find this statement among several open months. They
hear "November 2005 statement for Account 1234-5678." Everything inside the document
concerns **December**. A blind user managing finances by the announced title is actively
misdirected: they may believe they opened last month's statement, reconcile the wrong
period, cite the wrong month to support, or fail to relocate this page later because its
spoken name does not match its content. Users with cognitive or short-term-memory
disabilities — who the Understanding doc names as primary beneficiaries of titles —
cannot trust the title to identify which statement they are in. This is the descriptiveness
limb of F25: the title is present but identifies a *different* (sibling) statement, not
this one, and within a set of monthly statements it fails to distinguish this page.

## Why automated tools cannot detect it
axe-core, WAVE and Lighthouse only verify that a `<title>` exists and is non-empty
(ACT rule 2779a5). For descriptiveness (ACT rule c4a8a4) no checker can fire here:
"Meridian Bank — November 2005 statement for Account 1234-5678" is a valid, non-empty,
unique, human-sounding, on-topic title that even *shares vocabulary* with the body
("statement", "Account 1234-5678", a month name). A keyword-overlap heuristic passes it
because "November" and "December" are both plausible statement months and both the title
and body contain "statement" + the account number. Detecting the fault requires
extracting the body's true period (December, from the H1, period metadata, transaction
dates, and download filename) and noticing the title's month contradicts it. No linter
knows November ≠ December *in a way that matters here*; only a human (or model) cross-
checking the salient identifier catches it.

## Expected ACT-style outcome
**failed** (SC 2.4.2, technique F25 — title does not identify the contents of the web page;
within a set of statements it does not distinguish this page).

## CITATION

> **Reference:** WCAG 2.2 Understanding — Page Titled (Examples → "A web application")
> File: `wcag-understanding/page-titled.html`
>
> "The web application dynamically generates titles for each web page, e.g., \"Bank XYZ, accounts for Alex Smith\" \"Bank XYZ, December 2005 statement for Account 1234-5678\"."

> **Reference:** WCAG Techniques — F25 (Failure of Success Criterion 2.4.2 due to the title of a web page not identifying the contents)
> File: `wcag-techniques/failures/F25.html`
>
> "This describes a failure condition when the web page has a title, but the title does not identify the contents or purpose of the web page."

> **Reference:** Trusted Tester v5.1.3 — SC 2.4.2 Page Titled, Test 12.B
> File: `refs/trusted-tester/sc-2.4.2-page-titled.md`
>
> "If the web page is part of a set of web pages, determine whether the Page Title is sufficient to **distinguish** the web page from other pages."
