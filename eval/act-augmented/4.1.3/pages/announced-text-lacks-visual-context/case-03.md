# case-03 — Photo-app "Saved" toast omits the album name the popup visually overlaps

## Scenario
A photo-management web app ("Lumen Photos"), viewing the "Wedding" album. The album name appears in the
top bar and as the active (`aria-current="page"`) sidebar item. Each photo thumbnail has a "Save here"
button that adds it to the current album. Saving fires a bottom-center toast that floats over the
chrome and shows a green check + "Saved." The toast is a valid `role="status"` / `aria-atomic="true"`
live region, present in the DOM before the action, announced in full. But it announces only "Saved" —
not "Saved in 'Wedding' album," which is exactly the canonical example the WCAG Understanding gives.

## Attribute tuple
- **content-domain:** consumer photo-management app
- **UI-component/pattern:** transient toast / snackbar (APG status, auto-dismiss)
- **host-language construct:** fixed-position `<div role="status" aria-live="polite" aria-atomic="true">` whose text is set to "Saved"
- **locale/i18n:** en
- **failure-mechanism:** announced string omits the album-name context that the visible popup placement + surrounding chrome supply (the Understanding's verbatim "Saved in 'Wedding' album" case)

## Developer persona
A designer-turned-developer building the toast in a no-code-ish hand-coded prototype. They followed an
"accessible toast" blog post and correctly added `role="status"` and `aria-atomic`, satisfied that the
message would now be announced. They wrote the message as just "Saved" because, on screen, the
destination album is unmistakable — its name is in the header bar the toast sits beneath, and the
sidebar item is highlighted. They never considered that a screen-reader user does not perceive that the
toast is "over" the Wedding label, so to them "Saved" is complete. They had not read the Understanding's
photo-album example, which prescribes announcing the album name.

## Element / selector carrying the issue
`#toast` (`div[role="status"][aria-live="polite"][aria-atomic="true"]`), whose `#toastText` is set to
`"Saved"`. The album-name context lives in `#albumTitle` (top bar) and the active sidebar item — both
outside the toast.

## Exact accessibility mechanism (what AT experiences, why it fails)
On "Save here," the polite live region updates and the screen reader announces "Saved" (the check is
`aria-hidden`). The toast then auto-dismisses after 3.5s. A sighted user reads "Saved" *positioned over*
the "Wedding" header, so they understand the photo was filed in the Wedding album. A screen-reader user
hears only "Saved" with no destination — they cannot tell which album received the photo, and the toast
vanishes before they could navigate to discover the surrounding context (which a status message must
not require — F103 notes the user should not have to "manually discover" the information). The
Understanding's status-message examples explicitly model this as "Saved in 'Wedding' album." The
remediation is to include the album name (visible or offscreen) inside the atomic region.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
The toast is a present, non-empty, correctly-roled live region announced in full — it is not an F103
missing-role failure and not a partial-atomic clipping bug. axe/WAVE/Lighthouse have no rule that a
status string must name the *object/destination* of the action when that object is conveyed visually by
the toast's placement and the surrounding (unchanged, non-announced) page chrome. Detecting the gap
requires understanding that "Saved" floating over a "Wedding" header reads as "Saved in Wedding" to a
sighted user but as a bare "Saved" to AT — a semantic/spatial judgment no DOM scan performs.

## Citation
> **WCAG 2.2 Understanding 4.1.3, `wcag-understanding/status-messages.html` — Status message examples:**
> "After a user puts a photo in an album in an online photo app, the app dynamically displays a popup
> message of "Saved in 'Wedding' album", which is also read by a screen reader."

> **WCAG 2.2 Understanding 4.1.3, `wcag-understanding/status-messages.html` — "Non-displayed text specific to AT users":**
> "the proximity of new content to other pieces of information on the screen may provide a visual
> context that is lacking in the text alone."

> **WCAG Technique F103, `wcag-techniques/failures/F103.html`:**
> "Since the status message is not automatically presented to the user (i.e., instead, it must be
> manually discovered by the individual), it fails 4.1.3."
