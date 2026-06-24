# case-01 — Garden-centre card carousel: last card's Tab wraps to the first card (no advice)

## Scenario
"New This Season" page for Meadowlark Garden Centre. A featured-products carousel holds five
plant cards, each with an "Add to basket" button (5 focusable controls). The carousel sits between
the site header nav and a footer nav (Delivery, Planting guarantee, Contact, Returns). A keyboard
user Tabs through the header, into the five Add-to-basket buttons, and on the FINAL button presses
Tab expecting to reach the footer links — instead a `keydown` handler calls `preventDefault()` and
sends focus back to the first card's button. The footer nav is permanently unreachable by keyboard.
There is no instruction anywhere telling the user how to get out.

## Attribute tuple
- **content-domain:** horticulture / garden-centre e-commerce
- **UI-component/pattern:** product card carousel (APG carousel) — multi-element region
- **host-language construct:** native `<button>` controls + JS `keydown` Tab interception with `focus()`
- **locale/i18n:** en-GB (£ prices, "basket", "collection")
- **failure-mechanism:** G21 mechanism #1 violated — forward Tab does NOT exit the subset after the final location (within-region loop), no advice owed or given

## Developer persona
A small-business owner pasted a "make your carousel sticky" snippet from a carousel-plugin demo
thread. The snippet's stated goal was to "keep the featured row in view while browsing," and it did
that by trapping Tab on the last item back to the first. The owner tested with a mouse, saw the row
behave, and never tabbed past the last card to notice the footer had become unreachable.

## Element / selector carrying the issue
`#lastCard` (the fifth `.card button.add`). Its `keydown` listener intercepts forward Tab
(`e.key === 'Tab' && !e.shiftKey`), calls `e.preventDefault()`, then `first.focus()`.

## Exact accessibility mechanism
A keyboard-only or switch user advancing with Tab reaches the last Add-to-basket button. The natural
next Tab stop is the footer's first link (`#footerFirst`). The handler cancels that default and
moves focus to the first card's button instead, so focus cycles 1→2→3→4→5→1 forever within the
carousel. Keyboard access is "restricted to a small section of the page with no way to navigate out
of the loop to the rest of the page" (Trusted Tester 2.b). Because plain unmodified Tab is the key
in play, no alternate-method advice is owed; the page passes G21 only if the final Tab exits — and
it does not. The footer links (Delivery, Guarantee, Contact, Returns) can never receive keyboard
focus. This is the pure G21-mechanism-#1 behavioural failure: the final Tab must exit the subset and
it does not.

## Expected ACT-style outcome
**failed** — SC 2.1.2 No Keyboard Trap. Resolving it requires Tabbing to the region's LAST control
and observing that the next Tab wraps internally rather than crossing the region boundary to the
footer; recognising no advice is owed for plain Tab means the page fails purely on the behavioural
question.

## Why automated tools miss it
axe-core, WAVE and Lighthouse evaluate the static DOM and computed accessibility tree. Every button
has an accessible name and a correct role; the carousel ARIA is well-formed; nothing is empty or
mislabeled. The trap exists only as a runtime `keydown` behaviour that fires when a real Tab press
lands on the last button — automated scanners never synthesise key events or simulate tab traversal,
so they cannot observe that focus loops back instead of advancing, nor that the footer is unreachable.

## Citation
> **Reference:** Trusted Tester v5.1.3 — SC 2.1.2 No Keyboard Trap, "How to Test"
> (`refs/trusted-tester/sc-2.1.2-no-keyboard-trap.md`)
>
> **Quote (verbatim):** "Keyboard access is restricted to a small section of the page with no way to
> navigate out of the \"loop\" to the rest of the page."
>
> **Reference:** WCAG Techniques — G21 "Ensuring that users are not trapped in content"
> (`wcag-techniques/general/G21.html`)
>
> **Quote (verbatim):** "Ensuring that the keyboard function for advancing focus within content
> (commonly the tab key) exits the subset of the content after it reaches the final navigation
> location."
