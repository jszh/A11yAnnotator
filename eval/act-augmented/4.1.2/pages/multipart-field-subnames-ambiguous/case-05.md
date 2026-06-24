# case-05 — Multi-part phone whose parts are named by their format mask, not their role

## Scenario
A courier shipping flow ("Posthaven Courier", "Add a delivery contact", step 3 of 5) collects
the recipient's phone as one compound value split into **three boxes** — country code, area
code, local number — rendered `+44 · 020 · 7946 0991`. Beside each box sits a **visible
caption** ("Country code", "Area code", "Local number"), but each caption is a plain `<span>`
that is **not programmatically associated** with its input (no `<label for>`, no `aria-label`,
no `aria-labelledby`). The only accessible-name source the browser can find on each input is
its **placeholder format mask** (`+##`, `###`, `#### ####`). So each control's *accessible
name* is the digit mask, not a name that identifies which part of the number it is. (The two
ordinary fields on the page — recipient name and email — are correctly wired with `<label
for>`, so the page is not generically broken; only the multi-part phone is defective.)

## Attribute tuple
- **content-domain:** logistics / courier shipment (recipient contact details)
- **UI-component / pattern:** segmented three-input international phone control in `role="group"`
- **host-language construct:** visible per-part captions are unassociated `<span>`s; each input's only name source is its `placeholder` format mask (placeholder-as-name anti-pattern)
- **locale / i18n:** en-GB UI, international (E.123-style) number
- **failure-mechanism:** each part's accessible name is its digit-format mask, which does not identify the part; the visible role caption is never exposed (F111 + F86)

## Developer persona
A front-end developer built the segmented phone control to match a designer comp that showed
small grey captions above each box. They placed the captions as bare `<span>`s for pixel
control, and — assuming the captions "obviously" labelled the boxes — never wired a `<label
for>` or `aria-labelledby`. To stop their linter from complaining that the inputs were
unlabelled, they added `placeholder` masks (`+##`, `###`, `#### ####`); the placeholder is a
non-empty name source, so the axe/jest-axe gate went green and the duplicate-looking warning
disappeared. Nobody noticed the accessible name had become the *format mask* rather than the
field's role.

## Element / selector carrying the issue
- Three controls: `.phone .seg input[placeholder]` — country code (`placeholder="+##"`,
  `value="+44"`), area code (`placeholder="###"`, `value="020"`), local number
  (`placeholder="#### ####"`, `value="7946 0991"`).
- The visible per-part role text lives only in `.seg .cap` ("Country code" / "Area code" /
  "Local number"), plain `<span>`s with no `id` and no association to any input.
- Group caption `#phone-label` ("Delivery contact phone") names the *group*, not the parts.

## Exact accessibility mechanism (what AT experiences)
Chrome's computed accessible names for the three inputs are exactly `"+##"`, `"###"`, and
`"#### ####"` (verified via the CDP accessibility tree). A screen-reader user tabbing the group
hears: "Delivery contact phone group. Plus number-sign number-sign, edit, +44. Number-sign
number-sign number-sign, edit, 020. ..., edit, 7946 0991." Each box is announced by its digit
mask, and nothing tells the user which box is the country code, the area code, or the local
number. A **speech-input** user (e.g. Dragon) who says "click Country code" has no control to
match, because no input's accessible name contains the visible words "Country code" — exactly
F111's barrier. The visible captions that disambiguate the parts for a sighted user are never
in the accessibility tree. The parts are technically "named" by a non-empty string, but the
name does not identify the part — F86's "undefined fields" experience, here produced by
placeholder-as-name rather than by a missing or duplicated label.

## Expected ACT-style outcome
**failed** — SC 4.1.2 (F111 + F86). Per-rule: ACT rule **e086e5** ("Form field has non-empty
accessible name") returns *passed* for all three inputs, because a placeholder is a non-empty
accessible-name source, so the name strings ("+##" etc.) are non-empty. Automation therefore
reports nothing on these controls.

## Why automated tools miss it
A `placeholder` counts as a valid, non-empty accessible name in the name computation, so
e086e5 passes. **Verified empirically with axe 4.10.3:** a full `wcag2a`+`wcag2aa` scan of this
page returns **zero violations and zero incomplete results** — axe's `label` rule treats the
placeholder masks as satisfying the name requirement and does not flag any of the three inputs;
WAVE and Lighthouse use the same non-emptiness logic. To detect the real defect a tool would
have to (1) recognize the three boxes are parts of one phone number, (2) read the adjacent
visible captions "Country code / Area code / Local number", and (3) judge that the boxes'
accessible names ("+##" / "###" / "#### ####") are *format masks* that fail to identify the
parts and do not contain the visible label text. That is semantic + visual reasoning beyond any
per-field emptiness check.

## Citation
**Reference:** WCAG Technique F111 — *Failure of Success Criteria 1.3.1, 2.5.3, and 4.1.2 due
to a control with visible label text but no accessible name*
(`wcag-techniques/failures/F111.html`), Procedure check #3 and Expected Results:

> "The accessible name contains the text that appears as the visible label."

> "If check #1 is true, but checks #2 and/or #3 are false, the content fails the Success
> Criterion."

(Each box has a visible label — "Country code" / "Area code" / "Local number" — so check #1 is
true; but each box's accessible name is its placeholder mask, which does not contain the visible
label text, so check #3 is false and the content fails 4.1.2. F111's intent: "If the control
lacks an accessible name, speech users won't be able to activate the control using its visible
label.")

**Supporting reference:** WCAG Technique F86 — *Failure of Success Criterion 4.1.2 due to not
providing names for each part of a multi-part form field, such as a US telephone number*
(`wcag-techniques/failures/F86.html`):

> "The failure occurs when there is not a name for each of the three fields in the
> Accessibility API. A user with assistive technology will experience these as three undefined
> text fields."

(This is the multi-part shape F86 describes: three boxes for one phone number, where each box
needs a name that identifies *that* part. A digit-format mask is not such a name.)
