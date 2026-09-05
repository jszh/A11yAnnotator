# case-07 — paired counterfactual for case-03

## Pair and scenario
The public-library budget worksheet keeps the same 4×4 category-by-quarter table, all labels, values, and positive-tabindex implementation as case-03.

This page is paired with **case-03** in the same aspect and retains its realistic page content, visual design, controls, and surrounding structure.

## Exact repair
Change only the sixteen tabindex values from a diagonal scatter to a contiguous column-major sequence: all values under the existing Q1 column header, then the values under Q2, Q3, and Q4. The sequence follows the table’s explicit quarter-column relationships.

## Element / selector
`table tbody td input[type="text"]`

## Expected ACT-style outcome
**passed** — SC 2.4.3. The column-major sequence preserves meaning and operability even though it differs from the visual row-major scan.

## Why this is a hard negative
Focus appears to jump vertically between categories, and the DOM table is row-major. The pass depends on recognizing that each four-stop run remains under one existing quarter header, making it a complete column traversal rather than another scatter.

## Citation
**Reference:** wcag-techniques/failures/F44.html
> When the values of the tabindex attribute are assigned in a different order than the relationships and sequences in the content, the tab order no longer follows the relationships and sequences in the content.
