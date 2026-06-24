# case-05 — "Konami-code" burst (↑↑↓↓BA, <600 ms between keys) is the only way to unlock the discount

## Scenario
A limited-edition e-commerce drop (Pixel Forge keycaps). The founders' discount price is gated behind
a code that is revealed only when the visitor enters the six-key combo **↑ ↑ ↓ ↓ B A** — and each
keystroke must land within **600 ms** of the previous one. If any gap between consecutive keys exceeds
600 ms, the sequence resets to the first key. The revealed code is the *only* way to obtain the
founders' price (there is no "reveal code" button, link, or alternative). What looks like a playful
easter egg actually gates an essential commercial function behind a timed, multi-keystroke burst.

## Attribute tuple
- **Content domain:** e-commerce / limited product drop (gamified promotion)
- **UI component / pattern:** "cheat-code"/Konami-style key sequence detector revealing a promo code
- **Host-language construct:** document-level `keydown` sequence matcher with a per-key inter-keypress window
- **Locale / i18n:** en
- **Failure mechanism:** multiple keystrokes that must be entered within a short period of time (whole sequence at burst cadence), with no untimed path to the same function

## Developer persona
A growth engineer thought a Konami-code easter egg would make the drop feel exclusive and
shareable ("the people who get it, get it"). They lifted a classic Konami-code snippet from a gist —
which already resets on any wrong/late key — and wired it to reveal the promo code. Because it
started as a gimmick, no one treated the discount as an essential function or built a non-gimmick way
to get the same price; the timed sequence quietly became the sole unlock path.

## Element / selector carrying the issue
The document-level `keydown` sequence handler. The timing gate is `WINDOW_MS = 600` between
consecutive keys in `SEQ = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','b','a']`; exceeding it calls
`reset()`. The revealed `#vault` code (`FORGE-FOUNDER-30`) drives the `#apply` discount. No other
control reveals it.

## Exact accessibility mechanism
Every individual key in the combo is reachable (the page listens globally), so operability per se is
not the issue. The barrier is temporal and second-limb: the essential function — obtaining the
founders' price — requires executing six keystrokes in sequence with sub-600 ms gaps. Switch and
scanning users (cadence far slower than 600 ms), speech-input users (each arrow/letter is a separate,
slow utterance), sip-and-puff users, on-screen-keyboard users, and users with tremor or limited
dexterity cannot complete the burst before it resets. Because the timed sequence is the only way to
reveal the code, no untimed keyboard path to the function exists and Test 4.B cannot pass.

## Expected ACT-style outcome
**failed** (SC 2.1.1, second limb / Trusted Tester Test 4.B `2.1.1-no-keystroke-timing`). An
essential function requires multiple keystrokes within a short period of time, and no keyboard method
without the timing requirement is provided.

## Why automated tools miss it
The visible DOM is clean: a focusable, named unlock panel, a labeled promo field, a real checkout
button. No automated checker types a six-key sequence at varying speeds to discover that only a fast
burst reveals the code, nor can it judge that the revealed code is the sole route to an essential
price. The entire requirement lives in the runtime `keydown` sequence/timing logic — invisible to
static markup analysis, and outside the operability-only scope of the two ACT 2.1.1 rules.

## Citation
**Reference:** WCAG 2.2 Understanding — Keyboard (`wcag-understanding/keyboard.html`)
> "Examples of \"specific timings for individual keystrokes\" include situations where a user would be required to repeat or execute multiple keystrokes within a short period of time or where a key must be held down for an extended period before the keystroke is registered."

**Reference:** Trusted Tester v5.1.3, Test 4.B (`refs/trusted-tester/sc-2.1.1-keyboard.md`)
> "Individual keystrokes do not require specific timings for activation of functionality."
