# H5 (confidence-gated barrier) — REFUTED

Hypothesis: FPs are low-confidence, TPs high-confidence → gate barriers on HIGH confidence to cut FPs cheaply.

Evidence (run10-deployed-current, barrier-verdict confidence):
- FP (GT-pass, flagged): {low:0, medium:2, high:11, none:1}  → 11/14 HIGH confidence
- TP (GT-fail, caught):  {low:0, medium:0, high:42, none:10}

Conclusion: FPs are CONFIDENTLY WRONG. Confidence does NOT separate FP from TP, so a confidence gate
removes ~0 FPs. The residual FPs are SYSTEMATIC reasoning/applicability errors (SVG-decorative, non-language
symbol contrast, link-purpose), not uncertainty. Levers must target reasoning/applicability or run-variance,
NOT confidence.
