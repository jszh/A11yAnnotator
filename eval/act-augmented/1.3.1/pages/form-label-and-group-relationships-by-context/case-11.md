# case-11 — paired external-reference hard negative for case-01

## Pair and category
Full counterpart of **case-01**. Batch `gena11y-fp-50-v2`; category `external-reference`.

## Exact repair
The four existing `for`/`id` label references and all source content remain unchanged. Only the CSS grid placement of the four inputs is corrected so each externally referenced label is visually adjacent to the field it names.

## Selector and mechanism
`.grid > label[for] + input` — the visible and programmatic relationships now agree for guests, date, mobile, and party name.

## Expected outcome
**passed** — SC 1.3.1.

## Why tools may miss
Every reference was syntactically valid in both variants. A detector must compare each referenced label with the rendered grid position, rather than treating valid IDREFs alone as proof.

## Citation
**Reference:** `refs/trusted-tester/sc-1.3.1-info-and-relationships.md`
> The combination of the accessible name, accessible description, and other programmatic associations (e.g., table column and/or row associations) describes each input field and includes all relevant instructions and cues (textual and graphical).
