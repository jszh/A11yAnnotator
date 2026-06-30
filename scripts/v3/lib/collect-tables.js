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
  return [...document.querySelectorAll('table')].slice(0, 20).map((t) => {
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
    return {
      rowCount: rows.length, thCount: ths.length, tdCount: tds.length,
      hasCaption: !!caption, captionText: caption ? clip(caption.textContent, 80) : null,
      headers, tdWithHeaders, tdHeaderSamples, danglingIdref, headersRefsNonCell, headersRefsSelf,
      firstRowAllTh, firstColAllTh, bodyTh, headerRows, regularGrid, // simple-positional header facts (1.3.1 implicit algorithm)
      roleOverride: roleOverride || null, // non-null ⇒ table semantics overridden (a25f45/1.3.1 table facet inapplicable)
      // a header cell but ZERO data cells ⇒ a header pointing at nothing (coarse derived flag).
      headerWithNoDataCell: isTableRole && ths.length > 0 && tds.length === 0,
      // layout-vs-data heuristic for the rubric: a 1-row / th-less / caption-less table is likely layout, not data.
      looksLikeDataTable: isTableRole && rows.length > 1 && (ths.length > 0 || !!caption),
    };
  });
}

module.exports = { collectTables };
