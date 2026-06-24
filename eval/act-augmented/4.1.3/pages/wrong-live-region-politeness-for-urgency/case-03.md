# case-03 — Session-expiry countdown queued in `aria-live="polite"` behind a long certification statement

## Scenario
A government unemployment-benefits portal has a multi-step weekly-claim wizard. On the
"certify your claim" step the user must read a long, legally binding certification
statement before checking the agree box. A secure-session region warns that the user
will be signed out after inactivity — but the warning is wired `aria-live="polite"`.
When the 30-second expiry countdown is injected, polite politeness queues it **behind**
the certification statement the screen reader is still narrating. By the time the queue
reaches "your session expires in 30 seconds", the session has already ended and the
half-finished answers are discarded. A blocking, time-critical countdown must be
`assertive` / `role="alert"` so it interrupts and is heard in time to act.

## Attribute tuple
- **content-domain:** government / civic services portal (unemployment insurance)
- **UI-component / pattern:** multi-step certification wizard with a session-timeout warning region
- **host-language construct:** `<div aria-live="polite" aria-atomic="true">` updated by a chained `setTimeout` countdown
- **locale / i18n:** en-US, formal legal register
- **failure-mechanism:** under-polite — time-critical, action-blocking message in `polite`

## Developer persona
An accessibility-aware contractor on the agency build had been burned by a prior audit
finding for an *over*-assertive toast, and over-corrected: they made every live region
on the portal `polite` as a blanket rule ("polite is the safe default, assertive is
rude"). The blanket rule is wrong for a session-expiry countdown, which is precisely
the time-critical case where assertive is required.

## Element / selector carrying the issue
`div#sessionMsg[aria-live="polite"]`, into which the countdown text is injected by the
chained `setTimeout`. The verbose `div#terms` certification statement is the ongoing
speech the polite update is queued behind.

## Exact accessibility mechanism
Polite live regions wait for the screen reader to finish whatever it is currently
speaking (and anything already queued) before announcing new content. On this step the
AT is reading four dense paragraphs of certification text aloud — easily a minute or
more of speech. The session-expiry countdown is injected into the polite region while
that narration is in progress, so the AT will not voice "your session expires in 30
seconds" until the statement finishes — long after the 30 seconds have elapsed and the
session has been torn down. A sighted user sees the countdown immediately; the
screen-reader user is told only after it is too late to act. The message *is* announced
(so absence-checkers pass) but at a politeness that defeats its purpose. The correct
value is `assertive` / `role="alert"`, which interrupts to deliver the time-critical
warning at once. The defect is **present-but-wrong politeness in the dangerous
direction**.

## Expected ACT-style outcome
**failed** — a genuinely time-critical, action-blocking status message is wired polite,
so it is queued behind ongoing speech and the user acts (or fails to act) before hearing
it; this violates the intent to make users aware of important changes in a timely way.

## Why automated tools miss it
`#sessionMsg` is a present, non-empty live region with valid `aria-live="polite"` and
`aria-atomic="true"`; it announces correctly in isolation. axe-core / WAVE / Lighthouse
test only that a status message can be announced — `polite` is a perfectly legal value,
so no rule fires. Determining that *this particular* message is time-critical and
blocking (a session-expiry countdown the user must act on within seconds), and therefore
must be assertive rather than polite, requires understanding the meaning and urgency of
the content and the long speech it is queued behind — a contextual human judgment no
static or single-snapshot scan can make.

## Citation
**Reference:** WCAG 2.2 Understanding SC 4.1.3 Status Messages — Intent
(`wcag-understanding/status-messages.html`)

> "The intent of this success criterion is to make users aware of important changes in
> content that are not given focus, and to do so in a way that doesn't unnecessarily
> interrupt their work."

**Supporting reference:** WCAG 2.2 Understanding SC 4.1.3 — In brief
(`wcag-understanding/status-messages.html`)

> "Why it's important: People who do not see messages need to be informed about them."
