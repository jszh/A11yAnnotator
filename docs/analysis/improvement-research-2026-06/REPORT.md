# System-improvement research — final report (2026-06-21)

**Scope.** A fresh, adversarial search for ways to improve the v3 accessibility-evaluation harness (LLM evidence
lane over the W3C ACT corpus) across tools / prompting / harness / architecture. Every hypothesis was tested or
analytically refuted with saved evidence. Baseline HEAD `2a0ec26`; deployed config `--reaches-llm --tools`
(458 reaches-LLM cases, 66 GT-fail).

**Headline.** The biggest finding is not a fix — it is that **the eval cannot currently measure most fixes.**
Run-to-run variance is ±3 FP on a byte-identical config, and the residual errors are *confident and systematic*,
not uncertain. Every LLM-lane improvement lever I could devise — voting, confidence-gating, applicability prose,
adversarial self-critique — was **refuted**. The actionable output is a **measurement-protocol change** plus a
sharp map of where the real (sub-floor) errors live.

---

## 1. The noise floor (H1) — the central result ✅

Three **byte-identical** runs of HEAD:

| metric | a | b | c | **range** |
|---|---|---|---|---|
| TP | 51 | 51 | 49 | 2 |
| FN | 15 | 15 | 17 | 2 |
| **FP** | 14 | 16 | 10 | **6** |
| F1 | 0.779 | 0.767 | 0.784 | 0.017 |

**A single run's FP count is ±3 noise.** Every per-case fix shipped this session (±1–2 FP) is *below this floor*
— `run10` (14 FP) vs `exp17` (12 FP) was pure noise, not a regression. **Any change < ±3 FP / < 0.017 F1 is
unmeasurable by single-run comparison.** This is the methodological core: the ACT aggregate has stopped being
an instrument for changes of the size we can actually make.

Error decomposes (per-case stability over the 3 runs): **416 stable-correct / 21 stable-WRONG / 16 NOISY.**
2.4.4 (link-purpose / equivalent-purpose) is the noise epicenter (8 of 16 flips).

## 2. Every LLM-lane improvement lever — refuted

| # | Lever (category) | Result | Why |
|---|---|---|---|
| H1b | K-sample majority **voting** (architecture) | ❌ refuted for accuracy | F1 0.7786 vs 0.7765 single-run avg (+0.002, within rounding). Systematic errors stay wrong; noisy errors are coin-flips. Voting only stabilizes *measurement*, not accuracy. |
| H5 | **Confidence-gated** barrier (prompting) | ❌ refuted | FPs are HIGH-confidence (11/14). The LLM is confidently wrong → confidence can't separate FP from TP. |
| H6 | **Applicability-first prose** (prompting) | ❌ refuted | The rubrics ALREADY carry the exemptions (1.1.1 decorative gate; 1.4.5 logo/essential). FPs happen despite them — the LLM ignores present clauses; more prose won't fix that. |
| H7 | **Adversarial self-critique** (prompting/architecture) | ❌ refuted | A skeptic re-pass is itself a noisy LLM call: it applied exemptions only INCONSISTENTLY (cleared `ec2a7a47` once, not on re-run) and cost real TPs even when scoped to applicability SCs (lost a 1.4.3 barrier). Stacking judgments adds noise. |

The through-line: **the LLM lane is noise-bound, and the residual precision errors are confident-systematic.**
No amount of re-prompting / re-sampling the *same* lane escapes that — it is a property of the model's judgment
on these hard, often GT-nuanced cases, plus irreducible sampling variance.

## 3. Where the real errors actually are (decomposition)

The 21 **stable** (reproducible) errors = **14 FN + 7 FP**. The single-run FP count (~14) is HALF noise; the
true reproducible precision error is **7 FP**.

- **14 systematic FN (recall) — the larger problem, untouched by any lever here:** 2.1.2 ×3, 4.1.2 ×3, 1.1.1 ×3,
  1.4.5 ×2, 2.4.4 ×2, 2.4.2 ×1. These are *consistently missed barriers* — an evidence-provisioning / discovery
  problem (overlaps DEFERRED-TODO **item B**, the screenshot+LLM triage lane). The H7 critic would WORSEN this.
- **7 systematic FP (precision):** ~4 applicability (1.1.1 SVG-decorative ×2, 1.4.3 non-language, 1.4.5
  image-of-text-essential), ~2 reasoning (2.4.4 table-context + equivalent-purpose), 1 perceptual (1.4.3 bg-image).
- **The raw FP count overstates harness error.** Several "FPs" are defensible GT-nuance: text-shadow (fixed this
  session), 4.44-boundary rounding, non-language symbols, equivalent-purpose links. The harness is sometimes
  *more* WCAG-correct than the lenient ACT GT.

## 4. Deferred-todo cross-check

- **Confirms my findings:** item E (1.3.1/2.4.10 page-structure sensitivity) is exactly the structural SCs the H7
  critic over-refuted (`664972fe`/1.3.1, `7505d097`/2.4.10) — independent confirmation that a skeptic must never
  touch structural barriers. The routing-backlog "deterministic pixel-contrast runner" already EXISTS and works
  (7/26 1.4.3 disposed deterministically; only 2 reach the LLM).
- **My findings are largely NEW vs the backlog:** the noise floor, voting/critic refutations, and the
  systematic-vs-noise decomposition are not in the deferred todos (which are discovery/recall/structural lanes).
- **The one overlap worth a future round:** the 14 systematic FN ↔ item B (discovery lane). That is a *recall*
  experiment, out of scope for this FP-focused study, and is a LARGE new lane (correctly deferred).

## 5. Recommendations (evidence-based)

1. **ADOPT a noise-floor-aware comparison protocol (highest value).** Stop reporting single-run FP/F1 for changes
   < ±3 FP. Report **≥3-run medians + range**, or evaluate per-case stability (caught-in-k-of-n). This is the only
   way to honestly measure the per-case fixes that DO work (component A, shadow calc). Cheap: the harness already
   supports `--out`; add a 3-run wrapper + the `analyze-variance.js` decomposition.
2. **DO NOT pursue** voting-for-accuracy, confidence-gating, applicability prose, or an adversarial critic — all
   refuted with evidence. They spend compute/complexity for no measurable gain.
3. **Per-case precision fixes belong on the held-out corpus, not the ACT aggregate.** The 7 stable FPs are real
   but sub-floor; validate any fix on `eval/act-augmented/` (the corpus the harness was never tuned on), where the
   noise/overfit confound is broken.
4. **The bigger systematic problem is RECALL (14 FN), not precision.** If effort is spent, the discovery/evidence
   lane (item B) targets the larger systematic error — but as a recall study with its own held-out gate.

## 6. Evidence index (`docs/analysis/improvement-research-2026-06/`)
- `HYPOTHESES.md` — full hypothesis log with status.
- `analyze-variance.js`, `analyze-critic.js` — reproducible analysis scripts.
- `evidence/H1-variance-results.txt`, `H1-variance-interpretation.md` — the noise floor + voting sim.
- `evidence/H5-confidence-refuted.md` — confident-FP evidence.
- `evidence/Hmeta-FP-decomposition.md` — the 14 single-run FPs categorized.
- `evidence/systematic-error-decomposition.md` — 14 FN + 7 FP stable errors.
- `evidence/H7-critic-interpretation.md` — critic refutation + the predict-then-validate lesson.
- Runs: `results/var-run-{a,b,c}` (baselines), `results/exp27-critic` (broad critic), `results/exp28/29` (scoped).

## 7. One-line conclusion
The harness's LLM lane is at a **noise-bound ceiling on the ACT corpus**; the highest-leverage improvement is not
a new lever but a **measurement protocol that can see sub-noise changes**, and the largest residual error is
**recall (missed barriers), not the false-positives** this session chased.
