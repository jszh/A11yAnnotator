# case-04 — "Accept the waiver" checkbox gate: Space toggles, then forward Tab releases (PASS)

## Scenario
The final confirmation step of a 10K race registration. A required participant-waiver
section holds focus: forward Tab past the consent group is suppressed until the user checks
the "I have read and accept the participant waiver" checkbox. To anyone who tabs to the
checkbox and tries to Tab onward without checking it, Tab appears dead — it LOOKS like a
trap. But the checkbox is a real native `<input type="checkbox">`: a keyboard user reaches
it with Tab and toggles it with the Space key (the standard control), at which point the
gate releases and Tab advances to "Complete registration" and the rest of the page.
Shift+Tab is never blocked.

## Attribute tuple
- **content-domain:** events / race registration (nonprofit/charity)
- **UI-component/pattern:** required consent checkbox gating a confirmation step
- **host-language construct:** native `<input type="checkbox">` + a scoped `keydown` Tab interceptor that respects the `checked` state
- **locale/i18n:** en-GB
- **failure-mechanism:** NONE — conformant boundary variant (keyboard-satisfiable required-interaction gate)

## Developer persona
A volunteer developer for a community running club wanted to make sure no one could register
without accepting the waiver. They used a plain native checkbox (so Space works as expected)
and gated only the forward Tab while unchecked, deliberately leaving Shift+Tab open and
releasing on check — a small, correct required-interaction gate.

## Element / selector carrying the issue
`#agree` — the native consent checkbox whose `keydown` handler suppresses forward Tab only
while `!checked`. The behaviour under evaluation is the gate, not a static attribute.

## Exact accessibility mechanism
A keyboard or switch user Tabs to the waiver text region and then the checkbox. Pressing
Space toggles the checkbox — the standard, expected keyboard control for a checkbox, exposed
correctly in the accessibility tree (role checkbox, accessible name from the associated
`<label>`, checked state updated). Once checked, the gate releases and forward Tab reaches
the submit button, the "Edit my entry" link, and the rest of the page; Shift+Tab is never
intercepted. The required interaction is therefore fully keyboard-satisfiable and focus
progresses once it is done — exactly the input-gate exception in the TT Note, not a trap.

## Expected ACT-style outcome
**passed** — SC 2.1.2 No Keyboard Trap. Focus can be moved away from the consent section
using standard navigation keys after the keyboard-completable required interaction (checking
the box with Space) is satisfied (TT "Evaluate Results" 1.a and 2). This is a PASS boundary
variant that contrasts with the pointer-only-checkbox FAIL pattern.

## Why automated tools miss it
The checkbox is a correctly-labelled native control with a real `<label for>`; there is no
missing name, role, or state, so axe-core / WAVE / Lighthouse fire no rule. The hold-then-
release is a runtime keyboard behaviour: scanners never press Space or Tab, so they observe
neither the suppressed-Tab nor the release-on-check. Even a human who Tabs onward without
checking the box could mistake the dead Tab for a trap; judging PASS requires recognising
the gate's intent and verifying Space satisfies it and then releases focus — a semantic and
interaction judgment.

## Citation
> **Reference:** Trusted Tester v5.1.3 — SC 2.1.2 No Keyboard Trap, Test 4.C, "Evaluate
> Results" and How to Test step 2.b Note (`refs/trusted-tester/sc-2.1.2-no-keyboard-trap.md`)
>
> **Quote (verbatim):** "*Note:* If a section of a page requires input or interaction
> before allowing focus to progress to the rest of the page, this is **not** a failure."
>
> **Quote (verbatim):** "Keyboard focus can be moved away from each section of the page
> containing elements (not trapped in a "loop" preventing access to other elements) using
> either standard navigation keys OR documented custom keystrokes."
