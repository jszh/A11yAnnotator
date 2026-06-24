# case-05 — Weather condition as a script-injected background-image glyph (temperature is text)

## Scenario
A coastal town dashboard with a weather widget. The **temperature** and "feels like" are real
text, but the **condition** for now and each upcoming hour (rain / cloud / sun) is conveyed
*only* by a weather glyph that a script paints as a `background-image` onto an empty
`<span class="glyph">` / `<div class="g">`, driven by a `data-cond` attribute. Because the
numbers look adequately labelled, a casual reviewer assumes the widget is fine — but the single
most useful fact ("will it rain?") is image-only. This is the F3 example-3 carrier plus the
dynamic-state facet, with a deliberate "half-labelled" trap.

## Attribute tuple
- **content-domain:** weather / civic information dashboard
- **UI-component / pattern:** weather widget with current + hourly forecast
- **host-language construct:** `el.style.backgroundImage = url(svg)` set in script from `data-cond`
- **locale / i18n:** en-GB (Whitby, °C, mph)
- **failure-mechanism:** F3 (script-injected carrier) — condition conveyed exclusively by a background image while a sibling fact (temperature) IS text

## Developer persona
A CMS author dropped in a third-party "weather card" widget. The widget exposes temperature as
text (it had to, for the big number), but renders the condition as an icon background pulled
from a sprite set — the vendor never wired a text/`aria-label` for the condition. The author
saw a complete-looking card (icon + number) and shipped it. The temperature being text is what
makes this subtle: it *looks* labelled.

## Element / selector carrying the issue
- `.wx .glyph` (current) and `.hours .g` (hourly) — empty elements whose script-set
  `background-image` is the only carrier of the weather condition.
- Temperature (`#nowTemp`, hourly degrees) is real text; the condition word never appears.

## Exact accessibility mechanism (what AT experiences)
A screen-reader user hears "Whitby, North Yorkshire, 12 degrees, feels like 9 degrees,
humidity 88%, wind 24 mph" and, for the hours, just "3 PM 12 degrees, 4 PM 11 degrees…". The
fact that it is raining now and will rain for the next two hours — the thing a user actually
needs to decide whether to go out — is never announced, because each condition is a
`background-image` on an empty element with no accessibility-tree presence. The half-labelled
design hides the gap from quick review. Forced-colors / "hide backgrounds" removes the
condition for sighted users too.

## Expected ACT-style outcome
**failed** — F3 (script-injected carrier): the weather condition is conveyed exclusively by a
dynamically-set CSS background image with no text equivalent, even though a sibling datum
(temperature) is text. ACT 1.1.1 rules are **Inapplicable** (the carriers are `<span>`/`<div>`
backgrounds, not nameable image elements).

## Why automated tools miss it
The widget contains visible text (temperature), so text-presence and contrast checks pass and
the page "looks labelled". The condition carriers are background images on empty elements —
no `image-alt` target, no accessibility node. No tool can OCR the raincloud/sun SVGs, and none
can reason that the *condition* is a separate piece of information from the *temperature* and
is the one missing as text. That separation is a human semantic judgment.

## Citation
**Reference:** WCAG Technique F3 — *Failure of Success Criterion 1.1.1 due to conveying
information exclusively using CSS background images* (`wcag-techniques/failures/F3.html`).

> "Text alternatives are necessary for people who cannot see images that convey information that
> is required to understand the content of the page."

**Supporting reference:** EN 301 549 V4.1.0 Annex C, clause C.9.1.1.1 — SC 1.1.1 Non-text
content (`docs/analysis/en301549/EN301549-ANNEX-C-RELEVANT-CLAUSES.md`).

> "Check that the web page does not fail WCAG 2.2 Success Criterion 1.1.1 Non-text content
> according to WCAG Conformance Requirements stated in clause 9.6."
