# case-03 — Electronic program guide: grid is exempt, but one featured cell's poster+synopsis can't reflow (cells must still meet Reflow)

## Scenario
A streaming TV "What's On" electronic program guide (EPG) renders a channel × time-slot grid. The grid
as a whole is a legitimate 1.4.10 exception — the Understanding doc names the EPG explicitly — so its
horizontal scrolling is acceptable. The defect is one level deeper: a single "featured premiere" cell
("Nebula Drift") is built with a fixed-width 560px two-column internal layout (poster art beside a
synopsis and a "how to watch" line, both `white-space: nowrap`). That ONE cell's content cannot reflow
below ~560px, so at 320px the cell itself requires horizontal scrolling — and the SC requires
individual cells to still meet Reflow.

## Attribute tuple
- **Content domain:** media / streaming TV guide (entertainment)
- **UI component / pattern:** electronic program guide (grid) with a rich "featured" cell
- **Host-language construct:** CSS grid cell with fixed-width internal flex + `white-space: nowrap`
- **Locale / i18n:** en-GB (UK channel names, 24h-ish primetime copy)
- **Failure mechanism:** excepted grid is fine, but a cell's own content over-runs 320px (cell-level Reflow breach)

## Developer persona
A front-end dev correctly put the EPG behind a horizontal-scroll region, having read that grids are
exempt. For the promoted premiere they dropped in a marketing "hero cell" component lifted from the
homepage — a 560px poster-plus-blurb card with nowrap text — without realizing that the grid exception
covers the grid's overall 2D scroll, not the contents of a single cell. They assumed "the whole guide
is exempt, so anything inside it is exempt too."

## Element / selector carrying the issue
`.epg .featured .featured-inner` — the fixed `width:560px` flex container inside the "Nebula Drift" cell;
its `.meta p` and `.meta .how` use `white-space: nowrap`. The surrounding grid (`.epg-scroll`) is the
correctly-excepted element that must NOT be flagged.

## Exact accessibility mechanism
After the user scrolls the (excepted) grid to bring the featured cell into a 320 CSS px viewport, the
cell's poster + synopsis + "how to watch" line still extend ~560px wide and the nowrap text will not
break, so the user must scroll horizontally a second time WITHIN the cell to read the synopsis and the
watch instructions. The Understanding doc states that "sections of content within the two-dimensional
layout, such as each cell within a table, would still need to meet this success criterion," and that
EPG cells "containing information about how to watch and poster art would be expected to fit within the
required width." This cell does not.

## Expected ACT-style outcome
**failed** (SC 1.4.10). The grid exception is valid, but the featured cell's content fails Reflow inside
the cell.

## Why automated tools miss it
A scanner that notices the grid's horizontal scrollbar must NOT flag it (valid exception), and a scanner
has no way to model "the grid may 2D-scroll, but each cell's internal content must still reflow at
320px." Detecting that one cell's poster+synopsis layout overruns the cell requires rendering at the
target viewport AND the semantic judgment that this is a non-conforming cell within an otherwise-exempt
grid. Nothing is missing or malformed in the markup (the cell has a `role="article"` and an aria-label).

## Citation
**Reference:** Understanding SC 1.4.10 Reflow (`wcag-understanding/reflow.html`)
> "However, sections of content within the two-dimensional layout, such as each cell within a table, would still need to meet this success criterion."

**Reference:** Understanding SC 1.4.10 Reflow (`wcag-understanding/reflow.html`)
> "For example, an \"electronic program guide\" is a type of grid used to display media programs to stream online. It might be presented alongside other content outside of its grid-based layout. The individual cells of the program guide containing information about how to watch and poster art would be expected to fit within the required width or height."

**Reference:** Understanding SC 1.4.10 Reflow (`wcag-understanding/reflow.html`)
> "However, individual cells would still need to meet Reflow - unless the cell contains content that also requires two-dimensional layout for usage or meaning."
