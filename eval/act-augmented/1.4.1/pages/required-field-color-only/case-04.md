# case-04 — Multi-section form: one section's required cue is red + "(required)" (fine), the other is red-only (fails) — no global verdict

## Scenario
Step 2 of a 4-step auto-insurance quote wizard ("MapleShield"). The form has two sections that
look identical but are NOT equivalent:

- **Driver details** (correct): required labels are red **and** carry the text "(required)"
  inside the `<label>` — this satisfies G205.
- **Vehicle details** (fails): required labels are the **same red** but have **no "(required)"**,
  no asterisk, no `aria-required`, no per-field cue. Red is the only signal.

A single top instruction, "Required fields are marked in red," applies to both sections but is
colour-keyed and does not let a colour-blind user identify which *vehicle* fields are required.
The page is engineered to defeat a global pass/fail: an evaluator must judge each section, find
the Vehicle section colour-only, and conclude the **page as a whole fails 1.4.1** even though the
Driver section is exemplary.

## Attribute tuple
- **content-domain:** insurance quote wizard (auto insurance)
- **UI-component/pattern:** multi-step form wizard with per-section field groups
- **host-language construct:** shared `.req` red-label class; "(required)" text present in
  section 1's `<label>` markup but absent from section 2's
- **locale/i18n:** en-CA (postal code, licence)
- **failure-mechanism:** F81 in one section only — a partially-correct page where required cue
  is colour-only in the Vehicle section, forcing per-field rather than global judgment

## Developer persona
Two developers split the wizard. The first built "Driver details" carefully and added
"(required)" per the team's accessibility checklist. The second was rushed building "Vehicle
details," copied the `.req` red-label class to colour the labels, but forgot to add the
"(required)" text the first dev had used. Both sections looked the same in the design review
(all required labels are red), so the missing text cue in section 2 slipped through — the colour
made it *look* consistent.

## Element / selector carrying the issue
Section 2 (`<h2>Vehicle details</h2>` group): `.f.req label` for **Make, Model, Model year,
VIN** — red colour with no "(required)" word or other non-colour cue. (Section 1's `.f.req
label` elements each contain `<span class="reqword">(required)</span>`, which is correct and
should NOT be flagged.)

## Exact accessibility mechanism (what AT experiences, why it fails)
In the Driver section, a colour-blind sighted user reads "Primary driver name (required)" and
knows it is required without needing the red — correct. In the Vehicle section, the same user
reads "Make", "Model", "VIN" with no "(required)" and only a red colour they cannot perceive, so
they cannot tell those fields are required; in greyscale, the red Vehicle labels are
indistinguishable from the black optional labels ("Trim / package", "Annual mileage"). A
screen-reader user hears no "required" for the Vehicle fields (no `aria-required`), whereas they
*do* hear "(required)" read for the Driver fields. Because at least one section conveys required
status by colour alone with no visible alternative, the page fails 1.4.1 — and the failure is
located precisely in the Vehicle section, not globally.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
Both sections are structurally identical, valid, fully-labelled forms; the only difference is
the *text content* of section 2's labels (no "(required)") and their *colour*. axe-core, WAVE
and Lighthouse do not read label prose to notice that one group includes "(required)" while the
other's red labels do not, and they have no rule inferring that the page fails because one
section's required indicator is colour-only. A tool would either pass the whole page (labels
present) or, at most, treat both sections identically — it cannot make the per-section,
read-the-words distinction that the SC requires here.

## Citation
> **WCAG Techniques, G205 — "Including a text cue for colored form control labels" (Example):**
> "The instructions for an online form say, \"Required fields are shown in red and marked with
> (required).\" The cue \"(required)\" is included within the label element."

(Verbatim from `wcag-techniques/general/G205.html`. The Driver section follows G205 with
"(required)" inside each label; the Vehicle section colours the labels red but omits the text
cue, so only the Vehicle section fails — the page must be judged section by section.)

> **WCAG Techniques, F81 — "Failure of Success Criterion 1.4.1 …" (Tests › Expected Results):**
> "If check #1 is false, then this failure condition applies and content fails the Success
> Criterion."

(Verbatim from `wcag-techniques/failures/F81.html`. For the Vehicle fields, check #1 — "an
non-color way to identify the required field … is provided" — is false, so the failure applies
and the whole page fails 1.4.1.)
