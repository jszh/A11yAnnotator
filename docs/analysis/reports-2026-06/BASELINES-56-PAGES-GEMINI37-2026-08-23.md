# GenA11y + axe baselines over the 56-page corpus (Gemini 3.7 Flash, effort high)

Date: 2026-08-23. Base commit `410f7d8f` (working tree carried uncommitted GenA11y fixes — see
"Code changes" below; the runs used the hashes recorded in the run manifests).

## What was run

Both baselines ran over the SAME 56 saved webpages the harness's Gemini-3.7 run used
(`results/56-page-runs/current/saved-elements-stratified774-gemini37-flash-high-20260820-combined-repaired`),
loaded from the same annotator server with the same per-page `?offline=1[&noscript=1]` query. The page
list is pinned in `eval/56-page-baselines/page-list-56.json`, derived from the harness run's own page
artifacts rather than re-sampled. Corpus identity was verified by a rollup SHA-256 over all 56 files:
`6485407f19ad3557f374152f6fcac1aac4f86ff367095eb108636354783cab78`, identical on the Mac, `~/a11y-rubfix`
and `~/a11y-s12`.

| Run | Output | Result |
| --- | --- | --- |
| axe-core 4.10.3 | `results/axe-56-20260823-server` | 56/56 pages, 0 errors, 2,901 violation rows, 45 distinct violating rules, 11 SCs |
| GenA11y (gemini-3.7-flash, high) | `results/gena11y-56-gemini37-high-20260823-combined` | 1,456 cases = 56 pages x 26 SCs; 840 LLM-bearing, 616 structural abstains; 314 flagged, 525 not flagged, **0 noVerdict**, 1 unrecoverable error |
| Comparison | `results/compare-56-20260823/three-way-56.{json,md}` | three views (lane coverage / page x SC / element) |

GenA11y spend: 4,380 API calls, 247.5M input + 10.0M output tokens, **$223.10** at the 3.7-Flash
promotional rate ($0.75/$3.75 per M). Wall clock 91.5 min at `--pages 32 --tabs 16 --llm-conc 60` on
`a11y-perf-c4`. This is ~180x the GenA11y spend on the 585-case supplementary benchmark ($1.22): real
pages are far larger than ACT fixtures, and the cost is dominated by a long tail of 2.4.4 (link purpose)
lanes on link-dense pages, where chunking produced single cases costing tens of dollars and running
30-47 minutes.

axe already runs inside the harness collector, so its findings were also embedded in the 774 run. The
standalone pass was verified byte-identical to those embedded results on a spot-checked page; it exists
because the collector keeps only the surfaced allow-list, while this pass keeps the full result.

## Three bugs fixed in the GenA11y adapter before the run

These are pre-existing defects in this repo's GenA11y adaptation, not in the comparison. All three
suppressed GenA11y findings, so every prior GenA11y number in this project was produced with them live.

1. **No XPath was ever emitted, on any SC, in any run.** `xpath_utils._GET_XPATH_JS` was a bare IIFE.
   Selenium wraps `execute_script` in a function body, so with no `return` it always yielded `None`;
   `get_element_xpath` swallowed that as `''` and `format_with_xpath` then dropped the `[path: ...]`
   label for every element — while the shared system prompt kept instructing the model to echo XPaths
   back. Prefixing `'return '` alone does NOT fix it: the IIFE began on the next line, so
   automatic-semicolon-insertion still returned undefined. Confirmed in the historical traces
   (`grep -c "\[path: /html"` returns 0-1 across the supplementary585 runs).
   **Consequence:** GenA11y could not attribute a finding to an element, so no element-level comparison
   with the harness was possible at all.

2. **`max_output_tokens=4096` truncated high-effort answers.** Gemini bills thinking tokens against
   `maxOutputTokens`; at effort=high on a real page the model spent ~3,930 tokens thinking, leaving
   ~160 for the answer. Fixed by sizing the budget to the thinking level
   (MINIMAL/LOW 8192, MEDIUM 16384, HIGH 32768) with the doubling ceiling raised to 65536.

3. **A truncated or unparseable response was recorded as `NOT REPRODUCED`.** `_error_verdict` returned
   a clean negative for transport and parse failures alike, and the truncation retry only fired when
   there was *no* answer — so a cut-off response was parsed as "no violations". Combined with (2) this
   was a silent false-negative generator: 3 of 6 smoke cases hit MAX_TOKENS and were all booked as
   negatives. Fixed with a distinct `_no_verdict` ("NO VERDICT") that the runner books as `noVerdict`,
   a truncation retry that fires whenever `finishReason == MAX_TOKENS`, and an aggregation rule that
   drops failed chunks rather than merging them in as findings. `_error_verdict` still means "no
   applicable data on this page" — a genuine negative — and was left alone.

Effect on a 2-page smoke: 2 flags -> 4 flags / 34 attributed elements, 0 truncations. Across the full
840-case run: **`noVerdict: 0`**, so none of the 525 negatives are silent truncations.

**These fixes change GenA11y's prompt content and therefore its verdicts.** The GenA11y rows in
PAPER-TABLES-CONTRIBUTIONS.md (ACT subset, act-augmented, supplementary585) were all produced pre-fix
and are not comparable to this run. Re-running them is cheap on the fixture corpora (~$1-5) and is
recommended before any of those numbers are published.

## Caveats that bound the comparison

- **No ground truth.** Real pages carry no labels. The runner now refuses to emit a confusion matrix for
  an unlabeled corpus and reports a verdict tally instead; scoring these as TP/FP would invent labels.
  Nothing below is precision or recall — it is agreement between tools.
- **GenA11y attributes ~88% of its findings correctly.** Of 2,793 reported violation elements, 2,584
  carried an XPath and 2,276 (88.1%) resolve in the live DOM (1 tag mismatch among those). Per SC the
  resolution rate is 95-100% except 1.1.1 (363/551, 66%) and 1.3.1 (593/675, 88%). The ~12% that do not
  resolve are model-authored paths that fail the element-level join, so the element-level column
  understates GenA11y by roughly that margin.
- **One case never completed.** `NFL on ESPN :: 1.3.1` exceeded GenA11y's 120s ChromeDriver read timeout
  on the full run and again on a dedicated retry at concurrency 1. It is a genuine limit of GenA11y's
  per-element extraction on that page, not contention. 3 other timeouts recovered on retry
  (`eval/56-page-baselines/merge-gena11y-retries.js`; a retry may only replace a case the base run
  recorded as an error).
- **The three tools do not share a unit of work.** The harness mints obligations per element; GenA11y
  judges once per (page, SC); axe emits rule findings per node. Counts are only comparable inside a
  stated denominator, which is why the comparison carries three views rather than one headline.

## Results

### Lane coverage

Of the 21 SCs the 774-element sample spans, **GenA11y evaluates 10** and **axe has a rule for 8**.
GenA11y additionally covers 5 SCs outside the sample (1.3.2, 1.4.10, 2.4.10, 3.3.2, 3.3.3), which is why
the run is 26 SCs wide; those 5 are 280 of the 840 LLM cases. The 11 sampled SCs GenA11y cannot evaluate
(1.4.4, 1.4.12, 1.4.13, 2.1.1, 2.1.2, 2.2.1, 2.2.2, 2.4.3, 2.4.7, 2.5.3, 4.1.3) are recorded as explicit
zero-cost `uncovered` rows rather than omitted, so the coverage gap is visible per page.

### Page x SC (1,176 cells = 56 pages x 21 sampled SCs)

| | cells flagged |
| --- | ---: |
| harness barrier | 264 |
| GenA11y flagged | 204 |
| axe violation | 127 |
| all three | 86 |
| harness only | 135 |
| GenA11y only | 72 |
| axe only | 8 |

Restricted to the 560 cells GenA11y actually evaluates — the only fair head-to-head — the harness flags
152, GenA11y flags 204, and they agree on 114 (75.0% of the harness's flags in those lanes), with 38
harness-only and 90 GenA11y-only.

### Element level (the harness's 774-element stratified sample)

| | elements |
| --- | ---: |
| sampled | 774 |
| harness flagged a barrier | 379 |
| in a lane GenA11y evaluates | 400 |
| GenA11y named the SAME element | 60 |
| GenA11y flagged that page+SC (any element) | 232 |
| axe violation on the SAME element | 83 |

Of the 379 sampled elements the harness flagged: 184 sit in a lane GenA11y evaluates, GenA11y
independently named 59, axe named 82, and **285 (75.2%) were named by neither baseline**.

Element-level agreement concentrates in the name/purpose SCs — 1.1.1 (18 of 31), 2.4.4 (21 of 38),
4.1.2 (17 of 60), 1.4.3 (4 of 24) — and is zero for 1.3.1, 1.4.1, 1.4.5, 2.4.2, 2.4.6 and 3.3.1, where
GenA11y flags the page but names different elements than the harness sampled.

## Reproduction

```
node eval/56-page-baselines/build-page-list.js
node eval/56-page-baselines/run-axe-56.js --out=axe-56-<date> --pages=8
cd eval/gena11y && python runner.py --corpus saved-pages --model gemini-3.7-flash --effort high \
    --pages 32 --tabs 16 --llm-conc 60 --out gena11y-56-<date>
node eval/56-page-baselines/validate-gena11y-xpaths.js --gena11y=gena11y-56-<date>
node eval/56-page-baselines/compare-56.js --gena11y=gena11y-56-<date> --axe=axe-56-<date> --out=compare-56-<date>
```

The 632 MB GenA11y `llm-trace.jsonl` was left on `a11y-perf-c4` at
`~/a11y-rubfix/results/gena11y-56-gemini37-high-20260823-server/llm-trace.jsonl` (too large to transfer).
