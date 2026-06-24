# case-04 — Username rules tooltip fades in on focus then auto-dismisses after 1.5s via a timer, vanishing before a slow reader can finish and never returning while the field stays focused

## Scenario
The account-creation page of a community forum (Thornwood Makers). The username has non-obvious rules
("3–20 characters; letters, numbers, hyphens and underscores only; must start with a letter"), which
are the field's only instruction; the visible `<label>` reads just "Choose a username" and does not
state them. Per the focus-revealed pattern, the rules tooltip fades in on focus — and then a
`setTimeout(..., 1500)` fades it back out and marks it `aria-hidden` while the field still has focus.
The instruction auto-dismisses before a slow reader (or a magnifier user panning to it) can finish,
and does not reappear unless the field is blurred and re-focused. This is the aspect's failure limb
(d): the instruction auto-dismisses before the user can read or act on it.

## Attribute tuple
- **content-domain:** community forum (woodworking) account signup
- **UI-component/pattern:** focus-revealed tooltip with a self-dismissing timer
- **host-language construct:** `<input type="text">`, JS focus handler toggling a `.show` class plus `setTimeout` to remove it after 1500 ms; `aria-describedby` + `aria-hidden` toggled in lockstep
- **locale/i18n:** en
- **failure-mechanism:** timed auto-dismiss — the only instruction is perceivable for ~1.5 s then removed (visually faded out and set `aria-hidden`) while focus is retained, with no return path short of blur/refocus

## Developer persona
A developer copied a "toast"/snackbar dismissal snippet (the kind used for transient confirmations
like "Saved!") and repurposed it for the username rules tooltip, because a design note asked the hint
to "appear, then fade so it doesn't clutter the form." Toasts auto-dismiss by design; reusing that
timer on an instruction means the instruction inherits the auto-dismiss. QA glanced at the field, saw
the rules pop in, and moved on within the 1.5 s window, so no one noticed the rules disappear on a
focused field.

## Element / selector carrying the issue
`#uname` (the username input) and its tooltip `#uname-tip`. The focus handler adds `.show` then, after
1500 ms, runs `tip.classList.remove('show'); tip.setAttribute('aria-hidden','true')` — dismissing the
instruction while the field is still focused. There is no re-show on a later interaction within the
same focus session.

## Exact accessibility mechanism (what AT experiences, why it fails)
The username rules are the only instruction telling the user what a valid username is. On focus they
appear, but 1.5 s later they fade out and become `aria-hidden="true"`, so the `aria-describedby`
target is now hidden and a screen reader re-querying the description finds nothing; a sighted slow
reader, a screen-magnifier user panning across the form to reach the tooltip, or anyone who pauses to
think loses the instruction mid-read. Because the timer only re-arms on a fresh `focus` event, a user
who keeps the field focused cannot get the rules back — they must Tab away and Tab back, which is not
discoverable. The instruction is therefore not reliably available while the control has focus: it is
present only for a brief, fixed window, which fails the requirement that the instruction be available
(and usable) when the field is focused, and disadvantages exactly the cognitive / low-vision users
the SC is meant to protect.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
The input has a correct, associated `<label>` ("Choose a username"), so axe / WAVE / Lighthouse pass
it on the form-label check. The instruction node exists, is shown on focus, and is wired via
`aria-describedby`, so a static scan captures an instruction that appears on focus — at the instant it
snapshots the DOM, the tooltip may even be visible. No automated checker measures how long the
instruction remains perceivable, drives focus and waits 1.5 s to watch it disappear, or judges that a
timed auto-dismiss leaves the instruction effectively unavailable for a focused user. Timing the
appearance and disappearance, and judging that the window is too short and non-recoverable, requires
interacting with the page over time and human judgment.

## Citation
> **WCAG 2.2 Understanding 3.3.2 (Intent), `wcag-understanding/labels-or-instructions.html`:**
> "Content authors may also choose to make such instructions available to users only when the
> individual control has focus especially when instructions are long and verbose."

> **WCAG 2.2 Understanding 3.3.2 (Intent), `wcag-understanding/labels-or-instructions.html`:**
> "The goal is to make certain that enough information is provided for the user to accomplish the task
> without undue confusion or navigation."

(The Understanding permits deferring the instruction to focus, but the goal is that enough information
is provided for the user to accomplish the task. An instruction that auto-dismisses 1.5 s into the
focus session — and only returns by blurring and re-focusing — is not available for the user to
accomplish the task and adds undue navigation, so the focus limb is not honored.)
