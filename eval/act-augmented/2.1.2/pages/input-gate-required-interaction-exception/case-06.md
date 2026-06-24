# case-06 — Severe drug-interaction review panel: focus held, Esc disabled, but keyboard-satisfiable with a documented Alt+X exit (PASS)

## Scenario
A clinician e-prescribing screen. When the clinician clicks "Check interactions & sign," a
"Severe interaction — review required" panel (`role="dialog" aria-modal="true"`) opens and
**holds keyboard focus inside itself**: Tab and Shift+Tab cycle among the panel's controls,
and — deliberately, for patient safety — the standard `Esc` key does **not** dismiss it (a
clinician must not be able to reflexively blow past a severe interaction). In isolation this
has the exact shape of a keyboard trap. It is not one. The required interaction is fully
keyboard-satisfiable: each interaction row has a real native checkbox ("I have reviewed this
interaction") reached with Tab and toggled with Space; once every box is checked, "Sign &
continue" enables and releases focus back to the prescription. Independently, a clinician who
wants to back out is given a **documented non-standard exit announced on-screen inside the
panel**: "press Alt+X to leave without acknowledging and return to the prescription," and
Alt+X is wired and works.

## Attribute tuple
- **content-domain:** healthcare / clinical EHR e-prescribing (drug-interaction safety)
- **UI-component/pattern:** modal review panel as a required-acknowledgement gate (APG dialog with deliberate focus containment)
- **host-language construct:** `role="dialog" aria-modal="true"` with native `<input type="checkbox">` acknowledgements; `Esc` intentionally inert; a documented `Alt+X` custom keystroke that untraps focus
- **locale/i18n:** en-US (clinical)
- **failure-mechanism:** NONE — conformant boundary variant (focus held, but keyboard-satisfiable gate + documented custom-keystroke exit)

## Developer persona
A clinical-safety-minded developer was asked to make sure no clinician could sign past a
severe interaction by accident. They built a real focus-trapped modal (correct for a dialog),
deliberately disabled `Esc` so a reflexive keypress can't dismiss a safety warning, made the
acknowledgement boxes plain native checkboxes, and — knowing that disabling `Esc` removes the
usual exit — added a clearly worded on-screen instruction for a custom `Alt+X` escape and
wired it to work, exactly as the standard requires when the exit method is non-standard.

## Element / selector carrying the issue
`#scrim .panel` — the focus-containing review dialog. The behaviour under evaluation is the
*gate plus its exits*: the native `.ackbox` checkboxes (`#ack1`, `#ack2`) that satisfy it by
keyboard, the `#sign` button that releases focus on completion, and the documented `Alt+X`
keystroke (announced in `#escnote`) that untraps focus to the prescription without
acknowledging. No static attribute is the defect; the judgment is interactional.

## Exact accessibility mechanism
A keyboard or switch user lands inside the panel (focus is moved in on open) and finds Tab
cycling within it and `Esc` doing nothing — which superficially reads as a trap. But the
section is the input-gate exception: it requires interaction before focus progresses, and
that interaction is keyboard-completable (Space toggles each native checkbox, which is exposed
correctly with role checkbox, an accessible name from its `<label>`, and checked state). Once
all are checked, "Sign & continue" releases focus back to the prescription. Crucially, even
the *don't-acknowledge* path is keyboard-escapable: because the exit uses a non-standard
keystroke rather than `Esc`/`Tab`, the page **advises** the user of it on-screen ("press
Alt+X…") and the keystroke works, moving focus out of the panel. Per the Understanding doc a
non-standard exit passes provided the user is advised how to untrap focus, and per TT focus
can be moved away via documented, available custom keystrokes — so there is no trap.

## Expected ACT-style outcome
**passed** — SC 2.1.2 No Keyboard Trap. Keyboard focus can be moved away from the review
section either by completing the keyboard-satisfiable required interaction (Space-check each
box, then Sign) or by the documented custom keystroke Alt+X, satisfying TT "Evaluate Results"
1 (a OR b) and 2. This is a PASS boundary variant that exercises the *documented non-standard
exit* limb, distinct from the standard-key-release PASS siblings.

## Why automated tools miss it
The static DOM is clean and even exemplary: `role="dialog" aria-modal="true"` with an
accessible name, native labelled checkboxes, a real `<button>`, and a visible escape
instruction. Nothing is missing or malformed, so axe-core / WAVE / Lighthouse fire no rule —
and a structural ARIA check would actually *approve* the dialog markup. Whether focus is
genuinely escapable is a runtime fact: scanners never press Space, Tab, Esc, or Alt+X, so they
observe neither the satisfy-then-release nor the working documented escape. A human who taps
`Esc` once, finds it dead, and stops would wrongly flag a trap; judging PASS requires reading
the on-screen Alt+X instruction, verifying Space satisfies the gate and releases, and
confirming Alt+X actually untraps focus — a semantic + interaction judgment no tool performs.

## Citation
> **Reference:** WCAG 2.2 Understanding SC 2.1.2 No Keyboard Trap, "Intent" section
> (`wcag-understanding/no-keyboard-trap.html`)
>
> **Quote (verbatim):** "If untrapping focus requires a different method (rather than
> unmodified arrow keys, the `<kbd>Tab</kbd>` key, or other "standard exit methods"), content
> can still pass this criterion provided that the user is advised how they can untrap focus
> using their keyboard interface."
>
> **Reference:** Trusted Tester v5.1.3 — SC 2.1.2 No Keyboard Trap, Test 4.C, "Evaluate
> Results" and How to Test step 2.b Note (`refs/trusted-tester/sc-2.1.2-no-keyboard-trap.md`)
>
> **Quote (verbatim):** "Keyboard focus can be moved away from an element using either:
> a. Standard navigation keys, OR b. Custom keystrokes that are **documented and available**
> to users in the application."
>
> **Quote (verbatim):** "*Note:* If a section of a page requires input or interaction before
> allowing focus to progress to the rest of the page, this is **not** a failure."
