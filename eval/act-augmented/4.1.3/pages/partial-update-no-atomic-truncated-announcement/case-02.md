# case-02 — Faceted boot store: filter announces a context-free "24"

## Scenario
A hiking-boot listing has a faceted sidebar (colour, waterproof). A result summary reads
"Showing **38** products" inside an `aria-live="polite"` region. When the shopper toggles a
filter, JavaScript recomputes the count and rewrites ONLY the inner `<b id="count">`
numeral (38 → 29 → 24…). The region announces — but because it is not atomic and only the
number node mutated, the screen reader speaks just "24". The words "Showing" and "products"
are never re-read, so the listener hears a number with no referent.

## Attribute tuple
- **content-domain**: e-commerce (outdoor / hiking-boot catalogue)
- **UI-component/pattern**: AJAX faceted-search result-count summary
- **host-language construct**: `<p aria-live="polite">` containing a `<b>` value node
- **locale/i18n**: en-GB
- **failure-mechanism**: number-only mutation of a non-atomic polite region → bare numeral announced

## Developer persona
An agency dev themed an existing storefront and added live filtering. They KNEW the
result count should be announced (they read the seed-pattern audits about silent facet
grids), so they conscientiously added `aria-live="polite"` — fixing the "announces nothing"
bug. But to avoid re-rendering the whole summary on every keystroke, they bound only the
numeral: `countEl.textContent = n`. They congratulated themselves on the live region and
shipped, not realising a polite-but-non-atomic region announces only the mutated subtree.

## Element / selector carrying the issue
- Region: `p#result-line[aria-live="polite"]` — `aria-atomic` is absent (defaults to
  `false` for an explicit `aria-live` region, unlike `role="status"`).
- Mutated node: `b#count` — the only node JS rewrites on filter change.

## Exact accessibility mechanism
For an element that carries an explicit `aria-live` (rather than `role="status"`),
`aria-atomic` defaults to **false**. A non-atomic live region announces only the changed
node and its contents, not the whole region. So when `#count` flips to "24", AT speaks
"24" alone. A sighted user reads "Showing 24 products" because the static label is
permanently adjacent; a blind user gets an orphaned numeral and cannot tell it is a product
count, a price, a page number, or noise. This is precisely the "Modification of status
text" trap: the entire string should have been marked as the status (e.g. `aria-atomic="true"`
or rewriting the whole sentence) so the AT re-reads "Showing 24 products."

## Expected ACT-style outcome
**failed** — the status updates and is announced, but the announced fragment ("24") is not
equivalent to the visible status ("Showing 24 products").

## Why automated tools miss it
A static scan finds a valid `aria-live` region, labelled checkbox facets, correct contrast,
and real product markup — all green. Tools audit one DOM snapshot; they neither fire the
filter nor track which subtree mutates, and they have no concept of `aria-atomic`'s effect
on what gets spoken. There is no rule for "the announced numeral is meaningless without its
label." Distinguishing this FAIL from a correct atomic region requires firing the update and
judging that "24" alone does not carry the same meaning as the full sentence — a semantic
equivalence judgment.

## Citation
> **WCAG 2.2 Understanding 4.1.3 — Modification of status text**
> "However, where only the number in this string was coded as an updated chunk of content,
> the resulting experience for screen reader users could be to only hear "three", which may
> not be sufficient information to provide context for the user. In such situations, marking
> the entire "3 items" string as the status text would normally be a better solution. See
> Sufficient Techniques for more discussion, including the use of `aria-atomic`."

> **WCAG Techniques ARIA22 — Using role=status to present status messages**
> "The role of `status` also has a default `aria-atomic` value of `true`, so that updates to
> the container marked with a role of `status` will result in the AT presenting the entire
> contents of the container to the user, including any author-defined labels (or additional
> nested elements). Such additional context can be critical where the status message text
> alone will not provide an equivalent to the visual experience."
