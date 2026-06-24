# case-02 — Roastery landing page with `<nav>` last in the DOM, pinned to the top (PASS)

## Scenario
A small coffee-roastery marketing page. Visually it has a fixed top navigation bar, a hero, body
copy, and a bottom-right promo card. In the DOM the order is `<main>` first, then `<aside class=
"promo">`, then `<footer>`, and the `<nav>` landmark dead last. CSS `position:fixed` lifts the nav
to the top of the viewport and the promo to the bottom-right corner. So the visual top-of-page
element (nav) is the last thing in source order. This is the Understanding&rsquo;s Example 2
verbatim: a CSS-positioned nav whose source position differs from its visual position, where the
meaning does not depend on the order.

## Attribute tuple
- **Content domain:** e-commerce / small-batch coffee roastery marketing
- **UI component / pattern:** fixed top nav bar + hero + pinned promo aside (landmark regions)
- **Host-language construct:** `position:fixed` on `<nav>` placed last in source; `<main>` first
- **Locale / i18n:** en
- **Failure mechanism:** NONE present — applicability-gate PASS control (the tempting-but-wrong
  flag is "nav is visually on top but is the last element in the DOM")

## Developer persona
A front-end dev who learned that putting `<main>` first in the source is good for screen-reader
users (so they reach content without tabbing through the menu) and good for SEO. They deliberately
moved the `<nav>` to the bottom of the body and pinned it with `position:fixed`. A reviewer who
only eyeballs "the menu is on top but it&rsquo;s last in the file" might raise a reading-order flag;
the dev did the right thing.

## Element / selector carrying the issue
`nav.sitebar` (the last child of `<body>`, visually first via `position:fixed`), in relation to the
`<main>` that precedes it in the DOM. The judgement is about the nav-vs-main region pairing.

## Exact accessibility mechanism
A screen reader reads the main content first, then the promo, then the footer, then the navigation
&mdash; each landmark internally coherent. Hearing the nav after the main content (instead of before)
does not change the meaning of either: they are independent regions. A landmark/rotor user can jump
to "Primary navigation" at any time regardless of source position. Because nav-vs-main order carries
no meaning, more than one reading order satisfies the SC and this one is fine.

## Expected ACT-style outcome
**passed** (SC 1.3.2). Per the Understanding, "the relative order of the main section of a web page
and a navigation section does not affect their meaning"; the applicability gate is not tripped.

## Why automated tools miss it
No automated tool runs a 1.3.2 check, so none flags this. The risk is a DOM-vs-visual-order
heuristic (or an over-eager evaluator) treating "visually-first element is source-last" as a focus
or reading-order defect. Recognising that nav and main are order-independent regions &mdash; so the
mismatch is harmless &mdash; needs semantic knowledge of what those regions are, which a coordinate
or DOM comparison cannot supply.

## Citation
**Reference:** WCAG 2.2 Understanding &mdash; Meaningful Sequence, Examples (`wcag-understanding/meaningful-sequence.html`)
> "Example 2: CSS is used to position a navigation bar, the main story on a page, and a side story. The visual presentation of the sections does not match the programmatically determined order, but the meaning of the page does not depend on the order of the sections."

**Reference:** WCAG 2.2 Understanding &mdash; Meaningful Sequence, Intent (`wcag-understanding/meaningful-sequence.html`)
> "The order of content in a sequence is not always meaningful. For example, the relative order of the main section of a web page and a navigation section does not affect their meaning. They could occur in either order in the programmatically determined reading sequence."
