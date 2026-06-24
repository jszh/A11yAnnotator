# case-05 — Free-hand signature canvas on a loan agreement: legitimate path-of-movement EXCEPTION, must NOT be flagged (PASS)

## Scenario
Meridian Bank's auto-loan e-signing page asks the borrower to draw their handwritten signature in a
`<canvas>` with finger, stylus, or mouse. The canvas captures free-hand pen strokes via pointer
`pointermove` — the recorded value is the literal shape of the curves and loops. Every other function on
the page (Clear signature, Type your legal name, Agree & sign) is keyboard-operable. This is the
exception-handling test: a pointer-only drawing surface that **correctly invokes the SC 2.1.1
path-of-movement exception** and must NOT be reported as a failure.

## Attribute tuple
- **Content domain:** online banking / fintech (loan e-signature)
- **UI component / pattern:** free-hand signature pad (`<canvas>` stroke capture)
- **Host-language construct:** `<canvas role="img">` with `pointerdown`/`pointermove`/`pointerup` stroke drawing; surrounding keyboard-operable form controls
- **Locale / i18n:** en-US, USD currency terms
- **Failure mechanism:** none — this is the protected exception; a handwritten signature is path-dependent and has no keyboard equivalent

## Developer persona
A fintech engineer implementing e-sign correctly. They know a wet-style signature must be captured as
free-hand strokes (path-dependent) and that there is no sensible keyboard way to draw one, so they gave
the canvas a descriptive accessible name and made every *other* action — clearing, typing the printed
legal name, submitting — fully keyboard-operable. They are relying on the SC's path-of-movement exception
for the drawing surface itself, which is the intended use of that clause.

## Element / selector carrying the issue
`canvas#sig` — the free-hand signature surface. It is operated by pointer only, but its underlying
function (drawing a handwritten signature) is genuinely path-dependent and exempt; it is not a defect.

## Exact accessibility mechanism
A keyboard-only user cannot "draw" a signature on the canvas — but that is exactly the small class of
input the SC excludes, because a handwritten signature's value depends on the *path* of movement (the
shape of every stroke), not on endpoints, and there is no known keyboard equivalent that does not require
an inordinate number of keystrokes. It is the same class as free-hand drawing and watercolour painting
that the SC's normative text and Understanding Example 4 carve out. The canvas carries a descriptive
accessible name so AT users understand what it is, and all surrounding functions (Clear, type name,
submit) are keyboard-operable. Therefore the page satisfies SC 2.1.1: the only non-keyboard function is a
legitimately path-dependent one.

## Expected ACT-style outcome
**passed** (SC 2.1.1 Keyboard — the only pointer-only function is path-dependent and falls under the
explicit exception; all other functions are keyboard-operable).

## Why automated tools miss it
This case is the inverse failure mode: a naive "pointer-only canvas with no keyboard interaction" rule
would FALSE-POSITIVE it. No automated tool can decide that *this* drag is genuinely path-dependent (a
handwritten signature) and therefore exempt, versus an endpoint-dependent drag (reorder/resize/drop) that
is NOT exempt — that distinction is the precise human semantic judgment the SC's exception clause demands.
Correctly *passing* this page requires the same function-level reasoning that correctly fails cases
01/03/04/06, applied in the opposite direction.

## Citation
**Reference:** WCAG 2.2 Understanding — Keyboard (`wcag-understanding/keyboard.html`)
> "The phrase \"except where the underlying function requires input that depends on the path of the user's movement and not just the endpoints\" is included to separate those things that cannot reasonably be controlled from a keyboard."

**Reference:** WCAG 2.2 Understanding — Keyboard, Examples (`wcag-understanding/keyboard.html`)
> "Example 4: Exception - Painting Program A watercolor painting program passes as an exception because the brush strokes vary depending on the speed and duration of the movements."

**Reference:** Trusted Tester v5.1.3 — SC 2.1.1 Keyboard (`refs/trusted-tester/sc-2.1.1-keyboard.md`)
> "Note (path-dependent exception): 2.1.1 does not apply to functions requiring input that depends on the *path* of movement, not just endpoints (e.g., free-hand drawing)."
