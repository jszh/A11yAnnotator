# case-06 — PASSING contrast: two identical address blocks disambiguated by visible <h3> group headings (no fieldset)

## Scenario
A university graduate-housing application (Thornfield University), the "Addresses" section.
It collects two addresses — current and permanent — in two structurally identical groups
whose inner native labels are byte-for-byte the same ("Street address", "City", "State",
"ZIP"). Unlike the failing cases, the required group description IS present as real text for
all users: a visible `<h3>` "Current address" / "Permanent address" precedes each group, and
each `<section>` is programmatically tied to its heading via `aria-labelledby`. This is the
passing boundary variant: same ambiguous shape, correctly resolved by a visible group
heading (deliberately NOT a fieldset, to show H71's "additional heading" can suffice).

## Attribute tuple + developer persona
- **content-domain:** higher-ed / graduate-housing application
- **UI-component/pattern:** two address groups (current + permanent) with visible headings
- **host-language construct:** `<section aria-labelledby>` + visible `<h3 id>`; native
  `<input>` + `<label for>`; NO `<fieldset>`/`<legend>`
- **locale/i18n:** en-US
- **failure-mechanism:** none — the group-level description that the failing cases lack is
  correctly supplied as visible text and programmatically associated
- **persona:** A university web team that had previously failed an audit for two
  indistinguishable address blocks (the case-01 pattern). Their accessibility lead added a
  visible `<h3>` for each group and wired `aria-labelledby` so screen readers announce the
  group name on field entry, choosing headings over `<fieldset>` to keep the institutional
  serif styling clean. This is the remediated, conformant version.

## Element / selector carrying the resolution
`section.addr-group[aria-labelledby]` with visible `<h3 id="cur-h">Current address</h3>` and
`<h3 id="perm-h">Permanent address</h3>`. Each group's accessible name comes from its visible
heading; the identical inner labels are thereby disambiguated.

## Exact accessibility mechanism (what AT experiences / why it passes)
- Each input has a correctly associated visible `<label>`, so missing-label and 4.1.2 checks
  pass (same as the failing cases).
- The two groups would be ambiguous on their inner labels alone — but each group now carries
  a visible, text-based group description ("Current address" / "Permanent address") that a
  sighted user reads directly.
- The `aria-labelledby` on each `<section>` associates that heading with the group, so a
  screen-reader user entering a field hears the group name (e.g. "Current address, Street
  address, edit"), resolving which block they are in.
- The group label is therefore presented to ALL users as required text — satisfying H71's
  "additional heading to provide a description specific to that particular group" without a
  fieldset. SC 3.3.2 is met.

## Expected ACT-style outcome
**passed** — the group-level description that the failing cases lack is provided as a real,
visible, all-users text heading and is programmatically associated; users can tell which
address each block collects.

## Why automated tools miss it (i.e., why this is still a human-judgment boundary)
Automated tools pass BOTH this page and the failing case-01 for the same reason — every
input has an associated label and nothing is empty. They cannot tell the two apart: they do
not evaluate whether a visible group heading is present and sufficient, because presence/
absence of a fieldset is neither necessary nor checked. A human must judge that here the
visible `<h3>` headings genuinely resolve the ambiguity (pass) whereas case-01's bare column
position does not (fail) — the same human-judgment axis that makes this aspect uncovered.

## Citation
- **Reference:** WCAG Technique H71, Description — `wcag-techniques/html/H71.html`
  > "As a rule of thumb, it can be said that where a group of controls within a larger form
  > requires an additional heading to provide a description specific to that particular
  > group, the use of fieldset and legend elements is appropriate."
- **Reference:** WCAG 2.2 Understanding Labels or Instructions, In brief —
  `wcag-understanding/labels-or-instructions.html`
  > "What to do: Provide labels or instructions for inputs."
