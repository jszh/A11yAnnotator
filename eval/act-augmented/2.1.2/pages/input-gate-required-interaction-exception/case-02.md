# case-02 — Postcode "gate" whose blur-refocus never releases, even after a valid value (FAIL)

## Scenario
Step 1 of a car-insurance quote wizard. The "Postcode" field is intended as a required
gate: hold focus on it until it is filled. The developer implemented the hold with a `blur`
handler that re-focuses the field — but **unconditionally**, with no validity check. The
result is that after the user types a perfectly valid UK postcode (e.g. `BS35 1HJ`) by
keyboard, every attempt to move focus away (Tab, Shift+Tab, or clicking elsewhere) is
immediately reversed and focus snaps back to the postcode field. Focus can never reach the
date-of-birth field or the "Continue" button. The page is visually identical to a
conformant required-field gate.

## Attribute tuple
- **content-domain:** insurance quote wizard (fintech)
- **UI-component/pattern:** multi-step wizard, Step 1 required field
- **host-language construct:** native `<input type="text" required>` + a `blur` → `setTimeout(focus)` re-focus loop with no validity guard
- **locale/i18n:** en-GB (UK postcode pattern)
- **failure-mechanism:** gate that never releases even after the required input is satisfied (satisfiable-but-not-releasing trap)

## Developer persona
A junior developer was told "don't let people skip the postcode." They copied a "force the
user back to the required field" `onblur` re-focus trick from an old forum answer and
dropped it in, testing only that focus *stayed* on the field — never testing that focus
could *leave* once a valid value was entered. The missing `if (valid) return;` guard turns
the intended gate into a trap.

## Element / selector carrying the issue
`#postcode` — the required field whose `blur` handler re-focuses it unconditionally
(`pc.addEventListener('blur', () => setTimeout(() => pc.focus(), 0))`), with no check of the
already-computed validity.

## Exact accessibility mechanism
A keyboard-only or switch user can complete the required interaction — typing a valid
postcode — entirely by keyboard. But completing it does **not** release the gate: the
unconditional re-focus means focus cannot be moved away from the field by any standard
navigation key. The user is trapped on Step 1 and can never reach the rest of the page. This
is precisely what the input-gate exception does NOT cover: the exception requires that focus
*can* progress once the interaction is done. Here it never progresses, so it is a genuine
keyboard trap (TT Test 2.a: "Keyboard users are unable to move away from an element").

## Expected ACT-style outcome
**failed** — SC 2.1.2 No Keyboard Trap. Keyboard focus cannot be moved away from the
postcode field using standard navigation keys, and there is no documented alternate
keystroke to escape, so both TT "Evaluate Results" conditions fail.

## Why automated tools miss it
The DOM is clean: a labelled `<input type="text" required autocomplete="postal-code">` with
a hint and a status region. There is no missing attribute or malformed markup, so axe-core /
WAVE / Lighthouse fire no rule. The trap exists only in the `blur` handler at runtime;
scanners do not blur the field, do not press Tab, and do not run the re-focus, so the
inescapable loop is entirely invisible to them. Distinguishing this FAIL from the conformant
PASS sibling requires a human to recognise the gate's intent, satisfy it by keyboard, and
then discover that focus *still* cannot leave — a contextual/interaction judgment.

## Citation
> **Reference:** Trusted Tester v5.1.3 — SC 2.1.2 No Keyboard Trap, Test 4.C, How to Test
> step 2 (`refs/trusted-tester/sc-2.1.2-no-keyboard-trap.md`)
>
> **Quote (verbatim):** "Determine whether there are any instances where keyboard
> navigation becomes **trapped**: a. Keyboard users are unable to move away from an element
> (e.g., using TAB or an arrow key)."
>
> **Quote (verbatim):** "*Note:* If a section of a page requires input or interaction
> before allowing focus to progress to the rest of the page, this is **not** a failure."
> (The exception requires focus to be *able* to progress once the interaction is done —
> here it never can, so the exception does not apply.)
