# case-04 — "report.html" (F25's own filename example) on a research summary

## Scenario
A finished field-research brief from the Coastal Watershed Institute: org kicker, a
descriptive `<h1>` ("Effects of Riparian Buffer Width on Stream Temperature in the Cedar
Basin"), a metadata definition list, an executive summary, key findings, a recommendation
blockquote, and abridged methods. The `<title>` is the source FILENAME, `report.html`,
dot-extension included — F25's own literal example.

## Attribute tuple
- **content-domain:** scientific / environmental research publication
- **UI-component/pattern:** article "sheet" + metadata `<dl>` grid + findings list + blockquote
- **host-language construct:** static export from a docs generator (filename → `<title>`)
- **locale/i18n:** en (metric units)
- **failure-mechanism:** F25 sub-class (c) — filename not descriptive in its own right

## Developer persona
An analyst wrote the brief in a Markdown/HTML documentation generator that uses the
source filename as `<title>` when no front-matter `title:` is supplied. They saved the
file as `report.html` and exported; with no front-matter title, the generator emitted
`<title>report.html</title>` verbatim.

## Element / selector carrying the issue
`head > title` (text node `report.html`).

## Exact accessibility mechanism
AT users querying the title, and anyone reading the tab/bookmark/search-result, get
"report.html". "Report" of WHAT? The string identifies a file, not a subject, and the
".html" extension is machine residue that no human would choose as a page title. It does
not distinguish this brief from any other "report.html" on the server. Fails to describe
topic or purpose.

## Expected ACT-style outcome
**failed** — F25 names `report.html` explicitly as a non-descriptive filename title.

## Why automated tools miss it
"report.html" is non-empty and valid; `document-title` / 2779a5 pass. A scanner cannot
tell a non-descriptive filename ("report.html") from a genuine terse title ("Report
2024") — both are short strings. Recognizing ".html" as a filename extension signalling
machine residue, and "report" as non-identifying alone, is semantic judgment.

## Citation
> **WCAG Technique F25** (`wcag-techniques/failures/F25.html`):
> "Filenames that are not descriptive in their own right, such as `report.html` or
> `spk12.html`"
