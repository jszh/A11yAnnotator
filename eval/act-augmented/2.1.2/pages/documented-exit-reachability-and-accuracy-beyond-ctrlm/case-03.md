# case-03 — Visible advice says "Ctrl+M" but the handler fires on Alt+M (right key, wrong modifier) (FAIL)

## Scenario
A rail-booking seat-selection step renders Coach 7 as an arrow-key seat grid (roving tabindex). Tab is
captured so focus stays in the seat map, and a custom keystroke advances to "Continue to payment". The
on-screen legend says, clearly and reachably, **"To leave the seat map, press Ctrl+M."** The instruction
is accurate-looking and present before the user enters the trap. But the `keydown` handler releases the
trap on **Alt+M**, not Ctrl+M (right key letter, wrong modifier). A keyboard user who reads the documented
combo and presses Ctrl+M stays trapped; only Alt+M — which is never advertised — actually exits.

## Attribute tuple
- **Content domain:** travel / rail ticket booking (seat selection step)
- **UI component / pattern:** arrow-key grid widget (roving tabindex seat map)
- **Host-language construct:** `role=grid` of `<button>` seats; `keydown` modifier check (`e.altKey` vs documented Ctrl)
- **Locale / i18n:** en/CH context (Zürich→Milano), `lang="en"`
- **Failure mechanism:** advice inaccurate — documented modifier (Ctrl) does not match the handler's modifier (Alt)

## Developer persona
A developer prototyped the exit with **Alt+M** (to avoid clashing with the browser's Ctrl shortcuts during
testing), then a content designer wrote the user-facing legend from the original spec, which had said
"Ctrl+M". The two were never reconciled: the prose shipped with Ctrl while the code shipped with Alt. Each
person validated only their own half — the dev pressed Alt+M and it worked; the writer checked the sentence
read correctly — so the mismatch survived.

## Element / selector carrying the issue
`.exit-note` (visible legend text "press Ctrl+M") versus the grid `keydown` handler on `#coach`, which
tests `e.altKey && key === 'm'`. The advice and the working escape name different modifiers.

## Exact accessibility mechanism
Focusing a seat sets `trapOn`; the grid's `keydown` captures Tab (preventing escape) and roves with arrow
keys. The release branch fires on `Alt+M`. AT/keyboard experience: the user reads or hears "press Ctrl+M to
leave the seat map," presses Ctrl+M, and nothing happens — focus remains on a seat (verified: after Ctrl+M
the active element is still seat 3A). Pressing the undocumented Alt+M moves focus to "Continue" (verified:
exit works). The documented exit is therefore **inaccurate**: it names a keystroke that does not move focus
away. G21 is met only when the *documented* feature is the one that actually exits.

## Expected ACT-style outcome
**failed** (SC 2.1.2 — a custom exit exists, but the user is advised of a keystroke that does not work; the
working keystroke is never disclosed).

## Why automated tools miss it
Every control is a real `<button>` with a visible name; the exit instruction is present, on-screen, and
reachable; the grid has roles. Nothing is missing or empty. The defect is a semantic mismatch between the
prose ("Ctrl+M") and the handler's modifier check (`altKey`). A scanner does not read instructions, does
not parse the keydown modifier logic, and cannot cross-reference the two. Only a human who reads the advice
and then drives the keyboard — finding Ctrl+M dead and Alt+M live — can catch that the documented exit is
wrong.

## Citation
**Reference:** WCAG Trusted Tester v5.1.3 — SC 2.1.2 No Keyboard Trap, How to Test (`refs/trusted-tester/sc-2.1.2-no-keyboard-trap.md`)
> "Inspect any contextual/application help and documentation for notification of **available alternate keyboard commands** (non-standard controls, access keys, hotkeys) to escape/avoid the trap."
> "Determine whether the alternate command(s) work."

**Reference:** WCAG Trusted Tester v5.1.3 — SC 2.1.2, Evaluate Results (`refs/trusted-tester/sc-2.1.2-no-keyboard-trap.md`)
> "Custom keystrokes that are **documented and available** to users in the application."
