# case-01 — Inner focus ring: dark-green (fails interior) vs white (beats interior) on a black-bordered blue button

## Scenario
A Meridian online-banking "Confirm your transfer" screen with two brand-blue primary
buttons side by side — **Confirm transfer** and **Schedule for later**. Both buttons are
blue (`#4189B9`) with a 2px black border. On focus each button draws a 3px **inset** ring
*inside* its visible boundary (via `box-shadow: inset`). `#btn-confirm` uses a dark-green
(`#008000`) inner ring; `#btn-schedule` uses a white inner ring. The pages look almost
identical, but the dark-green ring fails the SC and the white ring passes — purely because
of which **inner adjacency** the indicator must contrast with.

## Attribute tuple
- **content-domain:** online banking / fintech (move-money confirmation)
- **UI-component/pattern:** pair of custom-styled `<button>` primary actions
- **host-language construct:** `:focus { box-shadow: inset 0 0 0 3px <colour> }` (inner ring)
- **locale/i18n:** en-US
- **failure-mechanism:** inner focus indicator measured against the wrong adjacency — it
  contrasts with the black border (4.09:1) but, being entirely inside the component, must
  beat the blue interior (1.35:1) and does not

## Developer persona
A design-system engineer migrated the bank's buttons from a default `outline` to a
"cleaner" inset ring so the focus indicator would not visually collide with adjacent cards.
He picked the brand's accent green for the ring on the confirm button because "green reads
as go," eyeballed it against the dark button edge, saw a clear line, and shipped. He never
considered that an inset ring sits *inside* the blue fill, so the relevant comparison is
ring-vs-blue, not ring-vs-border. The sibling button kept a plain white ring from the base
component, which happens to clear the interior.

## Element / selector carrying the issue
`#btn-confirm:focus` — `box-shadow: inset 0 0 0 3px #008000` over a `#4189B9` interior
(FAIL). Contrast against the contrast/pass sibling `#btn-schedule:focus`
(`inset … 3px #ffffff` over the same `#4189B9`, PASS).

## Exact accessibility mechanism (what AT experiences, why it fails/passes)
A keyboard / low-vision user tabs to **Confirm transfer**. The focus indicator is an inner
green ring drawn on top of the blue button face. Because the ring is entirely *inside* the
component, the colour that sits next to it on the side that matters (the blue interior) is
`#4189B9`; green-on-blue is **1.35:1**, far below 3:1, so a person with moderately low
vision cannot perceive that this button is focused — the ring melts into the blue. (Its
4.09:1 contrast against the thin black border is irrelevant: per the Understanding text an
inner indicator "need[s] to contrast with the adjacent color(s) within the component.")
Tabbing to **Schedule for later** shows a white inner ring on the same blue; white-on-blue
is **3.82:1**, so the focused state is clearly perceivable — that one passes. The defect is
genuinely rendered: both `:focus` rules exist and fire in the browser.

## Expected ACT-style outcome
**failed** (the page contains the failing `#btn-confirm`; `#btn-schedule` is the passing
boundary twin that sharpens the geometry rule)

## Why automated tools miss it
axe-core, WAVE and Lighthouse have **no model of indicator geometry**. They cannot
determine that `box-shadow: inset` places the ring *inside* the visible boundary and
therefore that the ring must contrast with the **interior** surface rather than the border
it abuts. A pixel-sampling checker that compares the green ring to the nearest dark pixels
(the 2px black border) would compute 4.09:1 and report a pass. Both buttons are real
`<button>` elements with accessible names and a visible focus change, so every automatable
focus-visible / focus-present heuristic is satisfied. Choosing the correct one-of-two
adjacencies for an inner indicator is a structural/visual judgement no automated checker
performs.

## Citation
> **WCAG 2.2 Understanding, Non-text Contrast — "Relationship with Focus Visible":**
> "Most focus indicators appear outside the component - in that case it needs to contrast
> with the background that the component is on. Other cases include focus indicators which
> are: only inside the component and need to contrast with the adjacent color(s) within the
> component."

(Verbatim from `wcag-understanding/non-text-contrast.html`. The dark-green inner ring is
"only inside the component," so it must contrast with the blue interior — which at 1.35:1
it does not.)

> **WCAG 2.2 Understanding, Non-text Contrast (figure `figure-focus-inner-green`):**
> "Fail: An inner border of dark green (#008000) does contrast with the black border, but
> does not contrast with the blue component background."

(Verbatim from `wcag-understanding/non-text-contrast.html`. This page reproduces that exact
failing figure as a live `:focus` state, paired with the passing white-inner-border twin
from `figure-focus-inner-white`: "An inner border of white contrasts with the black border
and the blue component background.")
