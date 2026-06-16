'use strict';
// Harness 3.0 — shared VISUAL-ORDER divergence detector. A navigation SEQUENCE — the keyboard tab order
// (WCAG 2.4.3 Focus Order) OR the screen-reader reading order (WCAG 1.3.2 Meaningful Sequence) — should
// follow the page's VISUAL order. BAGEL (CHI'23) approximates the "expected" order with visual FuncSet
// clustering; a flat geometric rank does NOT work (adversarial testing showed it false-positives on the
// two most common layouts on the web — a main+sidebar two-column page and a row-major card grid). This
// detector is therefore SOUND-FIRST and COLUMN-AWARE:
//   1. exclude ANCESTOR CONTAINERS — an item whose rect encloses another item is a parent competing with
//      its own descendants in the geometric sort (the card-grid false positive); rank only leaf content.
//   2. cluster the remaining items into VISUAL COLUMNS by x-overlap. Reading/tab geometry is unambiguous
//      only WITHIN a column; a cross-column move is a legitimate next-column read in ANY multi-column
//      layout, so we never flag it.
//   3. within each column, flag an item read grossly out of its top-to-bottom visual order (e.g. a footer
//      CSS-forced to the visual top of a single column) — the clear, sound class of violation.
// items: [{ xpath, rect:{x,y,w,h}, label? }] in NAVIGATION order. opts: { sc, kind, rowBand=12 }.

// union-find column assignment by x-interval overlap.
function assignColumns(items) {
  const parent = items.map((_, i) => i);
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const union = (i, j) => { parent[find(i)] = find(j); };
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i].rect, b = items[j].rect;
      if (a.x < b.x + b.w && b.x < a.x + a.w) union(i, j); // x-intervals overlap ⇒ same column
    }
  }
  const colOf = new Map();
  items.forEach((it, i) => colOf.set(it.xpath, find(i)));
  return colOf;
}

function visualOrderDivergence(items, opts = {}) {
  const sc = opts.sc || '1.3.2';
  const kind = opts.kind || 'order';
  const band = Number.isFinite(opts.rowBand) ? opts.rowBand : 12; // px tolerance to call two items "same row"
  // dedup by xpath — a single element can appear as MULTIPLE transcript steps (e.g. a <p> is read as a
  // "paragraph" role step then its text); keep the first (its reading position) so identical-rect twins
  // don't all get dropped by the container filter below.
  const seenXp = new Set();
  const seq = (items || []).filter((s) => s.rect && s.rect.w > 0 && s.rect.h > 0 && !seenXp.has(s.xpath) && seenXp.add(s.xpath));
  if (seq.length < 3) return { findings: [], comparable: seq.length };

  // (1) drop ancestor containers (an item STRICTLY larger that encloses another comparable item — a
  // parent competing with its own descendants). Strict area comparison so equal-size siblings survive.
  const area = (r) => r.w * r.h;
  const enc = (a, b) => a.xpath !== b.xpath && area(a.rect) > area(b.rect)
    && a.rect.x <= b.rect.x + 1 && a.rect.y <= b.rect.y + 1
    && a.rect.x + a.rect.w >= b.rect.x + b.rect.w - 1 && a.rect.y + a.rect.h >= b.rect.y + b.rect.h - 1;
  const leaves = seq.filter((a) => !seq.some((b) => enc(a, b)));
  if (leaves.length < 3) return { findings: [], comparable: leaves.length };

  // (2) cluster into visual columns.
  const colOf = assignColumns(leaves);
  const byCol = new Map(); // colId -> items IN READING ORDER
  for (const s of leaves) { const c = colOf.get(s.xpath); if (!byCol.has(c)) byCol.set(c, []); byCol.get(c).push(s); }

  // (3) within each column, flag a gross backward jump in the reading subsequence vs visual (y) order.
  const findings = [];
  for (const colItems of byCol.values()) {
    if (colItems.length < 3) continue; // too few to judge order within a column
    const vis = [...colItems].sort((a, b) => (Math.abs(a.rect.y - b.rect.y) > band ? a.rect.y - b.rect.y : a.rect.x - b.rect.x));
    const rank = new Map(); vis.forEach((s, i) => rank.set(s.xpath, i));
    const JUMP = Math.max(3, Math.round(colItems.length * 0.25));
    let prevRank = -1, prevXp = null;
    for (const s of colItems) { // colItems are in READING order
      const r = rank.get(s.xpath);
      if (prevRank >= 0 && (prevRank - r) > JUMP) {
        findings.push({ kind, sc, xpath: s.xpath, label: s.label || '',
          detail: `encountered after ${prevXp} but sits ${prevRank - r} visual positions earlier within its column — navigation order diverges from visual order` });
      }
      prevRank = r; prevXp = s.xpath;
    }
  }
  return { findings, comparable: leaves.length };
}

module.exports = { visualOrderDivergence, assignColumns };
