# case-07 — paired counterfactual PASS for case-01

## Pair and scenario
This page is the passing counterpart of **case-01** in the same aspect. The Worsted & Co. catalogue retains the same three discounted yarn names, bold sizing, prices, inventory, and cards as case-01.

## Exact repair
Add only visually hidden “Sale:” text inside each promo product heading.

All other realistic content, presentation, controls, and page structure from case-01 are retained.

## Element / selector
`.name.promo .sr-only`

## Expected ACT-style outcome
**passed** — SC 1.3.1. The promotional status previously communicated only by typography is now present in accessible text.

## Why this is a hard negative
The rendered cards remain visually identical, but the sale relationship is now available without styling. It is deliberately paired with case-01, so a detector must distinguish the repaired semantic or behavioral boundary rather than rely on the page topic or visual template.

## Citation
**Reference:** wcag-techniques/general/G117.html
> When the visual appearance of text is varied to convey information, state the information explicitly in the text. Variations in the visual appearance can be made by changes in font face, font size, underline, strike through and various other text attributes.
