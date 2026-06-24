# case-06 — CONTROL (passes): genuine membership success page after VALID input, legitimately no error

## Scenario
The discrimination control for this aspect: the **same** Riverbend Library membership flow as
case-01, but this is the real **success** result. The user submitted **valid** data (Age 34, a real
email), the server accepted it, created the membership, and rendered a true confirmation — a
read-only summary of the accepted data, a real membership number (RVB-2026-08831), and next steps.
There is **no editable form re-displayed**, no retained out-of-range or empty required value, and an
honest "You're all set, Dana" message. There is legitimately no error message because no input error
occurred. A correct evaluator must call this **passed** while calling case-01..05 **failed** — that
contrast is the whole point of the control.

## Attribute tuple
- **content-domain:** government / civic services (public library membership) — same domain as case-01, opposite outcome
- **UI-component/pattern:** genuine post-submit confirmation (read-only `<dl>` summary + reference number + next-steps list)
- **host-language construct:** no `<form>` re-displayed; accepted values echoed as read-only `<dl>` text; success heading
- **locale/i18n:** en
- **failure-mechanism:** none — this is the legitimate "no error indicator because there was no error" state (ACT Passed Example 3 shape)

## Developer persona
The same municipal-IT team as case-01, but this render is the controller's true success branch: on
acceptance it routes to a dedicated `confirmation-success.html` template that echoes the persisted
record, prints the generated membership number, and lists next steps. No error slot is needed because
this branch only runs when validation passed. (Contrast with case-01, where the failure branch
wrongly re-used a confirmation-styled template with no error partial.)

## Element / selector carrying the issue
None — there is no issue. The page-state cues all point to genuine success: the `dl.saved` summary
shows valid accepted values (Age 34, a real email), `.refbox .num` shows a real membership number,
there is no editable form to re-submit, and the heading/lead honestly state success. This is the
benign-result page the aspect must NOT confuse with a suppressed-failure page.

## Exact accessibility mechanism (what AT experiences, why it passes)
3.3.1 applies only when an input error is automatically detected. Here none was — the submission
succeeded — so the absence of an error message is correct and required behaviour (ACT Passed Example
3). A screen-reader user lands on a page titled "You're all set — Riverbend Library membership
confirmed," hears the success heading, reads back the saved name/age/email and a membership number,
and gets clear next steps. Nothing is being suppressed: the values shown are valid, there is no form
to re-submit, and the success is conveyed honestly in text. The page-state cues (valid retained
values, a reference number, no re-displayed editable form) distinguish a real success from a hidden
failure.

## Expected ACT-style outcome
**passed**

## Why automated tools miss it
This case exists to test discrimination, not detection: it has the same "no error indicator on a
post-submit page" surface that automated tools also read as a pass. The risk is the *opposite* — a
naive context-blind heuristic that flags "post-submit page + no error" might wrongly fail this. A
correct human/LLM judgment uses the page-state cues (valid accepted values, real reference number, no
editable form re-shown, honest success copy) to confirm this is a legitimate success and PASSES it,
while still failing case-01..05 where those same cue-types point to a suppressed failure.

## Citation
> **WCAG 2.2 Understanding 3.3.1 (Intent), `wcag-understanding/error-identification.html`:**
> "The intent of this success criterion is to ensure that users are aware that an error has occurred
> and can determine what is wrong."

> **WCAG Technique G199 (Description), `wcag-techniques/general/G199.html`:**
> "The objective of this technique is to reduce the effort required for users to confirm that an
> action, such as submitting a web form, was completed successfully. This can be accomplished by
> providing consistently presented feedback that explicitly indicates success of an action."

(No input error was detected, so 3.3.1 imposes no error-identification requirement here; the page
instead correctly provides explicit success feedback per G199. This is the legitimate counterpart to
the suppressed-failure pages and must be judged passed.)
