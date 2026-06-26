# case-01 — Invoice page titled with a stale (off-by-one) invoice number

## Scenario
An invoice detail view. The body unambiguously identifies the rendered document as
**invoice #1044** in five places: the breadcrumb's current page, the `<h1>`, the
metadata definition list, the line-item table `<caption>`, the PDF download filename,
and the remittance instruction. The `<title>`, however, reads **"Invoice #1043 —
Northwind Traders"** — a stale value copied from the previous invoice in the set. The
title is descriptive-shaped (names the document type, a plausible number, and the
vendor) and shares all its vocabulary with the body, but it states the wrong specific:
it identifies a *sibling* invoice, not this one.

## Element / selector carrying the issue
- `head > title` — `Invoice #1043 — Northwind Traders`
- Contradicted by `main h1#inv-h1` (`Invoice #1044`), `dl.meta dd` (`1044`),
  `table > caption` (`Line items for invoice 1044`), `a.btn[download]`
  (`northwind-invoice-1044.pdf`), and `nav.crumbs [aria-current="page"]` (`Invoice #1044`).

## Exact accessibility mechanism (what AT experiences and why it fails)
A screen reader user hears the page title first — when the tab is announced, when the
page loads, and when scanning a window/tab list to re-find this document among several
open invoices. They hear "Invoice #1043 — Northwind Traders." Everything inside the
document, however, concerns invoice **1044**. The title therefore does not identify the
contents of *this* page; it identifies a different invoice. A user relying on the title
to distinguish pages in a set (exactly the case for a numbered invoice series) is
actively misdirected: they may believe they have the wrong record open, pay/cite the
wrong invoice number, or fail to locate this page later because its announced name does
not match its content. This is a Limb-2 (descriptiveness) failure of F25: the title is
present but does not identify the contents of the web page.

## Why automated tools cannot detect it
axe-core, WAVE and Lighthouse only verify that a `<title>` exists and is non-empty
(ACT rule 2779a5). For descriptiveness (ACT rule c4a8a4) there is no rule a checker can
apply here: "Invoice #1043 — Northwind Traders" is a perfectly valid, non-empty, unique,
human-sounding, topically on-point title. Confirming that it should read **1044**
requires extracting the body's true identifier (the invoice number appearing in the
heading, table caption, and download filename) and noticing the title contradicts it by
one. No linter knows that 1043 ≠ 1044 in a way that matters, because both are valid
strings; only a human (or model) cross-checking the salient fact catches the lie.

## Expected ACT-style outcome
**failed** (SC 2.4.2, technique F25 — title does not identify the contents of the web page).

## CITATION

> **Reference:** WCAG Techniques — F25 (Failure of Success Criterion 2.4.2 due to the title of a web page not identifying the contents)
> File: `wcag-techniques/failures/F25.html`
>
> "This describes a failure condition when the web page has a title, but the title does not identify the contents or purpose of the web page."

> **Reference:** Trusted Tester v5.1.3 — SC 2.4.2 Page Titled, Test 12.B
> File: `refs/trusted-tester/sc-2.4.2-page-titled.md`
>
> "Determine whether the Page Title is a **meaningful representation or indication** of page content. … If the web page is part of a set of web pages, determine whether the Page Title is sufficient to **distinguish** the web page from other pages."
