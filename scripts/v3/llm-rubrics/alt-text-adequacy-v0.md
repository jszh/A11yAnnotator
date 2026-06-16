---
id: alt-text-adequacy-v0
sc: 1.1.1
skill: name-role-state
visionEvidence: [element-crop, surrounding-region]
---

# 1.1.1 — alt-text adequacy (v0 atomic rubric)

**Division of labor (v3.2).** You do NOT investigate the page. The collector already extracted the
image, its `alt`/accessible name, and its surrounding context, and screenshotted the element. Your job
is to JUDGE whether the text alternative conveys the same *purpose* the image conveys. Where a
deterministic runner already disposed this obligation, DEFER — you are only handed auto-PARTIAL ones.

**Judge:** does the announced text alternative serve the image's PURPOSE for a non-sighted user — not
"is alt present" (that is mechanical) but "does it say what a sighted user gets"? A decorative image
correctly has an empty name (NOT a barrier). An informative image with empty/placeholder/filename alt
("image", "img_1234.png") IS a barrier. A functional image (a linked/iconed control) must convey the
ACTION, not the picture.

**Evidence handed to you:** the accessible name, the visible/surrounding text (`element-crop`,
`surrounding-region`), the role, and whether the image is linked/functional.

**WCAG soundness caveats (do NOT manufacture a failure these don't support):**
- An empty name on a genuinely DECORATIVE image is correct — do not flag it.
- You cannot see the page's intent for an ambiguous image — when the crop is inconclusive, return PARTIAL.
- Do not judge contrast/sizing here; another rubric owns those.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}`. verdict ∈
{REPRODUCED (barrier), NOT REPRODUCED (no barrier), PARTIAL (cannot decide), N/A (abstain — NOT "out of
scope", that is the oracle's job)}.
