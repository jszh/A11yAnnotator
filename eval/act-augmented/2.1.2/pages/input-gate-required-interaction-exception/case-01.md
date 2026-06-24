# case-01 — Required email gate that holds forward Tab while invalid, releases on valid keyboard entry (PASS)

## Scenario
A public-library account-signup form. The required "Email address" field installs a
`keydown` handler that suppresses a plain forward Tab **only while the value is not yet a
valid e-mail address**. A keyboard user who tabs on the empty field does not advance, so
the field LOOKS like a keyboard trap. The instant the user types a syntactically valid
address with the keyboard, the gate releases: forward Tab moves to the password field, the
"Create account" button, the "Need help signing up?" link, and on to the rest of the page.
Shift+Tab is never blocked, so the user can always retreat.

## Attribute tuple
- **content-domain:** public-library / civic membership services
- **UI-component/pattern:** required single-line form field acting as a sequential gate (stepper-style "complete this before proceeding")
- **host-language construct:** native `<input type="email" required>` + a scoped `keydown` Tab interceptor that respects `checkValidity()`
- **locale/i18n:** en-GB
- **failure-mechanism:** NONE — this is the conformant boundary variant (input-gate exception, keyboard-satisfiable)

## Developer persona
A mid-level developer on the library's small web team was asked to "make sure people don't
skip the email field." Instead of a heavy modal, they wrote a tiny gate that holds Tab
until the field validates, deliberately leaving Shift+Tab open and releasing the moment the
value is valid — a careful, conformant implementation of a required-field gate.

## Element / selector carrying the issue
`#email` — the required e-mail input whose `keydown` handler conditionally suppresses
forward Tab. The behaviour to evaluate is the *gate*, not a static attribute.

## Exact accessibility mechanism
A keyboard-only or switch user who tabs while the field is empty/invalid experiences a
"dead" Tab and could mistake it for a trap. But the gate is **keyboard-satisfiable**: the
required interaction (typing a valid e-mail) is performed entirely with the keyboard, and
once satisfied the focus is fully releasable — forward Tab reaches every subsequent control
and the rest of the page. Shift+Tab is never intercepted, so the user is never stranded.
This is exactly the carve-out in the Trusted Tester Note: a section requiring input before
allowing focus to progress is not a failure, **provided** the required interaction can be
completed by keyboard and focus then progresses. Here it can and does, so there is no trap.

## Expected ACT-style outcome
**passed** — SC 2.1.2 No Keyboard Trap. Focus can be moved away from the gated field using
standard navigation keys once the keyboard-completable required interaction is satisfied
(TT "Evaluate Results" 1.a and 2). The page is the deliberate PASS boundary that
distinguishes a legitimate satisfy-then-advance gate from a genuine trap.

## Why automated tools miss it
axe-core, WAVE and Lighthouse evaluate the static DOM. The field has a correct `<label>`,
a valid `type`, `required`, and `aria-describedby`; nothing is missing or malformed, so no
rule fires. The gate is a runtime keyboard behaviour — the scanners never press Tab, so
they cannot observe either the hold-while-invalid or the release-on-valid. Even a human who
taps Tab once on the empty field could wrongly flag a trap; correctly judging PASS requires
recognising the gate's INTENT (require the field first) and verifying it is satisfiable by
keyboard and then releases — a semantic/interaction judgment no tool performs.

## Citation
> **Reference:** Trusted Tester v5.1.3 — SC 2.1.2 No Keyboard Trap, Test 4.C, How to Test
> step 2.b Note (`refs/trusted-tester/sc-2.1.2-no-keyboard-trap.md`)
>
> **Quote (verbatim):** "*Note:* If a section of a page requires input or interaction
> before allowing focus to progress to the rest of the page, this is **not** a failure."
>
> **Quote (verbatim):** "Keyboard focus can be moved away from an element using either:
> a. Standard navigation keys, OR b. Custom keystrokes that are **documented and available**
> to users in the application."
