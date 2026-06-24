# case-01 — Correct "Use MM/DD/YYYY" suggestion stranded in the footer; the date field is at the top with no inline fix

## Scenario
A festival performer-registration form (Cascade Folk Festival). The user typed `30/6/26`
into **Preferred performance date**, which the server rejects. The field is near the top of a
three-section form. On submit, the field shows an inline error that *identifies* the problem
("That date isn't valid. Please check and re-enter.") but offers **no suggested format**. The
one place the actual correct suggestion appears — "Enter dates using the format MM/DD/YYYY (for
example, 06/30/2026)" — is rendered in the page **footer**, after the Submit button and below the
Act-details and Contact sections. The suggestion text is correct and adequate; it is simply
stranded far from the field that erred.

## Attribute tuple + developer persona
- **content-domain:** events / ticketing (arts festival registration)
- **UI-component/pattern:** long multi-fieldset form with a top error summary + a global "Formatting help" footer block
- **host-language construct:** `<input aria-invalid="true" aria-describedby="perf-date-err">` whose describedby points only to the no-fix inline error; the format tip lives in `<footer class="sitefoot">`
- **locale/i18n:** en-US; MM/DD/YYYY ordering (US-customary), user supplied a DD/MM-looking value
- **failure-mechanism:** physically distant — the correct suggestion is provided only in the footer, separated from the field by every other section and the submit button
- **persona:** A junior dev wired per-field validation that prints "check and re-enter" for any
  bad date, then satisfied a "tell users the date format somewhere" ticket by dropping a
  Formatting-help list into the shared site footer partial. On the short design comp the footer
  sat just under the date section, so the tip read as nearby; once the production form grew two
  more sections, the footer fell far below the field and the connection was lost. The dev assumed
  "the format is on the page" was enough.

## Element / selector carrying the issue
- Field that erred: `input#perf-date[aria-invalid="true"]`, described only by `#perf-date-err`
  (which contains no format/suggestion).
- The correct suggestion lives in `footer.sitefoot > ul > li` ("Enter dates using the format
  **MM/DD/YYYY** …"), structurally and visually remote from `#perf-date`.

## Exact accessibility mechanism (what AT experiences / why it fails)
- A **sighted** user reads the inline red error at the field, learns only that the date is wrong,
  and is given no clue that the system wants month-first MM/DD/YYYY. To find that out they would
  have to scroll past Act details, Contact, and the Submit button to a footer "Formatting help"
  list they have no reason to look in — undue navigation that defeats the point of a suggestion.
- A **screen-reader** user on the date field hears "Preferred performance date, edit, invalid
  data. That date isn't valid. Please check and re-enter." via `aria-describedby="perf-date-err"`.
  The MM/DD/YYYY tip is **not** referenced by the field and is announced only if the user later
  reads the entire footer — many controls away — and remembers it applies to a field above.
- The correct suggestion thus exists on the page but is **not provided to the user** for the
  field that erred at the moment they need it.

## Expected ACT-style outcome
**failed** — A correct, knowable suggestion (MM/DD/YYYY) exists, but it is not provided in a way
the user can connect to or reach from the erroring date field; per G177 it must sit close to /
linked from the field, and per G84 the text must let the user locate the field's fix easily.

## Why automated tools miss it
The suggestion string is present, non-empty, high-contrast, inside a labelled footer region; the
field has a programmatic name and an `aria-describedby` error. Every "is there error text / a
suggestion somewhere in the DOM?" and "does the field have a name?" check passes. axe, WAVE, and
Lighthouse have no model of the reading-order or pixel DISTANCE between a suggestion and the
control it governs, and cannot decide whether a user reaching the date field would perceive the
footer tip as that field's fix. That is a rendered-layout / point-of-need judgment.

## Citation
- **Reference:** WCAG 2.2 Technique G177 — Providing suggested correction text —
  `wcag-techniques/general/G177.html`
  > "Suggestions or links to the suggestions should be placed close to the form fields they are
  > associated with, such as at the top of the form, preceding the form fields, or next to the
  > form fields requiring correction."
- **Reference:** WCAG 2.2 Understanding Error Suggestion, In brief —
  `wcag-understanding/error-suggestion.html`
  > "Where errors are detected, suggest known ways to correct them."
- **Reference:** WCAG 2.2 Technique G84 — Providing a text description … —
  `wcag-techniques/general/G84.html`
  > "provides ways to locate the field(s) with a problem easily"
