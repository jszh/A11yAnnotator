// Harness 3.0 — completeness resolvers (plan Rule 11: "defaults closed AND must be sound").
//
// A completeness resolver proves the OBSERVED scope is finite-complete for a clearing direction:
// every `requiredObligation` named by the registry must be positively MEASURED in the typed
// experiment outcome (a flag === true). Obligations live in the SAME namespace as the catalog's
// typed outcomes, and registry.validateConsistency() guarantees each obligation is a measured
// support requirement of the experiment — so completeness reads measured facts, never an agent
// assertion or a runner "complete" boolean (plan 3.0-A pitfalls; reviewer drift finding).
//
// Registration is not correctness: the obligation SET is the worst-case-complete set derived in
// docs/completeness/<sc>.md, and the build's body-mutation tests drop any single obligation and
// assert the clear then rejects.
'use strict';

// Each resolver returns { complete, missing[] } given the typed experiment `outcome` and the
// registry's requiredObligations. A flag counts only when STRICTLY true.
const RESOLVERS = {
  'focus-visible-completeness-v1': (outcome, required) => {
    const missing = required.filter((o) => outcome[o] !== true);
    return { complete: missing.length === 0, missing };
  },
};

// Resolve completeness for a registry completeness spec against the typed experiment outcome.
function resolveCompleteness(spec, outcome) {
  if (!spec || !spec.resolver) return { complete: false, missing: ['no-completeness-spec'] };
  const fn = RESOLVERS[spec.resolver];
  if (!fn) return { complete: false, missing: [`unknown-resolver:${spec.resolver}`] };
  return fn(outcome || {}, spec.requiredObligations || []);
}

function hasResolver(name) { return Object.prototype.hasOwnProperty.call(RESOLVERS, name); }

module.exports = { RESOLVERS, resolveCompleteness, hasResolver };
