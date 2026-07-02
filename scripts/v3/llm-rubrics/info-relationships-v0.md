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

**TABLE ASSOCIATION — CONSULT THE DETERMINISTIC VERDICT FIRST (a HARD GATE you may not override).** Before any
table/header reasoning, read `signals.structure.tableAssociation` ({page, hasDataTable, perTable[]}). A
deterministic pass computed each table's header-to-data association from the live DOM. **You may raise a
table/header-association barrier ONLY for a table whose `perTable` verdict is `UNCERTAIN` or `BROKEN`:**
- `page: NO_DATA_TABLE` or `hasDataTable: false` ⇒ **no NATIVE `<table>` data table was collected — you may NOT raise a
  NATIVE-table header-association barrier.** This gate is computed from native `<table>` markup ONLY; it does NOT cover an
  ARIA grid (`<div role=grid/table/row/columnheader/gridcell>`). So: if the viewport looks like a grid here, it is EITHER
  a layout/CSS grid / `role=presentation` (no association owed — do not invent one) OR an ARIA grid the native pass cannot
  see. To tell them apart and judge the ARIA case, resolve a cell with `query_ax_node` (below) instead of eyeballing — a
  `NO_DATA_TABLE` page verdict is NOT a clearance for an ARIA grid.
- `perTable[i] = VALID` ⇒ that table's association IS programmatic (resolving `scope`/`headers=`) — do NOT flag it.
- `perTable[i] = NOT_DATA` ⇒ a layout/presentation table — owes no data association — do NOT flag it.
- `perTable[i] = BROKEN` ⇒ a real broken ref (dangling/non-cell/self) — flag it.
- `perTable[i] = UNCERTAIN` ⇒ a data table with NO `scope` and NO `headers=` — THIS is the only case you judge:
  decide from the grid whether position alone conveys the header→data association. A `<th>` being hidden from AT
  (`aria-hidden`) does NOT by itself break a simple positional 2-cell table — flag only if a sighted reader's
  row/column association is genuinely lost to AT users.
  **"Position alone conveys the association" REQUIRES an actual `<th>` cell to be sitting in that position — it
  is NEVER true for a plain `<td>`, no matter how visually header-like its text looks (bold, first row, column
  label text).** Position-based (implicit) header association is an algorithm over REAL `<th>` elements; a `<td>`
  is never promoted to a header by its screen position. Before crediting a row/column as positionally associated,
  cross-check `signals.structure.tables[i].headers[]` (the actual `<th>` cells collected, with their text) against
  what the viewport shows in that position: if the visually-header-looking text in that row/column is NOT one of
  the `headers[]` entries, NO `<th>` exists there — the association is BROKEN regardless of how "clear" the
  layout looks to a sighted user, and you MUST flag it (DHS Trusted-Tester 511654-19: a table's ROW labels
  ["Rank"/"Name"/"Year"] are real `<th>`, but its COLUMN labels ["First"/"Second"/"Third"] are plain `<td>` —
  `thCount` and `headers[]` will show ONLY 3 headers, one per row, none matching the column labels — that
  mismatch between what's visually a header and what's actually in `headers[]` IS the barrier).

This gate governs ONLY the table facet. Judge headings, lists, groups, and emphasis on their own merits below.

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
- **Visual heading not marked up:** text that LOOKS like a section heading (set off from the body text,
  introduces the content below it) but is a plain `<div>`/`<span>`/`<strong>` with no heading role — a sighted
  reader perceives the section break, AT users do not (technique H69). The same applies to a heading that is
  only *styled* large (e.g. `<strong style="font-size:18pt">`) standing in for an `<h1>`.
  **REQUIRED before flagging this: the text must ACTUALLY FUNCTION as a section heading — visually
  distinguished from surrounding body text by a presentational difference you can NAME AND SEE in the
  viewport (a size, weight, color, all-caps/letter-spacing, extra-spacing, or top/bottom-rule/underline
  difference — H69 does not require "larger/bolder" specifically, but it DOES require a visible
  distinction) AND labelling a distinct block of content BELOW it.** The cue-agnostic list does NOT lower
  the bar: text rendered IDENTICALLY to the surrounding prose (same size, weight, color, casing, spacing)
  is NOT a heading candidate no matter its content, position, or punctuation — if you cannot state which
  SPECIFIC visible difference sets the candidate off from adjacent body text, there is no candidate.
  Prominent text is NOT automatically a heading: a site title / logo / masthead wordmark,
  a banner or hero tagline, the first line of a paragraph, a byline, a pull-quote, or inline emphasis is not
  a section heading, the page `<title>` echoed as the first line of prose is not one either, and body prose
  that merely happens to be the first/topmost text is not one. If the
  page has NO text that both looks like a heading AND introduces a subordinate section (a page can legitimately
  have zero headings — that is `inapplicable`, not a barrier), do NOT invent one; return NOT REPRODUCED, or
  PARTIAL if the viewport is ambiguous about whether a candidate is a true section heading. Never describe "a
  visual heading at the top" you cannot point to as visually-heading-styled AND section-introducing.
  **The mismatch direction is VISUAL → PROGRAMMATIC only.** 1.3.1 requires structure a sighted user
  perceives to be programmatically determinable — never the reverse. A programmatic heading/landmark that
  is VISUALLY HIDDEN (an sr-only/clip-pattern `<h1>`, an off-screen navigation heading) is a standard,
  conforming technique that HELPS AT users; do NOT flag "a programmatic heading is invisible in the visual
  layout" as a 1.3.1 mismatch — that inversion is not a failure mode of this SC.
- **Heading LEVEL does not logically nest (TT 10.C):** distinct from "not marked up" above — a REAL heading
  whose programmatic LEVEL NUMBER contradicts its visual nesting relative to a nearby heading. Consult
  `signals.structure.headingOutline.sequence` — each entry may carry `suspect: 'SKIP_DEEPER'` (this heading's
  level jumps more than one level deeper than the heading before it, e.g. h2 straight to h4, skipping h3 — a
  classic anti-pattern) or `suspect: 'JUMP_SHALLOWER'` (this heading's level lands MORE than one level shallower
  than the heading before it, on a level other than 1 — e.g. an `<h6>` section immediately followed by an
  `<h4>`/`<h5>` that visually reads as ITS subsection). **A `suspect` flag is deterministic, not a hallucination
  risk — it is a HARD numeric fact about the level sequence, ALREADY tuned to exclude the common benign case (a
  full reset to `<h1>`, closing several sections and starting fresh — never flagged).** A corpus-wide scan found
  this signal fires on well under 15% of real multi-section pages, so when it DOES fire it is a targeted,
  uncommon anomaly, not routine noise — treat a suspect entry as LIKELY a real mismatch until the viewport
  affirmatively shows otherwise, not the reverse. For a suspect entry, judge CONTAINMENT FIRST, size second:
  **FIRST identify from the `viewport` whether the earlier heading visually introduces a block that CONTAINS the
  following heading(s) as subsections** (its content — including those later headings — reads as sitting under
  it). If so, the parent MUST be numerically shallower than its children: a PARENT coded DEEPER than its own
  subsections (e.g. an h6 section title whose visually-subordinate subsections are h4/h5 — TT 10.C, confirmed on
  DHS 405382-14) is a barrier EVEN WHEN each heading's font-size individually matches its own level. Do NOT clear
  this shape because the shallower child renders larger — that rendering is EXPECTED for a shallower level and
  does not resolve the containment inversion. Only when NO containment relationship is visible (the headings read
  as SIBLING sections in sequence) use size-vs-prominence as SECONDARY confirmation: a numerically-SHALLOWER
  heading (e.g. h4) rendering SMALLER/less prominent than a numerically-DEEPER heading (e.g. h6) it visually
  follows contradicts the programmatic hierarchy ⇒ barrier. Either way the barrier reading is the DEFAULT for a
  suspect entry; do not talk yourself out of it by reasoning that the levels "could" be a deliberate style choice
  without POINTING TO the specific visual evidence (a genuine sibling sequence, with no containment, whose
  prominence matches its levels) that justifies clearing it. If the viewport doesn't show the headings and their
  section structure clearly, return PARTIAL — do NOT default to "not a defect" from inconclusive evidence. A heading sequence with NO suspect entries needs no special heading-level scrutiny — TT
  10.C is not a concern there.
  **CARVE-OUT — a level SKIP is not itself the barrier; a level that CONTRADICTS the visual hierarchy is.** TT 10.C
  fails when the programmatic level MISREPRESENTS the visual structure, NOT merely because a level number is
  skipped. A minor, out-of-outline CALLOUT — a contact blurb ("Call us at …"), a promo/aside, a sidebar note —
  given a DEEP level (e.g. an `<h6>` sitting between an `<h1>` and the following `<h2>`) is benign ONLY when BOTH
  hold: (a) NO following heading is a subsection of the deep-level callout — it introduces no subsections of its
  own — AND (b) the main outline RESUMES correctly after it (the `<h2>` continues the top-level sequence). Then it
  is a benign skip, **NOT REPRODUCED**, even though the outline sequence flags `SKIP_DEEPER`/`JUMP_SHALLOWER`
  (e.g. TT 10.B-shape lone-h6 contact callout with no children, outline resuming at h2). But when the headings
  AFTER the deep entry ARE its subsections, the containment-inversion rule above governs — the deep parent is the
  barrier, and "each heading's size matches its level" does NOT clear it: size-matching is irrelevant to a
  containment inversion. Reserve the barrier for the two genuine contradictions the section above describes (a
  containment inversion, or a shallower sibling rendered less prominent than the deeper heading it follows).
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
- **TOOL — resolve a cell's REAL header association with `query_ax_node`.** When the table facet is genuinely uncertain
  (an ARIA grid the native pass missed, or a native `UNCERTAIN`/`BROKEN` table you must confirm), call `query_ax_node`
  on a representative cell (`targetXpath` or a screenshot pixel). Its `cellHeaders` returns the cell's PROGRAMMATICALLY-
  associated `colHeaders`/`rowHeaders` text, the `headerSource` (`headers-attr`/`scope`/`positional`), and
  `danglingHeaderIds` (a `headers=` ref pointing at a missing id — a real BROKEN association). Read it as the authority:
  non-empty `colHeaders`/`rowHeaders` ⇒ the header→data association IS programmatically determinable ⇒ NOT a barrier;
  empty header arrays for a cell a sighted user reads under a clear column/row header ⇒ the association is LOST ⇒ barrier;
  a non-empty `danglingHeaderIds` ⇒ BROKEN. Prefer this objective resolve over guessing from the viewport.

**WCAG soundness caveats (REQUIRED before failing):**
- The relationship must be REQUIRED to be programmatically determinable AND must actually convey meaning —
  purely decorative visual grouping is not a 1.3.1 obligation.
- Do not flag a relationship you cannot confirm is conveyed visually; if the viewport is ambiguous, PARTIAL.
- For a table-association call, you must be able to see the table's structure (headers + the cells they
  should govern); if the `viewport` does not show enough of the grid, return PARTIAL.
- Missing landmark / heading-skip is a best-practice concern, NOT automatically a 1.3.1 failure.
- **A REPRODUCED verdict must NAME the relationship: which visually-conveyed structure (this heading /
  this list / this table association / this group) lacks or contradicts which programmatic equivalent.**
  A verdict you can only justify with a restatement ("the issue was reproduced"), a bare measurement, or
  a generic suspicion is NOT evidence of a 1.3.1 failure — return PARTIAL (or NOT REPRODUCED if the
  structures you CAN name are all correctly conveyed). The summary must carry that named relationship.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}`.
