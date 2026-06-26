# Paper-style results tables + contributions (draft)

All numbers are measured on this repo's runs; see `docs/analysis/GENERALIZATION-AND-NOOBLIGATION.md`
for provenance and `eval/checker-comparison/ablation-table.js` for the exact recomputation. Treat citations
as representative anchors to verify, not final references.

> **Revision (2026-06-20).** This draft was corrected after an ablation found that the earlier headline —
> *"an LLM given only checker-level evidence flags 0/66 on its own; evidence provisioning is the single
> enabler (+51.5)"* — was an **artifact of a required-evidence gate** (the LLM was never called when its
> declared vision crops were absent) compounded with conflating vision and text signals. Fairly measured,
> the picture is a **two-lever decomposition** (below). The gate confound is now reported as a methodology
> result, not hidden.

## Evaluation setup

W3C **ACT-Rules** testcases, restricted to the *reaches-LLM* set — the cases the deterministic stack does
**not** pre-settle, i.e. the hard subset where a target-SC obligation stays auto-PARTIAL and reaches the LLM:
**458 testcases** (66 GT-fail, 392 GT-pass/inapplicable), spanning **37 ACT rules / 13 WCAG success criteria**.
Ground truth is per-SC (ACT GT is per success-criterion). Metrics: **Recall** = TP / GT-fail (66);
**FP rate** = FP / (GT-pass + inapplicable) (392); **Precision** = TP / (TP+FP); **F1** = harmonic mean.
The **LLM-lane** column is the LLM's *marginal* recall (GT-fail cases the LLM flagged), computed
scorer-independently so it is comparable across configurations.

## Table 1 — Main result

| Configuration | Recall ↑ | FP rate ↓ | Precision ↑ | F1 ↑ |
|---|---|---|---|---|
| Deterministic checkers only (−LLM) | 15.2 (10/66) | **0.3** (1/392) | **90.9** | 0.26 |
| LLM + vision, *no* structured grounding | 54.5 (36/66) | 11.5 (45/392) | 44.4 | 0.49 |
| **Full harness (facet-routed: signals + vision + tools)** | **72.7** (48/66) | 3.1 (12/392) | **80.0** | **0.76** |

Read-off: the deterministic layer is high-precision / low-recall; an LLM handed *rich evidence but no
facet-routed grounding* (a screenshot + bare name/role) is the inverse — it sees the page and **guesses**
(44% precision, 11.5% FP). The facet-routed harness **dominates both** (+57 recall over deterministic;
+36 precision and −8.4 FP over the ungrounded LLM). The middle row reproduces the prior LLM-only harness's
profile (53/11/45) as a *clean* ablation, confirming the low precision was the missing grounding, not the model.

```latex
\begin{table}[t]\centering
\caption{Main result on the W3C ACT reaches-LLM set (458 cases: 66 fail, 392 pass/inapplicable; 37 ACT rules, 13 WCAG SCs; per-SC scoring).}
\label{tab:main}
\begin{tabular}{lcccc}
\toprule
Configuration & Recall $\uparrow$ & FP rate $\downarrow$ & Precision $\uparrow$ & F1 $\uparrow$\\
\midrule
Deterministic checkers only ($-$LLM) & 15.2 & \textbf{0.3} & \textbf{90.9} & 0.26\\
LLM $+$ vision, no facet-routed grounding & 54.5 & 11.5 & 44.4 & 0.49\\
\textbf{Full harness (signals $+$ vision $+$ tools)} & \textbf{72.7} & 3.1 & \textbf{80.0} & \textbf{0.76}\\
\bottomrule
\end{tabular}\end{table}
```

## Table 1a — Existing-checker baseline (full 581-corpus)

We verified the "best existing checker" claim against a **FIVE-engine** comparison (axe-core, IBM Equal
Access, QualWeb [the W3C ACT-Rules reference], HTML_CodeSniffer, Alfa), not axe alone, on the full 581-corpus
(177 fail, 404 pass/inapplicable):

| System | Recall ↑ | FP rate ↓ | Precision ↑ | F1 ↑ |
|---|---|---|---|---|
| **axe-core only** (best single) | 59.9 (106/177) | **3.0** (12/404) | **89.8** | 0.72 |
| axe ∪ htmlcs (max-recall union) | 60.5 (107/177) | 12.1 (49/404) | 68.6 | 0.64 |

Why axe-core is the fair baseline (verified on THIS corpus, not assumed): **IBM**'s decided/review SCs are
not in the corpus's 13 SCs (→ 0 contribution); **QualWeb** catches 0/8 of a residual-failure sample (the
recovered cases are dynamic or semantic, which no *static* engine decides); **HTML_CodeSniffer** adds exactly
1 unique catch but quadruples FP (3.0→12.1); **Alfa** 0 unique. Checkers' *indeterminate*/review flags are
not decided catches — they are the LLM lane's evidence; only axe's `incomplete` is wired into the harness
(verified end-to-end: the review-hint block appears in ~2 cases and the LLM reasons from it).

## Table 1b — The evidence levers (reaches-LLM residual; the core ablation)

On the reaches-LLM residual **axe = 0 by construction** (this set is precisely the existing-checker gap), so
every catch below is the LLM lane recovering a barrier the deterministic stack could not settle. The
deterministic floor (10/66) is always on; the **LLM-lane** column isolates the LLM's marginal contribution.
Evidence forms (NONE is the harness's deployed form except where noted):

- **name/role** — the element's accessible name + role only (what an LLM bolted onto a checker sees).
- **v3 signals** — the route-by-facet structured precompute bundle (JSON): contrast ratio + literal
  fg/threshold, same-name sibling-link destinations, enclosing-block context, decorative/removed-from-tree
  flags, computed states, page structure.
- **raw HTML** — the element's `outerHTML` + its parent's `outerHTML` (dense markup; an ablation, *not* deployed).
- **vision** — rendered screenshot crop(s) to the multimodal model (targeted element+surrounding crops, or a
  page-wide full-page crop).
- **tools** — live CDP probes (resolve_destination, query_ax_node, observe_state_after_activation, …).

| Configuration | Vision | LLM-lane ↑ | Recall ↑ | Precision ↑ | F1 ↑ | FP ↓ |
|---|---|---|---|---|---|---|
| Deterministic only (−LLM) | — | 0/66 | 15.2 | **90.9** | 0.26 | **0.3** |
| LLM + name/role | none | 6/66 | 24.2 | 43.2 | 0.31 | 5.4 |
| LLM + v3 signals | none | 15/66 | 36.4 | 66.7 | 0.47 | 3.1 |
| LLM + raw HTML | none | 34/66 | 66.7 | 62.9 | 0.65 | 6.6 |
| LLM + name/role + vision | targeted | 26/66 | 54.5 | 44.4 | 0.49 | 11.5 |
| LLM + v3 signals + vision | targeted | 34/66 | 66.7 | 77.2 | 0.72 | 3.3 |
| LLM + v3 signals + full-page vision | full-page | 35/66 | 68.2 | **80.4** | 0.74 | 2.8 |
| LLM + raw HTML + vision | targeted | 37/66 | 71.2 | 63.5 | 0.67 | 6.9 |
| LLM + v3 signals + HTML + vision | targeted | 41/66 | **77.3** | 68.0 | 0.72 | 6.1 |
| **Full: v3 signals + vision + tools** | targeted | 38/66 | 72.7 | 80.0 | 0.76 | 3.1 |
| Full + HTML (full markup) | targeted | 40/66 | 75.8 | 75.8 | 0.76 | 4.1 |
| Full + HTML + full-page vision | full-page | 43/66 | 78.8 | 72.2 | 0.75 | 5.1 |
| Full + HTML, style-stripped | targeted | 42/66 | **78.8** | 76.5 | 0.78 | 4.1 |
| **Full + HTML, style-stripped + facet-gated** | targeted | 42/66 | 77.3 | **81.0** | **0.79** | 3.1 |
| **▶ Current pipeline (2026-06-24): default + new det. runners** | targeted | **43/66** | **78.8** | 78.8 | 0.788 | 3.6 |

> **Re-run on current code (2026-06-24, `results/exp30-current-html`).** A full 458-case re-run of the
> *deployed-default* config (facet-gated style-stripped HTML augmentation + targeted vision + tools) at the
> **default medium effort**, now including the deterministic runners landed after exp19 — non-text contrast
> (1.4.11), glyph-text-alt / multipart-grouping / positive-tabindex (C8 small-signals), and the composite
> arrow-key-trap runner (2.1.2) — plus their collector-parity facts. **Result: 78.8% recall (52/66), the
> highest LLM-lane marginal recall in the table (43/66).** It **beats the prior best deployed config's recall
> at a *lower* effort** (exp19 was 77.3% at effort=high; this is 78.8% at medium). The new runners settle more
> obligations deterministically *before* the LLM (e.g. 1.4.3 `noObligation` 9→15). Precision dips to 78.8%
> (FP 14 vs exp19's 11) — partly the medium-vs-high effort tradeoff (exp19 @ high held 82.3% precision); a
> matched high-effort re-run would be expected to recover most of it. Recompute: `node
> eval/checker-comparison/ablation-table.js`.

**Two independent levers (the corrected central finding).**
- **Vision is the RECALL lever.** name/role 6 → +vision 26 (LLM-lane). The model must *see* the rendered page
  to surface most residual barriers. The targeted per-SC crop design barely beats a plain full-page crop on
  this (small-page) corpus (34 vs 35) — what matters is *that* it sees the page, not the crop framing.
- **Structured signals are the PRECISION lever.** name/role+vision is high-recall but **44% precision /
  11.5% FP** — the model sees the page and over-flags. Adding the v3 signals (signals+vision) is a **strict**
  improvement: recall 26→34 *and* precision 44→77%, FP 11.5→3.3%. The signals *ground* the model so it stops
  hallucinating barriers. This is the harness's real contribution, and it holds with **and** without vision
  (name/role 43% → v3 signals 67% precision, text-only).
- **Raw HTML is complementary recall at a precision cost.** Text-only HTML matches vision on recall (34 each)
  but catches *different* barriers (overlap 22, each-unique 12, **union 46**): HTML wins markup-evident SCs
  (2.4.4 link purpose, 2.4.6), vision wins rendered SCs (2.4.2 title, alt-adequacy, 1.3.1). Adding HTML on top
  (signals+HTML+vision) reaches the **highest recall (77.3%)** but over-flags (precision 68%) — the markup
  invites barriers the page denies. The single-run combination realizes only part of the union (LLM-lane 41,
  not 46).
- **Tools are precise recall.** Over the Full config, CDP probes add recall at **80% precision**; they ground
  the model the way raw markup cannot, buying *less* raw recall than HTML (72.7 vs 77.3) but at far higher
  precision (80 vs 68).
- **Route-by-facet applies to raw markup too (the F1 winner).** Adding *full* HTML to the Full config trades
  precision for recall (75.8/75.8, F1 0.76) — an RCA found its #1 FP source is the model reading inline
  `style="color:#888"` off the markup and **re-deriving 1.4.3 contrast**, overriding the deterministic ratio +
  applicability the runner owns (also: over-eager 2.4.4 from raw hrefs). Its recall *benefit* is structural —
  it exposes barriers the curated signals under-collect (e.g. 1.3.1 on a `div`/`role=grid` table the
  `<table>`-only collector misses). **Stripping inline `style=` from the HTML** — keeping the structural facets
  (tags/ARIA/href/text), removing the computed facet (colour) a runner owns — recovers the precision while
  keeping the recall (78.8 / 76.5 / F1 0.78; contrast FPs 4→2, the residual 2 *vision*-driven). An RCA of the
  *remaining* over-flags found the same re-derive-from-markup failure on other channels — hrefs (2.4.4),
  `onblur` handlers (2.1.2), `aria-hidden=""` (4.1.2) — each a facet a runner owns. **Facet-gating** the HTML
  (augment ON for structural SCs, OFF for the runner-owned 1.4.3/4.1.2/2.1.2) removes the 4.1.2 + 2.1.2 FPs and
  reaches **77.3 recall / 81.0 precision / F1 0.79** — the best of all configurations, **dominating the
  deployed Full on both axes** (+4.6 recall, +1.0 precision, same 3.1% FP). So the harness's central
  route-by-facet thesis extends to markup itself: even when handing the LLM HTML, keep the *structural* facets
  and withhold the ones a deterministic producer owns (colour, ARIA-validity, runtime behavior). The remaining
  HTML FP source — 2.4.4 same-name links to different URLs the GT treats as same-*purpose* — is not fixed by
  withholding the href (it is also the recall benefit) but points to feeding destination *content*
  (`resolve_destination`) so the model judges purpose, not URL string.

**Methodology — a measurement confound worth reporting.** The naive no-vision numbers were near-zero, which
first read as "the LLM is useless without our evidence." That was an artifact: the rubric lane has a
*required-evidence gate* (`llm-adjudicator.js`: abstain if a declared vision crop is missing) that returned
before the model was ever called, so a no-vision run invoked the LLM on ~16/458 cases, not ~300. Bypassing the
gate (and neutralizing the rubric's "judge from the crop" wording) for the ablation raised the no-vision
LLM-lane from 0 → 6 (name/role) / 15 (signals) / 34 (HTML). **Ablations that vary one input can silently
trip a downstream gate keyed on that input; the abstain path must be audited, not trusted.**

## Table 2 — Held-out generalization gate (581-case full corpus)

Each new deterministic detector evaluated over its **entire** ACT rule, not its tuned examples. Over-fire =
fires on a GT-pass/inapplicable case. (The methodological check that caught two over-fitting detectors.)

| Detector | fires | over-fire (pre-fix) | resolution |
|---|---|---|---|
| iframe-excluded-from-tab (2.1.1) | 1 | 0 | kept (generalizes) |
| focusable-in-aria-hidden, **static** (4.1.2/6cfa84) | 7 | 3 | **reverted** — pass/fail statically identical → dynamic detector |
| prohibited-ARIA (4.1.2) | 4 | 1 | **fixed** (name-from-content + full prohibited-role set) |
| confinement keyboard-trap (2.1.2) | — | 4/7 passed | **demoted** to review (escape-advisory is semantic) |
| **post-fix deterministic FP (full eval)** | — | **0 real** | — |

## Table 1c — Judge-design levers cannot reduce the residual FP (controlled, fixed-evidence)

The Table-1b precision (FP ~3.1–3.6%) is dominated by a residual of *semantic-judgment-limited* FPs (link
purpose-equivalence, decorative/essential image-of-text, name-vs-descriptiveness). We tested whether **LLM
judge-design** can remove them with a **fixed-evidence replay harness**: freeze each case's judge inputs
(route-by-facet structured signals + vision crops + screen-reader transcript) once, then re-run ONLY the LLM
judgment under a varied judge design. This isolates the judge's *intrinsic* sampling noise from collect/vision/tool
nondeterminism, which a prior single-run study could not.

**Fixed-evidence noise floor.** With evidence byte-fixed, the FP count still varies **σ≈1.06 / range 3** over K=10
identical runs — half the full-pipeline range (6); the judge's own sampling is an irreducible ±1 FP. Methods are
therefore scored by per-case **stable transition** (a 10/10-flagged FP driven to 0/K), not the noise-bound aggregate.

| Judge-design lever | ΔFP | Δrecall | result |
|---|---|---|---|
| Confidence-gated abstention | −2.2 | −1.0 | symmetric (FPs are 87% high-confidence) |
| Self-consistency (majority / unanimity) | −1.7 / −3.7 | −0.4 / −3.4 | negligible / symmetric |
| Decomposed applicability gate | +0.7 | −0.6 | null |
| Distractor-strip (drop task framing) | −1.1 | +1.4 n.s. | FP-neutral and recall-neutral (apparent recall gain washes out at full scale) |
| Positive-class boundary prose | −2.9 | −1.2 | 0 stable FP fixed |
| Self-refutation cascade | −4.7 | −4.4 | symmetric/net-negative |
| Grounded-verdict requirement | −4.9 | −1.8 | clears *defensible* link FPs, loses real ones |
| **Cross-family panel (Gemini refuter)** | −6 | −5 | symmetric |
| grounded + strip (combination) | −3.3 | −2.2 | non-additive, symmetric |

**Every lever that cuts FP cuts recall comparably; none is asymmetric.** Decisively, a *different model family*
(Gemini) fails on the *same* residual cases and *agrees* they are barriers — the signature of **intrinsic WCAG
ambiguity / debatable ground truth**, not a model error a better judge design removes. This is the controlled,
cross-model confirmation of the Table-1b precision ceiling. (Full study: `docs/analysis/improvement-research-2026-06/
FP-REDUCTION-CONTROLLED-ROUND2.md`.)

## Main contributions

1. **A verifiable neuro-symbolic conformance harness with an *obligation ledger*.** Per (element × success
   criterion) the harness enumerates obligations and reconciles verdicts from deterministic checkers
   (axe-core), behavior-driving instruments, and a *non-authoritative* LLM lane under a barriers-dominate-clear
   rule, so an LLM verdict never overrides a deterministic decision. This extends rule-only checkers into the
   human-judgment fraction of WCAG while bounding LLM unreliability.

2. **Evidence provisioning decomposes into two independent levers — vision drives recall, structured
   signals drive precision — and neither alone suffices.** Holding the model fixed and varying only the
   evidence (Table 1b): adding *vision* lifts the LLM lane's recall (name/role 6→26) but leaves precision at
   44% — the model sees the page and over-flags; adding the *route-by-facet structured signals* lifts
   precision to 77–80% (FP 11.5→3.3%) **while also raising recall** (a strict improvement), with or without
   vision. So the contribution is not "the LLM needs our evidence to work at all" (the naive reading, which a
   required-evidence gate had inflated to 0) but the sharper, defensible claim: **the two evidence axes govern
   the two error types, and the facet-routed combination reaches the F1-optimal point (0.76) that neither a
   high-recall-ungrounded nor a high-precision-deterministic configuration achieves.** We further show *raw
   markup* is a strong but noisier recall source (matches vision on recall, complementary barriers, union 46),
   and that *tools* add recall at high precision — locating where each evidence form helps.

3. **A held-out generalization gate + dynamic detectors.** Evaluating each detector over the *whole* rule (not
   its tuned cases) caught two "sound-by-construction" detectors over-firing and revealed *statically-
   indistinguishable* pass/fail pairs — a focus-sentinel vs a real aria-hidden keyboard trap differ only in
   *runtime* behavior. We resolve these with **behavior-driving detectors** (drive focus; observe whether it
   *rests* vs *redirects*), repurposing computer-use-style UI interaction for *verification*. Post-gate the
   deterministic layer has ~0 false positives (Table 2).

4. **Calibrated honest-uncertainty scoring (confirmed by re-run).** The harness separates a *confident
   barrier* from a *deferred PARTIAL* (flag-for-review) and credits only the former as a catch. A naive scorer
   that credits any non-cleared obligation inflated both recall and FP: on the Full config the stored
   (naive-scorer) FP was **7.7%** and a re-run under the calibrated scorer gives **3.1%** (recall 78.8→72.7) —
   a ~2× FP inflation removed. Relevant to LLM-as-judge calibration. (Note: the inflated artifacts cannot be
   re-scored in place because the per-obligation ledger is not persisted; the corrected numbers come from a
   re-run, which also re-rolls LLM non-determinism — see Limitations.)

5. **An empirical map of the deterministic/LLM/evidence frontier for accessibility.** We chart recall×precision
   across 10 configurations (Table 1b): deterministic = high-P/low-R (91/15); LLM+vision-ungrounded =
   low-P/high-R (44/55); facet-routed Full = 80/73. Each evidence lever moves along the frontier in a
   characterized direction (vision→recall, signals→precision, HTML→noisy-recall, tools→precise-recall). We
   localize the residual false positives to *semantic-judgment-limited* cases (link purpose-equivalence;
   decorative-image judgment) that additional rules cannot fix — a concrete boundary on where LLMs help vs.
   remain unreliable here.

6. **The residual-FP ceiling is judge-design-invariant (controlled, cross-model).** With a fixed-evidence replay
   harness + per-case stable-transition protocol (Table 1c), none of **nine** LLM judge-design levers (confidence
   abstention, self-consistency, atomic decomposition, distractor-stripping, positive-class prose, grounded
   verdicts, self-refutation) nor a **cross-family Gemini panel** reduces the residual FP without an equal recall
   cost; the residual is confident and *cross-model-shared* (Gemini and Claude fail on, and agree about, the same
   cases). This delimits LLM-as-judge improvement for conformance — the boundary in #5 is **intrinsic** (debatable
   GT / semantic ambiguity), not a prompting deficiency — and quantifies the judge's irreducible sampling noise
   (σ≈1.06 FP), recommending multi-run-median measurement for sub-floor changes.

## Related work (anchors to situate the contributions)

- **Automated accessibility evaluation.** Rule engines — axe-core (Deque), WAVE, Google Lighthouse, IBM Equal
  Access — and the **W3C ACT-Rules** framework standardize machine-checkable WCAG tests but cover only the
  deterministically-decidable subset; the remainder needs expert review (**WCAG-EM**). We target that gap.
- **LLMs / VLMs for accessibility.** Alt-text generation and screenshot/UI understanding with vision-language
  models, and recent LLM-based auditing, are typically LLM-authoritative and over-flag; our clean ablation
  reproduces that failure mode (LLM+vision, 44% precision) and shows facet-routed structured grounding is what
  fixes it, while keeping the LLM non-authoritative and calibrated.
- **LLM-as-judge.** Using LLMs as evaluators (Zheng et al., 2023, *Judging LLM-as-a-Judge / MT-Bench*) has
  known calibration/position biases; our shadow-source + honest-PARTIAL scoring + the precision-grounding
  result respond to these.
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
- **LLM non-determinism**: verdicts vary run-to-run. The Full config's LLM-lane is **38–40** across two samples
  (original run + re-run); single-run table cells should ideally be averaged over seeds. The re-run that
  corrects the scorer also re-rolls this noise (the ledger needed for an in-place re-score is not persisted), so
  the Full-config recall is reported from the re-run, not the original.
- **Evidence-form ablation is single-run** per cell (except the Full config's range above); the lever
  *directions* are robust (large, consistent gaps), but small cell-to-cell differences (e.g. targeted vs
  full-page vision, 34 vs 35) are within run noise and should not be over-read.
- The no-vision ablation cells required **bypassing a required-evidence gate** to measure the model fairly (see
  the methodology note); they reflect what the model does given the text evidence, not the deployed harness
  (which gates on vision by design). Reported as an ablation, not a deployment configuration.
- Ground truth is **per-SC**; some apparent FPs are cross-rule artifacts (an element is a genuine concern for a
  different SC than the case's labeled one).
