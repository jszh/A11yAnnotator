# case-06 — TRUE NEGATIVE: transit map where each route ALSO uses a distinct station shape (G111)

## Scenario
A transit authority ("Harbor City Tram") publishes the same kind of inline-SVG network map
as case-01, but here each route is distinguished by station SHAPE in addition to color: the
Bay line's stations are diamonds, the Hill line's are squares, the Coast line's are
circles. The legend lists each route name together with its station shape ("Bay line
(diamond stations)", etc.), so the shape encoding is explicit. Color and shape are
redundant, satisfying G111. This is the passing counterpart that sharpens the boundary
against the failing case-01.

## Attribute tuple
- **content-domain:** civic / public transit
- **UI-component/pattern:** inline-SVG transit map with shape-coded stations + shape legend
- **host-language construct:** `<svg>` route `<polyline>` + per-line station `<rect>`/`<circle>` shapes
- **locale/i18n:** en-US
- **failure-mechanism:** NONE — non-color encoding (station shape) is present and redundant (G111 satisfied)

## Developer persona
The same GIS contractor, after an accessibility review on a prior project, adopted the WCAG
transit example as a template: every line gets a brand color AND a distinct station glyph,
and the legend names both. They now verify the map in grayscale before shipping, and the
three routes remain followable when hue is removed.

## Element / selector carrying the issue
No issue. The redundant encoding lives in the per-route station groups:
`svg g[stroke="#0b8457"] rect[transform*="rotate(45)"]` (Bay diamonds),
`svg g[stroke="#c0392b"] rect` (Hill squares), `svg g[stroke="#2e86c1"] circle` (Coast
circles), with shapes echoed in `.legend svg`.

## Exact accessibility mechanism
Route membership is conveyed by two independent visual channels: line color and station
shape. A user who cannot perceive the line colors (CVD, monochrome display, grayscale
print) can still follow a single route by tracking its consistent station shape and can
match that shape to the legend, which names each route by shape. Because a non-color visual
means redundantly carries the route distinction, color is not the SOLE cue and the graphic
satisfies 1.4.1 via G111 ("stops on each route are marked with a distinctive icon such as a
diamond, square, or circle").

## Expected ACT-style outcome
**passed** — SC 1.4.1 (Use of Color, Level A). The route categorization is conveyed by
station shape as well as color; G111 is satisfied.

## Why automated tools miss it
This page passes automated checks — but the boundary it illustrates is invisible to them.
axe/WAVE/Lighthouse would also pass the FAILING case-01 (which differs only in that its
stations are identical dots). They never evaluate station shape at all, so they cannot tell
the accessible map from the inaccessible one. A human evaluator passes this page for the
RIGHT reason: by rendering it, confirming that station shape redundantly encodes the route
and survives grayscale. The pair (case-01 fail / case-06 pass) demonstrates that only
visual-semantic judgment separates them.

## Citation
> **Reference:** WCAG Technique G111 "Using color and pattern"
> (`wcag-techniques/general/G111.html`)
>
> **Quote (verbatim):** "An on-line map of a transportation system displays each route in a
> different color. The stops on each route are marked with a distinctive icon such as a
> diamond, square, or circle to help differentiate each route."
>
> **Reference:** WCAG Understanding 1.4.1 "Use of Color"
> (`wcag-understanding/use-of-color.html`)
>
> **Quote (verbatim):** "This should not in any way discourage the use of color on a page,
> or even color coding if it is complemented by other visual indication."
