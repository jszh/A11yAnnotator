# case-01 — Date of birth: visible hint "Format: MM/DD/YYYY" but field enforces DD/MM/YYYY

## Scenario
A UK government-style "Renew your driving licence" service (GOV.UK Design System look). The date-of-birth field carries a clear, visible, programmatically associated instruction — *"Format: MM/DD/YYYY — for example 03/27/1986."* But the field's `pattern`, its `maxlength`, and the inline JavaScript validator all enforce **DD/MM/YYYY** (day first, then month). A user who literally follows the printed instruction and types `03/27/1986` is rejected, because the field reads `27` as a month and `1986` is fine but `27` exceeds 12. Following the instruction guarantees an error; the format the field actually wants (`27/03/1986`) is never stated until after rejection. The licence-number field above it is an always-correct contrast control (its hint matches its enforced rule).

## Attribute tuple
- **content-domain:** government / civic services portal (driving-licence renewal)
- **UI-component / pattern:** GOV.UK-style single text date field with `aria-describedby` hint + inline error, native `pattern`/`maxlength` + JS validator
- **host-language construct:** `<input type="text" pattern maxlength>` with associated `.hint` paragraph
- **locale / i18n:** en-GB UI, but the instruction was written in US month-first convention while the field enforces the British day-first convention — a locale collision
- **failure-mechanism:** instruction specifies the OPPOSITE field order from what the field enforces (MM/DD vs DD/MM)

## Developer persona
An agency contractor localised a US date component for a UK government client. They translated the surrounding copy and rewrote the validation regex to UK day-first order (`DD/MM/YYYY`), as the spec required — but the *visible hint string* and its worked example (`03/27/1986`) were left over from the original US component. The hint reads fluently, names the field, and "specifies a data format," so it passed the content review and an axe scan. Nobody cross-read the hint text against the regex.

## Element / selector carrying the issue
`#dob-hint` (text "Format: MM/DD/YYYY — for example 03/27/1986") describing `#dob`, whose `pattern="(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])/\d{4}"` and JS validator enforce DD/MM/YYYY. The hint and the enforced rule specify opposite orders.

## Exact accessibility mechanism (what AT experiences / why it fails)
- **Screen-reader user:** focusing the field hears "Date of birth, edit, Format: MM/DD/YYYY, for example 03/27/1986." Trusting the only instruction offered, they enter month-first. The pattern rejects it. The corrective DD/MM/YYYY rule is only announced *after* the failed submit, so the up-front instruction — the one the SC is about — actively misleads them.
- **Cognitively-loaded / low-literacy user:** they cannot infer the real order from the markup; they follow the visible words and are guaranteed to fail. The Understanding warns this is "just as harmful as too little."
- **Sighted keyboard user:** same trap — the printed example is itself an invalid value for this field.

## Expected ACT-style outcome
**failed** (SC 3.3.2 — an instruction specifying the data format is provided, but it specifies a format the field does not accept; following it guarantees an error, so it does not enable the user to "know what input data is expected").

## Why automated tools miss it
TT test 5.A and ACT verify only that a visible label/instruction is *present and associated*; both are true here. axe/WAVE/Lighthouse confirm the `<label for>`, the resolved `aria-describedby`, the contrast, and the textbox role. None of them parse the prose "MM/DD/YYYY", parse the `pattern` regex, and judge that the two specify opposite day/month orders — they have no model of what the field actually accepts to compare against the words. Detecting the contradiction requires reading the hint, inferring the enforced rule, and noticing they disagree.

## Citation
> "Instructions or labels may also specify data formats for data entry fields, especially if they are out of the customary formats or if there are specific rules for correct input."
— wcag-understanding/labels-or-instructions.html (Intent) — the SC is explicitly about format instructions; here the format instruction is present but wrong.

> "Too much information or instruction can be just as harmful as too little."
— wcag-understanding/labels-or-instructions.html (Intent) — a confident-but-false instruction is the "harmful" case: it sends the user to a guaranteed error.

> "This test only determines whether visual labels/instructions are **present**, regardless of accuracy."
— refs/trusted-tester/sc-3.3.2-labels-or-instructions.md (Test 5.A Notes) — confirms the presence-only check passes here, so the contradiction is out of reach for the procedure.
