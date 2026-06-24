# case-04 — Link whose entire accessible name is a bare raw URL

## Scenario
An investor-relations "Quarterly Disclosures" page links to a PDF, but the link's entire
visible (and accessible) text is the raw URL
`https://example.com/products/2024/q3-report.pdf`. The only surrounding words are "Document
available at:" — which do not name the document. The judge must decide the bare-URI case
fails the substantive limb of 2.4.4.

## Attribute tuple
- **content-domain**: corporate investor relations / financial disclosures
- **UI-component/pattern**: document-download list item with a pasted URL
- **host-language construct**: `<a>` whose text node is the same string as its `href`
- **locale/i18n**: en
- **failure-mechanism**: bare-URI link text — the URI is "generally not sufficiently descriptive" and no block text supplies purpose

## Developer persona
A junior developer received the filing link in an email from the finance team and pasted it
straight into the CMS rich-text editor, which auto-linked it. They left the URL as the
visible text because "it's the official link and I didn't want to change anything," not
realizing that the path segments are not a usable link name for assistive-technology users.

## Element / selector carrying the issue
- FAIL: `a.rawlink[href="https://example.com/products/2024/q3-report.pdf"]` — accessible
  name is the raw URL itself.

## Exact accessibility mechanism
A screen reader announces the link either by spelling the URL character-by-character or by
reading it as a long unpunctuated token ("h-t-t-p-s colon slash slash example dot com slash
products slash twenty-twenty-four slash q3 dash report dot p-d-f"). On a Links List the
entry is this same opaque string. To recover purpose the user must mentally parse path
segments and *guess* that "q3-report" means a third-quarter report — with no certainty of
the fiscal year, the reporting entity, or the report type. The link's programmatically
determined context (its containing block) adds only "Document available at:", which names
nothing. WCAG's G91, G53, and H30 all state the destination URI is "generally not
sufficiently descriptive," so this fails the purpose limb.

## Expected ACT-style outcome
**failed** — the bare URL does not describe the link's purpose, and no in-context text
supplies it.

## Why automated tools miss it
The accessible name is a long, non-empty, *unique* string, so ACT c487ae and axe's
`link-name` rule PASS and duplicate-text heuristics never fire (the name is one-of-a-kind).
A tool would have to (a) recognize the name is a URL, (b) parse its path, and (c) judge
whether the path segments adequately convey purpose to a human — none of which is a reliable
static check, and all of which WCAG frames as "generally" insufficient, i.e. a
case-by-case human judgment. The string is technically a valid accessible name, so every
name-presence gate is green.

## Citation
> **WCAG Techniques — G91: Providing link text that describes the purpose of a link**
> "The objective of this technique is to describe the purpose of a link in the text of the
> link. … The URI of the destination is generally not sufficiently descriptive."

> **WCAG Techniques — G53 (Description note)**
> "Note that simply providing the URI of the destination is generally not sufficiently
> descriptive."
