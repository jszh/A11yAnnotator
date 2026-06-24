# case-05 — Essential medical schematic + heat-map (NA) vs a low-contrast annotation control (FAIL)

## Scenario
A patient-portal page showing retinal imaging results. One card holds three low-contrast graphics:
(1) a fundus schematic drawn in anatomical colors, (2) a retinal-thickness heat-map gradient
(red→blue measurement scale), and (3) a hollow `#b8c0c8` annotation ring (`.pin`, a `role`able
`<button>`) placed over the macula whose outline is ~1.6:1 against the pale schematic. The
schematic and heat-map are Essential (recoloring would falsify clinical data) and are NA; the
annotation ring is a real UI control and FAILS 1.4.11.

## Attribute tuple
- **Content domain:** healthcare / patient portal (ophthalmology imaging)
- **UI component / pattern:** annotated diagram with an interactive measurement marker over an SVG
- **Host-language construct:** inline `<svg role=img>` (schematic + `radialGradient` heat-map) with an overlaid `<button class="pin">`
- **Locale / i18n:** en
- **Failure mechanism:** Essential exception correctly exempts the clinical graphics, but a co-located interactive control's identifying outline is below 3:1 and is wrongly assumed exempt too

## Developer persona
A health-IT engineer embedded the radiology vendor's clinical false-color SVG verbatim (the lab
mandates "do not adjust" the heat-map). To let patients tap a region for the numeric value, they
added a subtle hollow ring marker styled in a soft grey (`#b8c0c8`) so it "wouldn't obscure the
image." They reasoned the whole figure was "a medical image, which is exempt," not separating the
exempt clinical graphics from the interactive control they layered on top.

## Element / selector carrying the issue
`.pin` (the `<button>` at `left:188px; top:118px`) — its 3px `#b8c0c8` ring is ~1.6:1 against the
adjacent `#e9eef1`/`#fbf7ef` schematic area. The exempt graphics are the `<svg>` schematic and the
`url(#heat)` heat-map gradient.

## Exact accessibility mechanism
The Essential exception exempts logos, flags, sensory photos, and — explicitly — medical
schematics and heat-map measurement gradients, because "there is no way of presenting the graphic
with sufficient contrast without undermining the meaning." So the fundus drawing and the thickness
heat-map are NA. The annotation marker is different: it is a user-interface component, and "any
visual information provided that is necessary for a user to identify that a control is present...
must have a minimum 3:1 contrast ratio with the adjacent colors." Its hollow ring is the only
visual that a control exists there; at ~1.6:1 a low-vision user cannot find the tappable marker.
That control FAILS, even though everything behind it is exempt.

## Expected ACT-style outcome
**failed** (SC 1.4.11). The interactive annotation ring's identifying outline is below 3:1; the
essential clinical graphics are the NA boundary it must be separated from.

## Why automated tools miss it
A scanner cannot recognize the Essential exception: it has no way to know that a red→blue gradient
is a clinically-meaningful measurement scale (NA) rather than a recolorable decoration, nor that a
beige region is anatomically mandated. It also cannot tell the overlaid hollow ring is an operable
control (whose 1.6:1 outline truly fails) versus a decorative dot. A tool would likely flag the
whole SVG (false positives on the essential parts) while having no rule that singles out the one
genuinely-failing interactive marker. Both judgements — "essential" and "is this a control" — are
semantic/domain calls.

## Citation
**Reference:** WCAG 2.2 Understanding Non-text Contrast (`wcag-understanding/non-text-contrast.html`)
> "Diagrams of medical information that use the colors found in biology ... color gradients that represent a measurement, such as heat maps"

**Reference:** WCAG 2.2 Understanding Non-text Contrast (`wcag-understanding/non-text-contrast.html`)
> "Unless the control is inactive, any visual information provided that is necessary for a user to identify that a control is present and how to operate it must have a minimum 3:1 contrast ratio with the adjacent colors."
