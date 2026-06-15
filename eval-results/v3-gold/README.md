# v3 Gold Benchmark — label-provenance contract (Phase 0, blocking)

The gold benchmark is the **authority test** that lets a mechanism earn definite-verdict power. It is
not a fixture pile; it is governed by a provenance contract (plan Gold Benchmark Requirements).

## What every gold label must carry
- `xpath`, `sc`, and `goldOutcome` ∈ `BARRIER_OBSERVED | NO_BARRIER_OBSERVED | INAPPLICABLE`;
- a **blinded pre-adjudication** label per rater, rater identity/qualification, and the evidence
  channels used (for AT-dependent SCs this MUST include real-AT evidence, not AX-tree exposure);
- a declared support baseline (browser/AT/OS) where accessibility support is claimed;
- an adjudication record; labels are gold only after a pre-registered inter-rater threshold is met.

## Independence
- The labelling basis must be **independent of the channel under test** — do not label a 4.1.3
  clear from the same AX diff the experiment uses.
- Maintain separate **development / validation / sealed-test** sets. The sealed set is touched only
  at a phase gate, for one logged promotion evaluation per mechanism version, then replenished.
- Mandate a **minimum quota** of adversarial clearing / exception / interference cases, owned
  independently of the mechanism author, so gates cannot be met with easy examples.

## Sizing
See [sizing-worksheet.md](sizing-worksheet.md). A small set detects regressions but **cannot certify
a low false-negative rate**; bounding false-clearance below 2% at 95% needs ~149 independently
labelled *true* clear cases per mechanism/direction (≈263 under a 10-test Bonferroni correction).

## Files
- `sizing-worksheet.md` — per-mechanism required-n, owner, cost.
- `<mechanism>.gold.json` — labelled cases (seed: `focus-visual-retry.gold.json`, the 3 fixture cases).
- Scoring: `scripts/v3/lib/metrics.js` → `scoreClears(results, gold)` reports false-clearance + the 95% upper bound.

## Status (Phase 0)
Only `focus-visual-retry` (SC 2.4.7, AT-independent) has an experiment. Its gold set is a 3-case seed —
**below sizing**, so 2.4.7 clearing remains *shadow-mode* until the set reaches the worksheet target.
All other SCs are `open-scope-never-clearable` (default-closed) and need no gold clear set yet.

## Shadow is ENFORCED, not just documented (audit V3-C2)
Shadow mode is a builder-checked promotion state in [`scripts/v3/lib/authority.js`](../../scripts/v3/lib/authority.js),
not a note. The default for every `(experiment, direction)` is `shadow`; a direction publishes
authoritative claims **only** when its entry is `authoritative` AND all readiness flags are true:
`goldSized` (set at the worksheet target), `sealedEval` (one logged sealed-set promotion eval),
`independentRaters` (provenance met), `measurementValidated` (adversarial fixtures pass). Any unmet
flag fails closed to shadow. `focus-visual-retry` has all four false today, so both its directions are
shadow: gate-passing observations are recorded as `shadowObservations` and scored against this gold
(`scoreClears` includes shadow would-be clears) — but they never enter the authoritative corpus.
