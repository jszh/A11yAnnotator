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

**Self-drive with `interact_and_observe` when the handed evidence is INCONCLUSIVE (tools enabled).** The
deterministic driver covers the common form, but a heterogeneous one (multi-field, format-specific, a
non-`<form>` JS widget) may not reach the error state — leaving you with no before/after error region. When
that happens, drive it YOURSELF with the bounded primitive tool instead of abstaining: pick the form's required
/ typed (`type=email`/`pattern`/`minlength`) field(s), and call `interact_and_observe` with a short sequence —
`[{op:'clear',xpath:F}, {op:'type',xpath:F,text:<deliberately-invalid>}, {op:'click',xpath:<submit>}]` (an empty
required field is the most universal invalid input; a bad-format value for a typed field). Read the result's
`delta.invalidFields[]`: each names a field the page itself reported invalid, with its `validationMessage`, the
programmatically-`associatedErrorText`, and `errorAssociated`/`via`. The tool BLOCKS the real submit (client-side
observation only — no POST). `delta.noErrorSurfaced:true` after an invalid submit is INCONCLUSIVE (the form may
validate server-side), NOT a pass → PARTIAL. Judge the `invalidFields` error text exactly as you would the
handed crop. (If tools are off, or you cannot induce an error, fall back to N/A as before.)

**Judge:** when the input is rejected, is the error IDENTIFIED in text — and does that text give the
user the clear DIRECTION of what went wrong (which field, what the problem is), not merely a generic
"submission failed"? "Email is required" or "Date must be after today" IDENTIFIES the error in text. A
bare red border, a color-only cue, or a silent rejection with no textual description does NOT identify
the error. (3.3.3 error SUGGESTION owns whether a fix is offered; do NOT re-litigate that here — a
message that identifies but does not suggest still passes 3.3.1.)

**AMBIGUOUS-FIELD failure mode (do not false-clear this):** if the error text names only a field TYPE / generic
label that is **shared by two or more fields** on the form, so the user cannot tell WHICH instance is in error,
the error is NOT identified for that field → **REPRODUCED**. For example, when two fields on the form share the
same label (e.g. two fields both labelled "Address"), a message that repeats only that shared label without
indicating which instance fails to identify the specific erroring field. A message is adequate only if it
points to the specific field (by a unique label, position, or programmatic association), not a label
duplicated elsewhere on the form.

**Evidence handed to you:** the before/after crop of the field+error region (`state-before`,
`state-after`), the field type, and — when present — `signals.nativeDialogText`: the VERBATIM text of a
native `window.alert()`/`confirm()` the submit triggered. **A native dialog is browser chrome, not page
content — `state-before`/`state-after` can NEVER show it, no matter how the crop looks.** If
`signals.nativeDialogText` is present and non-empty, that string IS the error identification evidence —
read it directly; do NOT judge from the screenshot alone in that case, and do NOT conclude "no text
explanation, only a red outline" when `nativeDialogText` is sitting right there. If `nativeDialogText` is
absent, judge from the screenshot as before (a DOM-toggled inline error, a summary region, etc.).

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
