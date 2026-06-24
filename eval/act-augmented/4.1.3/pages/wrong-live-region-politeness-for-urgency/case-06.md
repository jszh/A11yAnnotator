# case-06 — PASS boundary: urgent security warning correctly `assertive`; trivial activity badge correctly `polite` + SCR14 toggle

## Scenario
A bank's sign-in verification screen demonstrates **correct** urgency-to-politeness
mapping in both directions on one page — the sharpening boundary for this aspect:

- **Case A (correctly assertive):** a one-time-code verification that expires in 60
  seconds and *blocks* the sign-in is wired `role="alert"` (assertive). It is genuinely
  urgent and action-blocking, so interrupting is the right behavior — the user must hear
  the deadline in time to act.
- **Case B (correctly polite + toggleable):** a low-value "Devices currently signed in:
  N" badge that updates every few seconds is wired `aria-live="polite"` so it queues
  behind ongoing speech and never interrupts, and it carries an on/off toggle exactly as
  SCR14 prescribes for nonessential alerts.

Because each message's politeness matches its meaning and cadence, the page passes.

## Attribute tuple
- **content-domain:** online banking / fintech (sign-in verification)
- **UI-component / pattern:** OTP verification with an expiry countdown + a recent-activity badge with an SCR14 toggle
- **host-language construct:** `<div role="alert">` (assertive, urgent) and `<span aria-live="polite">` (trivial) with an `aria-pressed` toggle button
- **locale / i18n:** en-US
- **failure-mechanism:** none — both politeness choices are correct; this is the contrast control

## Developer persona
A senior accessibility engineer at the bank deliberately reasoned about each message's
meaning and cadence: the code-expiry warning is blocking and time-critical, so it
interrupts (assertive); the device-count badge is informational and frequent, so it is
polite and can be silenced (SCR14). This is what getting the priority right looks like.

## Element / selector carrying the (correct) behavior
- `div#securityMsg[role="alert"]` — urgent, blocking, correctly assertive.
- `span#activityMsg[aria-live="polite"]` — trivial, frequent, correctly polite, with
  `button#liveToggle[aria-pressed]` flipping `aria-live` to `off` (SCR14 opt-out).

## Exact accessibility mechanism
Assertive politeness on the security warning means the screen reader interrupts to
deliver the 60-second deadline immediately, so a non-visual user learns the constraint in
time to enter the code — the correct treatment for an urgent, action-blocking message.
Polite politeness on the device-count badge means each update waits for current speech to
finish and never preempts the user; and the toggle lets the user turn the announcements
off entirely (setting `aria-live="off"`), so a user who finds them chatty can suppress
them — the correct treatment for low-value, high-frequency content. Both messages are
announced, and each is announced at a politeness appropriate to what it means and how
often it fires. There is no defect.

## Expected ACT-style outcome
**passed** — both status messages are present, valid, announced, and wired at the
politeness their meaning and cadence call for (assertive for the urgent/blocking warning,
polite + toggleable for the trivial/frequent badge), satisfying both the "make users
aware of important changes" goal and the "doesn't unnecessarily interrupt" intent.

## Why automated tools miss it (i.e. why automated agreement here is not meaningful)
axe-core / WAVE / Lighthouse pass this page — but they would equally pass it if the
politeness values were swapped (urgent message polite, trivial badge assertive), because
both `assertive` and `polite` are legal attribute values and a live region is present in
both cases. The tools cannot distinguish a correct urgency mapping from an incorrect one;
only a human reviewer who weighs each message's meaning and update frequency can confirm
that *this* page got the mapping right. This page is the control that proves the aspect
is about human judgment, not markup validity.

## Citation
**Reference:** WCAG Techniques — SCR14 "Using scripts to make nonessential alerts
optional" (`wcag-techniques/client-side-script/SCR14.html`)

> "If the user presses the "Turn Announcements Off" button, their screen reader will stop
> making announcements when the stock value changes; if they press the "Turn Announcements
> On" button, the announcements will start again."

**Supporting reference:** WCAG 2.2 Understanding SC 4.1.3 — Intent
(`wcag-understanding/status-messages.html`)

> "The intent of this success criterion is to make users aware of important changes in
> content that are not given focus, and to do so in a way that doesn't unnecessarily
> interrupt their work."
