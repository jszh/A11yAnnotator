# case-02 — Error summary asserts "City is required" but no City field exists anywhere on the form

## Scenario
A restaurant catering-enquiry form ("The Copper Pot Kitchen"). After a failed submit, a red
`role="alert"` summary at the top lists three errors: *Event date is required*, *City is required so we
can confirm travel*, and *Number of guests must be at least 1*. Two of those (Event date, Number of
guests) correspond to fields that are genuinely flagged below (`aria-invalid="true"`, red border,
inline message). The middle line — **"City is required"** — names a field that **does not exist** on
the form: the page collects a single free-text **"Venue name & full address"** textarea, with no
separate City input, label, or control anywhere in the DOM. The summary therefore demands the user fix
a phantom field they can never locate.

## Attribute tuple + developer persona
- **content-domain:** restaurant catering / event ordering
- **UI-component/pattern:** top-of-form `role="alert"` error summary + inline field errors
- **host-language construct:** `<textarea>` venue address replacing what was once discrete address fields; summary line referencing a removed field
- **locale/i18n:** en-GB
- **failure-mechanism:** phantom field — summary names a field that is absent from the page
- **developer persona:** An agency owner refactored the form: the old version had separate Street / **City** / Postcode inputs, and the validation summary was generated from a hard-coded array of expected fields. During a redesign they collapsed the three address inputs into one free-text "Venue name & address" textarea but **forgot to remove "City" from the summary's required-fields list**. The validator still appends "City is required" to the summary whenever the (now non-existent) city value comes back empty from the request — which it always does. Because nobody completes the form to the point of a multi-error submit during QA, the orphaned line shipped.

## Element / selector carrying the issue
`.alert ul li` (second list item, "City is required…"). There is no element matching
`label[for], input, select, textarea` whose accessible name is "City"; the only address control is
`#venue` ("Venue name & full address"). The incoherence is the summary line vs. the absence of any
corresponding field.

## Exact accessibility mechanism (what AT experiences, why it fails)
A screen-reader user hears the alert: "We couldn't send your enquiry. Event date is required. City is
required so we can confirm travel. Number of guests must be at least 1." They then traverse every form
control looking for a "City" field to correct — and there is none. They cannot determine *what is
wrong* for that asserted error, because the item the summary says is in error is not present on the
page. SC 3.3.1 requires that "the item that is in error is identified"; an error attributed to a
non-existent item cannot be identified or resolved, and it also undermines the user's trust in the
other (valid) summary lines. The individual sentence is a fluent error description (it would pass
message-level checks), but the summary as a whole misidentifies the items in error.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
There is nothing structurally malformed: the summary is a valid visible live region, each line is a
fluent specific message, and the two real errors are correctly wired with `aria-invalid` and associated
text. The phantom line has no broken `for`/`id` pairing (it is plain prose, not a link), no empty
attribute, no orphaned reference — so axe/WAVE/Lighthouse find no defect. Detecting that a summary line
refers to a field that does not exist in the DOM requires parsing the natural-language claim ("City is
required"), inferring it should correspond to a form control, and confirming no such control is present
— a semantic judgment outside any static rule's reach.

## Citation
> **WCAG 2.2 Understanding 3.3.1 (Intent), `wcag-understanding/error-identification.html`:**
> "The intent of this success criterion is to ensure that users are aware that an error has occurred and
> can determine what is wrong."

> **WCAG 2.2 Understanding 3.3.1 (Intent), `wcag-understanding/error-identification.html`:**
> "This SC requires that users be provided with information about the nature of the error, including the
> identity of the item in error."

(An error asserted for a field that is not on the page gives a false "identity of the item in error" and
makes it impossible to "determine what is wrong" for that claim.)
