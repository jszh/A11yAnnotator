# case-04 — Prescription-refill form: every medication's controls labeled "Refill" / "Quantity" and every fieldset legend "Medication"

## Scenario
A hospital patient portal's "Request prescription refills" page lists four medications (Lisinopril, Metformin, Atorvastatin, Levothyroxine). Each is wrapped in a `<fieldset>` whose `<legend>` reads **"Medication"**, and each contains a refill checkbox labeled **"Refill"** and a quantity `<select>` labeled **"Quantity"**. The actual drug name and dose appears only in a `<p class="rx">` inside the fieldset — it is not part of any legend or label. A screen-reader user moving through the form controls, or pulling a form-fields list, hears "Medication, group … Refill, checkbox … Quantity … Medication, group … Refill, checkbox …" four times, with nothing in the *labels* to say which medication each control refills.

## Attribute tuple
- **content-domain:** healthcare / patient portal / pharmacy
- **UI-component / pattern:** grouped form (`<fieldset>`/`<legend>`) repeated per record
- **host-language construct:** four `<fieldset>` with identical `<legend>`, each with `<label for>`-associated `<input type=checkbox>` and `<select>`
- **locale / i18n:** en-US
- **failure-mechanism:** relational/uniqueness failure of the SC 2.4.6 *label* limb — every control has a present, correctly associated, non-empty label, but the labels ("Medication" / "Refill" / "Quantity") are identical across the four sibling medications, so the form-control labels do not distinguish which drug each control acts on (a safety-relevant ambiguity)

## Developer persona
A health-IT developer built the refill form from a record template: for each prescription returned by the EHR API, the template emits a `<fieldset><legend>Medication</legend>` with a "Refill" checkbox and a "Quantity" select. They put the drug name in a styled `<p>` because the visual design placed the medication name as a prominent line under the legend. Because each control is *correctly* tied to a `<label>` (the accessibility linter the team runs is happy), they considered the form labelled and shipped it — never tabbing through it with a screen reader to hear the four identical "Refill" controls in a row.

## Element / selector carrying the issue
- `fieldset.med > legend` — all four read "Medication" (should read the drug name, e.g. "Lisinopril 10 mg").
- `label[for^="r"]` (`r1`–`r4`) — all four read "Refill".
- `label[for^="q"]` (`q1`–`q4`) — all four read "Quantity".
The disambiguator (`p.rx`) is plain text, not associated to any control as a label, legend, or `aria-describedby`.

## Exact accessibility mechanism (what AT experiences, why it fails)
- A sighted user sees each drug name printed prominently inside its box and ticks the right "Refill" checkbox by spatial proximity.
- A screen-reader user navigating by form control (Tab, or the "form fields" rotor list) hears the legend prepended to each control: "Medication, Refill, checkbox, not checked", "Medication, Quantity, combo box", and then the same pair three more times. The legend ("Medication") and labels ("Refill", "Quantity") are identical for every prescription. The drug name is in a `<p>` that is neither the legend nor an associated label/description, so it is not announced as part of the control's name. The user cannot tell which "Refill" checkbox refills the Lisinopril vs. the Levothyroxine without manually exploring the surrounding text — and ticking the wrong one is a medication-safety error.
- Per G131 the label must make the control's purpose clear; per G130's relational principle (which TT 5.B applies to labels), sibling labels must also distinguish the controls. "Refill"×4 and "Medication"×4 fail the relational test.

The defect is real in the DOM: four `<legend>` nodes all say "Medication", four checkbox labels all say "Refill", four select labels all say "Quantity"; a screen reader will announce them identically.

## Expected ACT-style outcome
**failed** (SC 2.4.6 — label limb / TT 5.B: visual form labels are not sufficiently descriptive to distinguish the sibling controls; G130 relational requirement applied to labels via G131).

## Why automated tools miss it
Every control has a programmatically associated, non-empty `<label>` (or `<legend>`), so axe-core (`label`, `select-name`, `form-field-multiple-labels`), WAVE, and Lighthouse all PASS — the controls are *labelled*, which is what those rules check (presence/association, i.e. 3.3.2 and 4.1.2). No automated rule reads the four fieldsets, notices they concern four *different* drugs, and judges that the repeated "Refill"/"Medication" labels fail to distinguish them. That cross-control semantic comparison — and the recognition that the real differentiator was placed outside the label — is human judgment.

## Citation
> "The objective of this technique is to ensure that the label for any interactive component within web content makes the component's purpose clear."
— wcag-techniques/general/G131.html (Description)

> "Descriptive headings identify sections of the content in relation both to the web page as a whole and to other sections of the same web page."
— wcag-techniques/general/G130.html (Description)

> "It is possible for controls and inputs to have an appropriate accessible name (e.g. using `aria-label=\"…\"`) and therefore pass Success Criterion 4.1.2, but to still fail this success criterion (if the label is inaccurate or insufficiently clear or descriptive)."
— wcag-understanding/headings-and-labels.html (Intent of Headings and Labels)

> "Each visual form label is sufficiently clear and descriptive, so users know what input data is expected"
— refs/trusted-tester/sc-2.4.6-headings-and-labels.md (Test 5.B — Evaluate Results)
