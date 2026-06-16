---
id: field-label-v0
sc: 3.3.2
skill: forms-instructions-errors
visionEvidence: [element-crop]
---

# 3.3.2 — field label adequacy (v0 atomic rubric)

**Division of labor (v3.2).** You do NOT investigate the page. The builder already located the form
field, extracted its programmatic label / accessible name and any associated instruction, captured its
visible label, and screenshotted the element. Your job is to JUDGE whether the programmatic label and
visible label agree — not to crawl the form. Where a deterministic runner already disposed this
obligation (e.g. a field with NO programmatic name at all, or one with an explicit `for`/`aria-labelledby`
binding that mechanically matches), DEFER — the builder hands you only the auto-PARTIAL obligations that a
checker could not settle by itself.

**Judge:** does the field have a programmatic label/instruction that matches its visible label — i.e. is
the name a non-sighted user hears the SAME identification a sighted user reads next to the input? A field
whose accessible name matches (or fully contains) its visible label is correctly labeled (NOT a barrier).
A field labeled only by adjacent text that is NOT programmatically associated, labeled by a mismatched or
generic name ("field", "input", a placeholder standing in for a label), or whose required-format
instruction is shown visually but absent from the accessible name, IS a barrier. Placeholder-only "labels"
that vanish on input ARE a barrier.

**Evidence handed to you:** the visible label (`element-crop`), the programmatic label / accessible name,
the field's role/type, and any visible instruction or format hint near the field.

**WCAG soundness caveats (do NOT manufacture a failure these don't support):**
- A programmatic name that matches or supersets the visible label is correct — do not flag mere
  capitalization, punctuation, or trailing-colon differences.
- Visible instructions that are non-essential decoration (not needed to operate the field) need not appear
  in the accessible name — do not flag their absence.
- A field with no visible label at all (icon-only with an accessible name) is in scope only if a sighted
  user would expect a visible label; when the crop is inconclusive about the intended visible text, return
  PARTIAL rather than inventing a mismatch.
- Do not judge error-message wording or required-field validation here; another rubric owns those.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}`. verdict ∈
{REPRODUCED (barrier), NOT REPRODUCED (no barrier), PARTIAL (cannot decide), N/A (abstain — NOT "out of
scope", that is the oracle's job)}.
