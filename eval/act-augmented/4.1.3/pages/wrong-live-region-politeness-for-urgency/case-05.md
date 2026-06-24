# case-05 — Critical "do not refresh" decline shown in a visible banner; the live region announces only bland filler

## Scenario
At a coffee store's checkout, submitting a declined card produces a critical,
action-blocking instruction — "Payment declined by your bank. Do NOT refresh or press
Pay again — a second attempt may place a duplicate charge." The page splits this status
across two elements. The blocking instruction is written into a VISIBLE red banner that
is a plain `<p>` (no role, no `aria-live`), so a sighted user sees the full warning. A
present, valid `role="status"` live region exists on the page — but on decline it is
given only the bland filler "Payment update available." That filler is the only thing the
screen reader announces. The screen-reader user, who cannot see the red banner, is never
told they must not refresh or resubmit, and may trigger a duplicate charge. The status
message that conveys the critical change is not programmatically surfaced to assistive
technology.

## Attribute tuple
- **content-domain:** e-commerce checkout / payment
- **UI-component / pattern:** card-payment form whose decline feedback is split between a visible banner and a separate live region
- **host-language construct:** visible `<p>` banner (no role/`aria-live`) + a separate `<p role="status" aria-atomic="true">` populated with generic filler
- **locale / i18n:** en-US, USD currency
- **failure-mechanism:** announced-but-wrong-content — the critical status text is in the un-announced node; the live region announces only generic filler

## Developer persona
The checkout team did add an accessible live region — they know `role="status"` is the
"right" pattern and a checker once flagged a missing one. But when they wired the decline
handler they pushed the full red warning into the existing visual error banner (the
component the designer styled) and, almost as an afterthought, dropped a short generic
string into the live region "so screen readers get *something*." They never compared what
the region actually announces against the urgent content shown on screen, so the live
region passes audits while announcing nothing actionable.

## Element / selector carrying the issue
`p#declineBanner` (visible, plain `<p>`, no role / no `aria-live`) carries the critical
"do not refresh / duplicate charge" instruction. `p#payStatus[role="status"]` is the
present, valid live region — but on decline it is populated only with
`"Payment update available."`, so the AT announces the filler and never the warning.

## Exact accessibility mechanism
SC 4.1.3 requires that a status message — content that informs the user of the result of
an action or the existence of an error, added without taking focus — be programmatically
exposed so assistive technology can announce it. On decline, the page genuinely produces
such a status message: a payment-failure instruction. But the instruction text is placed
in `#declineBanner`, a plain `<p>` with no role and no `aria-live`, so it is never
announced. The only thing routed into the actual live region `#payStatus` is the generic
placeholder "Payment update available," which a screen reader does announce — satisfying
"a live region is present and non-empty" while withholding the substance. A sighted user
reads "do NOT refresh — you may be double-charged"; the screen-reader user hears only that
an unspecified "update" is available and is left to refresh or resubmit blind. The status
information that matters is **present on the page but not programmatically surfaced to AT**
— the live region announces, but it announces the wrong content. This is a genuine 4.1.3
failure (not a politeness-quality opinion): the critical status change is not made
available to assistive technology.

## Expected ACT-style outcome
**failed** — the decline produces a status message (information about the failure/result
of the payment action), and it is added without taking focus, but the message's actual
content is in a plain `<p>` with no role/`aria-live`; the present live region announces
only generic filler. Assistive technology is therefore not notified of the real status
change, violating 4.1.3's requirement that status messages be programmatically conveyed.

## Why automated tools miss it
`#payStatus` is a present, valid `role="status"` live region; on decline it is non-empty
and genuinely announces. axe-core / WAVE / Lighthouse verify only that a status message
*can* be announced — and one is — so no rule fires. They have no way to know that the
announced string is meaningless filler while the actual blocking instruction sits in a
separate visible `<p>` that has no role and no `aria-live`. Detecting this requires
triggering the decline, reading the red banner the sighted user sees, comparing it to what
the live region actually announces, and judging that the critical content was routed to
the silent element — a behavioral, semantic, human-in-the-loop comparison no static or
single-snapshot scan can make.

## Citation
**Reference:** WCAG 2.2 Understanding SC 4.1.3 Status Messages — In brief
(`wcag-understanding/status-messages.html`)

> "Let assistive technology notify users about status changes that don't take focus."

**Supporting reference:** WCAG 2.2 Understanding SC 4.1.3 — Intent (status-message definition)

> "The scope of this success criterion is specific to changes in content that involve
> status messages. A status message is a defined term in WCAG. There are two main
> criteria that determine whether something meets the definition of a status message:"
> "the message provides information to the user on the success or results of an action,
> on the waiting state of an application, on the progress of a process, or on the
> existence of errors;"
