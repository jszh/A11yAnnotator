# case-03 — API docs page titled only the template default "Documentation"

## Scenario
The "Authentication API Reference" page of the Quilltail Pay developer docs. The sidebar
tree-nav lists the sibling pages (Quickstart, Authentication, Charges, Refunds, Webhooks,
Errors, Rate limits), and the `<h1>`, lede, token endpoint, parameter table, and code
sample make the page specifically the Authentication reference. The `<title>` is only the
docs template's default **"Documentation"** — the same string carried by every page in the
docs set. It names the whole doc site, not this page, so it cannot distinguish the
Authentication reference from Webhooks or Errors.

## Attribute tuple
- **Content domain:** developer docs / API reference
- **UI component / pattern:** sidebar tree navigation (APG tree) + breadcrumb + data table
- **Host-language construct:** `<title>` left at a docs-generator template default
- **Locale / i18n:** en
- **Failure mechanism:** F25 — authoring-tool/template default that names the collection, identical across every doc page

## Developer persona
The team runs a static-site docs generator (Docusaurus-style). Per-page front matter is
supposed to set the title, but this Markdown file was created by copying an existing page
and the author deleted the `title:` front-matter line, so the generator fell back to the
site-wide default `<title>Documentation</title>` configured in `docusaurus.config`. The
in-content `# Authentication API Reference` heading still renders, masking the missing
title during review.

## Element / selector carrying the issue
`head > title` (value: `Documentation`). The page's real identity lives in `main h1`,
`.crumb`, and `nav.side a[aria-current="page"]` — none of it reaches the title.

## Exact accessibility mechanism
A developer using a screen reader typically opens several reference pages in tabs at once
(Authentication, Webhooks, Errors). All of them announce "Documentation," so the title —
the cue AT uses for tab-switching, history, and bookmarks — cannot tell the pages apart.
Search results and bookmarks for all doc pages collapse to the identical "Documentation"
string. The on-page `<h1>` is correct, but it is not what the SC's intent relies on for
cross-page orientation.

## Expected ACT-style outcome
**failed** (SC 2.4.2). Title present and non-empty (2779a5 passes) but is a generic
template default that does not describe this page or distinguish it within the docs set
(fails c4a8a4 / Trusted Tester 12.B / F25).

## Why automated tools miss it
"Documentation" is a non-empty `<title>`, so the presence check passes everywhere. No
single-page tool can compare it to the other doc pages, and none reads the body to learn
this is specifically the Authentication reference — judging that the title is the shared
template default requires human semantic comparison.

## Citation
**Reference:** WCAG Technique F25 (`wcag-techniques/failures/F25.html`)
> "A site generated using templates includes the same title for each page on the site. So the title cannot be used to distinguish among the pages."

**Reference:** WCAG Technique G88 (`wcag-techniques/general/G88.html`)
> "Make sense when read out of context, for example by a screen reader or in a site map or list of search results"
