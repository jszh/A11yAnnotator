# Hunks to apply: 1.3.1 page-level grouping/structure evidence + ARIA-table semantics (`llm-adjudicator.js`)

`llm-adjudicator.js` is held by the lead; these are supplied to apply, not applied here. Everything else in
all five lanes is landed on `round3-llm-evidence-lane`:

| file | change |
|---|---|
| `scripts/v3/lib/act-page-collect.js` | new `collectStructuralMarkupFacts()` (+ export) under `liveEval`; page-wide `structure.controlGroupsSummary` (incl. `splitFieldGroupXpaths` — the 4.1.2 fact routed to 1.3.1); per-case `probeVisualStructureDiscovery` wiring → `structure.visualHeadings`; natives-first re-partition of `structure.tables` after frame merges |
| `scripts/v3/lib/collect-tables.js` | ARIA `role=table/grid/treegrid` records (`ariaTable: true`): owned-element contract verified (aria-owns honoured), cell-content shape measured, `fabricatedTableSemantics` flag |
| `scripts/v3/tests/llm/structural-markup-facts.test.js` | browser tests — pos+neg per fact, summary, split routing, visual-heading wiring (written; NOT run — measurement freeze) |
| `scripts/v3/tests/llm/aria-table-facts.test.js` | browser tests — fabricated / well-formed / editable / broken-contract / aria-owns / mixed-order (written; NOT run) |
| `scripts/v3/tests/coverage/collector-liveness.test.js` | `collectStructuralMarkupFacts` added to `GUARDED_COLLECTORS` |

**Safe-before-hunks state (verified against the current adjudicator):** ARIA records land in
`structure.tables` today and degrade cleanly — `tVerdict` reads them `NOT_DATA` (excluded from `dataN`, so
the page association verdict is unchanged), `tSemantics` reads `declared: []` ⇒ `OK`, and because natives
sort first every native record keeps its index. The raw ARIA facts do already ride `s.structure.tables`
into page-structure/grouping prompts (additive data, no verdict). The four structural-markup fact arrays,
`controlGroupsSummary` and `visualHeadings` reach **no prompt** until hunks A–D land.

**Rubric confirmation (do not edit the rubric):** the literal name `FABRICATED_TABLE_SEMANTICS` appears
NOWHERE in `info-relationships-v0.md`. The F46 declared-structure branch reads
`signals.structure.tableSemantics.perTable[i].verdict === 'LAYOUT_STRUCTURE_SUSPECT'` (with `declared[]`),
and its contract — "declares data semantics while its content is not tabular data … confirm from the
viewport, then flag it (F46)" — is exactly what the collector's flag measured. So HUNK E maps
`fabricatedTableSemantics: true` onto **`LAYOUT_STRUCTURE_SUSPECT`**, the verdict name the branch actually
receives; emitting a novel verdict string would land in no branch.

**No oracle / coverage-registry hunks are needed (checked, preferred outcome):**
- every new fact rides the existing **page-level 1.3.1 info-relationships obligation**, minted for any page
  with a structure slot (`applicability-oracle.js` `deriveObligations`, `PAGE_INFOREL_XPATH` branch) and
  already cross-checked fail-closed by `coverage-registry.js` (`coverageErrors`, structure-slot branch);
- `splitFieldGroup` inputs already carry element-level 1.3.1 via `field-programmatic-association`
  (`isFormField` branch) — the 1.3.1 routing is prompt-side threading, not a mint;
- the ARIA `fabricatedTableSemantics` fact rides the same page-level obligation the native F46 lane uses.

---

## HUNK A — thread the page-level grouping/structure evidence to `info-relationships-v0` subjects

Keyed on the RUBRIC ID exactly like `__errorSummaries`: the group question is judged on the page-level
info-relationships subject; every other grouping-skill rubric keeps its prompt byte-identical.

### Anchor (selectRubricSubjects, immediately after the `error-identification-v0` block, ~line 1774)

```js
        const f = resolveSummaryField(collect, baseEl, es);
        if (f) extra.__errorSummaryField = f;
      }
    }
    // 1.4.1 COLOUR PEER GROUP: when this subject is the ANCHOR of a colour-coded peer set, hand over the whole
```

### Insert between `}` and the `// 1.4.1 COLOUR PEER GROUP` comment

```js
    // 1.3.1 PAGE-LEVEL GROUPING + DECLARED-STRUCTURE EVIDENCE (residual RCA S10/S11). Four exact collector
    // facts plus the page-wide control-group summary and the visual-structure heading discoveries, all of
    // which were computable and reached no prompt: the group question is judged on the page-level
    // info-relationships subject, and the per-member controlGroup records above reach only ELEMENT
    // subjects. Keyed on the RUBRIC ID like __errorSummaries so every other grouping-skill rubric keeps
    // its prompt byte-identical.
    if (rub.id === 'info-relationships-v0') {
      const st = (collect && collect.structure) || null;
      const cg = st && st.controlGroupsSummary;
      if (cg && ((Array.isArray(cg.groups) && cg.groups.length)
        || (Array.isArray(cg.splitFieldGroupXpaths) && cg.splitFieldGroupXpaths.length))) extra.__controlGroupsPage = cg;
      const vh = (st && Array.isArray(st.visualHeadings)) ? st.visualHeadings : [];
      if (vh.length) extra.__visualHeadings = vh;
      const smf = {};
      for (const k of ['blockquotesWithoutSource', 'dlOrderAnomalies', 'radioGroupsWithoutGrouping', 'requiredStateInventory']) {
        if (st && Array.isArray(st[k]) && st[k].length) smf[k] = st[k];
      }
      if (Object.keys(smf).length) extra.__structuralMarkupFacts = smf;
    }
```

---

## HUNK B — precomputeSignals: the page-level control-group summary signal

`element.__controlGroupsPage` does not exist anywhere before HUNK A, so the branch cannot fire on any
current record and every existing prompt stays byte-identical.

### Anchor (immediately after the existing per-member `controlGroup` branch, ~line 831)

```js
  if ((skill === 'grouping-and-reading-order' || skill === 'forms-instructions-errors')
      && element.controlGroup && typeof element.controlGroup === 'object') {
    s.controlGroup = element.controlGroup;
  }
```

### Insert after it

```js
  // 1.3.1 PAGE-LEVEL CONTROL-GROUP SUMMARY — see selectRubricSubjects. The per-member record above answers
  // "which set is THIS field part of"; this one answers the page-level question — which sets exist, what
  // visible text governs each, and whether a programmatic group NAME exists — on the subject where that
  // question is actually judged.
  if (element.__controlGroupsPage) {
    const cg = element.__controlGroupsPage;
    s.controlGroups = {
      groups: (cg.groups || []).slice(0, 8),
      splitFieldGroupXpaths: (cg.splitFieldGroupXpaths || []).slice(0, 12),
      note: 'Each entry is a control SET that forms ONE question by construction (radios/checkboxes sharing '
        + 'a control name, or sibling controls of which NONE carries a label element / aria-label / '
        + 'aria-labelledby). `hasProgrammaticGroupName` and `programmaticGroup` state whether a grouping '
        + 'mechanism (fieldset+legend, role=group/radiogroup with an accessible name) names the set — '
        + 'CHECKED in the DOM, a determined result in BOTH directions: where it is true, do NOT report the '
        + 'visible text as "not programmatically associated"; where `correspondence` is '
        + 'no-programmatic-group, do not report it as unconfirmable and do not ask for an '
        + 'accessibility-tree query to settle it. `visibleLabelCandidates` are the visible text blocks '
        + 'immediately before the set, in reading order — which one (if any) is the question the controls '
        + 'answer is yours to read, and the absence of a group is a barrier only when that text carries '
        + 'meaning the members\' own names (`memberOwnNames`) do not carry alone. `splitFieldGroupXpaths` '
        + 'are inputs that are PARTS of one multipart field (short-maxlength siblings named, if at all, by '
        + 'title/placeholder); their group question belongs to this subject too. These are FACTS about the '
        + 'page\'s grouping state, never a verdict.',
    };
  }
```

---

## HUNK C — precomputeSignals: the visual-heading discoveries signal

`element.__visualHeadings` does not exist before HUNK A; same byte-identity argument.

### Anchor — insert immediately after the HUNK B block

```js
  // 1.3.1 VISUAL-STRUCTURE DISCOVERIES — see selectRubricSubjects. The broad-scope visual-structure probe
  // now runs per-case in the collector (one read-only evaluate); its heading discoveries give the judge a
  // deterministic anchor for the styled-non-semantic-heading shape instead of a live-AX-check-shaped
  // question answered from the crop.
  if (element.__visualHeadings) {
    s.visualHeadings = {
      entries: element.__visualHeadings.slice(0, 8),
      note: 'Rendered text blocks that LOOK like headings — heading-scale font size/weight, short, '
        + 'block-level — while being neither h1-h6 nor role=heading. The visual-heading PREMISE is '
        + 'established from computed style, deterministically: do not re-derive it from the crop and do '
        + 'not request a live accessibility-tree check to establish it. What stays yours: whether the text '
        + 'actually INTRODUCES the content below it as a section (a wordmark, tagline, pull-quote, price '
        + 'or promotional line is not a heading), and whether a real programmatic heading already carries '
        + 'that structure. A styled line that does introduce a section, with no programmatic heading '
        + 'anywhere for it, is the visual-structure-without-markup direction of 1.3.1.',
    };
  }
```

---

## HUNK D — precomputeSignals: the four exact structural-markup fact signals

`element.__structuralMarkupFacts` does not exist before HUNK A; same byte-identity argument. Emitted as
four separate named signals so each carries its own reading rule.

### Anchor — insert immediately after the HUNK C block

```js
  // 1.3.1 EXACT DECLARED-STRUCTURE / GROUPING-STATE FACTS — see selectRubricSubjects and
  // act-page-collect.js collectStructuralMarkupFacts. Each converts a previously-unanswerable page-level
  // question into a stated, checked result; each is DATA with a reading rule, never a verdict.
  if (element.__structuralMarkupFacts) {
    const smf = element.__structuralMarkupFacts;
    if (Array.isArray(smf.blockquotesWithoutSource) && smf.blockquotesWithoutSource.length) {
      s.blockquotesWithoutSource = {
        entries: smf.blockquotesWithoutSource.slice(0, 4),
        note: 'Each entry is a visible <blockquote> with NO cite= attribute, NO <cite> descendant, and NO '
          + 'adjacent attribution (no figcaption in an enclosing figure, no dash-led attribution line '
          + 'beside or inside it) — the element declares a quotation relationship and names no source '
          + 'anywhere the DOM can see. CHECKED, not unconfirmable. Yours to judge from the text: whether '
          + 'it reads as first-party prose merely styled as a quote — markup asserting the words belong to '
          + 'an outside source that does not exist is the declared-structure-must-be-true failure — or as '
          + 'a genuine quotation whose source is simply unstated, which is not by itself a 1.3.1 barrier.',
      };
    }
    if (Array.isArray(smf.dlOrderAnomalies) && smf.dlOrderAnomalies.length) {
      s.dlOrderAnomalies = {
        entries: smf.dlOrderAnomalies.slice(0, 4),
        note: 'dt/dd ordering facts for each anomalous <dl>. `leadingDd` = a description before any term; '
          + '`trailingDt` = a trailing term with no description; `invertedDivGroups` = spec-legal <div> '
          + 'wrappers whose description PRECEDES its term — each of these can bind the announced '
          + 'term→description pairing to the wrong items. `countMismatch` is ONLY a count fact: several '
          + 'descriptions per term and several terms per description are both legal, so judge it from the '
          + 'rendered pairs, not the arithmetic. A <dl> whose visual pairs read value-then-label where the '
          + 'markup declares label-then-value is announcing inverted relationships to AT.',
      };
    }
    if (Array.isArray(smf.radioGroupsWithoutGrouping) && smf.radioGroupsWithoutGrouping.length) {
      s.radioGroupsWithoutGrouping = {
        entries: smf.radioGroupsWithoutGrouping.slice(0, 4),
        note: 'Radio sets sharing a control name with NO fieldset-with-legend, role=radiogroup, or '
          + 'accessibly-named role=group anywhere from their common ancestor up to the form — a CHECKED '
          + 'absence, so do not report grouping as unconfirmable and do not ask for an accessibility-tree '
          + 'query to settle it. `precedingText` is the visible text block immediately before the set with '
          + 'its computed weight/size. The absence is a barrier when that text is the question the radios '
          + 'answer and their own labels do not carry it alone; it is NOT one when each radio\'s own '
          + 'accessible name already suffices.',
      };
    }
    if (Array.isArray(smf.requiredStateInventory) && smf.requiredStateInventory.length) {
      s.requiredStateInventory = {
        entries: smf.requiredStateInventory.slice(0, 6),
        note: 'Per-form counts: fields with required= / aria-required=true, visible required-word tokens in '
          + 'the form\'s text, and label/legend asterisk markers (CSS-generated ones included). ZERO IS A '
          + 'MEASURED ABSENCE, not an unavailable signal — a form whose visible text or styling announces '
          + 'required fields while requiredAttrCount and ariaRequiredCount are both 0 conveys the required '
          + 'state with no programmatic counterpart; a form where the counts line up with the visible '
          + 'marking needs no further required-state scrutiny.',
      };
    }
  }
```

---

## HUNK E — ARIA-table records in the table verdict channels

Two edits inside the `if (skill === 'page-structure' || skill === 'grouping-and-reading-order')` structure
block. The collector guarantees natives sort FIRST in `structure.tables` (re-partitioned after frame
merges), so filtering aria records out of the association projection keeps `perTable[i]` index-aligned
with `structure.tables[i]` for every native record — the alignment the rubric's cross-reference depends on.

### E1 anchor (~line 926)

```js
      const tbls = Array.isArray(struct.tables) ? struct.tables : [];
```

### Replace with

```js
      const tbls = Array.isArray(struct.tables) ? struct.tables : [];
      // ARIA-table records (collect-tables `ariaTable: true`) carry NO native wiring facts, so the
      // association projection below stays NATIVE-ONLY — exactly what the rubric documents for this hard
      // gate. The collector orders natives FIRST, so per[i] stays index-aligned with structure.tables[i]
      // for every native record; aria records have no association entry and their one deterministic
      // verdict rides tableSemantics below.
      const nativeTbls = tbls.filter((t) => !(t && t.ariaTable === true));
```

### E2 anchor (~line 955)

```js
      const per = tbls.map(tVerdict);
```

### Replace with

```js
      const per = nativeTbls.map(tVerdict);
```

### E3 anchor — the head of `tSemantics` (~line 971)

```js
      const tSemantics = (t) => {
        const presentational = t.roleOverride === 'presentation' || t.roleOverride === 'none';
```

### Replace with

```js
      const tSemantics = (t) => {
        // ARIA table/grid record (residual RCA S10): one deterministic verdict from the collector's two
        // independent checks — the OWNED-ELEMENT CONTRACT (rows present, every cell owned by a row,
        // consistent per-row counts, aria-owns honoured) and the CELL-CONTENT SHAPE. The collector's
        // `fabricatedTableSemantics` flag (contract HOLDS while the majority of data cells hold
        // block/region content) maps onto the SAME F46 verdict name this rubric's declared-structure
        // branch already receives — LAYOUT_STRUCTURE_SUSPECT: markup declaring data semantics over content
        // that is not tabular data. A well-formed ARIA grid — or one whose contract is BROKEN, a different
        // defect visible in its own record fields — stays OK here and is judged under the rubric's
        // existing ARIA guidance (positional association, aria-owns, query_ax_node).
        if (t && t.ariaTable === true) {
          const declared = ['role=' + (t.role || 'table')];
          if (Number(t.columnheaderCount) > 0) declared.push('role=columnheader');
          if (Number(t.rowheaderCount) > 0) declared.push('role=rowheader');
          return {
            verdict: t.fabricatedTableSemantics === true ? 'LAYOUT_STRUCTURE_SUSPECT' : 'OK',
            declared, presentational: false, ariaTable: true,
            ownedContractHolds: t.ownedContractHolds === true,
            rowCount: t.rowCount, colCount: t.colCount, cellsWithBlockContent: t.cellsWithBlockContent,
            summary: null, caption: null,
          };
        }
        const presentational = t.roleOverride === 'presentation' || t.roleOverride === 'none';
```

`perSem` (computed over ALL of `tbls`) and `suspectCount` need no edit — the aria branch returns the same
record shape, and `s.structure.tableSemantics.perTable[i]` stays aligned with `s.structure.tables[i]`.

---

## Byte cost & scope

- `s.controlGroups` ≈ 0.8–2.0 KB, ONLY on the page-level info-relationships subject of pages carrying a
  qualifying set (the collector's summary is `undefined` otherwise).
- `s.visualHeadings` ≈ 0.2 KB/entry, cap 8, same single subject; empty on pages with no discovery.
- The four fact signals: each fires only when its array is non-empty; blockquote/dl/radio shapes are rare
  by construction (exact anti-patterns), `requiredStateInventory` fires on any page with a form (≈6 rows
  max, ~120 B/row) — the one signal with routine presence, priced for the stable/flaky split it buys.
- ARIA-table records: only on pages declaring `role=table/grid/treegrid` off-`<table>`; cap shares the
  existing 20-table budget.

## Validation once the measurement freeze lifts

1. `node --test scripts/v3/tests/llm/structural-markup-facts.test.js scripts/v3/tests/llm/aria-table-facts.test.js scripts/v3/tests/coverage/collector-liveness.test.js scripts/v3/tests/llm/control-group-and-at-rest-signals.test.js` (browser; written but unrun under the freeze).
2. Pure-node re-run of `table-association.test.js` / `llm-lane.test.js` / `llm-wiring.test.js` after applying the hunks (65 green pre-hunk on this branch).
3. Per the LLM holdout-gate policy: prompts change (new signals), rubrics do not — targeted 1.3.1 slice
   only, bundled with the campaign's other 1.3.1 fixes (single-case attribution is inside judge noise).
