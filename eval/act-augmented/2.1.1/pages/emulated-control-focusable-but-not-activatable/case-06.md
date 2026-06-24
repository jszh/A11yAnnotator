# case-06 — Banking "Review transfer": custom control activates on Enter only (PASS boundary)

## Scenario
An online banking transfer form ("Northbank Online") uses a custom primary control:
`<span class="btn-primary" role="button" tabindex="0" onclick="reviewTransfer()"
onkeydown="if (event.key === 'Enter') { event.preventDefault(); reviewTransfer(); }">`. The
control is focusable, announced as a button, and **activates on Enter** — but it deliberately
does **not** respond to Space. A naive reviewer who presses Space, sees nothing happen, and
concludes "broken keyboard control → 2.1.1 fail" would be **wrong**: the WCAG Understanding for
2.1.1 explicitly states that a custom control that reacts only to Enter still **satisfies** the
criterion. The action can be both reached and executed with the keyboard (via Enter), the rest of
the form (selects, amount input, Cancel link) is fully keyboard operable, so the page **passes**.

This boundary case sharpens the aspect: it forces the evaluator to test both Enter and Space AND
to apply the Understanding note, rather than mechanically failing any control that ignores Space.

## Attribute tuple + developer persona
- **content-domain:** finance / online banking (intra-account transfer)
- **UI-component/pattern:** transactional form with a custom primary "button" (`span role="button"`)
- **host-language construct:** `<span role="button" tabindex="0" onclick=... onkeydown=...(Enter only)>`
- **locale/i18n:** en-GB (£ amounts)
- **failure-mechanism:** NONE — Enter-only activation is conformant; this is the deliberate non-defect
- **persona:** A senior front-end engineer on the bank's web team read the WCAG Understanding note
  closely and knows that supporting Enter (the conventional default-action key) is sufficient for a
  custom control. To avoid the well-known "Space scrolls the page" pitfall on non-native controls,
  they chose to wire Enter only and documented the decision. The control is correct on purpose.

## Element / selector carrying the issue (none — this is the conformant control)
`.btn-primary[role="button"]` — *Review transfer*. It is focusable; **Enter activates it**;
Space intentionally does not.

## Exact accessibility mechanism (what AT experiences and why it PASSES)
- A keyboard/SR user fills From / To / Amount (all native form controls, fully operable), tabs to
  **Review transfer**, announced as **"Review transfer, button"**.
- Pressing **Enter** → `onkeydown` matches `event.key === 'Enter'`, calls `event.preventDefault()`
  (so Enter doesn't submit any enclosing form unexpectedly) and runs `reviewTransfer()`, which
  reveals the summary region. The function is reached AND executed via keyboard.
- Pressing **Space** does nothing — which is acceptable for a custom control under the
  Understanding note. (A visible "press Enter to continue" hint is also provided.)
- All functionality is operable through the keyboard → **passes 2.1.1**.

Verified behaviourally (headless Chromium): control is focusable; Enter activates (summary shown);
Space does not activate.

## Expected ACT-style outcome
**passed** (SC 2.1.1).

## Why automated tools miss it
Automated tools cannot make the *judgment* that this PASSES. A heuristic that fires on "custom
control with role=button does not handle Space" would produce a **false positive** here — exactly
the kind of over-firing that requires a human to suppress by applying the Understanding note. A
correct evaluation must (a) verify Enter genuinely activates the control at runtime and (b) know
that Enter-only is conformant for a custom control. Neither the runtime activation check nor the
normative-note interpretation is something axe/WAVE/Lighthouse perform; they would either ignore
the control or risk flagging it. This case exists to test that the evaluator does **not** fail a
conformant Enter-only control.

## Citation
> **WCAG 2.2 Understanding Keyboard — Intent (note)** (`wcag-understanding/keyboard.html`)
>
> "For instance, buttons that have focus can generally be activated using both the Enter key and the Space bar. If a custom button control in a web application instead only reacts to Enter (or even a completely custom key or key combination), this still satisfies the requirements of this success criterion."

Because the *Review transfer* control reacts to Enter (and the action can be both reached and
executed by keyboard), it satisfies 2.1.1 despite not responding to Space.
