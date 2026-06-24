# case-03 — Layered trap: required-marker red bullet is indistinguishable from a decorative red bullet except by colour

## Scenario
A new-patient intake sheet for "Lakeview Family Medicine." Required fields *do* get a marker —
a red bullet "•" rendered via `.f.req label::before`. So at first glance there is a non-text
marker, and a naive "is some marker present?" check would pass. The **trap**: the exact same red
bullet glyph (`content:"•"; color:#c0392b`) is used **decoratively** as the list marker on the
"What to bring to your appointment" checklist. The required-marker bullet and the decorative
bullet are the *same glyph in the same red*. The only thing that distinguishes "this red dot
means required" from "this red dot is just a bullet" is the colour-coded context plus a legend
that itself says **"Fields marked with a red dot are required."** For a user who cannot perceive
red, every "•" on the page reads as the same near-black shade, so they cannot tell the required
markers from the decorative ones — and the legend, being colour-keyed, cannot help them.

## Attribute tuple
- **content-domain:** healthcare / clinic patient intake
- **UI-component/pattern:** intake form with an adjacent decorative "what to bring" checklist
- **host-language construct:** CSS `::before { content:"•"; color }` used for BOTH the required
  marker and a decorative list bullet (collision by glyph + hue)
- **locale/i18n:** en-US
- **failure-mechanism:** F81 — the required marker is differentiated from decorative content by
  colour only; a layered ambiguity where the "non-colour cue" (a bullet) is itself reused as
  decoration, so colour is the sole disambiguator

## Developer persona
A practice manager copied a "required-field dot" snippet from a styling tutorial that used a
red `::before` bullet, then separately styled the "what to bring" list with a matching red
bullet because it "looked consistent with the brand red." Nobody noticed that the required
marker and the decorative marker had become the identical glyph in the identical colour — so the
only thing keeping them apart is the reader's ability to follow the colour-keyed legend.

## Element / selector carrying the issue
`.f.req label::before` (the required-marker red bullet) versus `.bring li::before` (the
decorative red bullet) — identical `content:"•"` and `color:#c0392b`. The legend `.legend`
("Fields marked with a red dot are required") is the colour-keyed instruction that fails to
disambiguate.

## Exact accessibility mechanism (what AT experiences, why it fails)
CSS `::before` content is not part of the accessible name of the labels (generated content is
unreliable in the accessibility tree and is announced by almost no screen reader), so a
screen-reader user hears "Patient full name, edit text" with no "required" and no bullet — the
marker is invisible to AT entirely, and there is no `required`/`aria-required`. A sighted
colour-blind user sees bullets everywhere: some are required markers, some are checklist
decoration, all rendered in a red that, under red-green deficiency or in greyscale, looks the
same dark grey as the body text. They cannot tell which dots flag required fields. The legend
"a red dot" only restates the colour rule. So the required status is conveyed by colour
(plus an ambiguous reused glyph) with no working non-colour alternative → fails 1.4.1.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
This is engineered to defeat the obvious heuristics. A marker glyph *is* present next to
required fields, so any "does a non-colour cue exist?" check is satisfied. But CSS `::before`
content is invisible to axe/WAVE/Lighthouse (they do not read generated content into the
accessibility tree), and even if a tool saw both bullets it could not reason that the required
marker is **indistinguishable** from a decorative marker except by colour and position, nor that
a legend saying "a red dot" fails to resolve which dots are required for a colour-blind user.
That two visually identical glyphs carry different meanings separated only by hue is a
visual-semantic judgment no scanner performs.

## Citation
> **WCAG Techniques, F81 — "Failure of Success Criterion 1.4.1 …" (Description):**
> "This objective of this technique is to describe the failure that occurs when a required field
> or an error field is marked with color differences only, without an alternate way to identify
> the required field or error field. This can cause problems for people with color vision
> deficiency or low vision, because they may not be able to perceive the color differences that
> indicate which field is required …"

(Verbatim from `wcag-techniques/failures/F81.html`. Here the "marker" is reused as decoration,
so the colour of the dot is the only thing identifying which dots mean "required" — exactly the
colour-difference-only failure, dressed up to look like a non-colour cue.)

> **WCAG 2.2 Understanding, Use of Color — Note on lightness/shape:**
> "However, if content relies on the user's ability to accurately perceive or differentiate a
> particular color an additional visual indicator will be required regardless of the contrast
> ratio between those colors."

(Verbatim from `wcag-understanding/use-of-color.html`. The page relies on the user perceiving
that a dot is *red* (and red-coded as "required") to tell it apart from a decorative dot, so an
additional, genuinely distinguishing visual indicator is required and is absent.)
