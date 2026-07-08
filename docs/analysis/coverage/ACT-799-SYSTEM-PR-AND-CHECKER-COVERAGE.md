# Full selected corpus (799) — system P/R + rule-based-checker coverability

**Date:** 2026-07-07. **Code state for the new checker run:** `3418074e` (clean tree; the runner copy
`run-subset-checkers-coverage.js` + this analysis are committed in the same commit as this doc).

Answers two questions over the **full selected corpus** = the 22-SC `act-subset/` (**581** cases / 37 ACT
rules) + the 8-SC expansion slice of `act-rest/` (**218** cases / 13 rules) = **799 cases / 50 rules**:

1. What is the system's overall precision/recall on the full 799?
2. Same, restricted to the subset the **rule-based checkers cannot fully cover** — where a rule counts as
   uncovered **in full** if *any* of its testcases is not fully covered.

## Method — composition from existing runs (no new LLM runs)

Per-case system verdicts are composed from the already-measured runs (Claude Sonnet 4.6 lane):

| slice | n | source |
|---|---:|---|
| 581 pre-settled by the deterministic stack (`axeFlag`/`v3Flag`) | 123 | `upstream-evidence/v3-act-subset-proposed/raw.json` (the reaches-LLM split's base; zero drift re-verified through the R1–R3 gates). 111 GT-fail → TP, 12 non-fail → FP (axe's Table-1a FPs, surfaced by the harness) |
| 581 reaches-LLM | 458 | `results/skip-sonnet-46` (07-01, `752d5468`, best measured full-set run); **current-splice** overlays the post-round-3-fix targeted validations — `results/act-post-claude` (114-case 2.4.4+1.3.1 slice, `4c07d097`) and `results/act-5effbb-precedence2-claude` (18-case 5effbb slice, `e4a5c02d`) |
| expansion deterministic | 197 | `upstream-evidence/v3-act-rest-all` (recall 1.0 / FP 0) |
| expansion 1.3.3 LLM lane | 21 | `upstream-evidence/v3-act-rest-r3llm-postfix-run2` (stable-floor run: 4 TP / 3 FP; run1 adds 1 noise-flip FP) |

Checker coverability uses **two five-engine runs with identical scoring** (axe-core, IBM Equal Access,
HTML_CodeSniffer, alfa, QualWeb): the committed `act-rest` baseline (`f098edc1`) for the 13 expansion rules,
and a **new run over the full 581** (`upstream-evidence/act-subset-checkers/`, runner
`run-subset-checkers-coverage.js` — the act-rest runner pointed at `act-subset/`; 581/581, 0 pages missing).
**A rule is *fully coverable* iff ≥1 tool gets hard recall 1.0 on the rule's failed cases with 0 FP and 0
errors across all of the rule's cases** (rule-level ACT-id matching for axe/ibm/qualweb; SC-overlap scoring
for alfa/htmlcs, which expose no ACT ids — cross-fire caveat applies; `2t702h` is the only rule whose
coverage rests on alfa alone). Per-rule per-tool detail: `act-799-per-rule-checker-coverage.json`.
Verification: the analysis recomputes per-rule tp/fp from `raw.json` and agrees with the runners' own
`summary-by-rule.json` digests on **150/150** rule×tool pairs.

## (1) Full selected corpus — 799 cases (234 GT-fail / 565 pass+inapplicable)

| accounting | Recall | Precision | FP rate | F1 |
|---|---|---|---|---|
| raw ACT labels, 07-01 snapshot | 99.1 (232/234) | 88.2 (232/263) | 5.5 (31/565) | 0.934 |
| raw ACT labels, **current splice** | **99.1** (232/234) | **88.5** (232/262) | **5.3** (30/565) | **0.935** |
| `*` cross-rule GT override, current | 99.2 (234/236) | 89.3 (234/262) | 5.0 (28/563) | 0.940 |

Split: **581-corpus** current raw = 98.9 R / 86.6 P / 6.7 FP (F1 0.923); **expansion 218** = 100 R
(57/57) / 95.0 P / 1.9 FP (3/161, the 1.3.3 stable floor; F1 0.974).

Residuals (current splice): 2 FN — `0va7u6/bf023941` (1.4.5 image-of-text) and `d0f69e/6bb6ca5d` (1.3.1
table-header); 30 FP = 12 pre-settled (axe) + 15 reaches-LLM + 3 (1.3.3 floor).

## (2) Checker-uncoverable subset — 22 rules / 348 cases (102 GT-fail / 246 non-fail)

| accounting | Recall | Precision | FP rate | F1 |
|---|---|---|---|---|
| raw, 07-01 snapshot | 99.0 (101/102) | 86.3 (101/117) | 6.5 (16/246) | 0.922 |
| raw, **current splice** | **99.0** (101/102) | **87.1** (101/116) | **6.1** (15/246) | **0.927** |

(`*` = raw here: all 7 override cases sit in coverable rules.) Complement — the 451 coverable-rule cases —
scores 99.2 R / 89.7 P / 4.7 FP (F1 0.942): the system is nearly as precise on the slice **no rule engine
can decide** as on the slice engines fully cover.

### (2) by SC — testcase + rule counts

| SC | rules | rule ids | cases | GT-fail |
|---|---:|---|---:|---:|
| 1.1.1 | 2 | qt1vmo, e88epe | 36 | 8 |
| 1.3.1 | 1 | bc4a75 | 24 | 10 |
| 1.3.3 | 1 | 9bd38c | 21 | 4 |
| 1.4.3 | 1 | afw4f7 | 34 | 11 |
| 1.4.4 | 1 | 59br37 | 14 | 5 |
| 1.4.5 | 1 | 0va7u6 | 15 | 5 |
| 2.1.2 | 1 | 80af7b | 16 | 5 |
| 2.2.2 | 1 | efbfc7 | 11 | 1 |
| 2.4.1 | 3 | 3e12e1, cf77f2, ye5d6e | 34 | 7 |
| 2.4.10 | 1 | 047fe0 | 14 | 4 |
| 2.4.2 | 1 | c4a8a4 | 7 | 3 |
| 2.4.4 | 2 | 5effbb, fd3a94 | 42 | 14 |
| 2.4.6 | 2 | cc0f0a, b49b2e | 30 | 10 |
| 2.4.7 | 1 | oj04fd | 9 | 1 |
| 3.3.1 | 1 | 36b590 | 9 | 5 |
| 4.1.2 | 2 | kb1m8s, 4b1c6c | 32 | 9 |
| **total** | **22** | | **348** | **102** |

(SCs as recorded in the corpus manifests; all 22 uncoverable rules are single-SC, so columns sum exactly.)

### Fully coverable rules (28 of 50) and the covering tools

| SC(s) | rule | covering tools |
|---|---|---|
| 1.1.1, 4.1.2 | 59796f image-button-name | axe, ibm, qualweb, alfa |
| 1.1.1 | 23a2a8 image-name | axe, qualweb, alfa |
| 1.1.1 | 7d6734 svg-name | axe, qualweb, alfa |
| 1.1.1 | 8fc3b6 object-name | axe, ibm, qualweb, alfa |
| 1.3.1 | a25f45 headers-attr | axe, ibm, qualweb |
| 1.3.1 | ff89c9 required-context-role | axe, ibm, qualweb, alfa |
| 1.3.1 | d0f69e th-assigned-cells | qualweb |
| 1.3.5 | 73f2c2 autocomplete-valid | axe, qualweb, alfa |
| 1.4.12 | 24afc2 letter-spacing | ibm, qualweb, alfa |
| 1.4.12 | 9e45ec word-spacing | ibm, qualweb, alfa |
| 1.4.12 | 78fd32 line-height | ibm, qualweb |
| 1.4.4 | b4f0c3 meta-viewport | qualweb, alfa |
| 2.1.1 | akn7bn iframe-tab-order | qualweb |
| 2.1.1 | 0ssw9k scrollable-focusable | axe, qualweb |
| 2.2.1/2.2.4/3.2.5 | bc659a meta-refresh | axe, qualweb |
| 2.4.2 | 2779a5 page-title-exists | qualweb |
| 2.4.4, 4.1.2 | c487ae link-name | axe, ibm, qualweb |
| 2.5.3 | 2ee8b8 label-in-name | ibm, qualweb |
| 4.1.2 | 674b10 role-valid | axe, ibm, qualweb |
| 4.1.2 | m6b1q3 menuitem-name | axe, qualweb, alfa |
| 4.1.2 | 97a4e1 button-name | axe, ibm, qualweb, alfa |
| 4.1.2 | e086e5 form-field-name | axe |
| 4.1.2 | 307n5z presentational-children | axe, qualweb, alfa |
| 4.1.2 | 6cfa84 aria-hidden-focusable | qualweb |
| 4.1.2 | 4e8ab6 required-states-props | axe, ibm, qualweb, alfa |
| 4.1.2 | 2t702h summary-name | alfa (SC-level name-match) |
| 4.1.2 | 5c01ea aria-prop-permitted | axe, ibm, qualweb |
| 4.1.2 | cae760 iframe-name | axe, qualweb, alfa |

Near-misses worth noting (uncoverable, but an engine is close): `bc4a75` required-owned-elements (3 engines
at 9/10 + an htmlcs FP), `afw4f7` text-contrast (best 9/11 with FPs — the residual is exactly the
complex-backdrop territory established as LLM-owned).

## Caveats

- Single LLM run per point; full-pipeline FP noise floor is ±3 (Table 1c), the 1.3.3 slice ±1 — treat ±1pt
  precision movements as noise.
- The reaches-LLM composition rides the 07-01 full run; only the 2.4.4/1.3.1/5effbb lanes were re-measured
  post-round-3 (spliced above). A fresh full-458 run would be the authoritative "current" number.
- Machine-readable deliverables: `act-799-full-corpus-sc-rule-cases.json` and
  `act-799-checker-uncovered-sc-rule-cases.json` (SC → ACT rule → testcaseIds; multi-SC rules — 59796f,
  c487ae, bc659a — appear under each of their SCs), `act-799-per-rule-checker-coverage.json` (per-rule
  per-tool tp/fn/fp + coveredBy).
