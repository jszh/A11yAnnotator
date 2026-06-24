# case-06 — ATS job application: Education and Work-experience sections zig-zag in tab order

## Scenario
A "Talentforge" applicant-tracking-system (ATS) application, step 2 of 4 ("Background"). A
single-column form shows two stacked sections under headings: **Education** (Highest degree,
School/university, Graduation year) sits as a complete block **above** **Work experience**
(Most recent job title, Most recent company, Years in role). Visually one section is wholly
above the other. Every control has a real `<label for>`, correct programmatic name/role, and
is keyboard-operable; there is **no `tabindex`**. But the DOM interleaves the two sections
row-by-row: education-degree, work-title, education-school, work-company, education-year,
work-years. The CSS grid pins each field into its section block, so a sighted user sees two
clean blocks while keyboard focus jumps ~300px down to Work and back up to Education on
alternate Tabs.

## Attribute tuple
- **content-domain:** job board / ATS application
- **UI-component / pattern:** single-column multi-section CV form (stacked sections, not columns)
- **host-language construct:** one single-column CSS grid with named row areas; fields emitted
  in interleaved DOM order, routed into the correct stacked section by grid-area; no `tabindex`
- **locale / i18n:** en-US
- **failure-mechanism:** two semantic groups (Education vs. Work experience) interleaved by
  raw DOM order; focus alternates between the two CV sections instead of completing each

## Developer persona
A developer building the multi-step application form generated the Background step from a
flat field config that listed the fields in *parallel pairs* — `[degree, jobTitle], [school,
company], [gradYear, yearsInRole]` — intending the left of each pair for Education and the
right for Work. They later changed the design from a two-column to a single stacked layout
and used a grid to drop each field into the right section block, but never re-ordered the
underlying field list. The DOM therefore still emits the pairs interleaved, so the keyboard
focus alternates between Education and Work even though the page now looks like two stacked
sections.

## Element / selector carrying the issue
The interleaved field sequence inside `form[aria-label="Education and work history"]`. The
clearest interloper is `#wk-title` (Work → Most recent job title), which in DOM/tab order
receives focus **immediately after** `#ed-degree` (Education → Highest degree) and **before**
`#ed-school` (Education → School). Primary selector to inspect: `#wk-title`.

## Exact accessibility mechanism (what AT experiences, why it fails)
- **Sighted mouse user:** fills Education top-to-bottom, then Work experience. Fine.
- **Keyboard / screen-reader user:** Tab 1 → Education *Highest degree*. Tab 2 → **Work *Most
  recent job title*** — focus leaps from the Education block down past the "Work experience"
  heading into the Work block. Tab 3 → Education *School* (back up). The applicant starts
  describing their degree, is yanked into their job history, then back to their school. The
  two distinct parts of a résumé are woven together; a user can easily type their university
  into the company field or their job title where the degree belongs.
- **Verified with Puppeteer** (real Tab key presses): the focused element's y-coordinate
  alternates between the Education block (y ≈ 335–491) and the Work block (y ≈ 647–802):
  `ed-degree(y335) → wk-title(y647) → ed-school(y413) → wk-company(y725) → ed-year(y491) →
  wk-years(y802)` — confirming focus zig-zags up and down between the two sections.

## Expected ACT-style outcome
**failed** (SC 2.4.3 — focus order interleaves the Education and Work-experience sections;
the sequence does not preserve the meaning of the two CV groups).

## Why automated tools miss it
No `tabindex`; every input/select has a correct `<label for>` and is operable; both sections
have visible headings; contrast passes. axe/WAVE/Lighthouse therefore see a valid form. They
have no model that "School/university and Graduation year belong with Highest degree
(Education)" and that the job fields are a separate section — so they cannot detect that the
Work fields are woven into the Education section. Recognising the two CV sections as distinct
groups, and that focus crosses between them on every Tab, requires understanding the content.

## Citation
> "Focus order needs to allow the user to navigate focusable elements in a logical order, and
> that order needs to preserve any meaning or operation that the page is conveying."
— wcag-understanding/focus-order.html (Intent of Focus Order)

> "Most noticeable when focus order does not follow the logical order of operation (normally
> top to bottom, left to right)."
— refs/trusted-tester/sc-2.4.3-focus-order.md (Test 4.F — How to Test, step 2a)
