# case-03 — SVG NAV line chart where each data point's offset detail pop-up is destroyed when the pointer travels toward it across the next closely-spaced point (FAIL)

## Scenario
A fintech portfolio dashboard renders an SVG line chart of daily net asset value. Each `<circle>` data
point shows a detail pop-up (date, NAV, daily change) on `mouseenter`, positioned offset above-and-right
of the point. The points are closely spaced (~26px apart) and share a single reusable pop-up element
(repositioned per point). To read the offset pop-up for a given point under magnification, the pointer
must travel up-and-right toward it — but that path crosses the *next* data point, whose `mouseenter`
fires and replaces the wanted pop-up with the neighbour's. This is the exact second example in F95.

## Attribute tuple
- **Content domain:** online banking / fintech dashboard (portfolio NAV)
- **UI component / pattern:** SVG data-visualization with per-point detail pop-ups (chart tooltips)
- **Host-language construct:** SVG `<circle>` points with JS `mouseenter`/`mouseleave`; one shared `div[role=tooltip]` repositioned via `getBoundingClientRect` with a `(+14, −46)` offset; `pointer-events:none` on the pop-up
- **Locale / i18n:** en-US, USD currency
- **Failure mechanism:** F95 chart variant — the pop-up is offset from its point and points are densely spaced, so the cursor path to one pop-up crosses a neighbour that steals/replaces it; no shared hover region between a point and its own pop-up

## Developer persona
A data-viz engineer built the chart with a single tooltip element repositioned on hover for performance
(re-using one node instead of one per point), and offset it up-and-right so the cursor wouldn't cover the
value. They never set `pointer-events` on the tooltip because "it's a tooltip, you don't click it," and
they validated by hovering points one at a time at 100% zoom — where the tooltip is fully visible without
moving the pointer onto it. Under magnification, where the user must move toward the offset tooltip, the
dense point spacing means the neighbour always intercepts.

## Element / selector carrying the issue
The `.dot` circles in `#pts` and the shared `#pt-pop` (`div[role=tooltip]`). The combination of ~26px
point spacing, the `(+14, −46)` pop-up offset (toward the next point), and per-point `mouseenter`
replacement is the defect.

## Exact accessibility mechanism
A magnifier user hovers the "Jun 11" point; its pop-up ("$1.041 +1.0%") appears 14px right and 46px up.
That places it near the "Jun 12" point. To bring the pop-up fully into the magnified viewport the user
moves the pointer up-and-right toward it; the pointer crosses the "Jun 12" circle, firing *its*
`mouseenter`, which calls `place()` and rewrites `#pt-pop` to "$1.037 −0.4%" — the wanted pop-up is gone,
replaced by a different one, before it could be read. There is no shared hover region between a point and
its offset pop-up, and the pop-up's `pointer-events:none` means hovering it could not help anyway. The
Hoverable condition is violated for every point whose pop-up sits over a neighbour.

## Expected ACT-style outcome
**failed** (SC 1.4.13, Hoverable; Failure technique F95, chart example).

## Why automated tools miss it
There is no automated 1.4.13 rule. This page even passes the checks a scanner *can* do: the SVG has
`role="img"` with an `aria-label`, there is a real `<table>` data fallback (1.1.1), and every point is
`tabindex="0"` with `role="button"` and focus handlers (2.1.1). A static analyzer sees legitimate chart
tooltips. The failure is entirely a function of pixel geometry: point-to-point spacing versus the
pop-up's offset versus which point the travel vector intersects. Detecting it requires simulating the
cursor moving from a point toward its offset pop-up and noticing it crosses an adjacent interactive
point that hijacks the pop-up — a spatial trace no checker computes.

## Citation
**Reference:** WCAG Technique F95 — Examples (`wcag-techniques/failures/F95.html`)
> "Hovering over a chart with data points, pop-ups open to show details of the respective data point, somewhat offset from the data point itself. When moving the pointer towards the pop-up so it can be fully read with magnification, the pointer travels over other data points that cause the appearance of other pop-ups that replace the particular pop-up the user wanted to see."

**Reference:** WCAG 2.2 Understanding 1.4.13 — Hoverable (`wcag-understanding/content-on-hover-or-focus.html`)
> "This condition generally implies that the additional content overlaps or is positioned adjacent to the target."

**Reference:** WCAG Technique F95 — Tests, Expected Results (`wcag-techniques/failures/F95.html`)
> "If #1 and #2 are false, then content fails the Success Criterion."
