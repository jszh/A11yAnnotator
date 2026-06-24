# case-02 — Two-column flex shell (nav + lesson) that refuses to wrap at 320px

## Scenario
A university LMS course page uses the familiar desktop "fixed sidebar nav + main content" layout, built
with `display: flex`. The sidebar has `flex: 0 0 240px` and the lesson column has `min-width: 520px`,
and the flex row has no `flex-wrap`. On desktop it is a tidy two-column page. At a 320 CSS-px viewport
the two columns cannot stack and cannot shrink below their combined minimum, so the page scrolls
horizontally. Both columns are ordinary, fully reflowable content (a link list and running prose) —
neither requires two-dimensional layout.

## Attribute tuple
- **Content domain:** higher-ed LMS / course page
- **UI component / pattern:** off-canvas-style fixed sidebar + main column (flex shell)
- **Host-language construct:** `display: flex` with no `flex-wrap`; `flex: 0 0 240px` + `min-width: 520px`
- **Locale / i18n:** en (LTR)
- **Failure mechanism:** flex/grid row that refuses to wrap; columns will not stack at 320px

## Developer persona
An ed-tech developer cloned the layout from a Flexbox tutorial that produced a sidebar and a main area.
The tutorial used `flex` without `flex-wrap` because at desktop sizes wrapping never came up. They added
`min-width: 520px` to the lesson "so paragraphs don't get uncomfortably narrow," not realizing this is
exactly what blocks reflow. They tested in a maximized browser and on a tablet in landscape, both of
which are wide enough to hide the bug.

## Element / selector carrying the issue
`.shell` (the non-wrapping flex container) together with `.lesson { min-width: 520px }`. The combined
minimum width of the two columns plus the gap and padding exceeds 320px and the row cannot wrap.

## Exact accessibility mechanism
A media-query or `flex-wrap: wrap` would let the sidebar drop below the content into a single column at
narrow widths. Without it, at 320 CSS px the flex row stays horizontal and the page's `scrollWidth`
exceeds the viewport. A magnifier user at 400% zoom must scroll right to even reach the start of the
lesson text, then scroll back left for the next line. The Reflow exception is for sections that need a
two-dimensional layout (tables, maps, media); a navigation list and a lesson of paragraphs are not such
sections — they are precisely the "adjust or relocate content into a single column" case.

## Expected ACT-style outcome
**failed** (SC 1.4.10). b4f0c3 (viewport meta) passes; the rendered layout is what fails.

## Why automated tools miss it
Static scanners see a valid `<nav>`, a valid `<main>`, semantic lists, and a permissive viewport meta —
all green. They do not lay the page out at 320 CSS px to discover that the flex row will not wrap and the
columns will not fit. And the deciding question — are these two columns "content that requires
two-dimensional layout for understanding," or ordinary content that should stack? — is a meaning
judgment a tool cannot make.

## Citation
**Reference:** Understanding SC 1.4.10 Reflow (`wcag-understanding/reflow.html`)
> "A common way for many article-driven web pages to meet the Reflow success criterion is to ensure that the presentation of a web page can adjust to a single column of content, fitting into a 320 CSS pixel wide viewport and only requiring a user scroll vertically to read the content of the web page."

**Reference:** Understanding SC 1.4.10 Reflow (`wcag-understanding/reflow.html`)
> "A section of content that requires two-dimensional layout for understanding or functionality, such as a table or map, has an exception to this success criterion."

**Reference:** WCAG Technique C31 — Using CSS Flexbox to reflow content (`wcag-techniques/css/C31.html`)
> "Position the layout regions in the flexbox container as a row of adjacent flexbox items, which may wrap to new rows as needed in much the same way as words in a paragraph wrap."

(This page violates the technique by omitting `flex-wrap`/media queries and pinning `min-width: 520px`, so the row can never wrap.)
