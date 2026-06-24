# case-02 — Bookshop staff-picks carousel: final Tab left alone, exits to footer (PASS)

## Scenario
"Staff Picks This Month" page for Tidepool Books. The same multi-element-region shape as case-01 —
a five-card carousel ("Add to cart" buttons) between a header nav and a footer nav (Store hours,
Reading group, Gift cards, Contact). Here, the final card's Tab is NOT intercepted: pressing Tab on
the last "Add to cart" button moves focus to the footer's first link, so keyboard access flows out of
the region into the rest of the page. No advice text is present anywhere because none is needed —
plain Tab already exits.

## Attribute tuple
- **content-domain:** independent bookshop e-commerce
- **UI-component/pattern:** product card carousel (APG carousel) — multi-element region
- **host-language construct:** native `<button>` controls, NO key interception (default tab order)
- **locale/i18n:** en-GB (£ prices, "cart")
- **failure-mechanism:** none — G21 mechanism #1 satisfied; the boundary contrast to case-01

## Developer persona
A bookseller who builds the shop site themselves on weekends added a carousel but deliberately did
NOT copy any "keep it in view" Tab-trapping snippet — they read that intercepting Tab breaks keyboard
users, so they left focus order to the browser. Click handlers update the button label; nothing
touches focus.

## Element / selector carrying the issue
`#lastCard` (the fifth `.card button.add`) — the element to inspect. It has NO `keydown` listener, so
its default Tab moves focus to `#footerFirst`. This is the deliberate point of contrast with case-01.

## Exact accessibility mechanism
A keyboard user Tabs header → five "Add to cart" buttons → last button → footer "Store hours" link →
remaining footer links. Focus is never restricted to the carousel; the region's final Tab exits the
subset after the final navigation location, exactly the G21 mechanism #1 behaviour. There is no
keyboard trap and no advice is owed (plain Tab suffices). The page therefore passes SC 2.1.2.

## Expected ACT-style outcome
**passed** — SC 2.1.2 No Keyboard Trap. The judge must Tab to the LAST control and confirm the next
Tab crosses the region boundary into the footer (focus lands on `#footerFirst`). Because the only
difference from the failing twin is the absence of the last-element Tab interception, this case
verifies the judge rules on behaviour, not on the carousel's appearance or markup.

## Why automated tools miss it
The same reason the failing twin is missed: automated scanners cannot tell case-01 (trap) from
case-02 (no trap) because the DOM, ARIA, names and roles are equivalent. Only by driving the keyboard
and observing where focus lands after the last button can a human distinguish the pass from the fail.
Including this PASS prevents a judge from learning "carousel = fail"; the verdict must come from the
observed Tab behaviour.

## Citation
> **Reference:** WCAG Techniques — G21 "Ensuring that users are not trapped in content"
> (`wcag-techniques/general/G21.html`)
>
> **Quote (verbatim):** "Ensuring that the keyboard function for advancing focus within content
> (commonly the tab key) exits the subset of the content after it reaches the final navigation
> location."
>
> **Reference:** WCAG Understanding — No Keyboard Trap, Intent
> (`wcag-understanding/no-keyboard-trap.html`)
>
> **Quote (verbatim):** "Keyboard focus is not considered trapped when the user can navigate away
> from a component using only a keyboard interface, and if it only requires unmodified arrow or Tab
> keys or other \"standard exit methods\"."
