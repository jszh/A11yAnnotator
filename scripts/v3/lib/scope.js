'use strict';
// Project scope = the SCs listed in categories.json (CLAUDE.md). The oracle enumerates families for more SCs than
// that — 2.5.5/2.5.8 target size, 2.4.11 focus-not-obscured, 2.5.3 label-in-name, and the ACT-REST expansion
// (1.3.3, 1.3.5, 1.4.4, 1.4.12, 2.2.1, 2.2.2, 2.4.1) — and on the saved-page campaign those obligations reached the
// LLM lane and were PUBLISHED as barriers (expert-FP population check, 2026-09-26: 219 × 2.5.5, 52 × 2.5.3,
// 34 × 1.4.4, …). The user decision (2026-09-26) is to treat all of them as out of scope for now.
//
// Scope is DECLARED on the collect artifact (`collect.scope`), by the collector the product runs use
// (collectActPage), so it is visible in every saved artifact. A collect without `scope` is unfiltered: the ACT
// 581 and ACT-REST suites use their own inline collectors and score shadow observations per case SC, and the
// oracle/unit fixtures keep their full family inventory. The filter drops out-of-scope OBLIGATIONS (and the
// experiment candidates that would only fill them) — nothing is minted, judged, or published for them — and
// reports what it dropped, so the omission is never silent.
const path = require('path');

let _scs = null;
function inScopeScs() {
  if (_scs) return _scs;
  const cats = require(path.join(__dirname, '..', '..', '..', 'categories.json'));
  const s = new Set();
  for (const [k, v] of Object.entries(cats)) {
    if (k.startsWith('_') || !v || !Array.isArray(v.wcag_sc)) continue;
    for (const sc of v.wcag_sc) if (sc && sc.id) s.add(String(sc.id));
  }
  _scs = Object.freeze([...s].sort());
  return _scs;
}

// opts.scope: undefined ⇒ categories.json; 'all' ⇒ no scope (unfiltered); an array ⇒ exactly those SCs.
function scopeDeclaration(opt) {
  if (opt === 'all') return undefined;
  if (Array.isArray(opt)) return { source: 'caller', scs: [...new Set(opt.map(String))].sort() };
  return { source: 'categories.json', scs: [...inScopeScs()] };
}

// A predicate over SC ids for a collect artifact, or null when the collect declares no scope.
function scopePredicate(collect) {
  const sc = collect && collect.scope;
  if (!sc || !Array.isArray(sc.scs)) return null;
  const set = new Set(sc.scs.map(String));
  return (id) => set.has(String(id));
}

module.exports = { inScopeScs, scopeDeclaration, scopePredicate };
