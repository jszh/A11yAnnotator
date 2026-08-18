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
  but not how they connect), or states something the pixels contradict ⇒ barrier. Decided ONLY by the
  enumerate-and-cite procedure below — never by a holistic "fully conveys" impression.
NOT a barrier: a complex image whose alt/long-description together convey the equivalent information (or
whose data is ALSO presented in an adjacent accessible table/text that serves as the long description).

**HOW TO DECIDE COMPLETENESS — enumerate and CITE.** A single holistic completeness impression is
unreliable; work these four steps instead:
1. **Enumerate** the discrete facts a sighted reader can extract from the crop — the categories/series
   shown, the connections/relationships between parts (what joins to what, what depends on what), the named
   values/labels, any legend or key distinctions. A bounded, concrete list: each entry one checkable fact.
   **For a RELATIONAL image the relation set is a mandatory category.** When the image is a chart, diagram,
   map or graph whose purpose includes relations — a food-web's who-eats-whom, or any diagram whose
   meaning lives in which named parts connect to which — enumerate the individual
   connections as facts in their own right, separate from the entities they join. An enumeration that lists
   the entities but none of the links between them has under-enumerated, and a description with the same gap
   omits a MATERIAL fact: for such an image, who-connects-to-whom is the reason the image exists, so a text
   alternative that names every entity while omitting the relations is incomplete.
2. **For EACH fact, quote or mark ABSENT.** Either quote the exact substring of the provided text
   alternative (alt + long description + caption/associated text) that carries the fact, or mark the fact
   ABSENT. A paraphrase carries a fact only if you can still quote the words doing the carrying; a fact you
   cannot anchor to a quoted substring is ABSENT. Never assert that the description "covers" or "fully
   conveys" a fact you cannot quote — an unquotable coverage claim is the exact error this procedure exists
   to remove.
3. **Materiality:** an ABSENT fact is MATERIAL if the image's purpose on this page includes conveying it —
   the reason the image is there. Incidental or decorative detail is not material.
4. **Verdict:** REPRODUCED only when ≥1 MATERIAL fact is ABSENT from the description AND is not conveyed
   anywhere else on the page (check the `surrounding-region` for an adjacent table/text that carries it).
   **The elsewhere-escape is held to the same quoting standard as step 2:** you may clear a MATERIAL fact
   through that escape ONLY by quoting the on-page text that carries it — the caption sentence, the table
   cell, the paragraph — exactly as you would quote the description itself. An unquoted "the data is also in
   the adjacent table/caption" is the fabricated-redundancy error: if you cannot quote the carrying text from
   the evidence handed to you, treat the fact as ABSENT there too — text you cannot quote does not exist.
   When the `surrounding-region`/signals handed to you are capped or plausibly incomplete for the place the
   carrying text would live, the escape is unverifiable rather than refuted — return PARTIAL (cannot verify
   from the provided excerpt) instead of treating the unquotable text as absent. *That unverifiability
   reading is constrained to CONTENT-BEARING locations:* "the place the carrying text would live" means
   somewhere page content lives — a caption, adjacent prose, a description block, a data table or list. A
   location that structurally cannot carry the image's information — a labelled user-entry control (its
   label names what the USER enters, not what the image shows), a navigation link, button chrome — is not
   such a place, so an excerpt truncated at form controls or widget chrome leaves nothing unverifiable and
   does NOT trigger this PARTIAL.
   Name the missing fact and quote what the description says in its place. If every material fact has a
   quote, NOT REPRODUCED — "could say more" is not a barrier.

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
- **`signals.captionText` (when present) is the AUTHORITATIVE caption/description text** — the enclosing
  figure caption plus every `aria-describedby` target, collected separately so markup-cap truncation cannot
  clip it mid-sentence. Quote from IT when working the enumerate-and-cite steps; when it is present, do not
  declare the caption unverifiable because the `enclosingHtml` excerpt looks cut off — the dedicated fact is
  the full text. Its absence on a subject means only that the collector did not mark this image complex.
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
