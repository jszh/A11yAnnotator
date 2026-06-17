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
const llmAdj = require('./llm-adjudicator.js');
const metrics = require('./metrics.js');
const { resolveClaim } = require('./claims.js');
const A = require('../../lib/a11y-eval.js'); // F (Harness 3.3): reuse the target-size geometry verbatim

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
    // page-level page-title pseudo-element (3.2 ○-tier) — parity with reflow so a future deterministic
    // 2.4.2 runner can bind evidence (today the lane is LLM-provisional only).
    if (xpath === oracle.PAGE_TITLE_XPATH) return fam === 'page-title' && oracle.pageTitleSlotPresent(bundle.collect);
    if (xpath === oracle.PAGE_INFOREL_XPATH) return fam === 'info-relationships' && !!(bundle.collect && bundle.collect.structure);
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
    // MANDATORY INDEPENDENT APPLICABILITY (Rule 15; audit V3R5-C2): an authoritative claim requires a
    // present applicability stage. Rule 15 is "applicability cannot self-attest" — without an
    // independent observer artifact there is no second channel at all, so the claim cannot publish
    // authoritative (it is recorded as shadow). When the stage IS present, the per-target observer
    // AGREEMENT was already enforced at bind time above (a missing/disagreeing observation makes the
    // claim PARTIAL before it ever reaches here), so presence here ⇒ corroborated.
    const applicabilityPresent = bundle.applicability != null;
    if (a.mayPublish && bundleComplete && manifestVerified && lineageVerified && provenanceVerified && applicabilityPresent) { out._authState = a.state; claims.push(out); continue; }
    const reason = !a.mayPublish ? a.reason
      : !bundleComplete ? 'incomplete bundle (no plan/candidates/drive) — cannot publish authoritative'
        : !manifestVerified ? 'run-manifest absent or unverified (no attested manifest binding the artifact hashes + page identity) — cannot publish authoritative (audit V3R4-H7)'
          : !lineageVerified ? 'evidence lineage unverified (no valid attestation binding the cited runner + observed page identity) — cannot publish authoritative (audit V3R3-C1/V3R4-C1/M1)'
            : !provenanceVerified ? 'promotion provenance artifacts unverified (no verifier configured, or a ref failed on disk) — cannot publish authoritative (audit V3R4-H4)'
              : 'no independent applicability stage in the bundle (Rule 15: applicability cannot self-attest) — cannot publish authoritative (audit V3R5-C2)';
    shadowObs.push({
      claimId: p.claimId, sc: p.sc, claimFamily: family,
      // EVIDENCE SOURCE (3.1 §2): a deterministic runner's gate-passing-but-unpromoted observation.
      // Tagged so scoreClears/scoreBarriers can score it APART from the LLM lane (per-mechanism).
      source: 'deterministic', mechanism: p.experimentId,
      wouldBe: { observationOutcome: out.observationOutcome, wcagApplicability: out.wcagApplicability },
      observationScope: out.observationScope,
      authorityState: a.state, reason,
      recommendation: 'shadow-only: validate against gold + sealed set before promotion',
    });
  }

  // THE LLM EVIDENCE LANE (Harness 3.1 §2/§3) — the fourth evidence source, bound + verdict-mapped into
  // `source:'llm'` SHADOW observations (the whole-obligation agent `llm-agent` from bundle.llm; each
  // atomic rubric `llm-rubric:<id>` from bundle.judgments). They ride results.shadowObservations for
  // per-mechanism gold scoring. Processed BEFORE reconciliation now, because in 3.2 a calibrated/ungated
  // subset also FILLS its auto-PARTIAL obligation as a PROVISIONAL ledger row (§5b below).
  const lres = llmAdj.processLlm(bundle.llm);
  if (lres.errors.length) { for (const m of lres.errors) E(`llm: ${m}`); return { ok: false, errors, results: null }; }
  const jres = judgments.processJudgments(bundle.judgments);
  if (jres.errors.length) { for (const m of jres.errors) E(`judgments: ${m}`); return { ok: false, errors, results: null }; }
  const stampAuthority = (o) => {
    const a = auth.authorityFor(o.mechanism, o.wouldBe.observationOutcome, authorityReg);
    return { ...o, authorityState: a.state, mayPublish: false }; // an llm obs never publishes — annotation only
  };
  const annotationObs = [...lres.shadowObservations, ...jres.shadowObservations].map(stampAuthority);

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

  // (5b) PROVISIONAL FILL (Harness 3.2): a calibrated/ungated LLM verdict FILLS an obligation the
  //      deterministic lane left at auto-PARTIAL. We emit a PROVISIONAL disposition ONLY for an
  //      ENUMERATED obligation with NO deterministic disposition (so reconcile never sees a collision
  //      and a CLAIM/PARTIAL is never overridden); reconcile merges multiple by barrier-dominates-clear.
  //      `provisionalMode:'ungated'` (research DEFAULT): fill for any non-abstaining obs, bypass the
  //      registry, calibrated:false, with the per-mechanism gold numbers ATTACHED (measurement, not gate)
  //      when gold is supplied. `'gated'` (production): fill only when the mechanism mayProvision at
  //      canary AND its metrics gate passes (strict for a clear; ≤threshold+coverage for a barrier).
  const provisionalMode = opts.provisionalMode === 'gated' ? 'gated' : 'ungated';
  const gold = Array.isArray(opts.gold) ? opts.gold : null;
  const scoringView = { claims, shadowObservations: [...shadowObs, ...annotationObs] };
  const scoreCache = Object.create(null);
  const scoreMech = (mech) => { if (!Object.prototype.hasOwnProperty.call(scoreCache, mech)) scoreCache[mech] = metrics.scoreMechanism(scoringView, gold || [], mech, opts.provisionOpts || {}); return scoreCache[mech]; };
  const obsByObl = Object.create(null);
  for (const o of annotationObs) {
    const oid = oracle.oblId(o.observationScope && o.observationScope.actionTargetRef, o.sc, o.claimFamily);
    (obsByObl[oid] = obsByObl[oid] || []).push(o);
  }
  const deterministicIds = new Set(dispositions.map((d) => d.obligationId));
  for (const o of obligations) {
    if (deterministicIds.has(o.obligationId)) continue; // a CLAIM/PARTIAL already owns it — never overridden
    const obs = Object.prototype.hasOwnProperty.call(obsByObl, o.obligationId) ? obsByObl[o.obligationId] : null;
    if (!obs) continue;
    for (const ob of obs) {
      const outcome = ob.wouldBe && ob.wouldBe.observationOutcome;
      if (outcome !== 'BARRIER_OBSERVED' && outcome !== 'NO_BARRIER_OBSERVED') continue; // INCONCLUSIVE abstention ⇒ no row
      const mech = ob.mechanism;
      const sm = gold ? scoreMech(mech) : null;
      const calibration = sm ? { falseClearRate: sm.clears.falseClearanceRate, falseBarrierRate: sm.barriers.falseBarrierRate, coverage: sm.coverage.coverage, labelledClears: sm.clears.labelledClears, labelledBarriers: sm.barriers.labelledBarriers } : null;
      let calibrated = false;
      if (provisionalMode === 'gated') {
        // GATED gate = the STANDING canary (audit D-GATE-3). The 149-bound / sealed-eval / gold-blinding
        // are a per-MECHANISM property EARNED OFFLINE over the WHOLE gold set and attested in the registry
        // (`goldSized` + provenance, enforced by provisionFor + validateAuthority) — NOT re-derived from
        // ONE page's observations (which can never reach 149 per-run and would double-gate goldSized). The
        // per-page metrics `sm` ride along as MEASUREMENT only (the `calibration` block above); the offline
        // calibrator uses metrics.provisionEligibility over the corpus gold to DECIDE the canary promotion.
        if (!auth.provisionFor(mech, outcome, authorityReg).mayProvision) continue;
        calibrated = true;
      }
      dispositions.push({
        obligationId: o.obligationId, kind: 'PROVISIONAL', outcome,
        provisional: V.provisional({ source: ob.source, mechanism: mech, mode: provisionalMode, calibrated, outcome, confidence: ob.confidence, rationaleRef: ob.rationaleRef, evidenceRefs: ob.evidenceRefs, calibration }),
      });
    }
  }

  const { errors: recErrors, ledger } = obl.reconcile(obligations, dispositions);
  for (const m of recErrors) E(`obligation: ${m}`);
  if (errors.length) return { ok: false, errors, results: null };
  const aggregates = obl.aggregateElementSkill(ledger);
  // explicit coverage boundary: elements with a surface no Phase-0 family covers (audit R1-F5).
  const outOfScope = oracle.outOfScopeElements(bundle.collect);

  // ADJUDICATION RECOMMENDATIONS — DERIVED view over the `source:'llm'` shadow obs (3.1 unify M1): one
  // review queue. STRUCTURED-ONLY (the v3 outcome + the rationale REFERENCE, never the raw verdict). A
  // mechanism that FILLED a PROVISIONAL row for its obligation reports `promotedTo:'PROVISIONAL'`.
  const provisionalRowByObl = Object.create(null);
  for (const r of ledger) if (r.disposition === 'PROVISIONAL') provisionalRowByObl[r.obligationId] = r;
  const adjudicationRecommendations = annotationObs.map((o) => {
    const oid = oracle.oblId(o.observationScope && o.observationScope.actionTargetRef, o.sc, o.claimFamily);
    const provRow = provisionalRowByObl[oid];
    // promotedTo is true ONLY when THIS obs is on the WINNING side of the fill (its outcome equals the
    // row's outcome) AND its mechanism contributed — so an ABSTAINING (INCONCLUSIVE) obs, or a clear that
    // a dominating barrier blocked, never falsely reads `promotedTo:'PROVISIONAL'` (audit D7-4).
    const promotedTo = (provRow && provRow.provisional
      && o.wouldBe.observationOutcome === provRow.provisional.outcome
      && (provRow.provisional.supportRefs || []).includes(o.mechanism)) ? 'PROVISIONAL' : null;
    return {
      sc: o.sc, claimFamily: o.claimFamily, targetXpath: o.observationScope && o.observationScope.actionTargetRef,
      observationScope: o.observationScope, source: o.source, mechanism: o.mechanism,
      wouldBeOutcome: o.wouldBe.observationOutcome, confidence: o.confidence,
      status: 'adjudication-recommendation', authoritative: false,
      eligibleForAuthority: o.authorityState !== 'shadow', // calibrated past default-shadow (still never authoritative)
      promotedTo, // 'PROVISIONAL' when this mechanism filled the obligation's ledger row (else null)
      rationaleRef: o.rationaleRef,
    };
  });

  // INSTRUMENT FINDINGS (VSR + keyboard instruments): page-level accessibility signals (reading order
  // 1.3.2, name/role/value 4.1.2, focus order 2.4.3, keyboard/SR traps 2.1.2). Like judgments they are
  // NON-AUTHORITATIVE — recorded for offline scoring against the hand-labeled ground truth, never
  // clearing/barriering an obligation or publishing authoritative until calibrated. Normalised inline so
  // the pure builder gains no browser dependency (the runner lives in run-instruments.js).
  const instrumentFindings = [];
  if (bundle.instruments != null) {
    const inst = bundle.instruments;
    if (typeof inst !== 'object' || inst === null || !Array.isArray(inst.findings)) { E('instruments: must be an object with a findings[] array'); return { ok: false, errors, results: null }; }
    for (const f of inst.findings) {
      if (typeof f !== 'object' || f === null) { E('instruments: each finding must be an object'); return { ok: false, errors, results: null }; }
      const row = { detector: String(f.detector || 'instrument'), sc: String(f.sc || ''), kind: String(f.kind || ''), xpath: f.xpath || null, detail: String(f.detail || ''), review: !!f.review, authoritative: false, shadow: true };
      if (f.calibrated === false) row.calibrated = false; // A5: order findings are explicitly UNCALIBRATED triage
      instrumentFindings.push(row);
    }
  }

  // CHECKER FINDINGS (Harness 3.3, C0/C1): external-checker cross-signals — axe surfaced from the
  // collector's own run (C0) and, later, a live engine like IBM (C1). Like instrument findings they are
  // NON-AUTHORITATIVE and NEVER an obligation disposition (so reconcile() sees no second decision and
  // emits no tie-break — HARNESS-3.3-IMPLEMENTATION.md §2). Structured only (no page-content prose), so
  // the strict legacy scanner below cannot trip. `source` distinguishes axe from a live checker.
  const checkerFindings = [];
  if (bundle.checkerFindings != null) {
    const chk = bundle.checkerFindings;
    if (typeof chk !== 'object' || chk === null || !Array.isArray(chk.findings)) { E('checkerFindings: must be an object with a findings[] array'); return { ok: false, errors, results: null }; }
    for (const f of chk.findings) {
      if (typeof f !== 'object' || f === null) { E('checkerFindings: each finding must be an object'); return { ok: false, errors, results: null }; }
      checkerFindings.push({ source: String(f.source || 'checker'), detector: String(f.detector || f.ruleId || 'checker'), ruleId: f.ruleId != null ? String(f.ruleId) : null, sc: String(f.sc || ''), impact: f.impact != null ? String(f.impact) : '', kind: String(f.kind || 'violation'), xpath: f.xpath != null ? String(f.xpath) : null, review: !!f.review, authoritative: false, shadow: true });
    }
  }

  // DETERMINISTIC SIGNALS (Harness 3.3 F): closed-sub-domain facts that reduce LLM load, derived PURELY
  // from the collector's element facts (box / text / axName) — no browser pass. SHADOW only (Decision B):
  // they never clear or barrier an obligation; promotion is a post-corpus decision once their precision on
  // this corpus is known. 2.5.8 target-size geometry decides geometry pass/fail (transform/clip/rounded/
  // no-neighbour cases stay 'needs-judgment' ⇒ deferred to LLM/human). 2.5.3 label-in-name emits a hard
  // signal when a reliable visible label is not contained in the reliable accessible name — an INDEPENDENT
  // cross-signal that agrees-or-not with IBM's 2.5.3 (C1) under the same (sc, xpath) key.
  const normTxt = (s) => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase();
  // AX-NAME-PRESENCE (coverage analysis B): a NAME-REQUIRING role that IS exposed in the AX tree
  // (`inTree:true`) but whose CDP-computed accessible name is EMPTY is a name-presence barrier. The CDP
  // role strings are exact (verified): <img>→'image', <summary>→'DisclosureTriangle', <select>→'combobox'.
  // This is an INDEPENDENT cross-signal to axe's now-surfaced name family (image-alt/button-name/label/
  // summary-name…) under the same (sc, xpath) key — it agrees-or-not, same pattern as 2.5.3↔IBM. SOUND:
  // fires ONLY on an empty-STRING axName for an in-tree name-requiring role, so a decorative img
  // (role=presentation ⇒ ignored ⇒ NOT in tree) and any correctly-named control never trip; null axName
  // (CDP did not resolve a name) is skipped as uncertain. Iframe/object never reach here (not sampled).
  // `option` is deliberately EXCLUDED — an empty <option> (placeholder / spacer / reset) is a routine,
  // non-barrier pattern that axe itself has no per-option name rule for; flagging it would be noise.
  const NAME_REQ_SC = { image: '1.1.1', button: '4.1.2', link: '4.1.2', checkbox: '4.1.2', radio: '4.1.2', switch: '4.1.2', tab: '4.1.2', menuitem: '4.1.2', menuitemcheckbox: '4.1.2', menuitemradio: '4.1.2', textbox: '4.1.2', combobox: '4.1.2', listbox: '4.1.2', searchbox: '4.1.2', spinbutton: '4.1.2', slider: '4.1.2', DisclosureTriangle: '4.1.2', heading: '1.3.1' };
  const deterministicSignals = [];
  for (const el of (bundle.collect && bundle.collect.elements) || []) {
    if (!el || typeof el !== 'object') continue;
    if (el.box && typeof el.box === 'object' && el.focusable === true) {
      const ts = A.evalTargetSize(el.box, el.targetOpts || {});
      if (ts && (ts.verdict === 'pass' || ts.verdict === 'fail')) {
        deterministicSignals.push({ source: 'deterministic', detector: 'target-size-geometry', sc: '2.5.8', xpath: el.xpath || null, kind: ts.verdict === 'pass' ? 'geometry-pass' : 'geometry-fail', detail: String(ts.reason || ''), authoritative: false, shadow: true });
      }
    }
    if (typeof el.text === 'string' && typeof el.axName === 'string' && el.focusable === true) {
      const visible = normTxt(el.text), name = normTxt(el.axName);
      if (visible && name && !name.includes(visible)) {
        deterministicSignals.push({ source: 'deterministic', detector: 'label-in-name', sc: '2.5.3', xpath: el.xpath || null, kind: 'label-not-in-name', detail: `visible label ${JSON.stringify(el.text.slice(0, 40))} not contained in accessible name ${JSON.stringify(el.axName.slice(0, 40))}`, authoritative: false, shadow: true });
      }
    }
    const reqSc = typeof el.axRole === 'string' ? NAME_REQ_SC[el.axRole] : undefined;
    if (reqSc && el.inTree === true && typeof el.axName === 'string' && el.axName.trim() === '') {
      deterministicSignals.push({ source: 'deterministic', detector: 'ax-name-presence', sc: reqSc, xpath: el.xpath || null, kind: 'empty-accessible-name', detail: `${el.axRole} is exposed in the accessibility tree but its accessible name is empty`, authoritative: false, shadow: true });
    }
  }
  // (No page-title deterministic signal: an empty/whitespace <title> is already surfaced by axe
  // `document-title` under 2.4.2, on the same shadow tier and the same predicate — a separate
  // deterministic signal would be pure duplication that can never disagree, not an independent
  // cross-signal. The axe checkerFinding is the canonical 2.4.2-presence source.)

  // TRIAGE CANDIDATES (Harness 3.3 E): a consolidated, NON-LEDGER review queue for semantic SCs that get
  // NO obligation disposition in 3.3 — 1.4.1 Use of Color + 1.3.3 Sensory Characteristics (fed by IBM
  // review priors once C1 lands) and instrument adjudication for 1.3.2 / 2.4.3 / 4.1.3. DERIVED from the
  // already-identity-gated instrument + checker signals, so it carries no new stale-artifact risk. One
  // candidate per (xpath, SC) UNIONS every non-authoritative signal on it with an `agreement` count (plan
  // §2: union evidence, never adjudicate to a verdict). These are review packets, NOT PROVISIONAL ledger
  // rows — the project has no sound enumeration story for these families yet, so they never clear/barrier.
  const TRIAGE_SCS = new Set(['1.4.1', '1.3.3', '1.3.2', '2.4.3', '4.1.3']);
  const triageMap = new Map();
  for (const f of [...instrumentFindings, ...checkerFindings]) {
    if (!TRIAGE_SCS.has(f.sc)) continue;
    const key = `${f.sc}::${f.xpath || '(page)'}`;
    if (!triageMap.has(key)) triageMap.set(key, { sc: f.sc, xpath: f.xpath || null, signals: [], review: true, authoritative: false });
    triageMap.get(key).signals.push({ source: f.source || 'instrument', detector: f.detector, kind: f.kind, detail: f.detail || (f.ruleId ? String(f.ruleId) : '') });
  }
  const triageCandidates = [...triageMap.values()].map((c) => ({ ...c, agreement: c.signals.length }));

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
    // deterministic gate-passing shadows FIRST (lineage/fifth-pass tests key on [0]), then the
    // non-disposition LLM annotations — one array for per-mechanism gold scoring (metrics.js).
    shadowObservations: [...shadowObs, ...annotationObs],
    obligationLedger: ledger,
    elementSkillSummaries: aggregates,
    outOfScope,
    dynamicSubjects: dyn.subjects, // post-action discoveries, expanded + reconciled (Rule 13)
    adjudicationRecommendations, // DERIVED view over the un-promoted source:'llm' shadow obs (3.1 unify)
    instrumentFindings, // non-authoritative VSR/keyboard instrument signals (shadow until gold-calibrated)
    checkerFindings, // non-authoritative external-checker cross-signals (axe C0 / IBM C1) — never a disposition
    triageCandidates, // non-ledger review queue for semantic SCs (1.4.1/1.3.3 + 1.3.2/2.4.3/4.1.3) — review packets, not dispositions
    deterministicSignals, // F: shadow 2.5.8 geometry + 2.5.3 label-in-name facts (closed sub-domains; reduce LLM load)
    summary: {
      obligations: obligations.length,
      proposals: proposals.length,
      authoritative: claims.length,
      shadow: shadowObs.length, // deterministic gate-passing shadows ONLY (unchanged meaning)
      llmShadowObservations: annotationObs.length, // the fourth-source annotations (3.1)
      partial: ledger.filter((r) => r.disposition === 'PARTIAL').length,
      autoPartial: ledger.filter((r) => r.autoPartial).length,
      // PROVISIONAL counts (Harness 3.2) — NON-authoritative. The authoritative `cleared`/`barriersObserved`
      // below stay DETERMINISTIC-only (unchanged meaning); these are the calibrated/ungated LLM fills.
      provisionalCleared: ledger.filter((r) => r.disposition === 'PROVISIONAL' && r.cleared).length,
      provisionalBarrier: ledger.filter((r) => r.disposition === 'PROVISIONAL' && !r.cleared).length,
      provisionalByMechanism: ledger.reduce((m, r) => { if (r.disposition === 'PROVISIONAL') { const k = (r.provisional && r.provisional.mechanism) || 'unknown'; m[k] = (m[k] || 0) + 1; } return m; }, Object.create(null)), // null-proto: a mechanism id is DATA (audit R2-L1 parity)
      barriersObserved: claims.filter((c) => c.observationOutcome === 'BARRIER_OBSERVED').length,
      cleared: claims.filter((c) => c.observationOutcome === 'NO_BARRIER_OBSERVED' || c.wcagApplicability === 'INAPPLICABLE').length,
      outOfScopeElements: outOfScope.length,
      dynamicSubjects: dyn.subjects.length,
      adjudicationRecommendations: adjudicationRecommendations.length,
      instrumentFindings: instrumentFindings.length,
      checkerFindings: checkerFindings.length, // external-checker cross-signal count (axe C0 / IBM C1)
      checkerFindingsBySc: checkerFindings.reduce((m, f) => { const k = f.sc || 'unknown'; m[k] = (m[k] || 0) + 1; return m; }, Object.create(null)), // per-SC, for the §G annotation sampling
      triageCandidates: triageCandidates.length, // non-ledger semantic review candidates (E)
      deterministicSignals: deterministicSignals.length, // F: shadow 2.5.8 geometry + 2.5.3 label-in-name facts
      deterministicSignalsBySc: deterministicSignals.reduce((m, s) => { m[s.sc] = (m[s.sc] || 0) + 1; return m; }, Object.create(null)),
      // EVIDENCE MODE (Harness 3.3, B): which non-authoritative lanes contributed, visible without reading
      // logs. provisionalMode is the build option; the rest are derived from which artifacts the bundle
      // carries (so the run summary records exactly what produced its evidence). Authoritative output is
      // unaffected — these lanes never publish a CLAIM.
      evidenceMode: {
        provisionalMode: opts.provisionalMode === 'gated' ? 'gated' : 'ungated',
        runLlm: !!(bundle.llm || bundle.judgments),
        runInstruments: !!bundle.instruments,
        checkers: [...new Set(checkerFindings.map((f) => f.source))].sort(), // 'axe' (C0) and/or 'checker' (IBM, C1)
        // C1: surface that an opt-in IBM run was requested but could not contribute (package/CDN absent), so
        // a skipped external checker is visible in the summary rather than indistinguishable from "ran clean".
        ...(bundle.checkerFindings && bundle.checkerFindings.checkerUnavailable ? { checkerUnavailable: String(bundle.checkerFindings.checkerUnavailable) } : {}),
      },
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
