# case-05 — "spk12.html" (F25's own filename example) on a conference speaker bio

## Scenario
A complete keynote-speaker profile on a conference site: conference header, avatar hero
with the speaker's name and role, a featured-talk card with session title and slot, an
"About" section, and a speaking-topics list. The body unambiguously identifies Dr. Lena
Okafor's DataShift 2025 keynote — but the `<title>` is `spk12.html`, an internal record
slug plus extension, which is F25's other literal filename example.

## Attribute tuple
- **content-domain:** events / conference website
- **UI-component/pattern:** profile hero (avatar + name) + talk card + topics list
- **host-language construct:** CMS-generated page; blank title field → output filename
- **locale/i18n:** en (event in Lisbon)
- **failure-mechanism:** F25 sub-class (c) — machine slug filename `spk12.html`

## Developer persona
A conference site is built from a speakers CMS that names each generated page after an
internal record id (`spk` + number). When the "Display title" field is left empty, the
generator falls back to the raw output filename. Speaker #12 was imported via spreadsheet
with the title field blank, so the page shipped with `<title>spk12.html</title>`.

## Element / selector carrying the issue
`head > title` (text node `spk12.html`).

## Exact accessibility mechanism
AT users and tab/search-result readers get "spk12.html" — a build artifact identifying
speaker record number twelve, not the page's subject (Dr. Lena Okafor's keynote). A user
comparing several open speaker tabs ("spk12.html", "spk13.html"…) cannot tell which is
whom. The title fails to describe topic or purpose and fails to distinguish the page.

## Expected ACT-style outcome
**failed** — F25 names `spk12.html` explicitly as a non-descriptive filename title.

## Why automated tools miss it
"spk12.html" is non-empty and valid; `document-title` / 2779a5 pass. The string even
"looks technical/intentional", which can fool naive heuristics. Knowing it is a machine
slug that says nothing about the human subject of the bio requires semantic recognition.

## Citation
> **WCAG Technique F25** (`wcag-techniques/failures/F25.html`):
> "Filenames that are not descriptive in their own right, such as `report.html` or
> `spk12.html`"
