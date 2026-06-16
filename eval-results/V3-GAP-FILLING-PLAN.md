# Harness 3.0 — Plan to Fill the Gaps to Full v3

The fourth-pass audit is right: the current build is a **partial deterministic v3 spine** with a hard
publication boundary, not the completed Harness 3.0. This document plans the remaining work to reach
full v3, ordered by dependency, with the **adversarial failure mode** each piece must defend against
designed in from the start. Everything below preserves the keystone invariant: **default-shadow** —
no mechanism publishes authoritative until its trust + soundness gates pass.

## Where we are

Closed (sound + tested): the publication boundary (attestation lineage, observed-page binding,
fail-closed provenance, runner-identity), the contrast/obscuration/keyboard wrong-verdict paths, and
strict per-stage schemas. **Phase-0 trust/contract foundation closed: G1 attested run-manifest (Rule
17), G2 independent coverage registry (Rule 16), G3 independent applicability (Rule 15, now with the
faithful separate-code observer).** **Build-out closed (this pass): G5 budgets (Rule 8), G6 dynamic
subjects (Rule 13), G8 agent planner (Phase 2), G9 semantic judgments (Phase 3), and the 3.3.1
error-identification experiment — all implemented, tested, and adversarially hardened (see the
hardening pass below).** Remaining: **G4** the authority benchmark — which IS the user's run-the-suite
+ manually-verify gold loop (operational, not a code gap); and **G7/G10** (AT-capability + Phase-4
broader states), explicitly out of this build-out. Default-shadow holds throughout: nothing here
publishes authoritative until its trust + benchmark gate passes.

## Status of each item

| Item | Rule / audit | Status |
|---|---|---|
| G1 attested run-manifest | 17 / H7 | **Implemented** (`manifest.js`; builder verifies; production requires) |
| G2 independent coverage registry | 16 / H8 | **Implemented** (`coverage-registry.js`; mutation-backstop test) |
| G3 independent applicability | 15 / H6 | **Implemented** — family-level gate (oracle) **plus** a separate-code structural observer (`applicability-observer.js`, da81c97) the builder agrees-gates; disagreement/absence ⇒ PARTIAL |
| G4 authority benchmark = **gold annotation pass** | 9 | **Remaining / operational** — the user's *run the v3 suite → manually verify each annotation → seal the labels → gate promotion* loop. Human adjudication (adequacy, not presence; the nine categories in WAI-COVERAGE-COMPARISON.md); AI may pre-label, never self-certify. Default-shadow until met |
| G5 budgets + risk classes | 8 | **Implemented** (`budget.js`, 56515d4) — per-experiment deadline + bounded retries + run-level cap; over-budget ⇒ deferred. Hardened this pass (upper clamps + per-attempt debit) |
| G6 dynamic subjects | 13 | **Implemented** (`dynamic-subjects.js`, 3baf652) — typed provenance + content-addressed fingerprint + deterministic expansion. Hardened this pass (expansion cap, fail-closed) |
| G7 AT capability | 12 | Not built (explicitly out of this build-out, plan #6) |
| G8 agent planner | Phase 2 | **Implemented** (`agent-planner.js`, cfa6771) — untrusted Level-3 planner behind the validating merger. Hardened this pass (crash containment) |
| G9 semantic skills | Phase 3 | **Implemented** (`judgments.js`, 4e8bae9) — non-authoritative adjudication recommendations; never publishes a clear without a calibrated, sealed rubric (uncalibrated by default) |
| #8 3.3.1 error-identification | 3.0-D | **Implemented** (`form-error-probe`, 18cf5de) — barrier-only. Soundness-fixed this pass (visible-surface before/after diff) |
| G10 broader states | Phase 4 | Not built (explicitly out of this build-out, plan #7) |

## Gap-fill hardening pass (post-build adversarial red-team)

After building G5/G6/G8/G9 + the 3.3.1 experiment, a focused adversarial red-team (3 agents, 28+
probes, real Chrome + vision) found five real defects; all are fixed + regression-tested:

1. **CRITICAL — prototype-pollution xpath fail-OPEN crash.** An xpath equal to an `Object.prototype`
   member (`__proto__`/`constructor`/`toString`/…) crashed `buildV3` with an uncaught `TypeError` in
   `obligations.aggregateElementSkill`/`bySkill` (plain `{}` maps), reachable from a dynamic subject AND
   a static collect element. `reconcile` was already null-proto-hardened (R2-L1); the two sibling maps
   were missed. **Fix:** `Object.create(null)` for both; the build now fail-closes, never throws.
2. **HIGH — 3.3.1 false barriers + a false clear.** The error-identification channel only honoured an
   aria-referenced message gated on `aria-invalid`, or any *global* live region. It false-barriered five
   real author patterns (unreferenced inline error, sibling `.error`, toast/snackbar, GOV.UK error
   summary, referenced message without `aria-invalid`) and false-cleared a real barrier whenever any
   unrelated live region held text. **Fix:** a before/after diff of visible, error-*associated* surfaces
   (references the field / live region / error-styled / error text), excluding success surfaces and
   pre-existing unchanged ones. **Vision-confirmed** on Chrome across all six vectors + the genuine
   barriers + the committed fixture (screenshots under `/tmp/c6fx/v2-*.png`).
3. **HIGH — unbounded dynamic-subject expansion (DoS).** A runner result claiming ~200k subjects
   expanded to ~1.8M obligations (~1GB) *before* any gate. **Fix:** per-result + run-level caps enforced
   *before* expansion; over-cap ⇒ fail-closed refusal.
4. **MEDIUM — run-budget overshoot + unclamped cost.** The run wall-clock cap could be overshot by
   `(retries+1)×` (debited once after the whole retry loop; `wall` computed once) and `retries`/
   `maxWallClockMs` had no upper clamp. **Fix:** recompute `wall` per attempt against the remaining run
   budget, debit each attempt, and clamp both cost bounds (`budget.js`).
5. **MEDIUM — untrusted planner crash containment.** A planner returning `requests:[null]` (or a
   scalar) crashed the deterministic merger fail-OPEN, violating the module's own "a planner that
   throws never widens the plan" contract. **Fix:** the merger drops-and-reports each non-object
   request; `planLevel3` also wraps the merge fail-closed to the un-widened plan.

Gate A (applicability observer) and Gate C (judgments) held against every attack (no boundary escape,
no false authorization, no rubber-stamp — the manifest hashes the applicability/judgments stages, so a
forged rubber-stamp is refused or shadowed).

## Threat model (what every gap-fill must resist)

1. **Forged bundle** — an attacker authors every artifact. Defence: an external trust anchor (the
   attestation key) that the attacker lacks; everything publication-influencing is bound by a MAC.
2. **Replay / cross-run** — a genuine signed artifact reused in a foreign run. Defence: bind run/page
   identity into the signed lineage; the builder recomputes and compares.
3. **Tamper** — any post-signing edit. Defence: content hashes + MAC; recompute on the builder side.
4. **Silent coverage loss** — a removed enumeration branch makes a real obligation vanish and the page
   still validates. Defence: an *independently-owned* check that fails closed on the gap.
5. **Same-source corroboration** — the thing that measures also asserts its own applicability/validity.
   Defence: a *separate* observer/derivation; require channel agreement, else INCONCLUSIVE.
6. **Universal-from-finite** — a definite verdict on a universal property from finite samples/markup.
   Defence: prove the universal (exact geometry / rendered pixels) or stay PARTIAL.

## Phase 0 completion — the trust + contract foundation (IMPLEMENTED)

These three are the audit's Recommended-Order #2/#4 and the prerequisite for trusting anything above.
All three are now implemented + tested (see the status table); the designs below are retained as the
rationale of record.

### G1 — Mandatory attested run-manifest (Rule 17 / H7) — *implemented*

**Design.** A trusted-orchestrator-finalized `run-manifest.json` is the first stage of the mandatory
bundle. It binds: `file, runId, observedPageDigest` (the runner-observed source identity),
`environment`, `catalogVersion`, `runnerVersion`, and a **content hash of every other stage artifact**
(`artifacts: { collect, drive, candidates, plan, experiments, claimProposals }`, each
`sha256(canonical(stage))`). The orchestrator signs the manifest with the trust-anchor key. The
builder, in production, **requires** the manifest and verifies: (a) the manifest MAC; (b) recomputes
each stage's content hash and compares — any mismatch refuses the build (tamper-evident bundle); (c)
`manifest.observedPageDigest === collect.pageDigest` and equals every result's signed observed digest;
(d) catalog/runner versions match the live build.

**Adversarial design.** Canonicalization uses the same `stableStringify` on both sides, so file
formatting can't change a hash. The manifest signs its content **minus its own `attestation`** (no
self-reference) and **excludes its own hash** from `artifacts`. A forger can author a self-consistent
bundle+manifest but cannot forge the manifest MAC (no key) ⇒ shadow. A frozen manifest replays
byte-identically (builder only recomputes/verifies). Absent/invalid manifest ⇒ refuse in production;
an explicit `--shadow-debug` keeps incomplete builds shadow-only.

**Subsumes** the C1 byte-domain alignment: the manifest is the single canonical place the
orchestrator records the observed page identity that every artifact is checked against.

### G2 — Independently-owned obligation-coverage registry (Rule 16 / H8) — *implemented*

**Design.** A `coverage-registry.js` declares, in a **flat declarative table authored separately** from
`oracle.familiesFor`'s imperative branches, the families that each element **surface predicate** must
yield (focusable → {focus-indicator-visible, keyboard-operable}; hasText → {text-contrast}; widget role
→ {name-role-value}; risk-gated: inModal+focusable → no-keyboard-trap; underOverlay+focusable →
focus-not-obscured; form field → field-label; hover content → hover-content; page reflow → reflow).
A builder gate `coverage.coverageErrors(collect)` computes the **expected** family set per element from
the registry and requires `familiesFor(el) ⊇ expected`; a shortfall **fails closed** ("a generation
branch is missing"). A mutation-backstop test removes a `familiesFor` branch and asserts the gate fires.

**Adversarial design.** The registry and the oracle are two **different representations** of the same
requirement (declarative table vs. fact-branches), so removing/altering one branch is caught by the
other. Documented honestly: this catches *drift and removal*, not a blind spot shared by both at
original authoring time — closing that fully needs a third source (the catalog's declared family set,
which we also cross-check) or human review; the registry is the independent enumeration Rule 16 asks
for, not a completeness proof.

### G3 — Independent applicability observation (Rule 15 / H6) — *implemented (family gate + separate-code observer)*

**Design.** Today the runner emits both the outcome *and* its applicability flags. We add an
**independent applicability corroboration**: the builder requires every authoritative claim's
`(element, family)` to be independently derived by the oracle from **raw collector facts** the runner
never produced — i.e. `oracle.familiesFor(collectElement)` must include the claim's family, as an
explicit per-claim gate (not only via obligation reconciliation). The runner's fine-grained
applicability flags remain (now tamper-evident via attestation) but are corroborated at the
family/obligation level by a derivation with no access to the measurement.

**Adversarial design.** The oracle reads structural facts (`focusable/hasText/role/isFormField/...`)
emitted by the *collector*, a different stage than the experiment runner — so a runner that fabricates
`isTextNode:true` for a non-text element cannot manufacture applicability the collector's facts don't
support. **Update (da81c97):** the faithful endpoint is now built — `applicability-observer.js` runs a
separate-code structural pass over every target *before* any experiment mutates state, and the builder
agrees-gates the runner's applicability flags against it (`observer.agreesWith`); disagreement OR a
missing observation ⇒ the claim cannot be authoritative (PARTIAL). The family-level oracle gate remains
as the second, independent corroboration. The red-team confirmed both (Gate A held against every attack).

## Phase 1 completion — precision + sealed benchmark (Rules 8, 9, 12, 13)

G5 and G6 are **implemented + hardened** (this pass). G4 is the **gold annotation pass** — the user's
operational run+verify loop, the one remaining non-excluded item. G7 is out of this build-out (#6).

- **G4 Authority benchmark = the GOLD ANNOTATION PASS (Rule 9) — the remaining item; operational, not
  a pure code gap.** It is NOT auto-built: the gold set is produced by the user's plan — *run the whole
  v3 suite over the saved sites, then **manually verify each annotation***. Human adjudication is
  required because the gold label turns on **adequacy, not presence** (is the name/structure/error
  *correct and useful?*) — precisely the "presence is machine-checkable; adequacy is human" dividing
  line and the nine WCAG-2.2 human-judgment categories already defined for the element-level annotation
  UI (see [WAI-COVERAGE-COMPARISON.md](../WAI-COVERAGE-COMPARISON.md) / `categories.json`; the existing
  sampling is 20 elements/page, ~70% AT-focusable). Vision/AI may **pre-label** to speed the review, but
  the authoritative label is the human's confirm/correct — a verdict the model must not self-certify
  (this is exactly the v3 default-shadow keystone applied to the benchmark itself). *Code half:* a sweep
  harness emits v3 annotations into a review surface; the human-verified labels are **sealed**
  (hash-pinned in the manifest provenance) so a promoter can't grow/trim the set to pass; promotion of
  each (experiment, direction) stays SHADOW until the sealed set hits the worksheet sizing AND the
  sealed-eval false-clear bound is met — `metrics.js` already refuses a bound when `unlabelledClears >
  0`. *Build:* extend `metrics.js` + `eval-results/v3-gold/` (hashed sealed sets) + the review/labeling
  surface; wire promotion gating to the bound. *Adversarial:* sealing + the unlabelled-clear refusal
  defeat a self-serving gold set; default-shadow holds until the gate passes.
- **G5 Budgets + risk classes (Rule 8) — IMPLEMENTED (`budget.js`, 56515d4; hardened this pass).**
  Per-experiment wall-clock deadline (aborts the page), bounded + clamped retries, mutation-risk class,
  and a run-level wall-clock cap; a candidate that would exceed budget is recorded as an explicit
  `deferred`/`unrun` disposition — never silently truncated or allowed to clear. Hardened this pass:
  per-attempt budget debit (no `(retries+1)×` overshoot) + upper clamps on retries/wall-clock.
- **G6 Dynamic subjects + provisional templates (Rule 13) — IMPLEMENTED (`dynamic-subjects.js`,
  3baf652; hardened this pass).** Post-action discoveries enter only with typed `viaAction` provenance
  + a content-addressed fingerprint; the builder deterministically expands their atomic obligations and
  reconciles each (discovered ⇒ auto-PARTIAL, never an authoritative clear). Hardened this pass: a
  per-result + run-level expansion cap enforced *before* expansion (fail-closed over-cap), so a hostile
  runner result can't DoS the build.
- **G7 AT baseline capability (Rule 12) — NOT BUILT (explicitly out of this build-out, plan #6).** Real
  AT-capability labels (NVDA/JAWS/VO mappings) behind the AT-dependent clears (3.3.2, 4.1.2) rather than
  a declared-baseline boolean; scopeable later per the v3 plan.

## Phase 2 — narrow agent escalation — IMPLEMENTED this pass (`agent-planner.js`, cfa6771)

- **G8 Agent planner (Level-3) — IMPLEMENTED + crash-contained this pass.** For candidates the deterministic scheduler can't resolve, a bounded
  LLM planner proposes an experiment *within the allowlisted catalog only* (Rule 2), with a typed,
  schema-validated plan the merger checks for exact candidate identity + catalog-measurable SC.
  *Adversarial:* the agent is **untrusted** — its output is a *request* the deterministic gates
  re-validate; it can never widen the operation set, forge evidence (no key), or bypass the builder.
  Prompt-injection from page content is contained because the agent only selects from the catalog and
  its plan is schema-closed. *Built:* `scheduler.js` Level-3 path + the `agent-planner.js` module; all
  evidence/attestation/publication gates unchanged. Hardened this pass: a non-object planner request is
  dropped-and-reported and the merge is fail-closed, so the untrusted planner can never crash it fail-OPEN.

## Phase 3 — semantic judgment skills — IMPLEMENTED this pass (`judgments.js`, 4e8bae9)

- **G9 Judgment artifact + skills (Rule 6, 3.0-D) — IMPLEMENTED (non-authoritative).** SCs needing meaning (alt-text adequacy, error
  identification, instructions) get a `judgments.json` produced by skill agents with explicit
  evidence + rubric refs; the builder binds judgments like experiments (claimId/sc/target/scope,
  attested, schema-closed) and never publishes a judgment-backed clear without the same trust gates.
  *Adversarial:* a judgment is untrusted text until bound to attested evidence + a sealed rubric;
  default-shadow until a judgment-specific gold/agreement gate passes. *Built:* judgment contracts +
  binding in `build-v3.js`, mirroring the experiment path. Today every judgment is a **non-authoritative
  adjudication recommendation** — rubrics ship **uncalibrated**, so a judgment can never auto-publish a
  clear; `eligibleForAuthority` flips only once a rubric is calibrated against a sealed gold set (the
  same gold-annotation-pass dependency as G4). Red-team Gate C held: no verdict/confidence, and no
  injected calibrated rubric, produced an authoritative or auto-published clear.

## Phase 4 — broader states + optimization (DESIGN; NOT built — explicitly out of this build-out, plan #7)

- **G10** Multi-state exploration (hover/focus/scroll/responsive), parent-linked state checkpoints,
  selective-classification metrics + an adjudication queue, resume/retry. Each rides the same
  manifest/attestation/contract spine.

## Sequencing + invariants

**Done:** G1→G2→G3 (trust/contract foundation), then G5 (budgets/safety), G6 (dynamic subjects), G8
(bounded untrusted agent), G9 (non-authoritative judgments), and the 3.3.1 error-identification
experiment — all built, tested, and adversarially hardened (the hardening pass above). Because every
one rides the default-shadow keystone, building G8/G9 *before* the benchmark is safe: nothing they
produce can publish authoritative until its gold/benchmark gate is met.

**Remaining (in order):** **G4 — the gold annotation pass** is the gating next step and is *operational*
(run the v3 suite over the saved sites → manually verify the annotations → seal the labels → wire
promotion to the bound); only after it is any (experiment, direction) promotable out of shadow. **G7**
(real AT capability, #6) and **G10** (Phase-4 broader states/optimization, #7) are explicitly out of
this build-out and come later.

**Invariant across all:** every producer's output is untrusted until it is attested (bound by the
trust-anchor MAC), schema-closed, identity/replay-bound, and gated by the builder; **default-shadow
holds until each mechanism's gold/benchmark gate — the human-verified gold annotation pass — is met.**
