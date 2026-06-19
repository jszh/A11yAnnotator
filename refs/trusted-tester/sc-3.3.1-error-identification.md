# SC 3.3.1 Error Identification (Level A) — TT Test 5.F

**TT section:** 5. Forms → Input Error Identification and Suggestions · **Baseline:** 10. Forms
**WCAG SC 3.3.1:** If an input error is automatically detected, the item that is in error is identified and the
error is described to the user **in text**.

## Identify Content (Input Error Identification and Suggestions)
1. Use ANDI to identify any form elements on the page.
2. Find all instructions and cues (textual and graphical) related to form components/controls (groupings, order
   of completion, special conditions, qualifiers, format instructions).
3. **Intentionally enter values and/or make selections that violate format and/or other form instructions** to
   reveal automatic notifications of input errors.
- **DNA** for 5.F and 5.G if there is **no automatic input error detection**.

## Test 5.F — `3.3.1-error-identification`
**Test Condition:** *The item in error is identified in text and sufficiently described to the user in text.*
**DNA** if the form element does not have automatic error detection.

### How to Test
1. **Intentionally violate** formatting and other form instructions (e.g., leave a required field empty, use a
   different date format than required, and/or create a password that does not meet strength requirements).
2. Attempt to **submit** the form and/or move to the next page.
3. Determine whether the error is **identified and described in text**.
   - a. The form field with the error is identified in text (e.g., "Error: Password field.").
   - b. Text describes the error (e.g., in a dialog message that states "the Password you entered is incorrect.").

### Evaluate Results (PASS if)
1. The item that is in error is identified in text and sufficiently described to the user in text.

> **Key behavior:** This is a **trigger-and-observe** test — the tester must actively *cause* an error
> (submit invalid input) and then check whether the resulting error is conveyed in text. It is not a static
> inspection.
