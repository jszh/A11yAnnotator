# case-02 — Date of birth captured as three Day/Month/Year selects with no "Date of birth" grouping

## Scenario
A municipal resident-parking-permit application (City of Hartwell), the "Applicant details"
step. The applicant's date of birth is collected as three separate native `<select>`
elements laid out in a tight inline row, labeled only "Day", "Month", and "Year". The trio
sits between a (correctly grouped) name fieldset and a single license-plate input. Nowhere
on the page — no legend, no heading, no helper text — does anything say these three selects
together compose the applicant's **date of birth**. The collective purpose of the set is
never stated.

## Attribute tuple + developer persona
- **content-domain:** government / civic services portal (parking permit)
- **UI-component/pattern:** three-`<select>` segmented date control (Day / Month / Year)
- **host-language construct:** native `<select>` trio in a flex row; no wrapping fieldset
- **locale/i18n:** en-US; month names spelled out
- **failure-mechanism:** the set's collective meaning ("Date of birth") is required to
  understand what is being selected but is never provided in text — only the per-segment
  Day/Month/Year labels exist
- **persona:** A civic-tech contractor reused a generic "date picker partial" from an
  internal component library. The partial renders three labeled selects and expects the
  PARENT page to supply the date's name via a surrounding `<legend>` or heading. On this
  page the author dropped the partial straight into the form and forgot to add the "Date of
  birth" legend, assuming the bday-* autocomplete tokens "made it clear." It renders fine,
  every select has a label, the autocomplete tokens are valid, so the linter is green.

## Element / selector carrying the issue
`.date-row` — the three selects `#dob-day`, `#dob-month`, `#dob-year`. They are not wrapped
in a `<fieldset>`/`<legend>`, are not preceded by a "Date of birth" heading, and have no
`aria-labelledby` pointing to any group description.

## Exact accessibility mechanism (what AT experiences / why it fails)
- Each select is individually labeled ("Day", "Month", "Year") and even carries correct
  `autocomplete` tokens (`bday-day`/`bday-month`/`bday-year`), so 4.1.2 and missing-label
  checks all pass.
- But "Day" / "Month" / "Year" read alone do not say day/month/year of WHAT. Per the
  Understanding, options-providing controls "must have an appropriate label so that users
  know what they are actually selecting"; here the user does not know what the selected
  date IS.
- A screen-reader user navigating the form hears "Day, combo box … Month, combo box …
  Year, combo box" with no announcement that they are entering a birth date — the group
  description per H71 is required here and is absent.
- The `autocomplete="bday-*"` tokens are invisible to users and are a 1.3.5 concern, not a
  3.3.2 label; they do not satisfy the requirement to present the label/instruction to all
  users. So the page fails SC 3.3.2 (F82's rationale generalized to a date trio).

## Expected ACT-style outcome
**failed** — a set of controls whose collective purpose (date of birth) is required for the
user to know what they are selecting provides no group-level label or instruction in text;
only ambiguous per-segment labels exist.

## Why automated tools miss it
All three selects have associated, visible, non-empty labels and valid autocomplete tokens,
so axe/WAVE/Lighthouse pass them. No rule requires a fieldset (H71 allows a visible heading
instead), and tools cannot infer that "Day/Month/Year" alone is semantically insufficient
or that the set's purpose is unstated. Recognizing the trio needs a "Date of birth" group
description, and that none is present, requires human reasoning about what the controls
collectively mean.

## Citation
- **Reference:** WCAG 2.2 Understanding Labels or Instructions, Intent —
  `wcag-understanding/labels-or-instructions.html`
  > "In the case of radio buttons, checkboxes, comboboxes, or similar controls that provide
  > users with options, each option must have an appropriate label so that users know what
  > they are actually selecting."
- **Reference:** WCAG Technique H71, Description — `wcag-techniques/html/H71.html`
  > "The individual label associated with each radio or checkbox control may not fully
  > convey the group's descriptive context. In this situation, it is essential that they be
  > grouped together semantically … as well as to provide an additional group level
  > description."
