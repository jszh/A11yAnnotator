# case-01 — Transit map: three routes distinguished only by line color, identical dot stations

## Scenario
A municipal transit authority ("Riverside Metro") publishes its network map as an inline
SVG. Three routes — Crosstown, Harborline, Parkway — are drawn as polylines that differ
only by stroke color (green / red / blue). Every station on every line is the same white
filled dot with a black outline. The legend below the map keys each route name to a solid
colored swatch, with no pattern or shape. There is no station icon, no route number on the
line, and no in-graphic text that distinguishes the routes. Color is the sole encoding.

## Attribute tuple
- **content-domain:** civic / public transit
- **UI-component/pattern:** inline-SVG network/transit map with a swatch legend
- **host-language construct:** `<svg><polyline stroke="#…"> + <circle>` station dots
- **locale/i18n:** en-US
- **failure-mechanism:** route categories distinguished by hue only; legend is color-keyed; no pattern/icon/label per G111

## Developer persona
A GIS contractor exported the route geometry from the agency's mapping tool and styled
each route with the brand color the marketing team assigned ("Crosstown is our green
line"). The SVG looked correct on the design mockup and on the contractor's monitor, so
it shipped. Nobody checked it in grayscale or with a CVD simulator; "the lines are clearly
different colors" was treated as sufficient.

## Element / selector carrying the issue
The three route polylines and the station group:
`svg polyline[stroke="#0b8457"]`, `svg polyline[stroke="#c0392b"]`,
`svg polyline[stroke="#2e86c1"]`, and the identical `svg g > circle` stations, plus the
color-only legend `.legend .swatch`.

## Exact accessibility mechanism
For a sighted user with color-vision deficiency (or anyone using a grayscale display), the
three route strokes collapse to similar greys and the station dots are already identical,
so it becomes impossible to tell which line passes through which station, or to follow a
single route across the interchange at Union Square, or to match a route to its name in
the legend. The information "this station is on the Crosstown line" is conveyed by hue
alone, with no redundant pattern (hatch/dash), shape, icon, or in-graphic label. This is
the exact failure G111 exists to prevent ("an on-line map of a transportation system
displays each route in a different color … marked with a distinctive icon"). The SVG's
`aria-label` does not rescue it: 1.4.1 requires a *visible* non-color alternative for
sighted users who cannot distinguish color, not just an AT name.

## Expected ACT-style outcome
**failed** — SC 1.4.1 (Use of Color, Level A). Color is the only visual means of
distinguishing the route categories in a non-text graphic, and the sufficient technique
G111 (color + pattern) is not satisfied.

## Why automated tools miss it
The markup is fully valid: the SVG carries a descriptive `aria-label`, the page has a
non-empty `<title>`, every line color clears 3:1 contrast against the white map
background, and there are no missing alt/name attributes for a linter to flag. axe-core,
WAVE, and Lighthouse therefore report no violation. None of them can rasterize the SVG,
segment the three overlapping polylines, recognize that hue is the *only* differentiator
between route categories, and confirm the legend itself is color-keyed. Deciding that no
pattern/shape/label redundantly carries the route distinction is a visual-semantic
judgment that requires rendering the graphic and reasoning about its meaning.

## Citation
> **Reference:** WCAG Technique G111 "Using color and pattern"
> (`wcag-techniques/general/G111.html`)
>
> **Quote (verbatim):** "An on-line map of a transportation system displays each route in
> a different color. The stops on each route are marked with a distinctive icon such as a
> diamond, square, or circle to help differentiate each route."
>
> **Quote (verbatim):** "Check that all information that is conveyed using color is also
> conveyed using patterns that do not rely on color."
>
> **Reference:** Trusted Tester v5.1.3 — Test 13.A `1.4.1-color-meaning`
> (`refs/trusted-tester/sc-1.4.1-use-of-color.md`)
>
> **Quote (verbatim):** "Displaying content in grayscale may help identify content that
> uses only color to convey information."
