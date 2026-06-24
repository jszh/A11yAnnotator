# case-06 — Checkout with a fixed footer, but `scroll-padding`/`scroll-margin` keep every focus ring in the clear band above it (PASS, boundary variant)

## Scenario
Cedar & Co.'s checkout form has a `position:fixed` footer (running total +
"Place order") that overlaps the bottom ~76px of the viewport — exactly the
layout that usually clips a focus ring when a field near the bottom is scrolled
flush to the window bottom and the footer covers it. This author anticipated the
problem and mitigated it correctly: `scroll-padding-bottom:96px` on the scroll
container plus `scroll-margin-bottom:96px` on every field and the submit button,
so any element scrolled into view by `Tab` stops in the clear band *above* the
fixed footer. As a result the 3px focus ring on every field is fully visible at
every keyboard stop. This is the boundary/PASS variant that sharpens the aspect:
same risky pattern as the failing pages, correct outcome because the author
reserved space for the indicator.

## Attribute tuple
- **Content domain:** e-commerce checkout
- **UI component / pattern:** multi-fieldset form with a `position:fixed` order-summary footer
- **Host-language construct:** `scroll-padding-bottom` on the scroll container + `scroll-margin-bottom` on focusables
- **Locale / i18n:** en-US, USD
- **Failure mechanism:** none — the would-be occlusion is mitigated; included as a true-negative boundary case

## Developer persona
An engineer who had previously been burned by a sticky bar covering focused
fields. This time they proactively added `scroll-padding`/`scroll-margin` sized to
the footer height and verified by tabbing from the first field through "Place
order," confirming the ring was visible above the footer at every stop. The page
is deliberately correct.

## Element / selector carrying the issue
No issue. The relevant declarations are `html { scroll-padding-bottom: 96px }` and
`input/select/button { scroll-margin-bottom: 96px }`, which keep
`input:focus-visible` rings clear of `.checkout-footer { position: fixed; bottom:0 }`.
Verified in Chromium: focusing the last field (`#cvc`) places its bottom + ring at
y≈397 while the fixed footer's top is at y≈644, so the ring is well clear of the
footer (`ringClearOfFooter: true`).

## Exact accessibility mechanism
When `Tab` moves focus to a field low on the page, the browser's scroll-into-view
honors `scroll-padding-bottom`/`scroll-margin-bottom` and stops the field in the
clear region above the fixed footer, where its 3px ring is fully painted and seen.
A sighted keyboard user tracks focus through the entire form, including the final
field and the "Place order" button, with a visible indicator at every step.
Nothing is clipped or occluded.

## Expected ACT-style outcome
**passed** (SC 2.4.7 — a visible focus indicator is present and perceivable on
every keyboard-focusable control; the fixed footer never covers it because space
is reserved).

## Why automated tools miss it
This is the flip side of the aspect: just as automated tools cannot *detect* the
clipped/occluded failures (they only see a conformant `:focus-visible` rule and a
pixel change), they also cannot *distinguish* this safe layout from the failing
ones — to all of axe/WAVE/Lighthouse, this page and the clipped pages look
identical, because the distinguishing factor is the runtime scroll position of the
focused element relative to a fixed overlay. Only a viewport-aware reviewer who
tabs through and watches the ring can tell that here the indicator stays visible.

## Citation
**Reference:** Trusted Tester v5.1.3 — SC 2.4.7 Focus Visible, Evaluate Results (`refs/trusted-tester/sc-2.4.7-focus-visible.md`)
> "When each interface element receives focus, there is a visible indication of focus."

**Reference:** WCAG 2.2 Understanding — Focus Visible, In brief (`wcag-understanding/focus-visible.html`)
> "Ensure each item receiving focus has a visible indicator."
