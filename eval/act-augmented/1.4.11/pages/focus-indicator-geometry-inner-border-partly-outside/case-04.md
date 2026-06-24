# case-04 — Straddling focus ring: inner half beats the seat fill, so it PASSES even though the outer half fails the page

## Scenario
A Northwind Air seat-selection map on a light cabin-grey page (`#f4f4f4`). Available seats
are blue (`#4189B9`) focusable buttons. The focus indicator is a 4px yellow (`#FFFF00`) ring
that **straddles** each seat's visible boundary — rendered as two stacked box-shadows of the
same yellow: a 2px **inset** part (inside the seat) and a 2px **outset** part (outside, on
the cabin page). The outer half of the ring is invisible against the page (1.02:1), but the
inner half clears the blue seat fill (3.55:1). Because a partly-inside/partly-outside
indicator passes if **either** part contrasts, this focus indicator **passes** — a fact only
geometric reasoning, not a single contrast number, can establish.

## Attribute tuple
- **content-domain:** travel / airline booking (seat-map selection)
- **UI-component/pattern:** grid of seat buttons in a cabin layout
- **host-language construct:** `:focus { box-shadow: inset 0 0 0 2px #FF0, 0 0 0 2px #FF0 }`
  (a single ring split half-inside / half-outside the boundary)
- **locale/i18n:** en-US
- **failure-mechanism (negative — the trap):** the *outer* half of the ring fails the page
  (1.02:1); a reviewer who checks only that half would wrongly fail the page, but the SC's
  "either part suffices" rule makes it a **pass** via the inner half (3.55:1)

## Developer persona
A booking-platform engineer wanted a focus ring "thick enough to see on a busy seat map," so
he used a single yellow ring drawn half inside and half outside each seat — a common trick to
get a chunky ring without pushing the layout around (`outline-offset` would have shifted
neighbours). He picked yellow because it stood out against the blue seats. He happened to be
right that it passes, but for the inner-half reason, not the outer one — and a naive auditor
checking the ring against the grey cabin would have flagged it incorrectly.

## Element / selector carrying the issue
`.seat:focus` — the straddling yellow ring. Inner half (inset) vs `#4189B9` seat = 3.55:1
(passes); outer half (outset) vs `#f4f4f4` page = 1.02:1 (fails, but need not). Verdict:
**pass** because either part may provide the contrast.

## Exact accessibility mechanism (what AT experiences, why it passes)
A keyboard / low-vision user tabs through the seats. The focus ring is yellow on both sides
of each seat's edge. On the *outside* of the seat the yellow is lost against the pale cabin
page (1.02:1) — but on the *inside* the same yellow sits on the blue seat at 3.55:1, which a
user with moderately low vision can clearly perceive. Per the Understanding text, when an
indicator is "partly inside and partly outside the component, either part of the focus
indicator can contrast with the adjacent colors," so the inner half's 3.55:1 is sufficient
and the focus state is perceivable → **pass**. The ring is genuinely rendered (both
box-shadow layers fire). The subtlety — and the reason a single number is misleading — is
that judging this requires segmenting the ring into halves and applying "either part
suffices."

## Expected ACT-style outcome
**passed** (included as the boundary case that exercises the partly-inside/partly-outside
"either-part-suffices" rule and shows how a single-adjacency check would mis-fire)

## Why automated tools miss it
Confirming this pass requires segmenting the ring into its inner and outer halves, choosing
the correct adjacency for **each** half (seat fill vs cabin page), and applying the "either
part may contrast" rule. axe-core, WAVE and Lighthouse have no notion of a straddling
indicator and perform none of these steps. A pixel-sampling checker that compares the yellow
to the dominant nearby surface could just as easily report a **false fail** (sampling against
the grey page, 1.02:1) as a coincidental pass for the wrong reason. Only a human reasoning
about where the indicator sits relative to the boundary can correctly conclude it passes via
its inner half.

## Citation
> **WCAG 2.2 Understanding, Non-text Contrast — "Relationship with Focus Visible":**
> "partly inside and partly outside, where either part of the focus indicator can contrast
> with the adjacent colors."

(Verbatim from `wcag-understanding/non-text-contrast.html`. The yellow ring is partly inside
/ partly outside; its inner half contrasts with the blue seat at 3.55:1, satisfying
"either part," so it passes despite the outer half failing the page.)

> **WCAG 2.2 Understanding, Non-text Contrast (figure `figure-focus-outer-inner`):**
> "Pass: The focus indicator is partially inside, partially outside the button. The internal
> part of the yellow indicator (#FFFF00) contrasts with the blue button background
> (#4189B9)."

(Verbatim from `wcag-understanding/non-text-contrast.html`. This page reproduces that exact
passing figure as a live `:focus` state on the seat buttons.)
