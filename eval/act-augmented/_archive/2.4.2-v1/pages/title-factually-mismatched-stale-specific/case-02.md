# case-02 — Annual-report landing page titled with the wrong (adjacent) fiscal year

## Scenario
A corporate investor-relations landing page for **Aldermont Industries' Annual Report
2023**. Every signal in the body fixes the year as **FY2023 / 2023**: the hero eyebrow
("Fiscal Year 2023"), the `<h1>` ("Annual Report 2023"), the subheading ("year ended
December 31, 2023"), three stat cards labelled FY2023, a shareholder letter dated
February 19, 2024 reviewing fiscal 2023, an "About this report" paragraph that even
*mentions* the separate Annual Report 2022 as a prior-year archive item, and the
footer ("Annual Report 2023 (FY2023)"). The `<title>` reads **"Annual Report 2022 |
Aldermont Industries"** — the adjacent prior year, a classic stale copy from last
season's landing page. The title is descriptive-shaped and topically identical; only
the specific year is wrong.

## Element / selector carrying the issue
- `head > title` — `Annual Report 2022 | Aldermont Industries`
- Contradicted by `header.hero h1` (`Annual Report 2023`), `.hero .eyebrow`
  (`Fiscal Year 2023`), `.stat .lbl` (`FY2023 Revenue` / `FY2023 Net Income`),
  `figure.letter figcaption` (`reviewing fiscal year 2023`), and `footer`
  (`Annual Report 2023 (FY2023)`).

## Exact accessibility mechanism (what AT experiences and why it fails)
The page title is the first and most persistent label a screen-reader or
cognitive-load-sensitive user has for the document. Here it announces "Annual Report
2022," directly contradicting a body that is entirely the 2023 report. Annual reports
are the textbook "set of web pages distinguished only by a specific" — a user searching
their history, bookmarks, or open tabs for "the 2023 report" will reject this page (its
name says 2022) or, worse, open it believing they have the 2022 report and cite 2023
figures as 2022. The title fails to identify the contents of this page and fails to
distinguish it correctly within the report set. Limb-2 (descriptiveness) failure per F25.

## Why automated tools cannot detect it
"Annual Report 2022 | Aldermont Industries" is non-empty, unique, well-formed, and
textbook-descriptive in shape — it would sail through 2779a5 and through any heuristic
c4a8a4 check, because it shares the body's exact vocabulary ("Annual Report", the
company name, a four-digit year). The page even legitimately contains the string "2022"
in the body (naming the prior-year archive), so a naive token-overlap check would
*confirm* the title. Detecting the failure requires understanding that the *report this
page is about* is the 2023 one and that "2022" in the title is the salient year claim —
a meaning-level judgement no rule engine performs.

## Expected ACT-style outcome
**failed** (SC 2.4.2, technique F25 — title does not identify the contents of the web page).

## CITATION

> **Reference:** WCAG Techniques — F25 (Failure of Success Criterion 2.4.2)
> File: `wcag-techniques/failures/F25.html`
>
> "This describes a failure condition when the web page has a title, but the title does not identify the contents or purpose of the web page."

> **Reference:** WCAG Understanding 2.4.2 Page Titled — Intent
> File: `wcag-understanding/page-titled.html`
>
> "The intent of this success criterion is to help users find content and orient themselves within it by ensuring that each web page has a descriptive title. Titles identify the current location without requiring users to read or interpret page content. When titles appear in site maps or lists of search results, users can more quickly identify the content they need."
