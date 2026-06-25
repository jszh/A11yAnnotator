# FP-reduction, round 2 — a CONTROLLED (fixed-evidence) re-investigation

**Date:** 2026-06-24 · **Builds on:** [`REPORT.md`](REPORT.md) (2026-06-21, the first FP-reduction study).

## Why a round 2 (what round 1 could not do)

Round 1's central, correct finding was **methodological**: on the full ACT pipeline, the FP count swings **±3 on
byte-identical runs** (FP = 14/16/10 over three runs), so any change < ±3 FP is *unmeasurable by single-run
comparison*. It then refuted every FP lever it tried (voting, confidence-gating, applicability prose, self-critique)
and concluded the LLM lane is at a **noise-bound ceiling**, with only **7 stable FPs** (the rest noise), several of
which are *defensible GT-nuance* (the harness is sometimes more WCAG-correct than the lenient ACT GT).

But that ±3 floor was measured over the **whole pipeline** — collect, vision capture, and (tools-on) live CDP tool
sessions are all nondeterministic, and that nondeterminism is folded into the "noise floor." Round 1 itself flagged
the limitation ("the eval cannot currently measure most fixes") and recommended two things it did **not** then do:
(1) a noise-floor-aware measurement that can see sub-floor changes, and (2) **held-out validation on
`eval/act-augmented/`**, the corpus the harness was never tuned on.

Round 2 supplies exactly those. The instrument is a **judge-replay harness** that freezes the evidence once and
re-runs ONLY the LLM judgment, so:

- **Evidence is held byte-fixed across every variant** → the only remaining variance is the judge's *intrinsic*
  sampling noise. This isolates "is the judge noisy?" from "is the pipeline noisy?" — round 1 could not separate them.
- **Experiments are cheap** (no browser) → K≥10 replicates and many method A/Bs are affordable, enabling real power
  analysis instead of K=3.
- **Methods toggle identically in replay and in a live run** (same `V3_FP_*` env levers in `llm-adjudicator.js`),
  so a replay win transfers to a full tools-on validation run with no code change.

The honest hypotheses going in: either (a) the fixed-evidence floor is materially tighter than ±3, re-opening the
measurement question and letting a real effect show; or (b) the floor is *still* ±3 even with evidence fixed, which
would prove the noise is intrinsic to the judge and make round 1's ceiling conclusion bulletproof. Both are useful.

## The instrument (`eval/checker-comparison/fp-experiments/`)

- `freeze-and-baseline.js` — one tools-OFF pass over the 458 reaches-LLM cases. Via an additive, inert-by-default
  `onLlmInputs` hook in `orchestrator.js`, it snapshots the EXACT judge inputs per case (selected agent/rubric
  subjects + `visionByXpath` crops + VSR transcript + checker hints + the preliminary deterministic build) to an
  evidence "pack", and scores the pass as **baseline run #0**.
- `replay-judge.js` — loads packs, re-calls `runAdjudication`/`runRubricJudgments` with an injected single-shot
  `runAgent` and a `--method` preset, scores with the SAME scorer (`score-lib.js`, copied verbatim from
  `run-fn-llm.js`). `--rep=K` runs K replicates.
- `methods.js` — `--method` → `V3_FP_*` env flags. The levers live in `llm-adjudicator.js` (`buildPrompt` +
  `judgeWithMethod`), all inert unless their flag is set, so production runs are byte-identical.
- `analyze-replicates.js` — per-run FP/recall, the noise band, the stable/noisy decomposition, per-case flip rates.

**Scope of the replay set.** Only cases that REACH the judge (have ≥1 auto-PARTIAL in-scope subject) get a pack.
Deterministically-settled cases have no LLM verdict, so their outcome is identical under every judge design — they
are added back from baseline-0 only for absolute full-corpus reporting. All 14 exp30 FPs were LLM verdicts (one was
a deterministic contrast FP), so the pack set is the entire method-addressable FP surface.

**Caveat (faithfulness).** The replay testbed is **tools-OFF, single-shot**. exp30 ran tools-ON. So replay's
*absolute* FP differs from exp30; what it measures cleanly is each method's *relative* effect on identical evidence.
Any method that wins in replay is re-validated in a live tools-ON full run before being believed.

## Failure-mode taxonomy (independently reproduced from exp30, matches round 1's 7 stable FPs)

Verified against the actual fixtures. The 14 exp30 single-run FPs reduce to four modes; round 1's 3-run
decomposition shows ~7 are stable (the rest noise, concentrated in 2.4.4).

| Mode | Mechanism (verified) | SCs | Best-fit method | Round-1 status |
|---|---|---|---|---|
| **A — LLM adjudicates a deterministic facet** | recomputes contrast ratio/threshold; ignores `aria-hidden` exposure (`fc92e27` is `aria-hidden`; `2845a8`/`eb4bfbb` are flat-bg ratios the runner should own; large-text 3:1 exception missed) | 1.4.3 | facet gating (route-by-facet), not prompting | partly "perceptual/applicability" |
| **B — WCAG exception/boundary not applied** | essential image-of-text (`671c8b`); 4.1.2 needs name *presence* not *quality* (`ede992` "button/link") | 1.4.5, 4.1.2 | explicit positive-class boundary; **decomposed applicability gate** | "applicability gap — largest addressable class" |
| **C — context/equivalence not credited** | table-header context (`5effbb` Ulysses→HTML/EPUB/txt); equivalent-purpose links (`fd3a94`/`228c0a3` "ACT rules"×2) | 2.4.4 | grounded "rule-out-first"; (tools resolve_destination *worsens* this) | "hard semantic; noise epicenter (8/16 flips)" |
| **D — ambiguous meaning/exposure → barrier** | bare `<svg><circle>` with NO role asserted as `role=image` (`1f2223`) | 1.1.1 | grounding; abstain on genuine ambiguity | "SVG-decorative applicability" |

## Method roster (what's genuinely new vs already-refuted)

All implemented behind `V3_FP_*` (inert by default).

| Method | Flag | Targets | Round-1 evidence | Round-2 stance |
|---|---|---|---|---|
| Distractor-strip (drop task framing/claim-family priming) | `V3_FP_STRIP_QUESTION` | global over-flag | **untested** | **NEW — primary** (only *measured* FP reducer in the survey) |
| Grounded verdict (cite span + rule out benign before flagging) | `V3_FP_GROUNDED` | C, D | untested (≠ "more prose") | **NEW** |
| Positive-class boundary (general WCAG no-flag guardrails) | `V3_FP_BOUNDARY` | B | "more prose refuted (LLM ignores present clauses)" | test as *general* (not case) prose; expect weak |
| Decomposed applicability gate (separate applies?/exempt? call before barrier call) | (planned) | B, D | NOT tested (round 1 only tested in-rubric prose) | **NEW — the real form of the "largest addressable class"** |
| Refutation cascade (skeptical 2nd pass overturns BARRIER) | `V3_FP_REFUTE` | C, D | refuted on full pipeline (noisy 1st pass; symmetric; cost TPs) | **re-test on FIXED first pass** (round 1 couldn't isolate) |
| Confidence-gated abstention | `V3_FP_ABSTAIN` | D | refuted (FPs are high-confidence) | quick controlled re-confirm |
| Self-consistency (K-sample, agreement bar) | `V3_FP_VOTES` | C noise | refuted for accuracy (stabilizes measurement only) | quick controlled re-confirm |
| Diverse-model panel (PoLL, different families vote) | (planned) | C, D | NOT tested (round 1 self-critique only) | **NEW** if single-family methods fail |

## Protocol

1. **Fixed-evidence noise floor** — baseline replay K=10 on the FP-SC packs; decompose stable/noisy; compare to the
   round-1 ±3 full-pipeline floor. _Gates everything: it sets the minimum detectable effect._
2. **Power analysis** — from the per-case flip rates, compute K and n needed to detect a target ΔFP at 80% power
   (paired McNemar on identical evidence).
3. **Method A/Bs** — each method K replicates vs baseline on identical packs; ΔFP and Δrecall with CIs; recall floor
   (66 GT-fail) is a hard constraint — no method may trade recall for FP.
4. **Anti-overfit** — methods encode only GENERAL WCAG principles (never case-specific text). Authoritative GT is
   the **official ACT subset only**; `eval/act-augmented/` labels are **NOT validated** (per the project owner,
   2026-06-24) so it is a *directional generalization/consistency probe*, not a certifying gate — numbers against it
   are reported as provisional. Winners are validated on (a) the full pack set incl. non-FP SCs (newly-introduced
   FPs), (b) the **recall floor on all 66 ACT GT-fail** (no method may trade recall for FP), and (c) hand-authored
   adversarial near-misses with explicit WCAG-spec-cited labels.
5. **Final** — winning config on a live tools-ON full 458 run vs exp30; document with CIs.

## Results

_(all run artifacts organized under `results/fp-experiments/` — see its `README.md` for the layout)_

### R2.1 Fixed-evidence noise floor — the gating measurement ✅

Baseline replay, **K=10**, identical frozen evidence, 6 FP-producing SCs (310 packs, 261 GT-pass / 49 GT-fail):

| | per-run values | mean | sd | range |
|---|---|---|---|---|
| **FP** | 13,12,14,13,15,15,13,13,14,15 | **13.7** | **1.06** | **3** |
| recall (TP) | 35,36,35,37,37,36,38,35,36,39 | 36.4 | 1.35 | 4 |

**Fixing the evidence roughly HALVED the FP variance** (range 3 vs round 1's full-pipeline range 6 / 10–16) — so
about half of round 1's ±3 floor was pipeline (collect/vision/tool) nondeterminism. **But it did not collapse:**
an irreducible **±~1 FP (sd 1.06)** remains, intrinsic to the judge's own sampling. _Conclusion: round 1's
"noise-bound" diagnosis is real and now sharper — the judge itself, not just the pipeline, is a noise source._

**Per-case stability (K=10):** 273 stable-correct · **10 stable-FP** · 9 stable-MISS · **18 NOISY**.
- **2.4.4 is 11 of 18 noisy** and 6 of 10 stable-FP — the prior "noise epicenter", reconfirmed.
- **10 stable-FP:** `a1e9ff29`,`228c0a3d`,`8e6c190e`,`91abed12`,`b55973d2`,`19d5c288` (2.4.4 equivalent-purpose/
  context — partly defensible GT-nuance), `671c8b76` (1.4.5 essential image), `dc170fd0` (1.4.3 bg-image),
  `ede992d9` (4.1.2 name-quality), `14ecbd9d` (2.4.6). The 1.1.1 SVG cases that were *stable*-FP in round 1
  (tools-on) are **NOISY** here (tools-off) — the judge flip-flops on whether a bare nameless `<svg>` is exposed.

**Decision rule (from the floor):** total-FP is noise-obscured (sd≈1), so a method must move mean-FP by ≳2 **or**
show clean per-case stable transitions (clears stable-FPs, creates no stable-MISS). **Power:** at sd≈1.06, K=10
detects a mean ΔFP ≳1.5 (80%); K=5 screens ΔFP ≳2; the stable-transition metric detects single-case fixes directly.

### R2.2 Method effects

**Confidence-gated abstention — REFUTED with K=10 (free, simulated offline).** `abstain=high` moves FP 13.7→11.5
(−2.2) but recall 36.4→35.4 (−1.0). The barrier verdicts on GT-pass are **87% high-confidence** (175 high : 27
medium : 0 low); on GT-fail, 96% high. Abstention can only remove the *medium*-confidence barriers, which split
near-symmetrically between FP and TP — so it buys ~2 FP for ~1 recall, not a clean win. Reconfirms round 1's H5.

**Power analysis (from the measured floor σ=1.06).** Two-sample MDE at 80% power, α=0.05 ≈ 2.8·σ·√(2/K):
K=10 → ΔFP≈1.3 detectable; K=5 → ΔFP≈1.9. The aggregate FP is therefore a *blunt* instrument for sub-2-FP
effects. The **per-case stable-transition** metric sidesteps this — a stable-FP (10/10 in baseline) that a method
drives to 0/K is a clean, noise-free fix regardless of aggregate σ. **Protocol: screen at K=5 by stable-transition,
confirm finalists at K=10; recall floor on all 66 ACT GT-fail; act-augmented is a provisional generalization probe
only (labels unvalidated).**

**Method scorecard** (effects vs the K=10 baseline; ΔFP/Δrecall on the measured sets; "asym" = FP-fixed ÷ recall-lost):

| Method | family | ΔFP | Δrecall | asym | verdict |
|---|---|---|---|---|---|
| Confidence-abstain (high) | abstention | −2.2 | −1.0 | ~2 | **refuted** — FPs are 87% high-conf; only shaves medium-conf, ≈symmetric |
| Self-consistency, K=10 majority | voting | −1.7 | −0.4 | — | **negligible** (within noise; stabilizes measurement, not accuracy) |
| Self-consistency, K=10 unanimity-to-flag | voting | −3.7 | −3.4 | ~1 | **symmetric** — removes noisy barriers, half FP half TP |
| Decomposed applicability gate | decomposition | +0.7 | −0.6 | net 0 | **null** — gate says "applies" then flags (faint pull on ede992 4.1.2 only) |
| Grounded-verdict (K=2, partial) | grounding | −4.7 | −1.4 | ~3 | clears mostly **defensible** 2.4.4 equivalent-purpose FPs, loses a real 2.4.4 barrier |
| Distractor-strip (strip-question) | context-min | −1.1 | **+2.4** | 0 / 0 | **FP-neutral, small recall GAIN** — the literature's #1 reducer does NOT cut FP here (our judge checks grounded evidence, it doesn't "re-solve"); dropping the task framing slightly *un*-biases it toward flagging real barriers |
| Positive-class boundary | prose | −2.9 | −1.2 | **0** / 1 | no STABLE FP fixed — confirms round 1's "rubrics already carry exemptions, the LLM ignores added prose" |
| Self-refute (Claude) | cascade | −4.7 | −4.4 | 1 / 4 | **symmetric/net-negative** — loses 4 stable barriers to fix 1 FP; confirms round-1 H7 even on a STABILIZED first pass |
| Grounded-verdict | grounding | −4.9 | −1.8 | 3 / 2 | clears mostly **defensible** 2.4.4/2.4.6 link/heading FPs, loses 2 real 2.4.4 barriers |
| **Gemini cross-family refuter** | diverse panel | **−6** | **−5** | 6 / 5 | **symmetric** — a *different model family* overturns 6/11 FP **and** 5/29 TP, concentrated in the same ambiguous SCs (2.4.4/2.4.6); **agrees with Claude** on 4.1.2 |
| **grounded + strip (combination)** | combo | −3.3 | −2.2 | 1 / 2 | **non-additive, symmetric/net-neg** — strip's recall gain did NOT survive grounded's conservatism; lost 2 stable 4.1.2 barriers. The best-shot combo of an FP-reducer + a recall-booster still nets symmetric |

**The through-line (now triangulated across two model families):** every lever that reduces FP also reduces recall
by a comparable amount. None achieves a clean asymmetric win. The residual stable-FPs are **confident, systematic,
and CROSS-MODEL-SHARED** — Gemini and Claude fail on the *same* cases (2.4.4 equivalent-purpose, 2.4.6 heading
descriptiveness, 4.1.2 name adequacy), which is the signature of *intrinsically ambiguous WCAG judgments / debatable
GT*, not a fixable model error. This both **reconfirms round 1** (noise-bound ceiling) and **strengthens it** with a
controlled instrument + a second model family + the irreducible-noise quantification (σ≈1.06).

> **Quota note:** the Claude subscription rate cap is **burst-sensitive and recovers in ~6 min** — blasting 40
> parallel calls triggers sustained 429s → exhaustion; running at **`--global-llm=5`** stays under it and completes
> (≈220-380 s/rep). The harness has a collapse-guard (abort a dead-quota run) + a self-pacing resume waiter. The
> Gemini lane (separate quota) landed the cross-family result without waiting on Claude.

**Per-case fate of the stable FPs** (caught-fraction; 1.00 = always flagged = FP):

| FP case | baseline | strip | boundary | refute | grounded | Gemini |
|---|---|---|---|---|---|---|
| `671c8b` 1.4.5 essential-image | 1.00 | 1.00 | 1.00 | 0.80 | 1.00 | BARRIER |
| `ede992` 4.1.2 name-presence | 1.00 | 1.00 | 0.80 | 0.60 | 0.60 | BARRIER |
| `a1e9ff29` 2.4.4 table-context | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | NOT_BARRIER |
| `228c0a3` 2.4.4 equiv-purpose | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | BARRIER |
| `dc170` 1.4.3 bg-image *(deterministic)* | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | n/a |

Reads: the essential-image + equivalent-purpose FPs are **stuck at 1.00 across every method and both models agree
they're barriers** → defensible/unfixable-by-prompting. `dc170` is a **deterministic** contrast-runner FP no LLM
lever can touch → facet-routing. `ede992` (4.1.2) is the **only** FP that partially yields (→0.60) — to the levers
that emphasize "name presence ≠ quality" — confirming it is a **rubric-scope** error, best fixed by correcting the
4.1.2 obligation's question, not by a prompting method.

### R2.2b Cause of the ±3 FP instability (diagnosis)

Decomposing the full-pipeline noise (`var-run-a/b/c`: tools-ON, live, K=3, FP 14/16/10, σ≈3.06) against the
fixed-evidence replay (`fp-rep-baseline-k10`: K=10, σ=1.06):

**σ²_full = σ²_LLM + σ²_pipeline ⇒ the pipeline is ~88% of the variance** (σ_pipeline ≈ 2.87 vs σ_LLM ≈ 1.06). The
±3 is **dominantly pipeline, not the model.** (σ_full from K=3 is a wide estimate, but the direction — pipeline ≫
LLM — is robust: with evidence frozen the swing collapses to σ≈1.) Per-case over the 261 common GT-pass cases: only
**3 are noisy in BOTH** conditions (pure model sampling); **8 are noisy in the live pipeline but STABLE when the
evidence is frozen** (pipeline-caused). Tracing those 8 across the three live runs gives three concrete mechanisms:

1. **Nondeterministic CDP tool sessions (tools=ON) — verdict flips.** The LLM judges the case *every* run but on
   different live-tool evidence (`resolve_destination` network fetches, `query_ax_node`, `set_state_and_capture`),
   so its verdict flips. Concentrated in tool-dependent SCs: `afb819d4`/`ede992d9` (4.1.2), `771c36b9`/`8e6c190e`
   (2.4.4), `eb4bfbbe` (1.4.3).
2. **Timing-dependent reach-LLM disposition — verdict-COUNT flips (0↔1, 1↔2).** The same obligation is settled
   deterministically (no LLM call) in one run but *deferred to the LLM* in another, and the vision required-evidence
   gate crops a borderline element (the `aria-hidden` white-on-white `fc92e273`) in some runs but not others. Driven
   by the deterministic lane's **2-minute WALL-CLOCK budget under `pageConc=16` contention** + the vision-capture
   visibility gate. `fc92e273` (0v↔1v), `19d5c288`/`b55973d2` (1v↔2v).
3. **Independent LLM sampling (σ≈1.06)** — only the 3 genuinely-borderline cases (`cd3b3a40`, `e0d32d95`,
   `58087cbe`) flip with the evidence frozen.

**Vision RENDER is deterministic** (the three 1.4.3 contrast crops are byte-identical SHA-256 across 5 captures) —
render timing is NOT a cause; it is the capture *gate* (#2), the *tools* (#1), and the wall-clock *disposition* (#2).
**#1 and #2 are CORRELATED within a run** (shared browser / tool / contention state), so they amplify the run-level
swing far beyond what ~12 independently-flipping cases would — this is why a similar noisy-count (12 live vs 11
frozen) produces 3× the run-level σ.

**Direct no-LLM confirmation (the root cause is load/settle TIMING).** Running the full deterministic pipeline
(collect + build + vision, tools-OFF, **noop judge — zero LLM calls**) 4× at pageConc=16 and diffing the exact
inputs the LLM would see, over 319 GT-pass cases:

| signature | varies @ pages=16 | varies @ pages=1 (unstable subset) |
|---|---|---|
| **collect** (raw extraction) | **0** | 0 |
| **subjects** (target-SC reach-LLM) | 1 | 1 |
| **vision** (crop bytes) | 17 (2.4.4:11) | **10** |
| **ledger** (auto-PARTIAL disposition) | 53 (2.4.4:24, 4.1.2:16) | **23** |

- **The raw collected evidence and subject selection are deterministic.** The drift is in **vision capture** and the
  **ledger's settle-vs-defer disposition**.
- **It is TIMING, not algorithm nondeterminism.** Dropping page-concurrency 16→1 ~halves it; and a per-frame probe
  capturing one unstable 2.4.4 case's vision **in isolation ×5 is byte-identical on EVERY frame** (element-crop,
  surrounding-region, viewport, and the viewport-320 reflow). The frames don't render differently — they're
  *captured at a different moment*. Under CPU contention a page gets less CPU, so fonts/layout/reflow settle slower
  and the capture (and the instruments lane's focus/state reads → ledger flips) catch a not-yet-settled state.

**Mitigations.** *Measurement:* freeze the evidence (the replay; σ 3→1) or report multi-run medians. *Production
stability (the real fix):* a **settle-wait before capture/read** — `document.fonts.ready` + a layout/reflow-stable
check (two equal `requestAnimationFrame` layout reads) + a small floor delay — applied before vision capture AND
before the instruments/runners read state. This removes the timing-sensitivity *regardless* of concurrency. Lowering
page-concurrency only widens the settle margin (~halved it, didn't close it); cache/determinize tool results (or
score tools-off) handles the separate tools-ON component (#1). **But see R2.2d: of the two drifting capabilities,
only vision is on the FP-propagating path — the ledger drift is off-target and filtered, so the settle effort should
target vision, not the instruments/ledger.**

### R2.2d Per-capability trace — the ledger drift is INERT; vision pixel drift is the only propagating term

R2.2b counted *which* signatures drift. This goes one level deeper: for each drifting capability it examines the
actual run-to-run **outcomes** (not hashes), splitting every drift into **presence** (the item count changes — a
crop/obligation/subject appeared or vanished) vs **content** (count stable, value changed — a disposition flipped or
pixels changed), then traces each content flip to its upstream cause. Tools: `decompose-drift.js` (presence-vs-content
over the frozen `sigs.json`) and `trace-dump.js` (row-level ledger + claim-proposal/experiment/instruments trace, K
runs, no LLM). 61 unstable cases, pages=16.

| capability | presence-drift | content-drift | what the content flip *is* |
|---|---|---|---|
| **subjects** (reach-LLM, after `restrictScs`) | 1 | **0** | — (deterministic) |
| **vision** (crops) | 1 | 15 | same xpath, **different bytes** |
| **ledger** (full obligation set) | 0 | 22 | one row's **`autoPartial` 0↔1** |

Three facts collapse this to a single conclusion:

1. **Subjects are 100% deterministic.** Across ALL six configs (settle on/off, kbd on/off) there is **zero content
   drift, every config.** The set of `(sc, xpath, skill)` judgments handed to the LLM is fixed run-to-run. The one
   apparent `ebd0080b` *presence* flip was a **measurement artifact, not nondeterminism** (R2.2e/Q4): that fixture
   (`<img alt="W3C logo">`) is enrolled under three ACT rules (4.1.2-only / 1.1.1+4.1.2 / 1.1.1), so the probe — keyed
   by `testcaseId` — recorded 9 "runs" = 3 rules × 3 repeats, with an **exactly period-3** `subjN` sequence `[0,1,1]`;
   the `0` is the 4.1.2-only rule where the 1.1.1 image subject is *correctly* off-target. A clean single-rule run
   (10× at pages=16) is perfectly stable. So genuinely-propagating subject nondeterminism is **0/61, not 1/61.**

2. **The ledger drift never reaches the judge.** The 22 ledger flips are *content* (row count rock-stable, e.g.
   `33,33,33`) — a single row's `autoPartial` bit toggling. Row-level tracing (worst drifters `64994609` /
   `43730455` / `0b01e772`) shows **every flipping row is on an OFF-TARGET SC** — 2.1.1 / 1.4.3 / 2.4.7 / 3.3.2
   obligations on a 2.4.4/2.4.6 case — *never the case's own SC.* The harness filters subjects AND FP scoring to the
   on-target SC (`orchestrator.js:281-283` `restrictScs`; `run-fn-llm.js:49,190` `inScope = tc.sc`), so these flips
   are **dropped before the judge and before scoring.** The proof is fact #1: an on-target disposition flip *would*
   move `subjects`, and it never does (60/61). **The 22-case ledger drift is inert for the measured FP.**

   *Mechanism of the off-target flip:* `autoPartial:true` means *no deterministic disposition exists* for the
   obligation (`obligations.js:80`); a claim proposal that is generated-but-unbound becomes a deterministic `PARTIAL`
   (`build-v3.js:201-208`) → `autoPartial:false`, while a proposal that is **never generated** lets the obligation
   fall through to auto-PARTIAL → `autoPartial:true`. Proposals vanish *as a correlated batch* when the experiment
   lane hits its **120 s run wall-clock ceiling** under contention and **defers the tail candidates**
   (`experiments.unrun`, reason `"run wall-clock ceiling (120000ms) reached"`). The trace catches it exactly: on
   `64994609`, **run0** completed one extra experiment (`proposals=3, unrun=17`) and its 3.3.2 field-label proposal
   bound as a deterministic PARTIAL (`ap=0`); **runs1-5** deferred two more candidates (`proposals=2, unrun=19`), the
   3.3.2 proposal was never generated, and the obligation fell to auto-PARTIAL (`ap=1`). This is R2.2b's "wall-clock
   disposition" mechanism, now located precisely (experiment-lane budget deferral) and shown **off-target → filtered →
   inert.**

3. **Vision drift is the only term that *could* propagate — and the settle already kills the part that matters.** The
   15 vision flips (OFF) are *content* (crops always present, 0 presence drift), on **on-target** crops. The settle
   cuts this 15 → **4** (settle2). Pixel-diffing the residual variants (R2.2e/Q2) shows the residual is **≤4 pixels at
   exactly Δ1 grayscale (1/255), on anti-aliased edges** (input-box border / glyph edge) — i.e. **GPU sub-pixel
   rasterization LSB noise, NOT FOUT/layout.** It is sub-perceptual: an LLM cannot resolve 1/255 on 2-4 px after its
   own downsample, so it **cannot change a verdict** and contributes ~0 to the scored FP. The *meaningful* vision
   drift (FOUT/reflow) is gone: `8e6c190e` is **byte-identical even at pages=16 full-pipeline ×5** with the settle on.

**Consequence for the settle work.** Of the two drifting columns the sweep measured, only **vision** is on the
FP-propagating path, and the settle already reduces it to sub-perceptual noise (above). The **ledger** column is
off-target → filtered → does not reach the per-SC judge. So for the **per-SC FP eval**, the per-Tab keyboard settle
(C3/C4) is **unobservable** — keep the rAF capture settle, don't pay the kbd settle's ~2× wall-clock here.

*But "inert" is scoped, not universal (R2.2e/Q1):* the kbd settle stabilizes keyboard-driven signals that ARE used
outside this measurement — the off-target obligations go live in a **judge-everything** run (no `restrictScs`), and
the keyboard trap / reading-order detectors **fill** 2.1.2 / 4.1.2-focus-in-hidden / 1.3.2 obligations
(`build-v3.js:291`) and feed the offline instruments scoring. So **keep the kbd settle gated and available**
(reusable for production / a 2.1.2/1.3.2-heavy set), just off for the per-SC eval.

*If the off-target ledger drift ever needs to be killed (production):* raising the experiment-lane ceiling
**120 s → 300 s** does it cleanly (R2.2e/Q3) — `unrun` 17-19 → **0** on the heavy cases, and the off-target
`autoPartial` flips **vanish** (0 across 4 runs), at only ~+20 s/case (the deferred experiments are fast; the 120 s
ceiling was deferring them *prematurely* under contention, not because they are slow). Not needed for the per-SC eval.

### R2.2e Going below the count — per-capability *outcome* traces (four follow-ups)

R2.2d split drift into presence-vs-content. This goes to the actual outcomes. New tools in `fp-experiments/`:
`decompose-drift.js`, `trace-dump.js` (row-level ledger + claim-proposal/experiment/`unrun` trace),
`ebd-applicability-probe.js`, `vision-residual-probe.js` (full-pipeline crop capture under contention),
`per-frame-vision-probe.js` (now saves distinct PNGs), and `png-diff.js` (dependency-free PNG decoder + pixel diff).

- **Q4 — the one "applicability edge" is a probe artifact, not a bug.** `ebd0080b`'s subject "flip" is the period-3
  three-rule enrollment (above); subjects are **fully deterministic (0/61).** `decompose-drift.js` should dedupe by
  rule — the harness is correct.
- **Q2 — the residual vision drift is sub-perceptual GPU LSB noise.** `png-diff.js` over the residual variants: **2-4
  px at Δ1/255, on AA edges** (e.g. a `204×22` "Name:" input crop differs at exactly `x=201`, the box's right
  border). Even the "cold-start" first-capture variant is 4 px Δ1. **Fix attempts:** GPU-on determinism flags
  (`--force-color-profile=srgb --disable-lcd-text --disable-partial-raster --disable-skia-runtime-opts`) do **not**
  remove it; `--disable-gpu` (software raster, would be deterministic) **hangs in headless-new** here → byte-
  determinism isn't cheaply achievable. Because the residual can't change a verdict, the right move is **not** more
  render control — either accept it, or make the drift *metric* perceptual (quantize the crop hash, ignore Δ≤2 on
  <~10 px) so it stops over-counting LSB flicker. The real fix (settle, FOUT/reflow) already shipped.
- **Q1 — "inert" is scoped to the per-SC eval** (corrected above): the kbd settle stabilizes signals that go live in a
  judge-everything / 2.1.2/1.3.2 run; keep it gated and reusable.
- **Q3 — 300 s ceiling cleanly removes the off-target deferral drift** (`unrun`→0, flips→0, ~+20 s/case); optional,
  for production only.

**Net (tools-off deterministic lane):** subjects are bit-deterministic, the ledger drift is off-target/filtered, and
vision drift is reduced to verdict-irrelevant LSB noise. So with tools OFF the deterministic pipeline is **effectively
fully stable** — the live ±3 σ (R2.2b) is therefore dominated by the **tools-ON** CDP-session nondeterminism (#1) plus
the σ≈1 LLM sampling, *not* the deterministic substrate.

### R2.2f Fixes shipped + directly validated (the tools-ON #1 source)

Auditing the 10 CDP tools (`cdp-tools.js`) found the #1 instability is structural: **5 tools used a fixed blind
`setTimeout`** where vision now uses a settle, and `resolve_destination` re-fetches. Shipped + validated:

- **Blind delay → settle/quiescence wait** (5 tools): `set_state_and_capture` (220 ms), `measure_geometry_live`
  (140 ms), `render_with_overrides` (160 ms) now call `awaitSettle(live,{force,floorMs})`; `probe_screen_reader_after_action`
  (1400 ms) polls the spoken-log to quiescence; `observe_state_after_activation` (350 ms) installs a MutationObserver
  **BEFORE the click** and waits for a mutation to land + quiesce (floor 350 / quiet 250 / ceiling 2500 ms). The floor
  preserves the old lower bound (no regression); the wait extends only when the reveal is still in flight.
- **`resolve_destination` cache**: a process-level memo keyed by the fetched href → the same link resolves once
  (deterministic re-resolve; cross-process still needs evidence-pack freezing).
- **Perceptual crop-hash** (`perceptual-hash.js`, wired into the probes' vision signature; `V3_VISION_RAWHASH=1`
  reverts): 32×32 box-average + 16-level quantize so the ≤4 px Δ1 LSB flicker stops counting as drift. Probe-only —
  the LLM still receives the raw crop.

**Direct validation** (`tool-stability-probe.js`, no LLM — calls the tool functions on fixtures under contention).
The harness caught a real bug first time (a quiescence wait without a "saw-a-mutation" gate returned BEFORE a delayed
reveal — same failure as the blind delay); after the observer-before-click fix:

| check | result |
|---|---|
| `observe_state` on a 600 ms-delayed reveal — LEGACY blind 350 ms | `[0,0,0,0,0,0,0,0]` — **misses every time** |
| `observe_state` on the same reveal — NEW | `[1,1,1,1,1,1,1,1]` — **catches every time** |
| `observe_state` sync-reveal control — NEW | `[1,…]` — no regression |
| `resolve_destination` same link ×2 | 2nd `cached=true`, identical fingerprint |
| perceptual-hash: two Δ1 variants / a real change | equal hash / different hash |
| `cdp-tools.test.js` (full suite) | 27/27 pass |

`query_ax_node` / `compute_contrast_ratio` were left unchanged (already deterministic). The GPU LSB noise itself is
not "fixed" (byte-determinism isn't cheaply achievable, and it can't change a verdict) — the perceptual hash handles
it at the measurement layer.

### R2.2g Settle fixes + the controlled OFF→ON test

The no-LLM pipeline has two gated settles. Both were re-validated on a 78-case drift-bearing set (61 unstable ∪ 40
current-drifters), OFF vs ON **back-to-back same-session** (cross-session is confounded — R2.2d), K=3, pages=16.

| capability | OFF | capture settle (`V3_SETTLE_WAIT`) | `WAIT` + `KBD` |
|---|---|---|---|
| collect / subjects | 0 / 0 | 0 / 0 | 0 / 0 |
| visionRaw (exact-byte) | 5 | **3** | 4 |
| vision (perceptual) | 0 | 0 | 1 |
| ledger | 10 | 12 | **7** |

Capture settle → vision (`visionRaw 5→3`); the kbd settle → ledger (`10→7`, where capture-alone does not). Both modest
and near the K=3 noise floor (±2-3), but mechanism-consistent (capture stabilizes crops; kbd stabilizes the focus
walk's reflow-sensitive reads). The ledger it helps is off-target/filtered, so keep it gated for the per-SC eval.

**The kbd settle was BROKEN and is now fixed** (`scripts/v3/lib/settle.js` `awaitFocusSettle`; wired in `kbd-graph.js`):
- *Root cause:* it reused `awaitSettle`, whose stability signature includes `window.scrollX/Y`. Every Tab scrolls the
  newly-focused element into view, so the signature never converged — it burned the full ~1s frame cap PER TAB ×
  thousands of trap/order tabs ⇒ a single run took 33+ min.
- *Fix:* `awaitFocusSettle` watches the focused element + **reflow** (body dims / `scrollHeight`) and **excludes scroll
  position** — because `probeActive` records the focused rect as PAGE-ABSOLUTE (`r.left + scrollX`), which is scroll-
  INVARIANT, so only a focus-triggered reflow can change the read. Plus an early-return (1 frame when nothing changed),
  removal from the synchronous containment probe (`stillInside`), a tight frame cap (16 vs 60), and no fonts race.
- *Result:* **91s → 57s** on 8 cases (~2×); ledger `10→7`; kbd-graph + instruments tests pass (20 default, 8 with kbd
  on). Production default unchanged (gated `V3_SETTLE_KBD`).

`limits.js` default ceiling is now **300000** (R2.2e/Q3), overridable via `V3_ACT_RUN_WALLCLOCK_MS`.

### R2.2c Cross-model: the entire LLM lane on Gemini-3.5-flash

Swapping ONLY the judge model (same frozen evidence, same scorer, tools-OFF, 443 packs; `--provider=gemini` via the
new `makeGeminiTransport`). K=5 — and Gemini at `temperature:0` was **bit-identical across all 5 reps** (σ=0).

| Judge | Recall | FP | Precision | F1 | run-to-run σ |
|---|---|---|---|---|---|
| Claude sonnet-4-6 | 48/66 (72.7%) | **13/377 (3.4%)** | **78.7%** | **0.756** | 1.06 |
| Gemini-3.5-flash | **50/66 (75.8%)** | 27/377 (7.2%) | 64.9% | 0.699 | **0** |

**Gemini is more sensitive but much less specific** — +3pp recall for ~2× the FP (−14pp precision, −0.06 F1).
By-SC it over-flags 2.4.4 (8→12) and 1.4.3 (1.8→5) and **adds FPs in structural SCs Claude avoids** — 1.3.1 (0→3),
2.4.10 (0→1) — beating Claude only on 2.4.6 (1→0). A worse precision/recall operating point overall.

**Two takeaways:** (i) the residual is again **cross-model** — Gemini does not clear Claude's hard FPs, it adds its
own, reinforcing R2.3's "intrinsic ambiguity, not a model deficiency." (ii) Gemini's **determinism (σ=0)** removes
the σ≈1.06 model-sampling term — so that irreducible ±1 is *Claude-SDK-specific*, not inherent to LLM-judging — but
it does nothing for the *dominant* pipeline σ≈2.87 (§R2.2b), so it would not fix the ±3.

### R2.3 Conclusion

**No judge-design lever or combination achieves a clean asymmetric FP reduction.** Across **nine** distinct levers,
**one combination**, and **two model families**, every lever that cuts FP cuts recall by a comparable amount (the
grounded+strip combination was the explicit test of whether an FP-reducer's recall loss could be offset by a
recall-booster — it could not; the effects are non-additive). The levers split cleanly:

1. **Null on FP** (within the σ≈1.06 floor, no stable-FP fixed): distractor-strip, boundary-prose, decomposed
   applicability gate, majority-voting. The "prompting" levers the literature favors do not transfer — our judge
   already checks grounded structured+visual evidence, so it is not "re-solving the question" (the mechanism §4
   distractor-strip exploits), and it already has the exemptions in-rubric (so more prose / a separate gate is
   ignored). *Distractor-strip's one effect was a small **recall** gain (+2.4), not an FP cut.*
2. **Symmetric** (reduce FP ≈ proportional recall): confidence-abstain, unanimity-voting, self-refute, grounded,
   Gemini refuter. They all work by making the judge **more conservative on the ambiguous SCs** (2.4.4 link-purpose,
   2.4.6 heading-descriptiveness) — clearing the *defensible* equivalent-purpose/heading FPs while dropping real
   barriers in the same SCs at a similar rate.

**Why — the decisive triangulation:** the residual stable-FPs are **confident, systematic, and CROSS-MODEL-SHARED**.
Gemini and Claude fail on the *same* cases and **agree** that the "real-error" candidate (4.1.2 `ede992` "button/link")
is a barrier. That is the signature of **intrinsically ambiguous WCAG judgments / debatable ground truth**, not a
model error a better judge design removes. This both reconfirms round 1's noise-bound-ceiling and strengthens it
with a controlled instrument, a second model family, and σ≈1.06.

**The two things that *are* actionable (and are NOT judge-design):**
- The handful of genuine *errors* (vs defensible nuance) are **rubric-SCOPE** issues, not prompting issues — e.g.
  the 4.1.2 path flags name **descriptiveness** when 4.1.2 only requires name **presence + role match**
  (descriptiveness is 2.4.4/2.4.6). Fix = correct the obligation's question, validated on a real held-out gate.
- The 1.4.3 FPs (`dc170` bg-image, large-text-threshold) are **deterministic-facet** cases that belong to the
  contrast runner, not the LLM (route-by-facet) — already the standing direction.

**Recommendation: do NOT ship any of these nine levers as an FP reducer.** They spend latency/compute (refute &
votes 2-3×) for a recall-for-precision trade on debatable cases. Keep the current pipeline.

### R2.4 Two follow-ups (validated)

**(a) 4.1.2 name-scope sharpener — the one genuine fix ✅.** A targeted DECISION PROCEDURE (`V3_FP_412_SHARPEN`,
sc 4.1.2 only) enforcing "4.1.2 = name PRESENCE + identity, NOT descriptiveness" (steps: code-token → wrong-control
→ ARIA-legality → else PRESENT=pass). Validated K=5 on the full 4.1.2 ACT subset (142 cases) vs the K=10 baseline:
clears the `ede992` "button/link" FP **1.0→0.0 across all 5 reps** with **zero recall loss** (6/9 GT-fail caught,
identical to baseline; the prohibited-ARIA barriers `17a785ed`/`358fa0b8` are preserved by the ARIA-legality step;
the 3 missed are pre-existing systematic FNs). It works where the generic `boundary` prose failed because it is a
*procedure*, not more prose, and it **agrees with the validated ACT GT**. Caveats: a single, borderline FP (Gemini
disagreed it's clearable), and the *trustworthy held-out gate is still open* — so it stays **flag-gated**, not folded
into the production rubric, pending a better gate.

**(b) Distractor-strip as a recall lever — does NOT hold ❌.** The decision-set hint (+2.4 recall) did not survive a
full-set check. On all 66 GT-fail (K=5, vs a matched K=5 baseline): recall 48.4→49.8 (**+1.4, only 0.81σ — not
significant**), **0 FP added** (40-pass control). Stable-transition: **+3 / −3** (gains 3 stable 2.4.4 barriers,
loses a 2.4.2 + the two 4.1.2 prohibited-ARIA barriers — removing the task framing *hurts* prohibited-attr
recognition). Net ≈ 0. **Not a robust recall improvement; do not pursue.** ("Validate, don't infer" — again.)

**Deliverables of this round (reusable):** the fixed-evidence judge-replay harness (`fp-experiments/`), the
σ≈1.06 fixed-evidence noise-floor measurement + the stable-transition evaluation protocol, the cross-family Gemini
refuter, and this negative-but-robust result with proper statistics — the controlled measurement round 1 asked for.
