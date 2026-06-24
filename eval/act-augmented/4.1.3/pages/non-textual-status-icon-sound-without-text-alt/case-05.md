# case-05 — 2FA "verified" conveyed by a green check named aria-label="check" (symbol name, untranslated) in aria-live

## Scenario
A Spanish-language Banco Aurora two-step verification screen (`<html lang="es">`). After the 6-digit code
is submitted, the result appears in a real `aria-live="assertive"` region (present at load). Success is
shown solely by a green-check `<svg role="img" aria-label="check">`. The accessible name is non-empty and
even matches the glyph's *shape* — but it is the bare English word "check", which names the symbol rather
than the verification status, and is left untranslated on a Spanish page.

## Attribute tuple
- **content-domain:** online banking / fintech (security / 2FA)
- **UI-component/pattern:** one-time-passcode entry with success/failure result (dynamic-state: success of an action)
- **host-language construct:** inline `<svg role="img" aria-label="check">` injected into `aria-live="assertive"`
- **locale/i18n:** `lang="es"` UI, but the icon's `aria-label` is English "check" (mixed-language + symbol-name)
- **failure-mechanism:** present-but-misleading text alternative — names the icon's shape, not the status; also untranslated

## Developer persona
A contractor localized the bank's UI strings into Spanish but pulled the success icon from a shared
component library whose `aria-label="check"` was hard-coded in English and never run through the i18n
pipeline (icon labels lived in code, not the translation catalog). They reasoned "the icon has an
accessible name, and the name matches the check mark, so it's labeled" — missing that "check" describes
the glyph, not "your identity was verified", and that it is the wrong language for the page.

## Element / selector carrying the issue
`#otpResult[aria-live="assertive"] > svg[role="img"][aria-label="check"]` — the sole content of the live
region after a successful verification.

## Exact accessibility mechanism (what AT experiences, why it fails)
On success the assertive live region updates with a single `role="img"` SVG named "check", so the screen
reader announces the lone word "check" (rendered in an English voice on a Spanish page, or with Spanish
phonetics as a foreign token). The user is not told "Identidad verificada" / "Código correcto" — they
hear a symbol name and cannot determine whether the code was accepted, rejected, or expired. This is a
present-but-misleading text alternative: the name exists and even matches the shape, yet it conveys the
*icon*, not the *status* the live region exists to deliver. The correct shape is text such as
"Identidad verificada" inside the region (icon optional, accurately labeled in Spanish).

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
The live region is present and valid (F103 / live-region seeds PASS). The SVG has `role="img"` and a
non-empty `aria-label`, so name-presence rules PASS — and because the name "check" plausibly matches a
check-mark graphic, even a naive "does the name describe the image" heuristic is satisfied. No tool can
determine that "check" names the symbol instead of the verification status, nor that an English label is wrong
on `lang="es"`. Both the symbol-vs-status semantics and the language mismatch require human judgment.

## Citation
> **WCAG 2.2 Understanding 4.1.3 (Status message examples), `wcag-understanding/status-messages.html`:**
> "After a user submits a form, text is added to the existing form which reads, \"Your form was
> successfully submitted.\" The screen reader announces the same message."

> **WCAG 2.2 Understanding 4.1.3 (Non-textual status content), `wcag-understanding/status-messages.html`:**
> "Where an icon or sound indicates a status message, this information will be surfaced by the screen
> reader through a combination of two things: 1) existing WCAG requirements governing text alternatives
> (under Success Criterion 1.1.1 Non-Text Content), and 2) the requirement of this current success
> criterion to supply an appropriate role."

(The expected success message is "successfully submitted"-equivalent — here "Identidad verificada". An
icon named only "check" supplies a symbol name, not the status text the combination of 1.1.1 + the role
is meant to deliver.)
