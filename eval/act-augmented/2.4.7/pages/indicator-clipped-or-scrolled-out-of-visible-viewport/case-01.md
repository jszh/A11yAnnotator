# case-01 — Transaction-row "details" button: focus ring is a circle whose right half is clipped off the card edge by `overflow:hidden` (FAIL)

## Scenario
Northbank's online-banking "Recent transactions" screen renders the month's
activity inside a rounded card. The card has `overflow:hidden` so its rounded
corners stay crisp where the inner scroll region meets the border. Each row ends
in a small round "›" details button that the designer pinned flush to the card's
right edge for a tidy vertical rail of chevrons — pushing the button a few pixels
past the card's right border with `transform: translateX(13px)`. The button has a
correct, high-contrast `:focus-visible` ring, but because the button straddles
the `overflow:hidden` boundary, the ring is a circle whose right half is removed;
only a thin left crescent survives, reading as part of the button's own fill.

## Attribute tuple
- **Content domain:** online banking / fintech dashboard
- **UI component / pattern:** scrollable card with per-row icon "details" button
- **Host-language construct:** `<section class="card" overflow:hidden>` + `role="list"`/`role="listitem"` rows, `<button>` with `aria-label`
- **Locale / i18n:** en-US, USD, tabular-nums
- **Failure mechanism:** focus ring drawn but clipped by an ancestor's `overflow:hidden` at the container edge

## Developer persona
A product designer handed the engineer a Figma spec showing chevron buttons
"kissing" the card's right edge for a clean rail. The engineer matched it pixel
for pixel with a small `translateX` nudge and rounded card corners
(`overflow:hidden`) to keep the look. They tested with a mouse — clicking the
chevrons worked — and never tabbed through, so they never saw that the focus ring
of every details button is sliced in half by the card's clip box.

## Element / selector carrying the issue
`.row .go:focus-visible` (the round details button in each transaction row),
clipped by the ancestor `.card { overflow: hidden }`. Verified in Chromium: with
the first button focused, the focus-ring rectangle's right rail falls outside the
card's clip box (ring-visible fraction ≈ 0.55; right rail clipped).

## Exact accessibility mechanism
On `Tab`, the details button receives focus and the browser paints the author's
3px ring with a 3px outward offset around it. Because the button is translated
flush to / past the card's right edge, the right half of that ring is painted
beyond the `.card` border box and removed by `overflow:hidden`. What the sighted
keyboard user sees is a faint left-hand arc of green hugging the card edge —
indistinguishable from the button's own circular shape — so there is effectively
no perceivable "this control is focused" cue. A screen-reader user is unaffected
(the name/role/state are fine); the harm is specifically to the sighted
keyboard/low-vision user who relies on a visible indicator.

## Expected ACT-style outcome
**failed** (SC 2.4.7 — a focus indicator is drawn but clipped by an ancestor's
`overflow:hidden` so it is not actually visible to the user).

## Why automated tools miss it
ACT rule oj04fd's expectation is satisfied: focusing the button changes pixels
(the background tint and the surviving crescent) *inside the scrolling area of
the viewport*, and that is literally all the rule requires. axe-core, WAVE, and
Lighthouse see a valid, high-contrast `:focus-visible` declaration and a real
color change, so none of them flag anything. Recognizing that the visible portion
of the ring is a meaningless crescent — that the ring a user looks for is cut off
at the clip boundary — requires rendering the focused state and making a
layout-aware visual judgment about whether the indicator is genuinely
perceivable, which static scanners do not do.

## Citation
**Reference:** ACT Rule oj04fd — Element in sequential focus order has visible focus (`act-rules/extracted/oj04fd.md`)
> "For each target element, there is at least one device pixel inside the scrolling area of the viewport whose HSL color value is different when the element is focused from when it is not."

**Reference:** WCAG 2.2 Understanding — Focus Visible (`wcag-understanding/focus-visible.html`)
> "Without a focus indicator, sighted keyboard users cannot operate the page."
