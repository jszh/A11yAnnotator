# case-07 — CONTROL (passing): summary "2 problems" exactly matches the two flagged fields (Email, Date of birth)

## Scenario
A flight-booking "Passenger details" step (Skylark Air). A red `role="alert"` summary states **"There
are 2 problems with these passenger details"** and lists exactly two G139-style jump links: *"Email
address must be in the format name@example.com"* (→ `#email`) and *"Date of birth must be a real date in
the past, like 14/03/1990"* (→ `#dob`). The page flags exactly those two fields — Email ("weilin.example",
`aria-invalid="true"`, inline message) and Date of birth ("30/02/2001", `aria-invalid="true"`, inline
message) — and the two valid fields (Given names, Passport number) are correctly *not* mentioned. The
count, the named fields, the anchor targets, and the message wording all reconcile with the actual error
state. This is the **coherent control**: structurally identical in richness to the failing cases (count
+ jump links + multi-field), but fully consistent, so it should pass.

## Attribute tuple + developer persona
- **content-domain:** travel / flight booking (passenger details)
- **UI-component/pattern:** top-of-form `role="alert"` summary with G139 jump links + inline per-field errors
- **host-language construct:** `<a href="#fragment">` anchors matching `id`s; `aria-invalid` + `aria-describedby` on each flagged input
- **locale/i18n:** en-GB
- **failure-mechanism:** none — summary count/membership/links/wording all agree with the flagged state (negative control)
- **developer persona:** A developer who built the summary from the **same single validation result set** that drives the inline flags: one `errors[]` array is iterated once to render both the summary list (with anchors to each field's `id`) and the inline messages, so they cannot drift apart. The count is `errors.length`. This is the correct G83/G139 implementation, included to verify the aspect rewards reconciliation rather than flagging every multi-error summary.

## Element / selector carrying the issue
None — this is the negative control. The relationship to verify: `.summary ol li a` targets
(`#email`, `#dob`) === the set of `input[aria-invalid="true"]` (`#email`, `#dob`), and each link's text
matches the target field's `.msg`. All consistent.

## Exact accessibility mechanism (what AT experiences, why it passes)
A screen-reader user hears: "There are 2 problems… Email address must be in the format… Date of birth
must be a real date in the past…". Activating the email link moves focus to the email field (whose inline
message confirms the same problem); activating the date-of-birth link moves focus to that field
(likewise). Every item the summary names is genuinely in error, every item in error is named, and each
jump link reaches the control its text describes. The user can reliably determine the full set of what is
wrong and navigate to each. This satisfies SC 3.3.1: the items in error are identified and described in
text, and the aggregate description agrees with the page's actual state.

## Expected ACT-style outcome
**passed**

## Why automated tools miss it (i.e., why this is a meaningful control)
Automated tools cannot *confirm* coherence any more than they can detect incoherence — they have no
model of summary↔state agreement, so they would treat this page exactly as they treat the failing cases
in this aspect (no finding either way). Its correctness is only verifiable by the same human
reconciliation: build the flagged set, compare it to what the summary enumerates and links to, and check
the wording matches. This control ensures the aspect tests that reconciliation produces *pass* when the
summary is truthful, not a blanket suspicion of error summaries.

## Citation
> **WCAG 2.2 Understanding 3.3.1 (Intent), `wcag-understanding/error-identification.html`:**
> "In the case of an unsuccessful form submission, it is not sufficient to only re-display the form
> without providing any hint that the submission failed. The error must be indicated in text."

> **G83 (Examples), `wcag-techniques/general/G83.html`:**
> "the form is re-displayed with a text description at the top informing which mandatory fields were
> omitted. Each omitted mandatory field is also identified using a text label so that the user does not
> have to return to the list at the top of the form to find the omitted fields."

(Here the top-of-form description names exactly the fields in error and each is also identified inline —
the summary and the flagged state agree, so the items in error are correctly identified and the page
passes.)
