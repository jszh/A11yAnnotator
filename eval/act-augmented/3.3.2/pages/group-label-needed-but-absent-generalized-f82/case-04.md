# case-04 — Credit-card number split into four dash-separated boxes with no visible "Card number" label

## Scenario
A bank's "Add a payment card" form (Solstice Bank). The 16-digit card number is split into
four native text inputs, each `maxlength="4"`, separated by literal en-dash glyphs and each
showing a placeholder of four dashes ("----"). Each input carries an `aria-label`
("First four digits" / "Next four digits" / "Last four digits") so it has a programmatic
name, but there is NO visible text label on the boxes (only the placeholder) and NO visible
"Card number" text labelling the set anywhere. The four-part grouping — and the fact that
the set IS a card number — is conveyed only by the visual four-box, dash-separated layout.
Expiry, Security code, and Name on card all have real associated `<label>`s.

## Attribute tuple + developer persona
- **content-domain:** online banking / fintech (add payment card)
- **UI-component/pattern:** segmented credit-card-number entry (four 4-digit boxes + dashes)
- **host-language construct:** four native `<input maxlength=4>` with `aria-label`, separated
  by `<span class="dash">` glyphs; placeholder "----"
- **locale/i18n:** en-US; monospace digit groups
- **failure-mechanism:** the set's purpose ("Card number") is required but provided only by
  visual dashed formatting; the boxes have no visible label (placeholder dashes only) and no
  group label is presented to any user
- **persona:** A fintech developer copied a popular "split card input" code-pen that looks
  slick (four neat boxes with auto-advance). The pen used placeholder dashes for the retro
  card-printer look and added per-box `aria-label`s to satisfy the linter. The developer
  pasted it in, saw axe go green (all inputs named), and assumed the dashed layout "obviously
  reads as a card number." They never added a visible "Card number" label, and never tested
  with a screen reader, where the layout cue is gone.

## Element / selector carrying the issue
`.cc-groups` — the four inputs `#cc1`–`#cc4`. They have `aria-label`s but no visible label
(placeholder "----" only) and are not preceded by any visible "Card number" heading/label;
no `<fieldset>`/`<legend>` and no group description states the set's purpose.

## Exact accessibility mechanism (what AT experiences / why it fails)
- Each box has a non-empty programmatic name (`aria-label`), so 4.1.2 and missing-label
  checks pass for every control.
- But 3.3.2 requires the label/instruction be "presented to all users, not just those using
  assistive technologies." The boxes show no visible label (the four-dash placeholder is not
  a label and disappears on input), and no visible "Card number" text labels the set — so a
  sighted, non-AT user is given nothing in text; they must infer "credit card" from the
  dashed four-box shape alone.
- The grouping/meaning is conveyed only by the visual dash formatting — directly F82: a set
  of fields visually formatted without a text label identifying the set. Even the
  `aria-label`s say "First/Next/Last four digits", never "card number", so the set's purpose
  is stated to no one.
- Per F82's generalized rationale, even with programmatic names a text label must still
  identify the set; it is absent, so SC 3.3.2 fails.

## Expected ACT-style outcome
**failed** — the four-box set requires a visible group label ("Card number") presented to
all users; the only cue is visual dash formatting plus a vanishing placeholder, so the
labels/instructions needed to know what to enter are not provided to sighted non-AT users.

## Why automated tools miss it
Every input has a non-empty `aria-label`, so axe/WAVE/Lighthouse pass the missing-label
rule; the failure is the absence of a VISIBLE label/instruction (3.3.2's "presented to all
users" limb) and of any group description — which tools cannot evaluate. Judging that a
placeholder of four dashes is not a real label, and that the dashed four-box layout silently
encodes "card number" without stating it, requires human visual-semantic reasoning.

## Citation
- **Reference:** WCAG 2.2 Understanding Labels or Instructions, Intent —
  `wcag-understanding/labels-or-instructions.html`
  > "It is possible for controls and inputs to have an appropriate accessible name or
  > description (e.g. using `aria-label="..."`) and therefore pass Success Criterion 4.1.2,
  > but to still fail this success criterion (if the labels or instructions aren't presented
  > to all users, not just those using assistive technologies)."
- **Reference:** WCAG Technique F82, Description — `wcag-techniques/failures/F82.html`
  > "Phone numbers are frequently formatted in fixed, distinctive ways, and authors may feel
  > that just providing visual formatting of the fields will be sufficient to identify them.
  > However, even if all the fields have programmatically determined names, a text label
  > must also identify the set of fields as a phone number."
