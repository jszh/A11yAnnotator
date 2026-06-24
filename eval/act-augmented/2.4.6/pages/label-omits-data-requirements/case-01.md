# case-01 — "Date" text field silently requires DD-MM-YYYY (format revealed only after submit)

## Scenario
A UK borough council self-service form, "Report a missed bin collection". It asks the resident for the
date their bin was not emptied. The control is a plain `type="text"` input (deliberately not
`type="date"`, so no native picker hints at the order) labelled with the single topically-correct noun
**"Date"**. The JavaScript validator accepts **only** DD-MM-YYYY (day-first). A resident who types
"11/06/2026" (US-style), "2026-11-06", or "6 November 2026" is rejected. The required format
(DD-MM-YYYY) appears for the first time only in the error message that fires *after* the failed submit.

## Attribute tuple
- **content-domain:** government / civic services portal (UK local council)
- **UI-component/pattern:** GOV.UK-style single free-text date field with an error summary
- **host-language construct:** `<label for>` + free-text `<input type="text">` + JS regex validator
- **locale/i18n:** en-GB (day-first ordering is the locale trap — ambiguous against US/ISO habits)
- **failure-mechanism:** label names the topic but omits the required date-format cue; format disclosed only on error

## Developer persona
A council web officer copied a GOV.UK Design System single-question page pattern but simplified the
recommended *three-input* day/month/year date component down to one text box "to save space" on mobile.
In doing so they dropped the component's built-in hint text ("For example, 27 3 2007"). The validation
regex was lifted from a back-office system that stores dates day-first, so the field quietly enforces
DD-MM-YYYY while the label was trimmed to just "Date".

## Element / selector carrying the issue
`#missed-date` (`input[name="missed-date"]`), visible label "Date" associated via
`label[for="missed-date"]`. There is no `hint` paragraph and no `aria-describedby` populated before
submission; the format constraint lives only in the submit-handler regex and the error message.

## Exact accessibility mechanism (what AT experiences, why it fails)
A screen-reader user tabbing to the field hears "Date, edit text" — a correctly associated, non-empty
accessible name, so 4.1.2 and 3.3.2 (presence) are satisfied. But the name communicates only the
*topic* (a date), not the *applicable data requirement* (day-first DD-MM-YYYY with hyphens). The user
has no way to know the field rejects the perfectly reasonable inputs "11/06/2026" or "6 Nov 2026". They
discover the requirement only by submitting and failing — which is precisely the situation TT 5.B's
Note rules out ("An error message is not sufficient to communicate the expected format"). G131 and the
GOV.UK pattern both expect the format cue to be in the label/instruction up front. The defect is purely
the missing requirement cue: the topic is correct, so this is not the topic-mismatch case ACT cc0f0a
already covers.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
The `<label>` is present, programmatically associated through `for`/`id`, and non-empty; the input has
a valid type and no missing attributes — axe-core, WAVE and Lighthouse all report a correctly labelled
field and raise nothing. No static scanner parses the submit-handler regex to learn the field demands
day-first DD-MM-YYYY, and none can judge that "Date" alone fails to tell a user what input is expected.
Recognising the descriptiveness shortfall requires a human to reason that "Date" is topically right but
requirement-blind, and that the only format disclosure happens after an error.

## Citation
> **Trusted Tester v5.1.3 — Test 5.B, How to Test step 2:**
> "Determine whether labels and/or instructions for form components sufficiently describe the **purpose and applicable data requirements** (date formats, required fields, data type, etc.)."

(Verbatim from `refs/trusted-tester/sc-2.4.6-headings-and-labels.md`. The label "Date" gives the purpose but omits the date-format data requirement this step enumerates first.)

> **Trusted Tester v5.1.3 — Test 5.B, Notes:**
> "An **error message is not sufficient** to communicate the expected format to pass this test."

(Verbatim from `refs/trusted-tester/sc-2.4.6-headings-and-labels.md`. Here the DD-MM-YYYY format is disclosed only in the post-submit error, which this Note explicitly disallows.)
