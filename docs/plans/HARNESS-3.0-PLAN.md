# Evaluation Harness 3.0 Feature Plan

Date: 2026-06-15

## Objective

Harness 3.0 should produce more **correct** authoritative observations without weakening the current
support-based result gate. Reducing honest `PARTIAL` results is a secondary outcome, never
the optimization target.

`PARTIAL` is the safe sink for insufficient evidence. Every transition out of it creates a
new opportunity for a false authoritative observation. The release bar is therefore measured
directional precision, especially for claims that emit `NO_BARRIER_OBSERVED` or
`wcagApplicability:INAPPLICABLE`.

It adds two complementary capabilities:

1. **Automatic-first deterministic experiments, with agent-selected escalation.** Cheap,
   safe, mechanically applicable experiments run automatically. An LLM selects from the
   same pre-planned catalog only when choosing the recipe, target scope, setup sequence, or
   priority requires contextual understanding. The LLM does not invent or execute
   arbitrary browser code; a trusted runner executes every experiment and emits typed
   evidence.
2. **Structured semantic judgment skills.** LLM skills triage obvious purpose/meaning
   questions using bounded evidence packets and explicit rubrics. Initially, subjective
   judgments create adjudication recommendations rather than authoritative observations. A
   narrow rubric may earn authority only after passing a blocking precision gate.

The core 3.0 principle is:

> A definite conclusion must be positively and directionally supported for the exact
> target, state, action, and observation scope. Failure not observed is not conformance
> demonstrated. When evidence is incomplete, conflicting, or out of scope, retain
> `PARTIAL`.

Harness outcomes are evidence-scoped annotations, not full-page or complete-process WCAG
conformance declarations. Publication and reporting must preserve the captured scope rather
than presenting a local observation as global conformance.

V3 claims separate:

```text
observationOutcome: BARRIER_OBSERVED | NO_BARRIER_OBSERVED | INCONCLUSIVE
wcagApplicability: APPLICABLE | INAPPLICABLE | UNKNOWN
conformanceOutcome: NOT_ASSESSED
```

V3 is a clean schema break and a fresh run. Authoritative output contains only v3 claims;
the builder must reject legacy `REPRODUCED`/`NOT REPRODUCED`/`N/A` labels and legacy
element-skill/page-rollup shapes. Historical comparison with the frozen initial corpus is
performed by a separate analysis-only tool whose report is never accepted as a v3 evidence
or result artifact.

## Current Architecture

The existing flow is:

```text
eval-page.js
  → collect.json            independent static evidence

drive-page.js
  → drive.json              independent baseline behavioral evidence

evaluation agent
  → records.json            per-element interpretations

build-results.js
  → results.json            deterministic aggregates + strict validation
```

3.0 should extend this flow rather than replace it:

```text
collect.json + drive.json
  → deterministic candidate/scheduler
  → obligation-ledger.json  every atomic claim and disposition
  → experiment-plan.json    automatic requests

agent planner (ambiguous/escalated candidates only)
  → agent-experiment-plan.json

validated plan merger
  → experiment-plan.json    optional allowlisted additions

experiment runner
  → experiments.json        trusted typed outcomes

semantic skills
  → judgments.json          non-authoritative claims until calibrated

claim-proposals.json + all evidence artifacts
  → mandatory v3 bundle loader
  → crossArtifactErrors()   one identity/applicability/obligation gate
  → build-results.js
  → validated results.json
```

The builder remains the publication gate. Agents may request experiments and propose
semantic conclusions, but they may not create authoritative outcomes or aggregates.

### Integration With the Current Per-Page Agent

Keep the existing one-page ownership boundary, but split the agent work into explicit
stages:

```text
1. deterministic baseline and automatic plan:
   collect + drive + candidate generation/scheduling

2. optional planner agent call:
   reads only unresolved candidates requiring contextual selection
   writes agent-experiment-plan.json

3. deterministic plan merger + experiment runner:
   validates/merges automatic and agent requests
   executes experiment-plan.json
   writes experiments.json

4. evaluator/semantic agent call:
   reads collect + drive + experiments + relevant semantic skill packets
   writes judgments.json + claim-proposals.json

5. deterministic builder:
   runs the shared cross-artifact gate, validates directional support, and writes results.json
```

The planner is not a required stage when all candidates are mechanically resolvable. When
used, the planner and evaluator may use the same model, but should be separate calls with
separate output schemas. This prevents the planner's expectation about an experiment from
being confused with the experiment's measured outcome. It also keeps agent context smaller:
the planner sees only ambiguous unresolved candidates, while the evaluator sees only
relevant evidence and skills for each target.

## Design Rules

1. **Automatic first; agent only for contextual selection.** Deterministic policy schedules
   experiments whenever applicability, safety, and recipe are mechanically clear. The LLM
   receives only cases where selection requires understanding purpose, scope, setup, or
   priority.
2. **Allowlisted operations only.** Experiment plans contain catalog IDs and bounded
   parameters, never arbitrary JavaScript, shell commands, selectors, or prompts.
3. **Fresh isolated state.** Each mutating experiment starts from a fresh page reload or
   declared checkpoint.
4. **Directional typed support predicates.** Every experiment defines separate positive
   predicates for each SC/verdict direction. Clearing a possible barrier generally requires
   stronger evidence and coverage than reproducing one.
5. **One identity and applicability gate.** Extend the existing `crossArtifactErrors()` over
   the complete evidence bundle. Experiments and judgments carry page/run identity, target
   identity, state/action scope, timestamps, catalog version, and outcome hashes.
6. **Semantic evidence is explicit.** Semantic judgments identify their rubric, evidence
   references, confidence, counterevidence, and unresolved questions.
7. **No forced resolution or absence inference.** An unsuccessful, timed-out, browser-scoped,
   conflicting, or ambiguous result remains `PARTIAL`. Absence within a bounded experiment
   supports a definite only when the catalog positively establishes that the bounded scope is
   complete for the claim.
8. **Bounded cost.** Per-page experiment count, interaction count, and wall-clock budgets
   are enforced by the runner.
9. **Precision before coverage.** Every experiment/rubric must pass a hand-adjudicated,
   both-direction precision gate before it may authorize observations.
10. **Conflict fails closed.** Unexplained disagreement between baseline, repeated attempts,
    experiments, browsers, or judgments returns the candidate to `PARTIAL`.
11. **Completeness defaults closed AND must be sound.** Each SC/verdict direction declares
    whether it has a finite, testable completeness scope. A missing completeness rule means the
    direction cannot clear; it never means completeness is unnecessary. *Registration is not
    correctness:* validating that declared obligations are present and satisfied is necessary
    but NOT sufficient — the declared obligation SET must itself be the sound, worst-case-complete
    set for the SC. Every completeness predicate therefore requires (a) a written analytic
    derivation of the full state/layer/mode space it must close and (b) body-mutation tests that
    weaken or drop a single `requiredObligation` and assert the clear now rejects. Empirical
    sampling cannot validate completeness, because a scope gap surfaces only on the un-sampled
    worst-case states correlated with the gap.
12. **Accessibility-support is baseline-relative and explicitly classified.** A schema-validated
    `accessibilitySupportDependent` flag on the SC/verdict registry decides whether a claim
    relies on accessibility support. When true, the claim must declare a browser/AT/technology
    support baseline, evidence outside it cannot establish a general claim, and clearing requires
    real-AT evidence in the gold-label basis. Purely visual/rendering SCs (2.4.7 focus visibility,
    1.4.3/1.4.11 contrast, 2.4.11 geometry, 1.4.10 reflow geometry) are perceivable without AT
    mediation, are classified `accessibilitySupportDependent:false`, and do NOT invoke the real-AT
    requirement. The flag is the single firing condition for Rule 12, the real-AT label clause,
    and the "untested accessibility support" builder check.
13. **Every obligation is accounted for.** The builder independently regenerates an
    obligation ledger and requires exactly one disposition for every atomic claim:
    `resolved`, `scheduled`, `budget-deferred`, `inapplicable-with-proof`, or `PARTIAL`.
14. **Claims are atomic, but not independent.** Authoritative outcomes bind one SC assertion to
    explicit subjects, state, action, environment, support set, and completeness proof.
    Element-skill summaries are derived and cannot clear unless aggregation completeness is
    proven. Atomicity does NOT license ignoring cross-SC dependencies: clearing a
    keyboard-interaction SC (2.1.1, 2.4.7, and 2.4.3 where applicable) additionally requires a
    `keyboardReachableInState` precondition — the clearing experiment must reach the target via
    real sequential keyboard navigation in the tested state. Collector-inventory existence of the
    target is not reachability; a clear on an element a keyboard user cannot reach (upstream trap,
    broken tabindex, out of tab order) is scoped-conditional and otherwise remains `PARTIAL`.
15. **Applicability cannot self-attest.** A separate deterministic applicability validator,
    using baseline or independently collected facts, must approve a recipe. Planner choices
    and experiment outcomes cannot satisfy their own applicability preconditions.
16. **Obligation enumeration is independently covered.** Candidate generation and builder
    reconciliation cannot share the only claim-family enumeration path. An independent
    claim-family coverage registry plus mutation tests must detect removal of any generation
    branch.
17. **The orchestrator is the trust root, proportionate to the threat.** It owns artifact
    creation/finalization and attests the manifest; hashes alone prove consistency, not trusted
    provenance. State the threat model explicitly: the new error sources are a *misaligned
    evaluator/planner agent* that writes only `claim-proposals.json`/`judgments.json` (not arbitrary
    code), against which identity/digest/provenance binding plus non-agent-writable deterministic
    stages are the operative defense. A protected execution boundary suffices for that model;
    cryptographic signing/attestation is required only if a tampering/code-execution adversary is
    in scope, and should otherwise be deferred rather than gating Phase 0.
18. **Publication is v3-only and preserves scope.** The builder publishes atomic v3 claims and
    derived v3 summaries only. It rejects legacy verdict labels, legacy element-skill records,
    and legacy page/process rollups. Every published metric and derived summary must preserve
    observation scope, applicability, clearability, and `conformanceOutcome:NOT_ASSESSED`.
    Historical comparison output is analysis-only and cannot enter the authoritative bundle.

### Three-Level Selection Policy

| Level | Selector | When used | Examples |
|---|---|---|---|
| **Level 1: mandatory automatic** | deterministic scheduler | Cheap, safe experiment with mechanically certain applicability | `focusIndicator.present:null` → focus retry; `needsPixelContrast:true` → pixel contrast |
| **Level 2: conditional automatic** | deterministic scheduler | Explicit evidence/role predicate selects one bounded recipe | `role=checkbox` → Space/state recipe; observed dialog → modal focus/return recipe |
| **Level 3: agent-selected escalation** | LLM planner | Multiple plausible recipes/scopes, multi-step setup, contextual instructions, or budget prioritization | unclear custom widget; advised F6 exit; choose suspected trap scope; choose prerequisite setup |

The deterministic scheduler should run Levels 1 and 2 without an agent call. A candidate
is sent to Level 3 only when the catalog declares that its unresolved selection fields
require contextual judgment. The agent's selection never counts as outcome evidence.

## Impact Baseline

The frozen initial corpus contains 648 element-skill `PARTIAL` verdicts. It also contains
252 old definite behavioral verdicts that would lack positive support under the current
R2.8 predicates. These are historical comparison signals, not authoritative v3 inputs.

| Area | Existing partials | Unsupported old definite verdicts | Primary 3.0 mechanism |
|---|---:|---:|---|
| Focus visibility | 284 | 102 | focus visual retry/stabilization |
| Dynamic announcements | 207 | 30 | activation AX + visible-state differential |
| Keyboard operability | 38 | 106 | role-based keyboard recipes |
| Focus management | 28 | 14 | modal/trap/focus-transition experiments |
| Color/visual text | 41 | not fully quantified; 173 old contrast passes used uncertain static evidence | SC-specific contrast resolution |
| Pointer/reflow | 29 | not fully quantified | target experiments + semantic exceptions |
| Forms | 7 | existing 3.3.1 findings may change | controlled invalid-submit experiment |
| Semantic/other skills | 14 | not fully quantified | structured semantic judgment skills |

These counts are prioritization signals from the frozen initial corpus, not promised
resolution counts or v3 output categories. A correct v3 experiment may support
`BARRIER_OBSERVED`, `NO_BARRIER_OBSERVED`, or an applicability conclusion. Reducing the
number of partials is not itself a success unless authoritative-observation precision remains
high.

## Asymmetric Promotion and Threat Model

False negatives are the stealthier error class: a fabricated barrier is likely to be
inspected, while a real barrier incorrectly emitted as `NO_BARRIER_OBSERVED` or
`wcagApplicability:INAPPLICABLE` can disappear from review and contaminate downstream
evaluation. Promotion rules must therefore be asymmetric:

| Transition | Minimum authority |
|---|---|
| `PARTIAL → BARRIER_OBSERVED` | Positive observation of an applicable barrier on the bound target/state/action |
| `PARTIAL → NO_BARRIER_OBSERVED` | Positive non-reproduction witness plus catalog-defined finite completeness for the explicitly reported scope |
| `PARTIAL → wcagApplicability:INAPPLICABLE` | Positive proof that the SC is inapplicable within a catalog-defined complete scope |
| Any timeout, conflict, incomplete coverage, or applicability doubt | Remain `PARTIAL` |

Before implementation, classify every SC/verdict direction:

| Clearability class | Meaning | Publication rule |
|---|---|---|
| `closed-scope-clearable` | A finite scope and completion predicate can be positively demonstrated | May emit scoped `NO_BARRIER_OBSERVED`/`INAPPLICABLE` after its directional gate passes |
| `open-scope-never-clearable` | Relevant states/actions/process scope cannot be finitely closed by the harness | May reproduce a barrier; otherwise remains `PARTIAL` |
| `exception-clearable` | A specific exception has finite typed conditions | One positively proven exception may support scoped non-reproduction; refuting one exception proves nothing about the others |

Open-state examples requiring an explicit classification include 2.4.11/2.4.13 across focus
and overlay states, 1.4.10 reflow exceptions, 1.4.13 hover states, 1.3.2 sequence, and 4.1.3
across application flows. Do not maintain an informal hand-written "unreachable" list as the
authority; make clearability a required, schema-validated registry field.

A registry slot is not a resolution. Until an experiment and a sound completeness predicate
exist for a direction, its clearing class defaults to `open-scope-never-clearable`. Concretely,
**2.4.11/2.4.13 clearing is `open-scope-never-clearable` by default**: no current experiment
measures focus obscuration, and obscuration depends on every author-fixed/sticky/overlay layer
across the continuous scroll range, so a single captured state cannot clear. A 2.4.11 clear may
become `closed-scope-clearable` only if an experiment is added whose completeness predicate
enumerates each fixed/sticky/overlay layer at the scroll position that maximizes its overlap
with the focused target (worst-case obscuration), not the as-captured position. Absent that, the
harness reproduces these barriers but does not clear them.

The primary new error sources are:

| Layer | Failure mode | Default control |
|---|---|---|
| Measurement | caret/animation pixel noise, wrong contrast samples, sticky-layout movement, settle-window blindness | directional predicates, repeated controls, ambiguity output, no absence inference |
| Environment | Chrome-specific behavior or offline snapshot under-hydration | readiness/capability checks, browser-scoped evidence, corroboration before clearing |
| Planner | wrong but valid recipe, wrong scope, prompt-injected selection | allowlist, independent applicability predicate, untrusted-page-text boundary, planner abstention |
| Semantic | plausible purpose inference, packet blindness, uncalibrated confidence | non-definite by default, context requests, counterfactual benchmark, human adjudication |
| Integration | right experiment bound to wrong target/state, authority collision, stale artifacts | one extended `crossArtifactErrors()`, scoped support references, conflicts fail closed |

Budgets may defer candidates to `PARTIAL`; they must never silently clear them. Metrics must
also expose the resolved subset by difficulty so easy-case resolution does not make the
remaining corpus appear more conformant.

The asymmetric false-negative risk does not justify weak `BARRIER_OBSERVED` predicates. False trap,
interference, or non-operability findings can invalidate an entire page and may result from
snapshot under-hydration. Safe-direction defaults never override contradictory evidence;
conflict returns `PARTIAL`.

### Gold Benchmark Requirements

The Phase 0 benchmark is a blocking authority test, not merely a fixture collection:

- stratify by skill, verdict direction, experiment/rubric, difficulty, and relevant state;
- deliberately include `NO_BARRIER_OBSERVED` and `INAPPLICABLE` candidates, not only known barriers;
- include counterfactual pairs, wrong-recipe cases, prompt injection, environmental
  readiness failures, delayed outcomes, and cross-target/state artifact attacks;
- report uncertainty/confidence intervals alongside measured precision; a small sample can
  catch regressions but cannot prove a very low false-negative rate;
- size rate-estimation sets using the number of independently labelled true cases, not total
  examples; account for multiple gates and do not certify below measured label-error rates;
- account for correlation by recording site, template/framework, component family, browser,
  and source provenance; use cluster-aware uncertainty and minimum independent-cluster counts;
- maintain a per-mechanism/direction **sizing worksheet**: target confidence bound, implied
  minimum independently-labelled true-case and independent-cluster counts, the labelling owner,
  and a wall-clock/cost estimate; a mechanism earns definite authority only when its own
  worksheet is satisfied (benchmark readiness gates per mechanism, not globally);
- for `closed-scope-clearable` directions, the sealed set must include **constructed worst-case
  state-combination cases** derived from the completeness-derivation document (Rule 11), scored
  as a separate gate from distribution-sampled cases — a quiet sampled distribution cannot
  exercise the un-sampled states where a completeness gap lives;
- require independently owned minimum quotas of adversarial clearing, exception, and
  interference cases so mechanism authors cannot satisfy gates with easy examples;
- require a gold-label provenance contract with blinded pre-adjudication labels, rater
  identity/qualification, evidence channels, declared support baseline, and adjudication;
- require an independently owned labelling basis distinct from the channel under test,
  including real-AT evidence where accessibility support is claimed. Real-AT labelling is a
  concrete capability with an owner, an AT/OS matrix, and a throughput estimate, scoped in
  Phase 0. If that capability is not stood up, 3.0 may grant CLEARING authority only to
  `accessibilitySupportDependent:false` SCs (focus visibility, contrast, reflow geometry), and
  must hold accessibility-support-dependent clears (4.1.2, 4.1.3, announcement-dependent
  keyboard) for a later track;
- pre-register a minimum inter-rater agreement threshold and adjudicate disagreements before
  treating labels as gold; otherwise the mechanism remains shadow-only;
- separate development, validation, and independently owned sealed test sets; freeze
  thresholds/difficulty strata before one logged promotion evaluation per mechanism version,
  then replenish or retire exposed sealed cases;
- after the fresh v3 corpus is generated, fully adjudicate every authoritative
  `NO_BARRIER_OBSERVED`/`INAPPLICABLE` claim and every high-impact trap/interference claim
  before freezing it; historical transition labels from the initial corpus are analysis-only;
- define a probability-sampled audit over all eligible candidates, including unscheduled,
  budget-deferred, and `PARTIAL`; population weighting is allowed only from known non-zero
  inclusion probabilities.

Each mechanism earns authority per verdict direction. Passing the reproduced-failure gate
does not authorize it to emit `NO_BARRIER_OBSERVED` or `INAPPLICABLE`.

Before benchmark execution, pre-register per-direction authority thresholds, confidence
level, multiplicity correction, minimum relevant-case and independent-cluster counts,
non-inferiority margin, and rollback triggers. Non-inferiority for clearing and
trap/interference directions is measured against **hand-adjudicated gold labels and the
independent audit, never against the frozen initial corpus** — that corpus contains the ~252
unsupported definites and ~173 uncertain contrast passes this work exists to correct, so
beating it is the wrong target; initial-corpus comparison is reserved for an analysis-only
coverage/throughput/change report.
Example risk targets for planning are a simultaneous 95% upper confidence bound below 2%
false-clearance for clearing and trap/interference mechanisms, and below 5% false-definite rate
for other `BARRIER_OBSERVED` mechanisms; final thresholds require independent review before unsealing
tests.

## Reuse Strategy

3.0 should reuse mature mechanisms where they measure the required property, but retain
the support-based gate because no external tool settles arbitrary WCAG conformance.

| Existing work | Reuse in 3.0 | Expected overhead reduction | Important boundary |
|---|---|---|---|
| Chrome DevTools Protocol Accessibility domain | AX subtree capture, stable AX node IDs, AX update events | High for AX differential experiments | Experimental API; AX exposure is not proof every AT announced it |
| Existing Puppeteer/CDP stack | Trusted input, isolation, screenshots, DOM/AX inspection | Very high; avoids framework migration | Keep browser actions catalog-bounded |
| Playwright ARIA snapshot model | Reference format for compact accessible-tree snapshots/diffs | Medium | Use as a model or dependency only after evaluation; current harness is Puppeteer |
| axe-core | Static violations, passes, incomplete/review model, rule/SC reconciliation | High | Axe explicitly does not test inactive/hidden states unless activated and rerun |
| W3C ACT Rules | Rule applicability/outcome design and implementation references | Medium | ACT Rules are informative, not complete conformance determinations |
| WAI-ARIA Authoring Practices + ARIA-AT | Keyboard recipe definitions and expected pattern behavior | High for standard widgets | Production widgets may intentionally differ; ARIA-AT initially targets controlled examples/manual AT testing |
| IBM Equal Access | Potential second static engine and independent rule reconciliation | Medium | Do not merge findings blindly; reconcile rule scope and SC mapping |
| Existing `verify-finding.js --pixel-contrast` | Compositing/background-candidate evidence | Very high | Cannot use antialiased glyph pixels as the normative 1.4.3 color oracle |
| Existing Guidepup virtual screen reader integration | Additional reading/announcement evidence | High | Virtual output is corroboration, not universal real-AT behavior |

## Artifact Contracts

### `run-manifest.json` and `obligation-ledger.json`

The mandatory v3 bundle starts with a cryptographic run manifest and a builder-recomputed
obligation ledger:

- hash every artifact and bind source page, browser/storage/hydration environment, catalog
  code/schema, runner build, prompts/rubrics, model, and parent-linked state checkpoints;
- have the trusted orchestrator finalize and attest the manifest; the builder verifies the
  attestation and recomputes artifact hashes;
- distinguish `actionTargetRef`, `claimSubjectRefs[]`, and `observedRegionRefs[]`;
- allow dynamically discovered post-action subjects only with typed discovery provenance and
  canonical fingerprints;
- enumerate every atomic claim obligation and reconcile it to exactly one disposition;
- represent unknown future subjects as provisional claim templates, then deterministically
  expand and reconcile obligations when experiments discover typed dynamic subjects;
- reject omitted, duplicate, unknown, or unreachable dispositions.

The CLI and regression sweep must use one mandatory bundle loader. The fresh v3 run rejects
legacy result artifacts, requires all declared stage artifacts, and never treats absent
candidates/plans as an empty successful run.

### `experiment-candidates.json`

Generated deterministically from `collect.json`, `drive.json`, and current support
predicates.

```json
{
  "file": "page.html",
  "runId": "run-123",
  "pageDigest": "sha256:...",
  "candidates": [
    {
      "candidateId": "cand-17",
      "claimId": "claim-17",
      "actionTargetRef": "node:button-1",
      "claimSubjectRefs": ["dynamic:status-1"],
      "observedRegionRefs": ["region:main-statuses"],
      "skill": "dynamic-announcement",
      "sc": "4.1.3",
      "missingEvidence": ["statusMessageObserved"],
      "allowedExperiments": ["activation-ax-diff", "activation-visible-status-diff"],
      "selectionLevel": 2,
      "selectionReason": "Visible non-focus-moving change observed",
      "priority": 90
    }
  ]
}
```

### `experiment-plan.json`

Validated merged plan produced from deterministic scheduling plus optional agent-selected
escalations. Every request records its selection source. Parameters must validate against
the experiment catalog schema.

```json
{
  "file": "page.html",
  "runId": "run-123",
  "pageDigest": "sha256:...",
  "requests": [
    {
      "candidateId": "cand-17",
      "experimentId": "activation-ax-diff",
      "claimId": "claim-17",
      "actionTargetRef": "node:button-1",
      "claimSubjectRefs": ["dynamic:status-1"],
      "observedRegionRefs": ["region:main-statuses"],
      "selectionSource": "conditional-automatic",
      "stateScope": "fresh-load:consent-present",
      "actionScope": "activate-once",
      "reason": "Activation changed visible content but baseline AX exposure was unclear"
    }
  ]
}
```

When an agent planner is needed, it writes a separate `agent-experiment-plan.json`. The
deterministic plan merger validates it, rejects non-Level-3 candidates and invalid
parameters, deduplicates it against automatic requests, and produces the authoritative
`experiment-plan.json`.

### `experiments.json`

Produced only by the trusted experiment runner.

```json
{
  "file": "page.html",
  "runId": "run-123",
  "pageDigest": "sha256:...",
  "catalogVersion": "3.0.0",
  "results": [
    {
      "candidateId": "cand-17",
      "experimentId": "activation-ax-diff",
      "claimId": "claim-17",
      "actionTargetRef": "node:button-1",
      "claimSubjectRefs": ["dynamic:status-1"],
      "observedRegionRefs": ["region:main-statuses"],
      "stateBeforeRef": "state:before-17",
      "stateAfterRef": "state:after-17",
      "trusted": true,
      "isolated": true,
      "completed": true,
      "startedAt": "2026-06-15T00:00:00.000Z",
      "completedAt": "2026-06-15T00:00:01.000Z",
      "observationWindowMs": 1000,
      "observationScope": {
        "actionTargetRef": "node:button-1",
        "claimSubjectRefs": ["dynamic:status-1"],
        "state": "fresh-load:consent-present",
        "action": "activate-once",
        "environment": "headless-chromium"
      },
      "outcome": {
        "visibleChangeObserved": true,
        "focusMoved": false,
        "axStatusChangeObserved": false
      },
      "artifacts": ["shots/cand-17-before.png", "shots/cand-17-after.png"]
    }
  ]
}
```

### `judgments.json`

Produced by semantic skills and validated separately from measured evidence.

```json
{
  "file": "page.html",
  "runId": "run-123",
  "pageDigest": "sha256:...",
  "judgments": [
    {
      "judgmentId": "judgment-8",
      "rubricId": "target-equivalent-purpose-v1",
      "claim": "equivalent-target-exception",
      "targetXpath": "/html/body/a[3]",
      "targetFingerprint": "sha256:...",
      "stateScope": "fresh-load:consent-present",
      "verdict": "unresolved",
      "confidence": "medium",
      "modelId": "model-name-and-version",
      "systemPromptDigest": "sha256:...",
      "skillDigest": "sha256:...",
      "evidencePacketDigest": "sha256:...",
      "inferenceSettings": {"temperature": 0},
      "attemptId": "attempt-1",
      "evidenceRefs": ["collect:/html/body/a[3]", "experiment:cand-22"],
      "counterevidence": "Same function and independent target-size conformance are not proven",
      "reason": "Destination match is supporting but non-conclusive evidence"
    }
  ]
}
```

### `claim-proposals.json`

Produced by the evaluator agent as non-authoritative proposed interpretations. Each proposal
targets an existing atomic claim obligation, cites evidence/judgment references, and proposes
only the v3 observation/applicability fields allowed by its skill contract.

The bundle loader rejects proposals containing legacy verdict labels, element-skill verdict
objects, page rollups, agent-authored aggregates, unknown claim IDs, or unsupported evidence
references. The deterministic resolver may accept, downgrade, or reject a proposal; proposals
never become authoritative merely because they are well-formed.

### Historical Comparison Report

Historical comparison is deliberately outside the authoritative v3 artifact bundle. A
separate read-only analysis tool may compare frozen initial-corpus verdicts with fresh v3
claims and produce a change report for review, coverage, and throughput analysis.

The comparison report:

- is clearly marked non-authoritative;
- cannot be loaded by the v3 builder, resolver, bundle loader, or regression sweep;
- may describe historical-to-v3 changes but never maps them back into v3 claims;
- preserves the original and v3 schemas side by side rather than pretending they are
  semantically equivalent;
- is regenerated from frozen inputs and never used as support evidence.

## 3.0 Feature Set

### 3.0-A: Experiment Catalog and Typed Support Registry

Create a versioned catalog of experiments. Each catalog entry defines:

- candidate preconditions;
- selection level and deterministic scheduling predicates;
- fields, if any, that require contextual agent selection;
- allowed bounded parameters;
- setup/isolation requirements;
- trusted browser actions;
- typed outcomes;
- directional supported SC/verdict predicates, including required coverage and
  corroboration;
- required clearability class and finite scope-completeness predicate per SC/verdict
  direction;
- an analytic completeness-derivation reference (the enumerated worst-case state/layer/mode
  space) and a body-mutation test set proving the obligation SET is sound, not merely present;
- an `accessibilitySupportDependent` classification per SC/verdict direction (Rule 12);
- applicability predicates that are independent of a successful measurement;
- executable obligation/completeness resolver functions; runner-emitted booleans cannot
  self-certify completeness;
- environmental/readiness requirements and browser scope;
- timeout and interaction budget;
- destructive-action risk;
- cleanup requirements.

Suggested layout:

```text
scripts/experiments/
  catalog.js
  candidate-generator.js
  schedule-automatic.js
  merge-plan.js
  run-experiments.js
  experiments/
    activation-ax-diff.js
    focus-visual-retry.js
    pixel-contrast.js
    role-keyboard-recipe.js
    modal-exit-focus-return.js
    form-invalid-submit.js
```

Integration:

- Candidate generation runs after baseline `collect` and `drive`.
- Level 1 and Level 2 candidates are scheduled automatically.
- Only Level 3 candidates are offered to the agent planner.
- `build-results.js` accepts `experiments.json` and validates its identity and catalog
  version.
- `result-builder.js` consumes experiment outcomes through the same positive-support
  mechanism used for `drive.json`.
- The catalog is the single source of truth for directional support. The builder consumes
  those predicates rather than maintaining a parallel mapping.
- Replace the existing `crossArtifactErrors(records, collect, drive)` interface with
  one bundle-aware gate over the manifest, obligation ledger, candidates, plans,
  claim proposals, collect, drive, experiments, judgments, claims, and results; use the same
  function in the CLI and sweep.

Directional catalog entries should resemble:

```json
{
  "experimentId": "role-keyboard-checkbox",
  "clearability": {
    "BARRIER_OBSERVED": "open-scope-never-clearable",
    "NO_BARRIER_OBSERVED": "closed-scope-clearable",
    "INAPPLICABLE": "open-scope-never-clearable"
  },
  "supports": {
    "NO_BARRIER_OBSERVED": {
      "requires": ["applicableRole", "interactiveTargetConfirmed", "trustedInput", "functionalOutcome", "requiredExposedState"]
    }
  },
  "scopeCompleteness": {
    "NO_BARRIER_OBSERVED": {
      "resolver": "checkbox-recipe-completeness-v1",
      "derivation": "docs/completeness/2.1.1-checkbox.md",
      "requiredObligations": ["keyboard-reachable-in-state", "focus-target", "space-activation", "functional-outcome", "exposed-state"]
    }
  },
  "accessibilitySupportDependent": { "NO_BARRIER_OBSERVED": true },
  "absenceCanSupportInapplicable": false
}
```

Pitfalls:

- Catalog entries accidentally authorize claims broader than their measured outcome.
- Outcome schemas drift from builder support predicates.
- A valid outcome from the wrong recipe appears trusted and supports an irrelevant claim.
- A bounded timeout or observation scope is mistaken for proof of absence.
- A missing completeness rule silently behaves as if no completeness proof were required.
- Correct catalog predicates faithfully authorize flags that the runner measured
  incorrectly.
- Candidate generation/scheduling omits a required claim while every emitted artifact
  validates.
- Experiments mutate shared page state or trigger navigation/destructive actions.
- Agent-supplied parameters smuggle arbitrary selectors or commands.
- An experiment unnecessarily routes through the agent, adding cost and nondeterminism.
- A candidate is automatically scheduled even though choosing its recipe or scope requires
  contextual understanding.

Testing focus:

- Schema fuzzing and unknown-key rejection.
- Every supported verdict direction has positive, negative, applicability, and incomplete-
  coverage counterexample fixtures.
- Mutation isolation and repeatability.
- Malicious/invalid experiment-plan parameters are rejected.
- Level classification tests prove clear candidates schedule automatically and ambiguous
  candidates do not.
- Catalog version mismatch and stale experiment artifacts fail closed.
- Registry coverage test rejects every SC/direction lacking an explicit clearability class.
- Missing/unknown completeness predicates reject clearing verdicts.
- Completeness-predicate body-mutation tests: weakening or dropping any `requiredObligation`
  must turn a passing clear into a rejection (validates obligation-set soundness, not presence).
- Constructed worst-case state-combination fixtures clear correctly per closed-scope-clearable
  direction, scored separately from distribution-sampled cases.
- Builder regeneration of the obligation ledger detects omitted/duplicate candidates and
  dispositions.
- Independent claim-family coverage registry and mutation tests detect removal of any
  candidate-generation branch.
- Post-experiment obligation expansion detects omitted dynamically discovered subjects.
- Completeness is independently recomputed from explicit obligations, not accepted from a
  runner flag.
- Cross-target, cross-state, pre/post-consent, and cross-action support references fail.
- A runner-completed experiment with failed applicability cannot authorize a verdict.
- Runner measurement-validity fixtures independently test each typed outcome flag.

### 3.0-B: Automatic Scheduler and Agent Escalation Planner

The deterministic scheduler handles all Level 1 and Level 2 candidates. The agent planner
receives only Level 3 candidates where selecting a recipe, setup, target scope, or priority
requires contextual understanding. It does not invent experiments.

Deterministic scheduler responsibilities:

- schedule mandatory cheap/safe experiments;
- apply role/evidence-triggered recipes;
- deduplicate equivalent requests;
- enforce per-page and risk budgets;
- identify candidates that remain ambiguous and are eligible for agent escalation.

Planner inputs:

- Level 3 candidate ID, missing evidence, allowed experiment IDs;
- baseline evidence summary;
- unresolved contextual choices such as plausible recipe, scope, or prerequisite setup;
- expected information gain;
- estimated runtime/risk;
- remaining page budget.
- Page-authored instructions explicitly labelled as untrusted observations, never commands.

Planner output:

- selected experiment ID;
- target candidate;
- catalog-bounded setup/scope choices;
- short reason;
- optional choice among catalog-defined modes.

Recommended policy:

```text
schedule automatically when:
  applicability and recipe are mechanically clear
  AND experiment is safe and within the automatic budget

ask the agent when:
  the experiment could resolve an important candidate
  AND recipe/scope/setup/priority requires contextual understanding

run an agent-selected experiment when:
  expected verdict impact is high
  AND experiment can positively resolve the missing evidence
  AND cost/risk fits the remaining budget

after selection:
  independently validate the selected recipe's catalog applicability
  AND bind it to the exact target/state/action scope
  ELSE abstain and retain PARTIAL
```

Pitfalls:

- The planner repeatedly selects redundant experiments.
- High-cost candidates starve simpler high-value cases.
- Prompt injection from page text influences experiment selection.
- A wrong catalog-valid recipe produces trusted but irrelevant evidence.
- The planner treats experiment selection as evidence of the outcome.
- Mechanically obvious experiments are routed through the planner, increasing cost without
  improving evidence.

Testing focus:

- Fixed candidate sets produce budget-respecting plans.
- Level 1 and Level 2 plans are identical without any agent call.
- Page text cannot introduce non-catalog experiment IDs or parameters.
- Misleading advised-key/role text cannot bypass independent applicability checks.
- Counterfactual pages differing only in adversarial text cannot change an authoritative
  verdict; applicability predicates cannot depend on the same untrusted text used for
  selection.
- Redundant requests are deduplicated.
- Agent plans can target only catalog-declared Level 3 candidates.
- Planner abstains when no experiment can resolve the missing evidence.
- Replay tests compare plan stability and information gain.

### 3.0-C: High-Impact Pre-Planned Experiments

Default selection routing:

| Experiment | Default selection | Agent escalation scenario |
|---|---|---|
| Focus visual retry | Level 1 mandatory automatic | None; unresolved result remains partial |
| Pixel contrast follow-up | Level 1 mandatory automatic | Semantic interpretation such as color-only meaning, not pixel measurement |
| Activation AX/visible differential | Level 2 conditional automatic | Deferred initially; unclear activation/setup remains partial |
| Role-based keyboard recipe | Level 2 when role/pattern is reliable | Deferred initially; unclear role/pattern remains partial |
| Modal focus/return | Level 2 after a dialog is observed | Ambiguous component boundary or advised non-standard exit |
| Form invalid submit | Level 2 for safe native constraints | Deferred initially; unknown business rule/setup remains partial |
| Consent two-state | Phase 4, Level 2 only when a safe consent action is mechanically identified | Deferred until the two-state experiment is proven |

#### C1. Activation AX and Visible-State Differential

Purpose:

- Resolve genuine 4.1.3 status-message candidates.
- Capture role/name/state changes for 4.1.2.
- Detect dialog appearance and accessible exposure.

Method:

1. Reload and locate target.
2. Capture focused AX subtree, relevant live regions, visible text regions, focus, and
   screenshot.
3. Activate with trusted input.
4. Wait for bounded mutation/settling window.
5. Capture the same evidence channels and compute a typed differential.

Likely impact:

- Highest impact on announcement uncertainty.
- Can turn an observed status instance into an authoritative observation when visibility, status
  semantics, and programmatic exposure are positively established.
- Absence within one activation/window does not establish `wcagApplicability:INAPPLICABLE`;
  4.1.3 inapplicability is
  `open-scope-never-clearable` for ordinary markup applications. Only a separately proven
  finite inapplicability condition, such as non-markup content, may authorize it.

Reuse:

- CDP Accessibility tree methods/events.
- Playwright-style ARIA snapshot representation is a useful model, though the current
  Puppeteer/CDP stack can implement this without a framework migration.

Selection:

- Level 2 automatic when baseline evidence shows a relevant activation plus any visible,
  DOM, live-region, AX, busy/progress, or removal mutation that could contain a status.
- Ambiguous prerequisite choices or target/scope remain `PARTIAL` initially; general Level 3
  escalation is deferred until its long-tail value and precision are demonstrated.

Pitfalls:

- Animation or unrelated background updates mistaken for status messages.
- A typed differential does not determine whether the change meets the status-message
  definition rather than being a state change, dialog, or change of context.
- AX-tree change proves exposure, not actual announcement by every AT.
- AX exposure can support programmatic determinability for the observed instance, but does
  not prove cross-AT perception or all possible states.
- Status text appears outside the selected subtree.
- Long-delayed updates exceed the settle window.
- A late-arriving programmatic exposure can flip a `BARRIER_OBSERVED`-by-non-exposure to
  conformant. Concluding non-exposure requires a "no further AX mutation pending" settle check
  or a secondary extended window — symmetric to the guard that a bounded window must not
  authorize inapplicability.

Testing focus:

- Visible status with no AX exposure.
- Proper `role=status`/live-region update.
- State-only toggle that is not a status message.
- Search-result/content rerender that is not a status message.
- Unexposed DOM status message with little or no visible pixel change.
- Dialog opening that moves focus.
- Unrelated timer/content mutation.
- `aria-live="off"` and `display:none` changes.
- Delayed update just inside/outside the observation window; timeout must not authorize
  inapplicability.
- Delayed AX exposure arriving after the first window but before settle must not yield a false
  `BARRIER_OBSERVED`-by-non-exposure.

#### C2. Focus Visual Retry and Stabilization

Purpose:

- Resolve `focusIndicator.present:null`.
- Reduce off-target/blank crop and animation uncertainty.

Method:

1. Reload and scroll target into a stable central viewport location.
2. Capture multiple baseline frames and detect animation/caret noise.
3. Reach target through real keyboard input.
4. Validate target identity and crop overlap after focus.
5. Capture multiple focused frames.
6. Run spatial/perimeter diff and computed focus-dependence corroboration.

Directional support:

- A stable, focus-dependent change may support `NO_BARRIER_OBSERVED` only when it is obviously
  visible and attributable as a focus indicator; otherwise it requires adjudication.
- A stable absence after validated real-keyboard focus is evidence toward
  `BARRIER_OBSERVED`, but cannot authorize a 2.4.7 failure without a finite mode-completeness
  predicate AND a passed hydration/readiness check (JS-applied focus styling — CSS-in-JS,
  `:focus-visible` polyfills, runtime classes — may simply not have loaded); otherwise it
  remains `PARTIAL`.
- Both 2.4.7 directions require the target to be reached by real sequential keyboard
  navigation in the tested state (`keyboardReachableInState`, Rule 14); a target a keyboard
  user cannot reach is not cleared and not failed here — it remains `PARTIAL`.
- A focused text-entry caret may itself be an indicator; distinguish it from unrelated
  blinking noise. Other noise, movement, forced-focus-only styling, or invalid crop remains
  `PARTIAL`.

Likely impact:

- Very high; focus visibility is the largest existing partial category.

Reuse:

- Existing focus spatial analysis and screenshots.
- Generic screenshot/image-diff libraries may help, but the normative decision logic
  remains harness-specific.

Selection:

- Level 1 automatic whenever baseline focus evidence is explicitly indeterminate or its
  crop is invalid.

Pitfalls:

- Scrolling changes sticky layouts or focus order.
- Focus causes target movement.
- Carets, animations, and loading indicators create false diffs.
- Forced focus styling is mistaken for real keyboard styling.
- A focus retry measures a different sticky-layout/obscuration state than the original.

Testing focus:

- Thin ring on large control.
- Always-on shadow.
- Animated control.
- blinking caret.
- focus-induced layout shift.
- clipped/off-screen control.
- JS-created focus class that forced `:focus-visible` misses.
- JS focus styling that fails to load on an under-hydrated snapshot must not yield a false
  2.4.7 `BARRIER_OBSERVED`.
- target reachable only via real keyboard navigation; an unreachable target cannot clear or
  fail 2.4.7.

#### C3. Contrast Resolution Follow-Up

Purpose:

- Resolve unreliable computed/composited contrast evidence without treating antialiased
  glyph pixels as the normative 1.4.3 colors.

Method:

- For 1.4.3, use rendering/pixels to identify compositing and background candidates, then
  resolve foreground/background colors from the user agent or underlying markup/styles and
  calculate the ratio. Do not calculate from antialiased glyph pixels.
- Define separate 1.4.11 logic that identifies the required visual component/state and its
  adjacent colors.
- Emit ambiguity whenever the relevant pair or component cannot be established.

Directional support:

- Definite pass/fail requires an unambiguous SC-appropriate color/component pair.
- Multiple plausible pairs, gradients, images, or unstable samples remain `PARTIAL`; a
  confidence label alone cannot authorize a pass.

Likely impact:

- Moderate-to-high; resolves contrast partials and protects uncertain existing passes.

Reuse:

- Existing repository implementation.
- Axe color-contrast checks and incomplete/review-item model provide mature reference
  behavior.

Selection:

- Level 1 automatic whenever `needsPixelContrast:true` or equivalent deterministic
  ambiguity flags are present.

Pitfalls:

- Anti-aliasing, gradients, transparency, text shadows, and images.
- Crop contains multiple unrelated text/background pairs.
- Sampling the apparent color rather than the author-intended text/background relationship.

Testing focus:

- Solid text/background.
- gradients and images;
- translucent overlays;
- text in differently colored child;
- antialiased small text;
- multiple colors in one crop.

#### C4. Role-Based Keyboard Interaction Recipes

Purpose:

- Measure named-function keyboard operability without confusing APG convention adherence
  with WCAG 2.1.1.

Initial recipes:

- button/link: Enter and Space as appropriate;
- checkbox/switch: Space toggles state;
- tabs: arrow navigation and selected-state movement;
- menu/menuitem: arrows, Enter/Space, Escape;
- combobox/listbox: open, arrow, select, Escape;
- disclosure: Enter/Space changes expanded state;
- dialog: initial focus, Tab containment, Escape/close, focus return.

Each recipe compares visible, DOM, AX-state, focus, URL, and announcement outcomes.

Directional support:

- Every 2.1.1 claim names the function being tested.
- `NO_BARRIER_OBSERVED` requires an observed keyboard method that performs that function and
  any required exposed-state transition.
- `BARRIER_OBSERVED` requires evidence that the named function has no available keyboard
  method within the finite tested function scope. Failure of one APG-recommended key alone is
  only a pattern-quality observation.
- A fired key event, unrelated change, uncertain role, or under-hydrated page remains
  `PARTIAL`.
- The target must be reached by real sequential keyboard navigation in the tested state
  (`keyboardReachableInState`, Rule 14); an unreachable target cannot clear 2.1.1.
- The announcement channel is corroboration only and never contributes to
  `NO_BARRIER_OBSERVED`. Any sub-claim that depends on it is `accessibilitySupportDependent`,
  carries a declared AT baseline, and stays environment-scoped (Rule 12); the operability clear
  itself rests on in-browser functional outcome plus required exposed-state.

Likely impact:

- High for keyboard/focus partials and unsupported custom-widget claims.

Reuse:

- WAI-ARIA Authoring Practices and ARIA-AT test assertions provide strong recipe and
  expected-behavior references.
- Browser automation already supplies trusted keyboard input.

Selection:

- Level 2 automatic when a reliable native/ARIA role selects one recipe.
- Missing, conflicting, or multiply plausible roles remain `PARTIAL` initially; planner
  selection beyond the narrow Phase 2 advised-exit case is deferred.

Pitfalls:

- Role does not imply the exact intended function.
- Composite widgets use application-specific key models.
- A key changes an unrelated page state.
- Offline snapshots are not hydrated enough to respond.
- Wrong recipe selection produces trusted but irrelevant evidence.

Testing focus:

- One fixture per APG pattern plus deliberately broken variants.
- Roving tabindex.
- nested composites;
- disabled/read-only states;
- key response without functional outcome;
- functional outcome without correct exposed state.

#### C5. Modal, Trap, and Advised-Exit Experiment

Purpose:

- Resolve indeterminate traps and non-standard advised exits.

Method:

- Identify the suspected component and reachable focus routes.
- Try standard exits.
- Extract only catalog-supported advised key combinations from nearby instructions.
- Exercise the advised key with trusted input.
- Verify that focus actually exits the component.

Directional support:

- A demonstrated trap may support `BARRIER_OBSERVED` only after exhausting catalog-defined
  standard exits and every applicable advised method; unknown routes remain `PARTIAL`.
- Clearing a trap requires the tested exit to be applicable and focus to reach a valid
  outside target; arbitrary movement or browser wraparound is insufficient.

Initial focus, Escape-to-close, and trigger-focus return are recorded as deterministic
behavior/APG-quality evidence. They map to 2.4.3 or 2.1.1 only when a separate SC-specific
applicability/harm predicate is positively established.

Likely impact:

- Moderate, but high severity for the findings affected.

Selection:

- Level 2 automatic for an observed dialog with standard exit/focus-return checks.
- Level 3 for ambiguous component boundaries or when nearby instructions suggest a
  non-standard exit key that must be interpreted and selected.

Pitfalls:

- Instructions mention a key for an unrelated function.
- Focus exits visually but remains inside the semantic component.
- Component boundaries are ambiguous.
- Experiment mistakes browser wraparound for a demonstrated page escape.

Testing focus:

- Escape-released modal.
- advised F6/Control+key exit that works and one that does not;
- unrelated instructional text;
- whole-page wraparound;
- stopImmediatePropagation and dynamic focus routes.

#### C6. Controlled Form Error Experiment

Purpose:

- Resolve explicitly demonstrated error-identification and error-suggestion uncertainty.

Method:

- Generate safe invalid cases from native constraints and catalog-defined value classes.
- Submit with trusted input.
- Capture validity, validation messages, visible text, focus, AX differential, and
  announcements per field.

Directional support:

- Native/catalog-defined invalid cases may support definite results for the bound field and
  constraint.
- Unknown business-rule coverage, side effects, or field attribution ambiguity remains
  `PARTIAL`.

Likely impact:

- Moderate count, potentially material correction of 3.3.1 findings.

The experiment does not generally determine whether initial labels/instructions satisfy
3.3.2; that remains a separate claim.

Selection:

- Level 2 automatic for safe native constraints and blocked/navigation-suppressed submit.
- Business-context invalid input or prerequisite setup remains `PARTIAL` until a later
  planner expansion earns authority.

Pitfalls:

- Submission has real side effects.
- Unknown business rules make generated values meaningless.
- Multi-step or server-dependent validation.
- One field's error is incorrectly attributed to another.

Testing focus:

- Native required validation.
- custom visible error;
- live-announced error;
- unidentified invalid state;
- multiple fields;
- skipped/hidden forms;
- destructive-submit blocking.

#### C7. Consent Two-State Experiment

Purpose:

- Replace the current static consent inventory with evidence from both visible and
  dismissed states.

Method:

- Baseline with consent present: axe, structure, keyboard/focus, controls.
- Exercise consent controls when safely identifiable.
- Reload and create the dismissed state in isolation.
- Repeat the main pass and compare.

Likely impact:

- Moderate; prevents overlays from being either silently ignored or allowed to pollute the
  main-page evaluation.

Selection:

- Level 2 only when a safe, mechanically identified accept/reject/dismiss control exists.
- Level 3 when the overlay has multiple ambiguous customization paths or consent identity
  is uncertain.

Pitfalls:

- Dismiss/accept changes persistent storage or privacy choice.
- Selectors match non-consent dialogs.
- The dismissed state cannot be reproduced deterministically.

Testing focus:

- nested/multi-selector banners;
- accept/reject/customize flows;
- keyboard reachability;
- focus trap;
- persistence across reload;
- main-page differences after dismissal.

#### C8. Reflow Information/Function Experiment

Purpose:

- Measure 1.4.10 behavior at the required viewport without equating overflow alone with a
  failure or a clean viewport with global conformance.

Method and support:

- Measure horizontal/vertical scrolling, clipped or unreachable content, and lost
  functionality at the required width/zoom scope.
- `BARRIER_OBSERVED` requires demonstrated information/function loss or prohibited
  two-dimensional scrolling.
- Two-dimensional-layout exceptions remain separately adjudicated; a quiet measured state
  does not clear untested states.

Testing includes clipped controls/text, intentionally two-dimensional content, sticky
overlays, lazy content, and zoom/viewport variants.

#### C9. Content on Hover or Focus Experiment

Purpose:

- Resolve bounded 1.4.13 claims only after additional content is positively observed.

Method and support:

- Trigger additional content independently by pointer hover and keyboard focus where
  applicable, then test dismissibility, hoverability, and persistence.
- Bind the claim to the trigger/content pair and tested state; absence of additional content
  in one probe does not establish inapplicability.
- Exceptions and ambiguous trigger/content identity remain `PARTIAL`.

Testing includes tooltips, menus, focus-only content, pointer-only content, Escape dismissal,
pointer movement onto content, persistence, and unrelated mutations.

### 3.0-D: Structured Semantic Judgment Skills

Semantic skills help the LLM resolve obvious meaning/purpose questions. They should be
designed as bounded classification procedures, not open-ended opinions. In the initial 3.0
release, subjective semantic outputs are non-authoritative: they retain `PARTIAL` and add an
adjudication recommendation. A rubric may authorize observations only after passing a
blocking, both-direction precision threshold on the gold benchmark.

First split every proposed semantic rubric into:

- a measurable core moved to deterministic collection/experiments, such as empty/generic
  names, target geometry/spacing, author-sized versus default UA controls, matching
  destinations as non-authoritative evidence, and presence of candidate equivalent controls;
  and
- an irreducibly contextual residue, such as purpose adequacy, essential presentation,
  heading function, or reading-order harm.

For 2.5.8, model all five disjunctive exceptions separately:

| Exception | Initial treatment |
|---|---|
| Spacing | Deterministic circle-to-pointer-hit-region geometry after hit-region verification |
| Equivalent | Candidate identity and alternative hit-region conformance measured; same-function claim remains semantic/adjudicated |
| Inline | Model “in a sentence” and “size constrained by line-height of non-target text” separately; semantic boundary may require adjudication |
| User agent control | Deterministic only when default UA sizing and no author modification are demonstrated |
| Essential | Semantic/adjudication only |

Refuting one exception never proves a violation because another disjunctive exception may
still apply.

DOM or visible bounding boxes do not necessarily equal the region accepting pointer input.
No 2.5.8 size/spacing/equivalent geometry earns definite authority until pointer hit-region
verification is implemented; otherwise geometry remains evidence for `PARTIAL`.

Initial semantic rubrics:

1. **Accessible-name purpose adequacy**
   - Is the computed name consistent with visible label and nearby context?
   - Empty/whitespace and other mechanically defined cases move to deterministic evidence;
     purpose adequacy remains non-definite until calibrated.
2. **Link purpose from context**
   - Can purpose be determined from the link plus programmatically associated context?
3. **Visual heading versus semantic heading**
   - Is visually heading-like text clearly functioning as a heading?
4. **Grouping and reading-order harm**
   - Does the measured sequence change meaning or operability?
5. **Target-size inline exception**
   - Is the target genuinely within a sentence or constrained text block?
6. **Equivalent target purpose**
   - Do two targets perform the same function and reach the same outcome?
7. **Essential target presentation**
   - Is the exact size/position essential to the information or activity?
8. **Alternative-text purpose**
   - Does the name communicate the image/control's apparent purpose?
9. **Adequacy of unusual keyboard-exit instructions**
   - Are instructions discoverable, associated, and clear enough?

Suggested layout:

```text
skills/semantic/
  README.md
  accessible-name-purpose.md
  link-purpose-context.md
  visual-heading-semantics.md
  reading-order-harm.md
  target-inline-exception.md
  target-equivalent-purpose.md
  target-essential-purpose.md
  alternative-text-purpose.md
  advised-exit-adequacy.md
```

Every semantic skill must require:

- a compact evidence packet;
- a fixed rubric and allowed claims;
- cited evidence references;
- explicit counterevidence;
- confidence enum;
- a reason;
- an `unresolved` option.
- complete execution provenance: model/version, system-prompt and skill digests,
  evidence-packet digest, inference settings, and attempt ID.

Suggested confidence policy:

```text
high:
  obvious issue, rubric preconditions satisfied, no material counterevidence

medium:
  plausible but context/purpose remains uncertain → PARTIAL

low/unresolved:
  insufficient evidence → PARTIAL
```

No subjective semantic rubric authorizes an observation initially. Narrow rubrics can
earn that authority individually after passing the Phase 3 gate; broader semantic judgments
remain `PARTIAL` or require adjudication.

Integration:

- Store semantic outputs in `judgments.json`, separate from `experiments.json`.
- Initially add semantic recommendations to the adjudication queue, not authoritative
  records. After a rubric earns authority, add `basis:"semantic-judgment"` and `judgmentRef`.
- Builder validates rubric IDs, evidence references, confidence, and which claims each
  rubric may support.
- Any agent artifact missing complete execution provenance is non-authoritative; model,
  prompt, skill, packet-builder, or inference-setting changes require recalibration.
- Summary exposes counts by measured versus semantic basis.

Pitfalls:

- LLM overconfidence and plausible-but-wrong purpose inference.
- Page content prompt injection.
- Missing visual or broader page context.
- Inconsistent judgments between pages/models.
- Semantic verdicts becoming an escape hatch around failed experiments.
- Builder validation proving only that a rubric/evidence reference exists, not that the
  semantic claim is true.

Testing focus:

- Gold/adversarial benchmark with obvious positive, obvious negative, and ambiguous cases.
- Prompt-injection text embedded in the page.
- Counterfactual pairs differing by one relevant semantic detail.
- Inter-model and repeated-run agreement.
- Calibration: high-confidence precision must be measured separately from coverage.
- Builder rejects unsupported rubric/claim combinations and missing evidence references.

### 3.0-E: Evidence Resolver and Builder Integration

Create a single evidence resolver that combines:

```text
baseline collect evidence
+ baseline drive evidence
+ trusted experiment outcomes
+ authority-earned semantic judgments / non-authoritative recommendations
→ support predicates
```

The resolver emits first-class atomic `claims[]`. Each claim has exactly one SC assertion,
direction, action target, claim subject(s), observed region(s), parent-linked state,
environment, support set, and completeness proof. Existing element-skill verdicts and
findings become conservative derived summaries; they cannot clear merely because one child
claim did.

Each authoritative observation claim should carry machine-readable support references:

```json
{
  "claimId": "claim-17",
  "sc": "4.1.3",
  "observationOutcome": "BARRIER_OBSERVED",
  "wcagApplicability": "APPLICABLE",
  "conformanceOutcome": "NOT_ASSESSED",
  "evidence": "Visible saved message was not exposed as a status",
  "supportRefs": ["experiment:cand-17"],
  "observationScope": {
    "actionTargetRef": "node:button-1",
    "claimSubjectRefs": ["dynamic:status-1"],
    "state": "fresh-load:consent-present",
    "action": "activate-once",
    "environment": "headless-chromium"
  },
  "scopeCompletenessRef": "catalog:4.1.3/BARRIER_OBSERVED/observed-status-instance"
}
```

The builder verifies:

- the mandatory v3 bundle gate accepts and reconciles manifest, obligations, candidates,
  plans, claim proposals, collect, drive, experiments, judgments, claims, and results in both
  CLI and sweep;
- the builder-regenerated obligation ledger exactly matches all candidate dispositions;
- the independent claim-family coverage oracle and post-experiment dynamic-obligation
  expansion reconcile with the ledger;
- referenced evidence exists and matches file/run/page digest/target fingerprint/state/action;
- action targets and initial subjects exist in collector inventory; dynamic subjects carry
  typed discovery provenance; every state is parent-linked and every completion is fresh;
- for any keyboard-interaction-SC clear (2.1.1/2.4.7/2.4.3), `keyboardReachableInState` is
  positively demonstrated — collector-inventory existence is not reachability;
- experiment outcome or an authority-earned semantic rubric can directionally support that
  SC/verdict;
- the SC/direction registry explicitly declares a clearability class and, for any clearing
  verdict, all required finite scope-completeness predicates are positively satisfied;
- the published verdict carries its observation scope and does not imply page/process-level
  conformance or untested accessibility support;
- no authoritative artifact contains legacy verdict labels or legacy element-skill/page-rollup
  shapes; historical comparison reports are rejected by the authoritative bundle loader;
- derived element-skill summaries satisfy a registered aggregation-obligation resolver;
  one child claim can never clear a broader summary;
- catalog-defined applicability, coverage, readiness, trust, isolation, and completion
  requirements hold;
- no contradictory higher-authority evidence exists;
- semantic evidence does not substitute for required behavioral measurement.

Authority order:

```text
applicability proof determines whether an outcome is relevant
typed trusted measurement establishes measured outcome facts
authority-earned narrow semantic judgment establishes only its allowed semantic predicate
non-authoritative recommendation / narrative cannot authorize a claim
```

These evidence types answer different predicates rather than forming a universal hierarchy.
The resolver searches all applicable evidence, not only cited support references, and emits a
conflict-closure record. Applicability uncertainty or any unexplained conflict produces
`PARTIAL`.

Pitfalls:

- Conflicting evidence channels.
- Agent references a valid experiment performed on the wrong target/state.
- A valid experiment is cited outside its action or observation-window scope.
- Baseline and experiment disagree on a nondeterministic page and the resolver silently
  chooses one.
- An observation-scoped non-reproduction is published as a global pass.
- An omitted clearability/completeness rule silently authorizes clearing.
- A single child claim clears an element-skill summary with unresolved sibling obligations.
- Dedup merges findings with different support bases.
- Old artifacts silently validate against new contracts.

Testing focus:

- Cross-target, cross-page, stale-run, and duplicate-reference attacks.
- Cross-state/action/window and consent-present/dismissed reference attacks.
- Contradictory experiment versus semantic evidence.
- Missing/failed experiment cannot support an authoritative observation.
- Deterministic rebuilding independent of evidence ordering.
- Single-child-clearing and omitted-sibling aggregation counterexamples.
- Legacy verdict labels, legacy element-skill/page-rollup shapes, and historical comparison
  reports presented as authoritative artifacts must fail closed.
- A keyboard-SC clear on a target unreachable by keyboard (upstream trap/tabindex) is rejected.
- Schema migration/version rejection.

### 3.0-F: Orchestrator, Budgets, and Replay

Add an orchestrator CLI:

```text
run-evaluation.js
  collect
  baseline drive
  generate candidates
  schedule automatic experiments
  request agent plan only for eligible Level 3 candidates
  merge + validate experiment plan
  run experiments
  request semantic judgments
  build + validate results
```

Required controls:

- page and experiment wall-clock budgets;
- maximum mutating experiments;
- risk classes (`read-only`, `local-mutation`, `navigation-risk`, `destructive-blocked`);
- retries with explicit attempt records;
- deterministic artifact directories;
- resume/replay from artifacts;
- no silent fallback when a stage fails;
- readiness/capability checks before mutation;
- browser/environment scope recorded with every outcome;
- isolation batches only for experiments whose catalog-declared risk class permits sharing.

Pitfalls:

- Runtime and browser-resource explosion.
- Retried experiments produce inconsistent states.
- Parallel experiments interfere through storage or server state.
- Partial runs appear complete.

Testing focus:

- Crash/resume at every stage.
- Budget exhaustion produces explicit unresolved candidates.
- Timeout, readiness failure, and browser-specific evidence cannot clear a candidate.
- Parallel page isolation.
- Replay produces the same builder decision from frozen artifacts. Replay re-runs only the
  deterministic builder/resolver over frozen agent outputs; planner and semantic-skill outputs
  are treated as frozen evidence inputs and are not assumed bit-reproducible even at
  temperature 0 (a model/prompt/skill change invalidates calibration, per Authority Rollout).
- Missing stage/artifact fails closed.

### 3.0-G: Metrics and Adjudication Queue

Track whether 3.0 actually improves accuracy rather than merely reducing `PARTIAL`.

Metrics:

- baseline partials and final partials by skill/reason;
- experiments scheduled/run/completed/resolved by selection source
  (`mandatory-automatic`, `conditional-automatic`, `agent-selected`);
- percentage of candidates resolved without an agent planner call;
- resolution direction: `PARTIAL→BARRIER_OBSERVED`, `PARTIAL→NO_BARRIER_OBSERVED`,
  `PARTIAL→INAPPLICABLE`;
- hand-adjudicated precision/recall separately for each transition direction;
- false-clearance rate from sampled `NO_BARRIER_OBSERVED` and `INAPPLICABLE` claims;
- failure recall/false-negative rate from independently labelled candidates regardless of
  harness output, including `PARTIAL`;
- false-positive rate from sampled `BARRIER_OBSERVED` claims, including trap/interference and
  any result influenced by safe-direction defaults;
- results by browser/environment, evidence scope, and difficulty;
- semantic judgment coverage and high-confidence precision;
- experiment runtime and failure rate;
- contradictions between evidence channels;
- manual adjudication agreement;
- planner recipe/applicability disagreement rate;
- repeated-run and cross-browser disagreement;
- findings by basis: measured, semantic, partial.
- the full selective-classification matrix with gold labels as rows and
  `BARRIER_OBSERVED`/`NO_BARRIER_OBSERVED`/`INAPPLICABLE`/`PARTIAL` as columns, stratified by
  `scopeCompletenessRef` and clearability class — never a scope-free flat count or unsupported
  page/process conformance rollup;
- every eligible candidate's scheduling probability, priority, budget exclusion, and final
  disposition, enabling population-weighted and per-difficulty estimates.

Generate an adjudication queue for unresolved or conflicting cases, sorted by severity,
impact, and uncertainty.

Sample resolved passes/NAs and reproduced failures deliberately. Reviewing only failures
misses stealthy clears; reviewing only clears misses high-impact false trap/interference
findings and safe-default bias.

Pitfalls:

- Optimizing for partial-reduction encourages overconfident conclusions.
- Dedup hides the number of affected elements.
- Easy cases dominate metrics while severe unresolved cases remain.
- Correlated examples or repeated fixture families make confidence intervals look stronger
  than the independent evidence supports.

Testing focus:

- Metrics are derived, not agent-authored.
- Preserve both sub-verdict and deduped-defect denominators.
- Accuracy/precision gates accompany coverage targets.
- Promotion precision is reported independently from partial-reduction.
- False-clearance, failure recall, abstention, and coverage are separately gated overall and
  within pre-registered difficulty strata.

## Authority Rollout and Drift

Every new mechanism progresses through:

1. **Shadow mode:** proposed definite results remain `PARTIAL` and are independently audited.
2. **Canary authority:** a bounded page subset receives scoped authority after the sealed
   promotion test passes.
3. **General authority:** only after canary error bounds and non-inferiority gates pass.
4. **Continuous audit:** periodically sample every verdict direction and deferred candidates.

Roll back authority on any critical false clear, prompt-injection-induced authoritative
verdict change, confidence-bound breach, or unexplained drift. Browser, model, catalog,
runner, predicate, prompt, skill, and packet-builder changes invalidate affected calibration
and return the mechanism to shadow mode. Browser-sensitive results either remain explicitly
environment-scoped or require corroboration in a second independent environment.

## Phased Delivery

### Phase 0: Contracts and Gold Benchmark (Blocking)

Deliver:

- complete v3 run-manifest, obligation-ledger, claim-proposal, claim, experiment, judgment,
  and results contracts;
- one mandatory v3 bundle loader used by CLI and sweep; legacy verdict/result artifacts and
  historical comparison reports are rejected;
- a separate non-authoritative historical comparison tool and report contract that cannot
  enter the v3 bundle;
- trusted-orchestrator manifest provenance binding and artifact-lineage verification
  (cryptographic attestation only if a tampering/code-execution adversary is in scope, per
  Rule 17; otherwise a protected execution boundary plus identity/digest binding);
- independent claim-family coverage registry, post-experiment obligation expansion, and
  mutation tests for omitted generation branches;
- aggregation-obligation registry/resolver with single-child-clearing counterexamples;
- catalog-defined directional support/applicability registry, including an
  `accessibilitySupportDependent` classification per SC/verdict direction;
- schema-validated clearability/completeness registry for every SC/verdict direction, each
  clearing direction carrying an analytic completeness-derivation document and
  body-mutation tests proving the obligation set is sound;
- extended shared `crossArtifactErrors()` for the complete evidence bundle;
- hand-adjudicated gold benchmark per skill with both-direction labels, per-mechanism sizing
  worksheets, and a real-AT labelling plan — or a documented decision to scope 3.0 clears to
  `accessibilitySupportDependent:false` SCs;
- adversarial, prompt-injection, wrong-target/state, incomplete-coverage, and constructed
  worst-case state-combination fixtures;
- frozen initial-corpus metrics (for analysis-only coverage/throughput comparison,
  not as the clearing/trap non-inferiority anchor).

Exit gate:

- Every atomic claim obligation has exactly one builder-reconciled disposition.
- No experiment or judgment can authorize an observation without a registered
  directional support predicate, applicability proof, scoped evidence reference, and passing
  cross-artifact identity.
- No clearing verdict can publish without an explicit closed finite completeness rule whose
  obligation set is proven sound by body-mutation tests; a missing rule rejects rather than
  defaults.
- Authoritative v3 output contains no legacy verdict labels or legacy result shapes; the
  bundle loader rejects historical comparison reports.
- The gold benchmark exists before any new mechanism earns authority.
- Phase completion alone never grants authority; every mechanism must separately pass the
  pre-registered sealed-test, simultaneous confidence-bound, non-inferiority, and rollout
  gates.

### Phase 1: Deterministic Spine

Deliver:

- a vertical walking-skeleton slice FIRST — focus visual retry (largest category,
  `accessibilitySupportDependent:false`) end-to-end through the full gate (candidate →
  experiment → directional support → completeness → v3 claims/results → metrics) — to validate
  the architecture before the remaining registries and mechanisms are completed; the Phase 0
  infrastructure and this slice are co-developed, not strictly sequenced;
- collapsed deterministic candidate/Level 1/Level 2 plan generator;
- activation AX/visible differential;
- SC-specific contrast resolution;
- controlled form submit;
- builder evidence references;
- runner batching by catalog-declared isolation class;
- readiness, environment-scope, retry, and conflict handling;
- after authorized mechanisms pass their gates, generate a fresh v3 corpus, fully adjudicate
  its authoritative clearing and high-impact trap/interference claims, then freeze it;
- separately compare the fresh v3 corpus with the frozen initial corpus using the
  non-authoritative historical comparison tool.

Expected effect:

- Largest immediate reduction in announcement, focus, contrast, and form uncertainty.

Exit gate:

- Adversarial fixtures green;
- clear candidates are selected and executed without an agent call;
- measured precision meets the pre-registered threshold separately for reproduced and cleared
  verdicts;
- sealed-test non-inferiority and independently sampled error-bound gates pass.
- Phase exit does not bypass shadow/canary/general-authority rollout.

### Phase 2: Keyboard Recipes and Narrow Contextual Escalation

Deliver:

- role-based keyboard recipes;
- modal/trap/advised-exit experiment;
- budgeted Level 3 agent experiment planner initially limited to advised-exit and component-
  scope selection;
- plan-merger support for optional validated agent requests;
- orchestrator and replay.

Exit gate:

- Planner cannot escape the allowlist;
- planner receives only catalog-declared Level 3 candidates;
- selected recipes pass independent applicability checks;
- misleading page text cannot inject or validate a recipe;
- automatic scheduling remains deterministic without a planner;
- experiments are isolated and repeatable;
- keyboard/focus resolutions agree with adjudicated fixtures.

### Phase 3: Narrow Semantic Skills, Non-Definite First

Deliver:

- measurable portions of proposed rubrics moved to deterministic evidence;
- initial narrow subjective rubrics as adjudication recommendations;
- judgments artifact and builder validation;
- semantic calibration benchmark;
- measured-versus-semantic reporting.

Exit gate:

- Subjective judgments cannot authorize observations before their individual rubric
  passes the defined both-direction precision threshold;
- Any rubric promoted to definite authority meets that threshold;
- ambiguous cases reliably remain unresolved/PARTIAL;
- prompt-injection and counterexample tests pass.
- Phase exit does not itself promote any rubric; sealed-test and rollout gates still apply.

### Phase 4: Broader States and Optimization

Deliver:

- consent two-state evaluation;
- adaptive pointer hit-region testing, required before any 2.5.8 geometry earns authority;
- second static engine/ACT-rule reconciliation;
- experiment prioritization tuned from metrics;
- general Level 3 planner only if the measured long-tail benefit justifies its risk.

Exit gate:

- Demonstrated accuracy improvement and acceptable runtime on the full corpus.

## Recommended 3.0 Scope Boundary

Include in 3.0:

- automatic Level 1/Level 2 experiment scheduling;
- narrowly bounded Level 3 agent experiment selection for demonstrated contextual cases;
- trusted pre-planned experiments;
- narrow structured semantic skills as non-definite adjudication aids until calibrated;
- support-reference builder integration;
- orchestration, replay, and metrics.

Do not make a 3.0 requirement:

- unrestricted autonomous browsing or arbitrary agent-authored browser scripts;
- generic exhaustive state-machine exploration;
- definite automation of inherently subjective semantic exceptions;
- actual cross-screen-reader announcement conformance for arbitrary pages.

Those may be later research tracks. The practical 3.0 win is a disciplined escalation
system:

```text
baseline uncertainty
  → deterministic scheduler runs clear safe experiments
  → agent selects only when recipe/scope/setup/priority is context-dependent
  → independently validate applicability and bind exact target/state/action scope
  → deterministic outcome or non-authoritative semantic recommendation
  → authoritative observation only when directionally supported by an authority-earned mechanism
  → otherwise honest PARTIAL + adjudication queue
```

## Reference Mechanisms

- [Chrome DevTools Protocol Accessibility domain](https://chromedevtools.github.io/devtools-protocol/tot/Accessibility/)
- [Playwright ARIA snapshots](https://playwright.dev/docs/aria-snapshots)
- [axe-core API and result model](https://www.deque.com/axe/core-documentation/api-documentation/)
- [W3C ACT Rules](https://www.w3.org/WAI/standards-guidelines/act/rules/)
- [W3C ARIA-AT](https://github.com/w3c/aria-at)
- [IBM Equal Access Accessibility Checker](https://github.com/IBMa/equal-access)
