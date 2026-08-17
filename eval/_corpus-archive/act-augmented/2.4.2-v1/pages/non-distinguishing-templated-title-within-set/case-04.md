# case-04 — Issue-detail view titled only "IssueTracker" (the app name)

## Scenario
A single issue-detail view inside a web application. The body is unmistakably ONE
specific issue: "checkout-service #4821", an `<h1>` "Payment retry loops indefinitely
when the gateway returns HTTP 402", status badges, a description, three dated comments,
and a metadata sidebar repeating "Issue #4821". The `<title>` is just **"IssueTracker"**
— the application name, with no issue number, which is identical on every issue view.

## Element / selector carrying the issue
`head > title` (value: `IssueTracker`), judged against `main > .issue-id`, `main > h1`,
the `nav.crumbs` ("Issue #4821"), and `aside .meta-row` ("Issue #4821").

## Exact accessibility mechanism (what AT experiences and why it fails)
This is the web-application sub-case. The WCAG Understanding doc allows the *application
name* to describe a page's purpose, but it also requires that where distinct views are
served, the title change per view — its banking example dynamically generates "Bank XYZ,
December 2005 statement for Account 1234-5678" per statement. Here the app serves a
distinct view per issue, yet the title is the static constant "IssueTracker". A screen-
reader user triaging bugs across many open issue tabs hears the identical "IssueTracker"
for every one, so #4821 is indistinguishable from #4822, #4390, etc.; tab-switching and
history are useless for telling issues apart. The per-issue identity (number + summary)
is present only in the body and never reaches the document title, failing the
set-distinguishability limb of SC 2.4.2.

## Why automated tools cannot detect this
"IssueTracker" is present, non-empty, and a legitimate application name, so the
`document-title` checks in axe/WAVE/Lighthouse pass — they cannot even tell this is a
distinct view that should have re-titled. Whether a per-view title is required is a
semantic judgement about whether the views have distinct topics (issue #4821 vs #4822
do; a paginated "next 20 results" view arguably would not). Automated tools cannot make
that distinction, and a single page gives them no sibling to compare against.

## Expected ACT-style outcome
**failed** (SC 2.4.2, Level A — Limb 2 distinguishability; web-application sub-case)

## Citation
> **WCAG 2.2 Understanding, `wcag-understanding/page-titled.html` (Examples — A web application):**
> "The web application dynamically generates titles for each web page, e.g., \"Bank XYZ, accounts for Alex Smith\" \"Bank XYZ, December 2005 statement for Account 1234-5678\"."

> **WCAG 2.2 Understanding, `wcag-understanding/page-titled.html` (Intent — SPAs):**
> "where various distinct pages/views are all nominally served from the same URI and the content of the page is changed dynamically, the title of the page should also be changed dynamically to reflect the content or topic of the current view."
