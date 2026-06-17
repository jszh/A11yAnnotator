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
to the content it introduces (visible in the `viewport`). Two failure modes:
- **Vague / generic:** "Section 2", "More", "Untitled", "Field" — says nothing about the topic.
- **Specific but MISMATCHED:** a heading that reads as a clear topic in isolation but does NOT describe the
  content it actually labels — e.g. a heading "Weather" over a paragraph about the shop's opening hours, or
  "Pricing" over a block of testimonials. Descriptiveness is judged RELATIVE TO THE CONTENT the heading
  introduces (visible in the `viewport`), not the heading's standalone plausibility. A heading that
  misdirects the reader about what follows IS a barrier (ACT b49b2e). Read the content beneath/beside the
  heading and confirm the heading actually announces it.

**WCAG soundness caveats:**
- 2.4.6 is about DESCRIPTIVENESS, not presence (missing heading/label is 1.3.1/3.3.2, not here).
- A terse-but-unique-and-clear heading is fine; do not demand verbosity.
- The MISMATCH call REQUIRES seeing the introduced content: if the `viewport` does not show enough of the
  content under the heading to judge whether it matches, return PARTIAL — do not infer a mismatch from the
  heading text alone.
- When the crop doesn't show enough context to judge, return PARTIAL.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}`.
