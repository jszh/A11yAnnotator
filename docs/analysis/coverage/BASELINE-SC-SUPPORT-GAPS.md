# External-baseline SC support gaps — GenA11y & AccessGuru on both ACT corpora

**Date:** 2026-07-08. Companion JSON (machine-readable, incl. per-rule case counts and per-run empirical
verification): [`BASELINE-SC-SUPPORT-GAPS.json`](./BASELINE-SC-SUPPORT-GAPS.json). New runs this doc adds:
`results/gena11y-actrest` (structural, $0), `results/accessguru-actrest-gemini` ($0.68),
`results/accessguru-actrest-gpt5mini` — the two external baselines over the **8-SC expansion slice**
(218 cases / 13 ACT rules of `act-rest/`), via `--corpus act-rest` added to both adapters' runners.
Previous-subset (581) analysis re-derived from the stored runs `results/gena11y-act-*` and
`results/accessguru-act-*` (Tables 1f/1g).

**What "explicitly supports" means here** (structural, verified empirically per run):

- **GenA11y** supports an SC iff its element-extraction implements it (`consts.py COVERED_SCS`, 15 SCs;
  `extract_for_sc` returns `None` otherwise → the case is never extracted or judged).
- **AccessGuru** supports an SC iff its axe-4.4.1 `mapping_dict_file.json` or its 12-type semantic
  taxonomy maps some violation to it. The **element-scoped `*`** variant (the paper's fair-comparison
  primary) drops best-practice-only axe rules, which removes any SC reachable *only* through them.
- Unsupported cases score as **uncovered=Negative** (abstain): a GT-fail is an FN, a GT-pass/inapplicable
  a TN — the identical-denominator accounting of Tables 1f/1g.

## GenA11y

Supported (15): 1.1.1, 1.3.1, 1.3.2, 1.4.1, 1.4.3, 1.4.5, 1.4.10, 2.4.2, 2.4.4, 2.4.6, 2.4.10, 3.3.1,
3.3.2, 3.3.3, 4.1.2.

### Previous subset (581 / 13 SCs / 37 rules) — runs `gena11y-act-gemini`, `gena11y-act-gpt5mini`

| unsupported SC | ACT rules | cases | GT-fail |
|---|---|---:|---:|
| 2.1.1 Keyboard | akn7bn, 0ssw9k | 25 | 3 |
| 2.1.2 No Keyboard Trap | 80af7b | 16 | 5 |
| 2.4.7 Focus Visible | oj04fd | 9 | 1 |
| **total** | **4 rules** | **50** | **9** |

Empirical: both stored runs contain exactly the 531 covered-SC cases (the 50 above were excluded at load
→ abstain-Negative in `analyze.py`'s full-581 accounting). These are the interaction SCs GenA11y's
static extract→judge design cannot address.

### Extended set (218 / 8 SCs / 13 rules) — run `gena11y-actrest`

**GenA11y explicitly supports NONE of the 8 expansion SCs** — 1.3.3, 1.3.5, 1.4.4, 1.4.12, 2.2.1, 2.2.2,
2.4.1, 2.5.3 (13 rules / 218 cases / 57 GT-fail, full table in the JSON). The run is a verified
structural abstain-all: 218/218 records emitted `uncovered`, **0 LLM calls, $0.00** → uncovered=Negative
scores **recall 0/57, FP 0/161, precision undefined** (model-independent). These SCs are outside its
15-SC extraction design: input-purpose semantics, spacing/zoom relayout, timing, sensory language,
bypass mechanisms, label-in-name — none have an extraction routine.

## AccessGuru

Supported: axe-mapping (faithful) 32 SCs; element-scoped `*` drops **1.4.4** (reachable only via the
best-practice-only `meta-viewport` rule); semantic taxonomy 15 SCs (union column in the JSON).

### Previous subset (581) — runs `accessguru-act-gemini`, `accessguru-act-gpt5mini`

| unsupported SC | ACT rules | cases | GT-fail |
|---|---|---:|---:|
| 1.4.5 Images of Text | 0va7u6 | 15 | 5 |
| 2.1.2 No Keyboard Trap | 80af7b | 16 | 5 |
| 2.4.7 Focus Visible | oj04fd | 9 | 1 |
| 3.3.1 Error Identification | 36b590 | 9 | 5 |
| **total** | **4 rules** | **49** | **16** |

Empirical: in both stored runs **neither detector ever produced a flag mapping to any of these 4 SCs**
(same under faithful and element-scoped) — the structural gap is exactly the observed gap. Note 3.3.1:
GenA11y supports it (screenshot heuristic), AccessGuru does not — the two baselines' gaps only partially
overlap (2.1.2 and 2.4.7 are unsupported by both; those two plus 2.1.1 are also GenA11y-unsupported).

### Extended set (218) — runs `accessguru-actrest-gemini`, `accessguru-actrest-gpt5mini`

Structurally unsupported: **1.3.3** (9bd38c, 21 cases / 4 fail) and **2.2.2** (efbfc7, 11 / 1) under
both accountings; **+1.4.4** (b4f0c3 + 59br37, 30 / 12) under element-scoped `*`. Empirically, both runs
additionally never flagged **2.4.1** (cf77f2/ye5d6e/3e12e1, 34 / 7): axe's bypass rule is *mapped* but
fired on **zero** of the 34 fixtures — **mapped-but-inert**, effectively unsupported on this corpus.
Similarly axe's 2.5.3 label-in-name rule ships disabled (fired 0); 2.5.3's only live support is the
semantic taxonomy (caught 1/5).

Results over all 218 (57 fail / 161 non-fail), uncovered=Negative:

| variant | model | Recall | Precision | FP rate | F1 |
|---|---|---|---|---|---|
| axe-faithful ∪ semantic | Gemini 3.5-flash | 59.6 (34/57) | 44.2 | 26.7 (43/161) | 0.507 |
| axe-faithful ∪ semantic | GPT-5.4-mini | 59.6 (34/57) | 44.7 | 26.1 | 0.511 |
| **axe`*` ∪ semantic (element-scoped)** | Gemini 3.5-flash | 50.9 (29/57) | 40.8 | 26.1 (42/161) | 0.453 |
| **axe`*` ∪ semantic (element-scoped)** | GPT-5.4-mini | 50.9 (29/57) | 41.4 | 25.5 | 0.457 |
| semantic only | either | 1.8 (1/57) | 33–50 | 0.6–1.2 | 0.03 |

Per-SC (element-scoped, identical across both models): 1.3.5 **10/10** caught (1 FP); 1.4.12 **14/14**
caught but **33/48 FP** (the known axe spacing over-fire); 2.2.1 **4/4** caught with **6/11 FP**
(sibling-exception cross-fire: axe flags the 0-second refresh bc659a permits); 1.3.3, 1.4.4, 2.2.2,
2.4.1 **0 caught**; 2.5.3 1/5 (semantic). The model again barely matters — the axe backbone is
model-independent and the semantic detector contributes 1 TP on these SCs.

**Context:** the harness's expansion lanes score 100 R / 95.0 P / 1.9 FP on the same 218 (Table 1a-rest
rounds 1–3); best single engine QualWeb ~97 R / 0 FP rule-level. AccessGuru's hybrid lands at 51–60 R /
26% FP here, and GenA11y cannot run at all — the expansion SCs sit squarely in both baselines'
structural blind spots.

## Provenance

Runner changes: `--corpus act-rest` in `eval/gena11y/runner.py` (+ structural-uncovered short-circuit,
zero driver/LLM for unsupported SCs) and `eval/accessguru/runner.py` (loader for the 13 expansion rules;
`reaches` not meaningful → false). Scoring: `scratchpad score-actrest-baselines.js` logic mirrored from
`eval/accessguru/analyze.py` (BP-only exclusion identical). Support sets computed from
`eval/gena11y/consts.py` and `eval/accessguru/ag_consts.py`/`data/` — not hand-listed. Empirical
verification per run in the companion JSON (`neverFlaggedFaithful` / `neverFlaggedScoped` /
`uncoveredRecords`).
