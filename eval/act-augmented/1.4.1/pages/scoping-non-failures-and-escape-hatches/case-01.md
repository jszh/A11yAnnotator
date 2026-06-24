# case-01 — Bank transaction list: credit/debit shown by light-green vs dark-red text (>=3:1 lightness escape hatch)

## Scenario
A retail-banking "Account activity" widget lists recent transactions. Money in (credits) is shown in light green text; money out (debits) is shown in dark red text. The two foreground colours differ in hue AND have a contrast ratio of ~3.15:1 between each other, so the lightness difference is itself an additional visual distinction. (Standard +/- signs are also present.)

## Attribute tuple
- **content-domain:** online banking / fintech account dashboard
- **UI-component / pattern:** data table (transaction list) with colour-coded amount column
- **host-language construct:** `<table>` with `<td class="credit|debit">`; colour set on large-bold text
- **locale / i18n:** en-US (USD, US date format)
- **failure-mechanism:** NONE — this is a genuine PASS via the lightness escape hatch (limb a)

## Developer persona
A fintech front-end developer styling a transactions table picked a "money green" and a "money red" from the brand palette. Worried about an accessibility audit, they deliberately chose a LIGHT green and a DARK red so the two amounts would still be tellable apart in greyscale, and double-checked that each colour passed contrast against the white background as large-bold text. The result correctly satisfies 1.4.1 via the lightness escape hatch.

## Element / selector carrying the issue
`td.amount.credit` (`#3a9d4e`) and `td.amount.debit` (`#7a1414`) in the `Recent transactions` table.

## Exact accessibility mechanism (what AT experiences / why it passes)
- A user with red-green colour-vision deficiency, or viewing in greyscale, perceives the credit amounts as distinctly LIGHTER than the debit amounts: the inter-element contrast between the two foregrounds is ~3.15:1, at/above the 3:1 threshold. So credit-vs-debit remains visually distinguishable WITHOUT relying on hue.
- Each colour also meets SC 1.4.3 against the white surface: green 3.44:1 (valid as large-bold text, where the threshold is 3:1) and dark red 10.84:1.
- Per the Understanding note, the >=3:1 lightness difference counts as an additional visual distinction, so the use-of-colour obligation is discharged. (The +/- signs are a further non-colour cue, but the escape hatch alone governs the verdict.)

Verified by rendering in Chrome and by computing WCAG contrast: credit/debit inter-element = 3.15:1; green/white = 3.44:1; red/white = 10.84:1. In the screenshot the green amounts read visibly lighter than the dark-red amounts.

## Expected ACT-style outcome
**passed** (SC 1.4.1 — the colours differ by >=3:1 in lightness, so the lightness escape hatch applies; a naive "any colour cue fails" verdict would be wrong).

## Why automated tools miss it
A naive heuristic ("colour-coded amount column = use-of-colour failure") would false-positive here. axe/WAVE/Lighthouse compute contrast of each foreground against its BACKGROUND (for SC 1.4.3) but do NOT compute the INTER-element lightness ratio between two foregrounds used to carry meaning, so they cannot recognise that the >=3:1 green-vs-red lightness difference discharges 1.4.1. Reaching the correct PASS requires computing that ratio and applying the specific escape-hatch rule — human judgement, not a linter rule.

## Citation
> "If content is conveyed through the use of colors that differ not only in their hue, but that also have a significant difference in lightness, then this counts as an additional visual distinction, as long as the difference in relative luminance between the colors leads to a contrast ratio of 3:1 or greater. For example, a light green and a dark red differ **both** by color (hue) **and** by lightness, so they would pass if the contrast ratio is at least 3:1."
— wcag-understanding/use-of-color.html (Intent note, lightness escape hatch)

> "Red and pink are the same color (hue) but they have different lightness (which is not color). So red and pink would pass the requirement for \"not distinguished by color (hue) alone\" since they differ by lightness (which is not color) - as long as the difference in lightness (contrast) is 3:1 or greater."
— wcag-techniques/failures/F73.html (note)
