# case-03 — Realty listing cards: `:focus-within` lift on a non-focusable wrapper

## Scenario
A real-estate listings grid. Each home is a card (`<article>`); the address is a real
`<a>`. The card has a "lift + shadow" interaction bound to `:hover` and `:focus-within`.
Because `:focus-within` bubbles from the focused link, tabbing onto a listing DOES lift
the card — but the lift renders on the wrapper, is pixel-identical to hover, and the
actual focused link has `outline: none`. The keyboard user cannot tell which element
inside the lifted tile holds focus.

## Attribute tuple
- **content-domain:** real-estate / property listings
- **UI-component / pattern:** responsive card grid with one link per card
- **host-language construct:** `<article class="card">` wrapper + descendant `<a>`; CSS `:focus-within` on the wrapper, `outline:none` on the link
- **locale / i18n:** en-US, USD pricing
- **failure-mechanism:** focus feedback applied to a **non-focusable wrapper** via `:focus-within`, ambiguous with hover, while the real focusable target's own indicator is removed

## Developer persona
A designer built the card "lift on interaction" effect in a visual page builder and
attached it to the whole tile so the entire card would feel clickable. They used
`:focus-within` because it "also covers keyboard." A developer later stripped the link's
default outline (`a:focus { outline: none }`) so the only feedback would be the tasteful
card lift — not realizing the lift is on the wrong node and indistinguishable from hover.

## Element / selector carrying the issue
`.card:hover, .card:focus-within { box-shadow…; transform: translateY(-3px) }` on the
wrapper `<article>`, combined with `.card .addr a:focus { outline: none }` on the real
focusable link.

## Exact accessibility mechanism
This is the subtle "present-but-wrong-node" failure. On Tab, `:focus-within` does fire and
the card lifts, so *something* changes — but (1) the indicator marks the entire tile, not
the focused control, so when several cards are visible the user cannot identify **which**
element holds focus, and the link's own outline was removed; (2) the lift is the same
style as `:hover`, giving no modality-distinct cue. A screen reader still announces the
link; the sighted keyboard user is left guessing the focused target.

## Expected ACT-style outcome
**failed** (oj04fd, with a caveat). A change *does* occur on focus, so a naive pixel-diff
"did anything change?" check could be fooled into passing. *(Verified in Chromium: the
wrapper lifts — `transform: none → matrix(1,0,0,1,0,-3)`, shadow appears — yet the focused
link's own `outline` stays `none`.)* The correct human verdict is **failed**: the visible
change is not a focus indicator on the focused element and is hover-ambiguous.

## Why automated tools miss it
Because a perceptible change occurs on focus, any heuristic that only asks "does the page
look different under programmatic focus?" passes — including diff-based approaches.
Judging that the change is on the wrong node, is identical to hover, and leaves the real
target bare requires a human to reason about *which* element focus is on versus *where*
the feedback appears.

## Citation
> **WCAG 2.2 Understanding 2.4.7 — Intent** (`wcag-understanding/focus-visible.html`):
> "The purpose of this success criterion is to help a person know which element has the
> keyboard focus."

> **WCAG Technique C15** (`wcag-techniques/css/C15.html`), Description:
> "Highlighting the element that has focus or is hovered over can provide information such
> as the fact that the element is interactive or the scope of the interactive element."
