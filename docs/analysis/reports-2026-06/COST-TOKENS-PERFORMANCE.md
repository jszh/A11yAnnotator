# Cost, tokens and performance — 3 tools × 4 models

Companion to `PAPER-TABLES-CONTRIBUTIONS.md` Table 1m. That table carries the accuracy claim; this one carries
what each result cost to produce. Last updated 2026-09-06.

**Tools:** our harness, GenA11y, AccessGuru. **Models:** Claude Sonnet 4.6, Claude Haiku 4.5, Gemini 3.7 Flash,
Gemini 3.5 Flash-Lite.

---

## 1. Read this first — the cost figures were broken until 2026-09-06

Three independent accounting defects were found while assembling this document. All are fixed going forward,
but they affect how historical numbers should be read.

| # | Defect | Effect | Status |
|---|---|---|---|
| 1 | **Gemini was never priced.** The API returns token counts but no cost field, and nothing in the JS path priced them. | Every harness Gemini run recorded **$0**. | Fixed — `geminiCostUsd()` in `llm-agent-adapter.js`; historical runs recoverable from tokens via `reconstruct-gemini-costs.js`. |
| 2 | **Python baselines mispriced `gemini-3.5-flash`** at $0.30/$2.50 — those are *Flash-Lite's* rates; 3.5-flash is $1.50/$9.00. | GenA11y/AccessGuru 3.5-flash runs understated ~4x (`accessguru-act-gemini` $1.85 → **$7.10**). | Fixed, with longest-prefix matching so `flash-lite` no longer collides with `flash`. |
| 3 | **`chunkctl.py` summed only `tokens.costUsd`**, but the annotated suite records under `llm.costUsd`. | Every assembled 585 run reported **$0.00** against real spend (Sonnet **$144.91**, Haiku **$76.36**). | Fixed; both assemblies rebuilt, rows and metrics byte-identical. |

Defects 1 and 3 both had the same shape: **an absent value read as zero.** `geminiCostUsd` now returns `null`
rather than `0` for an unknown model, so a missing price can never again be reported as free inference.

**Token counts are the authoritative artifact.** They were always recorded correctly; cost is derived. Any
future pricing change can be reapplied to the tokens without re-running anything.

---

## 2. Prices used (USD per 1M tokens)

From ai.google.dev/gemini-api/docs/pricing and Anthropic's published rates, read 2026-09-06.

| Model | Input | Output | Cached input | Flex (50%) |
|---|---:|---:|---:|---|
| Gemini 3.7 Flash | 0.75 | 3.75 | 0.075 | 0.375 / 1.875 |
| Gemini 3.5 Flash | 1.50 | 9.00 | 0.15 | 0.75 / 4.50 |
| Gemini 3.5 Flash-Lite | 0.30 | 2.50 | n/a | 0.15 / 1.25 |
| Claude Sonnet 4.6 / Haiku 4.5 | — | — | — | via subscription; SDK reports `total_cost_usd` directly |

**Gemini 3.7 rates are promotional and double on 2027-01-01** ($1.50 / $7.50). `geminiCostUsd` selects by run
date so archived artifacts keep the rate in force when they ran.

---

## 3. ACT 458 — cost and performance

Raw accounting (66 positives / 392 negatives). AccessGuru faithful per the 2026-09-06 scoping decision.

| Tool | Model | Recall | FPR | F1 | Cost | Notes |
|---|---|---:|---:|---:|---:|---|
| **Harness** | Sonnet 4.6 | 97.0 | 3.3 | **0.895** | $38.26 | |
| **Harness** | Haiku 4.5 | 87.9 | 7.7 | 0.753 | $22.77 | |
| **Harness** | Gemini 3.7 | 93.9 | 2.3 | **0.905** | ~$10.24 † | reconstructed |
| **Harness** | Flash-Lite (high) | 90.9 | 3.8 | 0.851 | ~$3.68 † | reconstructed |
| GenA11y | Sonnet 4.6 | 53.0 | 18.1 | 0.407 | $21.91 | |
| GenA11y | Haiku 4.5 | 51.5 | 28.8 | 0.319 | $10.55 | |
| GenA11y | Gemini 3.7 | — | — | — | — | **not run** |
| GenA11y | Flash-Lite | — | — | — | — | **not run** |
| AccessGuru | Sonnet 4.6 | 65.2 | 41.8 | 0.315 | $45.43 | |
| AccessGuru | Haiku 4.5 | 59.1 | 41.1 | 0.293 | $19.95 | |
| AccessGuru | Gemini 3.7 | — | — | — | — | **not run** |
| AccessGuru | Flash-Lite | — | — | — | — | **not run** |
| *(ref)* GenA11y | *Gemini 3.5-flash* | *53.0* | *19.1* | *0.398* | *$4.51* | *corrected from $1.22* |
| *(ref)* AccessGuru | *Gemini 3.5-flash* | *53.0* | *29.6* | *0.323* | *$7.10* | *corrected from $1.85* |

## 4. Supplementary 585 — cost and performance

| Tool | Model | Recall | FPR | F1 | Cost | Notes |
|---|---|---:|---:|---:|---:|---|
| **Harness** | Sonnet 4.6 | 96.1 | 3.6 | **0.964** | $144.91 | recovered from chunks |
| **Harness** | Haiku 4.5 | 94.2 | 14.2 | 0.911 | $76.36 | recovered from chunks |
| **Harness** | Gemini 3.7 | — | — | — | — | **not run** |
| **Harness** | Flash-Lite | 78.1 | 17.8 | 0.805 | ~$6.03 † | reconstructed; provider-default effort |
| GenA11y | Sonnet 4.6 | 40.3 | 23.3 | 0.501 | $25.19 | |
| GenA11y | Haiku 4.5 | 36.5 | 19.6 | 0.474 | $12.52 | |
| GenA11y | Gemini 3.7 | — | — | — | — | **not run** |
| GenA11y | Flash-Lite (high) | 32.6 | 16.0 | 0.444 | ~$1.38 | reconstructed |
| GenA11y | Flash-Lite (default) | 20.0 | 9.5 | 0.312 | ~$0.29 | reconstructed |
| AccessGuru | Sonnet 4.6 | 42.9 | 45.8 | 0.467 | $63.46 | |
| AccessGuru | Haiku 4.5 | 43.2 | 54.2 | 0.452 | $20.19 | |
| AccessGuru | Gemini 3.7 | — | — | — | — | **not run** |
| AccessGuru | Flash-Lite (high) | 37.1 | 32.4 | 0.447 | ~$5.35 | reconstructed |
| AccessGuru | Flash-Lite (default) | 43.9 | 40.7 | 0.487 | ~$1.20 | reconstructed |

**† Upper bound.** These runs used context caching with input:output ratios of 25:1 to 75:1 but did not record
the cached/uncached split. Cached input bills at ~10% of normal input, so true spend may be materially lower —
possibly 2-3x lower at the highest ratios. No discount has been guessed; the figure is priced as if all input
were uncached.

---

## 5. Token counts

| Tool | Model | Set | Input | Output | Calls |
|---|---|---|---:|---:|---:|
| Harness | Sonnet 4.6 | 585 | 4,337 ‡ | 2,827,945 | 1,283 |
| Harness | Haiku 4.5 | 585 | 17,736 ‡ | 5,752,284 | 1,487 |
| Harness | Gemini 3.7 | ACT | 11,965,630 | 338,274 | — |
| Harness | Flash-Lite | ACT | 7,453,144 | 577,444 | — |
| Harness | Flash-Lite | 585 | 18,094,118 | 240,094 | 1,545 |
| GenA11y | Flash-Lite (high) | 585 | 510,092 | 489,921 | 422 |
| AccessGuru | Flash-Lite (high) | 585 | 1,846,000 | 1,920,248 | 585 |
| GenA11y | Gemini 3.7 | 389 | 289,268 | 131,043 | — |
| AccessGuru | Gemini 3.7 | 389 | 1,234,899 | 519,382 | — |

**‡ Claude input-token counts are not trustworthy.** 4,337 input tokens across 585 cases is implausible — the
Claude SDK reports cost directly and its token fields are not populated the way the Gemini path populates
them. **Use the Claude cost figures, not the Claude token figures.** Gemini token counts are reliable and were
used to derive every Gemini cost here.

---

## 6. What the cost data shows

**The harness costs 10-35x more per run than either baseline on the same model.** On the 389-case slice with
Gemini 3.7: harness $25.01, AccessGuru $2.87, GenA11y $0.71. It makes roughly 3 tool-calling model calls per
case with vision where the baselines make one. The accuracy gap is real, and so is the price of it.

**The token profiles are shaped oppositely, which is the architectural difference in numbers.** The harness is
input-heavy (11.9M in / 0.3M out on ACT — 35:1): it feeds large deterministic evidence bundles and asks for
short verdicts. The baselines are output-heavy (GenA11y Flash-Lite 0.5M in / 0.5M out — 1:1): they send a small
prompt and ask the model to generate findings. Input tokens are 5-12x cheaper than output tokens, which is why
the harness's much larger total token count does not translate into a proportionally larger bill.

**Model choice moves cost more than it moves accuracy, in both directions.** Harness on ACT: Gemini 3.7 scores
*higher* than Sonnet 4.6 (0.905 vs 0.895) at roughly a quarter of the cost ($10 vs $38). Flash-Lite at 0.851
costs a tenth of Sonnet. If cost matters at all, the Claude runs are not the configuration to deploy — they are
the configuration that proves the result is not model-specific.

**Flex halves Gemini spend** for variable latency (1-15 min, sheddable). Verified working end-to-end on
2026-09-06 at exactly 50% of standard. It is wired into both harness runners and both baselines, with the HTTP
timeout raised to 15 minutes — at the 60s default a slow-but-healthy flex response aborts and is recorded as a
fabricated no-verdict, which is the contamination class documented in Table 1m.

---

## 7. Coverage gaps

8 of the 24 tool×model×set cells are unrun, all of them Gemini:

* **ACT:** GenA11y and AccessGuru on both Gemini 3.7 and Flash-Lite (4 runs)
* **585:** harness on Gemini 3.7 and on Flash-Lite-high; GenA11y and AccessGuru on Gemini 3.7 (4 runs)

Pinned configuration for these: **Gemini 3.7 at `effort=medium`, Flash-Lite at `effort=high`** — matching the
existing runs they will be compared against. Both are set explicitly rather than inherited, because `medium` is
this repo's own default in `run-fn-llm.js` while the annotated suite logs `provider-default`; "default" is not
one setting across our runners.

Estimated cost at standard tier **$45-70**, dominated by the three harness runs; **~$25-35 on flex.**

---

## 8. How to reproduce

```
node eval/act-augmented/_tools/reconstruct-gemini-costs.js            # all runs
node eval/act-augmented/_tools/reconstruct-gemini-costs.js --json     # machine-readable
```

It calls `geminiCostUsd()` from the adapter rather than re-implementing the price table — deliberately, because
a second implementation reproduces the easy column and diverges silently on the hard one. It reads both summary
shapes (`llm.*` and `tokens.*`); reading only one silently skipped every ACT harness run, which is how the first
version of this document understated the corpus-wide total by $198.
