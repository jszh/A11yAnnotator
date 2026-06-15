// Harness 3.0 — atomic claim resolution / directional support binding (plan 3.0-E, Rules 4/11/12/14/15).
//
// resolveClaim() takes a claim PROPOSAL plus the evidence for it and returns either an
// authoritative v3 claim or a PARTIAL disposition. Every gate is positive-and-directional and
// fails closed: clearability (Rule 11, whitelist), independent applicability (Rule 15), the
// catalog's directional support predicate (Rule 4), keyboard reachability for keyboard-SC clears
// (Rule 14), the completeness predicate over the MEASURED outcome (Rule 11), an accessibility-
// support baseline when AT-dependent (Rule 12), and a complete observation scope (Rule 18).
'use strict';

const V = require('./v3-schema.js');
const reg = require('./registry.js');
const cat = require('./catalog.js');
const comp = require('./completeness.js');

const SCOPE_FIELDS = ['actionTargetRef', 'state', 'action', 'environment'];
const presentStr = (v) => typeof v === 'string' && v.trim() !== '';

// proposal: { claimId, sc, direction, experimentId, supportRefs[], observationScope{...} }
// evidence: { experimentOutcome{}, applicabilityEvidence{}, atBaseline? }
function resolveClaim(proposal, evidence, deps = {}) {
  const registry = deps.registry || reg.REGISTRY;
  const catalog = deps.catalog || cat.CATALOG;
  const P = (reason, extra) => V.partial(reason, { claimId: proposal && proposal.claimId, sc: proposal && proposal.sc, direction: proposal && proposal.direction, ...extra });

  if (!proposal || typeof proposal !== 'object') return P('no proposal');
  const { sc, direction, experimentId } = proposal;
  if (!V.ALL_SCS.includes(sc)) return P(`unknown SC ${JSON.stringify(sc)}`);
  if (!V.DIRECTIONS.includes(direction)) return P(`non-assertable direction ${JSON.stringify(direction)} (INCONCLUSIVE/UNKNOWN ⇒ PARTIAL)`);

  // (0) EXPERIMENT BINDING (audit V3-C1/V3-C5): the cited experiment must exist and must measure
  //     EXACTLY the proposed SC and claim-family. An experiment cannot lend its evidence to a
  //     different SC/assertion than the one it was built and validated for.
  const expEntry = catalog.experiments[experimentId];
  if (!expEntry) return P(`unknown experiment ${JSON.stringify(experimentId)} (cannot bind evidence)`);
  if (expEntry.sc !== sc) return P(`cross-SC binding refused: experiment ${experimentId} measures SC ${expEntry.sc}, not proposed SC ${sc}`);
  if (proposal.claimFamily && expEntry.claimFamily && proposal.claimFamily !== expEntry.claimFamily)
    return P(`cross-family binding refused: experiment ${experimentId} measures ${expEntry.claimFamily}, not ${proposal.claimFamily}`);

  const outcome = (evidence && typeof evidence.experimentOutcome === 'object' && evidence.experimentOutcome) || {};
  const appEv = (evidence && typeof evidence.applicabilityEvidence === 'object' && evidence.applicabilityEvidence) || {};

  // (1) clearability — default-closed, fail-closed for clearing directions
  const cl = reg.clearabilityFor(sc, direction, registry);
  if (!cl.allowed) return P(`clearability refused: ${cl.reason}`);

  // (2) independent applicability (Rule 15) — null-safe / fail-closed inside applicabilityHolds
  const app = cat.applicabilityHolds(experimentId, appEv, catalog);
  if (!app.holds) return P(`applicability not independently established: missing ${app.missing.join(', ')}`);

  const reqs = (expEntry.supports[direction] && expEntry.supports[direction].requires) || [];

  // (3) keyboard reachability precondition for keyboard-interaction-SC CLEARS (Rule 14) — an
  //     independent precondition, checked BEFORE support so it is never masked. Fires for any
  //     keyboard-interaction SC, or any direction whose support predicate names reachability.
  const needsReach = V.isKeyboardInteractionSc(sc) || reqs.includes('keyboardReachableInState');
  if (V.isClearing(direction) && needsReach && outcome.keyboardReachableInState !== true)
    return P(`keyboard-interaction-SC clear requires demonstrated keyboard reachability (Rule 14)`);

  // (4) catalog directional support predicate over the TYPED outcome (Rule 4)
  const sup = cat.supportsDirection(experimentId, direction, outcome, catalog);
  if (!sup.supported) return P(`directional support not satisfied for ${experimentId}/${direction}: missing ${sup.missing.join(', ')}`);

  // (5) completeness for clearing directions (Rule 11) — sound obligation SET, all measured
  if (V.isClearing(direction)) {
    const r = comp.resolveCompleteness(cl.entry && cl.entry.completeness, outcome);
    if (!r.complete) return P(`completeness not proven: missing ${r.missing.join(', ')}`);
  }

  // (6) accessibility-support baseline when this direction is AT-dependent (Rule 12)
  const atDep = (expEntry && expEntry.accessibilitySupportDependent && expEntry.accessibilitySupportDependent[direction] === true)
    || (cl.entry && cl.entry.accessibilitySupportDependent === true);
  if (atDep && !(evidence && evidence.atBaseline))
    return P(`accessibility-support-dependent clear requires a declared AT baseline (Rule 12)`);

  // (7) observation scope must travel with every authoritative claim, with real values (Rule 18).
  //     Reconstruct it from ONLY the known fields so nothing extra (e.g. a smuggled legacy token
  //     under a stray key) can ride into the published claim (audit R1-F2).
  const rawScope = proposal.observationScope;
  if (!rawScope || SCOPE_FIELDS.some((f) => !presentStr(rawScope[f])))
    return P(`authoritative claim requires a complete observationScope (non-empty strings) {${SCOPE_FIELDS.join(', ')}}`);
  const scope = {}; for (const f of SCOPE_FIELDS) scope[f] = rawScope[f];

  const observationOutcome = direction === 'INAPPLICABLE' ? 'INCONCLUSIVE' : direction;
  const wcagApplicability = direction === 'INAPPLICABLE' ? 'INAPPLICABLE' : 'APPLICABLE';
  const scopeCompletenessRef = (cl.entry && cl.entry.completeness)
    ? `catalog:${sc}/${direction}/${cl.entry.completeness.resolver}`
    : `registry:${sc}/${direction}/${(cl.entry && cl.entry.clearability) || 'barrier-observed'}`;

  // supportRefs are DERIVED from the bound experiment, never trusted from the proposal (audit
  // "support references published without validating that they exist or match the claim").
  return V.claim({
    claimId: proposal.claimId,
    sc,
    claimFamily: expEntry.claimFamily || proposal.claimFamily || null,
    observationOutcome,
    wcagApplicability,
    observationScope: scope,
    scopeCompletenessRef,
    supportRefs: [`experiment:${experimentId}`],
  });
}

module.exports = { resolveClaim };
