# case-03 — PASS control: 2FA "Sending code…" REPLACED in-place by "Code sent" (not removed)

## Scenario
A government identity-verification step sends a one-time code. Pressing **Send verification code** injects "Sending verification code…" into a `role="status" aria-live="polite"` region (announced on entry). On completion the same region is **overwritten** with "Code sent to the mobile number ending 47. Enter it below." — an explicit completion status — and the code input is revealed. This is the boundary control: the end of the waiting state is announced by *replacing* the busy text, not by silently removing it.

## Attribute tuple
- **content-domain:** government / civic identity service (2FA)
- **UI-component / pattern:** OTP send + verify step in a stepper (dynamic-state: async action with success feedback)
- **host-language construct:** single `role="status" aria-live="polite"` region whose content is replaced (`innerHTML` set to a new completion message), never emptied
- **locale / i18n:** en-US
- **failure-mechanism:** none — this is the correct "Removal of status text" remediation (update the visible message to a 'system available'-style string)

## Developer persona
A senior accessibility-aware engineer at a state digital office read the SC's "Removal of status text" note and recognized the trap: clearing the busy region would tell sighted users "done" while saying nothing to AT. They deliberately overwrite the region with an explicit "Code sent…" message so the end of the wait is announced, and point `aria-describedby` from the OTP input at the same status so the success context is associated with the field.

## Element / selector carrying the issue
`#status` (`p[role="status"]`) — the live region is updated in place to a completion message; the disappearance of "Sending…" is replaced by audible "Code sent…", so no information is lost on removal.

## Exact accessibility mechanism (what AT experiences, why it passes)
- **Entry:** the polite region receives "Sending verification code…" → announced.
- **Completion:** the same region's content is replaced with "Code sent to the mobile number ending 47. Enter it below." A fresh text mutation inside a polite region is announced, so the AT user hears the end of the waiting state explicitly.
- The busy text is never simply removed; its disappearance is no longer the only signal that the wait is over. The completion message is the "system available"-equivalent the SC calls for.
- Contrast with case-01/case-02: those *empty* the region (silent); this one *replaces* it (announced). Same component family, opposite outcome — which is exactly what sharpens the aspect.

## Expected ACT-style outcome
**passed** (SC 4.1.3 — the waiting state's start and end are both programmatically conveyed; the status text is updated, not silently removed).

## Why automated tools miss it
Automated tools cannot confirm this *passes* the removal aspect any more than they can confirm the failures: at a static snapshot they see only a valid live region and a labeled input. They never trigger the action, never observe that the busy message is *replaced* rather than *cleared*, and have no way to judge that the replacement string conveys the equivalent "done" status. The pass/fail distinction here turns entirely on a runtime, semantic comparison (was the end-of-wait announced?) that tools do not perform — which is why a correct page like this is indistinguishable from the failing ones to a scanner.

## Citation
> "In situations where status text is entirely removed, its absence may itself convey information about the status. … Where updating the visible message (e.g., to "system available") is not feasible, the use of a non-visible status message, such as "system available", ensures equivalent status information is provided."
— wcag-understanding/status-messages.html ("Removal of status text")

> "The purpose of this success criterion is not to force authors to generate new status messages. Its intent is to ensure that when status messages are displayed, they are programmatically identified in a way that allows assistive technologies to present them to the user."
— wcag-understanding/status-messages.html (Other uses of live regions or alerts)
