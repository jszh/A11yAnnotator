// Harness 3.0 — the ONE mandatory v3 bundle loader (plan 3.0-E). Used by the CLI and the sweep.
// Loads the declared stage artifacts from a run directory, rejects legacy v2 artifacts, and
// NEVER treats an absent declared stage as an empty successful run.
'use strict';

const fs = require('fs');
const path = require('path');

const STAGE_FILES = {
  manifest: 'manifest.json',
  collect: 'collect.json',
  drive: 'drive.json',
  candidates: 'experiment-candidates.json',
  plan: 'experiment-plan.json',
  experiments: 'experiments.json',
  claimProposals: 'claim-proposals.json',
};

// A PRODUCTION v3 build requires the COMPLETE lineage (audit V3R3-M3): collect baseline + drive +
// the candidate/plan scheduling stages + experiments + proposals. The minimal triple is for an
// explicit shadow/debug build only — it can never publish authoritative (the builder demotes an
// incomplete bundle to shadow), but the meaning of "complete" must be enforced at the loader, not
// left implicit. `manifest` stays optional (the orchestrator does not emit one).
const PRODUCTION_REQUIRED = ['manifest', 'collect', 'drive', 'candidates', 'plan', 'experiments', 'claimProposals'];
const SHADOW_DEBUG_REQUIRED = ['collect', 'experiments', 'claimProposals'];

// required stages must be present + parseable; optional stages may be absent (→ undefined).
function loadBundle(dir, { required = ['collect', 'experiments', 'claimProposals'], optional = ['manifest', 'drive', 'candidates', 'plan'] } = {}) {
  const errors = [];
  const bundle = {};
  // reject a stray v2 results artifact being passed as a v3 run
  if (fs.existsSync(path.join(dir, 'results.json'))) {
    try {
      const r = JSON.parse(fs.readFileSync(path.join(dir, 'results.json'), 'utf8'));
      if (r && (Array.isArray(r.elements) || r.pageSkills)) errors.push('legacy v2 results.json present — v3 run rejects v2 artifacts');
    } catch (e) { /* unparseable: ignore here, not part of the v3 bundle */ }
  }
  // de-dup: a stage may appear in both `required` and the default `optional` list (e.g. drive under
  // PRODUCTION_REQUIRED) — load it once so its absence is not reported twice.
  for (const stage of [...new Set([...required, ...optional])]) {
    const f = path.join(dir, STAGE_FILES[stage]);
    if (!fs.existsSync(f)) {
      if (required.includes(stage)) errors.push(`required stage artifact missing: ${STAGE_FILES[stage]}`);
      continue;
    }
    try { bundle[stage] = JSON.parse(fs.readFileSync(f, 'utf8')); }
    catch (e) { errors.push(`cannot parse ${STAGE_FILES[stage]}: ${e.message}`); }
  }
  return { bundle, errors };
}

module.exports = { loadBundle, STAGE_FILES, PRODUCTION_REQUIRED, SHADOW_DEBUG_REQUIRED };
