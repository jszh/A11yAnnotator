# SC 3.3.2 Labels or Instructions (Level A) — TT Test 5.A

**TT section:** 5. Forms · **Baseline:** 10. Forms
**WCAG SC 3.3.2:** Labels or instructions are provided when content requires user input.

## Identify Content (Form Components)
1. Use **ANDI: focusable elements** to identify any form elements on the page (buttons, text fields, radio
   buttons, checkboxes, read-only fields, multi-select lists).
2. Find all instructions and cues (textual and graphical) related to form components/controls (groupings, order
   of completion, special conditions, qualifiers, format instructions).
- **EXCLUDE** disabled input elements (they do not receive keyboard focus, cannot be selected, cannot be
  modified).
- **DNA** for 5.A–5.H if there is no such content.

## Test 5.A — `3.3.2-label-provided`
**Test Condition:** *Visual labels or instructions are provided for form elements.*
**DNA** if the page does not have form elements or all form elements are disabled.

### How to Test
1. Determine if each form element provides **visual** labels or instructions.

### Evaluate Results (PASS if)
1. Visual labels or instructions are provided for each form element.

### Notes
- The label or instruction must be **visible when the form field has focus**.
- The label or instruction can be **graphical or textual**.
- This test only determines whether visual labels/instructions are **present**, regardless of accuracy. The
  form label is tested for sufficient *description* in 5.B (`2.4.6-label-descriptive`).
- The **programmatic association** of the form instruction (text label) to the form field is tested in 5.C
  (`1.3.1-programmatic-label`). See `sc-1.3.1-info-and-relationships.md` and `sc-4.1.2-name-role-value.md`.

> **Scope note:** 3.3.2 in TT is strictly *"is a visible label/instruction present?"*. Adequacy is 2.4.6;
> programmatic name/association is 1.3.1/4.1.2. The three are tested by three separate TT conditions over the
> same fields.
