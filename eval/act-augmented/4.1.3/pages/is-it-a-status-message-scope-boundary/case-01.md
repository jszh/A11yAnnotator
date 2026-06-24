# case-01 — Submit error shown inside a focus-taking modal dialog (excepted change of context → N/A)

## Scenario
A Halcyon Credit Union "Send a wire transfer" screen. The user reviews recipient details and presses
**Review & send**. The submit fails (the routing number belongs to a closed institution) and the page
opens a **modal dialog** (`role="dialog"`, `aria-modal="true"`) that **moves keyboard focus into
itself**, traps Tab, and supports Esc. The error text ("We couldn't send this wire…") lives entirely
inside that dialog. There is deliberately **no** `role="status"`, `role="alert"`, or `aria-live`
anywhere on the page.

This is the canonical excepted case for SC 4.1.3. Because the dialog takes focus, the error is delivered
via a **change of context** — already surfaced by the screen reader as a dialog — so it does **not** meet
the definition of a status message. The SC therefore **does not apply**, and the absence of a live region
is correct, not a defect.

## Attribute tuple
- **content-domain:** online banking / fintech (wire transfer)
- **UI-component/pattern:** modal dialog (APG Dialog pattern) with focus move + focus trap
- **host-language construct:** `role="dialog"` + `aria-modal="true"` + scripted `focus()` on open
- **locale/i18n:** en (en-US currency / routing context)
- **failure-mechanism:** NONE present — the page is a definitional-boundary N/A; the trap is the
  false-positive pressure to flag a "message after submit with no live region"

## Developer persona
A senior banking front-end engineer who knows the APG Dialog pattern well. They built submit errors as
a proper modal because wire transfers are irreversible and they want the user to acknowledge the failure
before retrying. They did **not** add `role=status`/`aria-live` — and that was the right call — but a
checklist-driven auditor (or a naive automated "4.1.3 lane") who only learned "messages after submit
need a live region" would wrongly write this up.

## Element / selector carrying the issue
`#dlg[role="dialog"][aria-modal="true"]` — the modal that takes focus on submit. The classification turns
on the scripted `document.getElementById('dlgClose').focus()` call inside the form's submit handler:
focus moves into the dialog, making this a change of context.

## Exact accessibility mechanism (what AT experiences, why it is N/A)
When the wire fails, the screen reader's focus is moved into the dialog. NVDA/JAWS/VoiceOver announce the
dialog by its role and accessible name ("We couldn't send this wire, dialog") and then read the described
body and error detail, because focus and `aria-modal` route the virtual cursor there. The user is fully
informed — the change of context did the announcing. A `role=status` would be redundant. Per the
Understanding, dialogs are explicitly listed as a change that is **not** a status message, so there is no
4.1.3 obligation to satisfy: the criterion is inapplicable.

## Expected ACT-style outcome
**inapplicable** — the page contains no content that meets the definition of a status message (the only
candidate message is delivered via a change of context). Per EN 301 549 C.9.4.1.3 / WCAG conformance,
"Not applicable: …the web page does not contain content relevant to … 4.1.3."

## Why automated tools miss it
There is nothing structurally wrong: a valid form, a valid `role="dialog"` with `aria-modal="true"`,
correct names, fine contrast. axe/WAVE/Lighthouse report nothing — but they also cannot make the
*positive* N/A determination this aspect requires. A naive 4.1.3 heuristic ("new message appeared after
an action but no `role=status`/`aria-live`") would FALSELY flag the dialog. Distinguishing
"no status message present (N/A)" from "status message present but not programmatically determinable
(fail)" requires recognizing that **focus moved into a modal** — a runtime + semantic judgment that the
message is a change of context and thus exempt. No DOM linter weighs focus movement against the
status-message definition.

## Citation
> **WCAG 2.2 Understanding 4.1.3 (Examples of changes that are not status messages), `wcag-understanding/status-messages.html`:**
> "An author displays an error message in a dialog. Since the dialog takes focus, it is defined as a
> change of context and does not meet the definition of a status message. As a result of taking focus,
> the new change of context is already announced by the screen reader, and thus does not need to be
> included in the scope of this success criterion."

> **WCAG 2.2 Understanding 4.1.3 (Intent), `wcag-understanding/status-messages.html`:**
> "Changes of context, by their nature, interrupt the user by taking focus. They are already surfaced by
> assistive technologies, and so have already met the goal to alert the user to new content. As such,
> messages that involve changes of context do not need to be considered and are not within the scope of
> this success criterion."
