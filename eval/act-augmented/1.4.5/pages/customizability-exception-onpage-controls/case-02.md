# case-02 — Deceptive twin: a poster image of text with A-/A+/colour controls that are inert decorative spans

## Scenario
A museum exhibition page ("Kunsthalle Brandt — Bauhaus in Colour") shows its full campaign
poster — title, dates, and venue, all baked into a single CSS background-image of text. In
the corner of the poster sits an "Adjust poster appearance" toolbar: **A-  A+** plus three
colour swatches (yellow / blue / black). It is laid out and styled exactly like a working
C30 customization control, with `role="button"`, `tabindex="0"`, `cursor:pointer` and hover
states — so a tool (and a casual reviewer) "sees" controls and would assume the image of
text is customizable. But the page contains **no script at all**: every control is a
decorative `<span>`. Clicking or pressing them does nothing; the image of text never
re-renders, recolours or resizes. The customizability exception is faked.

## Attribute tuple
- **content-domain:** arts / culture (museum exhibition)
- **UI-component/pattern:** "adjust appearance" toolbar (A-/A+ + colour swatches) as the deceptive twin of C30
- **host-language construct:** CSS `background-image: url(data: SVG <text>)` poster + `role="button"` spans
- **locale/i18n:** en/de bilingual venue content
- **failure-mechanism:** customization controls are present and named but have no event handler at all (inert decoration)

## Developer persona
A junior front-end dev was handed a finished poster PNG-style asset and a Figma mockup that
*showed* an "A- A+ / colour" adjuster as a design flourish. They reproduced the visual
exactly with styled spans and `role="button"` so it would "look interactive", intending to
"wire it up next sprint". The JS never landed, the design review only checked that it
*looked* right, and the inert toolbar shipped — giving the false impression the poster is
user-customizable.

## Element / selector carrying the issue
The image of text: `section.poster[role="img"]` (background-image data: SVG). The fake
controls: `.poster .adjust .ctl` and `.poster .adjust .swatch` — `role="button"` spans with
no `addEventListener` anywhere (the document has no `<script>`).

## Exact accessibility mechanism
A low-vision user sees an A+ button and three colour swatches and reasonably expects to
enlarge the dates or flip the poster to a higher-contrast palette. They click A+, press
Enter on the focused swatch — nothing happens, because there is no handler. The poster
remains a fixed bitmap: "9 March – 28 July" cannot be enlarged or recoloured. For 1.4.5,
the customization limb is satisfied only when activating the control actually adjusts the
image's font/size/colour/background (TT 7.E condition 2). Controls that are present but do
nothing do not satisfy it — this is precisely the "fake controls" failure the aspect
targets. A screen-reader user fares worse: the swatches expose names like "Yellow" with no
state, advertising a customization that does not exist.

## Expected ACT-style outcome
**failed** — SC 1.4.5 (Images of Text, Level AA). The poster is an image of text presenting
information (title, dates, venue) that could have been live text; the on-page controls that
appear to provide the customization exception are inert, so neither the customizability nor
the text-equivalent route is met.

## Why automated tools miss it
The page is well-formed: `role="img"` with a complete `aria-label` on the poster, named
`role="button"` controls with `tabindex`, a real `<title>`, no missing alt/name attributes.
axe-core, WAVE and Lighthouse do not OCR the background-image to learn it is a styled poster
of text, and — crucially — they do not click the A+/colour controls and diff the rendering
to discover the controls have no effect. A static scanner cannot tell a wired C30 switch
from a pixel-perfect decorative imitation; only a human who operates each control and
watches the poster (not) change can catch it.

## Citation
> **Reference:** WCAG Technique C30 "Using CSS to replace text with images of text and
> providing user interface controls to switch" (`wcag-techniques/css/C30.html`)
>
> **Quote (verbatim):** "Finally, through the use of server-side or client-side scripting,
> the author provides a control that allows the user to switch between the available views."
>
> **Quote (verbatim):** "Check that when the control is activated the resulting page
> includes text (programmatically determined text) wherever images of text had been used."
>
> **Reference:** Trusted Tester v5.1.3 — Test 7.E `1.4.5-image-of-text`
> (`refs/trusted-tester/sc-1.4.5-images-of-text.md`)
>
> **Quote (verbatim):** "Determine if the image of text can be **visually customized**:
> adjust the font, size, color, and background with controls provided by the web page."
