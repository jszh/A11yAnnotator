# case-03 — API-reference endpoint chips: author-forced BLACK focus ring buried in a 4px black border

## Scenario
A "Payments API" reference page lists five operations as code chips
(POST /v3/charges, GET /v3/charges/{id}, POST …/refunds, GET /v3/charges,
DELETE /v3/charges/{id}). To make the chips read as crisp, copyable code boxes,
every endpoint link carries a permanent `border:4px solid #000` thick black
frame on the white page. The author *did* write an explicit focus style — but
they styled it as `outline:2px solid #000`: the same black as the border, and
thinner than it. On Tab the 2px black ring is drawn just outside the box, so
pixels change, but the ring is a thinner black line abutting an already-thicker
black border in the identical colour, so it is swallowed by the frame the chip
already wears at rest.

## Attribute tuple
- **content-domain:** developer / technical API documentation
- **UI-component/pattern:** endpoint operation list (code-chip links)
- **host-language construct:** `<ul><li><a>` with `border:4px solid #000` and an **author-supplied** `:focus { outline:2px solid #000 }` (same hue, thinner than border)
- **locale/i18n:** en-US
- **failure-mechanism:** F78 mode 3 — author-forced same-colour (black) focus ring thinner than a thicker same-colour border, so the ring is occluded by the resting frame

## Developer persona
A developer-relations engineer maintains the API docs theme. They wanted the
endpoint list to read like a column of copyable code boxes, so they gave each
operation link a chunky 4px solid-black border. Having been told repeatedly
"never use `outline:none`" and "always supply your own focus style", they added
an explicit `:focus` ring — but, matching it to the black chrome, they made it
`outline:2px solid #000`. Their a11y lint passed (a focus style is present and
is not `none`), so it shipped; nobody tabbed the list to notice that a 2px black
ring outside a 4px black border is indistinguishable from the border itself.

## Element / selector carrying the issue
`.endpoints a` — resting `display:block; border:4px solid #000; background:#fff`
on a white page. The `.endpoints a:focus` rule applies
`outline:2px solid #000; outline-offset:1px` — the **same black** as the border
and **thinner** than it, so the only focus signal is a same-colour ring against
a thicker same-colour border.

## Exact accessibility mechanism
On focus, a 2px black outline is drawn 1px outside the chip, so a focused-vs-
unfocused pixel diff is non-zero and the element is not `outline:none`. But the
chip already has a 4px solid black border, and the focus ring is the exact same
black drawn against it; as both are black and the border is thicker than the
ring, the indicator — in F78's words — "no longer meets the definition of
'visible'." A sighted keyboard user moving through the five endpoints cannot
tell which chip currently holds focus, because the focused chip looks like the
same heavy black box as every other chip. Each `<a>` exposes role `link` and the
correct accessible name (verified in the Chromium AX tree), so AT speech is
unaffected; the barrier is purely the camouflaged *visible* focus for sighted
keyboard and low-vision users. This differs from the UA-default-ring cases in
the set: here the ring colour is **forced black by the author**, so the verdict
is deterministic and does not depend on whatever colour a given browser's
default focus ring happens to be.

## Expected ACT-style outcome
**failed** (SC 2.4.7 Focus Visible). The single-element focused/unfocused edge
diff is non-zero and a genuine author focus style exists, so ACT oj04fd would
*pass*; the same-colour-occlusion failure is the gap this fixture fills.

## Why automated tools miss it
There is a real author-supplied `:focus` rule (so even a heuristic looking for a
missing focus style finds one), `outline:none` never appears, and an edge-pixel
diff on the focused chip is non-zero — so axe-core, WAVE and Lighthouse pass
2.4.7. None of them compares the focus-ring colour against the *adjacent*
resting border colour to decide whether the ring is perceptually
distinguishable. Concluding that a 2px black ring against a 4px black border is
absorbed requires a human to look at the focused edge in context and weigh
perceptual contrast against the same-colour neighbour — not the binary "did any
pixel change" an automated rule computes.

## Citation
> **Reference:** WCAG Technique F78 — "Elements have a border that occludes the
> focus indicator" example (`wcag-techniques/failures/F78.html`)
>
> **Quote (verbatim):** "The following CSS example creates a border around links that does not have enough contrast for the focus indicator to be seen when drawn on top of it. In this case the focus indicator is drawn just outside the border, but as both are black and the border is thicker than the focus indicator, it no longer meets the definition of \"visible\"."
>
> **Reference:** WCAG Technique F78 — example CSS (`wcag-techniques/failures/F78.html`)
>
> **Quote (verbatim):** "a {border: medium solid black}"
