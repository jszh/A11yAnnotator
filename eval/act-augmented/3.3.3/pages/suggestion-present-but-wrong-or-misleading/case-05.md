# case-05 — "Did you mean December?" fires on a valid "07" (July) and maps it to the wrong month

## Scenario
A festival "choose your arrival month" form. The instruction is *"Enter your arrival month as a number, 1–12 (for example, 5 for May)."* The field accepts 1–12. When the user types `07` — a perfectly valid value meaning **July** — the page nonetheless surfaces a confident "did you mean…" correction in a `role="status"` live region: *"We read that as the 7th — did you mean December?"* with a **Use December instead** button that overwrites the field with `12`. Two things are wrong: (1) `07` was already valid, so there was no error to correct (gratuitous suggestion); and (2) the offered substitute is factually wrong — 7 is July, not December (December is 12). Following the suggestion silently changes a correct July booking into an unintended December one.

## Attribute tuple
- **content-domain:** events / ticketing (open-air festival camping booking)
- **UI-component / pattern:** numeric month entry with a `role="status"` "did you mean" suggestion + one-click "use instead" button
- **host-language construct:** `<input type="text" inputmode="numeric">` with an injected suggestion `<button>` in an `aria-live="polite"` region, fired on `input`
- **locale / i18n:** en; months-as-numbers (the SC's own "12 / December" example domain), no locale collision
- **failure-mechanism:** suggestion fires on already-valid input (gratuitous) AND offers a substitution that is the wrong month (7 ≠ December)

## Developer persona
A developer adapted the WCAG Understanding document's own worked example ("If the user enters '12,' … 'Do you mean December?'") into a "helpful" auto-suggest, but inverted the mapping and the trigger: they wired it to fire on `07` and to propose "December", apparently confusing the *example input* (12 → December) with the *value being typed*. Because the feature emits a real "did you mean" string with an actionable button, it looked like a textbook 3.3.3 enhancement and was praised in review. Nobody tested entering a valid mid-year month and reading the suggestion against the months.

## Element / selector carrying the issue
`#month-suggest` (the `role="status"` region) text *"We read that as the 7th — did you mean December?"* and its **Use December instead** `<button>` (sets `#month` to `12`). The trigger value `07` is valid (July) and `12` is the wrong correction.

## Exact accessibility mechanism (what AT experiences / why it fails)
- **Screen-reader user:** after typing `07`, the polite live region announces "We read that as the 7th — did you mean December? Use December instead, button." Having entered what they believe is July, the blind user is told the system "read" their input and is offered a single corrective action. Trusting it, they activate the button; the field becomes 12 and "Set to December" is announced. They have been steered from a correct value to a wrong one with no reliable way to detect the swap audibly.
- **Cognitively-loaded user:** a confident system prompt to "correct" a value they thought was right induces doubt and a likely wrong change.
- **Sighted user:** can recognise 7 = July and dismiss it, but the suggestion is still both unnecessary and incorrect.

## Expected ACT-style outcome
**failed** (SC 3.3.3 — the page provides a "suggestion for corrected input", but it is misleading: it is offered when no error exists and it names the wrong value, so it does not provide adequate, correct information to fix an error — it manufactures one and corrupts a valid entry).

## Why automated tools miss it
A scanner sees a "did you mean" suggestion present, associated, announced, and actionable — exactly the *sufficient* pattern. It cannot know that `07` was already a valid value (no error to correct), that 7 maps to July not December, or that the offered substitution is wrong. Recognising both the gratuitousness and the factual error requires human knowledge of the month-number mapping and of the field's validity state — semantic ground truth no automated check possesses.

## Citation
> "The conversion of the input data interpreted as a different month format, e.g., 'Do you mean December?'"
— wcag-understanding/error-suggestion.html (Examples) — the SC's model "did you mean December?" assumes the input was the invalid "12"; firing it on a valid "07" and mapping to the wrong month inverts the example into a misleading suggestion.

> "The intent of this success criterion is to ensure that users receive appropriate suggestions for correction of an input error if it is possible."
— wcag-understanding/error-suggestion.html (Intent) — there is no *input error* here, and the suggestion is not *appropriate*: it points at the wrong month.

> "Check that the user is presented with suggestions for the correct text."
— wcag-techniques/general/G177.html (Tests, Procedure) — the suggested text must be *correct*; "December" is not the correct interpretation of 7.
