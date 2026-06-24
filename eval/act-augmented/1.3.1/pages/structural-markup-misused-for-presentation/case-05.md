# case-05 — `<dl>` abused as a 2-column pricing grid + own slogan in `<blockquote>`

## Scenario
A SaaS pricing page (Larkfield CI). Two structural elements assert relationships that do not
exist:
1. **`<dl>` as layout grid.** The plan's spec rows (Price, Seats, Billing, Included minutes,
   Support) are coded as a description list, but they are not term→definition pairs — they are
   independent, heterogeneous spec rows aligned in two columns by CSS grid. To make the grid
   columns line up visually, the developer wrote some rows as `<dd>value</dd><dt>label</dt>`
   (value before label), which *reverses* the programmatic term/description association
   relative to meaning ("term: 10 seats included, description: Seats").
2. **`<blockquote>` over the company's own slogan.** "Ship faster. Sleep better." is
   Larkfield's own marketing tagline, not a quotation, wrapped in `<blockquote>` only for the
   centered oversized style.

## Attribute tuple
- **content-domain:** SaaS analytics / developer-tools dashboard (CI product)
- **UI-component/pattern:** pricing card spec list + hero tagline
- **host-language construct:** `<dl>`/`<dt>`/`<dd>` used as layout (with reversed pairs) and
  `<blockquote>` over a slogan
- **locale/i18n:** en (US)
- **failure-mechanism:** description-list and quotation markup asserting term/definition and
  quotation relationships that do not exist (F43, "structural markup … indicates relationships
  that do not exist in the content")

## Developer persona
A front-end developer building the pricing page reached for `<dl>` because they had internalised
"description list = key/value layout" and it gave them a clean two-column grid for free. When the
CSS grid mis-aligned on a couple of rows, they swapped the `<dt>`/`<dd>` order to fix the visual
alignment, not realising that flips the term/description meaning for AT. Separately, they put the
hero tagline in a `<blockquote>` because the design called for a big centered italic line and
"quote" styling matched.

## Element / selector carrying the issue
`dl.specs` (the whole description list — especially the reversed pairs `dd → dt` for "Seats" and
"Included minutes") and `blockquote.tagline`. Selectors: `main dl.specs` and
`main blockquote.tagline`.

## Exact accessibility mechanism (what AT experiences, why it fails)
A `<dl>` exposes term/definition structure: screen readers announce each `<dt>` as a term and the
adjacent `<dd>` as its definition, and many AT report "list with N items / definition list."
Because the rows are independent spec lines (a price, a seat count, a cadence) rather than terms
being defined, the list fabricates definition relationships that are false — and on the two
reversed rows the term/description pairing is literally inverted, so AT announces "10 seats
included" as the *term* being defined by "Seats", the opposite of the intended meaning. A
braille/screen-reader user trying to map labels to values gets a scrambled, false key/value
model. Separately, the `<blockquote>` (role `blockquote`) tells AT the tagline is an extended
quotation from another source; it is the company's own slogan, so the quotation relationship is
fabricated. Both are F43: structural markup chosen for visual effect while indicating
relationships absent from the content.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
axe-core's definition-list rules (`dlitem`, `definition-list`) only verify that a `<dl>` contains
exactly `<dt>`/`<dd>`/`<div>` children and that `<dt>`/`<dd>` are inside a `<dl>` — all true here.
No rule checks whether a term actually *defines* its description, nor whether the `<dt>`/`<dd>`
order matches the intended meaning; a reversed pair is structurally legal. A `<blockquote>` needs
no attributes and triggers no rule. axe, WAVE, and Lighthouse therefore pass the page. Detecting
that these are spec rows (not definitions), that two pairs are inverted, and that the tagline is
first-party (not a quote) all require reading and understanding the content — human semantic
judgment.

## Citation
> **WCAG Techniques, F43 — Description:**
> "The objective of this technique is to describe a failure that occurs when structural markup is
> used to achieve a presentational effect, but indicates relationships that do not exist in the
> content."

(Verbatim from `wcag-techniques/failures/F43.html`. The `<dl>` indicates term→definition
relationships, and the `<blockquote>` a quotation relationship, neither of which exists in the
content — both chosen for layout/typographic effect.)

> **WCAG 2.2 Understanding Info and Relationships, Intent:**
> "items that share a common characteristic are organized into tabular rows and columns"

(Verbatim from `wcag-understanding/info-and-relationships.html`. The pricing specs are
row/column tabular data, not term/definition pairs; encoding them as a `<dl>` — and reversing
dt/dd to force visual alignment — misrepresents that relationship.)
