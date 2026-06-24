# case-03 — Two-column newsletter faked with padded spaces (broken reading order)

## Scenario
A community land-trust e-newsletter runs its lead article as a classic two-column "newspaper"
layout. The columns are faked: each line of one `<p style="white-space:pre">` holds the next chunk
of the LEFT column, a run of padding spaces, then the next chunk of the RIGHT column. Sighted
readers read all the way down the left column, then down the right. But the source order is
left-chunk then right-chunk *per line*, so AT reads across each line — interleaving the two columns
into nonsense. There is no CSS multicolumn, no `<table>`, no list.

## Attribute tuple
- **Content domain:** nonprofit / land-trust newsletter (long-form editorial)
- **UI component / pattern:** two-column newspaper article (parallel columns)
- **Host-language construct:** single `<p>` with `white-space:pre`, columns made of padding spaces
- **Locale / i18n:** en-US
- **Failure mechanism:** F33 — white-space characters create multiple columns; line-wise source order interleaves the columns and breaks reading order

## Developer persona
A volunteer editor composed the newsletter in a fixed-width text email, where manually padding
spaces produced two tidy columns. When the org moved the archive to a simple web page, they pasted
the article into a "preformatted" block to keep the columns, never realizing the line-by-line
source order is what a screen reader follows, not the visual top-to-bottom column flow.

## Element / selector carrying the issue
`p.twocol` — every line concatenates a left-column fragment, padding spaces, and a right-column
fragment. The two-column relationship and the intended reading order live entirely in the spatial
layout of the padded spaces.

## Exact accessibility mechanism
F33 specifically: "Using white space characters to create multiple columns does not provide the
information in a natural reading order." A screen reader reads each line left-to-right and collapses
the runs of spaces, so the user hears the LEFT and RIGHT columns spliced together:
*"Each spring the Hollow Creek plant native milkweed, remove Land Trust invites volunteers
invasive garlic mustard, and to the Miller Tract meadow for spread seed collected from our …"*.
The sentences are shredded; the actual prose ("Each spring the Hollow Creek Land Trust invites
volunteers to the Miller Tract meadow…") is unrecoverable without re-reading column-by-column,
which AT cannot do because no column structure exists. Reflow or a proportional font also destroys
the visual columns.

## Expected ACT-style outcome
**failed** (SC 1.3.1; also 1.3.2 Meaningful Sequence). The multi-column reading-order relationship
conveyed by space padding is not programmatically determinable and the linearized order is wrong.

## Why automated tools miss it
The page contains one valid `<p>` and no structural element, attribute, or role — nothing for an
ACT 1.3.1 rule to attach to. axe-core / WAVE / Lighthouse see ordinary paragraph text and report
nothing. Reconstructing that the padded spaces split the text into two columns whose correct
reading order is column-major (not the line-major DOM order) requires a human to read the visual
columns and notice the linearization is scrambled — judgment no scanner performs.

## Citation
**Reference:** WCAG Technique F33 (`wcag-techniques/failures/F33.html`)
> "The objective of this technique is to describe how using white space characters, such as space, tab, line break, or carriage return, to format columns of data in text content is a failure to use structure properly. Assistive technologies will interpret content in the reading order of the current language. Using white space characters to create multiple columns does not provide the information in a natural reading order."

**Reference:** WCAG Technique F33 (`wcag-techniques/failures/F33.html`)
> "If this content were to be interpreted and spoken by a screen reader it would speak the following lines:" [demonstrating the two columns interleaved line-by-line]
