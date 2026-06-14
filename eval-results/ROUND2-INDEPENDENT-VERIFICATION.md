# Round 2 Independent Verification

Date: 2026-06-14  
Branch: `round2-remediation`  
Inspected head: `5c1544b` (`W6 fixups 2: off-screen focus outline-change + Apple el7/el10 green`)

## Executive conclusion

Round 2 is a meaningful improvement over the prototype harness. The core normative
direction for 4.1.3, 3.3.1, 1.3.1, contrast large-text thresholds, focus-dependence,
circle-based target spacing, and AX-state collection is substantially better.

It is **not ready for corpus regeneration or publication as ground truth**. Several
workstreams marked or described as done do not meet their own definitions of done:

- **C5/W2 is not operational and does not enforce the stated result contract.**
- **C3/W4 still uses synthetic input, does not isolate every mutating probe, misses
  ordinary multi-control keyboard traps, and retains the first-focusable edge bug.**
- **H1/W5 still uses crop-area percentage rather than the promised spatial focus
  measurement, producing a confirmed false indeterminate on a visible thin outline.**
- **C4/W5 implements only part of 2.5.8 and produces both false failures and false
  exemptions.**
- **C2/H3/H4 and the counterexample suite remain materially incomplete.**

Recommendation: **no-go for W7 regeneration** until Critical and High findings below
are fixed and covered by deterministic end-to-end fixtures.

## Scope and methods

Reviewed:

- All Round 2 commits from `77fffe8` through `5c1544b`.
- `RESULT-CONTRACT.md`, `REMEDIATION-PLAN.md`, `AGENT-PLAN.md`, affected skills,
  collectors/drivers/helpers, result builder/schema, regression sweep, and tests.
- Existing 56-page prototype corpus for compatibility and contract-impact checks.
- W3C Understanding documents for
  [4.1.3](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html),
  [3.3.1](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html),
  [2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), and
  [2.4.7](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html).

Executed:

- Pure suites: current head passed **43/43** tests.
- Deterministic browser fixtures: the existing 3 evidence tests passed.
- Full documented command passed **54/54** tests with no skips in about six
  minutes. It began before the concurrent final fixup, so the current-head pure
  suites were also rerun separately.
- Regression sweep on the prototype corpus: correctly failed with **2,496
  violations over 56 pages**; this proves old-data incompatibility, not new-output
  correctness.
- Adversarial result-schema probes.
- Targeted Chrome probes for thin focus, first-focusable reachability, target-size
  exceptions/inline classification, and a two-control keyboard trap.

## Critical findings

### R2-C1 — C5 result integrity is neither complete nor operational

**Evidence**

- `buildResults()` and `validateResults()` are used only by tests and the optional
  regression sweep. No production command invokes them, and `AGENT-PLAN.md` still
  instructs the agent to write the complete `results.json`, including aggregates.
- `buildResults()` copies `pageSkills` but does not aggregate them into
  `summary.issues`, counts, or page status.
- `validateResults()` accepts:
  - missing `summary`;
  - missing `pageSkills`;
  - an issue verdict with no SC;
  - a wrong `level`;
  - a corrupted `summary.issues` list when its length happens to match;
  - missing summary cells and missing `countBasis`.
- It checks only the first SC parsed from a potentially multi-SC field.
- Advisory and AT-compat `REPRODUCED`/`PARTIAL` verdicts count as issues despite the
  contract saying only normative failures count toward an SC tally.
- The not-found dynamic invariant is deferred to the sweep, so the schema validator
  alone does not enforce the contract.

Adversarial probes confirmed every acceptance above. In the existing corpus,
**56/56 pages contain a page-level issue** (128 reproduced and 2 partial page-skill
verdicts), so ignoring `pageSkills` is not a small edge case.

**Impact**

Regenerated output can still omit page-level defects, publish wrong levels or issue
lists, and bypass validation entirely. The claim that inconsistent results are
impossible is false.

**Required fix**

Make a builder/validator CLI the only accepted output path; validate the full object
shape and exact rebuilt values; define and aggregate page findings; require one
valid SC and matching level for normative issues; enforce bucket counting rules;
and hard-gate every generated result before W7.

## High findings

### R2-H1 — Trusted input and isolation remain incomplete

`drive-page.js` reloads once per element, not before every mutating probe. Hover,
Escape, Enter, Space, arrow keys, and activation can therefore affect later probes
for the same element.

The form probe still runs `submit.click()`, `requestSubmit()`, or a synthetic
`submit` event inside `page.evaluate`. Activation also falls back to `el.click()`,
and downstream reasoning is not prohibited from relying on that fallback.

The native-presumption gate does not consume the collected `obscured` state or check
the promised pointer-only sibling condition. Thus W3's claimed dependency into the
gate is not actually wired.

### R2-H2 — Trap detection misses normal multi-control traps

The implementation defines a trap as the **same element** receiving focus
consecutively. A deterministic page that trapped Tab between `Trap A` and `Trap B`
for all 20 stops emitted:

```json
{"trapDetected":false,"lastStops":["Trap A","Trap B","Trap A","Trap B"]}
```

This is a genuine keyboard trap under 2.1.2 and directly contradicts W4's promised
component-boundary forward/backward proof.

### R2-H3 — The first-focusable local Tab fix still fails

The targeted fixture's first focusable control had `targetIndexInFocusables: 0`,
but it was reached only after Tab wrapped through the other three controls:
`stopsToReach: 3`.

Blurring the active element does not reset the browser's sequential focus navigation
starting point. This can corrupt reachability and real-keyboard focus evidence for
the first target.

### R2-H4 — Focus evidence still uses the rejected area-percentage heuristic

`focusRingDecision()` still uses a fixed `VIS = 1.5` crop-area diff threshold. The
promised changed-region geometry, thickness, and contrast measurement is absent.

A deterministic 600×100 button with a clearly rendered 1px red
`:focus-visible` outline produced:

```json
{
  "realTabDiffPct": 1.26,
  "focusedOutline": "solid 1px rgb(255, 0, 0)",
  "present": null
}
```

The fixture required by the remediation plan (`focus-thin-large`) would therefore
fail. The new `5c1544b` computed-outline fallback helps only when a real crop is
unavailable; it does not fix this valid-crop false indeterminate. It also treats a
computed line style as visible without checking color/contrast or clipping, which is
not equivalent to pixel-grounded visibility.

### R2-H5 — Target-size implementation is only partial

The circle-to-rectangle counterexample is fixed, but other normative parts of 2.5.8
are missing:

- No **Equivalent** exception.
- No **User Agent Control** exception.
- `essential` exists in the helper but is never supplied by the collector.
- The collector uses bounding boxes, so it cannot correctly assess whether a
  24×24 CSS-pixel square fits within non-rectangular targets.
- The target selector misses some real pointer targets, such as custom event-listener
  targets without one of the selected attributes.
- Neighbor collection stops at 40 candidates.
- The inline heuristic classifies any inline target whose block has 10 extra text
  characters as “in a sentence.”

The targeted browser probe confirmed both error directions:

- An unmodified 13×13 native checkbox beside another target emitted
  `passes:false`, despite the User Agent Control exception.
- An inline navigation link surrounded by navigation labels emitted
  `passes:true` via the in-sentence exception.

### R2-H6 — The form probe does not prove the promised 3.3.1 evidence

The normative skill correction is good, and the driver now records native messages
and focus. However:

- submission is synthetic;
- `submitBlocked` is inferred from the existence of an invalid field, not observed
  from an attempted submission;
- no per-field `validity.*` object is emitted;
- no screenshot of the native validation message is captured;
- no deterministic native-validation fixture exists.

Consequently, the driver cannot reliably establish the “demonstrated detected
error” required before a 3.3.1 failure or pass is asserted.

## Medium findings

### R2-M1 — VSR walk attribution remains heuristic

The walk is positioned with a synthetic `focusin` event. Speech is filtered only
when identical to the immediately preceding phrase or when it matches a small noise
pattern. The promised clear/sentinel between every stop and explicit
`attribution: uncertain` fallback are absent. There is no stale-speech fixture.

### R2-M2 — Consent is neutralized, not evaluated in two states

Selector coverage and structure filtering improved, but the harness still hides
consent UI and evaluates only the post-removal state. It does not assess the
consent-present state, which can contain real accessibility defects or alter focus
behavior. No deterministic consent fixture exists.

### R2-M3 — AX states are collected but weakly consumed

H7 collection is useful and the state fixture passed. However, the state data is
not wired into the native gate, and `name-role-state.md` still lacks a concrete
state-validation procedure. The fixture also does not test the promised role
override, obscured state, or broader AX-state set.

### R2-M4 — Normative docs retain contradictions and unenforced distinctions

- `dynamic-announcement.md` correctly scope-gates 4.1.3, but its Classify section
  still says silent “state/status changes” are reproduced.
- `AGENT-PLAN.md` calls `focusIndicator.present` authoritative even where it can be
  decided by forced/computed evidence without real-keyboard pixels.
- The normative / AT-compat / best-practice bucket split is documented but not
  enforced by the builder or validator.
- `grouping-and-reading-order.md` still treats any visually flat ungrouped set as a
  definite 1.3.1 failure without first establishing that the relationship is
  required to be programmatically determinable.

## Test-suite assessment

The suite is improved but considerably narrower than the remediation plan claims.
Only three deterministic fixture tests exist:

- basic focus dependence;
- small-near-large target geometry;
- three AX states.

Missing planned end-to-end fixtures include:

- trusted-only input and pointer behavior;
- custom keyboard failure and roving tablist;
- real trap versus wraparound;
- first-focusable;
- thin-large focus and JS-focus class;
- native form validation;
- stale VSR speech;
- target in-sentence and target exceptions;
- consent;
- schema corruption cases beyond the current small set.

The evidence suite can still skip-green when run alone if the server is absent.
The full integration suite has a loud precondition, but there is no promised
meta-test proving the run-all command executes all suites and no sweep self-test
with a known violation.

## Finding status by audit item

| Item | Status | Assessment |
|---|---|---|
| C1 4.1.3 | Partial | Core scope corrected; residual doc contradiction and no enforced routing |
| C2 3.3.1 | Partial | Rubric corrected; evidence capture/submission remains insufficient |
| C3 trusted input/isolation | Open | Synthetic form/fallback paths, per-element isolation, trap and first-focus bugs |
| C4 2.5.8 | Partial | Main spacing geometry fixed; exceptions, shape, target discovery, inline proof incomplete |
| C5 integrity | Open/Critical | Builder not operational; validator and pageSkills materially incomplete |
| H1 focus | Partial | Always-on case fixed; spatial evidence and thin-focus case not fixed |
| H2 stale corpus | Correctly deferred | W7 must remain gated |
| H3 VSR | Partial | Basic noise/stale filtering only |
| H4 consent | Partial | Contamination reduced; two-state evaluation absent |
| H5 1.3.1 | Partial | Docs improved; buckets not enforced and broad grouping heuristic remains |
| H6 contrast docs | Resolved | Threshold correction and docs agree |
| H7 AX states | Mostly resolved | Collection works; consumption and coverage incomplete |

## Regeneration gate

Before W7:

1. Make the result builder/validator mandatory and close every C5 adversarial case,
   including `pageSkills` and bucket-aware counts.
2. Isolate every mutating probe; eliminate or explicitly quarantine synthetic
   fallbacks; implement component-boundary trap detection and a real first-focus reset.
3. Replace focus crop-area percentage with spatial evidence and add thin-large,
   transparent/clipped outline, and JS-focus fixtures.
4. Complete the 2.5.8 algorithm and exceptions; make unproven semantic exceptions
   indeterminate rather than passing.
5. Make the form probe trusted and evidentiary; complete VSR attribution and consent
   two-state evaluation.
6. Land the missing deterministic fixtures, then run the full suite and a fresh
   mini-corpus through the mandatory validator before the full corpus.

Round 2 should be treated as a strong intermediate remediation, not a completed
verification-ready harness.
