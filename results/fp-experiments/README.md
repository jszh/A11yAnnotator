# fp-experiments — controlled FP-reduction study artifacts (2026-06-24)

Data for the round-2 LLM-lane false-positive reduction study. **Code** lives in
`eval/checker-comparison/fp-experiments/`; **write-up** in
`docs/analysis/improvement-research-2026-06/FP-REDUCTION-CONTROLLED-ROUND2.md`. Headline: a fixed-evidence
judge-replay harness shows **no judge-design lever reduces FP without a comparable recall cost** (9 levers + a combo
+ a cross-family Gemini panel); the residual FPs are confident, cross-model-shared, and largely defensible. The one
validated fix is a targeted **4.1.2 name-scope sharpener** (flag-gated).

## Layout

```
packs/                         443 frozen evidence packs (one per reaches-LLM ACT case): the EXACT judge inputs
                               (subjects + visionByXpath crops + VSR transcript + checker hints + preliminary
                               deterministic build). Produced once by freeze-and-baseline.js; replayed cheaply.
sets/                          case-id lists (whitespace/newline-separated) used by --cases:
  decision-set.txt             95 decision-relevant packs (49 GT-fail + 21 FP-eligible + 25 control)
  recall-set.txt               106 packs (66 GT-fail + 40 pass control) for the recall round
  412-set.txt                  142 4.1.2 packs for the sharpener validation
runs/
  baseline/
    fp-base0                   tools-OFF baseline #0 over the full 458 (the freeze pass; also scored)
    fp-rep-baseline-k10        K=10 fixed-evidence noise-floor baseline (the reference for all A/Bs)
    fp-rep-baseline-recall     K=5 matched baseline on the recall-set
  methods/                     K=5 method screens vs the K=10 baseline (each results.rep1..5.json + aggregate.json):
    fp-rep-{apply-gate,grounded,boundary,refute,strip-question}-k5,
    fp-rep-grounded-strip-k5   the combination test
    fp-rep-strip-recall        distractor-strip on the recall-set
    fp-rep-sharpen412          the 4.1.2 name-scope sharpener validation (the one clean win)
  gemini/
    fp-gemini-refute           cross-family (Gemini) diverse-refuter over the baseline-flagged cases
probes/                        scratch / smoke / quota-probe runs (kept for provenance, not analysis)
logs/                          console logs of the long background runs
```

## Reproduce / extend

The harness defaults now point here, so no `--packs` is needed:

```
# re-judge under any method over the frozen evidence (no browser):
node eval/checker-comparison/fp-experiments/replay-judge.js --method=baseline --rep=5 --out=my-run
node eval/checker-comparison/fp-experiments/replay-judge.js --method=sharpen-412 --cases=results/fp-experiments/sets/412-set.txt --rep=5 --out=sharpen-check

# analyze K replicates (noise floor + per-case stable transitions A/B):
node eval/checker-comparison/fp-experiments/analyze-replicates.js \
  --dir=results/fp-experiments/runs/baseline/fp-rep-baseline-k10 \
  --dir2=results/fp-experiments/runs/methods/fp-rep-grounded-k5

# re-freeze evidence from scratch (needs Chrome + CLAUDE_CODE_OAUTH_TOKEN; ~13 min, --global-llm=5 to respect quota):
node eval/checker-comparison/fp-experiments/freeze-and-baseline.js --out=fp-base0 --global-llm=5
```

**Quota note:** the Claude subscription rate cap is burst-sensitive (recovers ~6 min). Run replays at
`--global-llm=5`; the harness aborts a dead-quota run (collapse-guard) rather than emitting garbage.
