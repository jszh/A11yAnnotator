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
"Field" is non-descriptive; "Phone number" is descriptive. Judge the text's informativeness relative
to the content it introduces (visible in the `viewport`). Failure modes:
- **Vague / generic:** "Section 2", "More", "Untitled", "Field" — says nothing about the topic.
- **Specific but MISMATCHED:** a heading that reads as a clear topic in isolation but does NOT describe the
  content it actually labels — e.g. a heading "Weather" over a paragraph about the shop's opening hours, or
  "Pricing" over a block of testimonials. Descriptiveness is judged RELATIVE TO THE CONTENT the heading
  introduces (visible in the `viewport`), not the heading's standalone plausibility. A heading that
  misdirects the reader about what follows IS a barrier. Read the content beneath/beside the
  heading and confirm the heading actually announces it.
- **LABEL that doesn't describe the field's expected input:** for a FORM-FIELD label, descriptiveness means
  the label tells the user what to ENTER / what the control does. When the subject is a form field,
  **`signals.heading.text` holds the field's COMPUTED ACCESSIBLE NAME** (the resolved
  `aria-label`/`aria-labelledby`/`<label>`/`title`, in the order AT announces it) and
  `signals.heading.isFormFieldLabel` is true — judge THAT name, not a page-heading. Non-descriptive labels include: a label that
  names an unrelated object or a generic concept rather than the field's purpose; a label assembled in the WRONG
  ORDER (e.g. a reversed `aria-labelledby` that concatenates its referenced tokens out of sequence) so the
  resulting name misreads the field; and the SAME label repeated on two or more fields of DIFFERENT purpose
  where NEITHER the label NOR a PERCEIVABLE section heading distinguishes them. For the repeated-label case use
  **`signals.sectionHeading`** — the field's nearest preceding VISIBLE section heading (null if the only heading
  is off-screen/hidden): if the same-named fields sit under DIFFERENT *visible* section headings (e.g. one under
  "Shipping", one under "Billing" — `sectionHeading` non-null and differing, confirmed in the `viewport`), the
  label IS distinguished in context → **NOT REPRODUCED**. But if `sectionHeading` is **null** (the disambiguating
  heading is OFF-SCREEN / hidden, so a sighted user sees the identical labels with no visible section cue) OR the
  same-named fields share one section, the visible labels are ambiguous → **REPRODUCED**. (A vague/mismatched/
  wrong-order label is non-descriptive on its own regardless of section.) Judge the label against what the field
  expects, visible in the `viewport`; do not clear a label just because the single word is a real word. You do NOT need to know the field's exact expected value to flag a label
  that names an unrelated UI object or concept (e.g. a navigation/menu word on a free-text input): such a label
  fails ON ITS FACE → **REPRODUCED**, not PARTIAL/UNCERTAIN. Reserve PARTIAL only for a label that plausibly
  COULD describe the field but whose target/content you cannot see.

**WCAG soundness caveats:**
- 2.4.6 is about DESCRIPTIVENESS, not presence (missing heading/label is 1.3.1/3.3.2, not here).
- Judge descriptiveness against the heading's ACCESSIBLE NAME (`structure.headings[].name`) when it differs
  from the rendered text (an `<img alt>` heading, an `aria-label`), not the bare `textContent`. A heading that
  is `ariaHidden:true` (removed from the a11y tree) does NOT organize content for AT — but do not fault its
  *descriptiveness* here (that is a 1.3.1/2.4.10 concern).
- Calibrate to PLAIN failures: flag only a clearly generic/misleading heading ("More", "Section", "Untitled"
  over substantive unique content). A reasonable topical heading is NOT a barrier merely because a more
  specific wording exists — do not over-flag on stylistic preference.
- A terse-but-unique-and-clear heading is fine; do not demand verbosity.
- **A CONVENTIONAL / POSITIONAL label that accurately labels its section IS descriptive — do not flag it.** A
  single letter heading "A" / "B" over a glossary or alphabetical index section (it labels the A-entries), a step
  number "1." / "Step 2" over that step, a date over a day's agenda, a category letter in an A–Z directory — these
  DESCRIBE their content by an established convention the reader understands in the `viewport`. Judge
  descriptiveness RELATIVE TO the content + its convention, not against an absolute "names a topic in isolation"
  bar. "A" in a glossary is NOT "Section 2" over arbitrary content — clear it (**NOT REPRODUCED**). Flag a
  positional label only when it labels content the convention does NOT explain (a bare "A" over a paragraph about
  the weather).
- The MISMATCH call REQUIRES seeing the introduced content: if the `viewport` does not show enough of the
  content under the heading to judge whether it matches, return PARTIAL — do not infer a mismatch from the
  heading text alone.
- When the crop doesn't show enough context to judge, return PARTIAL.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}`.
