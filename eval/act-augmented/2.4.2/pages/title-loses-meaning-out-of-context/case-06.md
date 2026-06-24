# case-06 — Docs leaf "Installing" with a collection-aware title (BOUNDARY PASS)

## Scenario
The deepest leaf of a product documentation collection (Aurora Docs → CLI Tools → Getting started
→ Installing). Structurally this is the *same shape* as the failing cases: the in-page H1 is the
bare action **"Installing"**, and the sidebar shows the page's position in a hierarchy. The tempting
mistake — the one cases 01–05 make — would be to title the page "Installing" to match the H1.
Instead the `<title>` carries the page's relationship to the larger collection, most-specific part
first, exactly as G127/G88 and the APG example pattern prescribe:

> `Installing the CLI - Aurora CLI Tools - Aurora Docs`

Read out of context — in a tab list, search results, or a screen-reader page-title query — this
title still identifies topic ("Installing the CLI"), section ("Aurora CLI Tools"), and product
("Aurora Docs"), and distinguishes the page from every sibling ("Authentication", "Configuration
file") and from the install page of any *other* Aurora product.

## Attribute tuple
- **content-domain:** developer product documentation
- **UI-component/pattern:** docs shell with TOC sidebar, tabbed install methods, prev/next pager
- **host-language construct:** `<title>` assembled most-specific-first as `{page} - {section} - {site}`
- **locale/i18n:** en
- **failure-mechanism:** NONE — included as the boundary PASS to make the in-context-vs-out-of-context contrast explicit and block a "short H1-matching title is always bad" shortcut

## Developer persona
A docs-platform engineer who read G127 and the APG title example and configured the static-site
generator's title template as `{{page.title}} - {{section.title}} - {{site.name}}`, deliberately
leading with the most specific part so the title survives isolation. The visible H1 stays the short
"Installing" for clean in-page reading; the `<title>` does the out-of-context work.

## Element / selector carrying the issue
`head > title` — here it is the *correctly* descriptive title; the H1 (`main > h1`, "Installing") is
the bare-action heading that the failing cases would have mistakenly copied into the title.

## Exact accessibility mechanism (what AT experiences, why it passes)
A screen-reader user with several docs tabs open hears "Installing the CLI - Aurora CLI Tools -
Aurora Docs" and knows exactly which page, section, and product — and can tell it apart from
"Authentication - Aurora CLI Tools - Aurora Docs" and from another product's install page. The title
identifies topic/purpose and conveys collection position without requiring the body. Passes limb (b)
and the "distinguish within a set" requirement.

## Expected ACT-style outcome
**passed**

## Why automated tools miss it (the judgment, not the verdict)
A tool only sees a present, non-empty `<title>` in every case — failing and passing alike. It cannot
tell that THIS title survives isolation while a bare "Installing" would not, nor that it conveys
collection position. Confirming the pass requires the same out-of-context reasoning the failures
require: a static checker has no basis to distinguish case-06 from case-01.

## Citation
> **WCAG Technique G88 (Providing descriptive titles for web pages), Examples — "A web page with a descriptive title in three parts":**
> "The title is separated into three parts by dashes. The first part of the title identifies the organization. The second part identifies the sub-site to which the web page belongs. The third part identifies the web page itself."

(Verbatim from `wcag-techniques/general/G88.html`. This page follows the dashed multi-part pattern,
ordered most-specific-first, so the title is descriptive and collection-aware out of context.)

> **Understanding SC 2.4.2, Examples of Page Titled — "A set of web pages":**
> "Specific examples for each pattern are pages titled \"X Example | APG | WAI | W3C\" (e.g., \"Alert Dialog Example | APG | WAI | W3C\")"

(Verbatim from `wcag-understanding/page-titled.html`. The Aurora title mirrors this good pattern:
leaf identity plus section plus site.)
