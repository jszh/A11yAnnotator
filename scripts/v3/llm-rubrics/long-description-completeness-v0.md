---
id: long-description-completeness-v0
sc: 1.1.1
skill: name-role-state
visionEvidence: [element-crop, surrounding-region]
---

# 1.1.1 — long-description completeness (v0 atomic rubric)

**Division of labor (v3.2).** You do NOT investigate the page. The collector extracted the COMPLEX image
(chart, diagram, graph, map, infographic, schematic), its text alternative (alt + any long description via
`aria-describedby`, an adjacent caption, or an associated long-text region), and the surrounding context,
and screenshotted the element. This rubric is DISTINCT from alt-text-adequacy-v0: that one judges whether a
SHORT alt is adequate; THIS one judges whether a complex image's text alternative conveys the EQUIVALENT
information — the data/structure/relationships the image carries (ARIA15/G92, with F67 for the
missing-long-description case). Where a deterministic CLAIM already disposed this obligation, DEFER; you are
handed only auto-PARTIAL ones.

**Judge:** for an image whose content is information-rich (a chart's trend and values, a diagram's parts and
their relationships, a map's regions, an infographic's argument), does the text alternative convey the
SAME information a sighted user extracts — not just a label, but the substance? Failure modes:
- **Short alt where a long description is needed (F67):** a complex data image given only a brief alt ("bar
  chart", "sales graph", "diagram") that names the image but omits the data/relationships it conveys, with
  no long description anywhere ⇒ barrier.
- **Long description present but INCOMPLETE/inaccurate:** a long description exists but omits material
  information the image shows (the trend without the values, some series but not others, the diagram's boxes
  but not how they connect), or states something the pixels contradict ⇒ barrier.
NOT a barrier: a complex image whose alt/long-description together convey the equivalent information (or
whose data is ALSO presented in an adjacent accessible table/text that serves as the long description).

**Evidence handed to you:** the text alternative (short alt AND any long description / caption / associated
text region), the `element-crop` (the image's RENDERED pixels — the actual chart/diagram) and the
`surrounding-region` (so you can spot an adjacent data table or caption that serves as the long
description), the role, and whether the image is informative vs decorative. Compare the description's
substance to what the pixels actually show.

**Interpreting the deterministic evidence (and why it is uncertain):** this obligation reached you BECAUSE
the deterministic lane could confirm an image and an alt EXIST but cannot judge EQUIVALENCE — whether the
words carry the information in the pixels. A signal like "complex image; long-description completeness not
determinable mechanically" (or simply "alt present, long description absent for a data image") is the
equivalence question delegated to you, not a clearance. CRITICAL invariant: ABSENCE OF A DETERMINISTIC
FINDING IS NOT A PASS. "alt is present" is a PRESENCE result, not a completeness result — a present-but-thin
alt on a rich chart is exactly the barrier. So never read "alt exists / no checker finding" as "the
information is conveyed"; read the chart/diagram in the crop and ask whether the text carries its substance.
If the crop is blank/unrendered or too low-resolution to read the data, return PARTIAL.

**WCAG soundness caveats (do NOT manufacture a failure these don't support):**
- This owns COMPLEX images (data/structure-bearing). A simple informative image is alt-text-adequacy-v0's
  job — do not demand a long description for an image that a short alt fully covers; prefer N/A there.
- The long description need not live in `alt` — an `aria-describedby` target, a caption, a `<details>`, or
  an adjacent accessible data table all satisfy the equivalent-information requirement. Look in the
  `surrounding-region` before flagging a missing long description.
- Equivalent does NOT mean exhaustive pixel-by-pixel transcription — it means the information and
  relationships a sighted user gets. Do not flag a faithful summary for omitting decorative detail.
- A genuinely decorative/redundant complex image (the same data given in text right beside it) is not a
  barrier — judge whether the information reaches a non-sighted user at all, by any path.
- When the crop cannot be read (unrendered, 404'd, too small to resolve the data), return PARTIAL rather
  than guessing.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}` — summary = ONE sentence
stating the verdict; reasoning = ONE sentence giving the basis. verdict ∈ {REPRODUCED (barrier — the
complex image's text alternative does not convey the equivalent information), NOT REPRODUCED (no barrier —
the information is conveyed by alt/long description/adjacent text), PARTIAL (cannot decide from the handed
crops), N/A (abstain — NOT "out of scope", that is the oracle's job)}.
