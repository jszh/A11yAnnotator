# v3 Gold-Benchmark Sizing Worksheet (per mechanism / direction)

Required independently-labelled **true-case** count for a zero-event 95% upper bound below the
target false-rate: `n = ceil(ln((1-conf)/k) / ln(1-target))` (rule-of-three ≈ `k·3/target`).
Computed by `scripts/v3/lib/metrics.js → requiredZeroEventN`.

| Target bound | k=1 | Bonferroni k=10 | Bonferroni k=20 |
|---|---:|---:|---:|
| false-clearance < 2% (clearing / trap / interference) | **149** | **263** | **297** |
| false-definite < 5% (other REPRODUCED) | 59 | 105 | 119 |
| false-clearance < 1% | 299 | 528 | 597 |

Reference: with **n=30** zero-event clears the 95% upper bound is **9.5%** — a regression detector,
not a low-FN certificate.

| Mechanism | Direction | AT-dep? | Target | Required n (true cases) | Owner | Status |
|---|---|---|---|---:|---|---|
| focus-visual-retry (2.4.7) | NO_BARRIER_OBSERVED | no | <2% false-clear | 149 (263 w/ k=10) | _TBD_ | seed 3 cases → SHADOW until sized |
| focus-visual-retry (2.4.7) | BARRIER_OBSERVED | no | <5% false-definite | 59 | _TBD_ | seed 3 cases |

**Real-AT capability:** not yet stood up. Until it is, v3 grants CLEARING authority only to
`accessibilitySupportDependent:false` SCs (focus visibility, contrast, reflow geometry); AT-dependent
clears (4.1.2 / 4.1.3 / announcement-dependent keyboard) stay deferred (registry: open-scope-never-clearable).
