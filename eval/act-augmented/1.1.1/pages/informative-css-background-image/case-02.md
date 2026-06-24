# case-02 — Record-shop stock status conveyed only by CSS-class background glyphs

## Scenario
A vinyl record shop's "this week's arrivals" catalogue, rendered as a `<table>`. The leading
cell of every row carries the item's **stock status** — In stock (green tick), Last copy
(orange "1"), Pre-order (blue clock), Sold out (red cross) — but *only* as a CSS-class
background-image glyph (`td.stock.in`, `.last`, `.pre`, `.sold`). The cell is text-empty and
unlabelled. The visible row text is artist/title, format and price. This is F3 example 2
(book-distributor stock icons) transposed to a record shop and a table layout.

## Attribute tuple
- **content-domain:** e-commerce / music retail (inventory catalogue)
- **UI-component / pattern:** data table with a status-icon column
- **host-language construct:** stylesheet rules keyed on `<td>` class names (`.in/.last/.pre/.sold`)
- **locale / i18n:** en-GB (£, VAT)
- **failure-mechanism:** F3 — per-row status conveyed exclusively by background-image sprite glyphs

## Developer persona
A junior dev themed a generic store template. The inventory service returns a `status` enum;
the template maps each enum value to a CSS class that paints the matching icon, exactly as the
original theme demo did. It "looked done" because the icons render and read clearly to sighted
staff, so the dev never added a text status column or `aria-label`s. The icon set was chosen by
a designer purely on visual grounds.

## Element / selector carrying the issue
- `td.stock.sold` (and `.in`, `.last`, `.pre`) — empty cells whose `background-image` is the
  only carrier of the stock status.
- Row text (`Khruangbin — A LA SALA`, price, format) never states the status.

## Exact accessibility mechanism (what AT experiences)
A screen-reader user navigating the table hears, for the Floating Points row, only
"Floating Points — Cascade, Clear vinyl pressing, LP, £31.00" — identical in shape to the
in-stock Khruangbin row. The crucial difference (one is **Sold out**, one is **In stock**)
is invisible to AT because the status lives in a `background-image` on an empty cell, which
contributes nothing to the accessibility tree. The user could try to buy a record that cannot
be bought. In forced-colors / "hide background images" the glyphs vanish for everyone.

## Expected ACT-style outcome
**failed** — F3: stock status is conveyed exclusively by CSS background images and is not
programmatically determinable. ACT 1.1.1 rules are **Inapplicable** (the carriers are
`<td>`s with a CSS background, not nameable image elements).

## Why automated tools miss it
The status icons are background images on text-empty `<td>`s — no `image-alt` target, no
accessibility node, nothing for axe/WAVE/Lighthouse to evaluate. A linter cannot OCR the four
distinct glyphs, cannot tell that they encode mutually exclusive inventory states, and cannot
verify that "Sold out" appears nowhere else in the row. Distinguishing the informative status
glyph from a purely decorative bullet is a human semantic judgment.

## Citation
**Reference:** WCAG Technique F3 — *Failure of Success Criterion 1.1.1 due to conveying
information exclusively using CSS background images* (`wcag-techniques/failures/F3.html`).

> "A book distributor uses background images to provide icons against a list of book titles to
> indicate whether they are new, limited, in-stock, or out of stock."

> "Check if the images convey information that is not already conveyed elsewhere on the page."

**Supporting reference:** Trusted Tester v5.1.3 — Test 7.C, Evaluate Results
(`refs/trusted-tester/sc-1.1.1-non-text-content.md`).

> "The meaning of the background image is also available without the background image."
