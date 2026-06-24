# case-04 — SVG molecule diagram: atom elements identified by sphere color only, no symbol/number

## Scenario
A chemistry worksheet ("Identify the Elements in Ethanol") embeds an inline-SVG
ball-and-stick model of an ethanol molecule. Each atom is a colored sphere: dark spheres
are carbon, the red sphere is oxygen, the light spheres are hydrogen. The legend keys each
element NAME to a colored circle. There is no element symbol (C/O/H), no number, and no
in-image label on any atom. The graded questions then ask the student to count oxygen
atoms and name the rightmost atom — tasks answerable only by perceiving the sphere colors.
This is deliberately the *inverse* of the WCAG Understanding "examination" pass example,
which adds a number to each element with a color+number legend.

## Attribute tuple
- **content-domain:** education / chemistry assessment (e-learning worksheet)
- **UI-component/pattern:** inline-SVG scientific diagram with a color-swatch legend
- **host-language construct:** `<svg>` `<circle fill="#…">` atoms + `<line>` bonds + `<i>` legend swatches
- **locale/i18n:** en-US
- **failure-mechanism:** element identity carried by sphere hue only; legend color-keyed; no symbol/number/pattern in image (G111 not met)

## Developer persona
A curriculum designer adapted a CPK-colored 3D model screenshot into an SVG so it would be
crisp on tablets. CPK coloring is a real convention (black=carbon, red=oxygen,
white=hydrogen), so they trusted the colors to carry meaning and added a color legend to be
"thorough." Because the original 3D viewer never printed atom symbols, the SVG didn't
either. They did not consider color-blind students or grayscale printouts of the worksheet.

## Element / selector carrying the issue
The atom spheres whose identity is encoded only by fill: `svg circle[fill="#333740"]`
(carbon), `svg circle[fill="#d64545"]` (oxygen), `svg circle[fill="#eef1f4"]` (hydrogen),
together with the color-only legend `.legend i`. No `<text>` symbol or number labels exist
inside the SVG.

## Exact accessibility mechanism
Atom identity — the entire point of the diagram — is conveyed by sphere color with no
redundant non-color encoding. A student with red-green CVD cannot reliably separate the red
oxygen sphere from the dark carbon spheres, and on a grayscale printout the carbon (dark
grey) and oxygen (mid grey) collapse toward each other while the colors give no symbol to
fall back on. Questions 1 ("how many oxygen atoms") and 2 ("which element is the rightmost
atom") therefore cannot be answered without color perception. The fix per G111 / the
Understanding example is to add a number or element symbol to each atom and key the legend
by color + number; absent that, the graphic fails. The SVG `aria-label` is a summary, not a
visible non-color alternative, so it does not satisfy 1.4.1.

## Expected ACT-style outcome
**failed** — SC 1.4.1 (Use of Color, Level A). A non-text graphic distinguishes categories
(chemical elements) by color alone; the redundant number/symbol from the canonical pass
example is absent.

## Why automated tools miss it
The document is valid: the SVG has a descriptive `aria-label`, every form input is labelled,
the title is present, and contrast is fine. axe-core, WAVE, and Lighthouse pass it. They
cannot render the molecule, recognize that atom identity is encoded purely by CPK color
with no in-image symbol or number, cross-check that the legend is color-keyed, and judge
that this makes the assessment unsolvable without color vision. Distinguishing this failing
page from the passing "examination" variant (case-07) requires reading the graphic's
meaning — beyond any static checker.

## Citation
> **Reference:** WCAG Understanding 1.4.1 "Use of Color" — Examples
> (`wcag-understanding/use-of-color.html`)
>
> **Quote (verbatim):** "Students view an SVG image of a chemical compound and identify the
> chemical elements present based both on the colors used, as well as numbers next to each
> element. A legend shows the color and number for each type of element. Sighted users who
> cannot perceive all the color differences can still understand the image by relying on
> the numbers."
>
> **Reference:** WCAG Technique G111 "Using color and pattern"
> (`wcag-techniques/general/G111.html`)
>
> **Quote (verbatim):** "Check that all information that is conveyed using color is also
> conveyed using patterns that do not rely on color."
