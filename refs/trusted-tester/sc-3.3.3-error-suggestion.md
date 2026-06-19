# SC 3.3.3 Error Suggestion (Level AA) — TT Test 5.G

**TT section:** 5. Forms → Input Error Identification and Suggestions · **Baseline:** 10. Forms
**WCAG SC 3.3.3:** If an input error is automatically detected and suggestions for correction are known, then
the suggestions are provided to the user, unless it would jeopardize the security or purpose of the content.

## Test 5.G — `3.3.3-error-suggestion`
**Test Condition:** *Guidance (e.g., suggestion for corrected input) is provided about how to correct errors for
form fields.*

**DNA** if any of the following apply to the form element:
- There is no automatic input error detection.
- Based on the type of input required, suggestions for correction **cannot be provided** because they are not
  knowable.
- Providing information about how to correct the error would **jeopardize the security or purpose** of the
  content (e.g., details about an incorrect password).

### How to Test
1. Continue from Test 5.F.
2. Determine whether guidance provides **sufficient details** for how to correct the error and/or offers
   suggestions of corrected input.

### Evaluate Results (PASS if ANY true)
1. Suggestions for corrected input are provided, OR
2. The description contains adequate information for the user to know what is required to fix the error.

> **Depends on 5.F:** runs only after an error has been triggered (5.F). 3.3.1 asks *"is the error identified
> & described?"*; 3.3.3 asks the harder follow-up *"does it tell you how to fix it?"*.
