# case-06 — Pointer-only colour swatches that PASS because a keyboard `<select>` does the same job (boundary)

## Scenario
A furniture product page (Hearthwood, "Aria armchair"). The colour chooser appears twice:
(1) a labelled native `<select id="colour">` with four options, fully keyboard operable; and
(2) a row of round colour chips `<li onclick="pickColour(...)">` with no `tabindex`, no
`role`, and no key handler — pointer-only. Both are bound to the **same** `pickColour()`
function that recolours the preview and syncs the `<select>`. The swatches are a mouse
shortcut layered on top of the real menu.

## Attribute tuple
- **content-domain:** e-commerce furniture product detail
- **UI-component/pattern:** colour-swatch picker (variant chooser) alongside a native select
- **host-language construct:** `<li onclick>` swatches (pointer-only) + `<select>` (keyboard) bound to one routine
- **locale/i18n:** en-GB (£ pricing)
- **failure-mechanism:** *none that fails 2.1.1* — pointer-only handler present but an equivalent keyboard path exists (dual-method)

## Developer persona
A senior developer built the variant picker as a native `<select>` first (keyboard- and
screen-reader-friendly by default), then a designer asked for visible colour chips "so
people can see the colours." Rather than re-engineer the whole control, the developer added
the chips as a thin pointer-only shortcut that calls the same `pickColour()` and keeps the
`<select>` in sync, and marked the chip list `aria-hidden="true"` so AT users are guided to
the real menu instead of to dead duplicate nodes. The result is convenient for mouse users
and still fully operable for keyboard users.

## Element / selector carrying the issue
`.swatches li[onclick]` — the pointer-only colour chips (the F54-shaped element). The
discriminating element is `#colour` — the native `<select>` that provides the equivalent
keyboard route to the identical function.

## Exact accessibility mechanism
Taken alone, each `<li onclick>` is the classic F54 shape: a pointer event is its only
binding, with no `tabindex`/`role`/`keydown`. But 2.1.1 is about whether the *function* is
operable by keyboard, not whether every visible control is focusable. The colour-selection
function is fully available from the keyboard through the labelled `<select>`, which is in
the tab order, operable with arrow keys/typeahead, and calls the same `pickColour()`. A
keyboard-only user can therefore choose any colour and add the chair to the basket. The
swatches are additionally `aria-hidden="true"`, so screen-reader users are not led to the
non-operable duplicates and instead use the `<select>`. Because an equivalent keyboard
method for the same action exists on the page, this passes 2.1.1 (and 2.1.3) per the
Understanding "separate way to operate" note and Example 7's "comparable action" principle.

## Expected ACT-style outcome
**passed** — SC 2.1.1 Keyboard. This boundary case demonstrates that a pointer-only handler
is *not* sufficient to fail 2.1.1 on its own; the verdict requires confirming whether a
keyboard equivalent exists for the same function. (Contrast: case-01's stars, case-04's
slider value, and case-05's confirm action have NO keyboard alternative anywhere, so they
fail.)

## Why automated tools miss it
This is the inverse trap for automation. A naive heuristic that flagged "`<li>` with onclick
and no keyboard handler" would FALSE-POSITIVE here. Conversely, scanners that ignore the
chips entirely report nothing. Neither can perform the judgment that actually decides the
case: recognising that the chips are an F54-shaped control AND that the adjacent `<select>`
provides the equivalent keyboard route for the same function, so no failure exists. That
equivalence reasoning — mapping two different controls to one function and checking keyboard
reachability of at least one — is exactly the human Trusted-Tester step ("determine whether
another keyboard-accessible method on the page provides the same functionality").

## Citation
> **Reference:** WCAG 2.2 Understanding — Keyboard (Note: keyboard equivalent need not be
> the same control) (`wcag-understanding/keyboard.html`)
>
> **Quote (verbatim):** "This success criterion does not require that every visible control
> that can be activated using a mouse or touchscreen must also be focusable and actionable
> using the keyboard. The normative requirement is only that there must be a way for
> keyboard interface users to perform the same, or comparable, actions and to operate the
> content."
>
> **Reference:** Trusted Tester v5.1.3 — Test 4.A `2.1.1-keyboard-access`
> (`refs/trusted-tester/sc-2.1.1-keyboard.md`)
>
> **Quote (verbatim):** "If an element has **no keyboard access**, determine whether another
> keyboard-accessible method on the page provides the same functionality (e.g., one of two
> print methods is keyboard accessible)."
