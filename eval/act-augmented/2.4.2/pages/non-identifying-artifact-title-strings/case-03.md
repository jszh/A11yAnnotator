# case-03 — "TODO: add page title" (unfilled CMS placeholder) on a Returns & Refunds policy

## Scenario
A complete, real Returns & Refunds policy page (breadcrumb, `<h1>`, effective date,
callout, how-to-return steps, refund timing, an FAQ `<dl>`, footer). The page-title
field in the CMS still held its helper placeholder, `TODO: add page title`, and the
author published without replacing it; the theme echoes that field verbatim into the
`<title>`. The title is literally an editorial instruction left unfilled.

## Attribute tuple
- **content-domain:** e-commerce customer-service / legal-policy
- **UI-component/pattern:** breadcrumb nav + article + definition-list FAQ + callout
- **host-language construct:** server-templated page (CMS field → `<title>`)
- **locale/i18n:** en-GB ("colour", "organisation"-style spelling in sibling cases)
- **failure-mechanism:** F25 sub-class (b) — filler/placeholder / unfilled-template text

## Developer persona
A marketing author in a headless CMS created the page from a blank template whose
"Page title" field is pre-populated with the placeholder "TODO: add page title" as an
authoring hint. They wrote the visible `<h1>` and body, hit Publish, and never noticed
the still-default title field.

## Element / selector carrying the issue
`head > title` (text node `TODO: add page title`).

## Exact accessibility mechanism
AT users and tab/bookmark/search-result readers receive "TODO: add page title". This is
a note from the author to themselves — it identifies nothing about returns or refunds,
and (the word "TODO") actively signals the page is unfinished even though the visible
content is complete. The title fails to describe topic or purpose.

## Expected ACT-style outcome
**failed** — placeholder/filler text is explicitly "not a title" under F25.

## Why automated tools miss it
The string is non-empty, valid, sentence-case, and even contains the dictionary-shaped
token "title", so `document-title` / 2779a5 pass. No linter knows "TODO: add page title"
is an unfilled template token rather than a real title; distinguishing residue from
content is semantic recognition.

## Citation
> **WCAG Technique F25** (`wcag-techniques/failures/F25.html`):
> "Examples of text that are not titles include: … Empty text … Filler or placeholder
> text"
