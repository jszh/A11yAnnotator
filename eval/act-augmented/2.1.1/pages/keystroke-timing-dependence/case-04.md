# case-04 — Hold-Space "slide to pay" PLUS an untimed "Confirm payment" button (Test 4.B PASS)

## Scenario
A mobile-style payment confirmation screen (Solace Wallet) for a $248 rent payment. The primary
visual control is a "Hold to slide & pay" slider that confirms the payment only after the Space bar
is held for 1500 ms — a keystroke-timing barrier on its own. **However**, directly beneath it the
page offers a plain **"Confirm payment"** button that completes the identical payment with a single,
untimed Enter or Space press. This is the boundary variant that exercises the Test 4.B allowance: a
timed path exists, but an untimed keyboard method to the same function is also provided, so the page
passes.

## Attribute tuple
- **Content domain:** fintech / consumer payments (peer / bill payment confirmation)
- **UI component / pattern:** "slide to confirm" (hold-to-activate) control + a conventional confirm button
- **Host-language construct:** `div[role="button"]` with `keydown`/`keyup` hold timing AND a sibling native `<button>` with a single-press click handler
- **Locale / i18n:** en
- **Failure mechanism:** hold-duration timing on the slider, NEUTRALIZED by an untimed alternative (the Test 4.B "another keyboard-accessible method that does not require specific timing" pass condition)

## Developer persona
The design team shipped a trendy "slide to pay" confirmation to reduce accidental sends. The
accessibility lead reviewed it, recognized that a press-and-hold gesture is a keystroke-timing
barrier for switch and speech-input users, and required the team to add a conventional "Confirm
payment" button as an untimed equivalent before launch — explicitly to satisfy Trusted Tester Test
4.B. Both paths invoke the same `pay()` function.

## Element / selector carrying the issue (and its remedy)
- Timed control: `#slide` (`role="button"`), gated by the `HOLD_MS = 1500` Space-hold threshold.
- Untimed remedy: `button#confirmBtn` ("Confirm payment"), activated by a single Enter/Space press
  (standard `click`), invoking the same `pay()` function with no timing requirement.

## Exact accessibility mechanism
Both controls are reachable, named, and keyboard-operable. The slider requires a *sustained* Space
press (1500 ms), which switch, sip-and-puff, speech-input, and on-screen-keyboard users cannot
produce — in isolation a second-limb failure. But the "Confirm payment" button completes the exact
same payment with one discrete keystroke and no timing dependency. A keyboard-interface user who
cannot perform the hold simply tabs to the button and presses Enter once. Because a keyboard method
free of specific timing is provided for the function, the page meets Test 4.B.

## Expected ACT-style outcome
**passed** (SC 2.1.1, second limb / Trusted Tester Test 4.B `2.1.1-no-keystroke-timing`). A timed
path exists, but an untimed keyboard-accessible method for the same function is also provided —
exactly the Test 4.B pass condition. (Note: the slider's hold requirement remains a usability wart,
but the SC's normative requirement is satisfied by the untimed alternative.)

## Why automated tools miss it
Automated checkers see two reachable, named, keyboard-wired controls and report no error — which
happens to land on the right verdict here by accident, not by reasoning. They cannot detect that the
slider imposes a hold-duration timing barrier, and they cannot detect that the button is an *untimed
equivalent of the same function* — the very fact that turns a would-be failure into a pass. Both
determinations require a human to operate the controls and apply the Test 4.B allowance, which is why
this PASS is a meaningful boundary case rather than a trivially-clean page.

## Citation
**Reference:** Trusted Tester v5.1.3, Test 4.B — Evaluate Results (`refs/trusted-tester/sc-2.1.1-keyboard.md`)
> "A keyboard method is provided for functionality to be activated without requiring users to perform specific timings for activation."

**Reference:** Trusted Tester v5.1.3, Test 4.B — How to Test (`refs/trusted-tester/sc-2.1.1-keyboard.md`)
> "If timing-dependent functionality exists, determine if another keyboard-accessible method on the page does **not** require specific timing."
