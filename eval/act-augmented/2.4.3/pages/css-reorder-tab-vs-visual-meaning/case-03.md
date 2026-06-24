# case-03 — LMS course home: independent donation aside tabs before main content (PASS, must NOT be flagged)

## Scenario
The course-home page for "BIO 210: Cell Biology" at Riverside College. It renders as two
visual columns: a wide **main course-content** column on the left (module links + "Start
Module 3 quiz" button) and a narrow **"Riverside Annual Fund" donation widget** on the
right (a gift-amount input and a "Donate now" button). The donation aside is **first in
the DOM** but CSS flexbox `order` paints it on the right; the main column is second in the
DOM but painted on the left. With **no positive tabindex and no script**, the keyboard Tab
sequence is: donation amount → Donate now → module links → Start quiz. So focus reaches
the *right-hand* column first. The two columns are **completely independent** — the
site-wide fundraising widget has no bearing on the coursework, and the coursework has no
bearing on it. This is the deliberate **PASS / boundary** case that guards against
over-flagging.

## Attribute tuple
- **content-domain:** higher-ed LMS / course page
- **UI-component / pattern:** main content column + independent sidebar widget (donation form)
- **host-language construct:** CSS flexbox `order:1`/`order:2` swapping a DOM-first aside to the visual right; no `tabindex`, no JS
- **locale / i18n:** en-US, USD
- **failure-mechanism:** NONE — visual≠DOM order exists, but the two regions are independent so meaning/operation are preserved (the Understanding's explicit pass condition)

## Developer persona
An LMS theme developer put the site-wide "Annual Fund" promo `<aside>` near the top of the
template HTML (so it would be easy to keep consistent across every page), then used
flexbox `order` to float it to the right of the main content on wide screens. They were
aware that a donation widget is auxiliary and intentionally kept it out of the main
content's source position — but it ended up *before* main content in the DOM. Because the
widget is genuinely independent of the course material, the early focus stop is harmless,
and the developer (correctly) did not consider it a defect.

## Element / selector carrying the issue
`aside.fund` (DOM-first, `order:2`, painted right) vs `main.course` (DOM-second,
`order:1`, painted left). The visual/DOM mismatch is real, but it does **not** carry an
accessibility failure because the regions are independent.

## Exact accessibility mechanism (what AT experiences, why it PASSES)
- **Sighted keyboard / switch user:** Tab first focuses the donation amount and "Donate
  now," then enters the course module links and the quiz button. Because the donation
  widget is unrelated to the course, encountering it first does not impede understanding
  or operating either region. The user can complete the course tasks in a logical order
  (modules top to bottom, then start the quiz) regardless of when the donation widget was
  visited; nothing about the donation widget's position changes the meaning or operability
  of the coursework.
- The Understanding states explicitly that in a two-column layout, if the columns are
  independent and meaning/operation are not affected, it is **not** a failure for the
  right-hand column to receive focus first. That is exactly this layout.
- Best practice would still align focus order with visual order, but best-practice
  deviation is not a Level-A failure here.

## Expected ACT-style outcome
**passed** (SC 2.4.3). Focus order does not follow visual order, but because the two
columns are independent the order in which focusable elements receive focus remains
logical and preserves meaning and operability.

## Why automated tools miss it / why this is the over-flagging trap
- A naive automated rule that flagged *any* visual-order ≠ DOM-order mismatch would
  **incorrectly fail** this page — and that is precisely why no such rule ships in
  axe/WAVE/Lighthouse: the pass/fail turns on whether the two regions are *independent*,
  which is a semantic judgment about content relationships. A tool cannot tell that "BIO
  210 modules" and "Annual Fund donation" are unrelated; a human can. The page is included
  so a judge is measured on NOT over-flagging an independent-column reorder.

## Citation
> "For instance, in a two-column layout, the assumption in western left-to-right systems may be that focus moves through the elements in the left-hand column first, from the top to the bottom of the column, and then proceed to the right-hand column. However, if the two columns are independent of each other, and meaning/operation are not affected, it is not a failure if elements in the right-hand column receive focus first, followed by the elements in the left-hand column."
— wcag-understanding/focus-order.html (Intent of Focus Order)

> "When focus order does not affect meaning or operability, this test Does Not Apply (e.g., a row of icons linking to social media may not need to be navigated in a particular order)."
— refs/trusted-tester/sc-2.4.3-focus-order.md (Notes)
