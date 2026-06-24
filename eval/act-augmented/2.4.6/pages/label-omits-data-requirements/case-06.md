# case-06 — PASS control: same date and required-email fields, now with the requirement cue inline

## Scenario
A term-life insurance quote form ("Beacon Mutual"). This is the boundary **pass** control for the
aspect: it reuses the exact fields that fail in case-01 (a free-text date) and case-02 (a required
email), but each label now carries its applicable data requirement inline. The date field is labelled
**"Date of birth (MM/DD/YYYY)"** — the accepted format is stated up front, not hidden behind an error.
The required email is labelled **"Email (required)"**, stating its required-status consistently with the
page's "*" legend. A ZIP field is labelled **"ZIP code (5 digits)"**, stating its data type/length.
Each label conveys both topic and requirement, so a user knows what input is expected before submitting.

## Attribute tuple
- **content-domain:** insurance quote wizard (term-life)
- **UI-component/pattern:** quote-start form with a "*" required legend and inline format cues
- **host-language construct:** `<label>` carrying the format/required cue inline + `<input>` with matching `pattern`/`placeholder`
- **locale/i18n:** en-US
- **failure-mechanism:** none — control case; the requirement cue that the failing cases omit is PRESENT in the label

## Developer persona
An insurance-product team ran a usability test on an earlier build where users mistyped dates and missed
that email was mandatory. The fix the team shipped was to put the expected format and required-status
directly into each visible label (and to keep the `placeholder`/`pattern` consistent with it), rather
than relying on inline validation errors. This page is that corrected build.

## Element / selector carrying the issue
No failing element. The relevant controls are `#dob` (label "Date of birth (MM/DD/YYYY) *"), `#email`
(label "Email (required) *"), and `#zip` (label "ZIP code (5 digits) *"). Each label states the
applicable data requirement, and the input attributes (`placeholder`, `pattern`, `maxlength`) agree with
the labelled format.

## Exact accessibility mechanism (what AT experiences, why it passes)
A screen-reader user hears "Date of birth (MM/DD/YYYY), required, edit text" — the accessible name now
includes both the topic and the date format, so the user knows to type month-first in MM/DD/YYYY before
attempting submission. "Email (required), edit text" conveys the required-status in the visible label,
consistent with the legend, so the user knows the field must be completed. "ZIP code (5 digits)" states
the data type/length. No requirement is hidden behind an error message; the labels satisfy TT 5.B's
"users know what input data is expected" both for purpose and for applicable data requirements. This is
the canonical-pass shape G131 describes (a label that makes the component's purpose — and here its
requirements — clear).

## Expected ACT-style outcome
**passed**

## Why automated tools miss it
Automated tools would also "pass" this page — but for the shallow reason that the labels are present,
associated, and non-empty, which is the *same* signal they emit for the failing cases 01–05. The point
of this control is that the genuine pass/fail difference (requirement cue present vs. absent) is exactly
the dimension no automated checker evaluates: a tool cannot tell that this label *does* communicate the
data requirement while case-01's "Date" does not. Confirming this page truly passes the descriptiveness
limb requires a human to read the label and judge that the format/required cue is present and accurate.

## Citation
> **WCAG Technique G131 — Providing descriptive labels, Description:**
> "The objective of this technique is to ensure that the label for any interactive component within web content makes the component's purpose clear. ... The label may also be used to include text or a text symbol indicating that input is required."

(Verbatim from `wcag-techniques/general/G131.html`. Here "Email (required)" uses exactly this device, and the date/ZIP labels make purpose and format clear.)

> **Trusted Tester v5.1.3 — Test 5.B, Evaluate Results:**
> "Each visual form label is sufficiently clear and descriptive, so users know what input data is expected"

(Verbatim from `refs/trusted-tester/sc-2.4.6-headings-and-labels.md`. With "(MM/DD/YYYY)", "(required)", and "(5 digits)" in the labels, users know what input is expected, so this page satisfies the test.)
