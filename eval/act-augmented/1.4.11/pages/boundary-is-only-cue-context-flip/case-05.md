# case-05 — RTL Arabic donation form: labelled amount field (PASS) vs. bare "other amount" ghost box (FAIL)

## Scenario
An Arabic (RTL) nonprofit donation card. A "monthly donation" amount field has a visible
`<label>` "مبلغ التبرّع الشهري" AND a high-contrast (9.11:1) green currency adornment "ر.س"
inset on the leading side, AND a placeholder "١٠٠". Below it sits an "other amount"
(`مبلغ آخر لمرة واحدة`) field that is a bare white box on the white card: its label is
`.sr-only`, there is no currency mark and no placeholder. **Both money inputs use the same
border `2px solid #A8A8A8` = 2.38:1 against white.**

- Monthly amount — **PASS**: visible label + 9.11:1 currency mark identify the control; the
  2.38:1 border is not the only cue.
- Other amount — **FAIL**: a white box on white with no other visual signal; the 2.38:1
  border is the only cue and is required to reach 3:1 — it does not.

## Attribute tuple
- **content-domain**: nonprofit / donation flow
- **UI-component/pattern**: amount-entry field with currency adornment; preset-amount pills
- **host-language construct**: `dir="rtl"` + `inset-inline-start`/`padding-inline-start`; `.sr-only` label on bare input
- **locale/i18n**: Arabic (ar), RTL, Arabic-Indic numerals (٥٠ ١٠٠ ٢٥٠), SAR "ر.س"
- **failure-mechanism**: low-contrast boundary is sole cue; layout mirroring is a red herring

## Developer persona
An agency localized an English donation template to Arabic. They correctly mirrored the
layout with logical properties and translated all strings, then hid the "other amount"
label to match the compact mock — adding `.sr-only` so the screen-reader still announced it.
The currency-adorned monthly field kept its visible "ر.س" mark; the "other amount" field
got nothing but the inherited faint border. The team's RTL/translation review passed; the
contrast asymmetry was never on the checklist.

## Element / selector carrying the issue
- FAIL: `input#other.money` — `.sr-only` label, no currency mark, no placeholder; border `#A8A8A8` (2.38:1) is the only cue.
- PASS boundary: `input#monthly.money` — same border, but visible label + 9.11:1 "ر.س" mark identify it.

## Exact accessibility mechanism
Contrast is layout-direction-agnostic: mirroring to RTL does nothing to the 2.38:1 ratio.
For a low-vision sighted user, the "other amount" row is a blank stretch of the white card
— only the 2.38:1 outline could say "enter a custom amount here," and at that contrast it
can disappear, so the user may never realise a custom-amount field exists. The monthly field
is always identifiable by its visible label and the bold green "ر.س" mark, so its identical
border is exempt. A screen-reader user hears both fields (the `.sr-only` label names the
"other amount" box), so this is a visual low-vision failure, not a programmatic-name failure.

## Expected ACT-style outcome
**failed** (the "other amount" input's required boundary is below 3:1).

## Why automated tools miss it
The bare field has a programmatic name via its `.sr-only` label, so name/label checks pass.
axe/Lighthouse do not measure input border contrast and are not RTL-aware in a way that
would help here anyway. A tool cannot determine that the monthly field's border is exempt
(label + visible currency mark identify it) while the "other amount" field's identical
border is required (it is the sole cue). The RTL mirroring and Arabic-Indic numerals add
surface complexity that does not change the human judgement: "does any other visual cue
identify this control?"

## Citation
> **WCAG 2.2 Understanding 1.4.11 — Boundaries**
> "If a control has visible content (such as text or a sufficiently contrasting icon),
> which helps users identify the presence of the control, then a border or other indication
> of the overall boundary of the hit area is not required, as is therefore not subject to
> non-text contrast requirements. Having a visual boundary indicating the hit area is only
> required when there is no other visual way to identify the presence of the control – and
> in those cases, the boundary must have sufficient non-text contrast in order to pass this
> success criterion."

> **EN 301 549 — C.9.1.4.11 Non-text contrast**
> "Check that the web page does not fail WCAG 2.2 Success Criterion 1.4.11 Non-text Contrast
> according to WCAG Conformance Requirements stated in clause 9.6."
