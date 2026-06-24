# case-04 — Survey appends follow-up questions after a low rating (not a status by definition → N/A)

## Scenario
A Riverside Folk Festival post-event satisfaction survey. Question 1 asks for an overall rating. When the
attendee selects a **low** rating ("Poor"/"Very poor"), the form **appends** a set of conditional
follow-up questions ("What was the biggest problem?", a free-text box). The new fields appear without
taking focus and with **no** `role="status"`/`aria-live`. The naive 4.1.3 reflex — "content was injected
without focus and nothing was announced, fail" — is wrong here: the appended questions do not convey
success, a waiting state, progress, or an error, so by definition they are **not** a status message and
the SC does not apply.

## Attribute tuple
- **content-domain:** events / ticketing (post-event feedback survey)
- **UI-component/pattern:** branching/conditional form (radiogroup that reveals additional fields)
- **host-language construct:** `radiogroup` + a `[hidden]` `<div>` of `<select>`/`<textarea>` un-hidden by script
- **locale/i18n:** en
- **failure-mechanism:** NONE — definitional-boundary N/A; the trap is mistaking conditionally-revealed
  survey questions for a silently-injected status message

## Developer persona
A nonprofit volunteer building the survey in a low-code form tool with branching logic. They wired "show
these questions if rating ≤ 2" and shipped it. They did not add a live region, and they did not move
focus, because to them the follow-ups are just more of the same form. A zealous auditor running a
"dynamic content with no aria-live = 4.1.3 fail" rule would flag the reveal — but the Understanding
explicitly excepts exactly this scenario.

## Element / selector carrying the issue
`#followup` — the conditionally revealed block of follow-up questions. The classification turns on the
`change` handler that un-hides it on a low rating without firing any announcement. The fields inside are
ordinary labeled controls (`#problem`, `#detail`).

## Exact accessibility mechanism (what AT experiences, why it is N/A)
A screen-reader user who picks "Very poor" then continues navigating the form (next field / form-control
navigation, or simply Tab) encounters the newly-revealed, fully-labeled `<select>` and `<textarea>` in
reading order. Nothing is announced at the *moment* of reveal, and that is acceptable: the content is not
a status message. The Understanding's third excepted example is precisely "after a user completes a survey
question which indicates they are unhappy, a series of new questions are added to the page," and states
the new inputs "do not 'provide information to the user on the success or results of an action, on the
waiting state of an application, on the progress of a process or on the existence of errors,' and so are
not required to meet this success criterion." Announcing them in advance is called out as a *best
practice, not a requirement*.

## Expected ACT-style outcome
**inapplicable** — the dynamic change (appended questions) does not meet the status-message definition, so
4.1.3 does not apply. Per EN 301 549 C.9.4.1.3, "Not applicable: …the web page does not contain content
relevant to … 4.1.3."

## Why automated tools miss it
A static scan sees valid labeled form controls and no missing attributes. A *dynamic* "content appeared
without an announcement" heuristic — the only kind of automation that could even touch 4.1.3 — would
FALSELY flag the reveal as a missing live region. No tool can determine that the appeared content is
"more questions" rather than "a status," because that classification depends on the *meaning* of the
content (does it convey success/waiting/progress/error?). That meaning-based exception is the human
judgment the whole SC pivots on, and the distinction between "non-status content (N/A)" and "status not
programmatically determinable (fail)" is itself outside automated reach.

## Citation
> **WCAG 2.2 Understanding 4.1.3 (Examples of changes that are not status messages), `wcag-understanding/status-messages.html`:**
> "After a user completes a survey question which indicates they are unhappy, a series of new questions
> are added to the page about customer satisfaction. The new inputs do not meet the definition of status
> message. They do not \"provide information to the user on the success or results of an action, on the
> waiting state of an application, on the progress of a process or on the existence of errors,\" and so
> are not required to meet this success criterion."

> **WCAG 2.2 Understanding 4.1.3 (Examples of changes that are not status messages, note), `wcag-understanding/status-messages.html`:**
> "Creating a status message about these questions being added, or notifying the user in advance that
> content changes may take place based on the user's response, are best practices but are not requirements
> in this scenario."
