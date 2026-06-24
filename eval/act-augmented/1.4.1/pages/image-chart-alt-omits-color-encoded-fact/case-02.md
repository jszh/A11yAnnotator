# case-02 — Inline-SVG pie chart; wedge→program binding lives only in color-matched legend swatches; caption can't tie "teal = biggest" to a program

## Scenario
A nonprofit's "Where your gift goes" page shows a donation-breakdown pie chart as an **inline SVG**
of five colored `<path>` wedges. The wedges have no labels and no data inside the SVG; the only thing
that binds a colour to a program name is the LEGEND beneath, whose swatches are color-only `<span>`
squares next to program names ("Direct food aid", "Mobile pantry routes", etc.). The SVG is a single
named graphic (`role="img"` + `aria-label`), and a caption lists all five programs and all five
dollar amounts and states the colour rule — "the largest wedge, shown in teal, is by far our biggest
commitment." But it never says, in words, that the teal wedge IS "Direct food aid." Binding teal to
the program requires visually matching the teal legend swatch to the teal wedge and reading the
adjacent name.

## Attribute tuple
- **Content domain:** nonprofit / donation transparency
- **UI component / pattern:** pie chart with a color-swatch legend (APG "legend/key" anti-pattern)
- **Host-language construct:** inline `<svg role="img">` with `<path>` wedges + color-only legend `<span>`s
- **Locale / i18n:** en
- **Failure mechanism:** F13 — the category↔share binding is conveyed only by matching wedge colour to swatch colour; the caption restates the rule ("teal is biggest") without resolving which program teal is

## Developer persona
An agency built the page on a CMS using a generic "donut/legend" content block. The chart component
emits unlabeled colored wedges and a swatch legend by default. The agency copywriter wrote a caption
that lists the programs and totals and adds a friendly line about "the teal slice" — describing what
they saw on screen — without realising that "teal" is meaningless to anyone who can't match the
colour, and that the wedge-to-program mapping was never written down anywhere as text.

## Element / selector carrying the issue
`svg.pie[role="img"]` together with `ul.legend .sw` (the color-only swatches). The mapping
"teal wedge = Direct food aid (45%, the largest)" exists only as a shared `fill`/`background` colour
between the first wedge and the first legend swatch; it is never stated in text.

## Exact accessibility mechanism
AT exposes the SVG as one image whose name is the generic `aria-label` ("Pie chart of how donations
were spent…"). The wedges themselves carry no accessible text. The caption tells a screen-reader or
colour-blind user: five program names, five dollar amounts (as an unordered list), and "the largest
wedge is teal." To act on the headline message — "most of your gift goes to Direct food aid" — the
user must bind teal→a program, which is available only by eye, by matching colours. With no text
binding and no second visual cue (no percentage labels on wedges, no leader lines, no patterns), the
colour-encoded fact "Direct food aid is the dominant slice" is unrecoverable without colour vision.

## Expected ACT-style outcome
**failed** (SC 1.4.1, via F13; also implicates 1.1.1). The graphic has a valid non-empty accessible
name and the legend/caption are well-formed, so every automated alt/name rule passes. It fails 1.4.1
because the information conveyed by the colour differences (which program each wedge is, hence which
is largest) is not also available in text or via any non-colour visible cue.

## Why automated tools miss it
The SVG is `role="img"` with a non-empty `aria-label`; the legend swatches are `aria-hidden`
decorative `<span>`s; the caption is ordinary prose. axe/WAVE/Lighthouse see a properly named graphic
and stop. No scanner can perceive that the wedge↔program binding is carried solely by matching
`fill` colours, nor that the caption never spells that binding out. Recognising that "teal" is the
only key to the data, and that no text resolves it, requires reading the pie, reading the legend
colours, and reading the caption together — a visual-semantic judgment no tool performs.

## Citation
**Reference:** WCAG Technique F13 (`wcag-techniques/failures/F13.html`)
> "The objective of this technique is to describe the failure that occurs when an image uses color differences to convey information, but the text alternative for the image does not convey that information."

**Reference:** WCAG Technique G14 (`wcag-techniques/general/G14.html`)
> "Check that the information conveyed is also available in text and that the text is not conditional content."

**Reference:** Understanding SC 1.4.1 (`wcag-understanding/use-of-color.html`)
> "The intent of this success criterion is to ensure that all sighted users can access information that is conveyed by color differences, that is, by the use of color where each color has a meaning assigned to it."
