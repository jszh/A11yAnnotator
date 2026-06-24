# case-04 — Data-grid: inline-editable cells (2.07:1 border = only "click to edit" cue) FAIL vs. labelled Edit button PASS

## Scenario
A pipeline-forecast table has a "Forecast ($K)" column whose figures are inline-editable
(`contenteditable` / `role="textbox"`). The **only** visual indication that those numbers
are editable controls — as opposed to the plain read-only text in the "Owner" column beside
them — is a faint inset rectangle drawn inside each editable cell: `1px solid #B4B4B4` =
**2.07:1** against white. The bottom row instead exposes its edit affordance through an
explicit `<button>` "Edit 410" with a visible text label (and the same faint 2.07:1 pencil
glyph).

- Editable forecast cells (Discovery / Proposal / Negotiation) — **FAIL**: the 2.07:1
  border is the sole cue that these are interactive editing controls.
- "Edit 410" button (Closed won) — **PASS**: the word "Edit" identifies the control; its
  identical 2.07:1 border + faint pencil are not required.

## Attribute tuple
- **content-domain**: SaaS analytics / sales-pipeline dashboard
- **UI-component/pattern**: editable data grid (spreadsheet-style inline edit)
- **host-language construct**: `<span contenteditable role="textbox" aria-label>` cells vs. `<button>` with text
- **locale/i18n**: en
- **failure-mechanism**: a faint cell boundary is the only thing separating "editable control" from "static text"

## Developer persona
A product engineer prototyped an inline-edit grid after pasting a "make any cell editable"
recipe from a rich-text-editor (Quill/TinyMCE) demo. To keep the table looking like a
report, they styled the editable cells with a barely-there light-grey inset border ("just
a hint"). They added `role="textbox"` and `aria-label` per the a11y checklist, so the
automated audit passed. The "Edit" button on the last row predates the inline-edit feature
and was never removed — it accidentally became the one accessible affordance.

## Element / selector carrying the issue
- FAIL: `td .editable` (3 cells) — inset border `#B4B4B4` (2.07:1) is the only cue of editability.
- PASS boundary: `.row-edit` button ("Edit 410") — same 2.07:1 border + pencil, but visible "Edit" text identifies it.

## Exact accessibility mechanism
A low-vision sighted user scanning the grid sees three columns of plain text. At 2.07:1 the
inset rectangles around the forecast figures wash out, so "120 / 340 / 90" look identical
to the static "A. Okafor / M. Levy" owner text — the user has no way to know those numbers
can be clicked and overridden. Because that boundary is the only visual information
identifying the presence of an editing control, it must reach 3:1 and fails. The "Edit"
button row is unaffected: the literal word "Edit" makes the control discoverable regardless
of border contrast. (Keyboard/SR users can still reach the textboxes by role, so this is a
visual-discoverability failure for low-vision users.)

## Expected ACT-style outcome
**failed** (editable cells whose only identifying boundary is below 3:1).

## Why automated tools miss it
The editable cells have correct `role="textbox"` + `aria-label`, so role/name checks pass.
No mainstream scanner measures the contrast of a cell's inset border, and none can infer
that this faint border is the *sole* signal of interactivity — distinguishing an editable
cell from adjacent static text is a meaning-level judgement about what the boundary
communicates. A tool also cannot recognise that the "Edit" button's identical border is
exempt because its text label identifies it. The pass/fail split is invisible to static
analysis.

## Citation
> **WCAG 2.2 Understanding 1.4.11 — User Interface Components (Intent)**
> "Unless the control is inactive, any visual information provided that is necessary for a
> user to identify that a control is present and how to operate it must have a minimum 3:1
> contrast ratio with the adjacent colors."

> **WCAG 2.2 Understanding 1.4.11 — Boundaries**
> "Having a visual boundary indicating the hit area is only required when there is no other
> visual way to identify the presence of the control – and in those cases, the boundary must
> have sufficient non-text contrast in order to pass this success criterion."
