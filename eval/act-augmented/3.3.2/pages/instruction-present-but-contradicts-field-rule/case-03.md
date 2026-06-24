# case-03 — Password: rules list says "At least 8 characters" but the field enforces 12

## Scenario
A SaaS project-tracker signup ("Cadence"). The password field shows a clear, visible, programmatically associated requirements list — *"At least 8 characters · Include a number · Include an uppercase letter."* But the field's enforced rule is **twelve**: `minlength="12"`, the `pattern` requires `.{12,}`, the live strength meter labels anything from 8–11 characters "Too short," and the submit validator rejects under 12. A user who reads the list and creates a fully compliant 8-character password such as `Passw0rdX` is rejected. The printed minimum (8) is strictly lower than the real minimum (12); following the instruction guarantees failure.

## Attribute tuple
- **content-domain:** SaaS analytics / project-management tool (account creation)
- **UI-component / pattern:** password field with a visible bulleted requirements list, live strength meter, and submit validator
- **host-language construct:** `<input type="password" minlength pattern>` described by a `<ul>` of rules
- **locale / i18n:** en-US
- **failure-mechanism:** stated minimum (8) is below the enforced minimum (12) — a stale threshold

## Developer persona
The security team raised the password floor from 8 to 12 to meet a new SOC 2 control. An engineer updated `minlength`, the `pattern`, and the strength-meter threshold to 12 in one commit — but the human-readable requirements list was hard-coded as static markup in a different template and was missed in the change. The list is well-formed, each rule is true *individually except the number*, and it "specifies the rules for correct input," so it passed the PR's a11y lint and an axe scan; only the "8" is stale.

## Element / selector carrying the issue
`#password-rules` (first bullet "At least 8 characters") describing `#password`, whose `minlength="12"`, `pattern="(?=.*[A-Z])(?=.*\d).{12,}"`, and JS validator all require 12. The stated minimum contradicts the enforced minimum.

## Exact accessibility mechanism (what AT experiences / why it fails)
- **Screen-reader user:** focusing the field hears "Choose a password, edit, At least 8 characters, Include a number, Include an uppercase letter." They build an 8-character password that satisfies every announced rule, submit, and are rejected. The real rule ("at least 12") is announced only *after* failure via the `role="alert"`. The up-front instruction — the thing 3.3.2 governs — understated the requirement and led them to a guaranteed error.
- **Cognitively-loaded user:** having satisfied the printed checklist, a rejection feels arbitrary and unfair; they have no way to know "8" was wrong.
- **Low-vision user (meter is `aria-hidden`):** the only programmatic guidance is the rules list, which is the incorrect one; the corrective "needs 12 characters" lives in a visual-only meter they don't get.

## Expected ACT-style outcome
**failed** (SC 3.3.2 — instructions specifying the rules for correct input are provided, but they state a lower minimum than the field enforces, so they do not enable the user to enter acceptable data).

## Why automated tools miss it
The requirements list is present, non-empty, associated, and readable — so TT 5.A and ACT pass it; axe/WAVE/Lighthouse confirm the label, the resolved `aria-describedby`, the contrast, and the role. No scanner extracts "8" from the bullet, reads `minlength="12"`/the pattern quantifier, and reasons 8 < 12. There is no automated comparison between a prose threshold and an enforced numeric constraint. Catching it requires reading the rule, inferring the enforced minimum, and noticing the numbers disagree.

## Citation
> "Instructions or labels may also specify data formats for data entry fields, especially if they are out of the customary formats or if there are specific rules for correct input."
— wcag-understanding/labels-or-instructions.html (Intent) — a minimum-length rule is a "specific rule for correct input"; here it is stated below the real value.

> "Providing labels and instructions (including examples of expected data formats) helps all users … to enter information correctly."
— wcag-understanding/labels-or-instructions.html (Benefits) — the benefit is defeated when the stated rule cannot in fact produce correct input.

> "This test only determines whether visual labels/instructions are **present**, regardless of accuracy. The form label is tested for sufficient *description* in 5.B"
— refs/trusted-tester/sc-3.3.2-labels-or-instructions.md (Test 5.A Notes) — the presence-only procedure does not evaluate whether "8" matches the enforced "12".
