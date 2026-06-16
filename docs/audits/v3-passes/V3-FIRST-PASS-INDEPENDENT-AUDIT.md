# Harness 3.0 First-Pass Independent Audit

**Audit snapshot:** repository HEAD `b2c995c22170a6f129622b4eaab898416d5ba4fd`, with the
untracked v3 workspace files as observed during this audit. The audited v3/docs/gold/fixture
content digest was:

```text
sha256:216b206d2d30f300472f46babd58d22454003439b168fe3359cbee853a85cb13
```

Because the v3 implementation is untracked, the digest above, not the Git commit, identifies the
actual audited implementation.

## Executive conclusion

The first pass establishes a useful walking skeleton, but it is **not yet a safe authoritative
publication architecture**. The central design direction is sound: scoped v3 claims, a
default-closed clearing registry, directional support predicates, deterministic building, and
automatic `PARTIAL` fallback are all worthwhile foundations.

However, several current gates validate declarations without binding them to the fact they purport
to prove. Executable adversarial probes demonstrated that the builder currently:

- clears element B using valid evidence measured on element A;
- publishes an authoritative `1.4.3` contrast barrier using a `2.4.7` focus experiment;
- accepts a focusable button as a successful zero-obligation run when its generated
  `applicableScs` is absent;
- grants authority despite the gold documentation explicitly declaring the mechanism shadow-only;
- accepts a transparent focus shadow as visibly sufficient and classifies a visible red focus
  border as a stable absence.

These are publication-boundary failures. The current slice must remain shadow-only, and the
remaining experiments should not be treated as template-fill work until the shared contracts and
bindings are corrected.

## Findings

### Critical

#### V3-C1: Evidence is not bound to the proposal's SC, target, state, action, or scope

[`build-v3.js`](../scripts/v3/lib/build-v3.js#L32) indexes evidence only by `claimId`, retains only
the experiment ID and typed flags, and links it when the proposal cites the same experiment ID.
[`claims.js`](../scripts/v3/lib/claims.js#L52) asks whether that experiment supports the proposed
direction, but never verifies `catalog.experiment.sc === proposal.sc`.

The result target and observation scope are discarded before resolution. Cross-artifact scope
checking only proves that an experiment target appears somewhere in collector inventory; it does
not prove that it is the proposal's target.

Confirmed probes:

- focus evidence measured on A produced an authoritative `NO_BARRIER_OBSERVED` claim scoped to B;
- `focus-visual-retry` produced an authoritative `BARRIER_OBSERVED` claim for SC `1.4.3`.

This directly violates the plan's cross-target/state/action attack requirements. Bind every support
reference to a canonical claim/obligation ID plus SC, action target, claim subjects, state,
action/window, environment, and artifact identity. Reject any mismatch.

#### V3-C2: Shadow/canary/general authority is documented but not enforced

The gold README says the three-case focus seed is below sizing and `2.4.7` clearing remains
shadow-only. No authority-readiness artifact or registry state reaches
[`build-v3.js`](../scripts/v3/lib/build-v3.js#L54), so the builder emits authoritative focus clears
without gold, readiness, sealed-test, canary, or promotion status.

Confirmed probe: a valid-looking focus proposal became authoritative with no gold or authority
readiness input.

Authority must be a builder-checked, versioned, per-mechanism/per-direction promotion state. The
default must be shadow, where supported proposals remain `PARTIAL` plus a recommendation.

#### V3-C3: The obligation ledger is not independently enumerated and can silently omit claims

[`candidate-generator.js`](../scripts/v3/lib/candidate-generator.js#L17) writes
`collect.elements[].applicableScs`; [`obligations.js`](../scripts/v3/lib/obligations.js#L19) then
trusts that same generated list as its supposedly independent inventory. The coverage test is
tautological: it creates synthetic `applicableScs` values and checks that the enumerator echoes
them.

Confirmed probe: a focusable button without `applicableScs` produced `ok:true`, zero obligations,
and zero partials. Removing or forgetting an applicability-generation branch therefore disappears
the corresponding obligation without detection.

The builder needs an independently owned applicability/claim-family oracle that regenerates
obligations from raw collector and drive facts, then compares them with candidates and
dispositions. Missing or empty obligation inventories for non-empty evaluated pages must fail
closed.

#### V3-C4: The authoritative focus measurement has definite false-clear and false-barrier paths

[`run-experiments.js`](../scripts/v3/lib/run-experiments.js#L78) treats any non-`none` box shadow as
an obviously visible focus indicator and ignores borders when deciding whether an indicator
exists. It does not use the existing real-keyboard pixel/spatial evidence implementation.

Real-Chrome adversarial probes confirmed:

- `box-shadow: 0 0 0 2px transparent` on focus set both `focusDependentIndicator` and
  `obviouslyVisible` true, authorizing a false clear;
- a visibly changing `4px solid red` focus border set `stableIndicatorAbsence:true`, authorizing a
  false barrier.

The existing R2 helper in [`a11y-eval.js`](../scripts/lib/a11y-eval.js#L221) already handles real
pixel evidence, spatial ring evidence, computed/pixel conflicts, and indeterminate outcomes.
Reuse or adapt it rather than replacing it with a weaker computed-style rule. Until then, neither
focus direction should be authoritative.

#### V3-C5: `element × SC` is not an atomic claim identity

[`obligations.js`](../scripts/v3/lib/obligations.js#L17) keys obligations as `xpath::sc`. The same SC
appears in materially different claim families: `1.3.1` spans forms, page structure, and grouping;
`2.4.3` spans keyboard operability, focus management, and grouping; `2.4.7` spans focus management
and focus visibility.

One SC-level disposition is consequently reused as the child of multiple skill summaries and
cannot represent distinct subjects, assertions, states, or actions. Obligation identity must
include a registered assertion/claim-family ID and canonical scope/subject identity, not only SC.

### High

#### V3-H1: The "mandatory complete bundle" is a three-artifact partial bundle

[`bundle-loader.js`](../scripts/v3/lib/bundle-loader.js#L18) and
[`cross-artifact.js`](../scripts/v3/lib/cross-artifact.js#L31) require only collect, experiments,
and proposals. Manifest and drive are optional. Candidates, plan, obligation ledger, judgments,
claims, results, hashes, lineage, and attestation are not accepted or reconciled by the gate.
[`orchestrator.js`](../scripts/v3/lib/orchestrator.js#L25) omits even the drive and plan from the
bundle it builds.

This is substantially short of the plan's Phase 0 blocking contract and permits stale or
mismatched baseline evidence to influence candidate selection outside the publication boundary.

#### V3-H2: There is no strict artifact schema validation

[`v3-schema.js`](../scripts/v3/lib/v3-schema.js) defines vocabulary and constructors, not strict
schemas. Unknown fields and unknown bundle stages are accepted; many malformed or missing fields
degrade to empty arrays/objects.

Confirmed probe: arbitrary unknown fields and an unknown bundle stage passed publication.

Add strict per-stage schemas with required fields, enums, non-empty constraints, catalog version,
unknown-key rejection, and cross-field invariants. Run the same validators in orchestration,
publication CLI, replay, sweep, and tests.

#### V3-H3: Agent-plan validation permits a valid experiment on a different target or SC

[`scheduler.js`](../scripts/v3/lib/scheduler.js#L46) verifies only that the candidate ID is a Level
3 candidate and the requested experiment exists. It accepts arbitrary `targetXpath`, `sc`, and a
different valid experiment.

Confirmed probes: the merger accepted candidate A retargeted to B and accepted a `2.4.7` candidate
rewritten as `1.4.3`. A current test also explicitly labels a `2.1.2` candidate using
`focus-visual-retry` as valid.

The merger must require exact candidate identity and restrict selection to that candidate's
registered allowed recipes and bounded parameters.

#### V3-H4: Applicability and completeness are self-attested by the same runner flags

The catalog calls applicability independent, but
[`run-experiments.js`](../scripts/v3/lib/run-experiments.js#L102) copies the runner's own outcome
flags into `applicabilityEvidence`. `modeCompletenessProven` is set to `reached`, and the
completeness resolver merely checks runner booleans.

Presence tests prove the flags are required; they do not prove independence or soundness. Use
separate provenance-bearing applicability observations and builder-recomputed completion over
explicit steps/states. Do not allow a runner's `...Proven:true` flag to certify itself.

#### V3-H5: Conflicting and duplicate evidence is order-dependent

[`build-v3.js`](../scripts/v3/lib/build-v3.js#L33) silently overwrites duplicate experiment results
with the same claim ID. Reversing two conflicting results changed the output from `PARTIAL` to an
authoritative clear, with both builds returning `ok:true`.

The plan requires conflict closure and order-independent rebuilding. Reject duplicate identities,
search all applicable evidence, and turn unexplained conflicts into `PARTIAL`.

#### V3-H6: Planned experiments may disappear silently

[`run-experiments.js`](../scripts/v3/lib/run-experiments.js#L113) silently skips every unsupported
experiment request. The bundle gate does not reconcile plan requests to result or explicit
failure/defer dispositions. Scheduler deduplication also ignores candidate/SC identity.

Require exactly one typed result, failure, or deferral for every request and exactly one request or
explicit scheduling disposition for every candidate.

#### V3-H7: Legacy-token rejection scans user content, not legacy schema

[`cross-artifact.js`](../scripts/v3/lib/cross-artifact.js#L14) recursively rejects exact legacy
strings anywhere. Confirmed probe: a collected accessible name of `"N/A"` caused the entire v3
bundle to fail.

Reject legacy fields and artifact shapes at contract boundaries; do not reject legitimate page
content that happens to equal an old label.

#### V3-H8: Gold scoring is useful scaffolding, not the plan's blocking benchmark

[`metrics.js`](../scripts/v3/lib/metrics.js#L52) scores false clears among labelled emitted clears.
It does not implement the full selective-classification matrix, failure recall, deferred/partial
sampling, difficulty strata, cluster-aware uncertainty, label-provenance validation, sealed-set
status, or promotion gates. The seed labels have one fixture-author rater despite the documented
independence requirements.

This is acceptable scaffolding, but it cannot yet support the builder's statement that the Phase 0
architecture is done.

### Medium / engineering robustness

- The Chrome executable is hard-coded to a macOS path, and the published environment is only
  `"headless-chromium"` rather than browser/version/platform/rendering configuration.
- `hydrationReady` means only `document.readyState === "complete"`; it does not detect snapshot
  under-hydration or late runtime styling.
- The runner mutates `body.tabIndex`, uses a fixed 60-Tab ceiling, and marks every finalized result
  `trusted`, `isolated`, and `completed` regardless of measurement validity.
- Support references supplied by proposals are published without validating that they exist or
  match the claim.
- The v3 implementation is untracked, so the claimed implementation state is not reproducible from
  the named Git commit.

## Positive assessment

The implementation is small, readable, and sensibly modular. Several choices should be retained:

- the three-axis v3 claim vocabulary and `conformanceOutcome:NOT_ASSESSED`;
- default-closed handling for clearing directions;
- strict `=== true` directional predicates;
- automatic `PARTIAL` for unsupported or omitted proposals;
- deterministic result construction and replay over a frozen bundle;
- fresh page creation per executed browser request;
- explicit catalog/registry consistency checks;
- tests that remove each declared completeness flag and verify a clear is rejected.

These strengths make the remediation tractable. They do not compensate for missing binding,
independent enumeration, measurement validity, or authority rollout at the publication boundary.

## Verification performed

- `43/43` v3 tests pass when Chrome execution is permitted.
- `139/139` existing pure tests pass.
- `51/51` existing browser evidence/integration tests pass against the live local server.
- Both v3 real-Chrome fixture tests pass as authored.
- Independent real-Chrome adversarial focus probes exposed one false clear and one false barrier.
- Builder probes confirmed cross-target evidence laundering, cross-SC evidence laundering,
  successful zero-obligation publication, authority without readiness, unknown-field acceptance,
  order-dependent duplicate evidence, and legitimate `"N/A"` content rejection.

Passing the authored tests therefore demonstrates implementation consistency, not correctness
against the plan's adversarial publication requirements.

## Recommended remediation order

1. Disable authoritative output globally; make all current mechanisms shadow-only.
2. Define strict complete-bundle schemas and canonical atomic obligation/claim identities.
3. Implement independent obligation enumeration and reconcile candidates, plans, requests,
   results/failures, proposals, claims, and outputs.
4. Bind every evidence reference to exact SC, assertion, target/subjects, state, action/window,
   environment, identity, catalog version, and lineage; reject conflicts and duplicates.
5. Enforce per-mechanism/per-direction authority promotion in the builder.
6. Replace the v3 focus heuristic with the existing pixel/spatial focus evidence path and add the
   transparent-shadow and visible-border adversarial fixtures.
7. Only then add the remaining experiments through the corrected shared contracts.

## Release judgment

**Status: useful walking skeleton; unsafe for authoritative corpus generation.**

The builder's “template-fill, not architecture” conclusion is premature. The unresolved issues are
shared architectural controls, and adding eight more experiments first would multiply their blast
radius.
