---
id: error-identification-v0
sc: 3.3.1
skill: forms-instructions-errors
visionEvidence: [state-before, state-after]
---

# 3.3.1 — error identification (v0 atomic rubric)

**Division of labor (v3.2).** You do NOT investigate the form — the driver already submitted invalid
input and captured the field+error region before/after. You JUDGE over the handed evidence; you do not
re-drive anything. Where a deterministic CLAIM already disposed this obligation (e.g. a runner that
checked whether the rejected field is programmatically associated with an error), DEFER — the builder
hands you ONLY the auto-PARTIAL obligations, the ones a machine could not settle on its own.

**Judge:** when the input is rejected, is the error IDENTIFIED in text — and does that text give the
user the clear DIRECTION of what went wrong (which field, what the problem is), not merely a generic
"submission failed"? "Email is required" or "Date must be after today" IDENTIFIES the error in text. A
bare red border, a color-only cue, or a silent rejection with no textual description does NOT identify
the error. (3.3.3 error SUGGESTION owns whether a fix is offered; do NOT re-litigate that here — a
message that identifies but does not suggest still passes 3.3.1.)

**Evidence handed to you:** the before/after crop of the field+error region (`state-before`,
`state-after`), the textual error/validation message that was shown, and the field type.

**WCAG soundness caveats (these STOP a false clear/barrier):**
- LANGUAGE-AGNOSTIC (Harness 3.3 D): the error text may be in ANY language — a clearly-worded message in
  Spanish/German/Japanese/etc. identifies the error exactly as an English one does. Do NOT require English
  keywords. Colour (a red message/border), an `error`/`invalid` CSS class, and English error stems are
  WEAK PRIORS ONLY — their presence is not sufficient and their absence is not decisive. Judge the ACTUAL
  rendered text shown in `state-after` (vs `state-before`), reading meaning across languages.
- C2 (mechanism-agnostic): do NOT infer a 3.3.1 failure from a missing `aria-invalid` — the absence of
  that attribute is not itself a barrier. Judge whether the error is identified IN TEXT, by whatever
  mechanism; programmatic association is necessary but a missing attribute alone does not manufacture a
  failure.
- Do not call it a false CLEAR: a visible-only/color-only cue with no text does NOT identify the error,
  even if a sighted user could guess it.
- If no error was actually demonstrated for this field (the input was accepted, or rejection was not
  triggered), there is nothing to judge → N/A (abstain). When the crop is inconclusive about whether
  text was shown, return PARTIAL rather than guessing.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}`. verdict ∈
{REPRODUCED (barrier — error not identified in text), NOT REPRODUCED (no barrier — error identified),
PARTIAL (cannot decide), N/A (abstain — NOT "out of scope", that is the oracle's job)}.
