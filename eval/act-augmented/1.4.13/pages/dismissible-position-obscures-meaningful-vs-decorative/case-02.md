# case-02 — "What's this?" help popover covers the next field's required marker, label, and the active input

## Scenario
A multi-step patient-intake form ("Insurance & Identification", Step 2 of 4) has a
"What's this?" help pill next to the **Insurance member ID** field. On hover/focus it opens
a help popover. There is **no keyboard dismiss** (no Escape handler, no close button, not
hoverable-to-close), so **Method 1 (non-obscuring positioning)** is the only available
compliance path. The popover opens **down and to the right** and lands on top of the **next
field** — covering the *Patient date of birth* label, its **required asterisk**, and the
member-ID input the user is filling. It obscures information-bearing, action-critical
content (a required-field marker and the field being completed), so Method 1 fails.

## Attribute tuple
- **content-domain**: healthcare / patient portal (new-patient intake)
- **UI-component/pattern**: form-field help popover ("What's this?")
- **host-language construct**: `<button class="help-trigger">` + `<div role="tooltip">`; JS class-toggle on `mouseenter`/`focus`
- **locale/i18n**: en (US date format)
- **failure-mechanism**: popup overlaps an adjacent required field's asterisk + label, and the member-ID input being edited

## Developer persona
A health-system contractor built the intake wizard and bolted help popovers onto fields
late in QA after clinicians complained patients entered the wrong number. They reused a
generic "popover opens to the bottom-right of its trigger" utility from the design system,
which assumed roomy desktop spacing. On this compact card the fields are stacked tightly, so
the popover overhangs the field below. The dev verified the popover *appeared* and that all
inputs had labels (the linter was happy) but never checked what the open popover covered or
whether Escape closed it.

## Element / selector carrying the issue
- Trigger: `button.help-trigger` (the "What's this?" pill on the member-ID field)
- Obscuring popup: `#memberId-pop` (`div[role="tooltip"].popover`)
- Obscured content: `label[for="dob"]` text + its `.req` asterisk, and the `#memberId` input

## Exact accessibility mechanism
A low-vision user magnifying the form opens the member-ID help to understand what to type.
The popover appears and **hides the required-field marker and label of the next field**
(date of birth), plus the member-ID input they were filling. With no dismiss key, they cannot
clear the popover in place to see the obscured required indicator — they must move focus away,
which closes the popover (and, per the show/hide logic, the help with it). The result: a
required field's "this is required" cue and the field under edit are hidden behind
non-persistent help, exactly the interference *Dismissible* forbids. Screen-reader users are
unaffected because each field's name, `aria-required`, and `aria-describedby` note are read
from the DOM regardless of visual stacking — confirming this is a purely visual failure.

## Expected ACT-style outcome
**failed** — content on hover/focus obscures meaningful adjacent content (a required marker
and a field), and no dismiss mechanism exists.

## Why automated tools miss it
Every linter-checkable property is correct: real `<label for>` on every input,
`aria-required="true"` on required fields, `aria-describedby` wiring for both the helper
text and the popover, `role="tooltip"` on the popover, passing contrast. Nothing is missing
or malformed. Automated tools do not render the hover/focus state, do not measure the open
popover's rectangle against the adjacent field's asterisk/label, and cannot decide that the
covered pixels carry *required-field information* rather than white space. That is a visual +
semantic human call.

## Citation
> **WCAG 2.2 Understanding 1.4.13 — Dismissible**
> "Position the additional content so that it does not obscure any other content including
> the trigger, with the exception of white space and purely decorative content, such as a
> background graphic which provides no information."

> **WCAG 2.2 Understanding 1.4.13 — Dismissible (low-vision rationale)**
> "low vision users who can only navigate via the keyboard do not want the small area of
> their magnified viewport cluttered with hover text. They need a keyboard method of
> dismissing something that is obscuring the current focal area."
