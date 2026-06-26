# System-improvement research — hypothesis log (2026-06)

Baseline: HEAD `2a0ec26`. Deployed config = `--reaches-llm --tools` (458 reaches-LLM cases; 66 GT-fail).
Standing context from this session: per-case FP fixes work but (a) overfit on the synthetic ACT corpus and
(b) are swamped by LLM run-to-run noise (±2–3 cases). Run10 = R 78.8 / P 78.8 / F1 0.788 / 14 FP.

## Architecture facts established (exploration)
- **Temperature/top_p/seed are NEVER set** — the LLM lane runs at model/SDK defaults (llm-agent-adapter.js:98,190).
  Variance is unmanaged. Tools path uses `effort` (SDK), not temperature.
- **No multi-sample/voting exists** — 1 subject = 1 call = 1 verdict. Clean voting seam at
  llm-adjudicator.js:620–641 (agent) / 768–790 (rubric).
- **Tool-call decisions are stochastic** (model decides whether to call compute_contrast_ratio vs eyeball).
- **Deterministic contrast runner IS active** (text-contrast-pixel): 7/26 1.4.3 cases disposed deterministically,
  only 2 reach the LLM. Flat-bg contrast is NOT the noise source.
- **Deterministic CLAIM always wins** over an LLM barrier (build-v3.js:495) — disposing facets deterministically
  removes LLM noise.
- **Scorer has NO tolerance band** — binary; an LLM LIKELY_BARRIER on GT-pass = FP (run-fn-llm.js:189–257).

## Hypotheses

### H1 — Run-to-run variance is significant (FOUNDATIONAL) · CONFIRMED ✅
3 identical HEAD runs: **FP swings 10–16 (range 6) across byte-identical runs**, F1 range 0.017. A single run's
FP is ±3 NOISE — every small fix this session was below the floor. Error decomposes into 416 stable-correct /
**21 systematic (stable-wrong)** / **16 noisy (flips)**; 2.4.4 is the noise epicenter (8/16). This is the
top methodological finding: single-run comparisons of small changes are unreliable. Evidence: H1-variance-*.

### H1b — K-sample majority voting · REFUTED for accuracy ❌
K=3 majority = F1 0.7786 vs single-run avg 0.7765 (+0.002, within rounding). Systematic errors stay wrong
(majority wrong); noisy errors are ~50/50 (majority ≈ coin flip). Voting's ONLY value is variance reduction for
MEASUREMENT, not accuracy — don't spend K× compute for accuracy. The accuracy lever must target the 21
systematic errors → H7.

### H5 — Confidence-gated barrier · REFUTED ❌
FPs are HIGH-confidence (run10: 11/14 high). The LLM is confidently wrong. Confidence does not separate FP
from TP → a confidence gate removes ~0 FPs. Evidence: evidence/H5-confidence-refuted.md. Implication: the
residual FPs are SYSTEMATIC reasoning/applicability errors, not uncertainty.

### H6 — Applicability-first prompting (MORE prose) · PARTIALLY REFUTED ❌
KEY FINDING: the rubrics ALREADY carry the applicability clauses — alt-text-adequacy-v0:17–30 has a full
decorative / removed-from-tree gate ("a genuinely DECORATIVE image ... NOT a barrier"); images-of-text-v0:21–23
has the logo/ESSENTIAL exemption. The Class-B FPs happened DESPITE these clauses. So the failure is the LLM
CONFIDENTLY IGNORING a present exemption, not a missing instruction → adding more applicability prose is unlikely
to fix it. The ONE genuine gap is 1.4.3 (no human-language clause) → see H9.

### H7 — Adversarial self-critique / forced exemption re-check · ELEVATED (top prompting candidate)
Since (H5) FPs are confident AND (H6) the exemptions are PRESENT-but-ignored, a dedicated SECOND skeptic pass —
"a barrier was flagged; now rigorously apply every applicability exemption + equivalent-purpose/context
consideration; default to refute if a reasonable exemption holds" — FORCES re-application of the clause the
first pass skipped. Targets confident systematic FPs (decorative SVG, image-of-text-essential, equivalent-purpose
links). Risk: refutes real barriers → FN. Test = refutation ASYMMETRY (FP-refuted >> TP-refuted). Costs +1 call
per flagged case only.

### H7 — Adversarial self-critique pass · CANDIDATE
Complement to H5: a SECOND skeptic pass prompted to REFUTE a flagged barrier (find every applicability/exemption
reason it's OK). Targets confident FPs the first pass misses. Risk: refutes real barriers → FN. Test =
refutation ASYMMETRY (refutes FP >> TP). Overlaps H6 (both inject exemption-checking).

### H9 — Human-language applicability gate (1.4.3) · CANDIDATE (narrow)
WCAG "text" = human-language characters. Gate the text-contrast obligation off pure non-language symbol runs
(oracle factHasText, applicability-oracle.js:102/135). Fixes 2845a840. Risk: mis-classify legit symbol labels.

### H10 — resolve_destination corpus-mismatch fix (2.4.4) · CANDIDATE (narrow)
fd3a94 same-name-diff-dest FPs: the tool can't fetch saved-fixture destinations. A corpus-aware resolver
(hrefs/saved pages) would let the LLM see real destinations. Narrow, corpus-specific.

### H-meta — FP decomposition: harness-error vs applicability-gap vs GT-nuance · ANALYSIS
The raw FP count overstates harness error. The 14 run10 FPs split into (a) context-blind reasoning, (b)
applicability gaps, (c) GT/tool nuances the harness handles defensibly (shadow [fixed], boundary). Decomposing
this is a contribution: the TRUE harness-error rate < raw FP rate.

## Out-of-frame (deliberately): per-case evidence signals (component-B style) — overfitting risk too high
per the held-out discussion; only pursue under the act-augmented held-out corpus.
