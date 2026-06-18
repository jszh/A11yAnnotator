---
id: info-relationships-v0
sc: 1.3.1
skill: grouping-and-reading-order
visionEvidence: [viewport]
---

# 1.3.1 — info and relationships (v0 atomic rubric)

**Division of labor (v3.2).** You do NOT investigate — the collector extracted the DOM structure (roles,
headings, lists, tables, groups) and a viewport screenshot. JUDGE whether relationships conveyed VISUALLY
are ALSO programmatically determinable. DEFER where a deterministic CLAIM exists.

**Interpreting the deterministic evidence.** `signals.structure` carries `headings[]` ({tag, role, level, text,
offscreen}) and `tables[]` — each table has `{rowCount, thCount, tdCount, hasCaption, captionText, headers[] ({id,
scope, text}), tdHeaderSamples[] ({cell, headers[], resolved[]}), tdWithHeaders, danglingIdref, headerWithNoDataCell,
looksLikeDataTable}`. Use these for the header-association call: `danglingIdref`/`headerWithNoDataCell` are positive
broken-association smells; `tdHeaderSamples[].resolved` shows which header text each `headers=` IDREF actually points
to (judge whether that is the RIGHT header for the cell). `looksLikeDataTable:false` ⇒ likely a layout table (not in
scope). An ABSENT signal is "could not determine", never "passes".

**Judge:** does a relationship a sighted user perceives (a visual heading, a list, a table's
row/column association, a group/fieldset, an emphasis that carries meaning) have a programmatic
equivalent? A visually-bold "heading" that is a plain `<div>` IS a barrier; a visual list marked up as a
real list is NOT. Common failure patterns:
- **Visual heading not marked up:** text that LOOKS like a section heading (larger/bolder, introduces the
  content below it) but is a plain `<div>`/`<span>`/`<strong>` with no heading role — a sighted reader
  perceives the section break, AT users do not (ACT 047fe0 / H69). The same applies to a heading that is
  only *styled* large (e.g. `<strong style="font-size:18pt">`) standing in for an `<h1>`.
- **Broken table header association:** a data table whose column/row HEADER cells do not actually associate
  with the data cells a sighted user reads under/beside them — e.g. a header column with NO data cell in
  its column, or `headers=`/`scope` wiring that leaves a header orphaned (ACT d0f69e). The visual
  row/column grid implies an association the markup does not deliver ⇒ barrier. (A genuine LAYOUT table
  that conveys no data relationships is not in scope — judge whether the grid actually carries data.)

**WCAG soundness caveats (REQUIRED before failing):**
- The relationship must be REQUIRED to be programmatically determinable AND must actually convey meaning —
  purely decorative visual grouping is not a 1.3.1 obligation.
- Do not flag a relationship you cannot confirm is conveyed visually; if the viewport is ambiguous, PARTIAL.
- For a table-association call, you must be able to see the table's structure (headers + the cells they
  should govern); if the `viewport` does not show enough of the grid, return PARTIAL.
- Missing landmark / heading-skip is a best-practice concern, NOT automatically a 1.3.1 failure.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}`.
