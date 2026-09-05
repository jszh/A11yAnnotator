# Loan flowchart description includes every branch

- Expected: `passed`
- Category: Accessibility evidence omitted
- Source pair: `case-03.html` in this aspect
- Exact repair: Extended the existing figcaption to state the score and debt-to-income branches and their three outcomes; also corrected the source's off-by-one “five stages” wording to “six nodes” so the repaired description is internally consistent.
- Primary selector: `svg[role="img"][aria-labelledby="flowName"]`

## Why this passes

The description retains the complete node list and now conveys the directed logic: below 660 declines; 660 or above proceeds to DTI; DTI at or below 40% auto-approves; higher DTI goes to manual underwriting.

## Accessibility-tree / visual evidence

The SVG keeps its concise name while the adjacent figure description exposes every relationship drawn by the arrows.

## Why automated tools may miss the boundary

Name and description are present in both pair members. Correctness depends on matching the prose to the diagram's branches.

## Citation

- Document: `wcag-techniques/failures/F67.html`
- Verbatim quote: “Without a long description that provides complete information, a person may not be able to comprehend or interact with the web page.”
