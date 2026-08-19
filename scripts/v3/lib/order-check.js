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

  // (3) within each column, flag ANY backward step in the reading subsequence vs visual (y) order. A5
  // (Harness 3.3, closes B1): the old `JUMP = max(3, 0.25n)` + strict `>` had recall holes — an adjacent
  // transposition (delta=1) was invisible, and a fully-reversed n≤4 column (max delta n−1 ≤ 3) was never
  // flagged. WCAG has no magnitude threshold for "meaningful sequence", so any within-column inversion
  // (delta ≥ 1) is a candidate. This is INTENTIONALLY high-recall: every finding is QUARANTINED as
  // uncalibrated triage (review:true, calibrated:false) — the x-overlap column model cannot decide
  // cross-column reading order (Z-order/RTL/masonry) from geometry alone (audit J.1/J.2), so an order
  // finding is a review prompt, never a pass/fail. Absence of a finding is NOT a pass.
  const findings = [];
  for (const colItems of byCol.values()) {
    if (colItems.length < 3) continue; // too few to judge order within a column
    const vis = [...colItems].sort((a, b) => (Math.abs(a.rect.y - b.rect.y) > band ? a.rect.y - b.rect.y : a.rect.x - b.rect.x));
    const rank = new Map(); vis.forEach((s, i) => rank.set(s.xpath, i));
    let prevRank = -1, prevXp = null;
    for (const s of colItems) { // colItems are in READING order
      const r = rank.get(s.xpath);
      if (prevRank >= 0 && (prevRank - r) >= 1) {
        findings.push({ kind, sc, xpath: s.xpath, label: s.label || '', review: true, calibrated: false,
          detail: `encountered after ${prevXp} but sits ${prevRank - r} visual position(s) earlier within its column — navigation order may diverge from visual order (uncalibrated triage, not a verdict)` });
      }
      prevRank = r; prevXp = s.xpath;
    }
  }
  return { findings, comparable: leaves.length };
}

// ── INTRINSIC-ORDINAL VIOLATION (2.4.3, FN round 1 2026-08-19) ─────────────────────────────────────
// The column model above is deliberately agnostic about which 2-D traversal is "right", because for an
// ORDERLESS set — a photo grid, a card wall — column-major and row-major are equally meaningful and
// flagging either manufactures a barrier. That agnosticism is wrong for a set that carries its OWN
// sequence and PRINTS it: when every item is labelled with a number and those numbers ascend in the
// page's visual reading order, the page has stated what its order means, and a traversal that violates
// it is not "an alternative systematic traversal" — it is out of order, by the set's own declaration.
//
// DOCUMENTED BOUND (adversarial self-review): the visual sort is row-major LEFT-TO-RIGHT, so on an RTL page
// a CORRECTLY ordered set reads as descending within each row and the check returns `violated: false`. That
// is the safe direction — it costs recall on RTL, never a false firing — and it is why the visual-ascending
// precondition is a precondition rather than a tie-break. Same for any layout whose reading order is not
// row-major (masonry, z-ordered): the ordinals will not ascend under this sort either, and nothing fires.
//
// This returns a fact, not a verdict, and only for the unambiguous case: nearly every stop carries a
// DISTINCT ordinal, those ordinals ascend under row-major reading geometry, and they do NOT ascend under
// the recorded navigation order. Any softening of those conditions — a few unlabelled stops, repeated
// numbers (a row/seat pair where the first integer is the row), ordinals that are not sorted visually
// either — yields `violated: false` and claims nothing, so an orderless grid of numbered thumbnails whose
// numbers do not follow the layout cannot fire it.
const ORDINAL_RE = /-?\d+/;
const ORDINAL_MIN_STOPS = 6;
const ORDINAL_MIN_COVERAGE = 0.8;
function intrinsicOrdinalViolation(items, opts = {}) {
  const band = Number.isFinite(opts.rowBand) ? opts.rowBand : 12;
  const seenXp = new Set();
  const seq = (items || []).filter((s) => s && s.rect && s.rect.w > 0 && s.rect.h > 0 && s.xpath
    && !seenXp.has(s.xpath) && seenXp.add(s.xpath));
  if (seq.length < ORDINAL_MIN_STOPS) return { violated: false, reason: 'too few stops' };
  const withN = [];
  for (const s of seq) {
    const m = ORDINAL_RE.exec(String(s.label == null ? '' : s.label));
    if (m) withN.push({ ...s, n: Number(m[0]) });
  }
  if (withN.length < ORDINAL_MIN_STOPS || withN.length / seq.length < ORDINAL_MIN_COVERAGE) {
    return { violated: false, reason: 'stops do not carry ordinals' };
  }
  if (new Set(withN.map((s) => s.n)).size !== withN.length) return { violated: false, reason: 'ordinals are not distinct' };
  const ascending = (arr) => arr.every((v, i) => i === 0 || v > arr[i - 1]);
  const navSeq = withN.map((s) => s.n);
  const visSeq = [...withN]
    .sort((a, b) => (Math.abs(a.rect.y - b.rect.y) > band ? a.rect.y - b.rect.y : a.rect.x - b.rect.x))
    .map((s) => s.n);
  if (!ascending(visSeq)) return { violated: false, reason: 'ordinals do not follow the visual reading order either' };
  if (ascending(navSeq)) return { violated: false, reason: 'navigation order follows the ordinals' };
  const CAP = 24;
  return {
    violated: true,
    stops: withN.length,
    navOrdinals: navSeq.slice(0, CAP),
    visualOrdinals: visSeq.slice(0, CAP),
    truncated: navSeq.length > CAP,
  };
}

module.exports = { visualOrderDivergence, assignColumns, intrinsicOrdinalViolation };
