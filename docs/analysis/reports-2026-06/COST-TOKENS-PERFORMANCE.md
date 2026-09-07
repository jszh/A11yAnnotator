# Cost, tokens and performance — 3 tools × 4 models

Companion to `PAPER-TABLES-CONTRIBUTIONS.md` Table 1m. That table carries the accuracy claim; this one carries
what each result cost to produce. Last updated 2026-09-07.

**Tools:** our harness, GenA11y, AccessGuru. **Models:** Claude Sonnet 4.6, Claude Haiku 4.5, Gemini 3.7 Flash,
Gemini 3.5 Flash-Lite, qwen3.8-flash (via OpenRouter).

---

## 1. Read this first — the cost figures were broken until 2026-09-06

Four independent accounting defects were found while assembling this document. All are fixed going forward,
but they affect how historical numbers should be read.

| # | Defect | Effect | Status |
|---|---|---|---|
| 1 | **Gemini was never priced.** The API returns token counts but no cost field, and nothing in the JS path priced them. | Every harness Gemini run recorded **$0**. | Fixed — `geminiCostUsd()` in `llm-agent-adapter.js`; historical runs recoverable from tokens via `reconstruct-gemini-costs.js`. |
| 2 | **Python baselines mispriced `gemini-3.5-flash`** at $0.30/$2.50 — those are *Flash-Lite's* rates; 3.5-flash is $1.50/$9.00. | GenA11y/AccessGuru 3.5-flash runs understated ~4x (`accessguru-act-gemini` $1.85 → **$7.10**). | Fixed, with longest-prefix matching so `flash-lite` no longer collides with `flash`. |
| 3 | **`chunkctl.py` summed only `tokens.costUsd`**, but the annotated suite records under `llm.costUsd`. | Every assembled 585 run reported **$0.00** against real spend (Sonnet **$144.91**, Haiku **$76.36**). | Fixed; both assemblies rebuilt, rows and metrics byte-identical. |

**Defect 4 (found 2026-09-07): cached input was charged twice.** Gemini's `promptTokenCount` already
INCLUDES `cachedContentTokenCount`, so passing both the full prompt count and the cached subset billed the
cache at the uncached rate AND again at the cache rate. `supplementary585-ours-gem37` recorded **$22.32**
against an actual **$15.00** (49% overstated). Caught only because the flex figure was not exactly half the
standard one, which it must be by construction. Fixed in `geminiCostUsd`; the artifact was corrected in place
by `recost-gemini-run.js`, which preserves the old value as `costUsdPrevious` so a corrected artifact never
looks like it was always right. A scan found no other artifact with this shape.

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
| qwen3.8-flash (OpenRouter) | 0.15 | 0.47 | reported | n/a — OpenRouter returns `usage.cost`, the amount actually charged |

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
| GenA11y | Gemini 3.7 | 51.5 | 14.5 | **0.433** | $0.52 | best baseline row on ACT |
| GenA11y | Flash-Lite (high) | 47.0 | 21.7 | 0.341 | $0.70 | |
| GenA11y | qwen3.8 (default reasoning) | 56.1 | 35.5 | 0.306 | $0.39 | highest recall, worst FPR |
| GenA11y | qwen3.8 (effort=low) | 45.5 | 31.4 | 0.274 | $0.31 | |
| AccessGuru | Sonnet 4.6 | 65.2 | 41.8 | 0.315 | $45.43 | |
| AccessGuru | Haiku 4.5 | 59.1 | 41.1 | 0.293 | $19.95 | |
| AccessGuru | Gemini 3.7 | 56.1 | 25.0 | **0.368** | $1.22 | |
| AccessGuru | Flash-Lite (high) | 60.6 | 32.4 | 0.343 | $1.45 | |
| AccessGuru | qwen3.8 (default reasoning) | 54.5 | 40.1 | 0.278 | $0.95 | |
| AccessGuru | qwen3.8 (effort=low) | 45.5 | 39.8 | 0.238 | $0.82 | |
| *(ref)* GenA11y | *Gemini 3.5-flash* | *53.0* | *19.1* | *0.398* | *$4.51* | *corrected from $1.22* |
| *(ref)* AccessGuru | *Gemini 3.5-flash* | *53.0* | *29.6* | *0.323* | *$7.10* | *corrected from $1.85* |

## 4. Supplementary 585 — cost and performance

| Tool | Model | Recall | FPR | F1 | Cost | Notes |
|---|---|---:|---:|---:|---:|---|
| **Harness** | Sonnet 4.6 | 96.1 | 3.6 | **0.964** | $144.91 | recovered from chunks |
| **Harness** | Haiku 4.5 | 94.2 | 14.2 | 0.911 | $76.36 | recovered from chunks |
| **Harness** | **Gemini 3.7** | **95.2** | **5.5** | **0.952** | **$15.00** | flex; best cost/accuracy of any run |
| **Harness** | Flash-Lite | 78.1 | 17.8 | 0.805 | ~$6.03 † | reconstructed; provider-default effort |
| GenA11y | Sonnet 4.6 | 40.3 | 23.3 | 0.501 | $25.19 | |
| GenA11y | Haiku 4.5 | 36.5 | 19.6 | 0.474 | $12.52 | |
| GenA11y | Gemini 3.7 | — | — | — | $0.67 | run complete; scoring pending |
| GenA11y | qwen3.8 (default) | 28.1 | 12.7 | 0.403 | $0.32 | **UNRELIABLE — see §5a** |
| GenA11y | qwen3.8 (low) | 28.1 | 13.5 | 0.401 | $0.29 | **UNRELIABLE — see §5a** |
| GenA11y | Flash-Lite (high) | 32.6 | 16.0 | 0.444 | ~$1.38 | reconstructed |
| GenA11y | Flash-Lite (default) | 20.0 | 9.5 | 0.312 | ~$0.29 | reconstructed |
| AccessGuru | Sonnet 4.6 | 42.9 | 45.8 | 0.467 | $63.46 | |
| AccessGuru | Haiku 4.5 | 43.2 | 54.2 | 0.452 | $20.19 | |
| AccessGuru | Gemini 3.7 | — | — | — | $2.08 | run complete; scoring pending |
| AccessGuru | qwen3.8 (default) | 28.4 | 34.5 | 0.357 | $1.37 | |
| AccessGuru | qwen3.8 (low) | 30.0 | 25.5 | 0.393 | $0.86 | |
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

### 5a. Two runs are contaminated and must not be quoted

`supplementary585-gena11y-qwen38` and `-qwen38-low` carry **101 (17.3%) and 70 (12.0%) no-verdict rows**
against 0.0-0.9% for the same tool on every other model, and 0.0% for AccessGuru on the same model and corpus.
So this is specific to GenA11y x qwen x 585, not a property of either the tool or the model alone.

Root cause, from the run's own trace: **70 of 422 calls returned `retry-exhausted`** — the transport burned
every retry and returned null. Those became fabricated negatives, so recall is understated by an unknown
amount and the F1 in the table above is a floor, not a measurement. The runs are NOT re-scored or discarded
here because the tokens and cost are still valid; only the accuracy columns are unusable.

Diagnostic gap this exposed, now fixed: the transport recorded only the string `retry-exhausted` and discarded
the underlying provider error, making the failure undiagnosable from the artifact. It now carries the last
real cause (`retry-exhausted: <http-status | provider message | exception>`), so a repeat is explicable
without re-running.

### 5b. qwen reasoning effort is a much smaller lever than a smoke test suggested

Measured on a 3-case prompt, `effort=low` cut output from ~1,539 to ~209 tokens/case — a 7.4x reduction. On
the real 531-case ACT corpus the reduction is **21%** (1,539 -> 1,213), and reasoning is still ~100% of output.
A trivial prompt has little to reason about at any setting, so it cannot measure a reasoning lever; the
7.4x figure was an artefact of the test, not a property of the model. Cost follows: $0.39 -> $0.31, not $0.05.

Accuracy got *worse*, not better: GenA11y ACT F1 0.306 -> 0.274. It lost 7 true positives (37 -> 30) to remove
16 false positives (139 -> 123). qwen's false-positive rate is a judgment property, not a thinking-budget
artefact.

---

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

## 7. Coverage — what is now run

All 8 originally-missing Gemini cells completed 2026-09-06/07, plus 8 qwen3.8-flash baseline runs
(4 default reasoning + 4 at `effort=low`). Configuration was pinned explicitly on every run — Gemini 3.7 at
`effort=medium`, Flash-Lite at `effort=high` — because `medium` is `run-fn-llm.js`'s own default while the
annotated suite logs `provider-default`, so "default" is not one setting across our runners.

Still outstanding:

* **harness x qwen3.8-flash (585, low thinking, tools ON)** — running on GCE. Required building OpenRouter
  transports for the JS layer (`makeOpenRouterTransport`, `makeOpenRouterToolTransport`): `makeOpenAITransport`
  could not be repointed because it targets `/v1/responses`, which OpenRouter does not serve.
  Estimated **$5-8** (see below).
* **harness x Flash-Lite (585, effort=high)** — running on tricycle.
* GenA11y/AccessGuru x Gemini 3.7 on the 585 are complete but not yet scored.

**Cost estimate method, for the harness x qwen run.** Three approaches disagreed and the disagreement was the
useful part: scaling smoke tokens at list price gave $10.81, repricing Gemini 3.7's token profile with qwen's
output ratio gave $10.16, but scaling the API-*charged* cost per case gave $4.56. The gap is caching —
**83% of the smoke's input tokens were cache reads**, so the API charged 42% of list. The charged figure is
the trustworthy one because it already accounts for caching; the token-based ones price cached input at full
rate. Expect **$5-8**, with the main risk being cache TTL expiring between cases at 16-way concurrency, which
would push it toward $10.

**A note on the tool-call counter.** `toolUse.calls` reads 0 for OpenRouter exactly as it does for Gemini —
the counter is Claude-shaped. Tool use on those providers must be evidenced another way; for the qwen harness
run it was confirmed by instrumenting the transport directly (12 tool-call rounds across 2 cases, hitting
`query_ax_node`, `capture_full_page`, `measure_geometry_live`, `ocr_image_text`, `resolve_destination`).
**Do not read that 0 as "no tools were used."**

## 8. How to reproduce

```
node eval/act-augmented/_tools/reconstruct-gemini-costs.js            # all runs, from tokens
node eval/act-augmented/_tools/reconstruct-gemini-costs.js --json     # machine-readable
node eval/act-augmented/_tools/recost-gemini-run.js <run> --tier=flex # correct one artifact in place
```

`recost-gemini-run.js` refuses to guess the service tier: flex vs standard is a 2x difference, and guessing it
would reintroduce exactly the error class it exists to undo. It preserves the prior value as `costUsdPrevious`.

It calls `geminiCostUsd()` from the adapter rather than re-implementing the price table — deliberately, because
a second implementation reproduces the easy column and diverges silently on the hard one. It reads both summary
shapes (`llm.*` and `tokens.*`); reading only one silently skipped every ACT harness run, which is how the first
version of this document understated the corpus-wide total by $198.
