# case-05 — RTL Arabic form: positive tabindex authored for LTR reverses the right-to-left field order

## Scenario
An Arabic-language (`dir="rtl"`) clinic appointment form. In RTL, a horizontal row of fields reads
**right to left**: in the name row the visually-first (rightmost) box is the given name
(الاسم الأول), then the father's name (اسم الأب), then the family name (اسم العائلة) on the left;
in the date-of-birth row the rightmost box is the day (يوم), then month (شهر), then year (سنة).
That right-to-left order is the meaningful sequence an Arabic reader follows. The form was
localized from an English template whose developer had added positive `tabindex` reading
**left-to-right** (1,2,3 …). When the layout was flipped to RTL, the boxes' visual order flipped
but the tabindex numbers were never reconsidered. So Tab still starts at the **leftmost** box:
name order tabs **family → father → given** (tabindex 1→2→3), and DOB tabs **year → month → day**
(tabindex 4→5→6) — both the exact reverse of the right-to-left reading order.

## Attribute tuple
- **content-domain:** healthcare / patient portal (clinic appointment booking)
- **UI-component / pattern:** segmented name row + segmented Hijri date-of-birth row (field groups)
- **host-language construct:** positive `tabindex` numbered left-to-right under `dir="rtl"`
- **locale / i18n:** Arabic (`lang="ar" dir="rtl"`), Hijri calendar, Arabic-Indic numerals
- **failure-mechanism:** LTR-authored positive tabindex reverses the RTL visual/reading order (F44, i18n)

## Developer persona
An agency localized an English booking template into Arabic for a Gulf clinic. The localization
pass translated all the strings and set `dir="rtl"` on `<html>`, which correctly flipped the visual
layout. But the original English form had hand-numbered `tabindex` on the segmented name and date
fields (a habit from a strict tab-order spec). The translator/localizer touched only text and
`dir`, not the tabindex integers, and verified the result visually with a mouse — where everything
looked right. Nobody keyboard-tested in RTL.

## Element / selector carrying the issue
- Name row: `#given` (`tabindex="3"`, rightmost/visually first), `#father` (`tabindex="2"`),
  `#family` (`tabindex="1"`, leftmost/visually last). Tab traversal = family → father → given.
- DOB row: `#dob-d` يوم (`tabindex="6"`, rightmost), `#dob-m` شهر (`tabindex="5"`), `#dob-y` سنة
  (`tabindex="4"`, leftmost). Tab traversal = year → month → day.
- The reversal is created purely by LTR-ascending tabindex under an RTL visual flip.

## Exact accessibility mechanism (what AT experiences)
An Arabic keyboard user sees the given-name box on the right and starts there mentally, but the
first Tab lands focus on the **family name** box on the far left, then moves rightward against the
reading direction, ending on the given name. The DOB row likewise asks for the year before the day
the user's eye reaches first. A screen-reader user driving by Tab hears the name parts announced in
reverse of how they read on screen, breaking the "first / father / family" relationship; the date
is entered tail-first. Focus order contradicts the meaning implied by the RTL visual presentation,
so 2.4.3 fails. (Note: backward focus order need not mirror forward, per Trusted Tester, but it
must still preserve meaning — here even the forward order does not.)

## Expected ACT-style outcome
**failed** — F44 failure of SC 2.4.3; positive tabindex imposes an LTR numeric order that reverses
the meaningful right-to-left sequence of the RTL layout.

## Why automated tools miss it
`lang="ar"` and `dir="rtl"` are correct, every field has an Arabic `<label>`, the date fields are a
grouped `role="group"` with `aria-labelledby`, and contrast is fine — naive checks pass. axe emits
only the best-practice positive-tabindex note and has **no model of RTL reading order**: it cannot
tell that under `dir="rtl"` the lowest tabindex (`1`) lands on the *visually last* (leftmost) field.
Catching the reversal requires reading enough Arabic to know the rightmost box is the given name,
knowing RTL reading direction, and comparing it to the numeric traversal — a bilingual, directional,
visual judgment no scanner performs.

## Citation
**Reference:** WCAG Technique F44 — *Failure of Success Criterion 2.4.3 due to using tabindex to
create a tab order that does not preserve meaning and operability* (`wcag-techniques/failures/F44.html`).

> "When the values of the tabindex attribute are assigned in a different order than the relationships
> and sequences in the content, the tab order no longer follows the relationships and sequences in
> the content."

**Supporting reference:** Trusted Tester v5.1.3 — SC 2.4.3 Focus Order
(`refs/trusted-tester/sc-2.4.3-focus-order.md`).

> "Determine if the focus order impacts the page meaning (e.g., form fields for a mailing address
> are presented in the expected sequence)."
