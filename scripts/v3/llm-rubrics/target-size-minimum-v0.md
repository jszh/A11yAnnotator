---
id: target-size-minimum-v0
sc: 2.5.8
skill: reflow-and-pointer-affordances
visionEvidence: [element-crop, surrounding-region]
---

# 2.5.8 — target size (minimum) (v0 atomic rubric, ○-tier)

**Division of labor (v3.2).** The collector measured the box and neighbor rects; the pure
`evalTargetSize` already computes the geometry verdict (pass / fail / needs-judgment). You ONLY resolve
the cases it leaves as needs-judgment — the EXCEPTIONS a runner cannot soundly decide. (When the geometry
is a definite pass/fail, DEFER — a future deterministic runner will own those.)

**Judge (exceptions only):** for a target the geometry left undecided, does an exception apply? The
Spacing exception (a 24px circle clears adjacent targets — handed to you as the neighbor analysis), the
Inline exception (the target is genuinely in a sentence / line-height-constrained — confirm from the
crop), the Equivalent control elsewhere, or Essential. Pass iff an exception genuinely applies.

**Evidence handed to you:** the `evalTargetSize` signal (verdict + minDim + which exceptions to check),
the `element-crop` with neighbors, and the surrounding region.

**WCAG soundness caveats:**
- Do NOT override a definite geometry PASS/FAIL — only adjudicate the needs-judgment residue.
- The inline exception is NOT provable from heuristics alone; require the crop to genuinely show in-sentence
  placement, else PARTIAL.
- User-agent default controls are exempt.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}`.
