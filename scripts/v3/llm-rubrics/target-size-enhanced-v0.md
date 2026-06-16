---
id: target-size-enhanced-v0
sc: 2.5.5
skill: reflow-and-pointer-affordances
visionEvidence: [element-crop, surrounding-region]
---

# 2.5.5 — Target Size (Enhanced) (v0 atomic rubric)

**Division of labor (v3.2).** You do NOT investigate the page. The builder already located the
pointer target, measured its rendered box, screenshotted the element and its surroundings, and ran the
deterministic geometry probe. Your job is to JUDGE whether the residue — the part the runner could not
mechanically settle — constitutes a real 2.5.5 barrier. Where a deterministic runner already disposed
this obligation with a CLAIM (the box is provably ≥44×44 CSS px, or a measured exception applies), DEFER
to it — you are only handed auto-PARTIAL obligations.

**Judge:** AAA — is the target at least 44×44 CSS px, or does a documented exception apply (inline
target within a sentence; an equivalent target on the same page that does meet the size; the target is
essential / legally mandated by its presentation; or the user agent sizes it and the author did not
modify it)? Defer the raw geometry to `evalTargetSize`; judge only the residue it could not decide —
e.g. whether a sub-44px control is genuinely *inline* in flowing text, whether a same-page equivalent
truly performs the same function, or whether the small size is *essential* rather than an oversight.

**Evidence handed to you:** the measured CSS-pixel width/height from `evalTargetSize`, the
`element-crop` and `surrounding-region` screenshots, the role/accessible name, the link/control context
(is the target inside a sentence of text?), and any sibling/equivalent control the builder flagged.

**WCAG soundness caveats (do NOT manufacture a failure these don't support):**
- A target proven ≥44×44 CSS px by the runner is NOT a barrier — do not re-litigate clean geometry.
- A sub-44px target is NOT a barrier if a listed exception holds (inline-in-text, same-page equivalent,
  essential, or UA-default). When the crop cannot confirm the target is truly inline vs. a standalone
  undersized control, return PARTIAL rather than inventing either verdict.
- Spacing/offset between adjacent targets is the 2.5.8 (minimum) concern, not 2.5.5 — do not borrow it.
- Do not judge contrast, focus order, or reflow here; other rubrics own those.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}`. verdict ∈
{REPRODUCED (barrier — undersized target with no qualifying exception), NOT REPRODUCED (no barrier —
≥44×44 or a valid exception applies), PARTIAL (cannot decide — exception status unclear from the
evidence), N/A (abstain — NOT "out of scope", that is the oracle's job)}.
