# case-04 — RTL Arabic address grid: postal-code error placed in the City column

## Scenario
An Arabic-language (`lang="ar" dir="rtl"`) membership-registration form (مكتبة المعرفة),
Section 2 (Address). A 2-column × 3-row CSS grid holds **الرمز البريدي / Postal code**
(column 1, value `11564`, flagged red) and **المدينة / City** (column 2, empty). The
postal-code error "الرمز البريدي يجب أن يتكوّن من 5 أرقام" ("the postal code must be 5
digits") is placed by explicit grid coordinates into **grid-column 2, row 3** — the City
column's message slot — so on screen it sits directly under the empty **City** input. No
`aria-describedby` links the message to any control.

## Attribute tuple + developer persona
- **content-domain:** community library / membership registration
- **UI-component/pattern:** RTL two-column address grid
- **host-language construct:** `display:grid` with explicit `grid-column` / `grid-row`
  coordinate placement; `dir="rtl"`, `lang="ar"`
- **locale/i18n:** Arabic, right-to-left
- **failure-mechanism:** error positioned by hard-coded grid coordinates into the wrong
  column; DOM keeps it adjacent to its real field
- **persona:** A localization team received an LTR form and re-laid it out with explicit
  grid coordinates so columns would line up under RTL. They set the postal-code error to
  `grid-column: 2` (intending the postal column, but in their mental LTR model column 2 was
  the right side) and never re-checked the rendered RTL result, where column 1 paints on the
  right and the error lands under City on the left.

## Element / selector carrying the issue
`.postal-msg` (the postal `.msg` span). Its CSS sets `grid-column:2; grid-row:3`, placing it
under `#city` while its text names the postal-code field.

## Exact accessibility mechanism (what AT experiences / why it fails)
- No `aria-describedby`: neither input is programmatically described by the message.
- In the DOM the error span is authored immediately after `#postal`, so source-order /
  DOM-proximity analysis correctly pairs them.
- A **sighted** Arabic reader scans the message under the **City** field and reads a
  postal-code message there. The City field (actually empty) carries a message about a
  different field; the postal field — whose value `11564` is in fact a valid 5-digit code —
  is flagged red with no message beneath it.
- Presentation identifies the City field, contradicting both the message text and which
  field is genuinely incomplete.

## Expected ACT-style outcome
**failed** — rendered presentation identifies the City field, not the field the message
names; the item in error is not correctly identified.

## Why automated tools miss it
The message is non-empty, visible, in the accessibility tree, descriptive, and valid BCP-47
`lang` is set; with no `aria-describedby` there is nothing for a rule to flag, and DOM order
keeps the error adjacent to its field. The fault appears only after grid layout *and* the
bidi (RTL) column flip, in rendered geometry. Scanners do not compute post-layout/post-bidi
bounding boxes, nor read the Arabic message to learn which field it names, so they cannot
detect the mismatch.

## Citation
- **Reference:** ACT Rule 36b590, Expectation 1 — `act-rules/extracted/36b590.md`
  > "Each test target either has no form field error indicators , or at least one of the
  > form field error indicators allows the identification of the related test target,
  > through text , or through non-text content , or through presentation ."
- **Reference:** WCAG 2.2 Understanding Error Identification — examples of an input error —
  `wcag-understanding/error-identification.html`
  > "the user fails to enter the proper abbreviation in a state, province, or region field;"
