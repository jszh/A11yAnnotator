// Harness 3.0 — deterministic candidate generation (plan 3.0-B). From the baseline collect+drive,
// decide which catalog experiments could resolve an indeterminate baseline. Pure + deterministic;
// no agent. The applicable-SC annotation DELEGATES to the independent oracle, so the obligation
// ledger and the candidate path can never silently diverge (audit V3-C3): forgetting a candidate
// branch here still leaves the obligation enumerated (→ auto-PARTIAL), never disappeared.
'use strict';

const oracle = require('./applicability-oracle.js');
const cat = require('./catalog.js');

// claim-family → experiment recipe, derived from the catalog (each experiment declares its family).
const FAM_EXP = {};
for (const [id, exp] of Object.entries(cat.CATALOG.experiments)) if (exp.claimFamily) FAM_EXP[exp.claimFamily] = id;

// Re-exported for back-compat; the oracle is the single source of the role/fact → SC mapping.
const applicableScsFor = oracle.applicableScsFor;

// Annotate the collect inventory with applicableScs (from the oracle). The builder still enumerates
// obligations from the oracle directly and will reject any annotation that drifts from it.
function annotateApplicableScs(collect) {
  for (const el of (collect && collect.elements) || []) el.applicableScs = oracle.applicableScsFor(el);
  return collect;
}

// Generate experiment candidates from the INDEPENDENT oracle, one per enumerated (element, family)
// obligation, each bound to that family's catalog recipe (audit V3R2-H1: every experiment runs
// through the normal pipeline, not just focus). Level-1 mandatory-automatic. focus-visual-retry is
// additionally gated on an indeterminate baseline focus indicator (a determinate baseline needs no
// experiment); the others run whenever their obligation applies.
function generateCandidates(collect, drive) {
  const driveByXpath = {};
  for (const e of (drive && drive.elements) || []) if (e && e.xpath) driveByXpath[e.xpath] = e;
  const candidates = [];
  let i = 0;
  // DEFERRED (plan Phase 2; audit V3R5-M2): every candidate is currently Level-1 mandatory-automatic
  // with a single allowedExperiment. The Level-3 contextual planner + validating merger
  // (agent-planner.js, scheduler.js) are built and tested with synthetic Level-3 candidates, but NO
  // production candidate is emitted at Level 3 yet — so there is no live agent-selected escalation.
  // Phase 2 will detect context-dependent choices (advised-exit-key selection for a keyboard trap,
  // custom-widget recipe selection, setup sequencing) and call add(... , 3) with a multi-experiment
  // allowlist. The `selectionLevel` parameter below is the seam; until Phase 2 it always defaults to 1.
  const add = (xpath, claimFamily, reason, missing = [], selectionLevel = 1) => {
    const experimentId = FAM_EXP[claimFamily]; if (!experimentId) return;
    candidates.push({ candidateId: `cand-${++i}`, xpath, sc: oracle.scForFamily(claimFamily), claimFamily, experimentId, allowedExperiments: [experimentId], selectionLevel, selectionReason: reason, missingEvidence: missing });
  };
  for (const el of (collect && collect.elements) || []) {
    if (!el || !el.xpath) continue;
    // an IN-FRAME element (coverage audit, iframe traversal) carries a NAMESPACED xpath a top-doc experiment
    // cannot drive (document.evaluate would throw). Skip experiment candidates for it — its obligations still
    // enumerate (deriveObligations) and reach the non-driving agent/LLM lane as auto-PARTIAL.
    if (el.inFrame === true) continue;
    const d = driveByXpath[el.xpath] || {};
    const baselineFocus = d.focusIndicator;
    const indeterminate = !baselineFocus || baselineFocus.present == null || baselineFocus.cropInvalid === true;
    for (const fam of oracle.familiesFor(el)) {
      if (fam === 'focus-indicator-visible') {
        if (el.focusable && indeterminate) add(el.xpath, fam, 'baseline focus indicator indeterminate or crop invalid', ['focusDependentIndicator', 'obviouslyVisible']);
      } else {
        add(el.xpath, fam, `${fam} obligation (oracle-enumerated)`);
      }
    }
  }
  // page-level reflow obligation (C8).
  if (collect && collect.page && collect.page.reflowApplicable === true) add(oracle.PAGE_REFLOW_XPATH, 'reflow-no-hscroll', 'page-level reflow at 320px');
  return { file: collect && collect.file, runId: collect && collect.runId, pageDigest: collect && collect.pageDigest, candidates };
}

module.exports = { applicableScsFor, annotateApplicableScs, generateCandidates };
