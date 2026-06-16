'use strict';
// Harness 3.2 §8 — the gold loader. The per-mechanism gold FILES carry a rich, provenance-bearing shape
// ({ mechanism, sc, labels:[{ xpath, sc, goldOutcome, basis, raters, adjudicated }] }); build-v3/metrics
// consume the FLAT [{ xpath, sc, goldOutcome }] array. This flattens them — and enforces the gate's
// floor: only an ADJUDICATED label with a valid outcome counts, so a draft/un-adjudicated label can never
// gate a promotion. (Real labels for the ○-tier families are produced by the post-run hand-labeling pass
// — memory: ground-truth-hand-labeled-after-harness — which is on hold; this loader is the wiring.)
const fs = require('fs');
const path = require('path');

const GOLD_DIR = path.join(__dirname, '..', '..', '..', 'eval', 'gold', 'v3');
const OUTCOMES = new Set(['BARRIER_OBSERVED', 'NO_BARRIER_OBSERVED', 'INAPPLICABLE']);

// Returns { gold:[{xpath,sc,goldOutcome}], errors[], byMechanism:{[mech]:count} }. `requireAdjudicated`
// defaults true (only gold-grade labels gate); set false to inspect drafts.
function loadGold({ dir = GOLD_DIR, requireAdjudicated = true } = {}) {
  const gold = []; const errors = []; const byMechanism = Object.create(null);
  const seenCell = Object.create(null); // (xpath::sc::family) → outcome, to SURFACE a contradictory pair (audit)
  for (const f of (fs.existsSync(dir) ? fs.readdirSync(dir).sort() : [])) { // SORTED ⇒ deterministic across filesystems (audit D-2)
    if (!/\.gold\.json$/.test(f)) continue;
    let doc;
    try { doc = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch (e) { errors.push(`${f}: unparseable (${e.message})`); continue; }
    // JSON.parse("null") / a bare primitive parses fine but has no .labels — guard before deref (adversarial).
    if (!doc || typeof doc !== 'object' || Array.isArray(doc)) { errors.push(`${f}: not a gold object`); continue; }
    const labels = Array.isArray(doc.labels) ? doc.labels : [];
    let kept = 0;
    for (const l of labels) {
      if (!l || typeof l.xpath !== 'string' || typeof l.sc !== 'string' || !OUTCOMES.has(l.goldOutcome)) { errors.push(`${f}: malformed label (xpath/sc/goldOutcome)`); continue; }
      if (requireAdjudicated && l.adjudicated !== true) continue; // an un-adjudicated label is INERT — never gates
      // carry the optional claimFamily so the scorer can be family-precise (audit D-GATE-2); absent ⇒ family-agnostic.
      const row = { xpath: l.xpath, sc: l.sc, goldOutcome: l.goldOutcome };
      if (typeof l.claimFamily === 'string' && l.claimFamily) row.claimFamily = l.claimFamily;
      // a CONTRADICTORY duplicate (same cell, different outcome) is a labeling error — surface it loudly
      // rather than silently letting one row win (the scorer is BARRIER-dominant, but the conflict is real).
      const cell = `${l.xpath}::${l.sc}::${row.claimFamily || '*'}`;
      if (seenCell[cell] != null && seenCell[cell] !== l.goldOutcome) errors.push(`${f}: conflicting gold outcomes for ${cell}: ${seenCell[cell]} vs ${l.goldOutcome}`);
      seenCell[cell] = l.goldOutcome;
      gold.push(row);
      kept++;
    }
    if (doc.mechanism) byMechanism[doc.mechanism] = (byMechanism[doc.mechanism] || 0) + kept;
  }
  return { gold, errors, byMechanism };
}

module.exports = { loadGold, GOLD_DIR, OUTCOMES };
