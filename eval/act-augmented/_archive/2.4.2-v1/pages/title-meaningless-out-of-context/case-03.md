# case-03 — Search results page 2 titled "More results"

- **SC:** 2.4.2 Page Titled (Level A)
- **Aspect:** title-meaningless-out-of-context (Limb 2 — descriptiveness)
- **Expected ACT outcome:** **failed**
- **Page:** `case-03.html`

## Scenario
Page 2 of a ceramics-directory search ("KILNNET") for the query
"ceramic glaze recipes cone 6", showing results 11–20. The `<title>` is the
relative fragment **"More results"** — meaningful only as "more of the page you
were just on."

## Element / selector carrying the issue
`head > title` (text `More results`). The query (`#q` value), the result meta line,
and the pager (`nav.pager .cur` = page 2) supply the context the title leans on.

## Exact accessibility mechanism (what AT experiences)
The page surfaces in a tab / history / window list as **"More results"** with no
query, no site, no result type. This is doubly pointed: 2.4.2's Intent calls out
*search-results lists* as a primary place titles are consumed, and here a
search-results page itself fails to be identifiable when ITS title appears in some
other list. A returning user who wants "page 2 of my glaze search" cannot recognise
it; "More results" is relative to a previous page that is no longer present. While
the body is visible the heading and pager make the context obvious — the defect
appears only out of context.

## Why automated tools miss it
- **2779a5 (non-empty title):** passes.
- **c4a8a4 (descriptive), automated parts:** "results" and "More results" appear
  verbatim in the visible meta line and the H1, so title/body lexical overlap holds.
  Automated tools see a content-relevant, non-empty string and fire nothing. Whether
  "More results" can identify the page standing alone is a human contextual judgement
  no automated checker performs.

## Citation
> **Reference:** WCAG Understanding 2.4.2 — *Intent of Page Titled*
> (`wcag-understanding/page-titled.html`)
>
> "titles appear in site maps or lists of search results, users can more quickly
> identify" […] "User agents make the title of the page easily available to" […]
> "For instance, a user agent may display the page" title "as the name of the tab
> containing the page."

> **Reference:** WCAG Technique G88 — *Providing descriptive titles for web pages*
> (`wcag-techniques/general/G88.html`)
>
> "Make sense when read out of context, for example by a screen reader or in a site
> map or list of search results"

> **Reference:** WCAG Technique F25 — *Failure of Success Criterion 2.4.2…*
> (`wcag-techniques/failures/F25.html`)
>
> "This describes a failure condition when the web page has a title, but the" […]
> "title does not identify the contents or purpose of the web page."
