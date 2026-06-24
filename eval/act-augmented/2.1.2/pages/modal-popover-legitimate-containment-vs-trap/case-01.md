# case-01 — Patient-portal refill modal: `<dialog open>` traps Tab, no Close + no Esc (FAIL)

## Scenario
"Meadowbrook Health" patient portal, Medications page. A native `<dialog open>` renders
immediately as a refill-request modal containing a quantity `<select>`, a pharmacy
`<input>`, a notes `<input>`, and a "Submit refill request" button. A hand-rolled focus
trap cycles Tab last-to-first and first-to-last among those four controls. The dialog
has **no Close, no Cancel, and no Esc handler**. A mouse user can click the dark backdrop
to leave (a `mousedown` listener calls `dlg.close()`); a keyboard user has no exit at all.
This is the legitimate-modal carve-out turned into a trap: containment is fine, but the
user can never "untrap" and leave with the keyboard.

## Attribute tuple
- **content-domain:** healthcare / patient portal / pharmacy
- **UI-component/pattern:** APG "dialog (modal)" — native `<dialog open>` refill form
- **host-language construct:** HTML `<dialog open>` + JS `keydown` Tab-wrap trap; backdrop `mousedown` close
- **locale/i18n:** en-US
- **failure-mechanism:** focus cycle has no keyboard-reachable dismiss — no Close control AND no Esc handler; only a mouse backdrop-click escapes

## Developer persona
A junior front-end developer at the health system was told to "make the refill form pop
up like a real dialog." They reached for the native `<dialog>` element (good instinct) but
shipped it with the `open` attribute hard-coded in the markup rather than calling
`dialog.showModal()` from script — so the user agent's *built-in* Esc-to-cancel behaviour
(which only fires for dialogs opened via `showModal()`) is never armed. They then pasted a
generic "trap focus in a modal" `keydown` snippet that only handles `Tab`, and added a
backdrop-click-to-close handler because that is how the designer demoed it with a mouse.
They tested with a mouse, saw it close, and shipped. No keyboard pass was ever done.

## Element / selector carrying the issue
`#refill` (the `<dialog open>`). The trap is the `keydown` listener on `#refill` (handles
only `Tab`); the missing exit is the absent Close/Cancel control and the absent `Escape`
branch. The mouse-only escape is the `mousedown` listener that calls `dlg.close()`.

## Exact accessibility mechanism
A keyboard or screen-reader user lands inside the dialog (initial focus is set to the
`<select>`). Tabbing forward: select → pharmacy → notes → Submit → (wraps) → select,
forever. Shift+Tab wraps the other way. Pressing **Esc does nothing**: the `keydown`
handler early-returns for any key that is not `Tab`, and because the dialog was rendered
with `open` rather than opened via `showModal()`, the browser's native Esc-cancel is not
active either. There is no Close or Cancel control to Tab to. The only dismissal —
clicking the backdrop — requires a pointer. A switch user, a magnifier user driving by
Tab, and a screen-reader user are all permanently stranded inside the form and cannot
reach the rest of the page. Per the Understanding, modal containment is allowed only "as
long as the user knows how to 'untrap' the focus and leave" — here there is no keyboard
way to leave at all. Verdict: **FAILED**.

## Expected ACT-style outcome
**failed** — SC 2.1.2 No Keyboard Trap (Level A), legitimate-containment-vs-trap limb.
Focus is restricted to a modal with no keyboard-operable dismiss (no Close, no working
Esc), so focus cannot be moved away using the keyboard.

## Why automated tools miss it
The DOM is impeccable to a static scanner: a genuine `<dialog>` element (so role and modal
semantics are inferred by the UA), an `aria-labelledby` resolving to a real `<h2>` title,
a `<label>` for every field, accessible names everywhere, and zero contrast problems —
axe-core, WAVE, and Lighthouse all report no issue. The defect is purely behavioural and
requires two judgments a tool cannot make: (1) actually pressing Tab repeatedly to observe
that the cycle never exits, and pressing Esc to observe it does nothing; and (2) reasoning
that a modal *may* legitimately contain focus, so the violation is not "focus is cycling"
but "there is no keyboard-operable way to dismiss." Tools never press keys and never reason
about the modal carve-out, so they cannot distinguish conformant containment from this trap.

## Citation
> **Reference:** WCAG 2.2 Understanding SC 2.1.2 No Keyboard Trap — "Intent"
> (`wcag-understanding/no-keyboard-trap.html`)
>
> **Quote (verbatim):** "There may be times when it's appropriate for a web page to restrict
> focus to a subsection of the content – for example, when the user is inside a modal dialog
> or popover. This does not fail the requirements of this criterion, as long as the user
> knows how to "untrap" the focus and leave that component."
>
> **Quote (verbatim, Trusted Tester Test 4.C):** (`refs/trusted-tester/sc-2.1.2-no-keyboard-trap.md`)
> "Keyboard focus **should remain within a modal dialog box** until it is closed (per Test 4.F
> Step 3); however, check for keyboard traps **within** the dialog."
