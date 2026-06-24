# case-02 — Three-box date of birth, every part labelledby the one group caption

## Scenario
A UK council "Apply for a Blue Badge" service (GOV.UK-styled beta) collects the applicant's
date of birth as three boxes laid out **DD / MM / YYYY** with placeholders "DD", "MM",
"YYYY". The author wired `aria-labelledby="dob-label"` on all three inputs, where
`#dob-label` is the single group caption **"Date of birth"**. Each box's computed accessible
name is therefore the identical string "Date of birth". The role of each part (day, month,
year) is conveyed only by the visible `.cap` placeholders, which are `aria-hidden` and never
referenced by any input's name.

## Attribute tuple
- **content-domain:** government / public-sector eligibility form (Blue Badge disabled-parking application)
- **UI-component / pattern:** three-input date entry inside `role="group"` with one shared `<legend>`
- **host-language construct:** `aria-labelledby="dob-label"` on every sub-input pointing at one caption (shared-label anti-pattern)
- **locale / i18n:** en-GB (day-month-year order — opposite of US)
- **failure-mechanism:** all parts inherit one generic group name via `aria-labelledby`; no per-part role name (F86 semantic variant)

## Developer persona
A government-contractor developer started from the GOV.UK "date input" component, which
correctly gives each box its own `<label>` ("Day", "Month", "Year"). During a redesign they
swapped the per-box `<label>`s for plain placeholder spans to "tighten the layout," and — to
keep the inputs from being flagged as unlabeled — pointed each one's `aria-labelledby` at the
fieldset's existing "Date of birth" legend. The automated scan stayed green because every
input now resolves to a non-empty name, so the regression was never noticed.

## Element / selector carrying the issue
- Three controls: `fieldset .date-cell > input[aria-labelledby="dob-label"]`
  (day = `value="27"`, month = `value="03"`, year = `value="1958"`).
- Shared name source: `legend#dob-label` = "Date of birth".
- Per-part roles exist only in `.date-cell .cap` (`DD` / `MM` / `YYYY`), marked
  `aria-hidden="true"`, so they never enter the accessible name.

## Exact accessibility mechanism (what AT experiences)
Tabbing through the group, a screen-reader user hears: "Date of birth group. Date of birth,
edit, 27. Date of birth, edit, 03. Date of birth, edit, 1958." All three boxes announce as
the same field. The user cannot tell that the first wants the *day*, the second the *month*,
the third the *year* — and because the locale is en-GB (day first), a user who assumes the
US month-first order will silently transpose 27 and 03 into an invalid date, or put their
birth year in the wrong box. The "DD / MM / YYYY" cue that disambiguates this for a sighted
user is `aria-hidden`, so it is never spoken. Each field is *named* but not *differentiated* —
the F86 "undefined text fields" experience surviving a per-field non-emptiness check.

## Expected ACT-style outcome
**failed** — SC 4.1.2 (F86). Per-rule: ACT rule **e086e5** returns *passed* for each input
(its `aria-labelledby` resolves to the non-empty "Date of birth"), so the automated layer
sees three correctly-named fields and reports nothing.

## Why automated tools miss it
e086e5 fires only on an *empty* accessible name. Here every input resolves through a valid
`aria-labelledby` IDREF to non-empty text, so all three pass. Multiple controls legitimately
sharing one label reference is common and valid (e.g. a column header), so axe will not flag
the duplicate `aria-labelledby` target either. Catching the real defect requires reading the
visual "DD / MM / YYYY" order, understanding that this is a compound date whose parts have
distinct roles, and judging that three identical "Date of birth" names cannot tell day from
month from year — a semantic + visual inference no static checker performs.

## Citation
**Reference:** WCAG Technique F86 — *Failure of Success Criterion 4.1.2 due to not providing
names for each part of a multi-part form field, such as a US telephone number*
(`wcag-techniques/failures/F86.html`).

> "The failure occurs when there is not a name for each of the three fields in the
> Accessibility API. A user with assistive technology will experience these as three undefined
> text fields."

**Supporting reference:** WCAG Technique F86, third example (label associated only at the
group/first level), which describes the same single-name-for-the-whole defect:

> "A user with assistive technology will be led to believe that the first field is for the
> entire phone number, and will experience the second and third fields as undefined text
> fields."
