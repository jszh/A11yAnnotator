# case-02 — CRM SPA on one customer record but `<title>` stays "Dashboard"

## Scenario
A CRM single-page app (NorthStar CRM). The router parses the record id from the hash
(`#/customers/5567`), looks the record up in an in-memory store, and renders **one specific
customer's detail page** into the body: an `<h1>Customer: Dana Okafor</h1>`, a sub-line
"Account #5567 · Active · Enterprise", profile/contact cards, and a recent-activity table. The
rendered body is unmistakably *this* record. The `<title>` was set once in `<head>` to the shell
value **"Dashboard"** and is never updated per record, so it is identical for every customer, every
report, and the home view.

## Element / selector carrying the issue
- `head > title` — text node `"Dashboard"`.
- Contradicting evidence: `h1` = "Customer: Dana Okafor"; `.sub` = "Account #5567 · Active · Enterprise";
  breadcrumb `.bc` = "Customers › Dana Okafor".

## Exact accessibility mechanism (what AT experiences and why it fails)
The Understanding doc's own "web application" example calls for exactly the opposite of this page:
a banking app that "dynamically generates titles for each web page, e.g., 'Bank XYZ, accounts for
Alex Smith'". Here the equivalent would be "Dana Okafor (Account #5567) — NorthStar CRM". Instead a
screen-reader or switch user gets "Dashboard" in the tab, the window title, and the AT's title
announcement. If they have three customer records open in three tabs, all three tabs read "Dashboard";
nothing distinguishes Dana Okafor's record from the next customer's. The title fails both to *identify*
the topic (a specific named account) and to *distinguish* this page from the other record pages in the set.

## Expected ACT-style outcome
**failed** (limb 2). Title present and non-empty (2779a5 passes) but neither identifies nor
distinguishes the specific record shown.

## Why automated tools miss it
"Dashboard" is a non-empty, human-readable string, so the presence rule (ACT 2779a5) passes and
axe/WAVE/Lighthouse emit nothing. Detecting the failure requires extracting the specific entity rendered
in the body (a named customer and account number) and judging that a generic "Dashboard" title fails to
reflect it — and that it is byte-identical across every record. That is content comprehension plus a
cross-page-set distinguishability judgment, not a markup check. The runtime fact that the title was never
re-derived from the loaded record leaves no trace in a static head snapshot.

## Citation
> **WCAG 2.2 Understanding — Examples of Page Titled (`wcag-understanding/page-titled.html`):**
> "A banking application lets users inspect their bank accounts, view past statements, and perform
> transactions. The web application dynamically generates titles for each web page, e.g., 'Bank XYZ,
> accounts for Alex Smith' 'Bank XYZ, December 2005 statement for Account 1234-5678'."

> **Trusted Tester v5.1.3 — Test 12.B (`refs/trusted-tester/sc-2.4.2-page-titled.md`):**
> "If the web page is part of a set of web pages, the Page Title accurately distinguishes the web page
> from other pages in the web site."
