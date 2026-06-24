# case-04 — Parallel-text poem: facing Spanish/English columns interleaved line-by-line when linearized

## Scenario
A "parallel texts" reading-group page presents Antonio Machado's "Caminante, son tus huellas" with the Spanish on the left and a facing English translation on the right, in a layout `<table>`. Each column is a self-contained four-line poem; the eye reads one column fully, then the other. But the table is row-major, so linearization alternates a Spanish line, then its English line, then the next Spanish line — interleaving the two languages and shattering both poems as sequences. Every cell also carries a `lang` switch (Spanish cells are `lang="es"`), so a screen reader flips pronunciation/voice on every single line, compounding the disorientation.

## Attribute tuple
- **content-domain:** education / humanities — bilingual literary parallel text
- **UI-component / pattern:** facing-page / side-by-side translation columns
- **host-language construct:** `<table role="presentation">` with per-cell `lang="es"` on the left column
- **locale / i18n:** es + en bilingual (mixed-language passages with correct per-cell `lang`)
- **failure-mechanism:** F49 — two parallel meaningful sequences (two poems) interleaved line-by-line by row-major linearization; an i18n twist (per-line language flip) sharpens it

## Developer persona
A literature postgrad built the reading-group page in a plain HTML editor. They knew enough to add `lang="es"` to the Spanish cells (so they would not be mispronounced) — which makes the page look *more* accessible, not less. But they reached for a table to get the clean facing-page columns and never considered that a screen reader reads tables row-by-row, interleaving the two poems they had carefully kept side by side.

## Element / selector carrying the issue
`table.parallel[role="presentation"]` — the row-major encoding of two column-wise poems. The `td.es[lang="es"]` / `td.en` pairing per row is exactly what produces the line-alternated interleave.

## Exact accessibility mechanism (what AT experiences, why it fails)
- A sighted reader reads the left column as one Spanish poem, then the right column as one English poem (or compares line-for-line at will). Each column is a coherent sequence.
- A screen reader linearizes row by row: "Caminante, son tus huellas" (es) → "Wanderer, your footprints are" (en) → "el camino y nada más" (es) → "the road and nothing more" (en) → … The two poems are spliced together line by line.
- The user can perceive neither poem as a continuous whole; each line of one language is interrupted by a line of the other. The `lang` switches make the synthesizer change voice on every line, so even the alternation is jarring. The meaningful sequence of each poem is destroyed.

## Expected ACT-style outcome
**failed** (SC 1.3.2 — F49: a layout table whose linearization interleaves two meaningful sequences so neither can be read in order).

## Why automated tools miss it
This page would actually score *well* on naive checks: every Spanish cell has a correct `lang="es"`, every cell has text, the table is `role="presentation"`, and there is no header/data relationship for a 1.3.1 checker to fault. axe/WAVE/Lighthouse have no concept that the two columns are each a self-contained poem meant to be read in full, nor that row-major linearization interleaves them. Recognizing two parallel meaningful sequences and that the linearization splices them is a human literary/reading judgment.

## Citation
> "Check that the linear reading order matches any meaningful sequence conveyed through presentation."
— wcag-techniques/failures/F49.html (Tests — Procedure)

> "if a page contains two independent articles, the relative order of the articles may not affect their meaning, as long as they are not interleaved."
— wcag-understanding/meaningful-sequence.html (Intent of Meaningful Sequence)

> "It is important that it be possible to programmatically determine at least one sequence of the content that makes sense."
— wcag-understanding/meaningful-sequence.html (Intent of Meaningful Sequence)
