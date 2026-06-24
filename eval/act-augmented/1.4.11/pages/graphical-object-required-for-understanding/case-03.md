# case-03 — Four pale series lines (~1.5–2.1:1) with a colour-swatch legend that only NAMES colours → FAIL

## Scenario
A healthcare on-call dashboard ("Trailhead Health") shows "Mean ambulance response time by
region" as an inline-SVG line chart with four series. The four `<polyline>` strokes are pale
tints on a white plot area — North `#9FC5E8` (~1.8:1), South `#B6D7A8` (~1.6:1), East `#F9CB9C`
(~1.5:1), West `#D5A6BD` (~2.1:1) — all below 3:1. A colour-swatch **legend** maps each colour
to a region *name*. The legend is the trap: it tells you which colour means which region, but it
gives **no values** and you must still trace each low-contrast line to read its trend. There is
no data table and no per-point value. So the lines remain "required for understanding," their
contrast is below 3:1, and the chart **fails** 1.4.11.

## Attribute tuple
- **content-domain:** healthcare / clinical operations dashboard
- **UI-component/pattern:** inline-SVG multi-series line chart + colour-swatch legend
- **host-language construct:** four `<polyline stroke="…">` series; HTML legend of `.sw` colour
  chips + region names
- **locale/i18n:** en-GB
- **failure-mechanism:** lines required for understanding are below 3:1 against the plot; the
  legend names colours but is NOT equivalent text (no values), so the equivalent-text exemption
  does not apply (G207 — required graphical objects below 3:1).

## Developer persona
A clinical-systems developer used a charting library and accepted its default "muted" theme so
the dashboard wouldn't look alarming on the ward wall display. She added a legend because "a
chart needs a key" and felt that made it accessible. She didn't realise that (a) the muted line
colours sit ~1.5–2:1 against white and (b) a legend that only names the colours doesn't remove
the need to *see* the lines — it just tells you what they'd mean if you could.

## Element / selector carrying the issue
The four series `svg.line polyline[stroke]` — each pale stroke ~1.5–2.1:1 against the white plot
`<rect>`. The legend `.legend .key` is the decoy "alternative": it names colours but supplies no
values, so it does not exempt the lines.

## Exact accessibility mechanism (what AT experiences, why it fails)
A user with moderately low vision sees four faint lines that smear into the white background;
they cannot reliably trace any one region's trajectory, and the legend doesn't help because it
only assigns names to colours they still can't distinguish from the background — and it carries
no numbers, so there is no text fallback for the actual values. A screen-reader user gets only
the topic sentence in the `aria-label`; the per-region trend data is entirely visual. Per the
Understanding line-graph example, "the lines in the graph … should have 3:1 contrast against
their background"; here every series is below 3:1 and no labels+values or data table exempts
them → **fail**.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
The SVG is labelled and the legend is genuine text, so axe-core, WAVE and Lighthouse see a
"labelled chart with a key" and report nothing. None of them compute each `<polyline>` stroke
colour against the white plot, decide the lines are required for understanding because no
per-point values or data table exist, or reason that a legend which only *names* the colours is
not equivalent text. The hardest judgment is the legend distinction: separating "a legend that
exempts the graphic (it gives labels **and** values)" from "a legend that merely names the
colours" (case-03) is a semantic determination no scanner makes — and a colour-name legend
actually masks the failure from a naive "does it have a key?" heuristic.

## Citation
> **WCAG 2.2 Understanding, Non-text Contrast — line-graph example:**
> "In order to understand the graph you need to discern the lines and shapes for each
> condition. … The lines should have 3:1 contrast against their background, but as there is
> little overlap with other lines they do not need to contrast with each other or the graduated
> lines."

(Verbatim from `wcag-understanding/non-text-contrast.html`. The four series here are the lines
that "should have 3:1 contrast against their background" and do not — none reaches 3:1 against
the white plot.)

> **WCAG Techniques, G207 — "Ensuring that a contrast ratio of 3:1 is provided for icons":**
> "Not all graphics are within the scope of SC 1.4.11 Non-text contrast but if the icons are
> required to understand the content, then the icons need to have a contrast ratio of at least
> 3:1."

(Verbatim from `wcag-techniques/general/G207.html`. The principle generalises to the chart's
graphical objects: the series lines are required to understand the content, so each needs ≥3:1 —
which they fail. The colour-name legend does not supply the equivalent text that would exempt
them.)
