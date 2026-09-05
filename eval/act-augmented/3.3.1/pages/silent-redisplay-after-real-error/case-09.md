# case-09 — paired PASS repair of case-01

## Source and exact repair
This keeps case-01's full civic booking page, including applicant, facility, attendee control, breadcrumb, policy, retained past date, and footer. The false-success heading/lead are replaced with failure text, and the event-date field references the exact local `#evdate-error` explanation.

## Expected outcome
**passed.** The bounced submission and specific event-date error are both identified in text.

## Why tools may still over-report
An extractor limited to `#evdate` sees a historic value and invalid state but may fail to follow the IDREF to the explanatory paragraph.

## Citation
`wcag-understanding/error-identification.html`:
> "In the case of an unsuccessful form submission, it is not sufficient to only re-display the form without providing any hint that the submission failed. The error must be indicated in text."
