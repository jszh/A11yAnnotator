# case-06 — EV charging map is exempt, but its filter/legend/results sidebar is pinned beside it and clipped at 320px

## Scenario
An EV "Find a Charging Station" finder shows a genuine interactive map (an inline `<svg>` with plotted
stations) — a legitimate 1.4.10 exception, since a map requires two-dimensional layout. But the map and
its control sidebar (a filter form, a status legend, and a "nearby results" list) sit in a single
`flex-wrap: nowrap` row with `min-width: 1080px`. The map keeps its size (acceptable), but the sidebar —
none of which needs 2D layout — is pushed off the right edge and clipped at 320 CSS px instead of
dropping below the map and reflowing. The exception was scoped to the whole map+controls module rather
than to the map alone. (Novel scenario beyond the suggested table/grid set: map + adjacent controls.)

## Attribute tuple
- **Content domain:** utility / EV charging network finder (mapping)
- **UI component / pattern:** interactive map + filter form + legend + results list (filter facets)
- **Host-language construct:** `flex-wrap:nowrap` row, `min-width:1080px`, fixed-basis flex children
- **Locale / i18n:** en
- **Failure mechanism:** map correctly exempt, but adjacent non-excepted controls pinned beside it and clipped

## Developer persona
A product engineer integrated a map library into a two-pane "map left, controls right" desktop layout
and shipped it. They knew the map is exempt from Reflow ("maps are in the exception list"), so they
assumed the whole finder pane was exempt and never added a breakpoint to stack the sidebar below the map
on narrow viewports. The nowrap flex row keeps the controls glued to the map's right side.

## Element / selector carrying the issue
`.finder` (the `flex-wrap: nowrap; min-width: 1080px` row) holding the non-excepted `.controls` sidebar:
`form` (filters), `ul.legend`, and `ul.results`. The `.map` is the correctly-excepted element and must
NOT be flagged.

## Exact accessibility mechanism
At 320 CSS px, the map renders (its 2D layout is permitted), but the filter `<select>`s, the legend, and
the results list are off-screen to the right and clipped — a low-vision user must scroll horizontally to
reach the filters or read which stations are nearby, and a magnifier user may never discover the controls
exist. These are exactly the "related" controls the Understanding doc says are NOT excepted: like a
table's search field and pagination, a map's filter form / legend / results list must reflow into the
narrow viewport (e.g. stack below the map). Because they don't, the page fails.

## Why automated tools miss it
The map's 2D layout is a valid exception, so a tool that notices it must not flag it. There is no missing
attribute — the filters have `<label>`s, the map has `role` and an accessible name. The failure is the
scoping judgment: the map may keep 2D layout, but its adjacent filter/legend/results controls must reflow
(stack and shrink) at 320px. axe/WAVE/Lighthouse neither render at the target viewport nor reason about
"excepted map vs. non-excepted adjacent controls," so they cannot detect that the sidebar is wrongly
pinned and clipped.

## Expected ACT-style outcome
**failed** (SC 1.4.10). The map is excepted; the adjacent filter form, legend, and results list are not,
and they fail to reflow.

## Citation
**Reference:** Understanding SC 1.4.10 Reflow (`wcag-understanding/reflow.html`)
> "When a section of content is excepted from Reflow, the exception does not automatically extend to other content that doesn't need two-dimensional scrolling for understanding or functionality."

**Reference:** Understanding SC 1.4.10 Reflow (`wcag-understanding/reflow.html`)
> "Other content that is related to the table or grid, such as a preceding heading, a search field, or an accompanying pagination to load different sets of data are not excepted from meeting Reflow."

**Reference:** Understanding SC 1.4.10 Reflow (`wcag-understanding/reflow.html`)
> "Whenever possible it is in the best interest of the user to limit two-dimensional scrolling only to the individual sections of content which necessitate such scrolling, rather than allowing the page at large to scroll in two dimensions."
