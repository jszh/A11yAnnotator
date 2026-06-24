# case-03 — PIN login that rejects the correct PIN when typed too slowly (keystroke dynamics)

## Scenario
An online-banking sign-in page (Harbor Credit Union). The form takes a member number and a 6-digit
security PIN. A hidden "keystroke-dynamics" layer measures the interval between consecutive PIN
keystrokes; if any gap exceeds **400 ms** the login is denied as an identity-verification failure —
**even when the entered PIN is exactly correct**. The visible help text frames this as a security
feature ("Our system verifies how you type, not just what you type"). The speed and rhythm of typing
is itself part of the authentication, so a user who types the right PIN slowly cannot sign in. No
slow-typing-tolerant or alternative sign-in method is offered on the page.

## Attribute tuple
- **Content domain:** fintech / online banking authentication
- **UI component / pattern:** PIN/password login form with behavioural-biometric "keystroke dynamics"
- **Host-language construct:** `<input type="password">` with a `keydown` inter-keystroke-interval check feeding the submit handler
- **Locale / i18n:** en
- **Failure mechanism:** typing speed/rhythm as authentication — "the speed at which password keystrokes are typed is part of password authentication" (Trusted Tester's own Test 4.B example)

## Developer persona
A security engineer integrated a behavioural-biometrics SDK pitched as "frictionless MFA — block
bots and credential-stuffing by checking the member's typing cadence." The vendor demo enrolled a
fast typist, and in QA the team typed their test PIN at normal speed and got in. The acceptance
criteria were "reject mismatched typing rhythm," with no carve-out for slow, assistive, pasted, or
on-screen-keyboard input. The feature shipped as the only sign-in path; the team never tested signing
in slowly or with assistive input.

## Element / selector carrying the issue
`#pin` (the PIN field) and the form `submit` handler. The timing gate is the `MAX_GAP_MS = 400`
inter-keystroke threshold; `slowGapSeen` causes a correct PIN (`CORRECT_PIN === '481902'`) to be
rejected.

## Exact accessibility mechanism
The form is fully operable in the Test 4.A sense — labeled fields, a real submit button, all
keyboard reachable. The barrier is temporal and second-limb: successful authentication requires the
individual PIN keystrokes to be entered fast enough (each gap ≤ 400 ms). Users who type slowly
(motor disabilities, cognitive load, unfamiliar layout), users of on-screen keyboards, switch
scanning, sip-and-puff, or speech input (which emits digits one slow utterance at a time), and users
who paste the PIN (zero keystrokes recorded) all fail the rhythm check despite supplying the correct
credential. Because the timed login is the only sign-in mechanism on the page, there is no untimed
keyboard path and Test 4.B cannot pass.

## Expected ACT-style outcome
**failed** (SC 2.1.1, second limb / Trusted Tester Test 4.B `2.1.1-no-keystroke-timing`). The sign-in
function depends on the specific timing of individual keystrokes, and no keyboard method free of that
timing requirement is provided.

## Why automated tools miss it
The DOM is a textbook-accessible login form: associated labels, `aria-describedby` help, a native
submit button, full keyboard reachability — axe-core, WAVE, and Lighthouse all pass it. None of them
types a correct PIN slowly and observes that the login is rejected. The rhythm requirement lives
entirely in the runtime inter-keystroke-interval comparison and the submit-time `slowGapSeen` check,
which static analysis cannot see. This is the canonical Test 4.B example that ACT's two operability
rules do not cover.

## Citation
**Reference:** Trusted Tester v5.1.3, Test 4.B (`refs/trusted-tester/sc-2.1.1-keyboard.md`)
> "Determine whether there are instances where the **timing of keystrokes** is required to activate the element (e.g., the speed at which password keystrokes are typed is part of password authentication)."

**Reference:** WCAG 2.2 Understanding — Keyboard (`wcag-understanding/keyboard.html`)
> "Examples of \"specific timings for individual keystrokes\" include situations where a user would be required to repeat or execute multiple keystrokes within a short period of time or where a key must be held down for an extended period before the keystroke is registered."
