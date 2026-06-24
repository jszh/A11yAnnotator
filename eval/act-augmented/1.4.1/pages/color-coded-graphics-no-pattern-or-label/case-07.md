# case-07 — TRUE NEGATIVE: SVG examination diagram with color AND number per element + color+number legend

## Scenario
An exam question ("Identify the Elements in Acetic Acid") embeds an inline-SVG ball-and-
stick model. Each atom is marked with BOTH a color AND a number drawn inside the sphere
(1 = Carbon, 2 = Oxygen, 3 = Hydrogen), and the legend gives the color AND the number for
every element. The graded questions reference atoms by number, so the diagram is solvable
without color perception. This is the canonical WCAG Understanding "examination" pass
example implemented faithfully, and the passing counterpart to the failing molecule diagram
in case-04.

## Attribute tuple
- **content-domain:** education / chemistry assessment (final exam)
- **UI-component/pattern:** inline-SVG scientific diagram with in-image numeric labels + color+number legend
- **host-language construct:** `<svg>` `<circle>` atoms each paired with an in-sphere `<text>` number
- **locale/i18n:** en-US
- **failure-mechanism:** NONE — redundant non-color encoding (per-atom number + color+number legend) present (G111 / Understanding example satisfied)

## Developer persona
The same curriculum designer from case-04, after the worksheet was flagged in review, read
the WCAG Understanding examination example and rebuilt the exam version to match it exactly:
every atom now shows a number as well as a CPK color, and the legend lists both. They verify
the diagram is solvable from the numbers alone before publishing.

## Element / selector carrying the issue
No issue. The redundant encoding is the in-sphere numbers paired with each atom — e.g. the
`<text>` reading "1" centered on each carbon `circle[fill="#333740"]`, "2" on each oxygen
`circle[fill="#d64545"]`, "3" on each hydrogen `circle[fill="#cfd6de"]` — and the
color+number legend `.legend i` (each swatch contains its number).

## Exact accessibility mechanism
Element identity is conveyed by two independent visual channels: sphere color and an
in-image number. A student who cannot perceive the colors (red-green CVD or a grayscale
printout) can still read the number on each atom and match it to the legend, which keys
each element by both color and number. The exam questions reference atoms by number, so
every item remains answerable. Because a non-color visual means (the numeric label)
redundantly carries the distinction, color is not the SOLE cue and the graphic satisfies
1.4.1 per the Understanding "examination" example and G111.

## Expected ACT-style outcome
**passed** — SC 1.4.1 (Use of Color, Level A). Each color-coded element also carries an
in-graphic number with a color+number legend; the information survives without color.

## Why automated tools miss it
As with case-06, automated checkers pass this page — but cannot tell it apart from the
failing case-04, which uses the same molecule-diagram pattern with color-only atoms.
axe/WAVE/Lighthouse never read the in-sphere `<text>` numbers or evaluate whether identity
survives without color; both pages clear contrast and have descriptive `aria-label`s. A
human evaluator passes this one for the RIGHT reason: by rendering it, reading the numbers,
and confirming the diagram is solvable in grayscale. The case-04 / case-07 pair shows that
distinguishing pass from fail here requires visual-semantic judgment.

## Citation
> **Reference:** WCAG Understanding 1.4.1 "Use of Color" — Examples (An examination)
> (`wcag-understanding/use-of-color.html`)
>
> **Quote (verbatim):** "Students view an SVG image of a chemical compound and identify the
> chemical elements present based both on the colors used, as well as numbers next to each
> element. A legend shows the color and number for each type of element. Sighted users who
> cannot perceive all the color differences can still understand the image by relying on
> the numbers."
>
> **Reference:** Trusted Tester v5.1.3 — Test 13.A `1.4.1-color-meaning` (Evaluate Results)
> (`refs/trusted-tester/sc-1.4.1-use-of-color.md`)
>
> **Quote (verbatim):** "When color is used to convey information, indicate an action,
> prompt a response, or distinguish a visual element, another visual, onscreen method is
> used to convey the information which does not use color."
