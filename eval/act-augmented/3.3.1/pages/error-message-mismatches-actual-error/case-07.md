# case-07 — CONTROL / FOIL (PASS): phone "(202) 555-CALL" flagged "must contain only digits" (message correctly matches the actual defect)

## Scenario
The deliberately **correct** counterpart to case-01 — same component family (a digits-only phone field in a post-submit error state with an `aria-describedby` error), but here the message truly matches the entered value's actual defect. The user typed `(202) 555-CALL`, which genuinely contains parentheses, a space, a dash, and the letters C-A-L-L. The field's stated constraint is "digits only." The visible, associated error reads *"Phone number must contain only digits. Remove the letters, spaces, and parentheses (for example, enter 2025550143)."* The asserted cause DID occur and is the correct, actionable description of THIS value's defect.

## Attribute tuple
- **content-domain:** events / ticketing
- **UI-component / pattern:** native `<input type="tel">` (digits-only), `aria-describedby` hint + inline error, `aria-invalid="true"`
- **host-language construct:** retained value, programmatically associated visible error message
- **locale / i18n:** en-US
- **failure-mechanism:** NONE — the message correctly identifies the actual defect (presence of letters/parentheses/spaces against a digits-only field)

## Developer persona
A developer who reads error copy against real inputs. They mapped each phone-validation failure to a message describing the *specific* characters that violate the rule and added a corrected-format example. When the user submitted `(202) 555-CALL`, the validator detected non-digit characters and emitted a message that names exactly those characters and shows the digits-only form to use. This is the right behavior, included so the aspect tests **discrimination** rather than a blanket "all phone-digit pages fail" heuristic.

## Element / selector carrying the issue
`#error-phone` ("Phone number must contain only digits...") correctly describing the actual defect of `#phone[value="(202) 555-CALL"]`, which genuinely contains the named non-digit characters. There is no defect in the error here — this is the pass case.

## Exact accessibility mechanism (what AT experiences / why it passes)
- **Screen-reader user:** focusing the field hears "Mobile number, edit, invalid entry, Phone number must contain only digits. Remove the letters, spaces, and parentheses, for example, enter 2025550143." The value they typed visibly/audibly contains letters and parentheses; the message names exactly that defect and gives a correct example. They can determine what is wrong and fix it. SC 3.3.1 satisfied.
- **Cognitive / low-vision user:** the cause described matches the value and the suggested format is concrete — the error is actionable.
- **Sighted user:** the value on screen plainly violates "digits only," and the message says so.

## Expected ACT-style outcome
**passed** (SC 3.3.1 — an input error is detected and described in text; the description correctly identifies the item in error and the actual nature of the error, enabling the user to determine what is wrong).

## Why this is the discrimination control
case-01 and this page share nearly identical markup, the same field type, the same digits-only constraint, and a structurally identical error indicator — so an evaluator (or model) that fails 3.3.1 by pattern-matching "phone field + error about letters/parentheses" would wrongly fail this page too. The ONLY thing that flips the verdict is whether the entered value actually exhibits the described defect: case-01's value (`12025550143`) does not, so it fails; this value (`(202) 555-CALL`) does, so it passes. This confirms the aspect is about **value↔constraint↔message agreement**, not the wording of the message in isolation — case-01's exact phrasing would be perfectly fine for THIS value. Automated tools cannot make this discrimination because they never read the value against the message; here that absence happens to coincide with a correct human verdict, which is precisely why a foil is needed.

## Citation
> "the user enters alphabetic characters or parentheses into their phone number field that only accepts numbers;"
— wcag-understanding/error-identification.html (Intent — input-error example; this value genuinely commits exactly this error, and the message describes it)

> "Often, the error description can be phrased so that it meets both Success Criteria 3.3.1 Error Identification and 3.3.3 Error Suggestion at the same time."
— wcag-understanding/error-identification.html (Intent) — this message both identifies the error and suggests the fix (the digits-only example), the model the aspect's failing pages only imitate.

> "The item that is in error is identified in text and sufficiently described to the user in text."
— refs/trusted-tester/sc-3.3.1-error-identification.md (Evaluate Results — PASS if) — met here because the description matches the value's actual error.
