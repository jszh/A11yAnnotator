# case-03 — Job application: error summary lists failing fields only by re-coloring their names red

## Scenario
A job-application page in its **post-submit error state**. At the top is an "error summary" card titled "Review your application before submitting." The card lists **all eight** field names as a two-column checklist. The three that failed (Phone, Years of experience, Cover note) are rendered in **red** (`#cf1d1d`); the five that passed stay in **neutral gray**. There is no "Error:" word per item, no icon, no error count, and no text pairing a field name with the word "missing" — the **only** thing distinguishing a failed item from a passed item in the summary is its hue. The form fields below carry plain borders (no per-field cue at all), so the summary is the sole place the error is surfaced.

## Attribute tuple
- **content-domain:** job board / applicant tracking system (ATS) application
- **UI-component / pattern:** error-summary card at top of form (the APG/GOV.UK "error summary" pattern), implemented as a single styled list
- **host-language construct:** `<section role="alert">` with a `<ul>`; failed items distinguished by `li.bad { color:#cf1d1d }` only
- **locale / i18n:** en-US
- **failure-mechanism:** F81 — error fields identified by color difference only, here at the *summary* level (the list, not the inputs)

## Developer persona
An agency front-end dev was told to "add an error summary like GOV.UK's." They reused an existing styled checklist component (gray rows) and, pressed for time, just added a `.bad` modifier that flipped the row red for failing fields — skipping the GOV.UK pattern's actual content (each row a link reading "Enter your phone number"). The result *looks* like an error summary and reads fine to them, because they can see which rows are red.

## Element / selector carrying the issue
`.errsum li.bad` (the `Phone`, `Years of experience`, and `Cover note` list items) — distinguished from `.errsum li` siblings only by `color:#cf1d1d` (red) vs `#67707a` (gray).

## Exact accessibility mechanism (what AT experiences / why it fails)
- **Sighted, full-color user:** scans the summary, sees three red rows, and fixes those fields.
- **Sighted color-blind / low-vision user:** sees an eight-item list of field names in two columns where every row has the same weight and size; with hue removed there is nothing marking which three failed. The card title says "Review your application" but never enumerates the bad fields in text. This user must trial-and-error every field — the *which-failed* information was conveyed by red alone.
- **Screen-reader user:** the `role="alert"` list is announced as eight plain field names with no "error" semantics on the red items (color is not exposed); a parallel 3.3.1 weakness, but 1.4.1 targets the missing **visible** non-color distinction.

## Expected ACT-style outcome
**failed** (SC 1.4.1 — F81: which fields are in error is conveyed by color difference only, at the summary level).

## Why automated tools miss it
The summary is a list of real, contrast-passing text inside a `role="alert"` region; the inputs are labeled. axe/WAVE/Lighthouse see no empty content, no missing label, no contrast issue, so they pass it. No automated rule understands that "red list item = errored field, gray = ok"; distinguishing the meaning carried by hue from neutral styling, and confirming no per-item text/icon backs it, is a human semantic judgment performed in the post-submit state.

## Citation
> "This objective of this technique is to describe the failure that occurs when a required field or an error field is marked with color differences only, without an alternate way to identify the required field or error field."
— wcag-techniques/failures/F81.html (Description)

> "Examples of information conveyed by color differences: “required fields are red\", “error is shown in red\", and “Mary's sales are in red, Tom's are in blue\"."
— wcag-understanding/use-of-color.html (Intent)

> "When color is used to convey information, indicate an action, prompt a response, or distinguish a visual element, another visual, onscreen method is used to convey the information which does not use color."
— refs/trusted-tester/sc-1.4.1-use-of-color.md (Evaluate Results / PASS if) — the onscreen non-color method this summary lacks.
