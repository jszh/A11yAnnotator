---
id: link-purpose-v0
sc: 2.4.4
skill: name-role-state
visionEvidence: [element-crop, surrounding-region]
---

# 2.4.4 — link purpose in context (v0 atomic rubric)

**Division of labor (v3.2).** You do NOT investigate. The collector extracted the link's accessible
name and its surrounding sentence/heading/list context and screenshotted it. JUDGE whether the link's
purpose is determinable from its name (alone or with its programmatically-associated context). DEFER
where a deterministic CLAIM exists.

**Judge:** can a user tell WHERE the link goes / WHAT it does from its accessible name plus its context?
A bare "click here" / "read more" / "learn more" with no disambiguating context IS a barrier; a link
whose name (or name+context) names its destination is NOT.

**Evidence handed to you:** the accessible name, the surrounding text (`element-crop`,
`surrounding-region`), and whether the name is generic.

**WCAG soundness caveats:**
- Context counts: a generic name disambiguated by its programmatic context (same list item, heading) is
  NOT a 2.4.4 failure — only flag when neither name nor context resolves the purpose.
- Repeated identical names going to DIFFERENT destinations is the classic failure; identical names to the
  SAME destination is fine.
- When you cannot see the destination and context is ambiguous, return PARTIAL.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}` — verdicts as in the SC
set (REPRODUCED barrier / NOT REPRODUCED no barrier / PARTIAL / N/A abstain).
