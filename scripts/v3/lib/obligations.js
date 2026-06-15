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

// dispositions: [{ obligationId, kind: 'CLAIM'|'PARTIAL', cleared, shadow? }]
// Returns { errors[], ledger: [{obligationId, xpath, sc, claimFamily, disposition, cleared, autoPartial, shadow}] }.
function reconcile(obligations, dispositions) {
  const errors = [];
  const byId = Object.create(null); // null-proto: an obligationId like "toString"/"__proto__" is data, not a method (audit R2-L1)
  for (const d of dispositions || []) {
    if (Object.prototype.hasOwnProperty.call(byId, d.obligationId)) errors.push(`duplicate disposition for obligation ${d.obligationId}`);
    byId[d.obligationId] = d;
  }
  const oblSet = new Set(obligations.map((o) => o.obligationId));
  for (const d of dispositions || []) {
    if (!oblSet.has(d.obligationId)) errors.push(`disposition for ${d.obligationId} is not an enumerated obligation (out-of-inventory)`);
  }
  const ledger = obligations.map((o) => {
    const d = Object.prototype.hasOwnProperty.call(byId, o.obligationId) ? byId[o.obligationId] : undefined;
    return {
      obligationId: o.obligationId, xpath: o.xpath, sc: o.sc, claimFamily: o.claimFamily,
      disposition: d ? d.kind : 'PARTIAL',
      cleared: d ? !!d.cleared : false,
      autoPartial: !d,
      shadow: !!(d && d.shadow),
    };
  });
  return { errors, ledger };
}

// Derived, FAMILY-AWARE element-skill summaries. A child obligation contributes to a skill only
// when its claim-family declares membership in that skill (so clearing 2.4.7-as-focus-visibility
// never touches the focus-management summary). `cleared` is true ONLY when the skill has ≥1 child
// and EVERY child is cleared.
function aggregateElementSkill(ledger) {
  const byXpath = {};
  for (const row of ledger) (byXpath[row.xpath] = byXpath[row.xpath] || []).push(row);
  const summaries = [];
  for (const [xpath, rows] of Object.entries(byXpath)) {
    const bySkill = {};
    for (const row of rows) {
      for (const skill of oracle.skillsForFamily(row.claimFamily)) (bySkill[skill] = bySkill[skill] || []).push(row);
    }
    for (const [skill, children] of Object.entries(bySkill)) {
      const cleared = children.every((c) => c.cleared);
      const anyBarrier = children.some((c) => c.disposition === 'CLAIM' && !c.cleared);
      summaries.push({
        xpath, skill, children: children.length, cleared, anyBarrier,
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
