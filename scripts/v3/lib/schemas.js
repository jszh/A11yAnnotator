// Harness 3.0 — strict per-stage artifact schemas (plan 3.0-E; audit V3-H2).
//
// v3-schema.js gives vocabulary and constructors; THIS gives validation. Every v3-authored
// artifact in a bundle is checked for required fields, enums, non-empty constraints, and — for the
// records the harness itself produces — UNKNOWN-KEY rejection, so a malformed or smuggled field
// cannot ride through publication. Unknown bundle STAGES are rejected too. The same validators run
// in the builder and (via build-v3) in orchestration, the CLI, replay, and tests.
'use strict';

const V = require('./v3-schema.js');
const cat = require('./catalog.js');

const KNOWN_STAGES = ['manifest', 'collect', 'drive', 'candidates', 'plan', 'experiments', 'claimProposals', 'applicability', 'judgments', 'instruments'];
const SCOPE_FIELDS = ['actionTargetRef', 'state', 'action', 'environment'];
const isStr = (v) => typeof v === 'string' && v.length > 0;
const isObj = (v) => v != null && typeof v === 'object' && !Array.isArray(v);

// Reject any key on `obj` not in `allowed` (strict shape for harness-authored records).
function noUnknownKeys(obj, allowed, path, E) {
  for (const k of Object.keys(obj)) if (!allowed.includes(k)) E.push(`${path}: unknown key ${JSON.stringify(k)}`);
}

function validIdentity(art, path, E) {
  for (const f of ['file', 'runId', 'pageDigest']) if (!isStr(art[f])) E.push(`${path}: identity field ${f} must be a non-empty string`);
}

function validScope(scope, path, E) {
  if (!isObj(scope)) { E.push(`${path}: observationScope must be an object`); return; }
  for (const f of SCOPE_FIELDS) if (!isStr(scope[f])) E.push(`${path}.observationScope.${f} must be a non-empty string`);
  // NESTED unknown-key rejection (audit R1-F2): observationScope is a closed shape — nothing may
  // ride inside it into the published claim (e.g. a smuggled legacy token under a stray key).
  noUnknownKeys(scope, SCOPE_FIELDS, `${path}.observationScope`, E);
}

// ---- per-stage ----
function validateCollect(c, E) {
  if (!isObj(c)) return E.push('collect: must be an object');
  validIdentity(c, 'collect', E);
  if (!Array.isArray(c.elements)) return E.push('collect.elements must be an array');
  c.elements.forEach((el, i) => { if (!isObj(el) || !isStr(el.xpath)) E.push(`collect.elements[${i}]: requires a non-empty xpath`); });
}

function validateExperiments(x, E) {
  if (!isObj(x)) return E.push('experiments: must be an object');
  validIdentity(x, 'experiments', E);
  if (!Number.isFinite(x.startedAt)) E.push('experiments.startedAt must be finite');
  // catalogVersion drift: evidence must have been produced under the live catalog version, and it
  // must DECLARE its version — absence is fail-closed, not a silent pass (audit R1-F3).
  if (x.catalogVersion == null) E.push('experiments.catalogVersion is required (no version ⇒ cannot verify evidence is not stale)');
  else if (x.catalogVersion !== cat.CATALOG.catalogVersion)
    E.push(`experiments.catalogVersion ${JSON.stringify(x.catalogVersion)} != live catalog ${JSON.stringify(cat.CATALOG.catalogVersion)} (stale evidence)`);
  if (!Array.isArray(x.results)) return E.push('experiments.results must be an array');
  const RESULT_KEYS = ['claimId', 'experimentId', 'targetXpath', 'sc', 'outcome', 'applicabilityEvidence', 'observationScope', 'atBaseline', 'trusted', 'isolated', 'completed', 'valid', 'measurement', 'status', 'attestation', 'discoveredSubjects'];
  x.results.forEach((r, i) => {
    const p = `experiments.results[${i}]`;
    if (!isObj(r)) return E.push(`${p}: must be an object`);
    noUnknownKeys(r, RESULT_KEYS, p, E);
    if (!isStr(r.claimId)) E.push(`${p}.claimId required`);
    if (!isStr(r.experimentId)) E.push(`${p}.experimentId required`);
    if (!isStr(r.targetXpath)) E.push(`${p}.targetXpath required`);
    if (!isStr(r.sc)) E.push(`${p}.sc required`);
    if (!isObj(r.outcome)) E.push(`${p}.outcome must be an object of typed flags`);
    // every result MUST carry its measured scope, strictly shaped — so the builder can BIND it to
    // the proposal's scope rather than fail-open on absence (audit R1-F1).
    validScope(r.observationScope, p, E);
    if (r.valid != null && typeof r.valid !== 'boolean') E.push(`${p}.valid must be boolean`);
    if (r.completed != null && typeof r.completed !== 'boolean') E.push(`${p}.completed must be boolean`);
    if (r.applicabilityEvidence != null && !isObj(r.applicabilityEvidence)) E.push(`${p}.applicabilityEvidence must be an object`);
    if (r.measurement != null && !isObj(r.measurement)) E.push(`${p}.measurement must be an object`);
    // dynamic post-action subjects (Rule 13): a closed shape — xpath + typed provenance + a canonical
    // fingerprint + the surface facts; the builder content-address-verifies the fingerprint.
    if (r.discoveredSubjects != null) {
      if (!Array.isArray(r.discoveredSubjects)) E.push(`${p}.discoveredSubjects must be an array`);
      else r.discoveredSubjects.forEach((s, j) => {
        const sp = `${p}.discoveredSubjects[${j}]`;
        if (!isObj(s)) return E.push(`${sp}: must be an object`);
        noUnknownKeys(s, ['xpath', 'viaAction', 'fingerprint', 'surfaceFacts'], sp, E);
        for (const f of ['xpath', 'viaAction', 'fingerprint']) if (!isStr(s[f])) E.push(`${sp}.${f} must be a non-empty string`);
        if (s.surfaceFacts != null && !isObj(s.surfaceFacts)) E.push(`${sp}.surfaceFacts must be an object`);
      });
    }
    // attestation (audit V3R3-C1) is a CLOSED provenance shape: a runner identity/version plus the
    // signed digest + MAC. Its presence is not trusted by itself — the builder re-verifies it — but
    // a malformed/over-wide attestation must not ride through the schema.
    if (r.attestation != null) {
      if (!isObj(r.attestation)) E.push(`${p}.attestation must be an object`);
      else {
        const at = r.attestation;
        noUnknownKeys(at, ['runner', 'runnerVersion', 'resultDigest', 'mac', 'runIdentity'], `${p}.attestation`, E);
        // runner identity/version are REQUIRED non-empty (audit V3R4-M1) — publication must prove the
        // evidence came from the cited catalog runner at a known build; the builder also checks them.
        for (const f of ['resultDigest', 'mac', 'runner', 'runnerVersion']) if (!isStr(at[f])) E.push(`${p}.attestation.${f} must be a non-empty string`);
        if (!isObj(at.runIdentity)) E.push(`${p}.attestation.runIdentity must be an object`);
        else {
          noUnknownKeys(at.runIdentity, ['file', 'runId', 'observedPageDigest'], `${p}.attestation.runIdentity`, E);
          for (const f of ['file', 'runId', 'observedPageDigest']) if (!isStr(at.runIdentity[f])) E.push(`${p}.attestation.runIdentity.${f} must be a non-empty string`);
        }
      }
    }
    // CLOSE the outcome shape: every flag must be a DECLARED typed outcome of the experiment runner
    // (audit V3R2-H6 — no smuggled flags) and every flag value must be boolean.
    const exp = cat.getExperiment(r.experimentId);
    if (exp && isObj(r.outcome)) for (const k of Object.keys(r.outcome)) {
      if (!(exp.typedOutcomes || []).includes(k)) E.push(`${p}.outcome has undeclared flag ${JSON.stringify(k)} for ${r.experimentId}`);
      else if (typeof r.outcome[k] !== 'boolean') E.push(`${p}.outcome.${k} must be boolean`);
    }
  });
  // unrun records (skipped/failed/deferred) are a closed shape too.
  if (Array.isArray(x.unrun)) x.unrun.forEach((u, i) => {
    const p = `experiments.unrun[${i}]`;
    if (!isObj(u)) return E.push(`${p}: must be an object`);
    noUnknownKeys(u, ['candidateId', 'experimentId', 'status', 'reason'], p, E);
    if (!isStr(u.candidateId)) E.push(`${p}.candidateId required`);
    if (!['skipped', 'failed', 'deferred'].includes(u.status)) E.push(`${p}.status must be skipped|failed|deferred`);
  });
}

function validateProposals(cp, E) {
  if (!isObj(cp)) return E.push('claimProposals: must be an object');
  validIdentity(cp, 'claimProposals', E);
  if (!Array.isArray(cp.proposals)) return E.push('claimProposals.proposals must be an array');
  const PROP_KEYS = ['claimId', 'sc', 'direction', 'experimentId', 'claimFamily', 'candidateId', 'observationScope', 'supportRefs'];
  cp.proposals.forEach((pr, i) => {
    const p = `claimProposals.proposals[${i}]`;
    if (!isObj(pr)) return E.push(`${p}: must be an object`);
    noUnknownKeys(pr, PROP_KEYS, p, E);
    if (!isStr(pr.claimId)) E.push(`${p}.claimId required`);
    if (!V.ALL_SCS.includes(pr.sc)) E.push(`${p}.sc ${JSON.stringify(pr.sc)} is not a known SC`);
    if (!V.DIRECTIONS.includes(pr.direction)) E.push(`${p}.direction ${JSON.stringify(pr.direction)} is not an assertable direction`);
    if (!isStr(pr.experimentId)) E.push(`${p}.experimentId required`);
    validScope(pr.observationScope, p, E);
  });
}

function validatePlan(pl, E) {
  if (!isObj(pl)) return E.push('plan: must be an object');
  if (!Array.isArray(pl.requests)) E.push('plan.requests must be an array');
  (pl.requests || []).forEach((r, i) => {
    const p = `plan.requests[${i}]`;
    if (!isStr(r.candidateId)) E.push(`${p}.candidateId required`);
    if (!isStr(r.experimentId)) E.push(`${p}.experimentId required`);
    if (!isStr(r.targetXpath)) E.push(`${p}.targetXpath required`);
    if (!isStr(r.sc)) E.push(`${p}.sc required`);
  });
}

function validateCandidates(ca, E) {
  if (!isObj(ca)) return E.push('candidates: must be an object');
  if (!Array.isArray(ca.candidates)) return E.push('candidates.candidates must be an array');
  ca.candidates.forEach((c, i) => {
    const p = `candidates.candidates[${i}]`;
    if (!isStr(c.candidateId)) E.push(`${p}.candidateId required`);
    if (!isStr(c.xpath)) E.push(`${p}.xpath required`);
    if (!isStr(c.sc)) E.push(`${p}.sc required`);
    if (!isStr(c.experimentId)) E.push(`${p}.experimentId required`);
  });
}

// drive/manifest are baseline/provenance: if present they must at least be objects and, when they
// declare identity fields, those must be strings (the cross-artifact gate checks the values match).
function validateBaseline(art, name, E) {
  if (!isObj(art)) { E.push(`${name}: must be an object`); return; }
  for (const f of ['file', 'runId', 'pageDigest']) if (art[f] != null && !isStr(art[f])) E.push(`${name}.${f} must be a string`);
}

// Validate the whole bundle: reject unknown stages, validate each present stage strictly.
function validateBundle(bundle) {
  const E = [];
  if (!isObj(bundle)) return ['bundle: must be an object'];
  for (const k of Object.keys(bundle)) if (!KNOWN_STAGES.includes(k)) E.push(`bundle: unknown stage ${JSON.stringify(k)}`);
  if (bundle.collect != null) validateCollect(bundle.collect, E);
  if (bundle.experiments != null) validateExperiments(bundle.experiments, E);
  if (bundle.claimProposals != null) validateProposals(bundle.claimProposals, E);
  if (bundle.plan != null) validatePlan(bundle.plan, E);
  if (bundle.candidates != null) validateCandidates(bundle.candidates, E);
  if (bundle.drive != null) validateBaseline(bundle.drive, 'drive', E);
  if (bundle.manifest != null) validateBaseline(bundle.manifest, 'manifest', E);
  if (bundle.applicability != null) { // independent observation stage (Rule 15)
    if (!isObj(bundle.applicability)) E.push('applicability: must be an object');
    else {
      validIdentity(bundle.applicability, 'applicability', E); // bind the stage to the run (audit R5R-C1)
      if (!Array.isArray(bundle.applicability.observations)) E.push('applicability.observations must be an array');
      else bundle.applicability.observations.forEach((o, i) => { if (!isObj(o) || !isStr(o.xpath) || !isObj(o.facts)) E.push(`applicability.observations[${i}] requires xpath + facts`); });
    }
  }
  return E;
}

module.exports = { validateBundle, validateCollect, validateExperiments, validateProposals, validatePlan, validateCandidates, KNOWN_STAGES };
