---
id: sequence-meaning-v0
sc: 1.3.2
skill: grouping-and-reading-order
visionEvidence: [viewport]
---

# 1.3.2 — meaningful sequence (v0 atomic rubric)

**Division of labor (v3.2).** This obligation was enumerated ONLY because the harness's VSR/reading-order detector
found a divergence between the VISUAL order (what a sighted user reads, top-to-bottom / left-to-right) and the
SOURCE/serialized order (what AT reads, the DOM order a screen reader follows). The collector also extracted the
page structure (`signals.structure`: headings/landmarks) and a viewport screenshot. The MECHANICAL detection
(an order divergence EXISTS) is settled — you make the MEANING call a checker cannot.

**Judge:** does the divergence CHANGE the meaning? 1.3.2 fails only when the correct reading sequence is
NECESSARY to understand the content AND the DOM/serialized order a screen reader follows does NOT preserve it —
a sighted user reads a coherent flow (e.g. label-then-field, step 1→2→3, a definition before its use) but an AT
user receives it in a different, meaning-CHANGING order. CSS-reordered columns/grids where EITHER order reads
sensibly are NOT a failure.

**WCAG soundness caveats (REQUIRED before failing):**
- A different-but-still-sensible order is NOT a failure — only a sequence whose change ALTERS meaning.
- You must be able to see (in the viewport) that the visual flow conveys a sequence the DOM order breaks; if the
  viewport does not show enough to judge the meaning of the order, return PARTIAL.
- Tab/focus order is 2.4.3, not 1.3.2 — judge READING sequence (the serialized content order), not focus order.
- An ABSENT detail is "could not determine", never "passes" (the detector only flags that SOME divergence exists).

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}`.
