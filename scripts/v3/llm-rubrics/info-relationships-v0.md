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

`signals.structure.lists[]` carries list semantics (TT 10.D). Each entry is either `kind:'real'` (a genuine
`ul`/`ol`/`dl`) — `{tag, role, itemCount, listStyleNone, hasNonItemChildren, roleOverridesList, nestedDepth,
itemSamples[]}` — or `kind:'faux'` (a CANDIDATE the collector nominated from leading-marker text) —
`{via:'br-bulleted'|'sibling-bulleted', tag, itemCount, itemSamples[]}`.

A `kind:'faux'` entry is a **CANDIDATE, NOT a verdict** — the collector only saw a text marker (bullet/number/
letter/emoji glyph); YOU decide, from the `viewport` screenshot + `itemSamples`, whether a sighted reader actually
PERCEIVES a list that lacks markup. The canonical 10.D failure IS real (a run of items rendered as a bulleted/
numbered list but coded as plain `<div>`/`<br>`/`<p>` with no `ul/ol/dl` ⇒ AT users get an undifferentiated blob
⇒ barrier) — but REJECT these false candidates, which merely start with a symbol and are NOT lists: attribution
lines ("— Author"), dialogue, footnote/disclaimer markers ("* terms apply"), an icon toolbar/menu of short
control labels, a breadcrumb ("Home › Products"), or a single hyphenated sentence. Confirm the items are
genuinely PARALLEL list entries before flagging; if the viewport does not show them clearly, PARTIAL. (Note: a
list rendered with CSS `::before`/`list-style-image` bullets may NOT appear in `lists[]` at all — if you SEE an
unmarked visual list in the viewport that no `lists[]` entry names, judge it from the screenshot directly.)

For `kind:'real'`, `hasNonItemChildren:true` is a structural-break smell (axe owns the strict
`list`/`listitem` validity finding — defer to it); `roleOverridesList:true` means the element was re-purposed
(role=tablist/menu) and is a different question, not a 10.D list failure; judge wrong-TYPE (sequential steps as
`ul`, or unordered items as `ol`) from `itemSamples`.

**Judge:** does a relationship a sighted user perceives (a visual heading, a list, a table's
row/column association, a group/fieldset, an emphasis that carries meaning) have a programmatic
equivalent? A visually-bold "heading" that is a plain `<div>` IS a barrier; a visual list marked up as a
real list is NOT. Common failure patterns:
- **Visual heading not marked up:** text that LOOKS like a section heading (larger/bolder, introduces the
  content below it) but is a plain `<div>`/`<span>`/`<strong>` with no heading role — a sighted reader
  perceives the section break, AT users do not (technique H69). The same applies to a heading that is
  only *styled* large (e.g. `<strong style="font-size:18pt">`) standing in for an `<h1>`.
- **Broken table header association:** a data table whose column/row HEADER cells do not actually associate
  with the data cells a sighted user reads under/beside them — e.g. a header column with NO data cell in
  its column, or `headers=`/`scope` wiring that leaves a header orphaned. The visual
  row/column grid implies an association the markup does not deliver ⇒ barrier. (A genuine LAYOUT table
  that conveys no data relationships is not in scope — judge whether the grid actually carries data.)
- **List not marked up (TT 10.D):** a run of items a sighted reader perceives as a list — bullet/number
  glyphs, or `<br>`-separated bulleted lines — coded as plain `<div>`/`<span>`/`<p>` with no `ul`/`ol`/`dl`
  (a `kind:'faux'` entry in `signals.structure.lists`). The list relationship (membership, count, order) is
  visually apparent but not programmatic ⇒ barrier. Confirm from `itemSamples` it reads as discrete items.

**WCAG soundness caveats (REQUIRED before failing):**
- The relationship must be REQUIRED to be programmatically determinable AND must actually convey meaning —
  purely decorative visual grouping is not a 1.3.1 obligation.
- Do not flag a relationship you cannot confirm is conveyed visually; if the viewport is ambiguous, PARTIAL.
- For a table-association call, you must be able to see the table's structure (headers + the cells they
  should govern); if the `viewport` does not show enough of the grid, return PARTIAL.
- Missing landmark / heading-skip is a best-practice concern, NOT automatically a 1.3.1 failure.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}`.
