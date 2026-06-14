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
3. **Static wiring** — does the input have `aria-describedby`/`aria-errormessage`/
   `aria-invalid` pointing at an error region? Absent = the precondition for failure.
4. **Drive a submit** — enter invalid/empty input and submit (act/press). Then:
   - Is an error **shown in text** (3.3.1)? Screenshot (vision) + DOM check.
   - Is it **announced** (run **dynamic-announcement**: clear transcript → submit →
     read it)?
   - Is it **associated** with the field (`aria-describedby` now set)?
   - A silently-disabled Continue with no text error (Panera/Amazon sign-in) →
     **REPRODUCED**; a global banner not tied to the field → 3.3.1 partial-fail.
5. If the field/step isn't in the snapshot (VitalChek date loads on a later AJAX
   step; Panera form is a Vue overlay; Amazon password is a later step) → **NOT FOUND**.

## Classify
- **REPRODUCED** — placeholder-only label, asterisk-without-legend, or error not identified-in-text / not associated / not announced.
- **PARTIAL** — label/required confirmed static, but the error path needs a submit the snapshot can't complete; report the missing `aria-describedby` wiring.
- **NOT REPRODUCED** — persistent labels, text instructions, and associated+announced errors.
- **NOT FOUND** — the field/step isn't captured.

## Limits
Error identification usually needs a working submit (and often a backend) — the
single biggest source of cat_9 NOT-FOUND/PARTIAL. Label/instruction/required
checks are fully static and reliable.
