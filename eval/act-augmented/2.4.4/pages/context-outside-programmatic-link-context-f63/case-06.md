# case-06 — LMS readings: "Open" link and its chapter title are different list items, with CSS hiding the order

## Scenario
A university LMS (Canvas-style) course-readings page for "BIO 201 — Cell Biology, Module 3". Each
required reading shows a chapter title on the left and a blue "Open" link on the right, neatly on one
row. But for each reading the author emits TWO separate `<li>` elements: first an `<li class="open">`
containing only the "Open" link, then an `<li class="desc">` containing the chapter title. A CSS grid
places the title cell in the left column and the link cell in the right column of the same visual row,
so on screen it reads "Chapter 4 … Open". In the DOM, in screen-reader reading order, and in the
Links list, the order is reversed: "Open" comes first and its describing title is a *different list
item that follows it*. Three identical "Open" links.

## Attribute tuple
- **content-domain:** higher-ed LMS / course readings page
- **UI-component/pattern:** readings list rendered as a CSS-grid two-column "title | action" layout
- **host-language construct:** `<ul>` where each reading = an `<li class="open">` (link) FOLLOWED by a separate `<li class="desc">` (title); CSS `grid-column`/`grid-row` reorder them visually
- **locale/i18n:** en
- **failure-mechanism:** F63 — description in a different list item; CSS visual reorder makes it LOOK like context precedes the link, but DOM/reading order has the link first (the ordering hazard, weaponized by CSS so the visual snapshot looks fine)

## Developer persona
An LMS theme developer wanted the action button right-aligned on the same line as each title without
nesting markup. They learned the CSS-Grid trick of emitting "cells" as flat siblings and positioning
each with `grid-column`/`grid-row`, so they output the link cell and the title cell as independent
`<li>`s and placed them. To get the link to render on the right they happened to emit the link `<li>`
first and the title `<li>` second, then swapped their columns in CSS. The page looks immaculate, so
no one suspected the reading order had been inverted.

## Element / selector carrying the issue
The three `li.open > a` elements (hrefs `/files/bio201/ch4-membrane-structure.pdf`,
`/files/bio201/ch11-transport.pdf`, `/files/bio201/review-aquaporins.pdf`), each with accessible name
"Open". Each describing title is in the *following* sibling `li.desc` — a different list item, not the
link's own list item, and not referenced by any ARIA property.

## Exact accessibility mechanism (what AT experiences, why it fails)
"Programmatically determined link context" includes the link's own list item, but here the link's
list item (`li.open`) contains only the word "Open"; the chapter title lives in a separate sibling
`li.desc`. So the link's context is empty. Worse, screen readers and the Links list follow DOM order,
not the CSS-grid visual order: a user reading top-to-bottom hears "Open, link" and only afterward
"Chapter 4: Membrane Structure…", so the description *follows* the link — the exact confusion G53 and
Understanding warn about. The CSS purely repaints positions; it does not move the title into the
link's list item or change reading order. Confirmed at runtime: the DOM `<li>` sequence per reading
is `[open]"Open"` then `[desc]"Chapter 4…"`, and all three links expose the name "Open". F63 plus the
ordering hazard.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
This is the hardest variant for a scanner because the *visual snapshot* looks fully compliant — title
beside its link, sensible order. Each link has a non-empty name ("Open"), valid href, good contrast,
and valid `<ul>`/`<li>` markup; axe-core/WAVE/Lighthouse pass. A purely visual or single-snapshot
tool that read left-to-right would even "see" the title before the link. Detecting the failure
requires comparing CSS-grid visual order against DOM/reading order, knowing that the title is in a
*different* `<li>` than the link, and judging that "Open" alone is non-descriptive — three layers of
reasoning (DOM container boundaries, visual-vs-reading order, residual sufficiency) no automated
checker performs.

## Citation
> **WCAG Technique G53 — Description, Note:**
> "These descriptions will be most useful to the user if the additional information needed to understand the link precedes the link. If the additional information follows the link, there can be confusion and difficulty for screen reader users who are reading through the page in order (top to bottom)."

(Verbatim from `wcag-techniques/general/G53.html`. CSS makes the title appear to precede the link, but in reading order it follows it.)

> **WCAG Technique F63 — Tests, Procedure, step 1:**
> "Check whether the context is contained in the same sentence, paragraph, list item, table cell, or associated table headers."

(Verbatim from `wcag-techniques/failures/F63.html`. The title is in a different list item from the link, so this check is false; with no ARIA association either, the failure condition applies.)
