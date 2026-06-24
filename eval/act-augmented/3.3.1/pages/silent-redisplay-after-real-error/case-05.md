# case-05 — Insurance quote wizard silently advances to "Step 3 of 3" after an invalid ZIP on Step 1 was swallowed, no error surfaced

## Scenario
A Cedar Mutual Auto 3-step quote wizard. On Step 1 the user typed an **invalid ZIP ("0" — too short
to be a US ZIP)**, which the rating engine requires to price a policy. Instead of stopping on Step 1
and reporting the bad ZIP, the wizard **advanced the user to Step 3** (it skipped Step 2 — coverage
options — because it had no valid ZIP to fetch them). The progress indicator now reads "Step 3 of 3,
Review & buy"; the review summary freezes the invalid ZIP "0" as plain text and shows a placeholder
premium "$—" the engine couldn't compute. There is **no error text** anywhere. The page advanced
past a real validation failure with no indicator — the cross-page silent-advance variant.

## Attribute tuple
- **content-domain:** insurance quote wizard
- **UI-component/pattern:** multi-step stepper / wizard (APG stepper) with a read-only review (`<dl>`) on the final step
- **host-language construct:** ordered-list stepper with `aria-current="step"` + a definition-list summary echoing prior-step values
- **locale/i18n:** en (US ZIP)
- **failure-mechanism:** wizard advances silently past an error on a PRIOR step; the error field is not even on the current page

## Developer persona
A developer building the wizard treated "Next" as pure navigation: each step's "Next" handler stores
whatever was typed and routes forward, and the rating service is called lazily on Step 3. When the
ZIP is unusable the service returns no coverage options, so the Step 2 router (which needs options to
render) short-circuits straight to Step 3 rather than erroring. The team's mental model was "the
final review will show everything, so the user will catch problems there" — but they never rendered
a validation message and never tested an invalid ZIP, so the wizard jumps to review with a frozen bad
value and a blank price.

## Element / selector carrying the issue
The page-state combination: `ol.steps li.current` reading "Step 3 of 3" while `dl.review dd`
displays `ZIP code: 0` (invalid) and `.quote-box .big` shows `$—` (uncomputable). The erroring field
(the ZIP) is not even an editable control on this page — it is shown read-only. The failure is the
absence of any error indicator on a page that is the result of swallowing a Step-1 validation error.

## Exact accessibility mechanism (what AT experiences, why it fails)
An input error was automatically detected — the ZIP was unusable, which is why Step 2 was skipped and
the premium could not be computed. 3.3.1 requires that error be described in text. Instead a
screen-reader user is told "Step 3 of 3, Review & buy," reads a clean-sounding summary, and reaches a
"Confirm & buy" button — with no announcement that their ZIP is invalid or that a step was skipped.
The only tells are "ZIP code: 0" and a premium of "$—", neither flagged as an error. The user
believes they are one click from buying a policy; in reality the quote is invalid and the failure was
never described. Because the error lives on a step the user has already left, even a sighted user can
easily miss it.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
Every element is well formed: the stepper is a labelled `<ol>` with `aria-current`, the summary is a
semantic `<dl>`, the email field has a real label, and the values are plain text. There is **no error
markup** to lint. A scanner cannot know this is the wrong step to be on (Step 2 was skipped), that the
displayed ZIP "0" is invalid, or that an error on a prior step was swallowed — those are stateful,
cross-page facts. Reconstructing the wizard's flow and recognizing the silent advance past a real
failure requires human reasoning about page state, which static tools do not perform.

## Citation
> **Trusted Tester v5.1.3, SC 3.3.1 (How to Test), `refs/trusted-tester/sc-3.3.1-error-identification.md`:**
> "Intentionally violate formatting and other form instructions … Attempt to submit the form and/or
> move to the next page. Determine whether the error is identified and described in text."

> **WCAG 2.2 Understanding 3.3.1 (Intent), `wcag-understanding/error-identification.html`:**
> "The intent of this success criterion is to ensure that users are aware that an error has occurred
> and can determine what is wrong."

(TT's procedure explicitly covers "move to the next page"; here moving to the next page is exactly
where the error was lost — the wizard advanced two steps past a detected ZIP error and described it
in no text.)
