# case-03 — Contact page titled "Enter the title of your HTML document here"

## Scenario
A complete company **contact page** for Harbourline Logistics: a hero, an `<address>`
block with the Rotterdam head-office postal address / phone / email, an embedded-map
region, and a labelled contact form. The `<title>` is the literal authoring-template
placeholder **`Enter the title of your HTML document here`** — an *instruction to the
developer* that was never replaced.

## Element / selector carrying the issue
- `head > title` — text node `Enter the title of your HTML document here`.
- Contradicting evidence: `.hero h1` ("Contact Harbourline Logistics"), the `<address>`,
  and the contact `<form>`.

## Exact accessibility mechanism
- This is the most absurd-sounding but very real failure: the title is a sentence written
  *to the author*, not *about the page*. A screen-reader user hears the page announced as
  "Enter the title of your HTML document here" on load and in the tab/history list.
- The string is grammatically a command, not a topic. It actively confuses: a user could
  reasonably think the page is broken or a form prompt. It identifies neither "contact"
  nor "Harbourline Logistics." Limb 1 (present, non-empty) passes; limb 2 (descriptive of
  topic/purpose) fails.

## Expected ACT-style outcome
**failed** — ACT rule c4a8a4. F25 names this exact string as a non-title.

## Why automated tools miss it
The string is long, non-empty, well-formed, and contains real words — every signal a
linter uses to gauge "has a title" is positive. No tool parses the *pragmatics* of the
sentence to realise it is an editor instruction rather than a description, and none
cross-checks it against the body's contact content. Distinguishing it from a legitimate
title requires human language understanding.

## Citation
> **Reference: WCAG Techniques — F25** (`wcag-techniques/failures/F25.html`)
>
> "Examples of text that are not titles include: Authoring tool default titles, such as
> "Enter the title of your HTML document here," "Untitled Document" "No Title" "Untitled
> Page" "New Page 1""

> **Reference: WCAG Understanding — Page Titled** (`wcag-understanding/page-titled.html`)
>
> "User agents make the title of the page easily available to the user for identifying the
> page. For instance, a user agent may display the page title in the window title bar or
> as the name of the tab containing the page."
