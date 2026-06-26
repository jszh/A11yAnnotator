# case-04 — BOUNDARY (PASS): storefront SPA that DOES update the per-view title

## Scenario
The correct counterpart to the failing pages. A storefront SPA (ShopFast) navigated to a specific
product (`#/p/maple-desk`). The router renders the product view into the body **and** updates
`document.title` to reflect the current view's topic: **"Maple Standing Desk — ShopFast"**. The brand
shell "ShopFast" is retained as a suffix, but the title now leads with the specific product on screen.

## Element / selector carrying the issue
- `head > title` — text node `"Maple Standing Desk — ShopFast"` (set dynamically in the router on each route).
- Corroborating evidence: `h1` = "Maple Standing Desk"; breadcrumb = "Home › Desks › Maple Standing Desk".
  Title and view agree.

## Exact accessibility mechanism (what AT experiences and why it passes)
A screen-reader user lands on this product, and the title announced / shown in the tab is
"Maple Standing Desk — ShopFast" — it identifies the topic of the current view and, because each product
route derives its own title, distinguishes this page from other product pages in the set. The brand suffix
follows G88's advisory of identifying the site to which the page belongs while leading with the page's own
subject. This is the dynamic title update an SPA owes each view, and it is present.

## Expected ACT-style outcome
**passed** (limb 2 satisfied). Title present, non-empty, and descriptive/distinguishing of the current view.

## Why this matters as a boundary (and why automation can't separate it from the failures)
Structurally this page is indistinguishable from the failing cases: a non-empty `<title>` plus a content
body. ACT 2779a5 passes here for the *same* reason it (incorrectly) passes case-01/02/03 — title presence.
The only thing that separates pass from fail is whether the title *text* names the view *content* — a
semantic title↔body correspondence. Including this page proves the judgment under test is about that
correspondence and the dynamic update, not about whether a `<title>` exists. An automated tool, seeing only
presence, would grade this page and the failing pages identically.

## Citation
> **WCAG 2.2 Understanding — Understanding SC 2.4.2 Page Titled (`wcag-understanding/page-titled.html`):**
> "In cases such as Single Page Applications (SPAs), where various distinct pages/views are all nominally
> served from the same URI and the content of the page is changed dynamically, the title of the page
> should also be changed dynamically to reflect the content or topic of the current view."

> **WCAG Techniques — G88 (`wcag-techniques/general/G88.html`):**
> "The title of each web page should: Identify the subject of the web page[;] Make sense when read out of
> context, for example by a screen reader or in a site map or list of search results[;] Be short."
