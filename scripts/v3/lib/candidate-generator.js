// Harness 3.0 — deterministic candidate generation (plan 3.0-B). From the baseline collect+drive,
// decide which catalog experiments could resolve an indeterminate baseline. Pure + deterministic;
// no agent. The applicable-SC annotation DELEGATES to the independent oracle, so the obligation
// ledger and the candidate path can never silently diverge (audit V3-C3): forgetting a candidate
// branch here still leaves the obligation enumerated (→ auto-PARTIAL), never disappeared.
'use strict';

const oracle = require('./applicability-oracle.js');

// Re-exported for back-compat; the oracle is the single source of the role/fact → SC mapping.
const applicableScsFor = oracle.applicableScsFor;

// Annotate the collect inventory with applicableScs (from the oracle). The builder still enumerates
// obligations from the oracle directly and will reject any annotation that drifts from it.
function annotateApplicableScs(collect) {
  for (const el of (collect && collect.elements) || []) el.applicableScs = oracle.applicableScsFor(el);
  return collect;
}

// Generate experiment candidates from baseline evidence. A candidate names the SC + claim-family it
// would resolve, the experiment, its deterministic selection level, the allowed experiment recipes
// (so a later agent plan cannot swap in a different experiment), and the missing evidence.
function generateCandidates(collect, drive) {
  const driveByXpath = {};
  for (const e of (drive && drive.elements) || []) if (e && e.xpath) driveByXpath[e.xpath] = e;
  const candidates = [];
  let i = 0;
  for (const el of (collect && collect.elements) || []) {
    if (!el || !el.xpath) continue;
    const d = driveByXpath[el.xpath] || {};
    const baselineFocus = d.focusIndicator;
    const indeterminate = !baselineFocus || baselineFocus.present == null || baselineFocus.cropInvalid === true;
    // Level 1 mandatory-automatic: a focusable element whose baseline focus evidence is
    // indeterminate → focus-visual-retry (2.4.7 / focus-indicator-visible).
    if (el.focusable && indeterminate) {
      candidates.push({
        candidateId: `cand-${++i}`,
        xpath: el.xpath,
        sc: '2.4.7',
        claimFamily: 'focus-indicator-visible',
        experimentId: 'focus-visual-retry',
        allowedExperiments: ['focus-visual-retry'],
        selectionLevel: 1,
        selectionReason: 'baseline focus indicator indeterminate or crop invalid',
        missingEvidence: ['focusDependentIndicator', 'obviouslyVisible'],
      });
    }
  }
  return { file: collect && collect.file, runId: collect && collect.runId, pageDigest: collect && collect.pageDigest, candidates };
}

module.exports = { applicableScsFor, annotateApplicableScs, generateCandidates };
