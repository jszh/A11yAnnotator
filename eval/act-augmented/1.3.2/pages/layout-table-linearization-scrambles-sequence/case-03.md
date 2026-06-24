# case-03 — Two-stamp coupon: column-major offer linearized row-major into gibberish

## Scenario
A loyalty coupon for the "Bean & Leaf" café chain, laid out as two side-by-side "stamps" in a 2x2 layout `<table>` with a dashed divider down the middle. The left stamp stacks "Buy one" over "get one free"; the right stamp stacks "$10 espresso flight" over "with code SAVE25". The divider and stacked typography tell the eye to read **down each column** (each stamp), giving the coherent offer "Buy one, get one free — $10 espresso flight with code SAVE25." But the table is encoded **row-major**, so linearization reads across the rows: "Buy one $10 espresso flight get one free with code SAVE25" — the BOGO promise is torn apart and the price line is wedged between its two halves.

## Attribute tuple
- **content-domain:** e-commerce / restaurant — café loyalty coupon
- **UI-component / pattern:** voucher / coupon with a 2-column "stamp" grid
- **host-language construct:** `<table role="presentation">` 2x2 grid with a column divider that implies column-major reading
- **locale / i18n:** en-US
- **failure-mechanism:** transposition — visual/intended reading is column-major, source order is row-major, so linearized cells scramble the offer (F49: layout table does not make sense when linearized)

## Developer persona
A junior front-end dev was handed a designer's static mockup of the coupon. The designer built it as two vertical "stamps" with a tear-line between them. The dev reproduced the grid with the fastest tool to hand — an HTML table — typing the cells left-to-right, top-to-bottom (row-major) without realizing the design's reading order runs **down** each stamp, not across.

## Element / selector carrying the issue
`table.coupon[role="presentation"]` — the 2x2 grid. The mismatch is between the column-major visual reading (cued by `td.left` divider and the stacked stamps) and the row-major DOM order of the four content cells.

## Exact accessibility mechanism (what AT experiences, why it fails)
- A sighted user reads each stamp top-to-bottom: left = "Buy one / get one free", right = "$10 espresso flight / with code SAVE25". Assembled: a clear BOGO offer with its redemption.
- A screen reader linearizes the table row by row, cell by cell: "Buy one" → "$10 espresso flight" → "get one free" → "with code SAVE25". The user hears "Buy one $10 espresso flight get one free with code SAVE25."
- The headline offer "Buy one … get one free" is split by an interposed price line; "get one free" arrives detached from "Buy one"; the code is severed from its price context. As an offer it no longer parses — the meaningful sequence is lost.

## Expected ACT-style outcome
**failed** (SC 1.3.2 — F49: a layout table whose linearized cell order does not preserve the meaningful sequence of the offer).

## Why automated tools miss it
The table is valid, `role="presentation"` is correct for layout, all four cells have visible text, and nothing is empty or mislabeled. Automated tools do not reconstruct the intended visual reading order (here column-major, cued by a divider and stacked layout) and cannot judge that the row-major linearized stream "Buy one $10 espresso flight get one free with code SAVE25" has ceased to be a coherent offer. That requires a human to compare the visual grouping to the linearized order and reason about the offer's meaning.

## Citation
> "Tables present content in two visual dimensions, horizontal and vertical. However, screen readers present this two-dimensional content in linear order of the content in the source, beginning with the first cell in the first row and ending with the last cell in the last row."
— wcag-techniques/failures/F49.html (Description)

> "Check that the linear reading order matches any meaningful sequence conveyed through presentation."
— wcag-techniques/failures/F49.html (Tests — Procedure)

> "A sequence is meaningful if the order of content in the sequence cannot be changed without affecting its meaning."
— wcag-understanding/meaningful-sequence.html (Intent of Meaningful Sequence)
