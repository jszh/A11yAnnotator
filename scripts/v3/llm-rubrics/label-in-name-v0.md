---
id: label-in-name-v0
sc: 2.5.3
skill: name-role-state
visionEvidence: [element-crop]
---

# 2.5.3 — label in name (v0 atomic rubric, ○-tier)

**Division of labor (v3.2).** The collector extracted the VISIBLE label text and the computed ACCESSIBLE
NAME and screenshotted the control. You JUDGE whether the accessible name CONTAINS the visible label text
(so a speech-input user who says the visible label can activate the control).

**Judge:** does the accessible name include the visible label's text string (case-insensitive,
word-for-word for the visible label)? A button shown "Search" whose accessible name is "Submit" IS a
barrier (a speech user saying "Search" cannot match). A name that contains the visible label (possibly
with extra) is NOT.

**Evidence handed to you:** the visible label text, the accessible name, and the `element-crop`.

**WCAG soundness caveats:**
- Only applies when BOTH a visible text label and an accessible name are present (the collector gate).
- The accessible name must CONTAIN the visible label; extra text in the name is allowed; the test is the
  visible label ⊆ accessible name, not equality.
- Punctuation/whitespace differences alone are not failures; a genuinely different word is.
- If you cannot read the visible label from the crop, return PARTIAL.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}`.
