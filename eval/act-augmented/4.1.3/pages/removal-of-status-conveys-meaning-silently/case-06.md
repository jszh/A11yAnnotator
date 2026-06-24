# case-06 — "Checking availability…" cleared to enable a "Reserve" button; no "Available" status

## Scenario
A restaurant reservation widget checks table availability. Pressing **Check availability** injects "Checking availability…" plus a spinner into a `role="status" aria-live="polite"` region (announced on entry). On success the busy region is **emptied** and a previously-disabled "Reserve this table" button is **enabled** (its label never changes). Sighted users read the spinner vanishing + the greyed button lighting up as "a table is available — go ahead." AT users hear "Checking availability…" then silence; no "Available — you can book" status is announced, and the bare disabled→enabled flip on the button is not a substitute.

## Attribute tuple
- **content-domain:** restaurant reservations / events & ticketing
- **UI-component / pattern:** availability check gating a Reserve button (dynamic-state: result conveyed via a control's enablement + removal of busy text)
- **host-language construct:** `role="status"` region emptied via `textContent = ''`; native `<button disabled>` whose `disabled` flips on success, label unchanged
- **locale / i18n:** en-US
- **failure-mechanism:** busy text removed silently AND the availability outcome conveyed only by the disappearance + a control state change, never as a status message

## Developer persona
A small-agency dev building a one-off reservation widget for a restaurant followed an APG-flavored pattern: show a loading message in `role="status"`, disable the action until it's safe, then enable it. They believed enabling the button "is" the feedback. They did not realize that (a) clearing the busy region announces nothing, (b) enabling a button does not auto-announce unless focus is on it and the button's *name* never changes, and (c) the availability outcome is a status message that the removed busy text owed a "now available" replacement for — not something 4.1.2's control-state handling covers.

## Element / selector carrying the issue
`#avail` (`div[role="status"]`) is emptied on success (silent end-of-wait); the availability *outcome* is conveyed only by `#book` (`button`) flipping from `disabled` to enabled with an unchanged accessible name — no "Available" status message exists anywhere.

## Exact accessibility mechanism (what AT experiences, why it fails)
- **Entry (correct):** "Checking availability…" enters the polite region → announced.
- **Completion (the failure):**
  1. `avail.textContent = ''` empties the busy region — removing polite content announces nothing, so the end of the wait is silent.
  2. `book.disabled = false` enables the Reserve button. A screen reader does not spontaneously announce a state change on a control the user is not focused on, and the button's name is unchanged ("Reserve this table" before and after), so a user reviewing the page hears no "now available" signal.
- The availability result is a status message ("information … on the waiting state of an application" / result of the check). The SC's excepted-examples note says control state changes are handled by 4.1.2 and are *already* announced when relevant — but that does not discharge the obligation to announce the *availability status* that the removed busy text represented. Here neither path fires: the busy text is gone silently and no status replaces it.
- Net: an AT user cannot tell whether a table was found. Fix: replace the busy text with "Table available — you can reserve" in `#avail` rather than clearing it.

## Expected ACT-style outcome
**failed** (SC 4.1.3 — the end of the waiting state / availability outcome is conveyed only by removal of the busy text plus a visual control change, with no status message announced to AT).

## Why automated tools miss it
At every snapshot the markup is valid: a real live region, labeled selects, and a native `<button disabled>` (valid, and toggling `disabled` is legitimate). axe/WAVE/Lighthouse never press "Check," never observe the live region being emptied, and see a button-enable as a normal `disabled` toggle — not as a missing *status* announcement. They cannot judge that the availability outcome was a status message owed a "now available" string, nor that the vanished spinner was the only "done" cue. That is a temporal, workflow-meaning inference, not a markup check.

## Citation
> "In situations where status text is entirely removed, its absence may itself convey information about the status. The most obvious example of this is where a message is displayed that the system is "busy" or "waiting". For a sighted user, when this text disappears, it is normally an indication that the state is now available. However non-sighted users would be unaware of this change, unless the end of the waiting state results in a change of context for the user. Where updating the visible message (e.g., to "system available") is not feasible, the use of a non-visible status message, such as "system available", ensures equivalent status information is provided."
— wcag-understanding/status-messages.html ("Removal of status text")

> "After a user activates a process, an icon symbolizing 'busy' appears on the screen. The screen reader announces "application busy"."
— wcag-understanding/status-messages.html (Status message examples — the busy/waiting case whose END this page leaves silent)
