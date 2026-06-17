// Harness 3.3 — C0: surface axe's already-decided coverage into v3 as a NON-AUTHORITATIVE checker
// cross-signal. axe runs at COLLECTION time (scripts/eval-page.js → `collect.axe`/`collect.axeRan`),
// but the v3 ledger never consumed it — its decided wins were free coverage v3 threw away. We
// reconcile ONLY axe's decided wins (the allow-list below) into a side `checkerFindings` artifact.
//
// INVARIANT (HARNESS-3.3-IMPLEMENTATION.md §2): a checker finding is NEVER an obligation disposition.
// It does not enter reconcile() and so adds NO tie-break — it is a shadow cross-signal at the same
// tier as instrument findings, unioned as evidence and scored against gold, never authoritative.
'use strict';

// axe owns these outright on the scored ACT pilot (1.3.1 + 1.3.5 perfect, 0 FP; 1.4.4 / 2.4.4 / 3.1.x
// decided). Everything else axe flags is intentionally NOT surfaced as decided coverage here — we do
// not want axe's noisier rules masquerading as v3 decisions. IBM (Stage 4) supplies a DIFFERENT,
// non-overlapping set (1.4.12 / 2.5.3 / triage), so the two checkers never double-decide one SC.
const AXE_SURFACED_SCS = Object.freeze(new Set(['1.3.1', '1.3.5', '1.4.4', '2.4.4']));
const AXE_SURFACED_PREFIXES = Object.freeze(['3.1.']); // 3.1.x language SCs (3.1.1 lang, 3.1.2 lang-of-parts)

// axe carries its SC binding in the violation's own WCAG TAGS (e.g. 'wcag131'); level/version tags
// ('wcag2a', 'wcag21aa') and category tags do not match this and resolve to null (then dropped).
const wcagTagToSc = (t) => { const m = /^wcag(\d)(\d)(\d+)$/.exec(String(t)); return m ? `${m[1]}.${m[2]}.${m[3]}` : null; };
const isSurfaced = (sc) => AXE_SURFACED_SCS.has(sc) || AXE_SURFACED_PREFIXES.some((p) => sc.startsWith(p));

// Map `collect.axe` (the eval-page.js shape: [{ id, impact, help, wcag:[tag…], nodes:[{target,html}] }])
// to surfaced checker findings, filtered to the decided allow-list.
//
// FAIL-CLOSED: `collect.axeRan` MUST be EXACTLY true. A missing sentinel means axe never ran on this
// page — surfacing nothing then is correct, but we must NOT let "no findings" read as "axe says clean"
// (R2.7-B). Callers should treat `ran:false` as "no axe signal", not "no violations".
//
// A violation can carry several decided SC tags and several nodes; it fans out to one finding per
// (rule, SC, element), deduped by (ruleId, sc, target). We deliberately drop axe's raw `html` snippet
// and human `help` prose: the surfaced finding is structured harness data (rule id + SC + impact +
// element selector), so it cannot leak page content into the strictly-scanned v3 results.
function surfaceAxeFindings(collect) {
  const ran = !!(collect && collect.axeRan === true);
  if (!ran || !Array.isArray(collect.axe)) return { ran, findings: [] };
  const findings = [];
  const seen = new Set();
  for (const v of collect.axe) {
    if (!v || typeof v !== 'object') continue;
    const ruleId = String(v.id || 'axe-rule');
    const impact = v.impact != null ? String(v.impact) : '';
    const scs = [...new Set((Array.isArray(v.wcag) ? v.wcag : []).map(wcagTagToSc).filter(Boolean).filter(isSurfaced))];
    if (!scs.length) continue; // violation carries no DECIDED (allow-listed) SC → not surfaced
    const nodes = Array.isArray(v.nodes) && v.nodes.length ? v.nodes : [null];
    for (const sc of scs) {
      for (const n of nodes) {
        const target = n && Array.isArray(n.target) ? n.target.join(' ') : (n && n.target != null ? String(n.target) : null);
        const key = `${ruleId}::${sc}::${target || ''}`;
        if (seen.has(key)) continue;
        seen.add(key);
        // source:'axe' tags WHO produced it; kind:'violation' is axe's hard finding (axe emits only
        // violations here — resultTypes:['violations']). review:false ⇒ a decided hard signal, not a prior.
        findings.push({ source: 'axe', detector: `axe:${ruleId}`, ruleId, sc, impact, kind: 'violation', xpath: target, review: false });
      }
    }
  }
  return { ran: true, findings };
}

module.exports = { surfaceAxeFindings, wcagTagToSc, isSurfaced, AXE_SURFACED_SCS, AXE_SURFACED_PREFIXES };
