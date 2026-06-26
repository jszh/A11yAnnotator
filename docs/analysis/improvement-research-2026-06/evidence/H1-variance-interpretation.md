# H1 — run-to-run variance: the noise floor (3 identical HEAD runs)

## Noise floor (IDENTICAL config + code, 3 runs)
| metric | run-a | run-b | run-c | RANGE |
|---|---|---|---|---|
| TP | 51 | 51 | 49 | 2 |
| FN | 15 | 15 | 17 | 2 |
| **FP** | 14 | 16 | 10 | **6** |
| F1 | 0.779 | 0.767 | 0.784 | 0.017 |

**The FP count swings by 6 (10–16) across byte-identical runs.** This is the single most important measurement
finding: a single run's FP is ±3 noise. Every small fix this session (±1–2 FP) was BELOW this floor → invisible
by construction. run10 (14 FP) vs exp17 (12 FP) was pure noise. **Any change < ±3 FP / < 0.017 F1 cannot be
measured by a single-run comparison** — it needs ≥3-run medians and the effect must clear the band.

## Error decomposition (per-case stability across all 3 runs)
- **stable-correct: 416**
- **stable-WRONG (systematic): 21** ← confident-systematic (H5); voting CANNOT fix these
- **NOISY (flips run-to-run): 16** ← variance; 8 of 16 are **2.4.4** (link-purpose/equivalent-purpose)

2.4.4 is the **noise epicenter** — the LLM flip-flops on same-name-link / equivalent-purpose calls.

## H1b — K=3 majority voting: REFUTED for accuracy ❌
| | TP | FN | FP | F1 |
|---|---|---|---|---|
| single-run AVG | 50.3 | 15.7 | 13.3 | 0.7765 |
| K=3 majority | 51 | 15 | 14 | 0.7786 |

Voting gives **+0.002 F1** (within rounding). It does NOT improve accuracy because the systematic errors (21)
are stable (majority stays wrong) and the noisy errors (16) are ~50/50 (majority ≈ coin-flip). **Voting's only
value is variance reduction for MEASUREMENT** (a stable number), not accuracy. Don't spend K× compute for accuracy.

## Implications
1. **Methodology (highest-value):** report multi-run medians/bands, not single runs. The harness needs a
   "noise-floor-aware" comparison protocol or per-case stability is unmeasurable.
2. **Accuracy levers must target the 21 SYSTEMATIC errors** (confident-wrong) — not variance. → H7 critic.
3. 2.4.4 equivalent-purpose is the highest-leverage SC (8/16 noisy + systematic FPs).
