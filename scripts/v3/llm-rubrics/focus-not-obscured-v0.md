---
id: focus-not-obscured-v0
sc: 2.4.11
skill: focus-management
visionEvidence: [state-after]
---

# 2.4.11 — focus not obscured (v0 atomic rubric)

**Division of labor (v3.2).** You do NOT investigate the page. The builder already drove focus to the
element, captured the focused (`state-after`) screenshot, and resolved any layout/geometry that a
deterministic CLAIM can settle. Your job is to JUDGE over the handed evidence whether the focused
element is at least partially visible. Where a deterministic runner already disposed this obligation
(it produced a geometry CLAIM proving full visibility or full occlusion), DEFER — the builder hands you
only the auto-PARTIAL obligations that geometry alone could not settle.

**Judge:** when the element is focused, is it at least PARTIALLY *not* hidden by author-created content
(a sticky/fixed header, a footer bar, a cookie banner, a non-modal overlay)? SC 2.4.11 (Minimum) is
satisfied as long as *some* part of the focused element is visible — full visibility is 2.4.12, not
yours. If a sticky header/overlay covers the focused element ENTIRELY so no part shows, that IS a
barrier. If any portion (including its focus indicator's bounding region) remains visible, it is NOT a
barrier. Content the USER can dismiss/move (and chose to leave open) does not count as author-obscuring.

**Evidence handed to you:** the focused (`state-after`) screenshot showing the element in its focused
state, the element's location, and the identity of any author content (sticky header/overlay) overlapping it.

**WCAG soundness caveats (do NOT manufacture a false clear or a false barrier):**
- Partial visibility = PASS for 2.4.11. Do not flag an element that is merely *clipped* but still partly shown.
- A user-dismissable overlay the user left open is not an author obstruction — do not flag it.
- If the `state-after` crop is inconclusive about whether ANY part shows (ambiguous overlap, off-screen, indicator unclear), return PARTIAL — do not guess.
- Do not judge contrast, focus-indicator thickness, or scroll-into-view here; other rubrics own those.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}`. verdict ∈
{REPRODUCED (barrier — focused element fully obscured by author content), NOT REPRODUCED (no barrier —
at least partially visible), PARTIAL (cannot decide from the handed evidence), N/A (abstain — NOT "out
of scope", that is the oracle's job)}.
