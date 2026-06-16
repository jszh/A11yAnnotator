// Harness 3.0 — obligation ledger (plan Rules 13/14/16; 3.0-E; audit V3-C3, V3-C5).
//
// The builder INDEPENDENTLY enumerates atomic-claim obligations via the applicability ORACLE
// (raw collector facts), NOT from the agent's proposals and NOT from the candidate-generator's
// `applicableScs` field — so a forgotten generation branch surfaces as an honest auto-PARTIAL
// instead of disappearing. Every obligation is atomic in (xpath, sc, claim-family); every
// obligation must receive exactly one disposition (un-proposed ⇒ auto-PARTIAL, never a silent
// pass). Element-skill summaries are DERIVED, family-aware, and a single cleared child can never
// clear a skill whose siblings are not cleared (Rule 14).
'use strict';

const oracle = require('./applicability-oracle.js');

const oblId = oracle.oblId; // xpath::sc::claimFamily — atomic identity

// Independent enumeration from collect (delegates to the oracle; never reads applicableScs).
function enumerateObligations(collect) {
  return oracle.deriveObligations(collect);
}

// Fail-closed enumeration checks (non-empty evaluable page must yield obligations; no drift).
function enumerationErrors(collect) { return oracle.enumerationErrors(collect); }

// dispositions: [{ obligationId, kind:'CLAIM'|'PARTIAL'|'PROVISIONAL', cleared, shadow?, outcome?, provisional? }]
// Returns { errors[], ledger: [{obligationId, xpath, sc, claimFamily, disposition, cleared, autoPartial, shadow, provisional?}] }.
//
// Harness 3.2 — three tiers with precedence CLAIM ▸ PROVISIONAL ▸ PARTIAL. A DETERMINISTIC disposition
// (CLAIM/PARTIAL) is the floor and KEEPS its duplicate-detection invariant: two deterministic
// dispositions on one obligation is still an error (a forged/duplicate result must not be
// order-dependently resolved). A PROVISIONAL disposition ONLY fills an obligation that has NO
// deterministic disposition (the auto-PARTIAL slot), so it never collides with — and never overrides —
// a deterministic CLAIM/PARTIAL. Multiple PROVISIONAL on one obligation merge by barrier-dominates-clear.
const _confRank = (c) => ({ high: 3, medium: 2, low: 1 }[c] || 0);
const _mechOf = (f) => (f.provisional || {}).mechanism || '';
// an ATOMIC `llm-rubric:<sc>-v<n>` is scoped to one SC and individually gold-calibratable, so on a tie it
// is the more trustworthy/specific judgment than the broad whole-obligation `llm-agent` — prefer it for
// the row's primary attribution (mechanism/rationaleRef). Both still appear in supportRefs.
const _specificity = (f) => (_mechOf(f).startsWith('llm-rubric:') ? 1 : 0);
function mergeProvisional(fills) {
  const barriers = fills.filter((f) => f.outcome === 'BARRIER_OBSERVED');
  const clears = fills.filter((f) => f.outcome === 'NO_BARRIER_OBSERVED');
  if (!barriers.length && !clears.length) return null; // no DECISIVE fill (all abstentions/unknown) ⇒ no row, fail-closed
  // PRINCIPLED + DETERMINISTIC pick (audit D1-1): (1) highest confidence, then (2) the more specific
  // atomic rubric over the broad agent, then (3) mechanism id ascending as the FINAL stable tie-break —
  // so the published block is byte-stable regardless of producer emission order, and the attribution is
  // the most-specific calibratable mechanism rather than just whatever sorts first alphabetically.
  const pick = (arr) => arr.slice().sort((a, b) =>
    _confRank((b.provisional || {}).confidence) - _confRank((a.provisional || {}).confidence)
    || _specificity(b) - _specificity(a)
    || (_mechOf(a) < _mechOf(b) ? -1 : _mechOf(a) > _mechOf(b) ? 1 : 0))[0];
  let chosen, cleared, conflict;
  if (barriers.length) { chosen = pick(barriers); cleared = false; if (clears.length) conflict = { blockedClears: [...new Set(clears.map((c) => (c.provisional || {}).mechanism))].sort() }; } // barrier dominates (fail-closed)
  else { chosen = pick(clears); cleared = true; }
  // strip any pre-existing `conflict` from the chosen block so a STALE conflict can't ride the spread —
  // the conflict is RECOMPUTED here from the actual merge (adversarial A-F3).
  const { conflict: _stale, ...rest } = (chosen.provisional || {});
  const block = { ...rest, supportRefs: [...new Set(fills.map((f) => (f.provisional || {}).mechanism).filter(Boolean))].sort() };
  if (conflict) block.conflict = conflict;
  return { cleared, provisional: block };
}
function reconcile(obligations, dispositions) {
  const errors = [];
  const det = Object.create(null);  // the ONE deterministic disposition per obligation (null-proto: audit R2-L1)
  const prov = Object.create(null); // PROVISIONAL fills per obligation (array — merged below)
  for (const d of dispositions || []) {
    if (d.kind === 'PROVISIONAL') { (prov[d.obligationId] = prov[d.obligationId] || []).push(d); continue; }
    if (Object.prototype.hasOwnProperty.call(det, d.obligationId)) errors.push(`duplicate disposition for obligation ${d.obligationId}`);
    det[d.obligationId] = d;
  }
  const oblSet = new Set(obligations.map((o) => o.obligationId));
  for (const d of dispositions || []) {
    if (!oblSet.has(d.obligationId)) errors.push(`disposition for ${d.obligationId} is not an enumerated obligation (out-of-inventory)`);
  }
  const ledger = obligations.map((o) => {
    const base = { obligationId: o.obligationId, xpath: o.xpath, sc: o.sc, claimFamily: o.claimFamily };
    const d = Object.prototype.hasOwnProperty.call(det, o.obligationId) ? det[o.obligationId] : undefined;
    if (d) return { ...base, disposition: d.kind, cleared: !!d.cleared, autoPartial: false, shadow: !!d.shadow }; // deterministic wins
    const fills = Object.prototype.hasOwnProperty.call(prov, o.obligationId) ? prov[o.obligationId] : null;
    if (fills && fills.length) { const m = mergeProvisional(fills); if (m) return { ...base, disposition: 'PROVISIONAL', cleared: m.cleared, autoPartial: false, shadow: false, provisional: m.provisional }; }
    return { ...base, disposition: 'PARTIAL', cleared: false, autoPartial: true, shadow: false }; // un-filled ⇒ auto-PARTIAL
  });
  return { errors, ledger };
}

// Derived, FAMILY-AWARE element-skill summaries. A child obligation contributes to a skill only
// when its claim-family declares membership in that skill (so clearing 2.4.7-as-focus-visibility
// never touches the focus-management summary). `cleared` is true ONLY when the skill has ≥1 child
// and EVERY child is cleared.
function aggregateElementSkill(ledger) {
  // null-proto: an xpath/skill key like "__proto__"/"constructor"/"toString" is DATA, not a method or
  // prototype member — a plain `{}` here lets a hostile xpath resolve `byXpath['__proto__']` to a
  // function and throws `.push is not a function`, crashing the build FAIL-OPEN. `reconcile` above was
  // already hardened (audit R2-L1); these two maps were the missed sibling (gap-fill red-team).
  const byXpath = Object.create(null);
  for (const row of ledger) (byXpath[row.xpath] = byXpath[row.xpath] || []).push(row);
  const summaries = [];
  for (const [xpath, rows] of Object.entries(byXpath)) {
    const bySkill = Object.create(null);
    for (const row of rows) {
      for (const skill of oracle.skillsForFamily(row.claimFamily)) (bySkill[skill] = bySkill[skill] || []).push(row);
    }
    for (const [skill, children] of Object.entries(bySkill)) {
      // DETERMINISTIC aggregates (unchanged meaning — Rule 14): `cleared` requires every child to be a
      // deterministic CLAIM clear (a PROVISIONAL clear must NOT make a skill read as authoritatively
      // cleared); `anyBarrier` is a deterministic CLAIM barrier.
      const cleared = children.every((c) => c.disposition === 'CLAIM' && c.cleared);
      const anyBarrier = children.some((c) => c.disposition === 'CLAIM' && !c.cleared);
      // PROVISIONAL aggregates (Harness 3.2 — additive; never affect the deterministic fields above).
      const provisionallyCleared = children.some((c) => c.disposition === 'PROVISIONAL' && c.cleared);
      const provisionalBarrier = children.some((c) => c.disposition === 'PROVISIONAL' && !c.cleared);
      summaries.push({
        xpath, skill, children: children.length, cleared, anyBarrier, provisionallyCleared, provisionalBarrier,
        families: [...new Set(children.map((c) => c.claimFamily))].sort(),
      });
    }
  }
  // deterministic order regardless of ledger order (audit R1-F7): byte-stable output.
  return summaries.sort((a, b) => (a.xpath !== b.xpath ? (a.xpath < b.xpath ? -1 : 1) : (a.skill < b.skill ? -1 : a.skill > b.skill ? 1 : 0)));
}

// Coverage: every declared family must be realizable by the oracle for its SC (mutation backstop).
function coverageErrors(families = oracle.FAMILIES) {
  const E = [];
  for (const [fam, spec] of Object.entries(families)) {
    if (!spec.sc) { E.push(`claim-family ${fam} declares no SC`); continue; }
    if (!Array.isArray(spec.skills) || !spec.skills.length) E.push(`claim-family ${fam} declares no skills`);
  }
  return E;
}

module.exports = { FAMILIES: oracle.FAMILIES, oblId, enumerateObligations, enumerationErrors, reconcile, aggregateElementSkill, coverageErrors };
