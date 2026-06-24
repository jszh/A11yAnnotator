# case-06 — Correctly differentiated multi-part work phone (PASS boundary)

## Scenario
An account "Contact preferences" page ("Meridian Logistics") collects an international work
phone as three boxes — `+ 44  20 – 7946 0991` — built **correctly** per ARIA14's
"phone number with multiple fields" example. Each sub-input carries a **distinct,
role-appropriate** accessible name: `aria-label="country code"`, `aria-label="area code"`,
`aria-label="subscriber number"`, inside a `role="group"` captioned "Work phone". This is the
same multi-part structural shape as the failing cases, but here the per-part names identify
each part's role within the whole.

## Attribute tuple
- **content-domain:** B2B account settings (logistics SaaS contact preferences)
- **UI-component / pattern:** three-input international phone control in `<fieldset role="group">` (ARIA14 pattern)
- **host-language construct:** distinct `aria-label` per part + matching `autocomplete` tel tokens; decorative `+`/`–` `aria-hidden`
- **locale / i18n:** en-US UI, international (E.123-style) number
- **failure-mechanism:** NONE — this is the correct contrast; each part is differentiated by name

## Developer persona
A developer who had read the ARIA Authoring Practices and ARIA14 implemented the split phone
field the recommended way: a `role="group"` with a "Work phone" legend, and a separate
role-specific `aria-label` plus the correct `autocomplete` token (`tel-country-code`,
`tel-area-code`, `tel-local`) on each box. They deliberately did **not** reuse one generic
"Phone" label across the parts, because they understood that an AT user landing on a single box
needs to know which segment it is.

## Element / selector carrying the issue
- Three controls, each with a **different** name:
  `.telrow input.cc[aria-label="country code"]` (value `44`),
  `.telrow input.ac[aria-label="area code"]` (value `20`),
  `.telrow input.sn[aria-label="subscriber number"]` (value `7946 0991`).
- Group caption: `legend#wp-label` = "Work phone". Decorative `+` and `–` are `aria-hidden`.
- There is no issue element — this page is the passing boundary that isolates the aspect.

## Exact accessibility mechanism (what AT experiences)
A screen-reader user tabbing the group hears "Work phone group. Country code, edit, 44. Area
code, edit, 20. Subscriber number, edit, 7946 0991." Each part announces with its own role
within the compound value, so a user can fill or correct any single box knowing exactly what it
expects — even landing on it out of order via a forms list. The group caption ("Work phone")
plus the distinct per-part names together convey the full structure without relying on the
visual `+`/`–` punctuation. This is precisely the experience F86 requires and the other cases
in this set deny.

## Expected ACT-style outcome
**passed** — SC 4.1.2. ACT rule **e086e5** returns *passed* for each input (each name is
non-empty), AND, unlike the failing cases, a human reviewer also confirms each name identifies
its part's role, so the SC is genuinely met. This page exists to prove the judgment under test
is *undifferentiated naming* — not the presence of a multi-part field or of separate boxes.

## Why this matters for the aspect (not "why tools miss it")
Automated tools pass this page for the same shallow reason they pass the failing cases: every
input has a non-empty name. The difference that makes this one genuinely conformant — distinct,
role-appropriate per-part names — is invisible to a per-field non-emptiness check. Including
this passing contrast forces the annotator/model to make the exact discrimination the aspect is
about: case-01/03/05's three identical "Phone"/"Card number"/"Blood pressure" names fail,
while this page's "country code / area code / subscriber number" names pass. The structural DOM
is near-identical to case-01; only the per-part name strings (and the `autocomplete` tokens)
differ.

## Citation
**Reference:** WCAG Technique ARIA14 — *Using aria-label to provide an accessible name where a
visible label cannot be used* (`wcag-techniques/aria/ARIA14.html`), the "phone number with
multiple fields" example this page implements:

> `<div role="group" aria-labelledby="groupLabel">`
> `  <span id="groupLabel">Work Phone</span>`
> `  +<input autocomplete="tel-country-code" type="number" aria-label="country code">`
> `  <input autocomplete="tel-area-code" type="number" aria-label="area code">`
> `  <input autocomplete="tel-local" type="number" aria-label="subscriber number">`
> `</div>`

**Supporting reference:** WCAG Technique F86 — *Failure of Success Criterion 4.1.2 due to not
providing names for each part of a multi-part form field* (`wcag-techniques/failures/F86.html`),
whose procedure ("for each subfield... check that there is a programmatically determined name
for the field") is satisfied here because each subfield has its own identifying name.
