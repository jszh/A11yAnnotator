# Paper-style results tables + contributions (draft)

All numbers are measured on this repo's runs; see `docs/analysis/GENERALIZATION-AND-NOOBLIGATION.md`
for provenance. Treat citations as representative anchors to verify, not final references.

## Evaluation setup

W3C **ACT-Rules** testcases, restricted to the *reaches-LLM* set — the cases the deterministic stack does
**not** pre-settle, i.e. the hard subset where a target-SC obligation stays auto-PARTIAL and reaches the LLM:
**458 testcases** (66 GT-fail, 392 GT-pass/inapplicable), spanning **37 ACT rules / 13 WCAG success criteria**.
Ground truth is per-SC (ACT GT is per success-criterion). Metrics: **Recall** = caught / GT-fail;
**FP rate** = flagged / (GT-pass + inapplicable); **Precision** = TP / (TP+FP).

## Table 1 — Main result (ablation)

| Configuration | Recall ↑ | FP rate ↓ | Precision ↑ | F1 ↑ |
|---|---|---|---|---|
| Deterministic checkers only (−LLM) | 15.2 (10/66) | **0.3** (1/392) | **90.9** | 0.26 |
| LLM lane only (prior harness) | 53.0 (35/66) | 11.0 (43/392) | 44.9 | 0.49 |
| **Full harness (checkers + LLM)** | **75.8** (50/66) | 3.3 (13/392) | 79.4 | **0.78** |

Read-off: the deterministic layer is high-precision / low-recall; an LLM-only lane is the inverse; their
**facet-routed combination dominates both** (+22.8 recall and −7.7 FP vs the prior LLM-only system; +60.6
recall vs deterministic-only). The full harness's false positives are **entirely LLM over-flags** — the
deterministic layer contributes ~0 (0.3% FP, single case) — so combining the lanes the LLM lane *itself*
drops from 43 → 13 FPs, because the checkers subtract settled obligations before they reach the LLM.

```latex
\begin{table}[t]\centering
\caption{Ablation on the W3C ACT reaches-LLM set (458 cases: 66 fail, 392 pass/inapplicable; 37 ACT rules, 13 WCAG SCs; per-SC scoring).}
\label{tab:main}
\begin{tabular}{lcccc}
\toprule
Configuration & Recall $\uparrow$ & FP rate $\downarrow$ & Precision $\uparrow$ & F1 $\uparrow$\\
\midrule
Deterministic checkers only ($-$LLM) & 15.2 & \textbf{0.3} & \textbf{90.9} & 0.26\\
LLM lane only (prior harness) & 53.0 & 11.0 & 44.9 & 0.49\\
\textbf{Full harness (checkers $+$ LLM)} & \textbf{75.8} & 3.3 & 79.4 & \textbf{0.78}\\
\bottomrule
\end{tabular}\end{table}
```

## Table 1b — Component ablation (what each part contributes)

Two denominators (the harness is two-stage: a deterministic pre-settle, then an LLM lane over the residual):

**(i) Existing-checker baseline — full 581-corpus** (177 fail, 404 pass/inapplicable). We verified the
"best existing checker" claim against a FIVE-engine comparison (axe-core, IBM Equal Access, QualWeb [the
W3C ACT-Rules reference], HTML_CodeSniffer, Alfa), not axe alone:

| System | Recall ↑ | FP rate ↓ | Precision ↑ | F1 ↑ |
|---|---|---|---|---|
| **axe-core only** (best single) | 59.9 (106/177) | **3.0** (12/404) | **89.8** | 0.72 |
| axe ∪ htmlcs (max-recall union) | 60.5 (107/177) | 12.1 (49/404) | 68.6 | 0.64 |

Why axe-core is the fair baseline (verified on THIS corpus, not assumed):
- **IBM Equal Access**: its decided SCs (1.4.12, 2.5.3) and review-prior SCs (1.4.1, 1.3.3) are **not in the
  corpus's 13 SCs at all** → contributes 0.
- **QualWeb** (W3C ACT-Rules reference impl): catches **0/8** of a residual-failure sample — the cases the
  harness recovers are dynamic (keyboard-trap, focus-rests) or semantic (link-purpose, descriptiveness), which
  no *static* engine, even the ACT reference, decides.
- **HTML_CodeSniffer**: adds exactly **1** unique catch over axe (+0.6 recall) but **quadruples FP** (3.0→12.1)
  and craters precision (89.8→68.6) — the known "spray" noise. Not a useful addition.
- **Alfa**: 0 unique (prior comparison analysis).
- The checkers' *indeterminate*/review flags are NOT decided catches; they are the LLM lane's *evidence*, so
  they do not belong in this baseline. VERIFIED end-to-end (not assumed): only **axe's `incomplete`** findings
  are wired into the harness and reach the LLM — the prompt block `"external-checker cross-signal … flagged for
  REVIEW"` appears in 2 run8 cases (both kb1m8s/4.1.2), and the LLM's thinking *starts from it*
  (tc 17a785ed: "The checker flagged aria-prohibited-attr … let me check the computed role" → tool probe →
  REPRODUCED on an `aria-label`-on-generic case the deterministic detector does NOT catch). **IBM, htmlcs,
  QualWeb, and Alfa were run only in the standalone comparison, NOT inside the harness (`runChecker`=0), so
  their indeterminate signals never reached the LLM in these runs.** (The designed multi-checker uncertainty
  merge exists in code but only axe's leg is active.)

**(ii) LLM-lane ablation — on the reaches-LLM *residual* (458 cases axe does NOT flag, so axe = 0 here by
construction; this is precisely the existing-checker gap):**

Decomposed into the **deterministic floor** + the **LLM lane's OWN** contribution (LLM-flagged barriers),
so the LLM's value is not hidden behind the always-on detectors. These are disjoint: end-to-end = det ∪ LLM.

Last four columns (Recall / FP / Precision / F1) are the combined det ∪ LLM end-to-end output.

Evidence tiers (NONE feeds raw HTML/markup — the harness describes each element structurally, never as a snippet):
- **existing-checker evidence** ("harness − v3") — what an LLM bolted onto existing checkers sees. Per residual
  case the prompt is: xpath + SC + claim-family + rubric + the element's accessible *name/role/states* (VSR), and
  the pre-computed signals block is **empty `{}`** — the v3 precompute is stripped AND axe has nothing decided to
  put there (the residual is, by definition, the cases axe could not settle). A separate axe review-hint block
  appears ONLY on the ~2/66 cases where axe returned needs-review; for the rest there is no axe block at all. So
  on the residual this is effectively **name/role + an empty evidence block**, and that emptiness *is* the
  existing-checker contribution — the v3 evidence is what fills the `{}`. No vision, no tools.
- **+ v3 evidence** = the structured precompute *signals* (JSON): contrast ratios + the literal fg/threshold,
  same-name sibling-link destinations, enclosing-block context, decorative/removed-from-tree flags, computed
  states, etc. — i.e. the "route-by-facet" evidence bundle.
- **+ vision** = rendered screenshot crops (element-crop + surrounding-region) to the multimodal model.
- **+ tools** = live CDP probes (resolve_destination, query_ax_node, observe_state_after_activation, …).

| Configuration | Det. detectors | **LLM lane (its own)** | Recall ↑ | FP ↓ | Prec ↑ | F1 ↑ |
|---|---|---|---|---|---|---|
| existing checkers (axe) — by construction | 0/66 | — | 0.0 | 0.0 | — | — |
| v3 deterministic detectors, no LLM | 10/66 (15.2%) | — (off) | 15.2 | 0.3 | **90.9** | 0.26 |
| LLM, **existing-checker evidence** (name/role + axe findings/review; no v3 signals/vision/tools) | 10/66 | **0/66 (+0.0)** | 15.2 | 0.3 | **90.9** | 0.26 |
| LLM **+ v3 evidence + vision** (no tools) | 10/66 | **34/66 (+51.5)** | 66.7 | 3.3 | 77.2 | 0.72 |
| **LLM + v3 evidence + vision + tools (Full)** | 10/66 | **40/66 (+60.6)** | **75.8** | 3.3 | 79.4 | **0.78** |
| (prior harness: LLM-only, no v3) | — | — | 53.0 | 11.0 | 44.9 | 0.49 |

**Why the two top LLM rows look like the detector row in *end-to-end* terms, and why that is the point:**
`V3_MINIMAL_EVIDENCE` strips the LLM's evidence but does NOT turn off the deterministic detectors, so the
detectors still catch their 10. The honest measure is the **LLM-lane column**: an LLM given only the element's name/role
(no v3 signals/vision/tools) flags **0/66 on its own** — it is useless without the harness's evidence provisioning. That same LLM,
given the v3 evidence bundle, flags **34/66** (+51.5); tools add another **+6** (40/66). So the recall is
produced by the *evidence*, not the LLM per se. End-to-end on the full 581 corpus the two-stage harness reaches
≈91% recall (deterministic pre-settle ~60% + LLM recovery of the residual; derived).

## Table 2 — Held-out generalization gate (581-case full corpus)

Each new deterministic detector evaluated over its **entire** ACT rule, not its tuned examples. Over-fire =
fires on a GT-pass/inapplicable case. (This is the methodological check that caught two over-fitting detectors.)

| Detector | fires | over-fire (pre-fix) | resolution |
|---|---|---|---|
| iframe-excluded-from-tab (2.1.1) | 1 | 0 | kept (generalizes) |
| focusable-in-aria-hidden, **static** (4.1.2/6cfa84) | 7 | 3 | **reverted** — pass/fail statically identical → dynamic detector |
| prohibited-ARIA (4.1.2) | 4 | 1 | **fixed** (name-from-content + full prohibited-role set) |
| confinement keyboard-trap (2.1.2) | — | 4/7 passed | **demoted** to review (escape-advisory is semantic) |
| **post-fix deterministic FP (full eval)** | — | **0 real** (30 apparent FPs = 17 scorer-inflation + 13 LLM) | — |

## Main contributions

1. **A verifiable neuro-symbolic conformance harness with an *obligation ledger*.** Per (element × success
   criterion) the harness enumerates obligations and reconciles verdicts from deterministic checkers
   (axe-core), behavior-driving instruments, and a *non-authoritative* LLM lane under a barriers-dominate-clear
   rule, so an LLM verdict never overrides a deterministic decision. This extends rule-only checkers into the
   human-judgment fraction of WCAG while bounding LLM unreliability.

2. **Route-by-facet evidence provisioning (not route-by-criterion) is the critical enabler.** A criterion is
   decomposed into facets; deterministic facets (presence, geometry, ARIA validity, contrast-over-flat-color)
   are decided by checkers and *subtracted* from the LLM's queue, and each semantic obligation is handed a
   *precomputed evidence bundle* (programmatic context, sibling-link destinations, decorative/removed-from-tree
   flags, vision crops). The ablation (Table 1b) shows this is decisive: an LLM fed only axe-level evidence flags
   **0/66 barriers on its own**, while the same LLM given the v3 evidence bundle flags **34/66** (+51.5 recall),
   and tools add a further +6. The evidence provisioning — not the LLM per se — is what unlocks the recall, and it
   simultaneously *de-noises* (LLM false positives 43→13).

3. **A held-out generalization gate + dynamic detectors.** Evaluating each detector over the *whole* rule (not
   its tuned cases) caught two "sound-by-construction" detectors over-firing and revealed *statically-
   indistinguishable* pass/fail pairs — a focus-sentinel vs a real aria-hidden keyboard trap differ only in
   *runtime* behavior. We resolve these with **behavior-driving detectors** (drive focus; observe whether it
   *rests* vs *redirects*), repurposing computer-use-style UI interaction for *verification*. Post-gate the
   deterministic layer has ~0 false positives (Table 2).

4. **Calibrated honest-uncertainty scoring.** The harness separates a *confident barrier* from a *deferred
   PARTIAL* (flag-for-review) and credits only the former as a catch. A naive scorer that credits any
   non-cleared obligation inflated both recall and FP by ~2× (e.g. FP 3.3 → 7.7); the calibrated scorer reports
   honest numbers — relevant to LLM-as-judge calibration concerns.

5. **An empirical map of the deterministic/LLM frontier for accessibility.** Checkers: high-P/low-R (91/15);
   LLM-only: low-P/high-R (45/53); facet-routed combination: 79/76. We further localize the residual false
   positives to *semantic-judgment-limited* cases (link purpose-equivalence; decorative-image judgment) that
   additional rules cannot fix — a concrete boundary on where LLMs help vs. remain unreliable here.

## Related work (anchors to situate the contributions)

- **Automated accessibility evaluation.** Rule engines — axe-core (Deque), WAVE, Google Lighthouse, IBM Equal
  Access — and the **W3C ACT-Rules** framework standardize machine-checkable WCAG tests but cover only the
  deterministically-decidable subset; the remainder needs expert review (**WCAG-EM**). We target that gap.
- **LLMs / VLMs for accessibility.** Alt-text generation and screenshot/UI understanding with vision-language
  models, and recent LLM-based auditing, are typically LLM-authoritative and over-flag; we make the LLM
  non-authoritative, facet-routed, and calibrated.
- **LLM-as-judge.** Using LLMs as evaluators (Zheng et al., 2023, *Judging LLM-as-a-Judge / MT-Bench*) has
  known calibration/position biases; our shadow-source + adversarial-verify + honest-PARTIAL design responds to
  these.
- **Tool-augmented & neuro-symbolic agents.** ReAct (Yao et al., 2023) and Toolformer (Schick et al., 2023)
  interleave reasoning with tool calls; our ledger is a *reconciliation* layer with a dominance rule rather than
  free-form tool use.
- **Computer-use / UI agents & GUI a11y testing.** WebArena (Zhou et al., 2023) and SeeAct (Zheng et al., 2024)
  drive UIs for *tasks*; Android accessibility testing (e.g., Latte, Salehnamadi et al., CHI 2021) automates
  assistive-service interaction. We borrow behavior-driving for *verification* (keyboard/focus probes) and
  couple it to LLM adjudication.

## Limitations (state these honestly)

- The eval is the **reaches-LLM hard subset** (458 of 581), so recall is over the cases the deterministic stack
  could not pre-settle; full-corpus numbers would be higher-recall, lower-base-rate.
- **LLM non-determinism**: verdicts vary run-to-run (we observed borderline cases flip); single-run numbers
  should ideally be averaged over seeds. Re-scoring isolates the scorer change without re-rolling this noise.
- The **LLM-only** row is a *prior* harness (a temporal baseline), not a clean ablation of the current LLM lane;
  the clean ±LLM ablation is rows 1 vs 3.
- Ground truth is **per-SC**; some apparent FPs are cross-rule artifacts (an element is a genuine concern for a
  different SC than the case's labeled one).
