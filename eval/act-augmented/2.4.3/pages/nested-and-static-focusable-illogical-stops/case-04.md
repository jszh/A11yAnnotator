# case-04 — "Stretched-link" podcast cards: card-cover `<a>` + visible "Listen now" `<a>` to the same episode (double stop per card)

## Scenario
A public-radio episode list (Tidewater FM). Each episode is a "whole-card-clickable" card built
with the popular Bootstrap-style **stretched-link** pattern: a primary `<a class="cover">` is
absolutely positioned to fill the entire card (`position:absolute; inset:0`) so a mouse user can
click anywhere on the card to open the episode. But each card *also* shows a real, visible
"Listen now" `<a>` pointing to the **same** episode page. Both are ordinary focusable `<a href>`
elements resolving to one destination, so every card yields a confusing double focus stop: Tab
lands on the card-cover link (announced as the full episode title), Tab again lands on "Listen now"
to the identical place. Across the 4-card list the user passes through every episode twice.

## Attribute tuple
- **content-domain:** media / public-radio podcast episode list
- **UI-component/pattern:** "stretched-link" clickable card (whole card is a link)
- **host-language construct:** nested focusables — a card-filling `a.cover` (absolute `inset:0`) plus a sibling visible `a.listen` to the same target
- **locale/i18n:** en
- **failure-mechanism:** duplicate/redundant focus stop per item from two focusable links in one card resolving to the same destination (confusing nested-focusable order)

## Developer persona
A front-end dev adopted the Bootstrap "stretched-link" recipe to make the whole episode card
clickable (absolutely-positioned cover `<a>` over the card). They kept the existing visible
"Listen now" link because the design team wanted the explicit affordance. Mouse testing was
perfect — clicking anywhere opened the episode — so nobody tabbed the list to discover that every
episode is now reachable twice in a row, both stops going to the same page.

## Element / selector carrying the issue
`a.cover` (the card-filling stretched link, `position:absolute; inset:0`) and the sibling
`a.listen` ("Listen now") in each `li.episode` — both focusable `<a href>` to the same `#ep-*`
target, repeated four times.

## Exact accessibility mechanism (what AT experiences, why it fails)
A keyboard / screen-reader user tabs into the list and hears "Episode 142: The night the harbor
lights went out, link" (the cover link's `aria-label`). Tab again: "Listen now, link" — pointing
to the *same* episode. Then the next card's cover link, then *its* "Listen now," and so on. Every
episode produces two consecutive, indistinguishable stops to one destination, doubling the number
of Tab presses and making the list appear to contain twice as many links as there are episodes.
This is the Understanding note's named failure: "a control appearing to receive focus multiple
times due to the use of nested focusable elements." The duplication impedes operation (the user
cannot tell the two stops apart and wastes keystrokes) and is confusing, not merely tedious.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
Both links per card are ordinary, fully valid `<a href>` elements: the card-cover link has a
descriptive `aria-label`, and "Listen now" has an href and visible text. No `role` attribute is
present anywhere on the card, so there is nothing for an `aria-allowed-role` rule to flag; nothing
is empty, hidden, mis-roled, or low-contrast. axe-core, WAVE, and Lighthouse have no rule for "two
focusable links in one card resolving to the same destination." Detecting the doubled stop requires
tabbing the list, noticing each episode is reached twice (card title link, then "Listen now" to the
same place), and judging the nested-focusable duplication confusing per the note — contextual human
reasoning.

## Citation
> **WCAG 2.2 Understanding Focus Order, Intent (note):**
> "it is a failure of Focus Order if items receive focus in an order that impedes the meaning or operation of content, or creates confusing or illogical focus orders — for example, a control appearing to receive focus multiple times due to the use of nested focusable elements."

(Verbatim from `wcag-understanding/focus-order.html`, the `#intent` note. Each card is a focusable
card-cover link plus a focusable "Listen now" link to the same target, reproducing the
nested-focusable double-stop the note flags.)

> **WCAG 2.2 Understanding Focus Order, "For clarity" list:**
> "Static/non-interactive elements can receive focus, as long as they don't impede operation of the content, or result in confusing or illogical focus order."

(Verbatim from `wcag-understanding/focus-order.html`. Here two focusable links to one destination
impede operation and create the confusing/illogical order the list warns against.)
