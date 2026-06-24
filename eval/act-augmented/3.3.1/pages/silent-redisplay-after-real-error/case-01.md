# case-01 — Facility-booking request re-displayed under "Request logged" with a retained past event date that violates the printed 14-day-lead rule, no error text and no programmatic signal

## Scenario
A City of Glenmore facility-booking page (reserve a community-hall slot). The booking policy is
printed on the page: **"requests must be made at least 14 days in advance of the event date."** The
applicant submitted an **Event date of 2019-03-02** — years in the past, so it cannot satisfy the
14-day-lead rule. The server applied that rule, rejected the request, and re-displayed the form with
the typed values retained — but under the heading **"Request logged"** and the lead **"here are the
details we have for your reservation."** There is no error message anywhere on the page. Variant A of
the aspect: the form simply re-appears, with no hint that anything failed.

This rewrite deliberately makes the retained bad value a **semantically** out-of-range value that
carries **no browser constraint and no programmatic invalid state** (see "what AT experiences"). The
error is real, but it is detectable only by reading the value against the printed rule — pure human
judgment, with nothing for a checker or a screen reader to latch onto.

## Attribute tuple
- **content-domain:** government / civic services (municipal facility booking)
- **UI-component/pattern:** server-rendered POST result page (breadcrumb ending in "Confirmation")
- **host-language construct:** native `<form method="post">` of plain `<input type="text">` fields — NO `required`, `min`, `max`, `pattern`, or `type=email` anywhere, with real `<label for>` associations
- **locale/i18n:** en
- **failure-mechanism:** silent re-display of a bounced submission — absence of any error indicator IS the failure; the only evidence is a semantically out-of-range (past) date

## Developer persona
A back-end developer on a small municipal-IT team wired the controller so that on a validation
failure it re-renders the same `confirmation.html` template (the template was named for the happy
path) with the model re-bound. The 14-day-lead rule is enforced **only in server code** against the
city's calendar; the input is a plain text box on the client (no `type=date`, no `min`/`max`), so the
browser never validates it. The developer never built the error-message partial — the design mock
only ever showed the success state, so the "errors" slot in the template was left as a TODO that
shipped empty. The heading string "Request logged" is hard-coded in the template regardless of
outcome.

## Element / selector carrying the issue
The whole page-state combination: `h1` reading "Request logged", the printed policy
`p.rule` ("at least 14 days in advance"), and `input#evdate[value="2019-03-02"]` (a past date that
cannot meet that rule). The **issue is the absence** of any error element together with the
post-submit cues — there is no single "bad attribute" to point at, and the retained date is a
structurally legal string.

## Exact accessibility mechanism (what AT experiences, why it fails)
A screen-reader user who submitted an impossible date lands on a page whose title and first heading
say "Request logged." There is no text, no `role="alert"`, no in-title error flag, nothing in the
field labels indicating that 2019-03-02 cannot satisfy the printed 14-day-lead rule. The error was
automatically detected (the server enforced the lead-time rule and bounced the request) but it is
described to the user in **no text at all** — the core 3.3.1 failure.

Crucially, there is also **no programmatic signal** of the error. `#evdate` is a plain
`<input type="text">` with no `min`/`max`/`required`/`pattern`, so `"2019-03-02"` is a valid value:
the browser computes `element.validity.valid === true`, the field does **not** match `:invalid`, and
the Chromium accessibility tree exposes it as a normal `textbox` with `required="false"` and no
invalid state (CDP-verified; every field on the form reports `valid:true`, `matchesInvalid:false`).
So a screen reader announces an ordinary, valid text box reading "2019-03-02" — there is no
constraint-validation `:invalid`/`aria-invalid` cue for AT to convey, and no field-level invalid
state to announce. Only a human who reads "2019-03-02" against the printed "at least 14 days in
advance" rule (and knows roughly today's date) can infer a real input error occurred and is being
suppressed. This is the birth-date-in-the-future class of input error the Understanding lists by
example.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
The form is flawless to a static scanner: every input has a programmatic label, the markup is valid,
contrast passes, and — crucially — there is **no error element to evaluate** and **no `:invalid`
field to flag**. axe/WAVE/Lighthouse have no model of "this page is the result of a failed
submission," cannot read the current date, and cannot judge that a 2019 date violates a 14-day-lead
rule stated in prose; with no error indicator and no constraint-validation failure present they treat
3.3.1 as inapplicable / a vacuous pass (ACT Passed Example 3 behaviour). Catching this requires
reading the page-state context — the "Request logged" heading contradicted by the retained past Event
date against the printed lead-time rule — and inferring that a real error occurred and was
suppressed. That is a human/contextual judgment.

## Citation
> **WCAG 2.2 Understanding 3.3.1 (Intent), `wcag-understanding/error-identification.html`:**
> "In the case of an unsuccessful form submission, it is not sufficient to only re-display the form
> without providing any hint that the submission failed. The error must be indicated in text."

> **WCAG 2.2 Understanding 3.3.1 (Intent — examples of an "input error"), `wcag-understanding/error-identification.html`:**
> "the user enters a birth date 2 years in the future"

(The retained Event date 2019-03-02 is exactly this class of input error — a date value that falls
outside the allowed range set by the printed "at least 14 days in advance" rule. The page detects it
server-side, bounces the request, yet re-displays the form under "Request logged" with the error
indicated in no text and exposed by no programmatic signal.)
