# case-01 — "Read the full document" link precedes the sentence that describes it (ordering hazard)

## Scenario
A small-town local-news site (The Coastal Ledger). Each story shows a kicker, headline, byline, and
a lede paragraph, then a stand-alone "Read the full document" link. The words that actually identify
what the link opens — "the proposed fee schedule that would charge recreational boaters a $240
annual slip surcharge…" — sit in a SEPARATE paragraph placed AFTER the link. Visually it reads like
one flowing sentence ("Read the full document — the proposed fee schedule…"), but the descriptive
clause is in a different `<p>` and comes after the link in reading order.

## Attribute tuple
- **content-domain:** news / long-form local editorial
- **UI-component/pattern:** article teaser with a stand-alone "Read the full document" call-to-action
- **host-language construct:** two sibling `<p>` elements (link block + continuation block); an em-dash visually joins them
- **locale/i18n:** en
- **failure-mechanism:** F63 — context in a different paragraph AND following the link (the G53/Understanding top-to-bottom ordering hazard)

## Developer persona
A one-person newsroom developer rebuilt the site on a markdown-based static generator. The CMS author
wrote the teaser as two markdown paragraphs separated by a blank line ("[Read the full document](…)"
then a new line starting with an em-dash). The generator faithfully emitted two `<p>` blocks. On a
wide screen the em-dash makes it look like a single continuous sentence, so nobody noticed the
descriptive clause had been split off into its own block after the link.

## Element / selector carrying the issue
`article:first-of-type .more a` (href `/agenda/fee-schedule-2025.pdf`), accessible name
"Read the full document ›". The descriptive text lives in the following sibling `p.continuation`,
which is not the link's sentence, paragraph, list item, or table cell.

## Exact accessibility mechanism (what AT experiences, why it fails)
A screen-reader user on the Links list, or tabbing link to link, hears only "Read the full document,
link" — twice on this page, for two completely different documents (a fee schedule vs. a bus-route
map). To learn which is which they must leave the link and read forward into the NEXT paragraph,
which is exactly what "programmatically determined link context" excludes: the context is neither in
the link's own paragraph nor in an associated ARIA name/description. Worse, even a user reading
top-to-bottom hits the link first and the explaining clause second, so they arrive at "Read the full
document" with no idea of the destination — the ordering hazard G53 and Understanding warn about. The
lede paragraph above mentions dredging generally but never names the document, so prior context does
not rescue it either.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
Every link has non-empty, human-readable text ("Read the full document"), a valid href, sufficient
contrast, and no missing attributes — axe-core, WAVE, and Lighthouse all pass it. No tool parses the
prose to notice that the only words distinguishing the two identical link names live in a *different*
`<p>` that *follows* the link. Judging that the descriptive clause is (a) outside the link's
programmatic container and (b) in the wrong reading-order position requires understanding sentence and
paragraph boundaries and the destination's meaning — semantic reasoning no static scanner performs.

## Citation
> **WCAG 2.2 Understanding — Understanding Link Purpose (In Context), Intent:**
> "This can be achieved by putting the description of the link in the same sentence, paragraph, list item, or table cell as the link, or in the table header cell for a link in a data table, because these are directly associated with the link itself."

(Verbatim from `wcag-understanding/link-purpose-in-context.html`. The descriptive clause here is in a different paragraph, so it is not directly associated.)

> **WCAG 2.2 Understanding — Understanding Link Purpose (In Context), Intent:**
> "If the description follows the link, there can be confusion and difficulty for screen reader users who are reading through the page in order (top to bottom)."

(Verbatim from `wcag-understanding/link-purpose-in-context.html`. The describing clause follows the link, triggering exactly this hazard.)
