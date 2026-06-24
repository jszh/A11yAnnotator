# case-05 — PASS boundary: focusable status region (logical position) + focusable end-of-form summary (no mid-flow stop)

## Scenario
A clinical "add a patient allergy" form (Meadowbrook Clinic). It deliberately contains **two**
focusable non-interactive elements — the exact situation the Understanding note permits — placed
where they do NOT impede operation:
1. A `role="status"` region positioned immediately after the Save button; focus is moved to it on
   save so the user lands on the confirmation (a logical focus move).
2. A read-only "You are recording" review summary at the very END of the form, after all inputs and
   the submit button, made focusable (`tabindex="0"`) so users can review it.
The tab order is allergen → reaction → severity → notes → Save → summary. No control is reached
twice; no dead stop lands between two related fields. This page tests that the judge does NOT flag
every focusable non-control element — only meaning/operation-impeding ones.

## Attribute tuple
- **content-domain:** healthcare / patient portal (clinician-facing EHR form)
- **UI-component/pattern:** data-entry form with a status region and an end-of-form review summary
- **host-language construct:** focusable static content — `p[role=status][tabindex=-1]` and `section[tabindex=0]` (review summary)
- **locale/i18n:** en
- **failure-mechanism:** NONE — focusable static content placed where it does not impede operation (boundary PASS)

## Developer persona
An accessibility-aware EHR engineer who knows the note allows focusable static content. They moved
focus to a status confirmation on save (so screen-reader users hear the result) and made the
review summary focusable for review — but were careful to put both AFTER the operable sequence, so
neither interrupts data entry. This is the "done right" counter-example.

## Element / selector carrying the issue
`p.saved[role="status"][tabindex="-1"]` (focus target on save) and `section.summary[tabindex="0"]`
(end-of-form review). Both are non-interactive yet focusable — and both are placed so they add no
mid-sequence confusion.

## Exact accessibility mechanism (what AT experiences, why it passes)
Tabbing the form: allergen → reaction → severity → notes → "Save allergy" button → review summary.
The summary is reached only after the user has already passed the submit button, so it never breaks
the entry chain. On save, focus is programmatically moved to the status region (which is also a live
region, so it announces) — landing the user exactly on the confirmation, a logical move the
Understanding note explicitly permits ("programmatically moving focus to such content"). No control
receives focus twice; no non-operable stop is wedged between two related controls. The focus order
preserves meaning and operability throughout, so it passes 2.4.3.

## Expected ACT-style outcome
**passed**

## Why automated tools miss it
This is the inverse trap: a naive heuristic that flags any focusable non-interactive element (count
of `tabindex="0"` on non-controls, or focus moved to static text) would WRONGLY fail this page. The
elements are valid and, crucially, well-placed. Confirming the page passes requires tabbing it,
verifying the focusable static content sits at logical points and impedes nothing — the same human
judgment that catches the failures, applied to correctly distinguish "allowed" from "failure."

## Citation
> **WCAG 2.2 Understanding Focus Order, Intent (note):**
> "This success criterion does not prohibit making non-operable content (e.g., static text) focusable, or programmatically moving focus to such content."

(Verbatim from `wcag-understanding/focus-order.html`. The status region and the end-of-form summary are
exactly the permitted "non-operable content made focusable / programmatically focused," placed so they
do not impede operation — therefore PASS.)

> **WCAG 2.2 Understanding Focus Order, "For clarity" list:**
> "Static/non-interactive elements can receive focus, as long as they don't impede operation of the content, or result in confusing or illogical focus order."

(Verbatim from `wcag-understanding/focus-order.html`. Here they do not impede operation, so the
permission applies and the page conforms.)
