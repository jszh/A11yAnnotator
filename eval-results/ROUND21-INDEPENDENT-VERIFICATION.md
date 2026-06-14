# Round 2.1 Independent Verification

Date: 2026-06-14  
Pinned branch/commit: `round2-remediation` at `d5833cc9eda3336628f2687494fb137112b8ffbd`  
Delta reviewed: `1ed0433` through `d5833cc`

## Executive conclusion

Round 2.1 closes several important Round 2 defects:

- thin and JS-driven focus indicators now pass deterministic browser fixtures;
- the first-focusable sentinel fix works;
- trusted native form submission records invalid events, validity, and messages;
- page-level findings enter the result builder;
- the new two-control trap fixture is detected;
- VSR attribution and normative skill wording improved;
- the specified pure suite passes **62/62**, and the deterministic browser suite
  passes **10/10**.

However, independent adversarial probes found unresolved high-impact paths in the
result gate, trap detection, and 2.5.8 classification. The disclosed caveats are
honest, but several are not safely represented to the evaluating agent: an unresolved
exception or contaminated/synthetic probe can still become a definite verdict.

**Recommendation: do not start full W7 corpus regeneration at `d5833cc`.** A small
fixup round should close the Critical and High findings below first. Round 2.1 is
close enough that these are bounded fixes, not another redesign.

## Verification performed

- Inspected the exact pinned commit and all Round 2.1 commits.
- Ran the requested pure command:

  ```text
  node --test scripts/tests/unit.test.js scripts/tests/result.test.js \
    scripts/tests/docs.test.js scripts/tests/meta.test.js
  ```

  Result: **62 passed, 0 failed, 0 skipped**.

- Ran `scripts/tests/evidence.test.js`: **10 passed, 0 failed, 0 skipped**.
- Launched the requested full browser command:

  ```text
  node --test --test-timeout=1200000 scripts/tests/*.test.js
  ```

  Result: **82 passed, 0 failed, 0 skipped** in about 6.5 minutes.

- Re-ran the regression sweep on the prototype corpus: it failed with **5,169
  violations over 56 pages**, as expected for old incompatible data.
- Ran adversarial schema, CLI, sweep, WCAG 2.5.8, and keyboard-trap probes.
- Validated normative interpretations against W3C Understanding documents for
  [2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html),
  [2.1.2 No Keyboard Trap](https://www.w3.org/WAI/WCAG22/Understanding/no-keyboard-trap.html),
  and [2.4.13 Focus Appearance](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html).

## Critical finding

### R21-C1 — The mandatory result gate can validate an incomplete page evaluation

The builder CLI is now documented as mandatory and correctly derives its own output,
which is a major improvement. But it silently defaults missing `pageSkills` to `{}`.

A records file containing only:

```json
{"file":"f","slug":"s","elements":[]}
```

was accepted and written as a validated result with:

```json
{"pageSkills":{},"pageHasIssue":false,"normativeFailures":0}
```

This allows all page-structure, grouping/reading-order, and reflow evaluation to be
omitted while still receiving the “validated” stamp. These categories were present
on every prototype page, so this is a material completeness failure.

The validator and regression sweep also still accept hand-written or subsequently
corrupted results with:

- missing `summary.bySkill`, `summary.elementsWithIssue`, `summary.pageBySkill`,
  `summary.pageHasIssue`, and advisory bucket totals;
- missing element issue levels;
- wrong page-skill levels;
- `summary.issues` entries whose verdict, bucket, level, and xpath were corrupted,
  provided the shortened key fields still matched.

An adversarial corrupted result passed both `validateResults()` and the regression
sweep. This exceeds the disclosed “no filesystem lock” caveat: the documented sweep
gate itself does not detect the corruption.

**Required fix**

- Require all three `pageSkills` keys and valid verdict records.
- Require every derived summary field and compare the complete summary against a
  rebuild, not selected optional fields.
- Validate page-skill evidence, level, and bucket exactly like element skills.
- Compare complete issue objects, including scope/xpath/verdict/all SCs/level/bucket/
  full evidence.
- Add these adversarial cases to `result.test.js` and the sweep self-test.

## High findings

### R21-H1 — Trap detection still has false-negative and false-positive paths

The new algorithm fixes the specific two-control trap fixture, but it hard-codes
`CYCMAX = 3`.

Independent browser probes found:

- An inescapable four-control `A → B → C → D` cycle ran for 30 stops and emitted
  `trapDetected:false`.
- A two-control modal cycle that exits normally with `Escape` emitted
  `trapDetected:true`.

WCAG 2.1.2 permits moving away using a standard keyboard exit method. The detector
checks only Tab and Shift+Tab, so an Escape-releasable modal is falsely failed.

**Required fix**

Detect repeated bounded cycles without an arbitrary three-control maximum, identify
the owning component, and probe standard exit methods such as Escape before asserting
a trap. Add fixtures for a four-control trap and an Escape-releasable modal.

### R21-H2 — 2.5.8 still produces confirmed false passes

The UA-control and prose fixtures pass, but their implementation is too permissive.

#### Author-modified controls are treated as UA controls

`uaControl` checks only `r.style.width` and `r.style.height`. A checkbox explicitly
resized to `10×10` through a stylesheet emitted:

```json
{"uaControl":true,"targetSize":{"passes":true,"reason":"user-agent control exception"}}
```

W3C's User Agent Control exception applies only when size is determined by the user
agent and **not modified by the author**.

#### Navigation labels are still treated as a sentence

The original adversarial navigation example:

```text
PRIMARY NAVIGATION CONTROLS Account SECONDARY NAVIGATION CONTROLS
```

still emitted `inSentence:true` and auto-passed. The heuristic proves only that 15
non-control characters exist in the block, not that the target is in a sentence or
line-height-constrained non-target text.

**Required fix**

Determine whether checkbox/radio dimensions differ from an actual UA-default
reference or are affected by author CSS. Treat semantic inline status as
indeterminate unless stronger prose evidence exists; the existing adversarial
fixture `fx-round2-audit.html` should become a required failing case.

### R21-H3 — Known 2.5.8 caveats can still become definite false failures/passes

The builder correctly disclosed that Equivalent is not automatically proven and
non-rectangular size uses a bounding-box assumption. The problem is the downstream
contract:

```text
targetSize.passes:false → 2.5.8 REPRODUCED
targetSize.passes:true  → NOT a 2.5.8 defect
```

Thus:

- an undersized target with an Equivalent control can become a definite false
  failure;
- an Essential target can become a definite false failure because `essential` is
  never supplied by the collector;
- a non-rectangular target whose bounding box is 24×24 but cannot contain a 24×24
  square can become a definite false pass despite `shapeAssumption`.

W3C requires all five exceptions and requires that a 24×24 square fit inside the
target for the size test.

**Required fix**

Return a tri-state or `requiresJudgment` signal for unresolved Equivalent, Essential,
inline, and shape cases. Update `AGENT-PLAN.md` so assumptions/unknown exceptions
produce manual verification or PARTIAL, never automatic pass/fail.

### R21-H4 — Synthetic/contaminated behavioral fallbacks are not calibrated downstream

The trusted form fixture is a real improvement. Remaining fallbacks are flagged in
the driver, but the agent plan never tells the evaluator to downgrade them:

- activation can fall back to `el.click()` with `activate.synthetic:true`;
- form submission can use `synthetic-fallback` or `requestSubmit`;
- hover, Escape, keyboard, and arrow probes still share one element load;
- native activation may reuse the page after hover because the activation reload is
  conditional.

The disclosed partial-isolation caveat is acceptable only if verdict confidence is
calibrated to it. Currently a definite behavioral verdict can still rest on synthetic
or potentially contaminated evidence.

**Required fix**

Emit an explicit per-probe trust/isolation status and require PARTIAL when a relevant
verdict depends on a synthetic fallback or a prior mutation that was not isolated.

## Medium findings

### R21-M1 — Consent-present evaluation is collected but not operational

`consentState` is a shallow static inventory of container/control/headings counts and
name-like attributes. It does not perform a consent-present axe/structure/keyboard
pass, can double-count containers matching multiple selectors, and treats any
`aria-labelledby` value as named without resolving its target.

More importantly, `AGENT-PLAN.md` does not instruct the evaluator to consume
`consentState`; it still says to treat `consentHidden` as bookkeeping. Therefore the
new data can be silently ignored.

This is a useful partial implementation, but it should not be described as evaluating
the overlay's accessibility defects yet.

### R21-M2 — “Strict validator” and meta-test descriptions overclaim coverage

The meta-test named “documented run-all glob” executes only `unit.test.js`, not the
documented glob. The actual full command is being run independently, but the meta-test
does not prove it.

The result validator is stricter than Round 2 but still does not enforce several hard
invariants described in `RESULT-CONTRACT.md`, as detailed in R21-C1.

### R21-M3 — Best-practice bucket cannot represent observations without a fake SC

The contract says best-practice observations such as missing `<h1>` are not WCAG
failures. The mandatory builder nevertheless rejects every issue verdict without an
SC, including `bucket:"best-practice"`.

This forces either:

- attaching a misleading WCAG SC to a non-SC advisory;
- dropping the advisory from issues; or
- encoding it under a non-issue verdict.

Give advisory/AT-compat observations their own optional rule identifier and require
WCAG SC/level only for `bucket:"normative"`.

### R21-M4 — 2.4.13 is not ready for a configuration flip

This is not a current conformance-scoring gap because 2.4.13 is deliberately not
enforced. However, the documentation overstates future readiness.

`minThicknessPx` is `changedPixels / bbox perimeter`, not a measured minimum
thickness. `maxContrastChange` is the maximum sampled pixel contrast, whereas WCAG
requires a sufficiently large indicator area with at least 3:1 change between the
same pixels. Consequently `meetsIfEnforced` can be wrong.

Keep the raw measurements as diagnostic evidence, but rename the proxy fields and
remove the claim that enabling 2.4.13 is merely a configuration flip.

## Status against the prior Round 2 report

| Prior finding | Round 2.1 status |
|---|---|
| R2-C1 result integrity | Improved substantially, still open due incomplete mandatory gate |
| R2-H1 trusted input/isolation | Improved, still partial and not confidence-calibrated |
| R2-H2 multi-control traps | Specific A↔B case fixed; general/standard-exit logic still open |
| R2-H3 first focusable | Resolved by deterministic fixture and browser run |
| R2-H4 thin focus | Resolved for 2.4.7; 2.4.13 proxy is non-binding/overclaimed |
| R2-H5 target size | Main fixture cases fixed; confirmed UA/inline false passes and unresolved exceptions |
| R2-H6 forms evidence | Trusted fixture path resolved; fallback calibration remains |
| R2-M1 VSR attribution | Improved; still virtual-SR/positioning limited |
| R2-M2 consent | Partial static inventory only; not consumed by agent |
| R2-M3 AX states | Procedure/docs improved |
| R2-M4 docs | Core contradictions fixed; remaining overclaims noted above |

## Regeneration gate

Before full W7 regeneration:

1. Close R21-C1 so omitted page skills and corrupted outputs cannot pass the
   mandatory CLI/sweep gate.
2. Fix trap detection for arbitrary component cycles and standard exit methods.
3. Fix the confirmed UA-control and navigation-inline false passes.
4. Make unresolved 2.5.8 exceptions/shape assumptions tri-state/manual, not definite.
5. Require PARTIAL for behavioral verdicts based on synthetic or non-isolated probes.

The disclosed consent, full Equivalent automation, and non-enforced 2.4.13 limitations
can remain partial if their outputs are explicitly marked indeterminate and cannot
affect definite conformance tallies.
