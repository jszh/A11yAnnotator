# case-03 — Restaurant menu dish names painted from a CSS sprite-sheet of script-face text (low-vision, NOT screen-reader, harm)

## Scenario
"Trattoria del Ponte" publishes its dinner menu. To get an elegant calligraphic script for the
dish names, the designer baked all five names into **one SVG sprite-sheet** and applies it as a
CSS `background-image` on each `<span class="name">`, revealing the correct row with
`background-position`. The visible dish names ("Tagliatelle al Ragù", "Ossobuco alla Milanese",
etc.) are therefore an image of text — no `<img>`, no alt, and the span has **no visible text
node** (the displayed words exist only as pixels in the background). The author *did* expose the
names to assistive tech with `aria-label="<dish name>"` on each `.name` span, so a screen reader
correctly reads "Tagliatelle al Ragù, €16, House egg pasta…". The "Dolci" course renders its dish
names as **live text** in a script webfont stack, proving the brush-script look was achievable
without an image. The prices and descriptions being real text is the camouflage that makes the
rows look populated to a checker.

## Attribute tuple
- **Content domain:** restaurant menu & ordering
- **UI component / pattern:** menu list (`<ul>` of dish rows), CSS sprite-sheet
- **Host-language construct:** `<span>` with `background-image` SVG sprite + `background-position`; no text node; `aria-label` on the span supplies a correct accessible name
- **Locale / i18n:** Italian dish names in an en page (mixed-language content)
- **Failure mechanism:** images of text delivered as a single sprite-sheet background and revealed per-row; the rendered presentation is a fixed-size bitmap-equivalent that cannot be resized/recolored/restyled

## Developer persona
An agency themed a restaurant template. The client insisted the menu use the exact brush-script
font from their printed menu, which the agency did not have web-licensing for. Rather than buy a
webfont, the junior designer exported the names as one SVG "sprite" (a trick they'd used for
icons) and sliced it per row with `background-position`. They were diligent about screen readers
— they added `aria-label` with the real dish name to every row — but never realized the *visual*
text was now frozen as an image that low-vision users cannot adjust.

## Element / selector carrying the issue
`ul.dishes li > span.name` (rows `.r1`–`.r5`) — each shows a slice of the SVG sprite-sheet
background containing the dish name in script type; the span carries the dish name as an
`aria-label` but renders no live text. (The `Dolci` course's `span.name-live` items are the
live-text PASS foil, not the issue.)

## Exact accessibility mechanism
A sighted diner reads the script dish names. A **screen-reader / Voice Control** user is fine: the
dish name is exposed as the span's accessible name (`aria-label`), so AT reads "Tagliatelle al
Ragù, €16, …" — **1.1.1 is satisfied and there is no screen-reader harm; that is not the defect
here.** The genuine 1.4.5 harm is for **low-vision** users: the displayed dish name is a
fixed-size CSS `background-image`, so it pixelates on zoom and ignores user font-size, custom
foreground/background colors, and forced-colors mode — the *visual presentation cannot be
adjusted*. The brush-script presentation is plainly achievable with live text — `@font-face` (a
licensed script webfont) or even a system cursive stack, as demonstrated by the live-text "Dolci"
course on the same page. The dish names are ordinary words (not a logotype, not essential, not
user-customizable), so the SC's exception does not apply. Images of text used where the visual
presentation was achievable as adjustable text → fail. (The names are real words, not a "picture
with significant other visual content", so the graphs/diagrams exclusion does not apply either.)

## Expected ACT-style outcome
**failed** (SC 1.4.5). Multiple images of text (the dish names) are used in place of live text
whose styled presentation is achievable in CSS; the rendered text is not resizable/recolorable
and is not customizable or essential.

## Why automated tools miss it
The names come from `background-image`, so there is no `<img>` for axe-core/WAVE to flag
(verified: the page has zero `<img>` elements); the spans have non-empty accessible names
(`aria-label`), so empty-element and missing-name rules pass; the prices and descriptions are real
text, so the rows look populated. Lighthouse reports nothing. No tool slices and OCRs a
sprite-sheet to discover the backgrounds spell dish names, recognizes that those visible names are
images of text rather than live styled text, or judges that a brush-script could have been a
licensed webfont (as the adjacent live-text "Dolci" course shows). That is OCR-like detection plus
an achievability call — manual work. Note this is decisively a 1.4.5 (visual-adjustability)
defect, **not** a 1.1.1 naming defect: the accessible names are present and correct.

## Citation
**Reference:** WCAG 2.2 Understanding — Images of Text, In brief (`wcag-understanding/images-of-text.html`)
> "Users can adjust how text is presented."

**Reference:** WCAG 2.2 Understanding — Images of Text, In brief (`wcag-understanding/images-of-text.html`)
> "People cannot alter how text looks in images."

**Reference:** WCAG Technique C22 — Using CSS to control visual presentation of text (`wcag-techniques/css/C22.html`)
> "It is better to use real text for the text portion of these elements, and a combination of semantic markup and style sheets to create the appropriate visual presentation."

**Reference:** Trusted Tester v5.1.3 SC 1.4.5, How to Test step 2.a (`refs/trusted-tester/sc-1.4.5-images-of-text.md`)
> "Customizing font size for an image of text also implies the ability to adjust the size without pixelation (typically evident when simply using the browser resize functionality to resize images)."
