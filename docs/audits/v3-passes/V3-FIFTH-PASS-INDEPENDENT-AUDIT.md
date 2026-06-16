# Harness 3.0 Fifth-Pass Independent Audit

**Audited commit:** `6dba0e55170a6d418590cfde5e4228534193b8d8`  
**Prior independent audit baseline:** `f846d60b638163719e39fcb152d7479fcc9d9e9a`  
**Builder response reviewed:** `eval-results/V3-FOURTH-PASS-AUDIT-RESPONSE.md`  
**Plan compared:** `eval-results/HARNESS-3.0-PLAN.md`

## Executive Conclusion

This pass is a real improvement over the fourth-pass state. The previously demonstrated
wrong-verdict bugs for uniform foreign-paint contrast, clipped obscuration, 2.1.1 false clearing,
optional provenance verification, runner version binding, and disk path confinement are materially
addressed in the code and covered by browser/pure tests.

However, the current state is still not aligned with the full v3 plan, and there are several new or
still-open boundary problems:

- The production replay path is internally inconsistent: the orchestrator hashes an `applicability`
  stage into the manifest, but the CLI does not write or load `applicability.json`, so a replay build
  over the emitted directory refuses the manifest.
- Independent applicability is not mandatory at the builder boundary. A promoted, signed,
  manifested bundle can publish authoritatively with no `applicability` stage at all.
- The v3 oracle expects synthetic fields (`hasText`, `role`) that the real current collector artifacts
  do not emit (`text`, `sampledRole`, `roleAttr`, `axRole`, `needsPixelContrast`). A fresh v3 run over
  the existing saved-page collector output would under-enumerate major families, including text
  contrast and name/role/value.
- The real-browser v3 suite currently has one failing test: the animated-focus fixture is no longer
  detected as unstable, weakening the focus false-clear guard.
- The new 3.3.1 form-error experiment is implemented as a runner, but its catalog/registry AT-baseline
  gate means it cannot currently produce even a shadow definite `BARRIER_OBSERVED` unless an
  `atBaseline` is injected from outside the runner.

Default-shadow still prevents these issues from corrupting an authoritative corpus in the normal
unpromoted configuration. The promoted/publication path is better than before, but not yet complete
against the v3 plan.

## Verification Performed

- `node --test scripts/v3/tests/*.test.js` inside the sandbox failed at browser launch.
- Reran with browser permission:
  - **172/173 v3 tests passed**
  - **1/173 failed**: `R2-F1: a CSS animation (no :focus rule) is INCONCLUSIVE, not a false clear`
- Existing pure R2/R2.9 tests:
  - `node --test scripts/tests/unit.test.js scripts/tests/result.test.js scripts/tests/docs.test.js scripts/tests/meta.test.js`
  - **139/139 passed**
- Independent probes:
  - replay loader/manifest mismatch for omitted `applicability`;
  - authoritative publication without an applicability stage;
  - real collector field-shape under-enumeration;
  - 3.3.1 claim resolver refusing the runner output without `atBaseline`.

## Findings

### Critical

#### V3R5-C1: Production replay cannot verify the orchestrator's own manifest

`orchestrator.js` creates an in-memory `applicability` artifact and passes it to
`manifest.buildManifest()`:

- `scripts/v3/lib/orchestrator.js:45-53`

`manifest.HASHED_STAGES` includes `applicability` and `judgments`:

- `scripts/v3/lib/manifest.js:18-19`

But `run-evaluation.js` does not write `applicability.json`, and `bundle-loader.js` does not list or
load that stage:

- `scripts/v3/tools/run-evaluation.js:33-40`
- `scripts/v3/lib/bundle-loader.js:9-24`

Confirmed probe:

```text
loadedStages:
  manifest, collect, drive, candidates, plan, experiments, claimProposals

manifest.verifyManifest:
  valid:false
  integrityBroken:true
  errors:
    manifest hashes an absent stage "applicability"
```

This contradicts the builder response claim that "a complete run replays byte-identical." A real
production run that includes the independent applicability stage in its manifest cannot be replayed
from the emitted directory because that stage is not persisted.

Fix direction: add `applicability: 'applicability.json'` and `judgments: 'judgments.json'` to
`STAGE_FILES`, write the applicability artifact in `run-evaluation.js`, and make the production
required-stage set match the manifest's publication-influencing stages.

#### V3R5-C2: Independent applicability is optional for authoritative publication

The builder checks the separate observer only when `bundle.applicability != null`:

- `scripts/v3/lib/build-v3.js:173-177`

The manifest verifier permits absent hashed stages as long as the manifest also omits the hash:

- `scripts/v3/lib/manifest.js:52-58`

Confirmed probe: a signed, promoted, complete bundle with a valid manifest but **no**
`applicability` stage published `authoritative:1`.

```text
buildV3({ no applicability stage }, promoted text-contrast clear):
  ok:true
  authoritative:1
  shadow:0
```

That means Rule 15 is not actually mandatory at the publication boundary. The system has an
independent applicability observer, but a bundle can opt out of it and still publish if the family-level
oracle corroborates the claim.

Fix direction: for production/promoted publication, require an `applicability` stage and require
observer agreement for every authoritative claim. If a mechanism truly has no independently observable
flags, encode that explicitly in the catalog/registry rather than making the whole stage optional.

### High

#### V3R5-H1: V3 obligation enumeration is not compatible with the real collector artifact shape

The v3 oracle derives obligations from fields such as `hasText` and `role`:

- `scripts/v3/lib/applicability-oracle.js:45-63`
- `scripts/v3/lib/coverage-registry.js:24-33`

The current collector emits fields such as `text`, `sampledRole`, `roleAttr`, `axRole`,
`isInteractive`, `isFormField`, and `needsPixelContrast`, not `hasText` or `role`:

- `scripts/eval-page.js:387-404`
- sample: `eval-results/Amazon_Sign_In/collect.json`

Probe over three real existing `collect.json` files:

```text
Amazon_Sign_In:
  current v3 oracle families: 24
  if text/sampledRole were normalized: 46

r_teenagers:
  current v3 oracle families: 28
  if normalized: 57

Wayfair:
  current v3 oracle families: 30
  if normalized: 60
```

The synthetic v3 tests use the new shape (`hasText`, `role`), so this under-enumeration is invisible
to the test suite. A fresh v3 run against the existing saved-page artifacts would miss many
`text-contrast` and `name-role-value` obligations. Because the coverage registry uses the same field
names as the oracle, it does not catch this data-contract mismatch.

Fix direction: add a collector-normalization layer at the v3 boundary, or update the collector to emit
the v3 fields directly. Then add regression tests using real-shaped collector records with
`text`, `sampledRole`, `roleAttr`, `axRole`, and `needsPixelContrast`.

#### V3R5-H2: The focus animation guard currently fails in the committed browser suite

The escalated real-Chrome run failed:

```text
R2-F1: a CSS animation (no :focus rule) is INCONCLUSIVE, not a false clear
AssertionError:
  two unfocused frames disagree => animating
  true !== false
```

The failing test is at `scripts/v3/tests/adversarial.test.js:234-241`, using
`assets/saved/fx-v3-focus-r2.html`.

The runner's focus visual redesign relies on two unfocused crops disagreeing when an element is
animating:

- `scripts/v3/lib/run-experiments.js:202-258`

In this environment the fixture reports `stableUnfocused:true`, so the animation detector did not
fire. That leaves the original risk class partially alive: a time-varying visual change can be
misattributed to focus unless the channel-agreement guard happens to catch it.

Fix direction: make the stability check deterministic enough to survive Chrome timing variance. For
example, sample across a declared minimum animation window or inspect active CSS/Web Animations on the
target/crop ancestors and fail closed when animation is present.

#### V3R5-H3: The 3.3.1 experiment is implemented but not operational under its own AT gate

`form-error-probe` emits no `atBaseline`:

- `scripts/v3/lib/exp-runners.js:467-477`

But `3.3.1/BARRIER_OBSERVED` is AT-dependent via the default registry, and the catalog also marks the
barrier direction as AT-dependent:

- `scripts/v3/lib/registry.js:17-19`
- `scripts/v3/lib/catalog.js:81-90`

The shared resolver refuses AT-dependent directions without a baseline:

- `scripts/v3/lib/claims.js:70-74`

Confirmed probe:

```text
resolveClaim(form-error-probe, BARRIER_OBSERVED, no atBaseline):
  PARTIAL
  reason: accessibility-support-dependent clear requires a declared AT baseline

same evidence with atBaseline:
  CLAIM / BARRIER_OBSERVED
```

So the builder's summary that the 3.3.1 error-identification experiment is "implemented,
barrier-only" is only true at the runner level. Through the actual claim resolver, the runner's own
output cannot produce a definite barrier unless another layer supplies an AT baseline.

Fix direction: either emit a scoped baseline from the runner, reclassify this barrier as not
AT-dependent when it is based on visible/native error identification only, or explicitly document the
experiment as "measurement-only, always PARTIAL until AT baseline capability exists."

### Medium

#### V3R5-M1: The manifest still signs a copied page digest at the run level

Individual experiment attestations now bind the runner-observed response digest:

- `scripts/v3/lib/run-experiments.js:337-343`
- `scripts/v3/lib/attestation.js:72-79`

However, the run manifest created by the orchestrator sets:

```js
observedPageDigest: collect.pageDigest
```

See `scripts/v3/lib/orchestrator.js:50-52`.

Authoritative claims are still protected by per-result lineage checks, so this is no longer the same
critical false-publication bug as V3R4-C1. But the manifest's own "observed page identity" field is
not independently observed by the manifest finalizer. It is copied from the collector.

Fix direction: have the orchestrator derive the manifest page identity from the set of per-result
observed digests, or from a separate trusted page-load digest stage, and fail closed if results disagree
or no independent observation exists.

#### V3R5-M2: The Level-3 planner exists but the production candidate path never creates Level-3 work

`agent-planner.js` and the validating merger are present and reasonably contained:

- `scripts/v3/lib/agent-planner.js`
- `scripts/v3/lib/scheduler.js:44-75`

But `candidate-generator.js` emits every candidate with `selectionLevel:1` and
`allowedExperiments:[experimentId]`:

- `scripts/v3/lib/candidate-generator.js:35-38`

As a result, the current production path has no contextual agent-selected escalation. Tests exercise
the merger with synthetic Level-3 candidates, but no built experiment currently surfaces a real Level-3
choice for advised-exit keys, custom-widget recipe selection, setup sequencing, or priority.

This is fine as a safe scaffold, but it is not yet the Phase 2 feature described in the v3 plan.

#### V3R5-M3: The bundle loader does not know about `judgments.json`

The plan and implementation add a judgments stage:

- `eval-results/HARNESS-3.0-PLAN.md`
- `scripts/v3/lib/judgments.js`
- `scripts/v3/lib/build-v3.js:254-258`

But `bundle-loader.js` does not include `judgments` in `STAGE_FILES`, and `run-evaluation.js` does not
write one. Because judgments are non-authoritative today, this is not a publication false-clear bug.
It is still a plan-integration gap: the replay/CLI contract cannot carry the Phase 3 artifact the plan
names.

Fix direction: add `judgments.json` to the loader and decide whether the production bundle requires an
empty judgments artifact or treats the stage as explicitly absent/not-run.

## Builder Response Assessment

| Builder claim | Independent result |
|---|---|
| R4 concrete wrong-verdict bugs fixed | Mostly confirmed; the relevant adversarial fixtures now pass under real Chrome except the focus animation guard |
| Phase-0 run-manifest closed | Partially built; manifest exists and protects hashed stages, but replay omits `applicability`, and independent applicability can be omitted entirely |
| Independent coverage registry closed | Built for drift/removal; still misses real collector field-shape mismatch because both oracle and registry expect v3-only fields |
| Independent applicability implemented | Implemented as an observer, but optional at publication unless the artifact is present |
| Budgets/dynamic subjects/planner/judgments implemented | Code exists and tests pass for scaffolds; planner is not active in generated candidates, judgments are non-authoritative and not loadable by CLI |
| 3.3.1 form-error experiment implemented | Runner implemented and Chrome tests pass at measurement level; claim resolver refuses definite output without `atBaseline` |
| Complete run replays byte-identical | Not currently true for orchestrator output containing a manifest hash of `applicability` |

## Implementation Versus V3 Plan

### Design Rules

| Rule | Current status |
|---|---|
| 1 Automatic first; agent only for contextual selection | Partial. Automatic scheduling exists; no production Level-3 candidates are generated. |
| 2 Allowlisted operations only | Substantially built. |
| 3 Fresh isolated state | Substantially built for experiment attempts. |
| 4 Directional typed support | Built; support predicates are explicit. |
| 5 One identity/applicability gate | Partial. Identity is much stronger; applicability observer is optional and not replayed. |
| 6 Semantic evidence explicit | Scaffolded. Judgments are recommendations only and not wired through the CLI bundle. |
| 7 No forced resolution | Mostly built; default-shadow and partial behavior remain strong. |
| 8 Bounded cost | Built at runner level with budgets/retries; tests pass. |
| 9 Precision before coverage | Not met. Gold annotation pass remains operational/future. |
| 10 Conflict fails closed | Partial. Many conflicts close; full cross-stage conflict search remains limited. |
| 11 Sound completeness | Improved; 2.1.1 clearing withdrawn. Real collector normalization remains a completeness precondition. |
| 12 Accessibility-support baseline | Partial. Baseline gate exists; no real AT capability, and 3.3.1 runner cannot satisfy its own baseline requirement. |
| 13 Every obligation accounted | Built for enumerated static/dynamic obligations; under-enumeration from collector field mismatch remains. |
| 14 Atomic scoped claims | Substantially built for experiment claims. |
| 15 Applicability cannot self-attest | Partial/failing at publication boundary: observer is optional. |
| 16 Independent enumeration coverage | Partial. Registry catches drift, not real collector schema mismatch. |
| 17 Orchestrator trust root / manifest | Partial. Manifest exists; replay and run-level observed identity remain incomplete. |
| 18 V3-only scoped publication | Substantially built. |

### Feature Sets

| Feature | Current status |
|---|---|
| 3.0-A Catalog/typed registry | Strong scaffold; still needs real collector adapter and baseline consistency for AT-dependent mechanisms. |
| 3.0-B Scheduler and agent escalation | Deterministic scheduler built; Level-3 planner scaffold exists but no production Level-3 candidates. |
| 3.0-C Pre-planned experiments | Broadly built for the deterministic set; one focus adversarial test failing. |
| 3.0-D Semantic judgment skills | Non-authoritative processor exists; no skill prompts/packets or CLI artifact flow yet. |
| 3.0-E Evidence resolver/builder | Much stronger; still misses mandatory applicability and replay-complete bundle. |
| 3.0-F Orchestrator/budgets/replay | Orchestrator and budgets built; replay broken for applicability-hashed manifests. |
| 3.0-G Metrics/adjudication | Scaffold only; gold annotation pass remains the next operational gate. |

### Planned Experiment Coverage

| Plan experiment | Current implementation |
|---|---|
| C1 Activation AX / visible differential | `ax-state-diff` covers selected 4.1.2 state/name/role cases; no general 4.1.3 status/visible differential. |
| C2 Focus visual retry | Built, but the animation-instability adversarial test is failing. |
| C3 Contrast | Built and improved; adversarial contrast fixtures pass in the current browser run. |
| C4 Keyboard recipes | Barrier-only for 2.1.1 clearing; appropriate after R4-H3, but not a broad keyboard-operability resolver. |
| C5 Trap/advised exit | Built narrow component probe. |
| C6 Forms | Field-label 3.3.2 built; form-error 3.3.1 runner built but blocked by AT-baseline gate for definite claims. |
| C7 Consent two-state | Still not built. Current C7 is focus-obscured barrier. |
| C8 Reflow | Barrier-only overflow probe built; info/function preservation remains out of scope. |
| C9 Hover/focus content | Barrier-only probe built. |

## Recommended Order

1. Fix the replay contract first: persist/load `applicability.json`, decide how `judgments.json` is
   represented, and make the production required-stage list match the manifest and plan.
2. Make independent applicability mandatory for promoted publication, not conditional on the stage
   being present.
3. Add a v3 collector-normalization layer and tests using real-shaped `collect.json` records.
4. Repair the failing focus-animation stability test before treating focus visual retry as hardened.
5. Resolve the 3.3.1 AT-baseline mismatch: either emit a baseline, reclassify the visible/native
   barrier direction, or document the runner as measurement-only until real AT support exists.
6. Keep all mechanisms shadow-only until the gold annotation pass and per-direction promotion gates
   are actually satisfied.
