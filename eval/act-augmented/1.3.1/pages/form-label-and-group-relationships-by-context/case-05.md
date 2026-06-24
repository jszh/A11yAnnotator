# case-05 — RTL Arabic split date-of-birth: three inputs answer one labelled question but are never grouped

## Scenario
A Health-Ministry (Arabic, `dir="rtl"`) new-patient registration form splits date of birth into three inputs — اليوم / الشهر / السنة (Day / Month / Year) — under a single visual heading تاريخ الميلاد ("Date of birth") rendered as a styled `<div class="group-q">`. Each of the three inputs has an accessible name via `title="يوم"`, `title="شهر"`, `title="سنة"`, so no input is unnamed. But there is no `<fieldset>`/`<legend>` and no `role="group"` + `aria-labelledby`, so the three inputs are never programmatically tied to the one تاريخ الميلاد question they jointly answer.

## Attribute tuple
- **content-domain:** healthcare / government patient portal
- **UI-component / pattern:** multi-part (split) date field
- **host-language construct:** three `<input>`s with `title` sub-names under a styled `<div>` heading; no group element
- **locale / i18n:** Arabic (`lang="ar"`, `dir="rtl"`) — RTL visual order vs DOM source order
- **failure-mechanism:** multi-field group answering one visually-shown question, not programmatically grouped; RTL adds a visual-vs-source ordering wrinkle

## Developer persona
A localization contractor adapted an existing English patient form for the Ministry's Arabic portal. They translated the labels, set `dir="rtl"`, and split the date into three boxes for input convenience. To silence the scanner's "input has no label" warning on the tiny date boxes, they added `title` attributes with the Arabic words for day/month/year. The scan went green; the contractor never added a group element because "every box has a name."

## Element / selector carrying the issue
The `.dob` block: three `input[title]` (سنة / شهر / يوم) governed visually by `div.group-q` تاريخ الميلاد, which is not their programmatic group label.

## Exact accessibility mechanism (what AT experiences, why it fails)
- Each date input has a non-empty accessible name from `title` — e086e5 passes on all three.
- A screen-reader user encounters three independent fields announced "Year, edit text", "Month, edit text", "Day, edit text" with NO announcement that they compose a single "Date of birth" value. The unifying question تاريخ الميلاد is an unassociated `<div>` and is never spoken when entering the group.
- The sub-names alone are ambiguous out of context: "Year" of WHAT? The single governing question that a sighted user reads above the row never reaches AT. TT 5.C requires the controls to be programmatically associated with their question.
- RTL wrinkle: visual right-to-left order is Day, Month, Year, but DOM source order is Year, Month, Day. The per-box `title` is individually correct, but a reviewer must read the layout to confirm the visual order matches — and, more decisively, the GROUP question is missing regardless of order.

## Expected ACT-style outcome
**failed** (SC 1.3.1 — the three inputs jointly answer one visually-labelled question but that group relationship is not programmatically determinable).

## Why automated tools miss it
axe e086e5 sees three named inputs and reports no violation. No static rule recognizes that three adjacent inputs jointly answer a single question shown above them, nor that the styled `<div>` تاريخ الميلاد should be the group's programmatic label via `<fieldset>`/`<legend>` or `role="group"` + `aria-labelledby`. Deciding that اليوم / الشهر / السنة compose the one تاريخ الميلاد question — and that the group label never reaches the accessibility tree — requires reading the RTL layout and reasoning about which controls form a group sharing a common question. That is contextual human judgment beyond any DOM linter.

## Citation
> "If the ANDI Output does not adequately define the form element, review **other programmatic associations** … to determine whether they provide/contribute to the form component's description, cues, or instructions."
— refs/trusted-tester/sc-1.3.1-info-and-relationships.md (Test 5.C, How to Test #4)

> "Social security number fields which are nine digits long and broken up into three segments can be grouped using `role="group"`. … The group can be labeled using `aria-labelledby`."
— wcag-techniques/aria/ARIA17.html (ARIA17, Social Security Number example + Description)
