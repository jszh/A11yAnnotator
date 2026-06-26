# case-02 — Composting blog article titled "New Page 1"

## Scenario
A finished, bylined blog post on **The Quiet Garden** — a 700-word article, "How to
Build a Hot Compost Pile That Finishes in Three Weeks," with an author byline, multiple
`<h2>` sections, a pull-quote, a figure, and tag links. The `<title>` is **`New Page 1`**,
the default Microsoft FrontPage / Expression Web assigned to every newly created document.

## Element / selector carrying the issue
- `head > title` — text node `New Page 1`.
- Contradicting evidence: `article h1` ("How to Build a Hot Compost Pile…"), the byline
  `meta[name=author]` / `.author`, and the section `<h2>`s.

## Exact accessibility mechanism
- A screen-reader user navigating bookmarks, browser history, or a multi-tab session
  hears the page identified as **"New Page 1"**. The `<h1>` ("How to Build a Hot Compost
  Pile…") is excellent — but the `<h1>` is *not* what user agents surface as the tab/
  window/bookmark/history label, and it is *not* what a screen reader announces first on
  load. The programmatic page name is the `<title>`, and it conveys nothing.
- A sighted keyboard user scanning the OS task switcher sees "New Page 1" with no way to
  tell it from any other un-retitled draft. Limb 1 passes; limb 2 fails.

## Expected ACT-style outcome
**failed** — ACT rule c4a8a4. A strong `<h1>` does not rescue a non-descriptive `<title>`;
the SC is about the page title specifically.

## Why automated tools miss it
A naive checker that "the page has an `<h1>` and a non-empty `<title>`" passes this page
on both counts. Tools cannot know that `New Page 1` is editor boilerplate rather than a
legitimate title (a page genuinely titled "New Page 1" could exist, e.g. a CMS tutorial),
nor can they judge that it fails to name the demonstrably specific composting content in
the body. That requires reading the article and recognizing the disconnect.

## Citation
> **Reference: WCAG Techniques — F25** (`wcag-techniques/failures/F25.html`)
>
> "Examples of text that are not titles include: Authoring tool default titles, such as
> "Enter the title of your HTML document here," "Untitled Document" "No Title" "Untitled
> Page" "New Page 1""

> **Reference: Trusted Tester v5.1.3 — Test 12.B `2.4.2-page-title-purpose`**
> (`refs/trusted-tester/sc-2.4.2-page-titled.md`)
>
> "Determine whether the Page Title is a **meaningful representation or indication** of
> page content."
