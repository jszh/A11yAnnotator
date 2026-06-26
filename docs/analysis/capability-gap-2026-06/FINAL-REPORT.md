# Capability-gap build — final report (updated 2026-06-22)

**Goal.** Using the act-augmented dataset's aspect TAXONOMY (the 150 human-judgment facets across our 22 covered
SCs) as the starting point, identify the capabilities still needed to cover those aspects, prototype them, build
adversarial test cases (≥10 pos / ≥10 neg per aspect via independent agents grounded in WCAG/Techniques/TT/EN), and
validate/iterate to robustness. **The held-out act-augmented PAGES were never opened for development** — only the
slug taxonomy — so the corpus stays clean for later validation, breaking the overfitting confound.

## Phase 1 — analysis
6 independent agents mapped all 150 aspects (slug + WCAG/Techniques/TT/EN + our code) → coverage **38 COVERED /
56 PARTIAL / 56 GAP** → **8 capabilities** (one capability covering many aspects).

## The 8 capabilities — validated against INDEPENDENT adversarial corpora
**958 adversarial cases across 37 decision-aspects** (independent agents; held-out untouched). The two error classes:
a **false-CLEAR** (FC) silently passes a real barrier — unrecoverable; a **false-BARRIER** (FB, a "false positive")
over-flags something fine — recoverable by a human/rubric. The runners were tuned to drive FC toward zero first.

| | Capability | Cases | False-CLEARS | False-BARRIERS (deterministic → after micro-check) |
|---|---|---|---|---|
| **C4** | 1.4.11 non-text contrast | 164 | **2** | 6 → **6** |
| **C6** | 1.4.10 reflow | 156 | 13 | 5 → **3** |
| **C5** | 3.3.1/2/3 form binding | 200 | 10 | 2 → **2** |
| **C1** | interaction-driven capture | 193 | 16 | 9 → **8** |
| **C2** | reveal-state producer | 96 | **0** | 0 → **0** |
| **C8** | small signals (×6) | 149 | 1 | 2 → **2** |
| | **TOTAL (6 decision runners)** | **958** | **42** | **24 → 21** |
| **C3** | full-page structure vision | (capture) | — | — (evidence-provisioning, no verdict) |
| **C7** | required-tool routing | (config) | — | — (wiring, no verdict) |

- **False-CLEARS (42)** are the deterministic runners' hardest residual: semantic/detection edges the runner passes
  (e.g. C6's 13 are meaningful-indentation collapses it does not flag; C1's 16 are composite-alpha / one-way-toggle /
  state-correctness). These are backstopped by the rubrics; the micro-checks do NOT touch passes, so FC is unchanged.
- **False-BARRIERS (24 → 21)** are itemised with file names + cause in `FALSE-BARRIERS.md`. The micro-checks cleared 3
  (see below); the remaining 21 break down: **13 DETECTION/MEASUREMENT** (runner-fixable), **4 PERCEPTUAL** + **4
  AMBIGUOUS-EXEMPT** (deliberately left as safe over-flags).

## Micro-check integration — false-barrier reduction (Claude Code SDK)
Each runner is wrapped as a CHECKLIST ORCHESTRATOR: on a deterministic FAIL it asks a focused single-question LLM
micro-check (same Claude Code SDK transport, `effort:'low'`) "is this flagged barrier actually exempt/acceptable?" and
CLEARS it (fail→pass) only on a high-confidence 'clear'. It touches only fails, so it can **only lower the
false-barrier count**, and across the suite added **zero** new false-clears.

- **Reduced FB with 0 new FC:** C6 5→3 (cleared 2 F102 cases with an accessible equivalent at 320px), C1 9→8 (cleared
  a disabled/inactive-control exemption).
- **Three load-bearing rules** (each forced by an adversarial failure): (1) micro-checks are for SEMANTIC questions,
  never PERCEPTUAL contrast — letting the LLM judge "is there a colour cue / is this 3:1" false-cleared real barriers;
  (2) only UNAMBIGUOUS exemptions clear safely — a true essential brand swatch and a false-essential divider look
  alike, so the conservative check leaves both as (safe) over-flags rather than risk a false-clear; (3) the
  complementary ABSTAIN→fail escalation is DEFERRED (off by default) because it *raises* FB (C5 +15, C8 +11).
- Detail: `MICRO-CHECK-FINDINGS.md`; deferred escalation: `docs/DEFERRED-TODO.md`.

## Method that held across all six runners
1. Prototype the deterministic producer. 2. Independent agents generate ≥10 pos/10 neg per aspect, **without the
held-out set**. 3. Validate on a soundness metric (false-clears fatal; abstains safe). 4. Iterate to ~0 dangerous,
routing the semantic/perceptual dimensions to the rubric. 5. Wrap as a micro-check checklist to clear false-barriers.

## Three concrete fixes to CURRENT behaviour
- **C4**: a deterministic 1.4.11 runner that did not exist — the rubric assumed a phantom producer.
- **C4 alpha-compositing**: a semi-transparent border (`rgba(0,0,0,.45)` over white = #8c8c8c = 3.36:1) is now
  composited before comparison — fixed a real false-barrier (case-18) deterministically.
- **C6 G225 bug**: the shipped reflow probe treated any `overflow-x:auto` ancestor as a valid 2-D exemption,
  **passing a carousel that strands flowable panels off-screen** (`exp-runners.js:736`).

## Honest scope notes
- **C3/C7** are evidence-provisioning/wiring (verified deterministically, no FC/FB).
- **C2** shares the reveal-producer primitive with the external dev's paused work, scoped here to OUR SCs.
- **Production integration is a deliberate FOLLOW-UP.** All modules are standalone; existing regression 73/73 green.
- **Validation is on my own independently-generated corpora.** The act-augmented held-out set is reserved for the
  user's final, un-overfit validation.
- **The 13 runner-fixable false-barriers** (DETECTION/MEASUREMENT in `FALSE-BARRIERS.md`) are the highest-value next
  work — pushing FB down further is a job for better deterministic detection, not the LLM.

## Evidence index (`docs/analysis/capability-gap-2026-06/`)
- `PHASE1-CAPABILITY-NEEDS.md`, `aspect-inventory.md`, `gaps-*.md` — Phase 1.
- `C{4,6,5,1,2,8}-*-STATUS.md` — per-capability prototype + validation.
- `MICRO-CHECK-FINDINGS.md` — the micro-check design rules + FB-reduction results.
- `FALSE-BARRIERS.md` — every current false-barrier with file name + cause.
- `scripts/v3/lib/*-runner.js` + `*-checklist.js`, `micro-checks.js` — runners + micro-check wrappers.
- `eval/capability-tests/<group>/` — 958+ adversarial cases; `_tools/validate-*.js` — validators.
