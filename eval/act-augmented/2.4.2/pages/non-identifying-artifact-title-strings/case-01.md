# case-01 — "Untitled Document" (authoring-tool default) on a quarterly-revenue article

## Scenario
A finished investor-relations article ("Northwind Trading Posts Record Q3 Revenue…")
with a kicker, byline, prose, management quotes, an outlook section, and a real data
table of revenue by segment. The page is complete and unambiguously about Q3 FY2024
revenue — but the `<title>` is the literal Adobe Dreamweaver new-document default,
`Untitled Document`.

## Attribute tuple
- **content-domain:** corporate / investor-relations long-form article
- **UI-component/pattern:** masthead + article + data `<table>` (thead/tbody/tfoot, scope)
- **host-language construct:** static hand-authored HTML5 document
- **locale/i18n:** en-US
- **failure-mechanism:** F25 sub-class (a) — authoring-tool DEFAULT title

## Developer persona
A communications staffer at Northwind hand-edits press pages in Adobe Dreamweaver's
design view. They pasted the new article body over an old template, updated the `<h1>`,
but never opened the document-properties dialog, so the `<title>` kept Dreamweaver's
literal default, "Untitled Document".

## Element / selector carrying the issue
`head > title` (text node `Untitled Document`).

## Exact accessibility mechanism
A screen-reader user pressing the read-title command, or scanning the browser tab,
window title, bookmark, or a list of search results, hears/sees "Untitled Document".
That string announces the ABSENCE of a title — it identifies nothing about the page's
subject (Q3 revenue). A user with several tabs open cannot distinguish this page from
any other "Untitled Document". The title therefore fails to "describe topic or purpose"
even though it is present and non-empty.

## Expected ACT-style outcome
**failed** — F25 applies; the title exists but does not identify the contents.

## Why automated tools miss it
axe-core's `document-title`, WAVE, and Lighthouse check only that a non-empty `<title>`
exists. "Untitled Document" is non-empty, valid UTF-8, and a grammatical noun phrase,
so it passes every presence/format heuristic (and ACT rule 2779a5). Recognizing that
"Untitled Document" is an authoring-tool default that announces no-title requires
semantic knowledge of tool defaults — judgment a checker cannot perform.

## Citation
> **WCAG Technique F25** (`wcag-techniques/failures/F25.html`):
> "Examples of text that are not titles include: Authoring tool default titles, such as
> 'Enter the title of your HTML document here,' 'Untitled Document' 'No Title' 'Untitled
> Page' 'New Page 1'"
