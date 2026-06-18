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
    const caption = t.querySelector(':scope > caption');
    const rows = [...t.rows];
    const ths = [...t.querySelectorAll('th')];
    const tds = [...t.querySelectorAll('td')];
    const idText = {};
    for (const c of t.querySelectorAll('[id]')) idText[c.id] = clip(c.textContent, 40);
    const headers = ths.slice(0, 30).map((th) => ({
      id: th.id || null, scope: (th.getAttribute('scope') || '').toLowerCase() || null, text: clip(th.textContent, 60),
    }));
    // each <td headers="..."> IDREF list + whether each ref RESOLVES to a cell id in this table (a dangling ref
    // is the d0f69e mis-wire smell); a few samples so the rubric can judge whether the wiring is semantically right.
    let danglingIdref = false, tdWithHeaders = 0;
    const tdHeaderSamples = [];
    for (const td of tds) {
      const refs = (td.getAttribute('headers') || '').split(/\s+/).filter(Boolean);
      if (!refs.length) continue;
      tdWithHeaders++;
      const resolved = refs.map((id) => (Object.prototype.hasOwnProperty.call(idText, id) ? idText[id] : null));
      if (resolved.some((r) => r === null)) danglingIdref = true;
      if (tdHeaderSamples.length < 12) tdHeaderSamples.push({ cell: clip(td.textContent, 30), headers: refs, resolved });
    }
    return {
      rowCount: rows.length, thCount: ths.length, tdCount: tds.length,
      hasCaption: !!caption, captionText: caption ? clip(caption.textContent, 80) : null,
      headers, tdWithHeaders, tdHeaderSamples, danglingIdref,
      // a header cell but ZERO data cells ⇒ a header pointing at nothing (coarse derived flag).
      headerWithNoDataCell: ths.length > 0 && tds.length === 0,
      // layout-vs-data heuristic for the rubric: a 1-row / th-less / caption-less table is likely layout, not data.
      looksLikeDataTable: rows.length > 1 && (ths.length > 0 || !!caption),
    };
  });
}

module.exports = { collectTables };
