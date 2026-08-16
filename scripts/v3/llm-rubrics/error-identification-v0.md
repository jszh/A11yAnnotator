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

**INCORRECT-MESSAGE failure mode (do not false-clear this either):** an error message that is fluent,
specific, and correctly associated can still fail 3.3.1 if it **describes the wrong error**. 3.3.1 requires
the error to be *identified* — a message that misidentifies it leaves the user unable to know what is
actually wrong, which is the same outcome as no message at all. Check the message AGAINST the evidence you
were handed, not just for its presence and specificity:
  - it contradicts the value actually in the field ("Enter an amount of at least $5.00" beside a field
    containing `25`; "Enter a valid email" beside a well-formed address);
  - it names a DIFFERENT field than the one flagged (`aria-invalid` on Postcode, message about Phone);
  - it states a constraint the page elsewhere contradicts (a stated max of 20 with a message saying 10);
  - it reports a count/summary that disagrees with the fields actually marked invalid
    ("3 errors" over a list of 2, or a summary naming fields that are not flagged).
If the retained value or the page's own stated constraint is visible to you and the message contradicts it,
that is **REPRODUCED**. Do not reason "a specific message exists, therefore the error is identified" — the
message must be TRUE of the error that occurred. If you cannot see the submitted value or the constraint,
say so and return PARTIAL rather than assuming the message is accurate.

**Evidence handed to you:** the before/after crop of the field+error region (`state-before`,
`state-after`), the field type, and — when present — `signals.nativeDialogText`: the VERBATIM text of a
native `window.alert()`/`confirm()` the submit triggered. **A native dialog is browser chrome, not page
content — `state-before`/`state-after` can NEVER show it, no matter how the crop looks.** If
`signals.nativeDialogText` is present and non-empty, that string IS the error identification evidence —
read it directly; do NOT judge from the screenshot alone in that case, and do NOT conclude "no text
explanation, only a red outline" when `nativeDialogText` is sitting right there. If `nativeDialogText` is
absent, judge from the screenshot as before (a DOM-toggled inline error, a summary region, etc.).

**THE ERROR SUMMARY MUST AGREE WITH THE FLAGGED STATE (`signals.errorSummaries`).** When the page carries a
summary block that names specific fields, you are handed the correspondence: `namedFields`, `flaggedFields`,
and the two set differences. 3.3.1's intent is that users "are aware that an error has occurred and can
determine what is wrong", and a summary is usually the FIRST thing a screen-reader user meets — often
focused or announced via `role="alert"`. So its accuracy is part of whether the error is identified:

- `namedButNotFlagged` non-empty ⇒ the summary sends the user to a field that is not in error. They will
  hunt for a fault that is not there, and may never reach the one that is.
- `flaggedButNotNamed` non-empty ⇒ a field IS in error and the summary omits it. If that field's own inline
  message is correct, a sighted user may still find it — but the summary has under-reported the problem.
- **Both non-empty is the worst case**: the summary describes a different set of problems than the page has.
- `coherent: true` ⇒ the summary matches; judge the per-field identification on its own merits.

**Do not treat correct per-field markup as settling this.** Every field can carry `aria-invalid` and a
correct associated message while the summary still misdirects — that combination is exactly what this signal
exists to surface, and it is invisible to the per-field probe.

*Guards.* A summary may name a field whose error is SERVER-side and not yet reflected in `aria-invalid`;
that is a mismatch in the data, not necessarily a failure — say so and prefer PARTIAL if you cannot tell.
`namedFieldNotOnPage` lists summary lines that demand a field the form does not contain — a set difference
over existing fields cannot show those, so they are reported separately; a user sent to fix a control that
is not there cannot determine what is wrong either. And a generic banner that
names no field is out of scope for this check entirely.

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
