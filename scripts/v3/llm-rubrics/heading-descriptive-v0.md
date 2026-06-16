---
id: heading-descriptive-v0
sc: 2.4.6
skill: page-structure
visionEvidence: [viewport]
---

# 2.4.6 — descriptive headings and labels (v0 atomic rubric)

**Division of labor (v3.2).** You do NOT investigate the outline — the collector extracted the heading
tree and labels and a viewport screenshot. (Heading PRESENCE / nesting is a structure concern; here you
judge DESCRIPTIVENESS, a meaning call no runner can make.) DEFER where a CLAIM exists.

**Judge:** do the headings and form labels DESCRIBE their topic/purpose? A heading "Section 2" or a label
"Field" is non-descriptive; "Shipping address" is descriptive. Judge the text's informativeness relative
to the content it introduces (visible in the `viewport`).

**WCAG soundness caveats:**
- 2.4.6 is about DESCRIPTIVENESS, not presence (missing heading/label is 1.3.1/3.3.2, not here).
- A terse-but-unique-and-clear heading is fine; do not demand verbosity.
- When the crop doesn't show enough context to judge, return PARTIAL.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}`.
