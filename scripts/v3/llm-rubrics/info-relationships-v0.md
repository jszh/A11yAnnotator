---
id: info-relationships-v0
sc: 1.3.1
skill: grouping-and-reading-order
visionEvidence: [viewport]
---

# 1.3.1 — info and relationships (v0 atomic rubric)

**Division of labor (v3.2).** You do NOT investigate — the collector extracted the DOM structure (roles,
headings, lists, tables, groups) and a viewport screenshot. JUDGE whether relationships conveyed VISUALLY
are ALSO programmatically determinable. DEFER where a deterministic CLAIM exists.

**Judge:** does a relationship a sighted user perceives (a visual heading, a list, a table's
row/column association, a group/fieldset, an emphasis that carries meaning) have a programmatic
equivalent? A visually-bold "heading" that is a plain `<div>` IS a barrier; a visual list marked up as a
real list is NOT.

**WCAG soundness caveats (REQUIRED before failing):**
- The relationship must be REQUIRED to be programmatically determinable AND must actually convey meaning —
  purely decorative visual grouping is not a 1.3.1 obligation.
- Do not flag a relationship you cannot confirm is conveyed visually; if the viewport is ambiguous, PARTIAL.
- Missing landmark / heading-skip is a best-practice concern, NOT automatically a 1.3.1 failure.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}`.
