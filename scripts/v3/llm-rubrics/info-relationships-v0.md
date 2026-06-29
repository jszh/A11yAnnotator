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
scope, text}), tdHeaderSamples[] ({cell, headers[], resolved[]}), tdWithHeaders, danglingIdref, headersRefsNonCell,
headersRefsSelf, headerWithNoDataCell, looksLikeDataTable, roleOverride}`.

**The `headers=` IDREF wiring is checked DETERMINISTICALLY — TRUST it, do not second-guess a resolving ref.** A
collector pass verified, for every `<td headers="…">`, whether each IDREF resolves to a th/td CELL in the SAME table:
- `danglingIdref:true` ⇒ a ref points to an id NOT in this table (cross-table / missing) → BROKEN ref → barrier.
- `headersRefsNonCell:true` ⇒ a ref resolves to a non-cell element (a `<span>`/`<div>` that carries the id) → barrier.
- `headersRefsSelf:true` ⇒ a data cell references its OWN id (a cell is not its own header) → barrier.
- **All three FALSE ⇒ every `headers=` IDREF that EXISTS resolves to a valid same-table cell — do NOT flag the IDREF
  RESOLUTION, and do NOT invent a "wrong / multiple / redundant header" barrier on it.** A cell referencing MULTIPLE
  headers (its column header AND its row header) is CORRECT HTML, not a "misrepresentation"; a present, resolving
  association is never a barrier for being sub-optimal. `tdHeaderSamples[].resolved` is shown to support the
  BROKEN-ref call above, not to invite re-judging valid wiring.

This trust applies ONLY to the resolution of refs that exist; it does not pre-clear the OTHER table failure patterns
below (a header with no data cell in its column, a visual grid with no programmatic headers at all). Judge those from
`headers[]`/`scope`/the grid as usual — but do not promote `headerWithNoDataCell` or a lone header-only table to a
barrier by itself (a table with no data cells conveys no relationship to break). `looksLikeDataTable:false` or a
non-null `roleOverride` (`role=heading`/`presentation`/`none`) ⇒ NOT a data table: `role=presentation`/`none` is the
author's EXPLICIT layout declaration, so do not flag it for "stripped/missing table semantics" (header facet
INAPPLICABLE) unless the viewport unmistakably shows mislabelled data — and then prefer PARTIAL. An ABSENT signal is
"could not determine", never "passes".

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
- **Broken table header association:** a DATA table (it has both header cells AND data cells) whose column/row
  HEADER cells do not actually associate with the data cells a sighted user reads under/beside them — e.g. a header
  whose column/row holds data but is not linked to it, or a visual grid with no programmatic `th`/`scope`/`headers=`
  at all. The visual row/column grid implies an association the markup does not deliver ⇒ barrier. Use the
  deterministic ref flags (`danglingIdref`/`headersRefsNonCell`/`headersRefsSelf`): a RESOLVING `headers=` ref is NOT
  broken — do not flag it, and do not flag a cell merely for referencing multiple valid headers. (A genuine LAYOUT
  table, or a header-only table with no data, conveys no data relationship and is not in scope.)
- **List not marked up (TT 10.D):** a run of items a sighted reader perceives as a list — bullet/number
  glyphs, or `<br>`-separated bulleted lines — coded as plain `<div>`/`<span>`/`<p>` with no `ul`/`ol`/`dl`
  (a `kind:'faux'` entry in `signals.structure.lists`). The list relationship (membership, count, order) is
  visually apparent but not programmatic ⇒ barrier. Confirm from `itemSamples` it reads as discrete items.

**ARIA structures — association can be POSITIONAL or via `aria-owns`; do NOT over-flag a well-formed one.**
The deterministic `signals.structure.tables[]`/`lists[]` cover NATIVE `<table>`/`<ul>`/`<ol>`/`<dl>` ONLY. An ARIA
grid/list built from `<div>`/`<span>` (`role=table`/`grid`/`list`/`row`/`cell`) carries NO entry there, so you judge it
from the roles + viewport — but judge it RIGHT, and do not invent a barrier the markup does not have:
- **`aria-owns` IS a valid association.** A `role=list`/`role=table`/`role=row`/`role=rowgroup` may own its children
  via `aria-owns="id1 id2"` instead of DOM nesting. If those ids resolve to the expected child roles
  (`role=listitem`/`role=cell`/`role=row`), the relationship IS programmatically determinable — do NOT flag the
  container as "empty" or "broken" because its children are owned rather than nested (ff89c9).
- **ARIA grid association is POSITIONAL.** In a `role=table`/`grid`, a `role=columnheader`/`rowheader` associates with
  `role=cell`/`gridcell` by GRID POSITION (column/row index) — exactly as a sighted reader reads it. A WELL-FORMED ARIA
  grid (header roles present AND every data row has the SAME cell count as the header row) conveys the row/column
  relationship correctly ⇒ NOT a barrier. Flag an ARIA grid ONLY when the visual grid has NO header roles at all, or a
  data row's cell COUNT does not match the header row (a genuinely misaligned/broken grid) (d0f69e ARIA pass).
- **`headers=` is INERT on an ARIA cell.** The HTML `headers=` attribute is meaningful ONLY on a native `<td>`/`<th>`;
  on a `<div>`/`<span>` with `role=cell`/`gridcell` it is NOT an ARIA association and neither creates nor breaks the
  relationship (the positional grid is the association). Do NOT flag a `headers=` value on an ARIA cell as
  "wrong/swapped/redundant/mis-wired" — the deterministic `danglingIdref`/`headersRefsNonCell`/`headersRefsSelf` flags
  apply ONLY to a native `<table>`, so on an ARIA cell they are silent BY DESIGN, not "could not determine" (a25f45).

**WCAG soundness caveats (REQUIRED before failing):**
- The relationship must be REQUIRED to be programmatically determinable AND must actually convey meaning —
  purely decorative visual grouping is not a 1.3.1 obligation.
- Do not flag a relationship you cannot confirm is conveyed visually; if the viewport is ambiguous, PARTIAL.
- For a table-association call, you must be able to see the table's structure (headers + the cells they
  should govern); if the `viewport` does not show enough of the grid, return PARTIAL.
- Missing landmark / heading-skip is a best-practice concern, NOT automatically a 1.3.1 failure.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}`.
