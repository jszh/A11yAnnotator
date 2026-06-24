# case-02 — Autosave "Saving your changes…" banner disappears with no "Saved" replacement

## Scenario
An LMS essay editor autosaves a `contenteditable` draft. While saving, a "Saving your changes…" pill (pulsing dot) is injected into a top-bar `role="status" aria-live="polite"` region (announced on entry). On success the pill is simply **removed** — the save-status area goes blank with no "All changes saved" / "Saved at 2:14 PM" replacement. Sighted users infer success from the pill vanishing; AT users hear "Saving your changes…" then permanent silence and cannot tell whether the save finished or failed.

## Attribute tuple
- **content-domain:** higher-ed LMS / course assignment
- **UI-component / pattern:** autosave indicator on a rich-text editor (dynamic-state: optimistic UI / autosave with silent state change)
- **host-language construct:** `role="status" aria-live="polite"` pill removed via `textContent = ''`; debounced `input` handler on a `contenteditable` textbox
- **locale / i18n:** en-US
- **failure-mechanism:** waiting message announced on entry, then removed; "save complete" conveyed only by the pill's disappearance

## Developer persona
A product designer specced the autosave indicator from a Figma frame that showed two visual states: an amber "Saving…" pill and an empty (default) state once saved. The engineer implemented exactly the two visual states — show pill, then clear it — and wrapped the area in `role="status"` because a linter nudged them to. The "saved" *state* was visually represented by the *absence* of the pill, so no success text was ever authored.

## Element / selector carrying the issue
`#saveStatus` (`div[role="status"]`) — announces "Saving your changes…" on entry, then is cleared with no replacement string.

## Exact accessibility mechanism (what AT experiences, why it fails)
- **Entry (correct):** the polite region receives "Saving your changes…", which a screen reader announces.
- **Completion (the failure):** `finishSave()` runs `saveStatus.textContent = ''`. Emptying a polite live region announces nothing, so the AT user gets no "saved" feedback. The save's success is encoded purely as the *removal* of the busy text — a visual-only cue.
- Because autosave is anxiety-sensitive (did my essay save before the deadline?), the missing completion message is materially harmful: an AT user may keep typing unsure, or leave believing the draft was lost.
- The intended status — "All changes saved" — would qualify as a status message ("information to the user on the success … of an action"); writing it into `#saveStatus` instead of clearing the region would meet the SC.

## Expected ACT-style outcome
**failed** (SC 4.1.3 — the completion of the save, signalled to sighted users only by the disappearance of the busy text, is not conveyed to AT, and no replacement status message is provided).

## Why automated tools miss it
The DOM is always well-formed: a valid live region, a labeled editable region, a sensible toolbar. axe/WAVE/Lighthouse do not type into the editor, do not wait out the debounce, and do not observe that the live region is *emptied* rather than updated on success. No static rule can infer that the cleared pill represented "saved" and therefore owed an announcement — recognizing that the absence of the busy text carries the success status is a semantic, time-dependent inference.

## Citation
> "In situations where status text is entirely removed, its absence may itself convey information about the status. The most obvious example of this is where a message is displayed that the system is "busy" or "waiting". For a sighted user, when this text disappears, it is normally an indication that the state is now available. However non-sighted users would be unaware of this change … Where updating the visible message (e.g., to "system available") is not feasible, the use of a non-visible status message, such as "system available", ensures equivalent status information is provided."
— wcag-understanding/status-messages.html ("Removal of status text")

> "After a user submits a form, text is added to the existing form which reads, "Your form was successfully submitted." The screen reader announces the same message."
— wcag-understanding/status-messages.html (Status message examples — the success-of-an-action case this page omits)
