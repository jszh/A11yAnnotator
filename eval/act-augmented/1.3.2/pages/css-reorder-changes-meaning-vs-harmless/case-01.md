# case-01 — Pricing comparison: price column absolutely positioned, DOM order reversed

## Scenario
A two-plan pricing comparison for "Coastline CRM." Visually it is a clean two-column table: **Starter / $19** on the left, **Growth / $79** on the right — each price sits directly under its plan. The plan cards and the price chips are all `position:absolute`. The plan cards are authored low-to-high (`Starter` then `Growth`), but the two price chips are emitted in the DOM in the **reverse** (high-to-low) order: `$79` first, then `$19`. CSS coordinates land each chip in the correct visual cell, so a sighted user sees the right prices; in source order the page linearizes to **"Starter … Growth … $79/mo … $19/mo"**, binding the *expensive* price to the *cheaper* plan.

## Attribute tuple
- **content-domain:** SaaS / B2B software pricing page
- **UI-component / pattern:** plan-comparison "table" built from absolutely-positioned chips
- **host-language construct:** `position:absolute` on every `.plan` and `.price`; DOM price order reversed vs plan order
- **locale / i18n:** en-US, USD
- **failure-mechanism:** F1 — CSS positioning changes the meaning; linearized reading binds each price to the wrong plan (and the prices are swapped relative to source)

## Developer persona
A designer assembled this in a free-canvas page builder. They dragged the two price chips into place **after** the plan cards, working from the highest tier down, and the builder appended each chip to the DOM in the order it was drawn. On screen the chips snapped into the correct columns, so the designer never noticed that source order now reads the prices high-then-low while the plans read low-then-high.

## Element / selector carrying the issue
`.price.price-right` (the `$79` chip, which is **first** in source order but rendered under the second/Growth column) and `.price.price-left` (`$19`, rendered under Starter). The mismatch is between the DOM order of `.price` chips and the DOM order of `.plan` cards.

## Exact accessibility mechanism (what AT experiences, why it fails)
- **Sighted user:** sees Starter $19, Growth $79 — correct.
- **Screen-reader / linearized user:** the absolute positioning is ignored; content is read in source order: "Starter — for solo founders…", "Growth — for scaling teams…", then "**$79** /user / month", then "**$19** /user / month". With no programmatic association between a plan and a price, the first price spoken ($79) attaches to the first/last-mentioned plan in the listener's mind. The price column is not only detached from its plan, it is **internally reversed**, so even a user who infers "first price = first plan" gets Starter = $79 — the opposite of the truth.
- Verified with Puppeteer: rendered visual order (top→bottom, left→right) is `Starter, Growth, $19, $79`, but DOM/linearized order is `Starter, Growth, $79, $19` — they differ, and the prices are swapped.

## Expected ACT-style outcome
**failed** (SC 1.3.2 — F1: CSS positioning makes the linearized reading order convey a different, wrong meaning).

## Why automated tools miss it
Every element has visible text; nothing is empty, unlabeled, or low-contrast, so axe/WAVE/Lighthouse find nothing. No automated checker has a model of which price "belongs" to which plan, so it cannot detect that the absolutely-positioned price column is emitted in reverse source order. Even a hypothetical tool that flagged *every* visual≠DOM mismatch would mis-handle this: it could see the mismatch but could not read the linearized stream and judge that the prices bind to the wrong plans. That judgment requires reading the content as prose and knowing the swap is semantically wrong.

## Citation
> "This describes the failure condition that results when CSS, rather than structural markup, is used to modify the visual layout of the content, and the modified layout changes the meaning of the content. … it is important not to rely on CSS to visually position content in a specific sequence if this sequence results in a meaning that is different from the programmatically determined reading order."
— wcag-techniques/failures/F1.html (Description)

> "The intent of this success criterion is to enable a user agent to provide an alternative presentation of content while preserving the reading order needed to understand the meaning. It is important that it be possible to programmatically determine at least one sequence of the content that makes sense."
— wcag-understanding/meaningful-sequence.html (Intent of Meaningful Sequence)
