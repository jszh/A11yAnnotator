# `scripts/v3/lib/` — module map

This is a flat directory by necessity (much of it is referenced by relative path from in-flight work), but
the modules group into the pipeline's **stages**. Read top-to-bottom = the data flow a page goes through.

> The physical files are flat; this map is the *logical* structure. A future pass may move these into
> `collectors/ · oracle/ · runners/ · orchestration/ · llm/ · checkers/ · dispositions/ · infra/` once the
> in-flight runner work lands and all relative requires can be updated together (see `docs/README.md`).

## Pipeline flow

```
collect ──▶ oracle (applicability) ──▶ candidate-gen ──▶ schedule ──▶ EXPERIMENTS (deterministic)
                                                                          │
   checkers (axe/IBM) ───────────────────────────────────────────────────┤
   LLM lane (rubrics, shadow/canary) ─────────────────────────────────────┤
                                                                          ▼
                                                              build-v3 (bind → dispositions)
```

## Groups

**1. Collectors / signals** — page → hashed facts
`act-page-collect`, `collect-lists`, `collect-tables`, `vsr-collect`, `vsr-analysis`, `vsr-graph`,
`vision-capture`, `ocr-sidecar`, `status-detector`, `small-signals` _(also a runner)_.
(The corpus collector is `scripts/eval-page.js`, outside lib.)

**2. Oracle / catalog / candidate generation** — *what* to test
`applicability-oracle` (FAMILIES + `familiesFor`), `applicability-observer`, `catalog` (the typed-outcome
contract), `candidate-generator` (family→experiment→requests), `registry`, `coverage-registry`,
`cdp-tool-catalog`.

**3. Experiment runners** — deterministic deciders (barrier/clear/abstain)
`exp-runners` (the RUNNERS table + C3/C4/C6/C8/C2/… runners), `run-experiments` (dispatch + shared
`tagByXpath`/`hydrate`/`settle`), `nontext-contrast-runner` (C4 1.4.11), `reflow-runner`,
`form-binding-runner`, `reveal-state-runner` (C2 2.1.2), `interaction-capture`, `order-check`, `kbd-graph`,
`fullpage-structure`, `required-tool-routing`.

**4. Orchestration / scheduling / build** — run the plan, publish dispositions
`orchestrator` (the stage sequence), `build-v3` (the ONE publication gate: bind evidence → CLAIM/PARTIAL/
PROVISIONAL/shadow), `scheduler`, `run-pages`, `run-instruments`, `run-telemetry`, `agent-planner`,
`proposer`, `budget`, `page-lease`, `tab-allocator`, `timings`, `limits`.

**5. LLM lane** — non-authoritative judgment (shadow/canary, off by default)
`llm-adjudicator` (subject selection + rubric judging), `llm-agent-adapter` (Claude SDK transport),
`rubric-loader`, `broad-scope-llm-review`, `broad-scope-probes`, `micro-checks`, `cdp-tools`,
`dynamic-subjects`. Rubric prompts live in `scripts/v3/llm-rubrics/*.md`.

**6. External checkers**
`axe-surface` (C0 — collection-time axe → surfaced findings/promotions), `checker-ibm` (IBM hard-fail +
triage priors).

**7. Dispositions / claims / authority** — the evidentiary spine
`obligations`, `judgments`, `claims`, `authority` (trust anchors), `attestation` (page-digest signing),
`cross-artifact`, `completeness`, `metrics`, `manifest`.

**8. Schema / infra / utils**
`schemas` + `v3-schema` (KNOWN_STAGES etc.), `bundle-loader`, `load-env`, `gold-loader`, `xpath-ns`
(namespace-agnostic resolver).

**9. Checklist wrappers** — fail-path clear-only micro-check shells (per runner)
`*-checklist` (`form-binding`, `nontext-contrast`, `reflow`, `reveal`, `small-signals`, `interaction`).

## Key contracts to know before editing
- **Typed-outcome contract** (`catalog.js`): a runner emits atomic boolean `outcome` flags; the catalog's
  `supports` map declares which flag-sets mean `BARRIER_OBSERVED` / `NO_BARRIER_OBSERVED`. See
  `docs/contracts/RESULT-CONTRACT.md`.
- **Family → experiment wiring**: add a family to `applicability-oracle.FAMILIES` + a `familiesFor`
  predicate, a `catalog.experiments` entry (`claimFamily` must match), and a runner in `exp-runners.RUNNERS`.
- **Coverage** of WCAG SCs by mechanism: `docs/reference/COVERAGE-AND-GAPS.md`.
