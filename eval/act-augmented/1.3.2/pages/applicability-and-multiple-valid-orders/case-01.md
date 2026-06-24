# case-01 — Two independent articles in a two-column nature bulletin (PASS / not applicable)

## Scenario
A naturalists&rsquo; society quarterly bulletin. The page holds two completely independent items:
a short treasurer&rsquo;s notice ("Subscriptions are due by 30 April") and a long feature
("The return of the curlew to Holm Marsh"). CSS flex puts the short notice in a narrow LEFT
column and the long, photo-led feature in the dominant RIGHT column, so a sighted skimmer might
guess the feature is "the main thing" and ought to come first. In the DOM, however, the notice
is FIRST and the feature is SECOND, and neither article is reordered internally. The two blocks
are not interleaved, so the container has no meaningful sequence: either order is correct.

## Attribute tuple
- **Content domain:** nonprofit / community natural-history bulletin
- **UI component / pattern:** two-column flex layout of independent article cards
- **Host-language construct:** `<main>` &gt; flex container &gt; two sibling `<article>` elements
- **Locale / i18n:** en-GB
- **Failure mechanism:** NONE present — this is the applicability-gate PASS control (the
  tempting-but-wrong flag is "DOM order &ne; visual prominence order")

## Developer persona
A volunteer editor builds the bulletin by hand each quarter in a plain HTML template. They drop
this issue&rsquo;s short notice in first because it was finalised first, then paste the feature
underneath. To make the feature look like the lead story they widen its column with flex. They
never reorder the source; the visual emphasis is purely a CSS width choice.

## Element / selector carrying the issue
The whole `div.columns` container with its two children `article.col-notice` (DOM-first) and
`article.col-feature` (DOM-second). The relevant judgement is about the container, not any one
element.

## Exact accessibility mechanism
A screen reader reads the notice in full, then the feature in full &mdash; each article in clean
source order, each internally coherent. Nothing is interleaved: the user never hears a sentence
from one article spliced into the other. Because the two articles are semantically independent,
hearing the notice before the feature (rather than after) changes nothing about either one&rsquo;s
meaning. This is the textbook "two independent articles" situation from the Understanding: the
articles may each have a meaningful sequence, but the container that holds them does not.

## Expected ACT-style outcome
**passed** (SC 1.3.2). The applicability gate is not tripped for the container: order does not
affect meaning, and more than one order is correct, so providing this one order is sufficient.

## Why automated tools miss it
There is no ACT rule for 1.3.2 at all, so axe/WAVE/Lighthouse emit nothing here &mdash; correctly,
by silence. The trap is for a naive DOM-vs-visual-order heuristic (or an over-eager human/LLM):
it would see that the visually dominant block is DOM-second and FALSE-POSITIVE a "reading order"
failure. To avoid that, the evaluator must recognise the two blocks are independent articles, so
EITHER order satisfies the SC. That is a contextual semantic determination, not something a
checker can compute from coordinates or the DOM.

## Citation
**Reference:** WCAG 2.2 Understanding &mdash; Meaningful Sequence (`wcag-understanding/meaningful-sequence.html`)
> "if a page contains two independent articles, the relative order of the articles may not affect their meaning, as long as they are not interleaved. In such a situation, the articles themselves may have meaningful sequence, but the container that contains the articles may not have a meaningful sequence."

**Reference:** WCAG 2.2 Understanding &mdash; Meaningful Sequence, "For clarity" list (`wcag-understanding/meaningful-sequence.html`)
> "Providing a particular linear order is only required where it affects meaning."
