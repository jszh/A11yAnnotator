# case-04 — 8px custom checkbox: focus = a 1px `#f7f7f7` ring (below the 4px shortest-side area)

## Scenario
A SaaS settings page ("Cadence — Notification preferences") uses very small custom
checkboxes — 8px × 8px squares built as `<span role="checkbox" tabindex="0">` — in a dense
preferences list. The widgets are correctly wired (role, name, `aria-checked`, Space/Enter
toggling). On focus, each box gets a 1px near-white outline (`#f7f7f7`) drawn 1px outside
the box on the white page. The change is real but, at this size and contrast, below the
perception threshold.

## Attribute tuple
- **content-domain:** SaaS product settings
- **UI-component/pattern:** APG custom checkbox (`role=checkbox` span), rendered 8px
- **host-language construct:** `<span role="checkbox" tabindex="0">` with `:focus { outline:1px solid #f7f7f7; outline-offset:1px }`
- **locale/i18n:** en-US
- **failure-mechanism:** focus indicator present but below G195's 4-CSS-px shortest-side AREA guidance and ~1.07:1 contrast

## Developer persona
A product designer specced "tiny inline toggles" for a compact settings table and added a
"1px subtle focus ring" in Figma. An engineer translated it literally:
`outline: 1px solid #f7f7f7; outline-offset: 1px`. They deliberately offset the ring
*outside* the box (onto the page) so it would look identical whether the box was checked
(purple) or unchecked (grey) — not realizing that at an 8px size a 1px near-white ring on
white is below any usable focus indicator.

## Element / selector carrying the issue
`.tick:focus { outline:1px solid #f7f7f7; outline-offset:1px }` on the four 8px
`span[role="checkbox"]` controls (`#l1`…`#l4` labels). The 8px dimension is the control's
shortest side.

## Exact accessibility mechanism
A sighted keyboard user Tabs across the four 8px checkboxes. The focus indicator is a 1px
ring in `#f7f7f7` sitting 1px outside the box on the `#ffffff` page — a contrast of about
**1.07:1** (verified rendered maxChannelDelta = 8/255). Two G195 conditions fail at once:
**(area)** the indicator is only 1 CSS px on each side of an 8px control — it is not a
perceptible 1px border and, lacking 3:1 contrast, is neither ≥4 CSS px on the shortest side
nor ≥2px thick; **(contrast)** ~1.07:1 is nowhere near 3:1. The outline genuinely paints a
faint ring (oj04fd passes on the pixel change), but a human scanning the dense list cannot
tell which 8px square currently has focus. Because the ring is offset onto the page (not
over the fill), it stays sub-perceptual on both checked-purple and unchecked-grey boxes.

## Expected ACT-style outcome
**failed** — SC 2.4.7 (Focus Visible, Level AA). The indicator's size and contrast on this
8px control are below the perception threshold, so the keyboard user has no *visible* focus
indication.

## Why automated tools miss it
The widget passes name/role/state checks (so 4.1.2 linters are quiet) and has a `:focus`
rule that changes `outline` (so "no focus style" heuristics are quiet). axe-core / WAVE /
Lighthouse do not measure the rendered indicator's *area* against G195's 4-CSS-px
shortest-side rule, nor its contrast delta, nor relate either to the control's 8px size. A
pixel diff sees the 1px ring change. Deciding that a 1px `#f7f7f7` ring on an 8px control is
imperceptible is a combined size-and-contrast visual judgment no static scanner performs.

## Citation
> **Reference:** WCAG Technique G195 "Using an author-supplied, visible focus indicator"
> (`wcag-techniques/general/G195.html`)
>
> **Quote (verbatim):** "If the focus indicator area is not at least equal to the area of a
> 1 CSS pixel border, check that it has an area of at least 4 CSS pixels along the shortest
> side of the component."
>
> **Quote (verbatim):** "The default focus indicator in some browsers is a thin, dotted,
> black line. It can be difficult to see the line when it is around a form element which
> already has an outline, when the focused element is inside a table cell, when the focused
> element is very small, or when the background of the page is a dark color."
>
> **Reference:** WCAG 2.2 Understanding SC 2.4.7 Focus Visible
> (`wcag-understanding/focus-visible.html`)
>
> **Quote (verbatim):** "Ensure each item receiving focus has a visible indicator."
