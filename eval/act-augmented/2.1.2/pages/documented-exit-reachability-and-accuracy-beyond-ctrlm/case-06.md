# case-06 — Escape advice locked in a mouse-only popover AND describing the wrong key (FAIL)

## Scenario
A lease-onboarding "Signature Capture" step has a signature region whose legal-name field and Clear button
loop focus so the tenant completes the signature before tabbing on. The real, working exit is **Ctrl+M**.
The escape advice lives inside a popover that opens **only** from a round "i" badge — and that badge is a
`<div class="info-dot" onclick="togglePop()">` with **no `tabindex`, no `role`, and no key handler**, so a
keyboard user can never open it. Two human-only defects stack: the advice is (1) **unreachable by keyboard**
(mouse-only opener) and (2) **inaccurate** — the popover tells the user to "press Esc", but Esc is dead; the
working key is Ctrl+M. Even a user who somehow opened the tip would be misdirected.

## Attribute tuple
- **Content domain:** real-estate / property-management (e-signature onboarding)
- **UI component / pattern:** popover/tooltip opened by an icon badge, over a focus-looping signature region
- **Host-language construct:** `div[onclick]` opener (no tabindex/role/keydown); `focus`/`blur` loop; `Ctrl+M` keydown; advised `Esc`
- **Locale / i18n:** en-US, US E-SIGN Act context
- **Failure mechanism:** advice both keyboard-unreachable (mouse-only opener) AND inaccurate (documents Esc, real key is Ctrl+M)

## Developer persona
A developer building on top of an older click-to-toggle popover snippet attached the opener to a styled
`<div>` with `onclick` (the snippet never used a real `<button>`), and filled the tip with placeholder
guidance — "press Esc" — copied from a different modal where Esc *did* close things. The signature region's
actual exit was later implemented as Ctrl+M by someone else. Mouse testing showed the "i" opened the tip, so
it looked done; nobody Tabbed to the badge or checked that Esc matched the handler.

## Element / selector carrying the issue
`div#infoDot[onclick]` — the mouse-only popover opener (no `tabindex`/`role`/keydown), which gates the only
copy of the exit advice; and the advice text in `#popover` ("press Esc"), which names a key the handler does
not honor (real exit is Ctrl+M).

## Exact accessibility mechanism
Focusing the legal-name field engages the loop (blur re-focuses it). The opener is a non-focusable `<div>`,
so it is absent from the tab order and is not exposed as an actionable control to AT — a keyboard or
screen-reader user can never trigger the popover that holds the instruction (verified: `#infoDot` has no
`tabindex` and no `role`, tag `DIV`). Worse, the instruction is wrong: Esc does nothing (verified: after
Esc, focus is still on the legal-name field), while the undocumented Ctrl+M moves focus to "Finish"
(verified). So the documented exit is unreachable *and* incorrect — failing G21's "accessible manner within
the subset" on both reachability and accuracy.

## Expected ACT-style outcome
**failed** (SC 2.1.2 — focus is trapped; the only exit advice is behind a mouse-only opener and, even then,
names a non-working keystroke).

## Why automated tools miss it
The markup looks fine to a scanner: the field has an `aria-label`, Clear/Finish are real buttons, and an
escape-instruction string exists in the DOM. axe may not flag the `<div onclick>` at all (it has no name to
be "wrong") and cannot know that the popover it opens is the sole home of the exit instruction; nor can any
tool tell that "Esc" in the tip does not match the Ctrl+M handler. Catching either defect requires a human
to drive the keyboard — discovering the popover is unopenable, then discovering the documented key is dead.

## Citation
**Reference:** WCAG Technique G21 — Ensuring that users are not trapped in content (`wcag-techniques/general/G21.html`)
> "The objective of this technique is to ensure that keyboard users do not become trapped in a subset of the content that can only be exited using a mouse or pointing device."

**Reference:** WCAG Trusted Tester v5.1.3 — SC 2.1.2 No Keyboard Trap, How to Test (`refs/trusted-tester/sc-2.1.2-no-keyboard-trap.md`)
> "Inspect any contextual/application help and documentation for notification of **available alternate keyboard commands** (non-standard controls, access keys, hotkeys) to escape/avoid the trap."
