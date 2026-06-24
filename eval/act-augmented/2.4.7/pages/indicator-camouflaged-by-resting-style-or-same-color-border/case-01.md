# case-01 — Civic portal nav: every link permanently dotted, focus ring camouflaged among siblings

## Scenario
A county "Resident Services Portal" has a six-item horizontal primary nav
(Property & Taxes, Vital Records, Permits, Pay a Bill, Transit, Get Help).
The agency's theme paints a permanent `outline:1px dotted #000` on every nav
link so the bar reads as a row of evenly-outlined tabs. The author never wrote
`outline:none`, so the browser's own keyboard focus ring — itself a 1px dotted
black line — is still drawn on the focused link. Because all six links already
look like dotted boxes at rest, the focused one is visually indistinguishable
from its five neighbours.

## Attribute tuple
- **content-domain:** government / civic services portal
- **UI-component/pattern:** primary horizontal navigation bar (set of links)
- **host-language construct:** `<nav><a>` links styled with `outline:1px dotted #000`
- **locale/i18n:** en-US
- **failure-mechanism:** F78 mode 2 — permanent author outline identical in style/weight/colour to the UA focus ring, so the focused element blends into its siblings

## Developer persona
An agency front-end developer themed the portal on a "USWDS-ish" pattern and
liked the look of boxed tabs. They added `outline:1px dotted #000` to every nav
link to get that framed appearance, and — having read that you must *never*
remove the focus outline — they deliberately left the UA `:focus` ring intact,
believing they were being accessibility-conscious. They never tabbed through to
notice that their decorative dotted box is the same dotted box the browser draws
on focus.

## Element / selector carrying the issue
`nav.primary a` — all six links carry `outline:1px dotted #000; outline-offset:0`
at rest. There is no `:focus` override, so the UA dotted ring is the only focus
signal and it matches the resting decoration. (The footer `Privacy` link repeats
the same pattern.)

## Exact accessibility mechanism
On Tab, the focused link receives the UA keyboard-focus indicator — a thin dotted
black ring — so a focused-vs-unfocused pixel comparison on that single element is
non-zero. But every sibling link is already wearing an identical dotted black
outline at rest. A sighted keyboard user scanning the bar sees six look-alike
dotted boxes and cannot determine which one currently holds focus. The indicator
is *present* (pixels change) but not *distinguishing* (it does not tell the user
which element has focus), which is precisely the failure F78 mode 2 describes.
A screen-reader user is unaffected (role/name unchanged); the barrier is purely
for sighted keyboard/low-vision users relying on the visible focus position.

## Expected ACT-style outcome
**failed** (SC 2.4.7 Focus Visible). The pure single-element focused-vs-unfocused
diff (ACT oj04fd's mechanism) is non-zero, so oj04fd would *pass* — this fixture
sits in the gap oj04fd leaves open.

## Why automated tools miss it
axe-core, WAVE and Lighthouse have no reliable 2.4.7 check, and the only
near-signals they could use are absent here: nothing sets `outline:none`, and a
focus indicator demonstrably appears (the UA ring). A focused/unfocused pixel diff
on the focused link is non-zero. What no automated tool does is compare the
focused element's appearance against the *resting* appearance of its neighbours
to judge whether the change actually distinguishes the focused element. That
comparison — and the conclusion that a dotted ring over an already-dotted box is
not distinguishing — requires human visual judgment.

## Citation
> **Reference:** WCAG Technique F78 — "Failure of Success Criterion 1.4.11, 2.4.7
> and 2.4.13 due to styling element outlines and borders in a way that removes or
> renders non-visible the visual focus indicator" (`wcag-techniques/failures/F78.html`)
>
> **Quote (verbatim):** "The following CSS example will create an outline around
> links that looks the same as the focus indicator. This makes it impossible for
> users to determine which one in fact has the focus, even though the user agent
> does draw the focus indicator."
>
> **Reference:** WCAG Understanding 2.4.7 Focus Visible (`wcag-understanding/focus-visible.html`)
>
> **Quote (verbatim):** "The purpose of this success criterion is to help a person
> know which element has the keyboard focus."
