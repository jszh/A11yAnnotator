# case-03 — Grid captures Tab/arrows/Esc; advice names Ctrl+Alt+G but the handler listens for Ctrl+Alt+B — the advised exit never fires (FAIL)

## Scenario
A clinical lab-results entry app (Helix Clinical Informatics, CBC panel). The result values are
typed into an embedded **spreadsheet-style data grid**: by design, **Tab and the arrow keys are
intercepted to move between cells** and never leave the grid (the classic embedded-application
situation the Understanding intent describes). Because the standard keys are captured, the page
*publishes advice* for a non-standard exit — a visible note, also wired via `aria-describedby`,
reads "To leave the grid and return to the page, press **Ctrl+Alt+G**." On its face this is exactly
the conditional-pass form: a non-standard exit is needed, and the user is advised of it. **But the
keydown handler tests `e.ctrlKey && e.altKey && e.code === 'KeyB'`** — it honours Ctrl+Alt+**B**,
not the advertised **G**. The advised key is dead. Esc is also swallowed (`preventDefault`), and Tab
walks cells, so **no keyboard method moves focus out of the grid** — a genuine keyboard trap.

## Attribute tuple
- **Content domain:** healthcare / clinical informatics (lab results entry)
- **UI component / pattern:** embedded spreadsheet-style editable data grid (`contenteditable` `role=textbox` cells) that captures Tab + arrows
- **Host-language construct:** `table` of `role=textbox` cells + grid `keydown` that intercepts Tab/arrows/Esc and a typo'd combo check (`e.code === 'KeyB'` instead of `'KeyG'`)
- **Locale / i18n:** en
- **Failure mechanism:** standard exits (Tab, arrows, Esc) are all captured, so an exit is genuinely needed; advice correctly names a non-standard exit (Ctrl+Alt+G) but the implementation listens for the wrong key (Ctrl+Alt+B), so the *advised* method never fires — the conditional-pass advice clause is not actually satisfied

## Developer persona
A health-IT developer built a fast keyboard-driven entry grid where Tab and arrows walk cells (so
clinicians can key a column without reaching for the mouse). Knowing Tab no longer exits, they added
an escape shortcut and a help note. A content author wrote the note as "Ctrl+Alt+G" (G for grid),
but the developer bound the handler to `e.code === 'KeyB'` from a copied snippet and verified the
feature only with the mouse (clicking the "Review & sign off" link), so the mismatch shipped. The
advice text and the handler disagree, and the disagreement is only visible to a keyboard user who
presses the advertised combo.

## Element / selector carrying the issue
`#grid` (the editable data grid). The defect is the line
`if (e.ctrlKey && e.altKey && e.code === 'KeyB')` in the grid's `keydown` listener; the advice
element is `#gridHelp` ("…press Ctrl+Alt+G"). The advised key (G) and the matched key (B) disagree,
and there is no standard-key fallback because Tab, the arrows, and Esc are all `preventDefault()`ed.

## Exact accessibility mechanism
A keyboard/AT user is inside the grid. Tab and arrows only hop between cells (expected for a grid),
and Esc does nothing — so the user reads the advice, presses **Ctrl+Alt+G**, and focus does not
move: the handler only reacts to Ctrl+Alt+**B**. There is no other keyboard route out of the grid,
so focus is trapped. Unlike the prior version of this case (which had a focusable Cancel button that
Tab+Enter could still reach), here **every** keyboard path out is either captured or broken, so
SC 2.1.2 truly fails. The conditional-pass clause — content may pass *provided the user is advised
how to untrap focus* — is not met, because the advised method does not function; advice pointing at
a non-working key is not effective advice.

## Expected ACT-style outcome
**failed** (SC 2.1.2). Because Tab, the arrows, and Esc are all intercepted and the only documented
exit (Ctrl+Alt+G) is mis-wired to Ctrl+Alt+B, keyboard focus cannot be moved away from the grid by
any keyboard means. No standard exit method works AND the advised non-standard method does not fire.

## Why automated tools miss it
A checker scanning for "documented escape" finds reassuring, correctly-worded advice ("press
Ctrl+Alt+G") surfaced both visibly and via `aria-describedby`, and the markup is a valid grid with
focusable cells — so it passes. No static analyzer cross-checks the human-language advice (G)
against the key the handler actually matches (B), and none enters the grid, presses the advertised
combo, and observes that focus stays put. Detecting it requires reading the instruction, pressing
the named keys, and confirming the trap — all human/runtime acts. This is distinct from the sibling
cases: here advice IS present and names a non-standard method (unlike case-02 / case-06, which trap
with NO advice), the trap is global rather than positional (unlike case-05), and the failure is the
advised key not firing rather than a deliberate `preventDefault` on Esc.

## Citation
**Reference:** WCAG 2.2 Understanding — No Keyboard Trap (`wcag-understanding/no-keyboard-trap.html`)
> "If untrapping focus requires a different method (rather than unmodified arrow keys, the Tab key, or other \"standard exit methods\"), content can still pass this criterion provided that the user is advised how they can untrap focus using their keyboard interface."

**Reference:** WCAG 2.2 Understanding — No Keyboard Trap (`wcag-understanding/no-keyboard-trap.html`)
> "Keyboard focus is not considered trapped when the user can navigate away from a component using only a keyboard interface, and if it only requires unmodified arrow or Tab keys or other \"standard exit methods\"."

**Reference:** Trusted Tester v5.1.3, Test 4.C — How to Test (`refs/trusted-tester/sc-2.1.2-no-keyboard-trap.md`)
> "Determine whether the alternate command(s) work."
