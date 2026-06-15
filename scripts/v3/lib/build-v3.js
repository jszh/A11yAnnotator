// Harness 3.0 — the v3 publication gate (plan 3.0-E; audit remediation). Deterministic: given a
// frozen evidence bundle it
//   (1) validates registry / catalog / authority / consistency + strict per-stage schemas,
//   (2) runs the ONE cross-artifact gate (identity / freshness / scope / reconciliation / legacy),
//   (3) BINDS each proposal to evidence by (claimId, experimentId, SC, target, scope) — rejecting
//       cross-target / cross-SC laundering and duplicate/conflicting evidence,
//   (4) resolves every bound proposal to a disposition, then applies AUTHORITY promotion: a
//       gate-passing claim publishes as authoritative ONLY if its mechanism/direction is promoted;
//       otherwise it is demoted to a SHADOW observation (recorded, never authoritative),
//   (5) reconciles obligations independently enumerated from the collector (atomic per claim-
//       family; un-proposed ⇒ auto-PARTIAL), and
//   (6) emits v3-only output — refusing to publish if any legacy label survived.
'use strict';

const V = require('./v3-schema.js');
const reg = require('./registry.js');
const cat = require('./catalog.js');
const auth = require('./authority.js');
const xa = require('./cross-artifact.js');
const obl = require('./obligations.js');
const oracle = require('./applicability-oracle.js');
const schemas = require('./schemas.js');
const attest = require('./attestation.js');
const manifest = require('./manifest.js');
const coverage = require('./coverage-registry.js');
const dynamic = require('./dynamic-subjects.js');
const observer = require('./applicability-observer.js');
const judgments = require('./judgments.js');
const { resolveClaim } = require('./claims.js');

const SCOPE_FIELDS = ['actionTargetRef', 'state', 'action', 'environment'];
const sameScope = (a, b) => !!a && !!b && SCOPE_FIELDS.every((f) => a[f] === b[f]);

// The trust anchor (attestation key + on-disk artifact verifier) lives in builder OPTS or on the
// trusted authority config — NEVER in the bundle. `__trust` is a non-enumerable companion the test
// helpers / production CLI attach to the authority registry; it is invisible to validateAuthority
// and authorityFor (which iterate string keys only). Absent a key, nothing publishes authoritative.
function trustConfig(opts, authorityReg) {
  const t = (authorityReg && authorityReg.__trust) || {};
  return {
    key: attest.loadKey(opts) || t.attestationKey || null,
    artifactVerifier: opts.artifactVerifier || t.artifactVerifier || null,
  };
}

function buildV3(bundle, opts = {}) {
  const errors = [];
  const E = (m) => errors.push(m);
  const authorityReg = opts.authority || auth.AUTHORITY;

  // (1) Phase-0 coverage: registry / catalog / authority well-formed; every completeness
  //     obligation measured by its supporting experiment; strict per-stage artifact schemas.
  for (const m of reg.validateRegistry()) E(`registry: ${m}`);
  for (const m of reg.validateCoverage()) E(`registry: ${m}`);
  for (const m of cat.validateCatalog()) E(`catalog: ${m}`);
  for (const m of auth.validateAuthority(authorityReg)) E(`authority: ${m}`);
  for (const m of reg.validateConsistency(reg.REGISTRY, cat.CATALOG)) E(`consistency: ${m}`);
  for (const m of obl.coverageErrors()) E(`claim-family coverage: ${m}`);
  for (const m of schemas.validateBundle(bundle)) E(`schema: ${m}`);
  if (bundle && bundle.manifest != null) for (const m of manifest.validateManifestShape(bundle.manifest)) E(`schema: ${m}`);
  if (errors.length) return { ok: false, errors, results: null };

  // (2) one cross-artifact gate (identity / freshness / scope / reconciliation / legacy-reject)
  const xErrs = xa.crossArtifactErrors(bundle, opts.requiredStages);
  if (xErrs.length) { for (const m of xErrs) E(`cross-artifact: ${m}`); return { ok: false, errors, results: null }; }

  // (2b) INDEPENDENT enumeration fail-closed: a non-empty evaluable page that yields no obligations,
  //      or any applicableScs that disagrees with the oracle, is a generation defect — refuse.
  const enumErrs = oracle.enumerationErrors(bundle.collect);
  if (enumErrs.length) { for (const m of enumErrs) E(`enumeration: ${m}`); return { ok: false, errors, results: null }; }

  // (2c) INDEPENDENTLY-OWNED coverage registry (plan Rule 16; audit V3R4-H8): a SEPARATE declaration
  //      of surface→family requirements must agree with the oracle's enumeration, so removing a family
  //      branch from the oracle (which both candidate-gen and obligation-enumeration share) is caught.
  const covErrs = coverage.coverageErrors(bundle.collect);
  if (covErrs.length) { for (const m of covErrs) E(`coverage: ${m}`); return { ok: false, errors, results: null }; }

  // (3) index evidence by claimId, recording DUPLICATES so conflicting evidence cannot be
  //     resolved order-dependently (audit V3-H5). A claimId with >1 result is a conflict.
  const evByClaim = {};
  const rawByClaim = {};   // the FULL result, for attestation verification at the publish boundary
  const evCount = {};
  for (const r of (bundle.experiments && bundle.experiments.results) || []) {
    if (!r || !r.claimId) continue;
    evCount[r.claimId] = (evCount[r.claimId] || 0) + 1;
    rawByClaim[r.claimId] = r;
    evByClaim[r.claimId] = {
      experimentId: r.experimentId,
      sc: r.sc,
      targetXpath: r.targetXpath,
      observationScope: r.observationScope,
      experimentOutcome: r.outcome || {},
      applicabilityEvidence: r.applicabilityEvidence || {},
      atBaseline: r.atBaseline,
      valid: r.valid,
      completed: r.completed,
    };
  }

  // a definite direction may bind evidence only from a CATALOG runner that produced a VALID,
  // COMPLETED measurement (audit V3R2-C1: a forged completed:false/valid:false result must not
  // publish). Authoritative publication additionally requires the COMPLETE reconciled bundle
  // (plan + candidates) — not the orchestrator's happy path only (audit V3R2-H6).
  const bundleComplete = !!(bundle.plan && bundle.candidates && bundle.drive);
  const trust = trustConfig(opts, authorityReg);

  // ATTESTED RUN-MANIFEST (plan Rule 17; audit V3R4-H7). When present, verify it: a CONTENT mismatch
  // (artifact hash / identity / signedDigest) means the bundle is corrupt or not the one the
  // orchestrator produced ⇒ REFUSE the build. A manifest that merely cannot be verified (unsigned /
  // wrong key) just cannot publish authoritative. Production requires the manifest (opts.requireManifest).
  const manifestRes = manifest.verifyManifest(bundle, trust.key);
  if (manifestRes.present && manifestRes.integrityBroken) { for (const m of manifestRes.errors) E(`manifest: ${m}`); return { ok: false, errors, results: null }; }
  if (opts.requireManifest && !manifestRes.present) { E('manifest: a verified run-manifest is required for a production build (use --shadow-debug for an incomplete inspection build)'); return { ok: false, errors, results: null }; }
  // the manifest's (signed) catalog + runner build must match the LIVE build before publication (plan
  // G1(d); audit V3R4 red-team) — a manifest attesting a stale catalog/runner build cannot publish.
  const liveBuild = cat.CATALOG.catalogVersion;
  const manifestBuildOk = manifestRes.present && bundle.manifest.catalogVersion === liveBuild && bundle.manifest.runnerVersion === liveBuild;
  const manifestVerified = manifestRes.present && manifestRes.valid && manifestBuildOk;

  // INDEPENDENT applicability corroboration (plan Rule 15; audit V3R4-H6): the claim's family must be
  // derivable for its target element by the ORACLE from raw collector facts — a derivation that never
  // saw the runner's measurement. The runner's own applicabilityEvidence flags remain (now attested),
  // but the family-level applicability is independently corroborated here, so a runner cannot
  // manufacture applicability the collector's structural facts do not support. (Honest bound: this
  // corroborates the FAMILY; a fully independent re-observation of the fine flags is future work.)
  const collectByXpath = {};
  for (const el of (bundle.collect && bundle.collect.elements) || []) if (el && el.xpath) collectByXpath[el.xpath] = el;
  const pageReflowApplicable = !!(bundle.collect && bundle.collect.page && bundle.collect.page.reflowApplicable === true);
  const oracleCorroborates = (xpath, fam) => {
    if (!fam) return false;
    if (xpath === oracle.PAGE_REFLOW_XPATH) return fam === 'reflow-no-hscroll' && pageReflowApplicable;
    const el = collectByXpath[xpath];
    return !!el && oracle.familiesFor(el).includes(fam);
  };

  const proposals = (bundle.claimProposals && bundle.claimProposals.proposals) || [];
  const seen = new Set();
  const claims = [];        // authoritative, published
  const shadowObs = [];     // gate-passing but NOT promoted — recorded, never authoritative
  const partials = [];      // gate-failed / unsupported / unbound
  for (const p of proposals) {
    if (!p || !p.claimId) { E('claim proposal missing claimId'); continue; }
    if (seen.has(p.claimId)) { E(`duplicate claimId ${p.claimId}`); continue; }
    seen.add(p.claimId);

    // bind family deterministically: prefer the proposal's, else the cited experiment's.
    const family = p.claimFamily || (cat.getExperiment(p.experimentId) || {}).claimFamily || null;
    const scope = p.observationScope || {};
    const target = scope.actionTargetRef;

    // EVIDENCE BINDING (audit V3-C1/H5): link evidence only when it is the SAME experiment AND it
    // was measured on the SAME SC, target, and scope the proposal asserts. Any mismatch, or
    // duplicate/conflicting evidence for this claimId, leaves the proposal UNSUPPORTED → PARTIAL.
    const linked = evByClaim[p.claimId];
    let ev = { experimentOutcome: {}, applicabilityEvidence: {} };
    let bindReason = null;
    if (!linked) bindReason = 'no evidence for this claimId';
    else if (evCount[p.claimId] > 1) bindReason = `conflicting/duplicate evidence (${evCount[p.claimId]} results share claimId ${p.claimId})`;
    else if (linked.experimentId !== p.experimentId) bindReason = `evidence experiment ${linked.experimentId} != proposal experiment ${p.experimentId}`;
    else if (!cat.getExperiment(linked.experimentId)) bindReason = `evidence experiment ${linked.experimentId} is not a catalog runner (no provenance)`;
    else if (linked.sc !== p.sc) bindReason = `evidence SC ${linked.sc} != proposal SC ${p.sc}`;
    else if (linked.targetXpath !== target) bindReason = `evidence target ${linked.targetXpath} != proposal scope target ${target} (cross-target)`;
    // evidence MUST carry a scope and it MUST match the proposal's — a MISSING evidence scope is a
    // bind FAILURE, never a skip (audit R1-F1): an unbound scope cannot be published.
    else if (!sameScope(linked.observationScope, scope)) bindReason = 'evidence observationScope missing or != proposal observationScope (target/state/action/env)';
    // the runner must have produced a VALID, COMPLETED measurement — a self-marked invalid/incomplete
    // result cannot support a definite direction (audit V3R2-C1).
    else if (linked.valid !== true) bindReason = 'evidence not valid (runner could not produce a usable measurement)';
    else if (linked.completed !== true) bindReason = 'evidence not completed';
    // the claim's family must be INDEPENDENTLY corroborated by the oracle from raw collector facts —
    // a runner cannot self-assert applicability the collector's structure does not support (Rule 15).
    else if (!oracleCorroborates(target, family)) bindReason = `applicability not independently corroborated: the oracle does not derive family "${family}" for ${target} from raw collector facts (Rule 15)`;
    // CHANNEL AGREEMENT (Rule 15 faithful): when an independent applicability OBSERVATION is present,
    // the runner's applicability flags must agree with it — a separate observer re-derived the
    // structural preconditions; disagreement ⇒ INCONCLUSIVE (the runner's self-asserted applicability
    // is not corroborated by an independent measurement).
    else if (bundle.applicability != null && !observer.agreesWith(bundle.applicability, target, linked.applicabilityEvidence).ok) bindReason = `independent applicability observer disagrees on ${target}: ${observer.agreesWith(bundle.applicability, target, linked.applicabilityEvidence).disagreements.join('; ')} (Rule 15)`;
    else ev = linked;

    const out = bindReason
      ? V.partial(`evidence not bound: ${bindReason}`, { claimId: p.claimId, sc: p.sc, direction: p.direction })
      : resolveClaim({ ...p, claimFamily: family }, ev);
    out._target = target;
    out._family = family;
    out._sc = p.sc;

    if (!out.authoritative) { partials.push(out); continue; }

    // (4) AUTHORITY promotion (audit V3-C2): publish authoritative ONLY when promoted AND the
    //     complete reconciled bundle is present (audit V3R2-C1/H6) AND the evidence LINEAGE is
    //     verified — the bound result must carry a valid attestation from a key-holding catalog
    //     runner, and the promotion's provenance artifacts must verify (audit V3R3-C1). Each of
    //     these is checked ONLY at the publish boundary, so default-shadow behaviour is unchanged:
    //     a gate-passing-but-unattested observation is still RECORDED as shadow, never authoritative.
    const a = auth.authorityFor(p.experimentId, p.direction, authorityReg);
    const raw = rawByClaim[p.claimId];
    // lineage: a valid MAC from a key-holder, the signed identity matches THIS bundle (replay defence),
    // AND the attestation names the cited catalog runner at the approved build (audit V3R4-M1). The
    // page identity is the runner's INDEPENDENT observation, checked against collect (audit V3R4-C1).
    const runnerIdentityOk = !!raw && !!raw.attestation
      && raw.attestation.runner === p.experimentId
      && raw.attestation.runnerVersion === cat.CATALOG.catalogVersion;
    const lineageVerified = !!trust.key
      && attest.verifyResult(raw, trust.key)
      && attest.boundToRun(raw, bundle.collect)
      && runnerIdentityOk;
    // FAIL-CLOSED: a promoted direction needs a configured artifact verifier AND every provenance ref
    // must verify — the programmatic builder boundary cannot default-true when no verifier is supplied
    // (audit V3R4-H4).
    const provenanceVerified = !!trust.artifactVerifier
      && auth.provenanceArtifactsVerified(p.experimentId, p.direction, authorityReg, trust.artifactVerifier);
    if (a.mayPublish && bundleComplete && manifestVerified && lineageVerified && provenanceVerified) { out._authState = a.state; claims.push(out); continue; }
    const reason = !a.mayPublish ? a.reason
      : !bundleComplete ? 'incomplete bundle (no plan/candidates/drive) — cannot publish authoritative'
        : !manifestVerified ? 'run-manifest absent or unverified (no attested manifest binding the artifact hashes + page identity) — cannot publish authoritative (audit V3R4-H7)'
          : !lineageVerified ? 'evidence lineage unverified (no valid attestation binding the cited runner + observed page identity) — cannot publish authoritative (audit V3R3-C1/V3R4-C1/M1)'
            : 'promotion provenance artifacts unverified (no verifier configured, or a ref failed on disk) — cannot publish authoritative (audit V3R4-H4)';
    shadowObs.push({
      claimId: p.claimId, sc: p.sc, claimFamily: family,
      wouldBe: { observationOutcome: out.observationOutcome, wcagApplicability: out.wcagApplicability },
      observationScope: out.observationScope,
      authorityState: a.state, reason,
      recommendation: 'shadow-only: validate against gold + sealed set before promotion',
    });
  }

  // (5) INDEPENDENT obligation reconciliation: enumerate from the COLLECTOR (atomic per family);
  //     every obligation gets exactly one disposition. Authoritative CLAIMs clear; shadow
  //     observations and unsupported proposals are PARTIAL (shadow flagged); un-proposed ⇒ auto.
  //     DYNAMIC subjects discovered by an experiment's action are expanded into provisional
  //     obligations with the SAME family/oracle derivation and reconciled too (plan Rule 13) — a
  //     malformed/forged-fingerprint discovery fails closed.
  const staticObligations = obl.enumerateObligations(bundle.collect);
  const dyn = dynamic.expandDiscovered(bundle.experiments);
  if (dyn.errors.length) { for (const m of dyn.errors) E(`dynamic-subject: ${m}`); return { ok: false, errors, results: null }; }
  const dynById = new Set(staticObligations.map((o) => o.obligationId));
  const dynamicObligations = dyn.obligations.filter((o) => !dynById.has(o.obligationId)); // a discovered subject that is already a static obligation isn't double-counted
  const obligations = [...staticObligations, ...dynamicObligations];
  const dispositions = [];
  for (const c of claims) dispositions.push({
    obligationId: oracle.oblId(c._target, c._sc, c._family), kind: 'CLAIM',
    cleared: c.observationOutcome === 'NO_BARRIER_OBSERVED' || c.wcagApplicability === 'INAPPLICABLE',
  });
  for (const p of partials) dispositions.push({ obligationId: oracle.oblId(p._target, p._sc, p._family), kind: 'PARTIAL', cleared: false });
  for (const s of shadowObs) dispositions.push({ obligationId: oracle.oblId(s.observationScope && s.observationScope.actionTargetRef, s.sc, s.claimFamily), kind: 'PARTIAL', cleared: false, shadow: true });

  const { errors: recErrors, ledger } = obl.reconcile(obligations, dispositions);
  for (const m of recErrors) E(`obligation: ${m}`);
  if (errors.length) return { ok: false, errors, results: null };
  const aggregates = obl.aggregateElementSkill(ledger);
  // explicit coverage boundary: elements with a surface no Phase-0 family covers (audit R1-F5).
  const outOfScope = oracle.outOfScopeElements(bundle.collect);

  // SEMANTIC JUDGMENTS (plan Phase 3 / Rule 6): bind + classify any judgments. They are NON-DEFINITE
  // adjudication recommendations — NEVER authoritative until a rubric is calibrated (none ship), so
  // they cannot clear/barrier an obligation; they enter the output as an adjudication queue only.
  const jres = judgments.processJudgments(bundle.judgments, opts.rubrics);
  if (jres.errors.length) { for (const m of jres.errors) E(`judgments: ${m}`); return { ok: false, errors, results: null }; }

  // (6) emit v3-only results; refuse if a legacy label somehow survived
  const stripClaim = (c) => { const { _target, _family, _sc, _authState, disposition, authoritative, ...rest } = c; return rest; };
  const stripPartial = (p) => { const { _target, _family, _sc, authoritative, ...rest } = p; return rest; };
  const results = {
    file: bundle.collect && bundle.collect.file,
    runId: bundle.collect && bundle.collect.runId,
    pageDigest: bundle.collect && bundle.collect.pageDigest,
    catalogVersion: cat.CATALOG.catalogVersion,
    conformanceOutcome: V.CONFORMANCE,
    claims: claims.map(stripClaim),
    partials: partials.map(stripPartial),
    shadowObservations: shadowObs,
    obligationLedger: ledger,
    elementSkillSummaries: aggregates,
    outOfScope,
    dynamicSubjects: dyn.subjects, // post-action discoveries, expanded + reconciled (Rule 13)
    adjudicationRecommendations: jres.recommendations, // non-definite semantic judgments (Phase 3)
    summary: {
      obligations: obligations.length,
      proposals: proposals.length,
      authoritative: claims.length,
      shadow: shadowObs.length,
      partial: ledger.filter((r) => r.disposition === 'PARTIAL').length,
      autoPartial: ledger.filter((r) => r.autoPartial).length,
      barriersObserved: claims.filter((c) => c.observationOutcome === 'BARRIER_OBSERVED').length,
      cleared: claims.filter((c) => c.observationOutcome === 'NO_BARRIER_OBSERVED' || c.wcagApplicability === 'INAPPLICABLE').length,
      outOfScopeElements: outOfScope.length,
      dynamicSubjects: dyn.subjects.length,
      adjudicationRecommendations: jres.recommendations.length,
    },
  };
  // The v3 OUTPUT is entirely harness-authored (no page content), so scan it STRICTLY: any legacy
  // token anywhere — any key OR any value — refuses publication (audit R1-F2). This is stricter
  // than the bundle scan (which must tolerate page content) precisely because the output may not.
  const legacy = xa.findLegacyLabelStrict(results, 'results');
  if (legacy) { E(`refusing to publish: legacy label in v3 output: ${legacy}`); return { ok: false, errors, results: null }; }

  return { ok: true, errors: [], results };
}

module.exports = { buildV3 };
