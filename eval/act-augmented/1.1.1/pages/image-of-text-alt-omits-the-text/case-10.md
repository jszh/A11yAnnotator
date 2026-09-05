# Award graphic name transcribes its meaningful text

- Expected: `passed`
- Category: Accessibility evidence omitted
- Source pair: `case-03.html` in this aspect
- Exact repair: Replaced only the generic SVG title with the award, recipient, quarter, team, and presenter text drawn in the unchanged certificate.
- Primary selector: `.card svg[role="img"]`

## Why this passes

The single image node now exposes the same meaningful words that sighted users read in the certificate.

## Accessibility-tree / visual evidence

The computed graphic name includes “Employee of the Quarter,” “Dana Okafor,” “Q2 2026,” “Customer Success,” and the presenting team.

## Why automated tools may miss the boundary

The source and repair both have a valid non-empty SVG name. Only transcription-equivalence separates fail from pass.

## Citation

- Document: `wcag-techniques/general/G94.html`
- Verbatim quote: “When non-text content contains words that are important to understanding the content, the alt text should include those words.”
