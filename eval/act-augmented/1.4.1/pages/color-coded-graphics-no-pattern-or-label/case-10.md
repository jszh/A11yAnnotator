# Pipeline retains green and red with status words and symbols

- Expected: `passed`
- Category: Redundant graphic or visual cue
- Source pair: `case-03.html` in this aspect
- Exact repair: Kept the green and red stage backgrounds while adding visible check/cross symbols and “passed,” “failed,” or “not run” text to every stage; updated the graphic name with the same statuses.
- Primary selector: `.pipeline .stage`

## Why this passes

Every stage outcome remains distinguishable in grayscale and is available in both visible text and the collapsed graphic's accessible name.

## Accessibility-tree / visual evidence

The computed graphic name lists all six stage outcomes; rendered stage cards each contain a persistent status word and shape cue.

## Why automated tools may miss the boundary

A detector may remain anchored on the original `.pass` and `.fail` colors even though they no longer carry status alone.

## Citation

- Document: `wcag-techniques/general/G111.html`
- Verbatim quote: “A flow chart describes a set of iterative steps to complete a process. It uses dashed, arrowed lines with a green background to point to the next step in the process when the specified condition passes.”
