# case-03 — "SOLD OUT" stamp carried only by a CSS background image (F3)

## Scenario
An "Ember Goods" candle shop grid with three product cards. The middle card, "Cedar &
Sage," is sold out — but the only signal is a diagonal red "SOLD OUT" banner composited over
its photo as a CSS `background-image` (an inline SVG data URI). The card's `aria-label`
describes the candle ("Grey jar candle, Cedar & Sage scent") but says nothing about
availability; there is no "sold out" text node, no `disabled`/`aria-disabled` on the button,
and no other state marker. Sighted users see the stamp and skip the product; AT users
perceive an in-stock candle with a fully working "Add to cart" button.

## Attribute tuple
- **content-domain:** e-commerce / product catalog
- **UI-component/pattern:** product grid card with availability overlay
- **host-language construct:** CSS `background-image: url("data:image/svg+xml,…")` (no `<img>`, no alt to set)
- **locale/i18n:** en
- **failure-mechanism:** essential state (SOLD OUT) conveyed exclusively by a CSS background image — F3, the "decorative by construction" case where no text alternative is even possible

## Developer persona
A Shopify Dawn-style theme was customised by a junior dev who needed a quick "sold out"
treatment. Rather than wire the inventory state into a `<span class="badge">Sold out</span>`
and disable the button, they reused the theme's existing image-overlay CSS hook and dropped
a "SOLD OUT" SVG into the card's `background-image`. It looked identical in the browser and
shipped — they never tested with a screen reader, and the inline data-URI stamp is purely
visual, so the availability fact silently never reaches AT.

## Element / selector carrying the issue
`.card .thumb.candle2` (the `background-image` data URI containing the "SOLD OUT" stamp)

## Exact accessibility mechanism (what AT experiences, why it fails)
CSS background images are not exposed in the accessibility tree and cannot be given a text
alternative. The "SOLD OUT" stamp is therefore invisible to AT. A screen-reader user on the
Cedar & Sage card hears "Grey jar candle, Cedar & Sage scent · $26 · Add to cart, button" —
identical in structure to the two in-stock cards — and may click an enabled button for a
product they cannot buy. The image conveys information (availability) that is not conveyed
anywhere else on the page, and that information is not programmatically determinable, which
is exactly the F3 failure condition for SC 1.1.1.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
There is no `<img>` element and no `alt` attribute to evaluate, so axe/WAVE/Lighthouse have
nothing to check — CSS background images are outside their inspection surface entirely. The
button has a valid name and is not marked disabled, so 4.1.2 passes. No tool OCRs the
background data URI to discover the embedded "SOLD OUT" text, and none can know that
availability is conveyed nowhere else. Detecting this requires a human to SEE the stamp,
notice the button is still active, and reason that essential state lives only in an
un-alt-able decorative layer.

## Citation
> **WCAG Technique F3 (Failure of Success Criterion 1.1.1 due to conveying information exclusively using CSS background images), Description:**
> "The CSS background-image property was designed for decorative purposes and it is not possible to associate text alternatives with images that are included via CSS. Text alternatives are necessary for people who cannot see images that convey information that is required to understand the content of the page. Therefore, it is a failure to use this property to add images to convey this required information."

(Verbatim from `wcag-techniques/failures/F3.html`. The "SOLD OUT" stamp is a background
image conveying required information — availability — with no possible text alternative,
matching F3 exactly.)

> **WCAG Technique F3, Tests, Expected Results:**
> "If check #2 is true and #3 is false, then this failure condition applies and the content fails this success criterion."

(Verbatim from `wcag-techniques/failures/F3.html`. Check #2 — the image conveys information
not conveyed elsewhere — is true; check #3 — the information is programmatically
determinable — is false; so the failure condition applies.)
