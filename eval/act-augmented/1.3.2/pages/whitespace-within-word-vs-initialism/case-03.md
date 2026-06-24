# case-03 — Login form: "P A S S W O R D" label (&nbsp;) is the broken word; "SSN"/"PIN" are carve-outs

## Scenario
A county benefits portal's sign-in form uses an "official" house style where every field label
is wide-tracked uppercase. Two labels are initialisms — `SSN (last 4)` and `Mailing PIN` —
tracked correctly with CSS `letter-spacing`. The third label is the single English word
"Password", but instead of CSS it was spaced with non-breaking spaces inside the `<label>`:
`P&nbsp;A&nbsp;S&nbsp;S&nbsp;W&nbsp;O&nbsp;R&nbsp;D`. All three look identical on screen, yet
only the third breaks a real word — and because a `<label>` supplies the field's accessible
name, that field is *named* "P A S S W O R D".

## Attribute tuple
- **Content domain:** government / civic services portal (county benefits login)
- **UI component / pattern:** authentication form with associated `<label>`s
- **Host-language construct:** `<label for>` whose text node carries `&nbsp;` between letters; the label is the input's accessible name
- **Locale / i18n:** en
- **Failure mechanism:** intra-word white space (`&nbsp;`) inside the element that computes the accessible name, sitting beside genuine initialism labels (carve-out)

## Developer persona
An agency themed a government CMS form. The brand guide said labels must be "spaced caps." The
developer set `letter-spacing` in the theme CSS for most labels, but the "Password" label came
from a different partial that overrode the style, so to match the look they manually padded the
letters with non-breaking spaces in the template — quick fix, looked identical, shipped.

## Element / selector carrying the issue
`label[for="pw"]` — text `P A S S W O R D` (non-breaking spaces between letters). The PASS
controls are `label[for="ssn"]` ("SSN (last 4)") and `label[for="pin"]` ("Mailing PIN"), whose
initialisms are tracked only with CSS and whose text nodes are intact.

## Exact accessibility mechanism
The `<label>` is associated via `for`/`id`, so its text is the input's accessible name. With
`&nbsp;` between every letter the name string is "P A S S W O R D"; a screen reader announces
the password field as a string of single letters rather than "Password edit," and a
voice-control user cannot say "click Password." The SSN and PIN labels are initialisms whose
text nodes are single tokens; F32 explicitly excludes initialisms, and their CSS tracking never
enters the name — so they read correctly and pass.

## Expected ACT-style outcome
**failed** (SC 1.3.2). The password label fails F32 (white space within a word), and because
that label is the accessible name, the failure is doubly user-affecting. SSN/PIN are the
initialism carve-out and pass.

## Why automated tools miss it
All three inputs have a valid, non-empty, programmatically associated label, so axe-core's
label rules, WAVE, and Lighthouse all pass — they verify name *presence*, not whether the name
is a real word vs. an initialism vs. letters-with-spaces. A regex for "letter-space-letter"
would mis-flag `SSN` and `PIN` too, which F32 says are not failures. Only a human reading the
labels can see that "Password" is a word being shattered while "SSN"/"PIN" are acronyms.

## Citation
**Reference:** WCAG Technique F32 (`wcag-techniques/failures/F32.html`)
> "When blank characters are inserted to control letter spacing within a word, they may change the interpretation of the word or cause it not to be programmatically recognized as a single word."

**Reference:** WCAG Technique F32 (`wcag-techniques/failures/F32.html`)
> "Inserting white space characters into an initialism is not an example of this failure, since the white space does not change the interpretation of the initialism and may make it easier to understand."
