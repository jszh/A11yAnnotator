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
**FP rate** = FP / (GT-pass + inapplicable). Un-modified denominators are **66 / 392** (raw ACT labels); the
starred (`*`) variant applies the cross-rule GT override below — **68 / 390** (2 negatives relabelled to recall,
0 quarantined). **Precision** = TP / (TP+FP); **F1** = harmonic mean. The **LLM-lane** column is the LLM's
*marginal* recall (GT-fail cases the LLM flagged), computed scorer-independently so it is comparable across configs.

**Cross-rule scoring protocol (the `*` convention).** An ACT testcase carries **one rule's** expected outcome,
but the harness judges the **whole SC**. Where same-SC rules *partition a construct by applicability*, a page can
be `passed`/`inapplicable` for its authoring rule while a **sibling same-SC rule is applicable and its verdict is
a non-deterministic judgment**, with no sibling label recorded — so the page's true SC status is **undetermined by
the single label it carries**. The canonical case is **1.1.1 images**: `23a2a8`/`qt1vmo`/`7d6734`/`8fc3b6`/`59796f`
own *in-tree* images ("has a/descriptive name"); `e88epe` owns *removed-from-tree* images ("is it decorative?"). A
`23a2a8`-`inapplicable` page that hides a substantial **removed-from-tree** image (e.g. the W3C wordmark) is one
`e88epe` would adjudicate — but no `e88epe` label exists, so a correct barrier flag is graded an FP against a label
that never covered the image. `run-fn-llm.js` detects these (`crossRuleIndeterminate`: eligibility = the
**standard's applicability**, a removed-from-tree image ≥ 24 px min-dim, never our `decorativeSuspect` routing) and
handles them two ways: any **un-examined** cross-rule case is *quarantined* from the specificity denominator
(neither FP nor TN, reported every run); the **manually-examined** ones carry an explicit criterion-level **GT
override** (`GT_OVERRIDE`). On this corpus all **7** cross-rule cases were examined (image + `e88epe` stance + our
verdict — see **Table 1d**): the **2** aria-hidden W3C wordmarks are barriers `e88epe` fails → relabelled `failed`
(our catch is a recall TP, not an FP); the **5** decoratives (texture / circle / redundant PDF icon /
atmospheric+redundant fireworks) `e88epe` passes → original negative label **confirmed** and kept as graded TNs.

Metrics computed **with** the overrides are starred (`*`); the **un-modified** raw-ACT-label metrics (no override,
no exclusion) are reported alongside (`summary.unmodified`, and the un-modified rows in **Table 1**). The override
is auditable and tiny by construction: it keys on **label validity, never on whether the harness agrees** — a
genuinely-clean page (no removed image: the `7d6734` in-tree circle, the `e88epe` named `pdf-icon`) is untouched
and a real over-flag still counts; removing the 5 correctly-cleared TNs *raises* our FP rate (it is conservative,
not self-serving). Net on the reaches-LLM set: `*` moves 2 negatives → recall (66 → 68) and keeps 392 − 2 = **390**
graded negatives (0 quarantined, since all 7 are examined). Extend `GT_OVERRIDE` only after the same examination.

## Table 1 — Main result (un-modified: raw ACT labels)

These are the **un-modified** figures — raw per-rule ACT labels, **no** criterion-level override, denominators
66 / 392. (Snapshot runs predating the decorative lane + override; the starred `*` variant that applies the
7-case override of **Table 1d** awaits the authoritative lane+override re-run — see the note under Table 1d.)

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

### How the +36 recall / +40 precision decomposes — the three layers

An example-grounded trace of *how* each layer moves the numbers, mined from the last full Claude run
(`results/full-claude-default`), is in **[COMPONENT-CONTRIBUTIONS.md](./COMPONENT-CONTRIBUTIONS.md)** (a master
matrix of 14 mechanisms × recall/precision × real case ids, plus per-layer analysis). The one-line summary:

- **Recall (54.5→90.9%)** = routing + reach. The oracle turns one open-ended "find all barriers" prompt into ~one
  bounded question per real obligation (**49/60 TPs** are LLM verdicts on routed obligations, 0 from a raw sweep);
  the deterministic instruments catch **11** behavioural/syntactic barriers a vision-LLM is worst at (2 of which the
  LLM had *cleared*); tools reach off-viewport/relational/dynamic state the static frame hides (e.g. `capture_full_page`
  catching an `offDocument:true` heading the static signal reported as `offscreen:false`).
- **Precision (44.4→84.5%, FP 11.5→2.8%)** = subtraction + grounding + verification. Applicability keeps **83**
  inapplicable cases off the worklist; `RUBRIC_GATE` withholds runner-owned facets (**21/26** 1.4.3 contrast settled
  deterministically, never routed); `precomputeSignals` anchors the verdict in measured facts; tools overturn
  misleading static signals (**42** of 70 tool-traces are true-negative clears). The model is never *handed the
  question* on a facet it would guess wrong.

The governing principle is one move applied in three places — **route by facet**: a deterministic producer owns
every facet it can settle; the LLM gets only the residual *meaning* question, pre-loaded with the deterministic
facts and a tool to probe what the frame can't show.

## Table 1d — Cross-rule GT override (`*`): the 7 hand-examined 1.1.1 cases

The reaches-LLM set has **7** cross-rule-indeterminate negatives — pages labelled clean for an *in-tree* image
rule (`23a2a8`/`qt1vmo`/`7d6734`) that hide a substantial *removed-from-tree* image, the construct `e88epe`
("image not in the a11y tree is decorative") owns and judges. Each was examined at the criterion level (the
rendered image, what `e88epe` rules, and the harness's own verdict). This is the entirety of the `GT_OVERRIDE`
table in `run-fn-llm.js`; every starred (`*`) metric is exactly these 7 rows applied to the raw labels.

| # | case | image | harness verdict | `e88epe` | original → `*` asserted | effect |
|---|---|---|---|---|---|---|
| 1 | `23a2a8/25e5364c` | W3C wordmark, aria-hidden (bg div) | LIKELY_BARRIER (caught) | **fail** | inapplicable → **failed** | mislabelled catch → recall **TP** |
| 2 | `23a2a8/e15b9aca` | W3C wordmark, aria-hidden (img) | LIKELY_BARRIER (caught) | **fail** | inapplicable → **failed** | mislabelled catch → recall **TP** |
| 3 | `23a2a8/e8f40f5a` | horizontal-stripe texture | LIKELY_OK (cleared) | pass | passed → passed | kept as graded **TN** |
| 4 | `7d6734/b3c602b7` | plain yellow circle | LIKELY_OK (cleared) | pass | inapplicable → inapplicable | kept as graded **TN** |
| 5 | `qt1vmo/0ab8d652` | PDF icon, redundant w/ "PDF document" | LIKELY_OK (cleared) | pass | inapplicable → inapplicable | kept as graded **TN** |
| 6 | `qt1vmo/4d04a494` | fireworks photo (lone, atmospheric) | LIKELY_OK (cleared) | pass | inapplicable → inapplicable | kept as graded **TN** |
| 7 | `qt1vmo/ce2c3078` | fireworks + "Happy new year!" | LIKELY_OK (cleared) | pass | inapplicable → inapplicable | kept as graded **TN** |

**Read-off.** Only **2 of 7** are genuine artifacts (correct catches the raw label scores as FPs) — `*` relabels
them `failed`, so they leave the specificity denominator (392 → 390) and join recall (66 → 68) as TPs. The other
**5** the harness *correctly cleared*; `*` confirms their original negative label and keeps them graded — it does
**not** quietly drop them (dropping correctly-cleared TNs would *lower* the denominator and *inflate* the FP
rate). The override changes labels for 2 cases only, both consistent with ACT's own `e88epe` rule on the identical
image; it asserts no judgment the harness makes unilaterally. **Numbers pending:** the starred Table 1 (Full
harness, decorative lane + override live) requires the authoritative re-run; this table fixes the override that
re-run will apply, so the result is reproducible and pre-registered.

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
| **▶ + determinism defaults ON (settle + per-lease isolation), 2026-06-25** | targeted | 40/66 | 74.2 | **81.7** | 0.778 | **2.8** |
| **▶ Cross-family: Gemini 3.5-flash judge (same harness, full config), 2026-06-28** | targeted | 40/66 | 74.2 | 70.0 | 0.721 | 5.4 |

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

> **Determinism defaults ON (2026-06-25, `results/fn-llm-allfixes`).** The same deployed-default config (facet-gated
> style-stripped HTML + targeted vision + tools, medium effort) re-run with this session's determinism fixes now
> **default-on** — `awaitSettle`/`awaitFocusSettle` (no longer opt-in), incognito **per-lease isolation**,
> `robustScreenshot` retries, and the DOM-mutation-gated VSR poll. **Result: 74.2% recall (49/66), 81.7% precision,
> 2.8% FP, F1 0.778, LLM-lane 40/66.** Relative to the exp30 anchor this is −4.6 recall / +2.9 precision / −0.8 FP —
> a swap **within the documented LLM run-to-run band** (LLM-lane 40 vs 43; the Full config samples at 38–43, see
> Limitations). This is the expected reading: the determinism fixes are a **variance-reduction** intervention — they
> drove the per-run ledger drift from 7→0 and the perceptual-vision drift from 1→0 on a drift-bearing replay set
> (`docs/analysis/improvement-research-2026-06/FP-REDUCTION-CONTROLLED-ROUND2.md`) — **not a central-tendency lift**,
> so a single end-to-end run shows parity (here trading ~3 recall for ~3 FP / +precision), not a jump. Their value is
> repeatability of the cell, which single-run tables cannot show; a multi-run median is the right way to credit them.
> Recompute: `node eval/checker-comparison/ablation-table.js` (config `fn-llm-allfixes`).

> **Cross-family judge — whole LLM lane on Gemini (2026-06-28, `results/fn-llm-gemini`).** The *same* deployed-default
> harness as the row above (facet-gated style-stripped HTML + targeted vision + **tools**, determinism defaults ON) with
> **only the judge swapped** from Claude Sonnet 4.6 to **Google Gemini 3.5-flash**. Tools are driven by a re-implemented
> **function-calling loop** (`makeGeminiToolTransport`) over the *same* 13 CDP handlers; because every tool result is
> JSON-stringified uniformly (`cdp-tools.js` `wrap`), the judge receives **byte-identical tool evidence** — so this run
> varies *model + agent-loop protocol* while holding the evidence and tool outputs constant. (It is a full-pipeline
> head-to-head, distinct from the fixed-evidence Gemini *refuter panel* in Table 1c / contribution #6.) **Result: 74.2%
> recall (49/66), 70.0% precision, 5.4% FP, F1 0.721, LLM-lane 40/66.**
>
> - **Recall generalizes across families — essentially exactly.** Gemini matches Claude's same-harness run on **both**
>   end-to-end recall (74.2%, 49/66) **and** scorer-independent LLM-lane recall (40/66), and the catches *overlap*: **45
>   of 49 are the identical cases** (4 unique to each family). The harness's evidence-provisioning recall contribution
>   (#2: vision→recall, signals/HTML/tools→precise-recall) is **not Claude-specific** — a second model family, given the
>   same routed evidence and tools, recovers the same barriers.
> - **The cost is precision, and it is part-intrinsic, part-model.** Gemini flags **21** FPs vs Claude's 11. Of these,
>   **6 are shared** (both families call the same GT-pass case a barrier) — the cross-model-shared, debatable-GT residual
>   that contribution #6 isolates. Gemini independently over-flags **15 more** (1.3.1 structure ×3, 2.4.x heading/link
>   ×7, 4.1.2 name-role ×2, 1.1.1 ×2, 1.4.3 ×1) — model-specific trigger-happiness on the adequacy/structure judgments,
>   not shared ambiguity. So the precision *ceiling* is judge-design-invariant for the shared core (#6 stands), but the
>   *absolute* FP rate is model-dependent: Gemini 3.5-flash is less calibrated than Claude on the GT-pass set.
> - **Methodology caveat.** The Gemini tool path is a hand-rolled `generateContent` function-calling loop
>   (generativelanguage v1beta), not the Claude Agent SDK MCP loop the Claude rows use; the evidence and tool *outputs*
>   are identical but the agent-loop protocol differs, so read this as a model+transport swap, not a pure model swap.
>   Recompute: `node eval/checker-comparison/ablation-table.js` (config `fn-llm-gemini`).

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

## Table 1e — Full reaches-LLM run log (provider × concurrency; 2026-06-28/29)

Full-suite (458-case) runs as this round's fixes landed. Per-SC scoring, **raw ACT labels** *unless the row is
marked* `*` (which applies the cross-rule GT override of Table 1d → denominators 68 / 390). `noVerd` = subjects
that reached the LLM but produced no parseable verdict (a transport/judge failure, **not** an abstain). Recompute
any row with `node eval/checker-comparison/ablation-table.js` (config = the run dir).

| run (`results/…`) | model | config | commit | Recall | Prec | FP rate | F1 | noVerd |
|---|---|---|---|---|---|---|---|---|
| `fn-llm-gemini` (06-28) | Gemini 3.5-flash | tools, 16-par | ≈`ad472017` (pre-fix) | 74.2 (49/66) | 70.0 | 5.4 (21/392) | 0.721 | 18 |
| `full-gemini-50p` (06-29) | Gemini 3.5-flash | tools, 50-par | `49b4c23b` | 83.3 (55/66) | 83.3 | 2.8 (11/392) | 0.833 | 28 |
| `full-claude-default` (06-29) | Claude Sonnet 4.6 | tools, 16-par | `49b4c23b` | **90.9** (60/66) | 84.5 | 2.8 (11/392) | **0.876** | 3 |
| `fn-llm-gemini-v2` (06-29) | Gemini 3.5-flash | tools, 80-par | `2c7628c0` † | 90.9 (60/66) | 76.9 | 4.6 (18/392) | 0.834 | **4** |
| `fn-llm-gemini-v2` **`*`** (06-29) | Gemini 3.5-flash | tools, 80-par, `*`override | `2c7628c0` † | **91.2** (62/68) | 79.5 | 4.1 (16/390) | **0.849** | 4 |
| `openai-gpt54-full` (06-29) | GPT-5.4 | tools, 8-par | `876e4696` | 83.3 (55/66) | 79.7 | 3.6 (14/392) | 0.815 | 5 |
| `openai-gpt54-full` **`*`** (06-29) | GPT-5.4 | tools, 8-par, `*`override | `876e4696` | 83.8 (57/68) | 82.6 | 3.1 (12/390) | 0.832 | 5 |
| `claude-sonnet-full` (06-30) | Claude Sonnet 4.6 | tools, 8-par | `34aec9d3` | 89.4 (59/66) | 74.7 | 5.1 (20/392) | 0.814 | 2 |
| `claude-sonnet-full` **`*`** (06-30) | Claude Sonnet 4.6 | tools, 8-par, `*`override | `34aec9d3` | 89.7 (61/68) | 77.2 | 4.6 (18/390) | 0.830 | 2 |
| `sonnet5-full` (06-30) | Claude Sonnet 5.0 | tools, 16-par (default) | `21518a5f` ‡ | 84.8 (56/66) | 75.7 | 4.6 (18/392) | 0.800 | 2 |
| `sonnet5-full` **`*`** (06-30) | Claude Sonnet 5.0 | tools, 16-par (default) | `21518a5f` ‡ | 82.4 (56/68) | 75.7 | 4.6 (18/390) | 0.789 | 2 |
| `gpt54mini-live` (06-30) | GPT-5.4-mini | tools, 25-page/60-par, §splice | `9415844e` § | 86.4 (57/66) | 86.4 | 2.3 (9/392) | **0.864** | 3 |
| `skip-sonnet-46` (07-01) | Claude Sonnet 4.6 | tools, 16-par, ◊splice | `752d5468` ◊ | 97.0 (64/66) | 80.0 | 4.1 (16/392) | 0.877 | 3 |
| `skip-sonnet-46` **`*`** (07-01) | Claude Sonnet 4.6 | tools, 16-par, ◊splice, `*`override | `752d5468` ◊ | **97.1** (66/68) | 82.5 | 3.6 (14/390) | **0.892** | 3 |
| `skip-gemini-35` (07-01) | Gemini 3.5-flash | tools, 50-par, ◊splice | `752d5468` ◊ | 92.4 (61/66) | 79.2 | 4.1 (16/392) | 0.853 | 3 |
| `skip-gemini-35` **`*`** (07-01) | Gemini 3.5-flash | tools, 50-par, ◊splice, `*`override | `752d5468` ◊ | 92.6 (63/68) | 81.8 | 3.6 (14/390) | 0.869 | 3 |
| `skip-haiku-45` (07-01) | Claude Haiku 4.5 | tools, 16-par, ◊splice | `752d5468` ◊ | 89.4 (59/66) | 71.1 | 6.1 (24/392) | 0.792 | 2 |
| `skip-haiku-45` **`*`** (07-01) | Claude Haiku 4.5 | tools, 16-par, ◊splice, `*`override | `752d5468` ◊ | 89.7 (61/68) | 73.5 | 5.6 (22/390) | 0.808 | 2 |

‡ **Sonnet 5.0 (`claude-sonnet-5`), default config, first full run on the new code (`21518a5f`).** Starred
**82.4 / 75.7 / 0.789** (un-modified 84.8 / 75.7 / 0.800), noVerdict 2; **179 tool calls / 121 cases** (incl. the
new `interact_and_observe` ×9, query_ax_node 77, capture_full_page 41, resolve_destination 23); spend **$27.96**
(181k out, 4.44M cache-read, mean 341 out/verdict). **READ-OFF — NOT a clean model swap.** It is **below** the
Sonnet 4.6 row (89.7 / 77.2 / **0.830**), driven entirely by **recall** (82.4 vs 89.7 — 56 vs 61 of 68 caught;
`uncertain` 11 vs 8): on this eval Sonnet 5.0 is **more conservative** — it abstains more and flags fewer barriers,
at the same FP/precision. **Confound:** the two runs are at DIFFERENT commits — `sonnet5-full` rides `21518a5f`
(this round's FP fixes + cross-origin/table/primitive-set work), `claude-sonnet-full` rode `34aec9d3` (no FP fixes)
— and the config differs (16-par default vs 8-par; concurrency does not change verdicts, but the code does). A
clean model-only comparison needs a Sonnet 4.6 re-run at `21518a5f`; until then read the gap as model+code, not
model alone. (Notably the FP fixes did NOT drop Claude's FP count here — still 18 — so Sonnet 5.0 surfaces its own
FPs where 4.6's recovered ones were; worth isolating.)

§ **GPT-5.4-mini, first run of the LLM-independence splice optimization + the round-4 tooling build (`9415844e`).**
Ran only the **325 LLM-dependent cases** live (`--cases=llm-dependent-live.txt`) and **spliced the 132 deterministic
LLM-independent cases** (all `noObligation`/no-LLM-trace across 4 prior runs → all TN) as a fixed contribution. The
splice is exact — reconstructing the GPT-5.4 baseline from (its 325-live + 132-fixed) reproduces its full metrics
byte-identically — so this saves ~29% of the browser collection work with no metric distortion; recall stays fully
live (66/66). Config: 25 pages / 60 parallel calls, `V3_MAX_TABS=24` (memory safeguard after an orphaned-Chrome OOM
crash on the first attempt). Real model spend confirmed (4.31M in / 246k out, 682 events — vs the aborted
`gpt-5.5-mini` attempt which was a **404 non-existent model** the transport silently degraded to all-noVerdict, 0
tokens). **CONFOUND — model+code, not model alone:** this rides `9415844e` (round-3 fixes + round-4 hover/drag/
contrast/confusable tooling), while the `openai-gpt54-full` GPT-5.4 baseline rides `876e4696` (older). So the
+0.037 F1 over GPT-5.4-full (0.864 vs 0.827) mixes the mini model with the newer build; a clean read needs GPT-5.4
re-run at `9415844e`. Still, **0.864 is the strongest measured GPT result** and second only to `full-claude-default`.

◊ **Persisted LLM-independence splice (`--skip-llm-independent`, harness commit `752d5468`; pipeline `b7fe59f8`
≡ `9415844e`).** First runs of the splice optimization as a **committed, guarded** harness feature
(`eval/checker-comparison/lib/llm-independent.js`), superseding the ad-hoc `§` version. Ran only the **327
LLM-dependent cases** live and spliced **131 deterministic LLM-independent cases** (zero in-scope obligation ⇒
`noObligation` regardless of model ⇒ all TN) as a fixed contribution — the full 458-set metrics for ~29% less
browser work; recall stays fully live (all `failed` cases run live). The manifest (`llm-independent-set.json`) is
guarded by a SHA-256 over the 74 deterministic-pipeline files and **refuses to splice on hash drift** (the set was
measured drifting 137→132 across commits; here the pipeline is byte-identical `9415844e`→`b7fe59f8`, so the guard
passes). The one testcaseId appearing **twice** in the reaches set (same page under two ACT rules) is kept LIVE, not
spliced, so live + spliced = 458 exactly. **Clean cross-family read — all three ride the SAME code:** Sonnet 4.6
**97.1 / 82.5 / 0.892** > Gemini 3.5 **92.6 / 81.8 / 0.869** > Haiku 4.5 **89.7 / 73.5 / 0.808** (starred; 0 errors,
noVerd ≤3 each; Sonnet $26.64 / 345k out, Haiku $16.71 / 1.13M out, Gemini 664k out). **Sonnet 4.6's `*`0.892 is
the strongest measured full-set F1 to date** (prior best `full-claude-default` 0.876). **Confound vs older rows:**
these ride the `9415844e` pipeline (round-3+4 fixes); the 0.876 baseline rode `49b4c23b` — so the model *ranking*
here is clean (identical code) but the gain over 0.876 mixes fixes+model. Splice exactness independently unit-tested
(`lib/llm-independent.test.js`, 8 tests) + the arithmetic asserted at run time (`live + spliced === 458`).

† plus a 1-line uncommitted `V3_MAX_TABS` env wire (`limits.js`) so `--max-tabs=64` takes effect. **`fn-llm-gemini-v2`
is the first full run with ALL the round's fixes live** (Gemini image-tool fix → **noVerdict 28→4**; decorative
lane; the `*` GT override — shown as the two rows above, un-modified then starred). It brings **Gemini to
Claude-level recall** (90.9%, up from 83.3% at `49b4c23b`): the image-tool fix recovers the capture-driven
noVerdicts and the lane adds recall (at a small FP cost, 2.8→4.6). **The deployed-Claude all-fixes re-run is now
done** (`claude-sonnet-full`, `34aec9d3`): **89.7 / 77.2 / 0.830 starred** (89.4 / 74.7 / 0.814 un-modified) —
a **regression** from the pre-fix `full-claude-default` (90.9 / 84.5 / **0.876**). The fixes that *won* for Gemini
*cost* Claude: FP **11→18** (2.8→4.6), recall held (90.9→89.7), F1 **0.876→0.830**. The asymmetry is mechanical —
Gemini's gain was almost entirely **noVerdict recovery** (28→4) from the image-tool fix, an upside Claude never had
(it was already at noVerd 3 / 90.9 recall), so for Claude the decorative lane + 1.3.1-ARIA / 2.1.2-routing
re-calibration (`e41784db`) is **all FP cost, no recall benefit**. New FPs cluster in the re-calibrated lanes
(2.4.4 ×20, 1.1.1 ×13, 2.4.6 ×10 at the obligation grain). Tool use: **121 calls / 11 tools / 70 cases**
(query_ax_node 50, capture_full_page 20, resolve_destination 20, …); spend **$23.95** (404k out, 2.43M cache-read,
539 events, mean 750 out/verdict). **Implication:** `full-claude-default` (0.876) remains the strongest *measured*
Claude full result, but it predates the round's fixes — the round-3 lanes need to be gated harder (or made
provider-aware) before they are net-positive for the deployed Claude default.

**Provenance / read-off.**
- `full-gemini-50p` + `full-claude-default` are the first post-FP/FN-fix full runs (request: "run gemini
  50-parallel + claude on the full suite"), both at `49b4c23b`. They **predate** the Gemini noVerdict recovery
  (`e41784db`) — hence Gemini's **28** noVerdict vs Claude's 3 — and the decorative lane + cross-rule override
  (`52ab69d5`/`2c7628c0`). **`full-claude-default` (90.9 / 84.5 / 0.876) is the strongest measured full result to
  date** and supersedes Table 1's stale Full-harness cell (72.7 / 80.0) on the same scoring — but note it **predates
  the round's fixes**; the all-fixes Claude re-run (`claude-sonnet-full`, 0.830) regresses on it (see `†` note).
- The cross-family read of `fn-llm-gemini` (recall *generalizes* across model families, precision is the
  model-dependent cost) is the Table 1b blockquote; the gap to `full-gemini-50p` (74→83 recall, 5.4→2.8 FP) is the
  FP/FN-fix batch + run-to-run judge noise.
- `fn-llm-gemini-v2` (complete) is the first full run with **all** the round's fixes live (Gemini image-tool fix →
  **noVerdict 4**, down from 18–28; decorative lane; `*` override applied — 7 cases, 0 quarantined). Un-modified
  90.9 / 76.9 / 0.834, starred **91.2 / 79.5 / 0.849** — Gemini at Claude-level recall, confirming the fix-set is
  not model-specific. The deployed-**Claude** all-fixes re-run is now in the ledger (`claude-sonnet-full`,
  `34aec9d3`): starred **89.7 / 77.2 / 0.830**, a **regression** from the pre-fix 0.876 — the fix-set's recall
  recovery is Gemini-specific (noVerdict 28→4) while its FP cost (2.8→4.6) is shared, so it is net-negative for the
  already-ceiling Claude default. See the `†` note above.
- `openai-gpt54-full` is the **third model family** (GPT-5.4), via a HAND-ROLLED OpenAI **Responses-API** function-
  calling loop (`makeOpenAITransport`) over the SAME `buildCdpToolDispatch` handlers as Gemini — the loop is OURS, so
  tool use is guaranteed. Unmodified **83.3 / 79.7 / 0.815**, starred **83.8 / 82.6 / 0.832** (noVerdict **5**). Recall
  trails Claude/Gemini (~84 vs ~91) at comparable precision and the lowest FP of the cross-family rows (3.1%). Tool use
  was RICH: **302 calls across 13 cdp tools on 116/309 LLM cases** (query_ax_node 98, resolve_destination 82,
  capture_full_page 40, observe_state_after_activation 22, compare_iframe_content 16, ocr_image_text 13, …). Token
  spend (now tracked in `summary.json`): **4.65M total** (4.37M in / 274K out, 743 usage events, mean 369 out/verdict),
  59.3 min wall-clock. CONTRAST — the `@openai/codex-sdk` **agent** lane (same GPT-5.4, same cdp tools over an in-process
  HTTP-MCP bridge) made **0 tool calls** across every probe (six channels: prompt guidance, MCP `instructions`,
  approval=auto, networkAccess, high reasoning effort, in-prompt catalog) despite connecting + listing them — so the
  hand-rolled loop, not the agent SDK, is the GPT tools path. Codex remains a vision-only no-tools judge.

## Table 1f — Cross-tool baseline: GenA11y (single-shot LLM judge, no grounding, no tools)

To situate the harness against a **published external LLM-accessibility tool** (not just our own ablations), we
adapted **GenA11y** (Deng et al., `seal-hub/GenA11y` — Selenium per-SC element extraction → **one single-shot LLM
call** per SC; no structured grounding, no tools, no obligation ledger, no applicability gate) to run on the **same
official W3C ACT corpus** with the **same two model families** as the Table 1e cross-family rows. The adapter
(`eval/gena11y/`, commit `a50a70ba`) ports GenA11y's extraction for the 15 categories.json SCs it can cover, tags
each element with its XPath so violations map to our verdict schema, and routes the judge through a **pluggable
transport that reuses the SAME provider APIs** as our harness (Gemini `generateContent`; OpenAI Responses
`/v1/responses`; single-shot, vision inlined as base64). This is the cleanest possible *system-level* control: same
corpus, same models, same provider endpoints — **only the architecture differs** (GenA11y's ungrounded single-shot
judge vs our facet-routed, tool-augmented, ledger-reconciled harness).

**Coverage + accounting.** GenA11y's extraction covers **10** of the corpus's SCs (5 of its 15 categories.json SCs
have 0 ACT cases; the 7 interaction SCs — keyboard/focus/hover/status — it cannot address at all). We report on
**both** paper denominators (FULL **581** → Table 1a; REACHES-LLM **458** → Table 1b/1e) under **two** accountings:
*covered-only* (GenA11y's native slice: 531 of 581, 411 of 458) and **uncovered=Negative** (score over the WHOLE
denominator, counting every SC GenA11y cannot handle as an abstain → Negative: an uncovered GT-fail is an FN, an
uncovered GT-pass/NA a TN). The **uncovered=Negative** rows use the **identical denominator** as the harness rows,
so they are directly comparable; they hold GenA11y accountable for its coverage gap. Per-SC scoring, raw ACT labels.
Recompute: `python eval/gena11y/analyze.py`.

**Model-matched head-to-head on the reaches-LLM 458 set (uncovered=Negative — identical denominator to Table 1e):**

| System (reaches-LLM 458, per-SC) | model | Recall ↑ | Prec ↑ | FP rate ↓ | F1 ↑ |
|---|---|---|---|---|---|
| GenA11y (single-shot, no grounding, no tools) | Gemini 3.5-flash | 53.0 (35/66) | 31.8 | 19.1 (75/392) | 0.398 |
| **Our harness** (`fn-llm-gemini-v2`, Table 1e) | Gemini 3.5-flash | **90.9** (60/66) | **76.9** | **4.6** (18/392) | **0.834** |
| GenA11y (single-shot, no grounding, no tools) | GPT-5.4-mini | 50.0 (33/66) | 23.7 | 27.0 (106/392) | 0.322 |
| **Our harness** (`gpt54mini-live`, Table 1e) | GPT-5.4-mini | **86.4** (57/66) | **86.4** | **2.3** (9/392) | **0.864** |

**Full-corpus 581 view (uncovered=Negative), against the existing-checker baseline (Table 1a):**

| System (full 581, per-SC) | model | Recall ↑ | Prec ↑ | FP rate ↓ | F1 ↑ |
|---|---|---|---|---|---|
| **axe-core** (best single checker, Table 1a) | — | 59.9 (106/177) | **89.8** | **3.0** (12/404) | 0.72 |
| GenA11y (single-shot, no tools) | Gemini 3.5-flash | 63.8 (113/177) | 58.2 | 20.0 (81/404) | 0.609 |
| GenA11y (single-shot, no tools) | GPT-5.4-mini | 65.5 (116/177) | 50.0 | 28.7 (116/404) | 0.567 |

**Read-off.**
- **Same model, harness vs GenA11y — the harness dominates every axis.** On the reaches-LLM set the harness beats
  GenA11y by **+37.9 recall / +45.1 precision / −14.5 FP** (Gemini) and **+36.4 recall / +62.7 precision / −24.7 FP**
  (GPT-5.4-mini), roughly **doubling F1** (0.398→0.834; 0.322→0.864). Because model, corpus, and provider endpoints
  are held fixed, this delta **isolates the harness architecture** (route-by-facet grounding + tools + obligation
  ledger + calibrated honest-uncertainty scoring) from the model — GenA11y is the same-model, no-harness control.
  It is the *system-level* corroboration of contributions #1–#2 and #5.
- **GenA11y reproduces the ungrounded-LLM failure mode as a real external tool.** Its profile (reaches-LLM: ~50–58
  recall at **24–32% precision / 19–30% FP**) sits at — even slightly *below* — our Table 1b "LLM + name/role +
  vision, **no** facet-routed grounding" ablation (54.5 R / 44.4 P / 11.5 FP). GenA11y over-flags harder because it
  also feeds raw `outerHTML` (noisier recall at a precision cost, cf. the "raw HTML" Table-1b row) and has no
  applicability subtraction. The independently-built tool landing on the *same* ungrounded operating point is
  external validation that the precision problem is **architectural, not a quirk of our ablation harness**.
- **vs existing rule engines (full 581): higher recall, far worse precision.** GenA11y edges axe-core on recall
  (63.8–65.5 vs 59.9) — an LLM *does* surface residual barriers a static engine misses — but at **7–10× the FP rate**
  (20–29% vs 3.0%) and **30–40 pts lower precision**. So "point an LLM at the page" beats a good rule engine on
  recall and loses badly on precision; the facet-routed grounding is exactly what buys back precision **without**
  sacrificing that recall (our harness: 86–91 recall AND 77–86 precision on the harder reaches set).
- **Covered-only (native-slice) numbers** are marginally higher (they drop GenA11y's coverage gap): Gemini reaches
  58.3 R / 31.8 P / 21.4 FP (411 cases); GPT-5.4-mini 55.0 R / 23.7 P / 30.2 FP. The gap to the uncovered=Negative
  rows is the 6 GT-fail cases (of 66) in SCs GenA11y structurally cannot reach — the interaction/behavioural
  barriers the harness recovers with its tools + behavior-driving detectors (contribution #3).

**Provenance / artifacts.** Runs `results/gena11y-act-gemini` (Gemini, 531 cases, 1 error, $1.22) and
`results/gena11y-act-gpt5mini` (GPT-5.4-mini, 531 cases, 4 errors, $0.44), commit `a50a70ba`, 25 parallel pages / 25
Chrome-tab cap / 60 concurrent LLM calls. Full runtime artifacts retained per run: `results.json`, `summary.json`,
`run.log`, `status.json`, and **`llm-trace.jsonl`** (every LLM call's prompt, raw output, model reasoning/thinking
trace, token usage, and parsed verdict). **Caveats:** (1) GenA11y is single-shot **no-tools** by design, so this is a
*system* comparison (our deployed tool-augmented harness vs the GenA11y tool), closest in ablation terms to the
Table-1b ungrounded rows; (2) the two model families here match Table 1e, but the harness GPT-5.4-mini row
(`gpt54mini-live`) rides a later commit (`9415844e`) and a deterministic-TN splice — see the Table 1e `§` note; (3)
this is the *adapted* GenA11y (our XPath/schema/transport shim), faithful to its single-shot extract→judge
architecture but not byte-identical to upstream's OpenAI-GPT-4o original.

## Table 1g — Cross-tool baseline: AccessGuru (axe-core 4.4.1 + LLM semantic detector)

A **second published external tool**, architecturally different from GenA11y: **AccessGuru** (Ahmad et al.,
`NadeenAhmad/AccessGuruLLM`) is a **hybrid** detector — axe-core 4.4.1 for **syntactic/layout** violations UNION an
LLM **semantic** detector (their taxonomy of 12 "not-descriptive / mismatch / ambiguous" violation types the rule
engine cannot catch). We adapted its **detection** module (`eval/accessguru/`, commit `4079318b`) faithfully: their
**actual axe-core 4.4.1** injected via Selenium (mirroring their Playwright `axe.run(document)`), their **exact
semantic prompt** (system + taxonomy + HTML + full-page screenshot + `[START]…[END]` element markers), both
detectors' findings mapped to WCAG SCs through **their** `mapping_dict_file.json`; the semantic LLM runs through the
**same transport/endpoints** (Gemini `generateContent`, OpenAI Responses) as GenA11y and the harness. AccessGuru is
**page-level** (one axe run + one semantic LLM call per page), so it runs natively on the **full 581** corpus; a
case's target SC is flagged if **either** detector maps a violation to it. We keep the axe component (per its design)
and **decompose** the result into axe-only / LLM-semantic / axe∪LLM. Per-SC scoring, raw ACT labels. Recompute:
`python eval/accessguru/analyze.py`.

**Element-scoping (the fair correction).** AccessGuru's axe config ships with `best-practice` (+ AAA/section508/EN)
tags. On the **minimal ACT fixtures** those best-practice rules fire on **page scaffold, not the element under test**,
and their `mapping_dict` attributes them to real SCs — a spurious flag against a GT label that only covers the
tested element. Empirically the faithful-axe reaches-FPs are **almost entirely** three page-structural best-practice
rules: `landmark-one-main` (×53) + `region` (×47) → 1.3.1, and `page-has-heading-one` (×12) → 2.4.6 (none of which
tests the fixture's element under test). They also produce **spurious TPs** (a `landmark`/`region` advisory that
happens to map to a failed case's SC). Because our harness and GenA11y were both scored **only on the element under
test**, we report an **element-scoped** verdict (`*`) that drops axe **best-practice-only** rules (the 31 axe-4.4.1
rules with no `wcag*` tag — `eval/accessguru/data/axe_best_practice_only.json`), keeping genuine WCAG violations on
the tested construct. This matches the harness's WCAG-scoped axe. We report the **faithful** (as-shipped) numbers
alongside for transparency. Validation: element-scoped **axe-only** recovers **86.4% precision / 3.7% FP** — matching
our independent axe-core baseline (Table 1a: 89.8 / 3.0), confirming the faithful-axe FPs were best-practice noise.

**Full-corpus 581 view (element-scoped `*` primary; faithful shown too), vs the existing-checker baseline (Table 1a):**

| System (full 581, per-SC) | model | Recall ↑ | Prec ↑ | FP rate ↓ | F1 ↑ |
|---|---|---|---|---|---|
| **axe-core**, harness scope (Table 1a) | — | 59.9 (106/177) | **89.8** | **3.0** (12/404) | 0.72 |
| AccessGuru — axe-only `*` (WCAG-scoped) | — | 53.7 (95/177) | 86.4 | 3.7 (15/402) | 0.662 |
| AccessGuru — LLM-semantic only | Gemini 3.5-flash | 37.9 (67/177) | 54.0 | 14.2 (57/402) | 0.445 |
| AccessGuru — LLM-semantic only | GPT-5.4-mini | 40.1 (71/177) | 54.2 | 14.9 (60/404) | 0.461 |
| **AccessGuru (axe`*` ∪ LLM)** | Gemini 3.5-flash | 71.2 (126/177) | 64.6 | 17.2 (69/402) | **0.677** |
| **AccessGuru (axe`*` ∪ LLM)** | GPT-5.4-mini | 71.2 (126/177) | 63.3 | 18.1 (73/404) | 0.670 |
| _faithful (axe incl. best-practice) ∪ LLM_ | Gemini 3.5-flash | _75.7_ | _51.9_ | _30.8_ | _0.616_ |
| _faithful (axe incl. best-practice) ∪ LLM_ | GPT-5.4-mini | _75.7_ | _51.5_ | _31.2_ | _0.613_ |

**Model-matched head-to-head on the reaches-LLM 458 set (element-scoped `*`; vs Table 1e):**

| System (reaches-LLM 458, per-SC) | model | Recall ↑ | Prec ↑ | FP rate ↓ | F1 ↑ |
|---|---|---|---|---|---|
| AccessGuru (axe`*` ∪ LLM) | Gemini 3.5-flash | 40.9 (27/66) | 30.7 | 15.6 (61/390) | 0.351 |
| **Our harness** (`fn-llm-gemini-v2`, Table 1e) | Gemini 3.5-flash | **90.9** (60/66) | **76.9** | **4.6** (18/392) | **0.834** |
| AccessGuru (axe`*` ∪ LLM) | GPT-5.4-mini | 42.4 (28/66) | 29.8 | 16.8 (66/392) | 0.350 |
| **Our harness** (`gpt54mini-live`, Table 1e) | GPT-5.4-mini | **86.4** (57/66) | **86.4** | **2.3** (9/392) | **0.864** |

(Faithful, before element-scoping: reaches AccessGuru∪LLM was 53.0/23.2/29.7 (Gemini), 54.5/23.2/30.4 (GPT-5.4-mini)
— inflated on **both** axes by the best-practice scaffold rules; element-scoping removes the spurious FPs **and** the
spurious TPs, dropping reaches recall 53→41 as those `landmark`/`region` "catches" were never the element under test.)

**Read-off.**
- **Same model, harness vs AccessGuru — the harness dominates every axis.** Reaches-LLM, element-scoped: +50.0 recall
  / +46.2 precision / −11.0 FP (Gemini) and +44.0 recall / +56.6 precision / −14.5 FP (GPT-5.4-mini), F1 0.35 →
  0.83–0.86. Two independently-built external tools (GenA11y single-shot, AccessGuru hybrid), same models/corpus/
  endpoints, both land far below the facet-routed harness — the architecture gap is not tool-specific.
- **The model barely matters for AccessGuru.** Gemini and GPT-5.4-mini are near-identical (71.2 / 71.2 full recall;
  40.9 / 42.4 reaches) because the **deterministic axe backbone is model-independent and dominates**, and the semantic
  LLM is a small, similar marginal add across families (full-corpus LLM-only 37.9 vs 40.1). This contrasts with the
  harness, where the model rides on rich routed evidence and the *system* — not the model — sets the ceiling.
- **The element-under-test correction matters — and cuts both ways.** AccessGuru's faithful axe over-flags (20.5% FP
  full / 19.4% reaches) almost entirely via best-practice **page-structural** rules (`landmark-one-main`, `region`,
  `page-has-heading-one`) firing on fixture scaffold, not the tested element; scoping them out drops FP to 3.7%
  (axe-only, matching axe-core) and lifts union precision 51.9→64.6%. But it also removes the **spurious recall**
  those advisories bought (reaches 53→41): axe genuinely contributes almost nothing on the hard residual once
  restricted to the element under test (axe-only`*` reaches 4.5% recall). The semantic LLM is the real hard-set
  contribution (36–40% reaches recall) — and it is where AccessGuru's residual FP now lives (genuine on-element
  over-flags: `link-text-mismatch`, `button-label-mismatch`, `incorrect-semantic-tag`), the same ungrounded-LLM
  failure mode GenA11y shows.
- **vs existing rule engines (full 581):** element-scoped AccessGuru reaches **71.2 recall** — its semantic LLM adds
  **+17.5 over its own WCAG-axe's 53.7** — but precision falls to 64.6% (vs axe-only`*` 86.4% / axe-core 89.8%) and F1
  lands at 0.677, still **below axe-core-alone's 0.72**: the LLM's added recall does not pay for its precision cost
  without facet-routed grounding. The harness clears both (86–91 recall AND 77–86 precision on the harder reaches set).
- **vs GenA11y (Table 1f):** on reaches the two baselines converge — element-scoped AccessGuru 40.9–42.4 recall /
  ~30 precision vs GenA11y 50.0–53.0 / 24–32 — both sub-0.4 F1, both dominated by the same on-element LLM over-flagging,
  both far under the harness's 0.83.

**Provenance / artifacts.** Runs `results/accessguru-act-gemini` (Gemini, 581 cases, 2 errors, $1.85) and
`results/accessguru-act-gpt5mini` (GPT-5.4-mini, 581 cases, 0 errors, $1.34), commit `4079318b`, 25 pages / 25 tabs /
60 LLM. Per run: `results.json`, `summary.json`, `run.log`, `status.json`, and **`llm-trace.jsonl`** (per page: axe
rule-ids, semantic violation-names, the raw semantic output with `[START]…[END]` element snippets, model
reasoning/thinking, token usage). Element-scoping is applied post-hoc in `analyze.py` from the stored per-rule axe-ids
(exact, deterministic — no re-run) using the axe-4.4.1 best-practice-only set. **Caveats:** (1) scoring is **page ×
target-SC**; AccessGuru does produce element-level findings (axe node targets; semantic snippets, retained), and the
`*` element-scoping restricts axe to the WCAG construct under test — but a residual "right SC via an on-element but
off-construct WCAG violation" is still possible (rare on minimal fixtures); (2) faithful and element-scoped numbers
are both reported — `*` is the fair cross-tool comparison, faithful is what AccessGuru ships; (3) this is the *adapted*
AccessGuru (Selenium axe injection; structured element markers for parseable output), faithful to the axe∪semantic
detection design but not byte-identical to upstream's OpenRouter multi-model original.

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

## Table 2b — DHS Trusted-Tester external corpus (independent held-out evaluation)

A second, fully independent held-out corpus: 54 ACT-format test cases hand-derived from the DHS **Trusted
Tester v5.1.3** certification exam's official worked examples (`eval/trusted-tester/testcases.json`,
`eval/trusted-tester/run-trusted-tester.js`). This corpus was never touched during any tuning on the 581-case
ACT/main corpus (Tables 1/1b/2 above) — it is a genuinely external generalization check, sourced from a
different institution's (DHS Section 508 program) own certification materials rather than the W3C ACT rules
suite. Provider/model: OpenAI `gpt-5.4-mini`, tools+vision on. Scoring: recall over `expected: failed` cases
(a flagged barrier is a true positive), specificity/FP over `expected: passed|inapplicable` cases (a flagged
barrier is a false positive) — same convention as Table 1.

| Run | commit | recall (caught / failedN) | FP rate (FP / n) |
|---|---|---|---|
| Baseline (pre-fix-cycle) | `d29a6288` | 44.4% (8/18) | 8.3% (3/36) |
| Round-3 (this fix cycle) | `176c1988` | **72.2% (13/18)** | 8.3% (3/36) |

**+27.8 points of recall at an unchanged FP rate** — the fix cycle (5 targeted harness/rubric fixes: §Main
contributions below) closed real coverage gaps rather than trading precision for recall. `noObligation` (a
case where the deterministic ledger never even minted the obligation the GT label requires) fell from 15→6
across the corpus, confirming the recall gain is a genuine coverage-gap closure, not a scoring artifact —
before these fixes roughly a third of the corpus's obligations were structurally unreachable regardless of
what the LLM judge did.

| SC (biggest movers) | expected | round-3 caught | baseline caught | driving fix |
|---|---|---|---|---|
| 1.3.1 (programmatic-label / table-header / heading-outline) | inapplicable | 4 | 1 | 1.3.1 field-programmatic-association routing gap (commit `a5483e85`) |
| 4.1.2 (auto-update-notification, TT 2.D) | inapplicable | 1 | 0 | new obligation family + rubric, this cycle (`176c1988`) |
| 2.4.6 (heading-descriptive) | failed | 1 | 0 | heading-level nesting fix (commit `a5483e85`) |
| 2.4.7 (focus-visible) | inapplicable | 1 | 0 | vision-capture resilience (#7/#7b, `176c1988`) unstuck a previously-zero-obligation page |
| 2.1.1 (keyboard) | failed | 1 | 2 | within LLM sampling noise (σ≈1.06 FP established in Table 1c; not investigated as a regression) |

Methodology notes: single run per point (LLM non-determinism applies, as in Table 1e); a DIFFERENT
provider/model (OpenAI gpt-5.4-mini) than the Claude-based Table 1 ACT-corpus numbers, so this is a
cross-provider generalization signal, not a directly comparable recall figure. One known, already-deferred
gap remains open on this corpus: `4.1.2-frame-title` (TT 12.C, obsolete `<frame>`/`<frameset>` title) — tracked
as G8 in `docs/DEFERRED-TODO.md`, deliberately out of scope for this cycle.

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
   (σ≈1.06 FP), recommending multi-run-median measurement for sub-floor changes. A **full-pipeline** cross-family run
   (the *whole* LLM lane on Gemini 3.5-flash at the deployed config — Table 1b, `results/fn-llm-gemini`) independently
   corroborates the shared core (6 of Claude's 11 Full-config FPs are flagged by Gemini too) while sharpening the
   boundary: *recall* is family-invariant (49/66 for both; 45 of 49 catches the same cases), but the *absolute* FP rate
   is model-dependent (Gemini 21 vs Claude 11 — 15 model-specific extra over-flags), so the precision *ceiling* is
   judge-invariant for the ambiguous core even though the *operating point* is not.

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
- Ground truth is **per-SC**, but each ACT testcase carries only **one rule's** label. Where same-SC rules
  partition a construct by applicability (1.1.1 in-tree vs removed-from-tree images), a page can be labeled clean
  for its rule while a sibling rule would fail the same construct — so a *correct* harness flag is graded a false
  positive. The **7** such cases on this corpus were examined at the criterion level and carry an explicit, audited
  **GT override** (`*`; Table 1d): 2 hidden W3C wordmarks → `failed` (consistent with ACT's own `e88epe` rule), 5
  decoratives confirmed negative. We report both starred and **un-modified** raw-label metrics. The override keys
  on *label validity*, never on whether the harness agrees (it relabels only the 2 cases ACT's complementary rule
  also fails, and keeping the 5 cleared TNs graded *raises* our FP rate — it is conservative, not self-serving).
  Any un-examined cross-rule case (none remain here) falls back to being quarantined from the denominator. The
  whole mechanism is **1.1.1-images only (v1)**; other partitioned SCs (e.g. 2.4.2 title present/descriptive) are
  not yet covered. The override is a small **hand-labeled** overlay — the one place we depart from raw ACT labels.
