# case-01 — Product detail page titled "Untitled Document"

## Scenario
A fully built, styled e-commerce product-detail page for the **Acme Noise-Cancelling
Headphones X9** — gallery, price, six-row spec table, in-stock badge, and an add-to-cart
form. The `<title>` is the literal authoring-tool default **`Untitled Document`** (the
string Adobe Dreamweaver and many other WYSIWYG editors insert into every new blank
document). The developer fleshed out the body but never replaced the boilerplate title.

## Element / selector carrying the issue
- `head > title` — text node `Untitled Document`.
- The contradicting evidence lives in `main h1` (`Acme Noise-Cancelling Headphones X9`),
  the `.specs` table, and the `.price` block.

## Exact accessibility mechanism
- A screen-reader user who lists open tabs/windows, reads browser history, or opens a
  bookmark hears/sees **"Untitled Document"** as the page name. The title is the first
  thing announced when the page loads and the label used in the window/tab switcher.
- Because the string names nothing about headphones, a price, or Acme, the user cannot
  tell this tab apart from any other untouched-template page, cannot recognize it in a
  search-result list, and cannot orient on load. Limb 1 (a title exists) **passes**;
  limb 2 (the title identifies the topic/purpose) **fails**.

## Expected ACT-style outcome
**failed** — under ACT rule c4a8a4 ("HTML page title is descriptive"). It explicitly
PASSES presence rule 2779a5 because the title is a non-empty text node.

## Why automated tools miss it
`Untitled Document` is a real, valid, non-empty string, so axe-core, WAVE, and Lighthouse
(which only check that a non-empty `<title>` exists) all report a pass. Catching it
requires reading the body, recognizing it has specific identifiable content (a named
product with specs and a price), and recognizing the title string as an IDE leftover that
names none of it — a semantic judgment no rule-based linter can make without a brittle,
false-positive-prone allowlist of every editor default.

## Citation
> **Reference: WCAG Techniques — F25** (`wcag-techniques/failures/F25.html`)
>
> "Examples of text that are not titles include: Authoring tool default titles, such as
> "Enter the title of your HTML document here," "Untitled Document" "No Title" "Untitled
> Page" "New Page 1""

> **Reference: WCAG Understanding — Page Titled** (`wcag-understanding/page-titled.html`)
>
> "The intent of this success criterion is to help users find content and orient
> themselves within it by ensuring that each web page has a descriptive title. Titles
> identify the current location without requiring users to read or interpret page content."
