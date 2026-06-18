# v3 Deterministic Harness on W3C ACT Cases

Date: 2026-06-16

Purpose: evaluate the current v3 deterministic harness, with **no LLM lane and no authority
promotion**, on the same W3C ACT testcase corpus used for checker comparison.

Runner added:

- `eval/checker-comparison/run-v3-act-suite.js`

Outputs:

- `eval/checker-comparison/upstream-evidence/v3-act-pilot/raw.json`
- `eval/checker-comparison/upstream-evidence/v3-act-pilot/summary.json`

## Why This Is a Pilot, Not a Leaderboard

ACT cases are rule-level expected outcomes. The v3 harness emits atomic claim-family observations:
`(xpath, SC, claimFamily, mechanism, observationOutcome)`. Same-SC scoring is useful, but it can still
confuse different assertions under the same SC.

The runner therefore:

- runs deterministic v3 only;
- records deterministic shadow observations, since no publication authority is configured;
- marks ACT cases as `outOfScope` when their SC is not in the deterministic v3 experiment catalog;
- scores only same-SC deterministic observations for comparable cases;
- keeps mismatch records for adjudication.

Current deterministic catalog SCs are:

`1.4.3`, `1.4.10`, `1.4.13`, `2.1.1`, `2.1.2`, `2.4.7`, `2.4.11`,
`3.3.1`, `3.3.2`, `4.1.2`.

SCs covered only by LLM/rubric lanes, such as `1.1.1`, `2.4.4`, `2.4.6`, `2.4.2`,
`2.5.3`, `2.5.8`, and `3.3.3`, are not scored as deterministic misses in this runner.

## Commands Run

Syntax and pure contract tests:

```bash
node --check eval/checker-comparison/run-v3-act-suite.js
node --test scripts/v3/tests/foundation.test.js scripts/v3/tests/contracts.test.js
```

Result: syntax OK; 34 pure v3 tests passed.

Browser-backed v3 experiment tests were also attempted in the sandbox and failed to launch Chrome
there. The ACT pilots below were run with Chrome permissions enabled.

Full ACT run:

```bash
node eval/checker-comparison/run-v3-act-suite.js --limit=0 --max-auto=12 --element-cap=80
```

The full run completed all **432 approved ACT cases** with **0 run errors**.

Broad stratified smoke, retained only as an initial smoke check:

```bash
node eval/checker-comparison/run-v3-act-suite.js --stratified --limit=12 --max-auto=6 --element-cap=30
```

Targeted contrast smoke:

```bash
node eval/checker-comparison/run-v3-act-suite.js --sc=1.4.3 --stratified --limit=12 --max-auto=8 --element-cap=40
```

## Full-Run Results

### Overall

The full run covered all selected approved ACT cases. Most are outside the current deterministic
v3 catalog because they target SCs handled by scanner import, LLM/rubric lanes, or not used by this
project.

| Bucket | Count |
|---|---:|
| total ACT cases | 432 |
| deterministic comparable cases | 162 |
| `outOfScope` | 270 |
| TP | 6 |
| FN | 46 |
| FP | 5 |
| TN | 100 |
| TN with deterministic clear | 5 |
| errors | 0 |

Same-SC pilot rates over comparable cases:

- recall on ACT-failed comparable cases: `6 / 52 = 11.5%`
- false-positive rate on ACT non-failed comparable cases: `5 / 105 = 4.8%`
- decision agreement over decided comparable cases: `67.5%`

These numbers are **not** a final harness-quality score. They mix ACT rule-level truths with v3
claim-family observations. The low recall is mostly expected: several ACT-failed comparable cases are
static-name or scrollability rules that the current deterministic v3 mechanism does not claim to
decide.

### Per-SC Breakdown

| SC | Total | Comparable | TP | FN | FP | TN | TN with clear | Out of scope | Interpretation |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| `1.1.1` | 74 | 0 | 0 | 0 | 0 | 0 | 0 | 74 | LLM/rubric lane only; not deterministic. |
| `1.3.1` | 17 | 0 | 0 | 0 | 0 | 0 | 0 | 17 | LLM/rubric lane only. |
| `1.3.5` | 28 | 0 | 0 | 0 | 0 | 0 | 0 | 28 | Planned 3.3 scanner import, not yet v3 deterministic. |
| `1.4.3` | 32 | 32 | 5 | 5 | 5 | 14 | 3 | 0 | Useful comparable contrast slice; see mismatch notes below. |
| `1.4.4` | 11 | 0 | 0 | 0 | 0 | 0 | 0 | 11 | Not in current harness scope. |
| `1.4.6` | 34 | 0 | 0 | 0 | 0 | 0 | 0 | 34 | AAA/enhanced contrast, not current deterministic scope. |
| `1.4.12` | 53 | 0 | 0 | 0 | 0 | 0 | 0 | 53 | Not current deterministic scope. |
| `2.1.1` | 17 | 17 | 0 | 3 | 0 | 14 | 0 | 0 | ACT cases are scrollable-content keyboard reach, not activation; current runner does not cover this assertion. |
| `2.1.3` | 10 | 0 | 0 | 0 | 0 | 0 | 0 | 10 | Not current deterministic scope. |
| `2.2.1` | 15 | 0 | 0 | 0 | 0 | 0 | 0 | 15 | Not current scope. |
| `2.2.4` | 15 | 0 | 0 | 0 | 0 | 0 | 0 | 15 | Not current scope. |
| `2.4.2` | 18 | 0 | 0 | 0 | 0 | 0 | 0 | 18 | LLM/rubric lane; scanner import may cover empty-title cases. |
| `2.4.4` | 28 | 0 | 0 | 0 | 0 | 0 | 0 | 28 | LLM/rubric lane; mixed ACT rules also include `4.1.2`. |
| `2.4.7` | 7 | 7 | 1 | 0 | 0 | 4 | 2 | 0 | Good small focus-visible smoke: no misses/FPs in ACT sample. |
| `2.4.9` | 28 | 0 | 0 | 0 | 0 | 0 | 0 | 28 | AAA link purpose; not current deterministic scope. |
| `3.1.1` | 14 | 0 | 0 | 0 | 0 | 0 | 0 | 14 | Not current scope. |
| `3.1.2` | 18 | 0 | 0 | 0 | 0 | 0 | 0 | 18 | Not current scope. |
| `3.2.5` | 15 | 0 | 0 | 0 | 0 | 0 | 0 | 15 | Not current scope. |
| `4.1.2` | 106 | 106 | 0 | 38 | 0 | 68 | 0 | 0 | Current AX runner is dynamic state/value oriented; ACT cases mostly test static accessible names/role exclusions. Scanner import covers these better today. |

## Mismatch Clusters

Largest comparable mismatch clusters:

| Cluster | Count | Interpretation |
|---|---:|---|
| `4.1.2` failed ACT examples with no v3 observation | 38 | Mostly static accessible-name / role-exclusion cases. The current `ax-state-diff` runner looks for dynamic state/value defects after activation; it is not a static name scanner. |
| `2.1.1` failed ACT examples with no v3 observation | 3 | ACT rules test scrollable content reachable by keyboard. Current v3 `keyboard-activation` tests activation of controls, so this is an assertion mismatch. |
| `1.4.3` failed ACT examples with no v3 observation | 5 | Mostly complex image/gradient/shadow cases where the current contrast runner abstains unless the backdrop is in its closed sub-domain. |
| `1.4.3` non-failed ACT examples with v3 barrier | 5 | Needs adjudication. At least one is a text-shadow pass case that current v3 hard-fails from foreground/background only. Others are likely same-SC applicability differences in ACT inapplicable examples. |

## `1.4.3` Findings

### False negatives: complex backdrops abstained

Several ACT failed examples produced no deterministic v3 observation, including:

- Failed Example 2: `color: #AAA` over `linear-gradient(to right, #FFF, #00F)`
- Failed Example 3: `color: #555` over a black background image

This is consistent with the current runner's conservative design: complex gradient/image backdrops do
not satisfy the closed-scope uniform-backdrop predicate, so the harness abstains rather than inventing
a definite barrier. For ACT scoring, that appears as a miss. For gold-collection workflow, it is a
reasonable `PARTIAL` until the 3.3 contrast plan adds rendered-backdrop measurement.

Action: keep the 3.3 contrast work item. Rendered pixel/backdrop analysis should turn some of these
from `PARTIAL` into definite barriers without weakening the false-clear guard.

### False positive: text shadow not accounted for

One ACT passed example that v3 flagged:

```html
<p style="color: #000; background: #737373; text-shadow: white 0 0 3px">
  Some text in a human language
</p>
```

v3 measured:

- ratio: `4.4288`
- threshold: `4.5`
- `thresholdFailed: true`
- `pixelUniform: true`
- `pixelAgrees: true`

The ACT case is expected to pass because the white text shadow contributes to the rendered contrast
of the glyphs. The current v3 contrast runner measures foreground/background but does not account for
text-shadow as part of the rendered glyph appearance.

Action: add text-shadow handling to the 3.3 contrast item. Until then, shadowed text near the threshold
should be treated as `INCONCLUSIVE`, or measured from rendered glyph pixels, rather than hard-failed
from CSS foreground/background alone.

### Inapplicable examples with v3 contrast barriers

Three `1.4.3` ACT inapplicable examples had v3 `BARRIER_OBSERVED` contrast observations on labels or
label descendants. This is probably not a simple false positive; ACT inapplicability is rule-specific
and can differ from "some visible text on the page has low contrast." These should be adjudicated
before being counted against the harness.

## Engineering Notes

The ACT adapter uses a lightweight URL collector instead of the full saved-page collector. That is
deliberate for benchmark portability, but it introduces limits:

- `--element-cap` can affect recall.
- `--max-auto` can defer candidates and reduce observations.
- simplified accessible-name/native-role extraction may differ from the production collector.
- public ACT pages are live network resources, so full runs need network and browser permissions.

Those limits are acceptable for calibration, but any surprising mismatch should be reproduced in a
minimal local fixture before treating it as a harness defect.

## Recommended Next Runs

The full ACT run is complete. Recommended follow-up:

1. Add assertion-level tags so ACT rule IDs map to v3 claim families before scoring.
2. Add a static scanner/import lane for `4.1.2` accessible-name failures; do not expect `ax-state-diff`
   to cover static empty-name ACT cases.
3. Keep the 3.3 contrast work: rendered backdrop + text-shadow handling.
4. Adjudicate mismatches into:

- true harness bug,
- conservative abstention / `PARTIAL`,
- ACT rule vs v3 claim-family mismatch,
- lightweight collector limitation,
- test portability issue.

---

## Capability Assessment: Existing Tools vs v3 (both directions)

Before treating any ACT mismatch as v3 work, the first question is: **does an existing tool already
support this capability?** `eval/checker-comparison/upstream-evidence/act-pilot/raw.json` carries the
per-case outcomes of **five engines** (axe, IBM, Alfa, QualWeb, HTML_CodeSniffer) over the same 432 ACT
cases, so this is answerable from data (scoring a *decided* violation tagged with the case's SC; `review`
is a soft abstention, not a flag). The narrative is [CHECKER-COMPARISON.md](../checker-comparison/CHECKER-COMPARISON.md); the
per-SC matrix below was recomputed from the ACT pilot evidence.

### Per-SC: who already decides it (recall on ACT-failed / FP on ACT-not-failed)

| SC | axe | IBM | Alfa | QualWeb | v3 (this pilot) | Verdict |
|---|---|---|---|---|---|---|
| **4.1.2** name/role | **97% / 6%** | 89 / 12 | 100 / 6 | **100 / 1** | **0% (0/38)** | **Already covered — import.** v3 `ax-state-diff` is dynamic-state only. |
| **1.4.3** contrast | 70 / **0** | 70 / 0 | 80 / 5 | **90 / 9** | abstains/​mixed | Covered on flat bg (axe 0 FP); **v3 superior on composited** (see below). |
| **1.1.1** non-text | 86 / 0 | 71 / 9 | 86 / 0 | 86 / 8 | LLM lane | Already covered — axe clean. |
| **1.3.5** autocomplete | 100 / 0 | 100 / 6 | 100 / 0 | 100 / 0 | none | Already covered — axe. |
| **2.4.4** link purpose | 100 / 0 | 100 / 0 | 100 / 0 | 100 / 2 | LLM lane | Already covered — axe. |
| **1.3.1** info & rel. | **100 / 0** | 100 / **85** | 100 / 8 | 100 / **100** | LLM lane | Covered by **axe only** (IBM/QualWeb FP-storm). |
| **2.1.1** scrollable-reach | 67 / 0 | 33 / 0 | 100 / 21 | 100 / 43 | 0% (assertion mismatch) | Covered by axe; v3 tests a *different* 2.1.1 assertion (activation). |
| **2.4.2** page title | 63 / 0 | 63 / 0 | 63 / 0 | 63 / 0 | LLM lane | Partly covered — axe. |
| **2.4.7** focus visible | **0%** (review only) | 0% | 0% | 0% | **decides it** | **No tool decides — v3 owns it.** |

### Direction 1 — capabilities already supported by tools (do NOT build/fix in v3)

- **4.1.2 static accessible-name/role — the largest FN cluster (0/38).** axe **97% / 6% FP**, QualWeb
  **100% / 1% FP**, Alfa 100%. This is exactly the planned scanner-import lane (Harness 3.3; memory:
  "axe owns 1.3.1/1.3.5; surface `out.axe` into v3"). **Do not extend `ax-state-diff`** to scan static
  names — import axe's verdict. Note `ax-state-diff` *does* emit some static name/role barriers
  (`nrvDefectStable`), so to avoid inconsistent half-coverage, decide explicitly: cede 4.1.2-static to the
  axe lane and keep `ax-state-diff` for the dynamic state/value assertion only.
- **The 1.4.3 text-shadow case is NOT something a tool already decides — it is a build-where-tools-can't
  case (see Direction 2).** `review` is not a decision: axe/IBM/HTML_CodeSniffer return `review`
  (incomplete — they detect the un-measurable glyph effect and **punt to a human**); QualWeb and v3 hard-fail
  it. *No static tool decides shadowed or image-backdrop contrast.* The bug is that v3's **deterministic**
  runner emits a **false BARRIER** (authoritative-eligible) instead of handing the case to the lane v3 has
  **already built** for it — the `contrast-over-complex-backdrop` vision rubric, which explicitly treats "a
  solid text-shadow / scrim / outline that lifts the text off the backdrop" as a legitimate pass. So the
  minimum fix is: the deterministic runner **abstains** on `text-shadow`/`-webkit-text-stroke` (→ auto-PARTIAL)
  so the existing vision rubric decides it — not "abstain like axe," but "stop preempting our own capable
  lane." Tracked as audit §B5. The higher-value build is below.
- **1.3.5, 2.4.4, 1.1.1, 1.3.1, 2.4.2** — all decided cleanly by **axe** (0–6% FP). These are v3 LLM-lane /
  ○-tier SCs; the deterministic answer should come from the axe import, with axe owning 1.3.1 (IBM/QualWeb
  FP-storm at 85–100%).

### Direction 2 — capabilities v3 has that NO existing tool has

All five engines are **single-state DOM scans**; v3 is **behavioral**. The ACT data and the ground-truth
fixtures both confirm no static engine decides the behavioral SCs:

- **2.4.7 Focus Visible — every static tool: 0% recall, `review` only** (IBM's static CSS heuristic fired
  **zero** real-focus findings and missed both labelled fixture barriers). v3's `focus-visual-retry` (real
  keyboard + pixel diff) decides it. **Not supersedable.**
- **2.1.2 trap-escape, 1.4.13 hover-dwell, 4.1.3 status-on-action, 2.4.11 focus-obscured, 1.4.10 reflow
  @320px, 2.1.1 real Enter/Space activation** — on every such fixture **all five engines emit zero decided
  findings** (HTML_CodeSniffer leaves a blanket "manual review" notice). These require interaction a DOM
  snapshot cannot perform.
- **1.4.3 over composited/complex backdrops — v3 supersedes the statics, and the foundation is already
  built.** On gradient / colour-cycling / background-image text, v3's pixel sampler returns **INCONCLUSIVE**
  (ground truth) where **axe and IBM false-positive a definite violation** (e.g. the animation) and
  HTML_CodeSniffer/QualWeb cannot read background-image text at all. **What v3 has already built toward
  *deciding* (not just abstaining) these — the capability axe lacks:**
  - **rendered-pixel backdrop sampling** ([`analyzeBackdrop`](../../../scripts/v3/lib/exp-runners.js#L229)):
    screenshots the run, identifies the exact glyph pixels by a two-sentinel diff, reads the *rendered*
    backdrop behind each, and computes mean + **p05/p95 luminance extremes** (the A1 worst-case foundation);
  - **composited paint-stack resolution** (`resolveAt`/`over` via `elementsFromPoint`) — rgba overlays,
    ancestor opacity, translucent layers, which the statics punt on;
  - **image/gradient detection** (`hasImage`, `range>12`) — *detected today, deliberately abstained*; the
    worst-case-extreme machinery to convert that into a sound one-directional BARRIER already exists, just
    gated behind the uniformity check;
  - an **LLM vision lane** for exactly this — [`contrast-over-complex-backdrop-v0.md`](../../../scripts/v3/llm-rubrics/contrast-over-complex-backdrop-v0.md)
    (skill `color-and-visual-text`, frames `element-crop`+`surrounding-region`) that judges readability over
    photos/gradients **and** explicitly credits a contrast-lifting text-shadow/scrim/outline.
  - **Not yet built (the small remaining piece):** measuring the *rendered glyph ink* (the path measures the
    backdrop with glyphs hidden, but takes the foreground from CSS). Adding one "original-glyph" screenshot
    and reading luminance at the already-identified glyph pixels would let the deterministic lane **decide**
    shadowed/stroked text — converting an abstention into a verdict no static tool can produce.

### Refinements this pilot adds to CHECKER-COMPARISON.md

1. **v3 is sound on flat-backdrop large text — the ACT "false barriers" there are collector artifacts.**
   7 of v3's 8 `1.4.3` ACT false barriers are `font-size:18pt` `#000`-on-`#666` (= 3.66:1, a valid
   **large-text pass** at ≥3:1) and a high-contrast `#333`-on-`#FFF` case. Re-run in a local fixture, the
   **production runner classifies 18pt as large and clears it** (`threshold:3, thresholdMet:true`) — so the
   ACT FPs are the **lightweight ACT adapter** mis-feeding the size class, **not** a runner bug (the doc's
   own engineering caveat, now confirmed). Fix the ACT adapter's size-class/`font-size` extraction; the
   runner needs no change. The single *genuine* flat-backdrop runner gap is **text-shadow** (§B5).
2. **"axe-on-solid-bg is redundant with v3" is slightly optimistic.** On solid backgrounds axe is at least
   as reliable and currently *cleaner* than v3 on two near-threshold classes (text-shadow → axe abstains,
   v3 false-barriers; collector-fed large text → axe correct). The honest division is: **axe owns flat
   backdrops; v3 owns composited backdrops.** v3 should abstain on flat backdrops it can't measure soundly
   (glyph effects) rather than emit a barrier axe would (correctly) decline.

### Net

- **Import, don't reinvent (tools *decide* these well):** 4.1.2-static (axe), 1.3.5/2.4.4/1.1.1/1.3.1/2.4.2
  (axe), 1.4.3 on **flat** backdrops (axe, 0 FP), 2.5.3/2.5.5 (IBM/Alfa per CHECKER-COMPARISON).
- **v3's irreplaceable core — build *more* here, because tools can only `review`:** the behavioral SCs
  (2.4.7, 2.1.1-activation, 2.1.2, 1.4.13, 4.1.3, 2.4.11, 1.4.10) and **composited / shadowed / image-backdrop
  contrast** — *nothing* supersedes these, and the rendered-pixel + vision foundation is already mostly built.
- **The text-shadow finding is a *build*, not a defer:** no static tool decides it (they `review`). Minimum:
  the deterministic runner abstains (→ hands off to the already-built `contrast-over-complex-backdrop` vision
  rubric). Higher value: extend the rendered-pixel path to the glyph and **decide** it deterministically.
- **Genuinely small / collector, not runner:** fix the ACT adapter's `font-size`/size-class extraction (7 of
  8 `1.4.3` "FPs" — the runner handles 18pt correctly); decide whether `ax-state-diff` cedes 4.1.2-static to
  the axe lane to avoid inconsistent half-coverage.
