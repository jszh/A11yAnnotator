# case-05 — Address-verification error releasable only by a mouse-only "Use suggested address" button (FAIL)

## Scenario
A checkout shipping-address step. The "Street address" field is gated by an inline
verification error: forward Tab past it is suppressed until the value exactly matches the
carrier verifier's canonical form (`1450 Pinewood Avenue Northwest, Suite 200`). The user's
typed value (`1450 Pinewood Ave NW Ste 200`) is rejected. The only offered resolution is a
"Use suggested address" button rendered as `<div class="fix" onclick="useSuggested()">` —
not focusable, no role, no key handler. A keyboard user can edit the field but cannot
realistically reproduce the exact canonical string blind, and cannot activate the pointer-
only Fix button, so they can resolve the error by no keyboard means and forward Tab never
advances to the city/ZIP fields or the "Continue to payment" button.

## Attribute tuple
- **content-domain:** e-commerce checkout
- **UI-component/pattern:** inline async-validation error gating a required field, with a "Fix it" suggestion control
- **host-language construct:** native `<input>` + `role="alert"` + a pointer-only `<div onclick>` "Use suggested address" control; forward-Tab suppressed while unverified
- **locale/i18n:** en-US
- **failure-mechanism:** the only way to satisfy the gate is a mouse-only control (keyboard users can satisfy nothing)

## Developer persona
A developer integrated a third-party address-verification API that returns a canonical
suggestion. They surfaced the suggestion with a clickable styled `<div>` "Use suggested
address" chip inside the error and gated forward Tab on the field being verified — testing
only with a mouse, where one click resolves everything. They never considered that the chip
(the sole practical resolution) is keyboard-unreachable.

## Element / selector carrying the issue
`#street-alert .fix` — the `<div class="fix" onclick="useSuggested()">` "Use suggested
address" control, the only practical way to satisfy the verification gate, which is not
keyboard-operable. The Tab suppression lives on `#street` (`keydown` blocks forward Tab
while `!verified()`).

## Exact accessibility mechanism
The required interaction is "make the street address pass verification." The verifier accepts
only its exact canonical string; the user's free-typed value never matches, and the one
offered shortcut — the "Use suggested address" chip — is a `<div onclick>` exposed to AT only
as static text, not in the tab order and with no key handler. A keyboard or switch user
therefore cannot clear the error by any keyboard means, and the forward-Tab suppression
keeps them stranded on the street field with no path to the rest of the form or page. Because
the gating interaction is not keyboard-performable, the input-gate exception does not apply
and this is a keyboard trap (TT Test 2.a: unable to move away from an element).

## Expected ACT-style outcome
**failed** — SC 2.1.2 No Keyboard Trap. Keyboard focus cannot be moved away from the street
field because the only mechanism that satisfies the gate is pointer-only, and no documented
alternate keystroke is offered, so both TT "Evaluate Results" conditions fail.

## Why automated tools miss it
Every static element is well-formed: a labelled `<input>`, an `aria-invalid` flag, a
`role="alert"` message, and a `<div>` with non-empty text and an `onclick`. No rule fires —
nothing declares the `<div>` an interactive control, and the input has a proper label. The
trap emerges only at runtime from the combination of forward-Tab suppression with a pointer-
only resolution. Scanners never run the verifier, never press Tab, and never click, so the
keyboard dead-end is invisible. A human must discover by mouse that the "Use suggested
address" div is the only fix, then confirm it cannot be reached or activated by keyboard.

## Citation
> **Reference:** Trusted Tester v5.1.3 — SC 2.1.2 No Keyboard Trap, Test 4.C, "Evaluate
> Results" (`refs/trusted-tester/sc-2.1.2-no-keyboard-trap.md`)
>
> **Quote (verbatim):** "Keyboard focus can be moved away from an element using either:
> a. Standard navigation keys, OR b. Custom keystrokes that are **documented and available**
> to users in the application."
>
> **Quote (verbatim):** "*Note:* If a section of a page requires input or interaction
> before allowing focus to progress to the rest of the page, this is **not** a failure."
> (Applies only when the interaction is keyboard-completable; here the sole resolution is
> mouse-only, so the page fails.)
