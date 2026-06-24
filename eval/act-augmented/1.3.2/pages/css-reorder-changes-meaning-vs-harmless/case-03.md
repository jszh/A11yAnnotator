# case-03 — Example-2 PASS trap: nav pinned to top (last in DOM) + pull-quote rendered in side rail (first in DOM), meaning preserved

## Scenario
A news article, "The tidal marsh is coming back." Two CSS reorders are present **on purpose**:
1. The `<nav class="site">` is `position:fixed` to the top of the viewport but is the **last** element in source order.
2. A decorative `<blockquote class="pull">` pull-quote is placed **first** in the DOM but rendered in the right-hand rail (via CSS grid placement), beside the article body.

A mechanical "visual order ≠ DOM order" detector fires on **both** mismatches. Neither, however, changes meaning: the nav, the article, and the pull-quote are mutually independent blocks, and the pull-quote is a verbatim excerpt that already appears inside the article body. Read in any order, the page still parses. This is the SC's own **Example 2** non-failure and the F1-companion case — included so the annotator is penalized for an "any reorder = fail" rule.

## Attribute tuple
- **content-domain:** news / long-form editorial
- **UI-component / pattern:** site nav landmark + article + decorative pull-quote callout
- **host-language construct:** `position:fixed` nav (DOM-last) + CSS-grid-placed `<blockquote>` (DOM-first)
- **locale / i18n:** en
- **failure-mechanism:** none — harmless CSS reorder of *independent* blocks (PASS / over-flag trap)

## Developer persona
A small newsroom's developer keeps the `<nav>` at the bottom of the document "for source-order cleanliness / faster main-content paint" and pins it with `position:fixed`. The CMS template emits the pull-quote block before the article so editors can author it at the top of the entry form; CSS grid drops it into the side rail. Both choices are deliberate layout decisions, not mistakes.

## Element / selector carrying the issue
There is **no** failing element. The reorders live on `nav.site` (`position:fixed`, DOM-last) and `blockquote.pull` (DOM-first, grid-placed right). Both are correctly judged harmless.

## Exact accessibility mechanism (what AT experiences, and why it PASSES)
- **Linearized / screen-reader order:** pull-quote → article (heading, byline, body) → nav. A listener hears the quote, then the full self-contained article (whose body already contains that same quote in context), then the navigation links. At no point does meaning depend on block order: the article is complete and coherent on its own; the nav links form their own meaningful sequence; the pull-quote is decorative repetition.
- **Per the SC:** the relative order of a main story and a navigation section does not affect meaning (Example 2), and the order of an article and its callout sidebars does not affect meaning. Both reorders here are exactly those non-failure cases.
- Verified with Puppeteer: visual order is `nav, headline, pull-quote`; DOM order is `pull-quote, headline, nav` — they differ (so a diff tool flags it), yet linearizing preserves meaning → **PASS**.

## Expected ACT-style outcome
**passed** (SC 1.3.2 — content is CSS-reordered, but the reordered blocks are independent and the linearized reading order still conveys the correct meaning).

## Why automated tools miss it
This is the inverse failure mode: a naive visual-vs-DOM diff tool would raise a **false positive** here, because it can detect the mismatch but cannot read the linearized prose to confirm that meaning survives. Distinguishing this harmless reorder from a genuine F1 failure (e.g. case-01, case-02) requires reading the content and judging that the blocks are independent — a semantic decision automated tools cannot make, which is precisely why over-flagging every reorder is wrong.

## Citation
> "**Example 2:** CSS is used to position a navigation bar, the main story on a page, and a side story. The visual presentation of the sections does not match the programmatically determined order, but the meaning of the page does not depend on the order of the sections."
— wcag-understanding/meaningful-sequence.html (Examples of Meaningful Sequence)

> "The order of content in a sequence is not always meaningful. … a magazine article contains several callout sidebars. The order of the article and the sidebars does not affect their meaning. … Providing a particular linear order is only required where it affects meaning."
— wcag-understanding/meaningful-sequence.html (Intent of Meaningful Sequence)
