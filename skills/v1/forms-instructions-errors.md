---
name: forms-instructions-errors
description: Verify form fields have persistent labels/instructions, required state conveyed in text (not color/asterisk alone), and that validation errors are identified in text and programmatically associated — driving a submit when possible.
covers: cat_9 (primary)
wcag: 3.3.1 Error Identification (A); 3.3.2 Labels or Instructions (A); 3.3.3 Error Suggestion (AA)
instruments: DOM, AX tree, submit driver + dynamic-announcement, vision
behavioral: partial (label/instruction=static; error identification=needs submit)
---


# forms-instructions-errors

## When to run
Findings about placeholder-only labels, asterisk-only "required" with no legend,
instructions that vanish on input, or invalid input that's blocked/erroring with
no text explanation.

## Procedure — labels & instructions (3.3.2), static
1. **Field labelling** — per input: `--eval` for `<label for>`, `aria-label`,
   `aria-labelledby`, `placeholder`. If the only name source is `placeholder`
   (BuzzFeed email "Enter your email"), it disappears on input → **REPRODUCED**.
   Confirm the computed name via `/ax-node` (delegates to **name-role-state**).
2. **Required indication (3.3.2)** — is "required" conveyed in text, or only by a
   color/asterisk? Check for a `*` (incl. CSS `::after content:"*"`) with **no**
   legend ("Fields marked * are required") anywhere: `--eval` test the page text
   for an explanatory phrase. Harvey: 12 `_required_…::after{content:"*"}` labels,
   no legend, and the SR reads the label *without* the asterisk → **REPRODUCED**.

## Procedure — error identification (3.3.1, 3.3.3), behavioral
3. **C2 — what 3.3.1 actually requires.** 3.3.1 = *if an input error is automatically
   detected, the item in error is identified and the error is described in text.* The
   **native HTML5 constraint-validation** path (the UA shows a text bubble, focuses the
   invalid field, and common SR pairings announce it) generally **meets 3.3.1**
   (https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html). So:
   - **Do NOT infer a 3.3.1 failure from the mere absence of `aria-invalid`, `role=alert`,
     or a live region.** That absence is not a failure by itself.
   - A 3.3.1 failure must be **demonstrated**: submit invalid input and show that an
     error was detected (submit blocked / field invalid) but **no text identification**
     of the error appeared by any means (no native message, no visible text, no
     programmatic description).
4. **Drive a submit and CAPTURE the evidence** — enter invalid/empty input, submit
   (trusted click/Enter). Record (the driver's `forms[]` provides these):
   - `submitBlocked` / `validity.*` per field and the field's **`validationMessage`**
     (the native text). A non-empty `validationMessage` is text identification → 3.3.1 met.
   - Whether `document.activeElement` moved to the invalid field (native focus).
   - Whether **visible** error text appeared (screenshot + DOM), and whether it was
     **announced** (run **dynamic-announcement**), and **associated** (`aria-describedby`).
   - Only a *demonstrated* error with **no** text identification at all → 3.3.1 **REPRODUCED**.
     A native message that exists but isn't programmatically associated/announced may still
     be a **3.3.3 / robustness** concern, not an automatic 3.3.1 failure — say which.
5. If the field/step isn't in the snapshot (VitalChek date loads on a later AJAX
   step; Panera form is a Vue overlay; Amazon password is a later step), OR a submit
   cannot be driven so no error was demonstrated → **NOT FOUND / PARTIAL** (never a
   definite 3.3.1 from un-demonstrated error).

## Classify
- **REPRODUCED** — placeholder-only label, asterisk-without-legend, or a **demonstrated**
  detected error with **no text identification by any means** (3.3.1). (Missing
  `aria-invalid`/live-region alone is NOT a 3.3.1 failure — see step 3.)
- **PARTIAL** — label/required confirmed static, but the error path needs a submit the snapshot can't complete; report the missing `aria-describedby` wiring.
- **NOT REPRODUCED** — persistent labels, text instructions, and associated+announced errors.
- **NOT FOUND** — the field/step isn't captured.

## Limits
Error identification usually needs a working submit (and often a backend) — the
single biggest source of cat_9 NOT-FOUND/PARTIAL. Label/instruction/required
checks are fully static and reliable.
