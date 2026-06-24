# case-02 — OTP verification: helper says "6-digit code" but the field accepts only 4 digits

## Scenario
A bank two-step-verification screen. The visible helper text, correctly associated with the OTP group via `aria-labelledby`/`aria-describedby`, reads *"Enter the 6-digit code we sent to your phone."* But the field is built from **four** single-character boxes (each `maxlength="1"`, `pattern="\d"`), and the inline validator requires **exactly four** digits (`/^\d{4}$/`). A user who waits for or reads a six-digit code can physically only enter four characters; the helper's stated count contradicts what the field accepts. The instruction is structurally perfect and visible; the number it states is simply wrong relative to the field's real capacity.

## Attribute tuple
- **content-domain:** online banking / fintech (login two-factor authentication)
- **UI-component / pattern:** segmented one-time-code (OTP) input — a `role="group"` of single-character boxes with auto-advance
- **host-language construct:** four `<input maxlength="1" pattern="\d">` boxes; group labelled by the helper paragraph
- **locale / i18n:** en-US
- **failure-mechanism:** instruction states a digit COUNT (6) that exceeds what the field enforces (4) — a quantitative contradiction

## Developer persona
A frontend dev migrated the auth screen from a vendor whose SMS codes were six digits to a new provider that issues four-digit codes. They updated the component's box count and the validation length from 6 to 4, but the helper copy — *"Enter the 6-digit code"* — lived in a separate i18n string file and was never touched. The string is grammatical, names the action, and "instructs," so it passed copy review and every automated scan; the mismatch only surfaces when a real four-digit code arrives.

## Element / selector carrying the issue
`#otp-help` (text "Enter the 6-digit code we sent to your phone") labelling `.otp` — a group of exactly four `input[maxlength="1"]` boxes whose validator enforces `\d{4}`. The stated count (6) exceeds the enforced count (4).

## Exact accessibility mechanism (what AT experiences / why it fails)
- **Screen-reader user:** entering the OTP group hears the group name "Enter the 6-digit code we sent to your phone," then "Digit 1 of code, edit … Digit 4 of code, edit." They are told six but find only four boxes, then are auto-advanced out of the field after the fourth keystroke with two digits of a six-digit code still unentered — confused about where the missing digits go. The up-front instruction misstates the field's real rule.
- **Cognitively-loaded user:** the confident "6-digit" framing makes them believe they mis-heard the code or that the form is broken; they cannot reconcile the instruction with the four boxes.
- **Voice-control user:** dictates the full six-digit code; the field silently drops digits 5–6, and the instruction gave no warning that only four are accepted.

## Expected ACT-style outcome
**failed** (SC 3.3.2 — an instruction for the input is provided, but it specifies a data rule the field does not honour; following it as written cannot succeed, so it fails to convey "what input data is expected").

## Why automated tools miss it
The instruction exists, is non-empty, and is programmatically associated with the group — so TT 5.A and ACT pass it, and axe/WAVE/Lighthouse confirm the label/contrast/role. No scanner extracts the integer "6" from the prose, counts the four `maxlength="1"` boxes (or reads the validator's `\d{4}`), and reasons that 6 ≠ 4. There is no automated model of "how many characters this composite field accepts" to check the words against. Catching it requires reading the helper, inferring the enforced length, and noticing the count disagrees.

## Citation
> "Instructions or labels may also specify data formats for data entry fields, especially if they are out of the customary formats or if there are specific rules for correct input."
— wcag-understanding/labels-or-instructions.html (Intent) — the digit count is exactly such a "specific rule for correct input"; here it is stated incorrectly.

> "The goal is to make certain that enough information is provided for the user to accomplish the task without undue confusion or navigation."
— wcag-understanding/labels-or-instructions.html (Intent) — a wrong digit count produces precisely the "undue confusion" the SC aims to prevent.

> "This test only determines whether visual labels/instructions are **present**, regardless of accuracy."
— refs/trusted-tester/sc-3.3.2-labels-or-instructions.md (Test 5.A Notes) — the presence-only procedure cannot reach the 6-vs-4 inaccuracy.
