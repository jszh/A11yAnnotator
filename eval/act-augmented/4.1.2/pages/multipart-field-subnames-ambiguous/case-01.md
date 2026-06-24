# case-01 — Split US phone, all three parts named "Phone"

## Scenario
An e-commerce checkout ("Trailhead Outfitters") asks for a mobile number using the classic
three-box US telephone layout, rendered visually as `( 402 ) 555 – 0173`. The parentheses
and dash make it obvious to a sighted user that box 1 is the **area code**, box 2 is the
**prefix/exchange**, and box 3 is the **four-digit line number**. Every box, however, carries
the identical `aria-label="Phone"`. Each part has a present, non-empty accessible name, so the
ACT non-emptiness rule passes on all three; collectively the three "Phone" names fail to say
which part is which.

## Attribute tuple
- **content-domain:** e-commerce checkout (shipping & contact)
- **UI-component / pattern:** split three-input US telephone control inside a `<fieldset>`
- **host-language construct:** three `<input type="tel">` each with `aria-label="Phone"`; punctuation in decorative `<span aria-hidden="true">`
- **locale / i18n:** en-US
- **failure-mechanism:** identical per-part name duplicated across every sub-field (F86 semantic variant — present-but-undifferentiated)

## Developer persona
A mid-level front-end dev split the single phone field into three boxes for the look the
designer wanted, then copy-pasted the first input twice. Because they "knew an unlabeled
input gets flagged by the linter," they pasted `aria-label="Phone"` onto each box to make the
axe warning go away — without thinking about what an area-code box vs. a line-number box
should actually be called. The CI accessibility scan went green, so the PR shipped.

## Element / selector carrying the issue
- The three controls: `fieldset .phone-line > input[type=tel][aria-label="Phone"]`
  (area code = `value="402"`, prefix = `value="555"`, line = `.suffix value="0173"`).
- The intended per-part roles are conveyed only visually by `.paren` / `&ndash;` spans, all
  marked `aria-hidden="true"` so AT never hears the "(", ")" or "–".

## Exact accessibility mechanism (what AT experiences)
A screen-reader user tabbing through the group hears: "Mobile phone group. Phone, edit, 402.
Phone, edit, 555. Phone, edit, 0173." All three are announced as the same field, "Phone."
Nothing tells the user that the first wants exactly three area-code digits, the second the
three-digit prefix, and the third the four-digit line number. If the user lands directly on
the third box (e.g., via a screen-reader's forms list), they hear only "Phone" and have no
way to know it is the suffix that needs four digits, not the whole number. The punctuation
that gives a sighted user the structure is `aria-hidden`, so it is never spoken. This is
exactly F86's "undefined text fields" experience — except here the fields are *named*, just
not *differentiated*, which is why the per-field rule cannot catch it.

## Expected ACT-style outcome
**failed** — SC 4.1.2 (and F86). Note the per-rule view: ACT rule **e086e5** ("Form field
has non-empty accessible name") returns *passed* for each of the three inputs (the name is
non-empty), which is precisely why the SC failure is invisible to the automated layer.

## Why automated tools miss it
axe-core / WAVE / Lighthouse implement e086e5: an input fails only when its accessible name
is empty. Here each input's name is the non-empty string "Phone", so every part passes and no
tool emits a finding. To detect the real failure a tool would have to (1) recognize the three
inputs are parts of one compound phone field, (2) read the visual `( ) –` grouping to infer
the intended area/prefix/line roles, and (3) judge that three identical "Phone" names fail to
distinguish those roles. That is multi-part semantic + visual reasoning that a per-field
non-emptiness check structurally cannot perform.

## Citation
**Reference:** WCAG Technique F86 — *Failure of Success Criterion 4.1.2 due to not providing
names for each part of a multi-part form field, such as a US telephone number*
(`wcag-techniques/failures/F86.html`).

> "A user with assistive technology will experience these as three undefined text fields. Some
> assistive technologies will read the punctuation as identification for the text fields, which
> can be even more confusing. In the case of a three-field US phone number, some assistive
> technologies would name the fields "(", ")" and "-", which is not very useful."

**Supporting reference:** WCAG Technique ARIA14 — *Using aria-label to provide an accessible
name where a visible label cannot be used* (`wcag-techniques/aria/ARIA14.html`), procedure:

> "Check that the value of the aria-label attribute properly describes the purpose of an
> element where user input is required"
