---
id: focus-visible-clear-v0
sc: 2.4.7
skill: focus-visibility
visionEvidence: [state-before, state-after]
---

# 2.4.7 — focus-visible clear (v0 atomic rubric)

**Division of labor (v3.2).** You do NOT investigate the page. The builder already drove the element
into the focused state, captured the unfocused and focused screenshots, and ran the deterministic probe
for any focus-indicator CLAIM it can soundly compute. Your job is to JUDGE whether the focus indicator is
ADEQUATE — the CLEAR direction the runner cannot soundly produce. Where a deterministic CLAIM already
disposed this obligation, DEFER — the builder hands you only the auto-PARTIAL obligations.

**Judge:** is the focus indicator ADEQUATE — when this element receives keyboard focus, can a sighted
keyboard user actually tell *which* element is focused? Not "is there any computed outline" (that is
mechanical, and the runner owns it) but "does the visible change between `state-before` and
`state-after` clearly and unambiguously mark the focused element?" A perceivable, sufficiently distinct
indicator (outline, ring, border, background, or other clear visual delta on the focused control) is NOT
a barrier. No visible change, an indicator hidden behind/clipped by another element, or a change so faint
or ambiguous that the focused element is indistinguishable IS a barrier.

**Evidence handed to you:** the `state-before` (unfocused) and `state-after` (focused) screenshots of the
element and its immediate surroundings, the element's role/label, and any deterministic indicator CLAIM
the probe could compute (e.g. computed outline/box metrics) — handed only as context, since this
obligation reached you precisely because that CLAIM was auto-PARTIAL.

**WCAG soundness caveats (do NOT manufacture a failure these don't support):**
- A visible focus delta exists between before/after, even if styled unconventionally (custom ring,
  background shift, underline) — that is NOT a barrier; do not insist on a default browser outline.
- The runner already reports the *presence* of a computed indicator; do not re-litigate a clear
  present-indicator case as failing just because the metric is small — judge perceivability from the
  pixels, and when the two states are visually inconclusive (compression, overlap, off-element capture),
  return PARTIAL rather than guessing.
- Do not judge contrast ratios, hit-target size, or whether focus *order* is correct here; other rubrics
  own those.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}`. verdict ∈
{REPRODUCED (barrier — indicator inadequate/absent), NOT REPRODUCED (no barrier — indicator clear),
PARTIAL (cannot decide from the handed states), N/A (abstain — NOT "out of scope", that is the oracle's
job)}.
