# case-06 — "Your table is booked" success line silent, next to a non-status details card (in-scope success → fail)

## Scenario
An Olive & Thyme restaurant reservation form. On submit, the booking is confirmed **without a page
reload** and **without moving focus** (focus stays on the now-hidden "Reserve table" button). Two new
things appear:
- **(A)** a one-line success message — "Your table is booked. A confirmation has been emailed to you." —
  which **is** a status message (success / result of an action); and
- **(B)** a reservation-details card (Name / Date / Time / Party / Table), which is just the booking data
  being displayed — like a results list — and does **not** meet the status-message definition.

Neither is in a live region and focus is not moved. The details card being silent is **fine** (not a
status). The **success line** being silent is the **failure**: the Understanding's own example "Your form
was successfully submitted" is a status message, and here it is left programmatically undeterminable.

## Attribute tuple
- **content-domain:** restaurant reservation / booking
- **UI-component/pattern:** form submit confirmation (success banner + details summary, single-page)
- **host-language construct:** plain `<div class="confirm">` containing a styled success `<div>` and a
  `<dl>` details card; toggled via a `.show` class, no live-region attributes, no focus move
- **locale/i18n:** en
- **failure-mechanism:** genuine success status message rendered without `output`/`role=status`/
  `role=alert`/`role=log`/`aria-live` and without a focus change (F103)

## Developer persona
An agency front-end developer themed a booking widget. They reveal a tidy confirmation block on submit
and were careful to show full booking details. They treated the whole confirmation block as one chunk of
"content to reveal," wrapping nothing in a live region and leaving focus alone — reasoning (incorrectly)
that since the details aren't a status, none of it needs announcing. They never used a screen reader, so
they missed that a non-visual user, focus stranded on the hidden submit button, gets no signal the
booking succeeded and may press Enter again, double-booking.

## Element / selector carrying the issue
`#confirm .ok` / `#okText` — the success line "Your table is booked…". It is the in-scope status message
left without status semantics or focus. The sibling `.summary` `<dl>` (`#confirm .summary`) is the
non-status details card that is correctly fine as-is — the contrast is deliberate.

## Exact accessibility mechanism (what AT experiences, why it fails)
On submit the content changes without taking focus and without a page refresh — the first limb of the
status-message definition is met. The success line conveys the *result of an action* (a successful
submission), which the Understanding lists as a status message ("After a user submits a form, text is
added… 'Your form was successfully submitted.'"). Because the line lives in a plain `<div>` with no
`output`/`role=status`/`role=alert`/`role=log`/`aria-live`, and focus is not moved into it, NVDA/JAWS/
VoiceOver announce nothing on submit. The screen-reader user has no confirmation the reservation
succeeded. Per F103, a status message present but not surfaced by AT fails 4.1.3. The details `<dl>` does
not trigger any obligation — displaying booking data is not a status — so the failure is specifically the
silent success line, not the card.

## Expected ACT-style outcome
**failed** — a genuine success status message is present but not programmatically determinable through
role or properties, and no change of context (focus move) surfaces it (F103, steps 1–4 all true).

## Why automated tools miss it
A static scan sees a valid form, a valid success `<div>`, and a valid `<dl>` — all well-contrasted, no
missing attributes — so axe/WAVE/Lighthouse pass, and they never submit the form to observe the silent
reveal. The crux is classification: tools cannot determine that the "Your table is booked" sentence
*means* a successful result (a status) while the adjacent details card is merely the booking data (not a
status). That meaning-based discrimination — plus recognizing that focus did not move, so nothing
surfaced the success — is precisely the human interpretation the SC pivots on and that this aspect
isolates.

## Citation
> **WCAG 2.2 Understanding 4.1.3 (Status message examples), `wcag-understanding/status-messages.html`:**
> "After a user submits a form, text is added to the existing form which reads, \"Your form was
> successfully submitted.\" The screen reader announces the same message."

> **WCAG 2.2 Understanding 4.1.3 (Intent), `wcag-understanding/status-messages.html`:**
> "the list of results obtained from a search are not considered a status update and thus are not covered
> by this success criterion. However, brief text messages displayed about the completion or status of the
> search … would be status updates if they do not take focus or cause a page refresh."
