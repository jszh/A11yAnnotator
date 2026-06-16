# Harness 3.0 Fourth-Pass Independent Audit

**Audited commit:** `f846d60b638163719e39fcb152d7479fcc9d9e9a`  
**Compared against:** `99c2a1cfd73b605b2dadb93b1083ce043c4d275e`  
**Relevant implementation/plan digest:** `sha256:59f704683f210af0afb0e569a941f8ae76dce14af351c86bdf41a82fd45b43d5`

## Executive Conclusion

The pass-3 response overstates both the remediation closure and alignment with the agreed 3.0 plan.
The commit substantially improves lineage tamper resistance, exact-fixture coverage, contrast
conservatism, and obscuration geometry. Its committed tests are green.

However, independent probes found new definite wrong verdicts in both remediated visual mechanisms:

- uniform SVG paint behind text can still produce a false 1.4.3 clear because the rendered-pixel
  channel proves only uniformity, while the ratio uses a different CSS-derived backdrop colour;
- an overlay clipped by an ancestor can still produce a false 2.4.11 barrier because rectangle-union
  coverage uses the unclipped child border box.

The new HMAC layer also does not yet establish the lineage claimed by the response or required by
the plan. It signs identity copied from the plan, not identity independently observed from the
loaded page; promotion-artifact verification is optional through the programmatic publication
boundary; the production evaluation CLI does not pass the environment attestation key to the runner;
and no mandatory attested run manifest exists.

Most importantly, comparison against `HARNESS-3.0-PLAN.md` shows this remains a **partial,
shadow-mode implementation of selected deterministic experiments**, not a completed Harness 3.0:

- Phase 0's blocking manifest, independent applicability, independent coverage registry, complete
  bundle contracts, dynamic obligations, historical-comparison isolation, and authority benchmark
  are not complete.
- Phase 1 is partial.
- Phase 2 has scheduler/merger scaffolding but no agent planner.
- Phase 3 semantic judgments are absent.
- Phase 4 is absent.

Default-shadow still prevents these wrong verdicts from entering the authoritative corpus today.
That safety property should remain in force.

## Findings

### Critical

#### V3R4-C1: Attestation signs declared plan identity, not the page actually measured

The response says the signed lineage binds "the runner-observed run/page identity." In reality,
[`run-experiments.js`](../scripts/v3/lib/run-experiments.js#L287) copies
`{file, runId, pageDigest}` from the plan and signs it after loading whatever URL
`resolveUrl(request)` returns. It never computes or verifies the loaded page's digest.

Confirmed real-Chrome probe:

```text
loaded page: data:text/html containing the adversarial fixture
plan pageDigest: sha256:fiction
signed attestation.runIdentity.pageDigest: sha256:fiction
attestation: valid
```

Therefore a changed file, incorrect resolver, stale server response, or mismatched URL can receive a
valid signature for the collector's page digest without the runner having measured that page. The
new MAC prevents post-signing field tampering; it does not establish source-page lineage.

This is the exact responsibility assigned to the mandatory attested run manifest in plan Rule 17 and
the artifact contract:
[`HARNESS-3.0-PLAN.md`](HARNESS-3.0-PLAN.md#L201) and
[`HARNESS-3.0-PLAN.md`](HARNESS-3.0-PLAN.md#L386).

Require the trusted orchestrator/runner to independently derive and bind the actual loaded source
identity, environment, catalog/runner build, and artifact hashes in a mandatory manifest. The
builder must recompute and verify that manifest before publication.

### High

#### V3R4-H1: Rendered-pixel contrast proves uniformity but uses the wrong colour for the ratio

The new pixel channel in [`exp-runners.js`](../scripts/v3/lib/exp-runners.js#L198) returns only
whether the pixels behind the glyphs appear uniform. The actual contrast ratio continues to use the
CSS paint-stack colour selected by `measureContrast()`.

Confirmed real-Chrome probe:

```text
body background: black
uniform white SVG rectangle behind the entire text
text: white

pixel channel:
  pixelUniform:true

CSS channel / verdict:
  backdropIsSolidUniform:true
  ratio:21  (white against the unrelated black body)
  direction:NO_BARRIER_OBSERVED
```

The text is visibly white-on-white. The existing SVG fixture catches a non-uniform SVG painter but
not a uniformly painted foreign surface. The rendered channel must return a representative backdrop
colour and agree with the colour used in the ratio, or the verdict must remain `PARTIAL`.

#### V3R4-H2: Rectangle-union obscuration ignores ancestor clipping

The exact-union algorithm correctly handles small uncovered strips and cross-stacking contexts, but
it treats a candidate's `getBoundingClientRect()` as its painted rectangle. It checks ancestor
transforms but not ancestor `overflow`, clipping, masks, or rounded clipping.

Confirmed real-Chrome probe:

```text
100x100 focused button
100x100 opaque child overlay
overlay ancestor clips it to the left 60px using overflow:hidden

runner:
  entirelyObscuredByAuthorContent:true
  direction:BARRIER_OBSERVED
```

The right 40px of the button remains visible. The claim in
[`exp-runners.js`](../scripts/v3/lib/exp-runners.js#L416) that rectangle-union coverage is exact is
only true after establishing each candidate's effective painted/clipped region. Until that region
can be positively proven, exclude the candidate or use rendered-pixel coverage.

#### V3R4-H3: The 2.1.1 completeness predicate falsely infers "all functionality" from markup

The plan explicitly says completeness registration is not correctness and requires a sound
worst-case-complete obligation set:
[`HARNESS-3.0-PLAN.md`](HARNESS-3.0-PLAN.md#L163).

The current keyboard runner declares a native/simple control `singleModeControl:true` from its
tag/role and selected ARIA attributes. That cannot prove the control has no additional pointer-only
functionality.

Confirmed real-Chrome probe:

```text
native <button>
onclick: ordinary activation
ondblclick: separate mouse-only secondary function

runner:
  singleModeControl:true
  modeInventoryClosed:true
  direction:NO_BARRIER_OBSERVED
```

SC 2.1.1 applies to all functionality. The secondary function is not keyboard operable, so this is a
false clear. The analytic derivation in [`docs/completeness/2.1.1.md`](../docs/completeness/2.1.1.md)
assumes the mode inventory is closed but the runner has no observation that can establish it.

Keep 2.1.1 clears `PARTIAL` unless the claim is narrowed to a positively observed activation
function or a genuinely closed functionality contract can be independently established.

#### V3R4-H4: Promotion provenance verification is optional at the builder boundary

[`authority.js`](../scripts/v3/lib/authority.js#L68) returns `true` when no artifact verifier is
configured. Consequently `buildV3()` can publish signed evidence under an authoritative registry
whose gold/sealed/rater/suite references are fictional.

Confirmed probe:

```text
valid signed result + complete bundle + authoritative registry
provenance refs: fictional
artifactVerifier: omitted

buildV3:
  ok:true
  authoritative:1
```

The production build CLI supplies a verifier, but the builder is the publication boundary and is
also called programmatically by the orchestrator. A promoted direction must fail closed when either
the attestation key or artifact verifier is absent.

#### V3R4-H5: The production evaluation CLI never signs experiment evidence

The response says the runner loads `V3_ATTEST_KEY` from the environment or injected options.
`attestation.loadKey()` supports that, but the actual production evaluation path does not use it:

- [`run-evaluation.js`](../scripts/v3/tools/run-evaluation.js#L23) calls `orchestrate()` without an
  attestation key.
- [`orchestrator.js`](../scripts/v3/lib/orchestrator.js#L25) reads only explicit options/authority
  trust config, not the environment.
- [`run-experiments.js`](../scripts/v3/lib/run-experiments.js#L280) defaults the key to `null`.

Thus even with `V3_ATTEST_KEY` set, `run-evaluation.js` writes unsigned evidence. The later build CLI
can load the key, but it cannot retroactively sign the evidence, so a legitimate promoted production
run remains shadow-only. Tests publish through injected test helpers and do not exercise this actual
CLI trust path.

#### V3R4-H6: Pass-3 M1 is not closed; applicability remains same-source

The response says applicability is now attested. Attestation makes the runner's applicability flags
tamper-evident; it does not make them independent.

[`catalog.js`](../scripts/v3/lib/catalog.js#L175) explicitly states that applicability must come
from an independent validator, then merely checks booleans supplied in the experiment result.
Runners still create those booleans from their own measurements.

This remains directly contrary to plan Rule 15:
[`HARNESS-3.0-PLAN.md`](HARNESS-3.0-PLAN.md#L194). It is a blocking plan gap, not a closed finding.

#### V3R4-H7: Phase 0's mandatory complete lineage bundle and manifest do not exist

The response describes production-required
`collect+drive+candidates+plan+experiments+proposals` as the "full lineage." The plan's mandatory
bundle is materially broader:

- attested `run-manifest.json`;
- builder-recomputed obligation ledger artifact;
- judgments, claims, and results contracts;
- artifact hashes and parent-linked states;
- dynamic subject discovery provenance;
- complete cross-artifact reconciliation.

See [`HARNESS-3.0-PLAN.md`](HARNESS-3.0-PLAN.md#L386) and
[`HARNESS-3.0-PLAN.md`](HARNESS-3.0-PLAN.md#L1405).

The current production loader explicitly keeps manifest optional because the orchestrator does not
emit one: [`bundle-loader.js`](../scripts/v3/lib/bundle-loader.js#L19). Calling the current six-stage
set "complete lineage" obscures a major unfinished Phase 0 requirement.

#### V3R4-H8: Obligation enumeration is not independently covered

Plan Rule 16 requires candidate generation and builder reconciliation not to share their only
claim-family enumeration path:
[`HARNESS-3.0-PLAN.md`](HARNESS-3.0-PLAN.md#L197).

Current candidate generation directly calls `oracle.familiesFor(el)`:
[`candidate-generator.js`](../scripts/v3/lib/candidate-generator.js#L44). Builder obligation
enumeration delegates to the same oracle. Removing one family branch from that oracle removes both
the candidate and obligation, and pages with other obligations continue to validate.

The code itself acknowledges the separately owned coverage registry is future work:
[`applicability-oracle.js`](../scripts/v3/lib/applicability-oracle.js#L8).

### Medium

#### V3R4-M1: Runner identity/version are signed but not required or checked

The attestation schema does not require a non-empty `runner`, `runnerVersion`, or closed
`runIdentity`, and the builder does not verify that `attestation.runner` matches the catalog
experiment or that the version matches an approved runner build.

Confirmed probe: an attested result with `runnerVersion:null` published authoritatively.

This weakens the response's claim that publication proves evidence came from the cited catalog runner
at a known version. Bind the attestation to an approved catalog/runner build identity and reject
missing or mismatched values.

#### V3R4-M2: Disk artifact verifier's path confinement has a sibling-prefix escape

[`attestation.js`](../scripts/v3/lib/attestation.js#L121) checks path containment with string
`startsWith(rootDir)`. A sibling such as `/tmp/repo-evil/file` starts with `/tmp/repo`.

Confirmed probe:

```text
root:    /tmp/.../repo
ref:     gold://../repo-evil/gold
result:  accepted:true
```

Use `path.relative()` and reject `..`/absolute results, or compare with a separator-terminated root.

#### V3R4-M3: Completeness body-mutation coverage is narrower than the plan and docs claim

The plan requires body-mutation tests for every clearing direction. The docs repeat that requirement,
but the implemented drop-any-required-obligation test covers only the 2.4.7 focus slice. There are no
equivalent tests proving the declared obligation sets for 1.4.3, 2.1.1, 2.1.2, 3.3.2, and 4.1.2.

The 2.1.1 counterexample above demonstrates why presence/mutation enforcement alone is insufficient:
the registered set itself can be unsound.

## Pass-3 Response Assessment

| Response claim | Independent result |
|---|---|
| C1 fixed at root: evidence lineage authenticated | Improved tamper resistance, but actual loaded-page lineage is not authenticated; provenance verification is optional |
| H1 fixed at root by rendered pixels | Exact fixtures closed; uniform foreign paint still false-clears because pixel colour is not used in the ratio |
| H2/H3 fixed by exact union + true paint order | Exact fixtures closed; ancestor clipping still makes coverage over-claim |
| M1 applicability addressed by attestation | Not closed; same-source applicability is merely signed |
| M2 semantic reflow exception surfaced | Closed as a disclosed, barrier-only semantic boundary |
| M3 production loader requires full lineage | Exact six-stage loader requirement added; plan-defined complete lineage/manifest remains absent |
| 119 v3 + 139 existing tests green | Confirmed: 258 passed, 0 failed |
| Everything remains shadow by default | Confirmed and currently essential |

## Implementation Versus Plan

### Design Rules

| Rule | Status | Notes |
|---|---|---|
| 1 Automatic first | Partial | Deterministic scheduling exists; all generated candidates are Level 1 and no contextual agent path runs |
| 2 Allowlisted operations | Substantially built | Catalog IDs and plan merger restrict experiment selection |
| 3 Fresh isolated state | Substantially built | Each request opens a fresh browser page |
| 4 Directional typed support | Built | Catalog predicates are directional and strict-true |
| 5 One complete identity/applicability gate | Partial | Core identity/scope checks exist; complete bundle, manifest, states, judgments, and independent applicability do not |
| 6 Explicit semantic evidence | Not built | No judgments artifact/skills integration |
| 7 No forced resolution | Substantially built | Default `PARTIAL`/shadow behavior is conservative; some definite predicates remain unsound |
| 8 Bounded cost | Early partial | `maxAutomatic` count exists; no runner wall-clock, interaction, mutation-risk, or retry budgets |
| 9 Precision before coverage | Not passed | Fixtures exist, but no sized/adjudicated/sealed authority benchmark |
| 10 Conflict fails closed | Partial | Duplicate/binding and selected channel conflicts close; no resolver-wide baseline/experiment/judgment conflict search |
| 11 Sound completeness | Partial / failing | Default-closed registry exists; 2.1.1 counterexample proves at least one obligation set unsound |
| 12 AT baseline classification | Partial | Classification and baseline field exist; real-AT capability/labels absent |
| 13 Every obligation accounted | Partial | Static seeded obligations reconcile; dynamic/provisional subjects and full disposition model absent |
| 14 Atomic scoped claims | Partial | Target/state/action/environment exist; claim subjects, observed regions, parent-linked states, and broader aggregation contracts absent |
| 15 Independent applicability | Not built | Same runner emits applicability and outcome |
| 16 Independent enumeration coverage | Not built | Candidate and obligation enumeration share `familiesFor()` |
| 17 Orchestrator trust root / manifest | Not built | Per-result HMAC exists; no finalized attested run manifest or actual-source digest binding |
| 18 V3-only scoped publication | Substantially built | Legacy labels rejected and `conformanceOutcome:NOT_ASSESSED` preserved |

### Feature Sets

| Feature | Status |
|---|---|
| 3.0-A Catalog/typed support registry | Partial: strong skeleton, but independent applicability, risk/setup/budget schemas, dynamic subjects, and proven completeness are incomplete |
| 3.0-B Scheduler and agent escalation | Partial: deterministic scheduler and merger exist; no operating agent planner or Level-3 workflow |
| 3.0-C Pre-planned experiments | Partial: several useful runners exist, but they do not fully match the plan's C1-C9 set |
| 3.0-D Semantic judgment skills | Not built |
| 3.0-E Evidence resolver/builder | Partial: scoped experiment claims and reconciliation exist; complete bundle, manifest, judgments, dynamic states/subjects, and global conflict closure absent |
| 3.0-F Orchestrator/budgets/replay | Early partial: deterministic orchestration/replay exists; no agent stages, manifest, resume, retry, risk classes, or comprehensive budgets |
| 3.0-G Metrics/adjudication | Early scaffold: basic ledger/source counts and simple clear scoring; no full selective-classification metrics or adjudication queue |

### Planned Experiment Coverage

| Plan experiment | Current implementation |
|---|---|
| C1 Activation AX and visible-state differential | Partial: `ax-state-diff` covers selected 4.1.2 state/name/role cases; no general visible-state/status differential |
| C2 Focus visual retry | Built as the walking slice; remains shadow pending authority evidence |
| C3 Contrast follow-up | Built but still has a confirmed false-clear path |
| C4 Role-based keyboard recipes | Narrow activation recipe built; confirmed unsound 2.1.1 clear for additional functionality |
| C5 Modal/trap/advised exit | Narrow trap/exit runner built |
| C6 Controlled form error experiment | Not built; current `field-label-probe` assesses a different 3.3.2 sub-claim |
| C7 Consent two-state experiment | Not built; current C7 is focus-obscuration, a different mechanism |
| C8 Reflow information/function experiment | Partial barrier-only overflow probe; information/function preservation is not assessed |
| C9 Hover/focus content | Partial barrier-only runner |

### Phase Status

| Phase | Status |
|---|---|
| Phase 0: Contracts and Gold Benchmark | **Not complete / exit gate not met** |
| Phase 1: Deterministic Spine | Partial implementation; precision/sealed/fresh-corpus exit gates not met |
| Phase 2: Keyboard + narrow agent escalation | Partial deterministic pieces; no agent planner or independent applicability gate |
| Phase 3: Semantic skills | Not built |
| Phase 4: Broader states/optimization | Not built |

## Verification Performed

- `node --test scripts/v3/tests/*.test.js`: **119/119 passed**, including real-Chrome fixtures.
- `node --test scripts/tests/unit.test.js scripts/tests/result.test.js scripts/tests/docs.test.js scripts/tests/meta.test.js`:
  **139/139 passed**.
- Total: **258 passed, 0 failed**.
- `git show --check f846d60`: no whitespace errors.
- Independently reproduced:
  - signed attestation carrying a fictional plan digest for a different loaded page;
  - authoritative publication with signed evidence and fictional provenance when verifier omitted;
  - authoritative publication with `runnerVersion:null`;
  - uniform SVG-painted white-on-white text false-cleared at 21:1;
  - ancestor-clipped overlay false-barrier under 2.4.11;
  - multi-function native button false-cleared under 2.1.1;
  - sibling-prefix path escape accepted by the disk artifact verifier.

## Recommended Order

1. Keep every mechanism shadow-only.
2. Implement the plan's actual Phase 0 trust boundary: mandatory attested manifest, actual loaded-page
   digest/environment binding, complete artifact hashes, and mandatory provenance verification.
3. Repair the two visual wrong-verdict paths and withdraw 2.1.1 clearing authority until its
   completeness claim is sound.
4. Implement independent applicability and independently owned obligation-coverage enumeration.
5. Make the production evaluation CLI exercise the same signing/verification path used by tests.
6. Clearly label the current deliverable as a partial deterministic v3 spine; do not describe the
   six-stage bundle or selected experiment set as the complete 3.0 plan.
