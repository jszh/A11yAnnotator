# case-04 — "Returns & Refunds Policy" titled page whose body is the Shipping policy

## Scenario
A retail help-center policy page. The `<title>` reads **"Returns & Refunds Policy |
Maple & Oak Home"**, but the entire body is the **Shipping & Delivery Policy**: the
breadcrumb's current page ("Shipping & Delivery"), the `<h1>` ("Shipping & Delivery
Policy"), the intro paragraph, and every section — processing time, a delivery-rates
table with carriers and shipping costs, tracking, shipping restrictions, undeliverable
shipments — plus a footer that explicitly says "This is our shipping policy; refund and
return terms are documented separately." Returns and Shipping are *adjacent sibling*
policy pages in the same store, so the title is topically near and descriptive-shaped;
it simply names the wrong policy. This models the classic CMS swap (right title slot,
wrong body, or vice versa).

## Element / selector carrying the issue
- `head > title` — `Returns & Refunds Policy | Maple & Oak Home`
- Contradicted by `main h1` (`Shipping & Delivery Policy`),
  `nav.crumbs [aria-current="page"]` (`Shipping & Delivery`), the shipping-rates
  `table > caption` (`Shipping methods, delivery windows, and rates`), and `footer`
  (`Shipping & Delivery Policy … This is our shipping policy`).

## Exact accessibility mechanism (what AT experiences and why it fails)
A user looking specifically for the **returns** policy — to learn how to send an item
back — relies on the title to confirm they have landed on the right page. AT announces
"Returns & Refunds Policy"; the user trusts it and starts reading. But the body never
covers returns, refund windows, restocking fees, or RMA steps — it is the shipping
policy. A sighted user notices the mismatch within a glance of the `<h1>`; a screen
reader user who navigated by the announced title, or who is scanning tabs, is
misdirected and may waste effort, conclude the store has no returns policy, or
misattribute shipping terms as return terms. The title does not identify the contents of
this page and fails to distinguish it from its sibling Shipping page. Limb-2
(descriptiveness) failure per F25.

## Why automated tools cannot detect it
Both candidate titles share the store's vocabulary ("Policy", the brand name) and the
help-center domain, so "Returns & Refunds Policy" looks like a thoroughly valid,
non-empty, unique, descriptive title to 2779a5 and to any token-overlap descriptiveness
check — the body even contains the words "refund," "return," and "returns" in passing
(the intro and footer cross-reference the separate returns page). A checker cannot
determine the *subject* of the body (it is about shipping) and compare it to the
*subject* asserted in the title (returns). That requires reading the document, deciding
what it is actually about, and noticing the title names a different — though adjacent —
policy. No rule encodes "the body is the shipping policy, not the returns policy."

## Expected ACT-style outcome
**failed** (SC 2.4.2, technique F25 — title does not identify the contents of the web page).

## CITATION

> **Reference:** WCAG Techniques — F25 (Failure of Success Criterion 2.4.2)
> File: `wcag-techniques/failures/F25.html`
>
> "This describes a failure condition when the web page has a title, but the title does not identify the contents or purpose of the web page."

> **Reference:** Trusted Tester v5.1.3 — SC 2.4.2 Page Titled, Test 12.B (Evaluate Results)
> File: `refs/trusted-tester/sc-2.4.2-page-titled.md`
>
> "The Page Title accurately identifies the contents or purpose of the web page, AND … If the web page is part of a set of web pages, the Page Title accurately distinguishes the web page from other pages in the web site."
