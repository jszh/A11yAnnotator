# case-02 — Dialog error ALSO duplicated into an assertive role=alert (over-announcement → fail)

## Scenario
A Cedar Mesa Pharmacy "Request a refill" screen for a controlled medication. Pressing **Submit refill
request** fails the early-refill rule. The page does two things at once:
1. opens a `role="alertdialog"` (`aria-modal="true"`) and **moves focus into it** — a change of context
   that already announces the error to AT (this alone would be N/A for 4.1.3, exactly like case-01); and
2. **also** writes the same error text into a persistent `role="alert"` `aria-live="assertive"` banner
   sitting at the top of the page, outside the dialog.

The screen-reader user therefore hears the failure **twice** — once from the focus-taking dialog and
again from the assertive live region. This is the **over-announcement / chattiness** failure direction
of this aspect: a status role is force-fed onto a message that a change of context already delivered.

## Attribute tuple
- **content-domain:** healthcare / pharmacy patient portal (controlled-substance refill)
- **UI-component/pattern:** modal `alertdialog` + a redundant persistent `role="alert"` banner
- **host-language construct:** `role="alertdialog"` (focus moved in) co-existing with `role="alert" aria-live="assertive"`
- **locale/i18n:** en
- **failure-mechanism:** redundant double announcement — assertive live region duplicating a
  change-of-context message that is already surfaced

## Developer persona
A well-meaning mid-level developer who got a prior audit ticket that said "form errors must be in a live
region for 4.1.3." They added the `role="alert"` banner to "be safe," not realizing the alertdialog they
already built moves focus and announces the error on its own. They tested visually (the banner looks
reassuring) and with a screen reader only briefly — long enough to confirm the error *was* announced,
not long enough to notice it was announced **twice** and that the assertive banner clobbers whatever the
user was reading.

## Element / selector carrying the issue
`#banner[role="alert"][aria-live="assertive"]` — the redundant live region. It is populated in the same
submit handler that opens `#dlg[role="alertdialog"]` and moves focus to `#dlgClose`. The defect is the
co-existence: either surfacing alone is fine; together they double-announce.

## Exact accessibility mechanism (what AT experiences, why it fails)
On submit, focus jumps into the alertdialog, so NVDA/JAWS/VoiceOver announce the dialog name + body
("Refill could not be submitted… cannot be refilled until day 60"). At the same instant the assertive
`role="alert"` region receives text, so the screen reader **interrupts** and reads essentially the same
message a second time, regardless of where the virtual cursor is. The user gets a stuttering, redundant,
attention-grabbing experience; on dialog close the persistent banner can re-fire on further mutation.
The Understanding explicitly warns that live regions/alerts applied where a change of context already
occurred risk making an app "too chatty," and that the SC's purpose is **not** to force authors to
generate new status messages. Forcing this one is the failure.

## Expected ACT-style outcome
**failed** — a status mechanism (assertive `role="alert"`) is misapplied to a message that is already
delivered via a change of context, producing redundant/over-assertive announcement. This is a quality
failure of the status-message implementation, not an N/A: the author *did* introduce a 4.1.3-governed
live region, and it is used inappropriately.

## Why automated tools miss it
The `role="alert"` region is exemplary ARIA: empty on load, populated after the action, assertive
politeness — exactly the pattern checkers are taught to *reward*. axe/WAVE/Lighthouse would pass it (or
even cite it as good practice). No automated tool reasons that the *same* error is concurrently delivered
by a focus-taking alertdialog, nor that two simultaneous announcements is a harm. Detecting the
double-surfacing requires understanding that the dialog already met the goal (change of context) and that
the live region is therefore redundant and over-chatty — a contextual, AT-behavioral judgment a static
scan cannot make.

## Citation
> **WCAG 2.2 Understanding 4.1.3 (Other uses of live regions or alerts), `wcag-understanding/status-messages.html`:**
> "Live regions and alerts can be usefully applied in many situations where a change of content takes
> place which does not constitute a status message, as defined in this success criterion. However, there
> is a risk of making an application too \"chatty\" for a screen reader user. User testing should be
> carried out to ensure the appropriate level of feedback is achieved."

> **WCAG 2.2 Understanding 4.1.3 (Other uses of live regions or alerts, note), `wcag-understanding/status-messages.html`:**
> "The purpose of this success criterion is not to force authors to generate new status messages. Its
> intent is to ensure that when status messages are displayed, they are programmatically identified in a
> way that allows assistive technologies to present them to the user."
