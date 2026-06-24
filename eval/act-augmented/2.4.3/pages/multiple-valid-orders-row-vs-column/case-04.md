# case-04 — 360° rating matrix, column-major by rater (valid alternative)

## Scenario
An HR 360-degree competency review. The grid's rows are competencies (Communication,
Ownership, Collaboration, Adaptability); its columns are rater perspectives (Self,
Manager, Peer, Direct report). Each of the 20 cells is an independent
`<input type="range">` slider (1–5) — a true 4×4 field of focusable controls, not a
radio-group matrix — so focus order is governed entirely by DOM source order. The visual
layout is row-major (one competency per row), but Tab walks **column-major by rater**: all
four competency sliders for "Self", then "Manager", then "Peer", then "Direct report,"
re-placed visually with CSS Grid and **no `tabindex`**. Assessing from one perspective at a
time is exactly how a 360 instrument is filled out, so column-major reflects a logical
relationship and the page **passes**.

## Attribute tuple
- **Content domain:** SaaS HR / performance-management dashboard
- **UI component / pattern:** matrix (Likert-style) survey built from `range` sliders, one per cell
- **Host-language construct:** column-major DOM source order + CSS Grid placement; sliders (not radios) to avoid roving-tabindex confounds
- **Locale / i18n:** en
- **Failure mechanism:** NONE — false-positive trap. Order is non-default (column-major) but tied to a real per-rater workflow.

## Developer persona
A product engineer on an HR-tech team modeled the form data as `ratings[rater][competency]`
and rendered it by looping raters in the outer loop. That produced column-major (per-rater)
source order. They chose sliders over radio matrices on the designer's advice (sliders test
better on touch) and used CSS Grid to keep the familiar table appearance. They never added
`tabindex`, so tab order is just the natural per-rater source order — which matches the
intended "one perspective at a time" completion flow.

## Element / selector carrying the issue
The 20 `.cell input[type="range"]` controls inside `.grid[role="group"]`. DOM order is
`#sf_comm, #sf_own, #sf_coll, #sf_adapt, #mg_comm, …` (column-major by rater); visual order
reads row-major by competency. Inspect DOM order against each cell's `grid-column` (rater)
value.

## Exact accessibility mechanism
A keyboard / screen-reader user tabbing the matrix receives focus down the Self column
first — "Self · Communication, slider", "Self · Ownership", … — then the Manager column,
and so on. Every slider has an explicit `<label>` giving a unique rater+competency name, so
each stop is unambiguous, and the per-rater run is a coherent, predictable sequence. Meaning
(a per-rater assessment column) and operability (every slider reachable once, adjustable
with arrow keys) are preserved. The SC accepts column-at-a-time and requires only one valid
order, so the evaluator must recognize this as a legitimate alternative rather than flagging
it for departing from row-major.

## Expected ACT-style outcome
**passed** (SC 2.4.3). A valid column-major alternative aligned to the instrument's
completion workflow.

## Why automated tools miss it
The page has no detectable defect: all sliders are labeled, headers are real, contrast
passes, nothing is hidden — axe-core, WAVE, and Lighthouse stay silent. The aspect being
tested is over-flagging: a heuristic that insisted on row-major (or on visual-order) tab
flow would false-positive here. Judging that "one rater column at a time" reflects a logical
relationship requires understanding the 360-review workflow, which no static tool models.

## Citation
**Reference:** WCAG 2.2 Understanding — Focus Order (`wcag-understanding/focus-order.html`)
> "moving through components in a table one row at a time or one column at a time both reflect the logical relationships in the content. Either order may satisfy this success criterion."

**Reference:** Trusted Tester v5.1.3 (`refs/trusted-tester/sc-2.4.3-focus-order.md`)
> "The focus order preserves the meaning of the page, AND ... The focus order preserves the operability of the page."
