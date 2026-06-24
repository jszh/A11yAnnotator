# case-05 — Donation amount: hint's worked example "25.00" is itself rejected (whole dollars only)

## Scenario
A nonprofit food-bank donation form. The custom-amount field carries a clear, visible, programmatically associated instruction *with a worked example* — *"Enter an amount in US dollars — for example 25.00."* But the field's enforced rule rejects decimals: `step="1"`, `pattern="\d+"` (no dot), `inputmode="numeric"`, and the submit validator accepts **whole dollars only** (`/^\d+$/`). The consequence is sharp: the very example the instruction offers — `25.00` — is itself an **invalid value** for this field. A donor who copies the worked example verbatim is rejected. The instruction is structurally perfect and visible; its own demonstrated format violates the field's rule.

## Attribute tuple
- **content-domain:** nonprofit / donation flow
- **UI-component / pattern:** currency amount field with quick-select preset buttons and a worked-example hint
- **host-language construct:** `<input type="text" step="1" pattern="\d+">` described by a hint paragraph carrying an example value
- **locale / i18n:** en-US ($, period decimal)
- **failure-mechanism:** the EXAMPLE inside the instruction (`25.00`) is itself a value the field rejects — a self-contradicting instruction

## Developer persona
A volunteer set up the donation page using a generic currency snippet whose hint read *"for example 25.00."* To simplify reconciliation, the finance lead later asked that gifts be whole dollars only, so the developer changed `step` to `1` and the pattern to `\d+` and added a no-cents validator — but left the original hint and its `25.00` example untouched. The hint is well-formed, gives a concrete example, and "specifies a data format," so it passed review and an axe scan; nobody noticed the example no longer validates.

## Element / selector carrying the issue
`#amount-hint` (text "Enter an amount in US dollars — for example 25.00") describing `#amount`, whose `step="1"`, `pattern="\d+"`, and validator (`/^\d+$/`) reject any decimal. The instruction's own example value fails the field's rule.

## Exact accessibility mechanism (what AT experiences / why it fails)
- **Screen-reader user:** focusing the field hears "Or enter another amount, edit, Enter an amount in US dollars, for example 25.00." Following the only guidance offered, they type `25.00` and are rejected; the real rule ("whole dollars, no cents") is announced only after failure via the `role="alert"`. The up-front instruction not only fails to describe the rule — it actively demonstrates a forbidden format.
- **Cognitively-loaded / low-numeracy user:** worked examples are the primary aid for this group; here the example is a trap, producing exactly the confusion 3.3.2 exists to prevent.
- **Voice-control user:** dictates "twenty-five point zero zero," matching the example; the dot makes the value invalid with no prior warning.

## Expected ACT-style outcome
**failed** (SC 3.3.2 — an instruction with an example data format is provided, but the example contradicts the field's enforced rule, so following the instruction guarantees an error).

## Why automated tools miss it
The instruction is present, non-empty, associated, and gives an example — so TT 5.A and ACT pass it, and axe/WAVE/Lighthouse confirm the label, the resolved `aria-describedby`, the contrast, and the role. No scanner extracts the literal example `25.00` from the prose, reads `step="1"`/`pattern="\d+"`, and tests the example against the field's own constraint to discover it fails. There is no automated "does the instruction's example validate against this field" check. Catching it requires reading the example, inferring the enforced rule (integers only), and noticing the example violates it.

## Citation
> "Providing labels and instructions (including examples of expected data formats) helps all users … to enter information correctly."
— wcag-understanding/labels-or-instructions.html (Benefits) — an example of the expected format is the explicit aid; here the example is wrong, so it produces incorrect input.

> "Instructions or labels may also specify data formats for data entry fields, especially if they are out of the customary formats or if there are specific rules for correct input."
— wcag-understanding/labels-or-instructions.html (Intent) — "whole dollars only, no cents" is a specific rule for correct input; the instruction's example contradicts it.

> "This test only determines whether visual labels/instructions are **present**, regardless of accuracy."
— refs/trusted-tester/sc-3.3.2-labels-or-instructions.md (Test 5.A Notes) — the presence-only procedure cannot detect that the example value itself is invalid.
