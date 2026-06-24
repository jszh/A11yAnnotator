# case-06 — Control (PASS): a numbered "how it works" layout table that linearizes correctly

## Scenario
A "How returns work" explainer for the "SwiftShip" delivery service, built as a layout `<table>`: a vertical list of three steps, each row being `[number badge | step text]`, stacked top to bottom in order 1, 2, 3. It is a genuine two-dimensional, two-column layout (badges left, copy right) marked `role="presentation"` with no `<th>` — exactly the kind of layout table the other cases fail on. The trap: this one linearizes *correctly*. Row-by-row, cell-by-cell, the source order is "1" → "Start your return…" → "2" → "Print the label…" → "3" → "Drop it off…", which is precisely the intended meaningful sequence. An annotator who reflex-flags every layout table would wrongly fail it; the only way to clear it is to actually linearize.

## Attribute tuple
- **content-domain:** logistics / e-commerce — returns process explainer
- **UI-component / pattern:** numbered step list / "how it works" feature, as a 2-column layout table
- **host-language construct:** `<table role="presentation">` with one row per step, `[badge | copy]` cells
- **locale / i18n:** en-US
- **failure-mechanism:** none — control case where row-major linearization preserves the meaningful sequence (the trap is the temptation to over-flag a layout table)

## Developer persona
A product designer built the explainer in a CMS block that happens to emit a two-column table for "icon + text" rows. They authored the steps in order, one row each, and (by good fortune of the row-per-step structure) the badge always sits immediately before its own step in the source. The result reads correctly whether seen or heard — a layout table that does the right thing by construction.

## Element / selector carrying the issue
`table.steps[role="presentation"]` — present as the boundary/trap. There is no defect; the selector is named so a reviewer can confirm the linearized order is correct.

## Exact accessibility mechanism (what AT experiences, why it passes)
- A sighted user reads the three numbered steps top to bottom, badge then text, in order.
- A screen reader linearizes the table: "1" → "Start your return / Open My Orders…" → "2" → "Print the label / We email a prepaid label…" → "3" → "Drop it off / Leave it at any SwiftShip locker…". Each number is immediately followed by its own step, and the steps run 1, 2, 3.
- The linear reading order matches the meaningful sequence conveyed visually. No content is split, interleaved, or reordered. The user receives the same ordered procedure a sighted user does. This satisfies F49's test #2 and the EN/TT pass condition for 1.3.2.

## Expected ACT-style outcome
**passed** (SC 1.3.2 — the layout table linearizes into the correct meaningful sequence; F49 does not apply).

## Why automated tools miss it
Automated tools also produce no finding here — but that is *correct* this time, which is exactly why this case is hard for a tool-mimicking reviewer: there is no signal distinguishing this PASS layout table from the FAIL layout tables in cases 01–05 except the *content* of the linearized order. A reviewer must read the cells in source order and judge that the procedure still makes sense — the same human reasoning the failing cases demand, here yielding a pass. Flagging it merely for being a layout table would be a false positive.

## Citation
> "Check that the linear reading order matches any meaningful sequence conveyed through presentation."
— wcag-techniques/failures/F49.html (Tests — Procedure)

> "If a layout table is used, however, it is important that the content make sense when linearized."
— wcag-techniques/failures/F49.html (Description)

> "Pass: Check 1 is true ... Not applicable: If any requirement precondition is false or the web page does not contain content relevant to WCAG 2.2 Success Criterion 1.3.2 Meaningful Sequence."
— docs/analysis/en301549/EN301549-ANNEX-C-RELEVANT-CLAUSES.md (C.9.1.3.2 — SC 1.3.2 Meaningful sequence)
