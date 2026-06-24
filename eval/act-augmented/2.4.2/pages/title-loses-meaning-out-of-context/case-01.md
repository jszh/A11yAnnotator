# case-01 — Online textbook chapter titled only "Chapter 3"

## Scenario
The reading view of an LMS / e-textbook reader. The page is Chapter 3 ("Newton's Laws of
Motion") of *University Physics, 8th edition* (Tisdale & Okonkwo), Part I: Mechanics, chapter
3 of 41. The body makes every bit of that explicit — reader chrome ("University Physics, 8th
ed. · Part I: Mechanics"), an over-line naming the book and authors, the H1 chapter title, and
a "Part I: Mechanics · Chapter 3 of 41" line. But the document `<title>` is the bare positional
fragment **`Chapter 3`**.

## Attribute tuple
- **content-domain:** higher-education physics textbook / LMS e-reader
- **UI-component/pattern:** long-form reading view with section headings, a figure, and prev/next chapter nav
- **host-language construct:** semantic `<article>` + `<h1>`/`<h2>` outline; `<title>` populated from one field
- **locale/i18n:** en
- **failure-mechanism:** title reduced to a context-dependent positional fragment (G127 collection position stripped)

## Developer persona
A back-end engineer wiring up the reader's page-rendering template. The CMS exposes each chapter
record with a `chapter.shortLabel` ("Chapter 3") and a separate `chapter.title`, `book.title`,
`book.edition`. Under deadline they bound `<title>` to the shortest field that "looked like a
title" — `chapter.shortLabel` — never imagining the title read in isolation. The rich book/part
context lives only in the rendered body.

## Element / selector carrying the issue
`head > title` (text node `Chapter 3`).

## Exact accessibility mechanism (what AT experiences, why it fails)
A screen reader announces the document title on page load and exposes it in the rotor / page-title
query; the browser shows it in the tab, history, and bookmark name. A student reading the page has
full context, so it *seems* fine. But a screen-reader user studying for an exam typically has
several chapters and other resources open. In the tab list / page-title query they hear "Chapter 3"
— with no book, no subject, no edition. It does not identify the topic out of context and does not
convey the page's position in its collection (which book? which of dozens of "Chapter 3" pages?).
It thus fails limb (b): the title does not describe the topic or purpose when read out of context.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
A `<title>` element is present and non-empty, so axe-core `document-title`, WAVE, and Lighthouse
all pass. "Chapter 3" is not on any placeholder blocklist ("Untitled", "New Page 1"). Judging that
the title is meaningless once isolated from the body — and that it cannot convey collection
position per G127 — requires imagining the title next to other books' identical "Chapter 3" pages.
That is contextual human reasoning about information architecture, which no static checker performs.

## Citation
> **WCAG Technique G127 (Identifying a web page's relationship to a larger collection of web pages), Examples — "Chapters in an online textbook":**
> "An online textbook is divided into chapters. The title of each web page includes the number and title of the chapter as well as the title of the textbook."

(Verbatim from `wcag-techniques/general/G127.html`. This page violates that prescription: the title
includes the chapter number but omits the chapter title AND the textbook title.)

> **WCAG Technique G88 (Providing descriptive titles for web pages), Description:**
> "Make sense when read out of context, for example by a screen reader or in a site map or list of search results"

(Verbatim from `wcag-techniques/general/G88.html`.)
