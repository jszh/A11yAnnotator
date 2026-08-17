'use strict';
// Tier-0 #4 (LLM-routing analysis): per-<table> relationship facts for the 1.3.1 info-relationships JUDGMENT.
// The rubric promised the collector "extracted tables" — it did NOT (structure was {title,lang} only); this
// closes that false promise. Per memory [[harness-3-3-checker-decision]], axe owns the STRUCTURAL 1.3.1 finding
// (td-headers-attr / table validity); these facts feed the RESIDUAL layout-vs-data / header-adequacy call axe
// abstains on (caption presence, th/td shape, headers= wiring + broken associations), never a competing checker.
//
// Self-contained so it serializes cleanly through page.evaluate (no closures over Node scope). Both collectors
// (act-page-collect.js, eval-page.js) run it and fold the result into `structure.tables`.
function collectTables() {
  const clip = (s, n) => (s || '').replace(/\s+/g, ' ').trim().slice(0, n);
  const nativeTables = [...document.querySelectorAll('table')].slice(0, 20).map((t) => {
    // a25f45 / 1.3.1 table relationships apply to a TABLE-role element. A role override to a non-table role
    // (role=heading/presentation/none/...) drops the table semantics ⇒ the header-wiring smells are meaningless
    // (ACT inapplicable) ⇒ do not compute them, so the deterministic hints never fire on a non-data-table.
    const roleOverride = (t.getAttribute('role') || '').toLowerCase();
    const isTableRole = !roleOverride || roleOverride === 'table' || roleOverride === 'grid' || roleOverride === 'treegrid';
    const caption = t.querySelector(':scope > caption');
    const rows = [...t.rows];
    const ths = [...t.querySelectorAll('th')];
    const tds = [...t.querySelectorAll('td')];
    // SIMPLE-POSITIONAL header facts (1.3.1 implicit-header algorithm). A regular grid whose header cells sit ONLY
    // in the first row and/or the first column conveys the row/column association BY POSITION — no scope/headers=
    // is required (HTML's header-scanning algorithm; AT resolves it). We compute the raw facts here; the verdict
    // (llm-adjudicator) decides VALID only for the UNAMBIGUOUS simple shape. Conservative: any rowspan, scattered
    // (mid-body) th, ragged logical widths, or a multi-row header stack ⇒ NOT simple ⇒ left UNCERTAIN for the judge.
    const rowCells = rows.map((r) => [...r.cells]);
    const isTh = (c) => c && c.tagName === 'TH';
    const logicalWidth = (cells) => cells.reduce((n, c) => n + (c.colSpan || 1), 0);
    const firstRowAllTh = rowCells.length > 0 && rowCells[0].length > 0 && rowCells[0].every(isTh);
    const firstColAllTh = rowCells.length >= 2 && rowCells.every((r) => r.length > 0 && isTh(r[0]));
    // PARTIAL header axis (#4 FP fix): row 0 (or column 0) carries SOME <th> cells but not ALL of them — a strong
    // smell the author INTENDED that axis to be a header row/column too but coded it incompletely (e.g. one <th>
    // "Rank" mixed with plain <td> "First"/"Second"/"Third" in row 0). This must NOT be waved through as a clean
    // single-axis table via the OTHER axis's simple-positional VALID path (see llm-adjudicator.js) — a two-axis
    // grid with one axis half-marked is exactly the DHS Trusted-Tester 14.B failure shape (column headers never
    // marked <th> at all), not a legitimate row-header-only table.
    const firstRowPartialTh = rowCells.length > 0 && rowCells[0].length > 0 && rowCells[0].some(isTh) && !firstRowAllTh;
    // firstColPartialTh EXCLUDES row 0 from its "some but not all" check. Including it (rowCells.some(...) over
    // ALL rows) falsely fires on any ordinary single-header-row table — a <thead><th>Projects</th><th>Exams</th>
    // </thead><tbody><td colspan=2>15%</td></tbody> table (d0f69e, real ACT-corpus, GT-pass) has firstRowAllTh
    // (legit) but its lone body row's colspan cell isn't <th>, which trivially makes "some but not all rows have
    // th@col0" true for ANY such table — a false trigger, not a genuine broken row-header-column attempt (caught
    // during the corpus-wide regression scan for this fix, see docs). Row 0 is already independently evaluated by
    // firstRowAllTh/firstRowPartialTh; a REAL broken row-header-column attempt shows up in the BODY rows (1+)
    // disagreeing with each other, not in row 0's relationship to itself.
    // HOW WIDE is the header axis, not merely whether one exists (residual RCA S2). `firstRowAllTh` is true
    // for a table whose row 0 is a SINGLE `<th colspan=3>` masthead — the F46 layout shape — exactly as it is
    // for a genuine 3-column header row. Counting the header cells separates them: a real header row labels
    // two or more columns, a masthead labels none.
    const headerRowThCount = rowCells.length > 0 ? rowCells[0].filter(isTh).length : 0;
    const headerColThCount = rowCells.filter((r) => r.length > 0 && isTh(r[0])).length;
    const bodyRows = rowCells.slice(1);
    const firstColPartialTh = bodyRows.length >= 2 && bodyRows.some((r) => r.length > 0 && isTh(r[0])) && !bodyRows.every((r) => r.length > 0 && isTh(r[0]));
    let bodyTh = 0, anyRowspan = false, headerRows = 0, leadingHeader = true;
    rowCells.forEach((cells, ri) => {
      const allTh = cells.length > 0 && cells.every(isTh);
      if (leadingHeader && allTh) headerRows++; else leadingHeader = false;
      cells.forEach((c, ci) => {
        if ((c.rowSpan || 1) > 1) anyRowspan = true;
        if (isTh(c) && ri > 0 && ci > 0) bodyTh++; // a th NOT in the first row or first column — needs scope to associate
      });
    });
    const widths = rowCells.map(logicalWidth);
    const regularGrid = widths.length > 0 && widths.every((w) => w === widths[0]) && !anyRowspan;
    const idText = {};
    for (const c of t.querySelectorAll('[id]')) idText[c.id] = clip(c.textContent, 40);
    // a25f45: a `headers=` IDREF must resolve to a th/td CELL in THIS table. Build a CELL-id map (not any [id]) so the
    // deterministic check distinguishes a valid cell reference from one that points to a non-cell element (a <span>/
    // <div> that happens to carry the id) or to the cell itself — both a25f45 failures the bare id-exists check misses.
    const cellIds = {};
    for (const cell of [...ths, ...tds]) if (cell.id) cellIds[cell.id] = clip(cell.textContent, 40);
    const headers = ths.slice(0, 30).map((th) => ({
      id: th.id || null, scope: (th.getAttribute('scope') || '').toLowerCase() || null, text: clip(th.textContent, 60),
    }));
    // each <td headers="..."> IDREF list + whether each ref RESOLVES to a cell id in this table (a dangling ref
    // is the d0f69e mis-wire smell); a few samples so the rubric can judge whether the wiring is semantically right.
    let danglingIdref = false, headersRefsNonCell = false, headersRefsSelf = false, tdWithHeaders = 0;
    const tdHeaderSamples = [];
    for (const td of (isTableRole ? tds : [])) {
      const refs = (td.getAttribute('headers') || '').split(/\s+/).filter(Boolean);
      if (!refs.length) continue;
      tdWithHeaders++;
      const resolved = refs.map((id) => (Object.prototype.hasOwnProperty.call(idText, id) ? idText[id] : null));
      if (resolved.some((r) => r === null)) danglingIdref = true; // a25f45: refers to an id NOT in this table (cross-table / missing)
      // a25f45 ALSO fails when a ref resolves to a NON-cell element in the table (a <span>/<div>, not a th/td), or to
      // the data cell ITSELF (a cell is not its own header). These resolve in idText (danglingIdref stays false) but
      // are not valid same-table CELL header references.
      if (refs.some((id) => Object.prototype.hasOwnProperty.call(idText, id) && !Object.prototype.hasOwnProperty.call(cellIds, id))) headersRefsNonCell = true;
      if (td.id && refs.includes(td.id)) headersRefsSelf = true;
      if (tdHeaderSamples.length < 12) tdHeaderSamples.push({ cell: clip(td.textContent, 30), headers: refs, resolved });
    }
    // ---- DECLARED-STRUCTURE facts (residual RCA S2 — F46 / F92 / F43) -------------------------------
    // Everything above was built to answer ONE question: is a data table's header→data association
    // programmatic? That question presupposes the table IS data. F46 asks the OPPOSITE one — does a table
    // used only for LAYOUT fabricate data semantics (th / caption / non-empty summary / scope / headers)? —
    // and F92 asks whether a table that IS data has had those semantics SUPPRESSED with role=presentation.
    // Neither was answerable: `summary=` was never read at all, and every `headers=` fact above is gated on
    // `isTableRole`, so a role=presentation table reported none of its own structural markup.
    //
    // F46 names th, caption, non-empty summary, headers= AND scope= as the failing markup. An EMPTY
    // `summary=""` is explicitly not a failure (the technique says "non-empty summary attributes"), so the
    // raw attribute is kept alongside the trimmed-emptiness test rather than coerced to a boolean.
    const summaryAttr = t.getAttribute('summary');
    const scopeCount = [...ths, ...tds].filter((c) => (c.getAttribute('scope') || '').trim()).length;
    const headersAttrCount = [...ths, ...tds].filter((c) => (c.getAttribute('headers') || '').trim()).length;
    // CELL CONTENT SHAPE — the observable that actually separates layout from data. A data cell holds a
    // VALUE; a layout cell holds a page region. Counting cells that contain a heading, list, form, nav
    // landmark, or a nested table is a far better discriminator than th-presence (which is circular: the
    // <th> is the very thing F46 is about). Deliberately EXCLUDES <p> and <div> on their own — a data cell
    // wrapping its value in a <p> or a <div> is ordinary and must not read as layout.
    const BLOCK_SEL = 'h1,h2,h3,h4,h5,h6,ul,ol,dl,form,nav,section,article,aside,header,footer,figure,table';
    const allCells = [...ths, ...tds];
    const cellsWithBlockContent = allCells.filter((c) => c.querySelector(BLOCK_SEL)).length;
    const cellTextLens = allCells.map((c) => clip(c.textContent, 4000).length);
    const maxCellTextLen = cellTextLens.length ? Math.max(...cellTextLens) : 0;
    const colCount = widths.length ? Math.max(...widths) : 0;
    return {
      rowCount: rows.length, thCount: ths.length, tdCount: tds.length,
      hasCaption: !!caption, captionText: caption ? clip(caption.textContent, 80) : null,
      headers, tdWithHeaders, tdHeaderSamples, danglingIdref, headersRefsNonCell, headersRefsSelf,
      firstRowAllTh, firstColAllTh, firstRowPartialTh, firstColPartialTh, bodyTh, headerRows, regularGrid, // simple-positional header facts (1.3.1 implicit algorithm)
      roleOverride: roleOverride || null, // non-null ⇒ table semantics overridden (a25f45/1.3.1 table facet inapplicable)
      // a header cell but ZERO data cells ⇒ a header pointing at nothing (coarse derived flag).
      headerWithNoDataCell: isTableRole && ths.length > 0 && tds.length === 0,
      // layout-vs-data heuristic for the rubric: a 1-row / th-less / caption-less table is likely layout, not data.
      looksLikeDataTable: isTableRole && rows.length > 1 && (ths.length > 0 || !!caption),
      // ---- declared-structure facts (F46/F92/F43). Computed for EVERY table regardless of role override.
      summaryAttr: summaryAttr === null ? null : clip(summaryAttr, 120),
      hasNonEmptySummary: !!(summaryAttr && summaryAttr.trim()),
      scopeCount, headersAttrCount, headerRowThCount, headerColThCount,
      colCount, cellsWithBlockContent, cellCount: allCells.length, maxCellTextLen,
      // a ≥2×2 grid with NOT ONE <th> — either a headerless data table (TT 14.B) or a layout table. The
      // rubric decides which; the collector only reports the shape.
      allTdGrid: rows.length >= 2 && colCount >= 2 && ths.length === 0,
    };
  });

  // ---- ARIA TABLES / GRIDS (residual RCA S10 — declared table semantics OUTSIDE a native <table>) --------
  // Everything above reads native <table> markup, so a role=table/grid/treegrid built from generic elements
  // carried NO entry here at all — the adjudicator's tableAssociation gate honestly says so, and the rubric
  // then falls back to a live accessibility-tree query the judge frequently never makes. Yet an ARIA grid
  // declares the SAME owned-element structure a native table does (rows owning columnheaders/cells), and it
  // can fabricate data semantics the same way F46 describes: a set of independent page regions marked up as
  // one data grid, telling an AT user that unrelated widgets stand in row/column relationships.
  //
  // Two independent verifications, both DETERMINISTIC and both facts-only:
  //  · the OWNED-ELEMENT CONTRACT — rows present (DOM descendants of THIS container, or referenced via
  //    aria-owns from the container/its rowgroups), every cell-role element owned by a row, and per-row cell
  //    counts consistent. A held contract means the declared structure is well-formed AS DECLARED — which is
  //    exactly when a false declaration is most convincing to AT.
  //  · the CELL-CONTENT SHAPE — the same discriminator the native pass uses (a data cell holds a VALUE; a
  //    region-cell holds headings/lists/nested structure), widened with the ARIA role equivalents.
  // `fabricatedTableSemantics` fires ONLY when the contract HOLDS while the MAJORITY (and ≥2) of the data
  // cells carry block/region content — declared-structure-true-but-content-not-tabular. A broken contract is
  // a different defect (reported via the contract fields, never this flag), and `cellsWithInteractiveContent`
  // is reported but deliberately NOT a trigger: a legitimate editable grid is full of controls. The
  // adjudicator maps this flag onto the same tableSemantics verdict channel the info-relationships rubric's
  // F46 branch already reads; nothing here is a verdict.
  const ariaTables = [];
  if (nativeTables.length < 20) {
    const CELL_ROLE = /^(cell|gridcell|columnheader|rowheader)$/;
    const roleOf = (e) => String((e && e.getAttribute && e.getAttribute('role')) || '').trim().toLowerCase();
    const xpathOf = (e) => {
      if (!e || !e.tagName) return '';
      if (e === document.documentElement) return '/html';
      if (e === document.body && e.tagName === 'BODY') return '/html/body';
      const tg = e.tagName.toLowerCase();
      let i = 1; for (let s = e.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === e.tagName) i++;
      return xpathOf(e.parentElement) + '/' + tg + '[' + i + ']';
    };
    const byId = (id) => { try { return document.getElementById(id); } catch (e) { return null; } };
    const ownsOf = (e) => {
      const v = (e && e.getAttribute && e.getAttribute('aria-owns')) || '';
      if (!v.trim()) return [];
      return v.trim().split(/\s+/).slice(0, 40).map(byId).filter(Boolean);
    };
    // the nearest ancestor that owns table semantics (an ARIA container OR a native <table>) — scoping guard
    // so a nested grid's rows/cells are never double-counted into the outer container's contract.
    const nearestTableScope = (e) => {
      for (let p = e.parentElement; p; p = p.parentElement) {
        if (p.tagName === 'TABLE') return p;
        if (/^(table|grid|treegrid)$/.test(roleOf(p))) return p;
      }
      return null;
    };
    const containers = [...document.querySelectorAll('[role]')]
      .filter((e) => /^(table|grid|treegrid)$/.test(roleOf(e)) && e.tagName !== 'TABLE')
      .slice(0, 20 - nativeTables.length);
    for (const c of containers) {
      const role = roleOf(c);
      const rowgroups = [...c.querySelectorAll('[role]')].filter((e) => roleOf(e) === 'rowgroup' && nearestTableScope(e) === c);
      let rowsViaAriaOwns = false;
      // TRUNCATION IS A FACT, NOT A DEFECT (soundness probe 2026-08-17): the caps below sample the
      // structure, and a capped read must say so — a conformant 51-row grid used to surface its overflow
      // rows' cells as `cellsOutsideRows` and read `ownedContractHolds: false` with no marker at all.
      let rowsTruncated = false, cellsTruncated = false;
      const rowSet = [];
      const seenRows = new Set();
      const addRow = (r, viaOwns) => {
        if (!r || seenRows.has(r) || roleOf(r) !== 'row') return;
        if (rowSet.length >= 40) { rowsTruncated = true; return; }
        seenRows.add(r); rowSet.push(r);
        if (viaOwns) rowsViaAriaOwns = true;
      };
      for (const r of c.querySelectorAll('[role]')) if (roleOf(r) === 'row' && nearestTableScope(r) === c) addRow(r, false);
      for (const src of [c, ...rowgroups]) for (const o of ownsOf(src)) addRow(o, true);
      // cells per row: element children plus the row's own aria-owns references, cell-roled only.
      // SHADOW-PROOF children read (same defect class act-page-collect.js documents): a role=row placed on a
      // <form> would let a control named "children"/"childNodes" shadow the inherited accessor, so read via
      // Node.prototype's own getter, which no named property can shadow.
      const _CN_GET = (Object.getOwnPropertyDescriptor(Node.prototype, 'childNodes') || {}).get;
      const elemKids = (e) => {
        const cn = _CN_GET ? _CN_GET.call(e) : (e.childNodes || []);
        const out = [];
        for (let i = 0; i < cn.length; i++) if (cn[i].nodeType === 1) out.push(cn[i]);
        return out;
      };
      const cellsOf = (r) => {
        const kids = [...elemKids(r), ...ownsOf(r)];
        const cs = [];
        for (const k of kids) {
          if (!CELL_ROLE.test(roleOf(k))) continue;
          if (cs.length >= 30) { cellsTruncated = true; break; } // a 31st cell exists — the sample is a sample
          cs.push(k);
        }
        return cs;
      };
      const rowCells = rowSet.map(cellsOf);
      const allCells = [];
      for (const rc of rowCells) allCells.push(...rc);
      const rowWidths = rowCells.map((cs) => cs.length);
      const colCount = rowWidths.length ? Math.max(...rowWidths) : 0;
      const rowCellCountsConsistent = rowWidths.length > 0 && rowWidths.every((w) => w === rowWidths[0]);
      const columnheaderCount = allCells.filter((x) => roleOf(x) === 'columnheader').length;
      const rowheaderCount = allCells.filter((x) => roleOf(x) === 'rowheader').length;
      const dataCells = allCells.filter((x) => roleOf(x) === 'cell' || roleOf(x) === 'gridcell');
      // a cell-role element scoped to this container that NO row holds — outside the contract. Judged
      // STRUCTURALLY (direct row parent, or aria-owns membership of any row), never by membership in the
      // CAPPED sample above: the sample stops at 40 rows / 30 cells per row, but this scan is uncapped, so
      // testing against the sample read every overflow cell of a conformant 51-row grid as "outside any
      // row" and reported a broken contract with no truncation marker at all (soundness probe 2026-08-17).
      const inRow = new Set(allCells);
      const ownedByAnyRow = new Set();
      const noteRowOwns = (r) => { for (const o of ownsOf(r)) ownedByAnyRow.add(o); };
      for (const r of c.querySelectorAll('[role]')) if (roleOf(r) === 'row' && nearestTableScope(r) === c) noteRowOwns(r);
      for (const r of rowSet) noteRowOwns(r); // aria-owns-referenced rows can live OUTSIDE the container in the DOM
      let cellsOutsideRows = 0;
      for (const e of c.querySelectorAll('[role]')) {
        if (!CELL_ROLE.test(roleOf(e))) continue;
        if (nearestTableScope(e) !== c) continue;
        if (inRow.has(e) || ownedByAnyRow.has(e)) continue;
        if (e.parentElement && roleOf(e.parentElement) === 'row') continue; // row-held — merely past a sampling cap
        cellsOutsideRows++;
      }
      const firstRowAllColumnheader = rowCells.length > 0 && rowCells[0].length >= 2 && rowCells[0].every((x) => roleOf(x) === 'columnheader');
      // region-shaped cell content — the native BLOCK_SEL plus its ARIA equivalents. Judged over DATA cells
      // only (a header cell holding a sort <button> is ordinary and must not read as a region).
      const ARIA_BLOCK_SEL = 'h1,h2,h3,h4,h5,h6,ul,ol,dl,form,nav,section,article,aside,header,footer,figure,table,[role="heading"],[role="list"],[role="figure"],[role="region"],[role="group"],[role="table"],[role="grid"]';
      const blockDataCells = dataCells.filter((x) => x.querySelector(ARIA_BLOCK_SEL)).length;
      const interactiveDataCells = dataCells.filter((x) => x.querySelector('a[href],button,input,select,textarea,[role="button"],[role="link"]')).length;
      const cellTextLens = allCells.map((x) => clip(x.textContent, 4000).length);
      const ownedContractHolds = rowSet.length > 0 && allCells.length > 0 && cellsOutsideRows === 0 && rowCellCountsConsistent;
      ariaTables.push({
        ariaTable: true,                                  // marker: NO native wiring facts on this record
        role,
        xpath: xpathOf(c),                                // ARIA records carry a locator (additive; native records never did)
        rowCount: rowSet.length, colCount,
        cellCount: allCells.length, dataCellCount: dataCells.length,
        columnheaderCount, rowheaderCount,
        rowsViaAriaOwns, cellsOutsideRows, rowCellCountsConsistent, ownedContractHolds,
        // present ONLY when a sampling cap was actually hit (same presence-is-the-signal convention as
        // enumError/sweepAborted): rowCount/cellCount and the contract fields describe the SAMPLE. The
        // structural cellsOutsideRows scan above keeps the contract sound under truncation — remaining
        // contract failures on a truncated record are defects observed INSIDE the sample, never artifacts
        // of the cap.
        ...(rowsTruncated || cellsTruncated ? { truncated: true } : {}),
        firstRowAllColumnheader,
        cellsWithBlockContent: blockDataCells,
        cellsWithInteractiveContent: interactiveDataCells,
        maxCellTextLen: cellTextLens.length ? Math.max(...cellTextLens) : 0,
        fabricatedTableSemantics: ownedContractHolds && dataCells.length >= 2
          && blockDataCells >= 2 && blockDataCells * 2 >= dataCells.length,
      });
    }
  }
  // natives FIRST (the adjudicator's association projection is native-only and index-aligned — see the
  // frame-merge re-partition in act-page-collect.js for the multi-document case).
  return [...nativeTables, ...ariaTables];
}

module.exports = { collectTables };
