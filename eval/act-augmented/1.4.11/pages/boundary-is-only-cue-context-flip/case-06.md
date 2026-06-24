# case-06 — Flight filters: labelled (PASS) vs. bare active (FAIL) vs. disabled (NOT APPLICABLE) — all sharing a 2.24:1 border

## Scenario
A flight-search "Refine your search" panel has three filter fields in a row, **all with the
identical border `2px solid #ADADAD` = 2.24:1 against white**:
1. **Origin** — has a visible `<label>` "Origin city" plus placeholder "London (LHR)".
2. **Destination** — an ACTIVE input with no visible label, no placeholder, no icon
   (only `aria-label`).
3. **Airline** — a `disabled` (inactive) input, greyed fill, no visible label.

The three-way split is the point:
- Origin — **PASS**: the visible label identifies the control; the 2.24:1 border is not the
  only cue, so it is not subject to the requirement.
- Destination — **FAIL**: an active control whose only visual cue is the 2.24:1 border,
  which is therefore required to reach 3:1 — and does not.
- Airline — **NOT APPLICABLE / exempt**: it is an *inactive* component, and inactive UI
  components are exempt from the contrast requirement entirely, even though its only cue is
  the same 2.24:1 border.

## Attribute tuple
- **content-domain**: travel / flight & hotel booking
- **UI-component/pattern**: three-up filter bar with a dependent (disabled-until) field
- **host-language construct**: `<label for>` vs. bare `aria-label` `<input>` vs. `<input disabled>`
- **locale/i18n**: en
- **failure-mechanism**: same faint boundary, three different SC outcomes driven by label + active/inactive state

## Developer persona
A booking-site developer built the origin field properly, then duplicated its markup for
destination and airline to keep the row visually consistent. They dropped the visible
labels on the latter two "because the section headings (Origin/Destination/Airline) already
say what they are" — but those `<h3>` headings sit *outside* and *above* the boxes, so they
do not visually identify the box as a control. The airline field was disabled until a
destination is picked. The team assumed all three were equivalent; in fact they land on
three different SC verdicts.

## Element / selector carrying the issue
- FAIL: `input#dest.filter` — active, only cue is `#ADADAD` border (2.24:1); no visible label/placeholder/icon.
- PASS boundary: `input#origin.filter` — same border, but `label[for="origin"]` + placeholder identify it.
- NOT-APPLICABLE boundary: `input#airline.filter[disabled]` — inactive component, exempt from non-text contrast.

> Note on the `<h3>` headings: "Origin/Destination/Airline" are section headings above each
> box, not labels that make the *box itself* perceivable as a control. They establish a
> name for SR users but do not give a low-vision user the visual "a control is here" cue
> that the SC's Boundaries text requires; the destination box still depends on its border.

## Exact accessibility mechanism
For a low-vision sighted user, the destination box is a blank region whose only signal is
the 2.24:1 outline; at that contrast it can vanish, so the user may not realise there is a
second filter to fill in. That makes the border *required* and failing. The origin box is
always identifiable by its visible "Origin city" label and placeholder, so its identical
border is exempt. The airline box is `disabled` — per the Understanding, inactive controls
are explicitly not required to meet contrast, so even though its only cue is the same faint
border, the requirement does not apply; reporting it as a failure would be wrong.

## Expected ACT-style outcome
**failed** (the active Destination input's required boundary is below 3:1; the page fails
even though Origin passes and Airline is exempt).

## Why automated tools miss it
All three inputs have accessible names, so name/label checks pass. No scanner measures input
border contrast. Critically, a naive "measure every border" checker would mis-handle two of
the three boxes: it would false-positive on Origin (exempt — visible label identifies it)
and false-positive on Airline (exempt — inactive control), while a "skip non-text borders"
tool would false-negative on Destination. Getting all three right requires (a) reading
which box has an alternative visual identifier and (b) recognising the `disabled` exemption
— two distinct human judgements layered on the same 2.24:1 number.

## Citation
> **WCAG 2.2 Understanding 1.4.11 — Boundaries**
> "Having a visual boundary indicating the hit area is only required when there is no other
> visual way to identify the presence of the control – and in those cases, the boundary must
> have sufficient non-text contrast in order to pass this success criterion."

> **WCAG 2.2 Understanding 1.4.11 — Inactive User Interface Components**
> "User Interface Components that are not available for user interaction (e.g., a disabled
> control in HTML) are not required to meet contrast requirements. An inactive user interface
> component is visible but not currently operable."
