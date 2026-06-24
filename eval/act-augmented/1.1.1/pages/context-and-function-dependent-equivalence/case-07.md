# case-07 — PASS boundary: globe link named "International Travel" + printer named "Print this page"

## Scenario
A travel-planning site (Wayfarer Travel) demonstrates context/function-dependent equivalence
done **correctly**. A globe `<img>` is the sole content of an `<a>` that links to the
International Travel section; the image literally depicts a globe, but its `alt` is
`"International Travel"` — serving the link's purpose, not describing the picture. This is the
exact canonical WCAG example built to pass. The header also has a printer icon `<button>`
correctly named `"Print this page"` (the control-purpose limb done right), a direct contrast
to case-04's failing "inkjet printer." This is the PASS control for the aspect: the same class
of element that fails in the other cases is here labelled by purpose.

## Attribute tuple
- **Content domain:** travel
- **UI component / pattern:** section-navigation card link (functional image) + icon print button (image-as-control)
- **Host-language construct:** `<a href="/international">` wrapping a globe `<img>`; `<button onclick="window.print()">` wrapping a printer `<img>`
- **Locale / i18n:** en
- **Failure mechanism:** NONE — alternatives serve the link/control purpose (this is the correct/passing variant)

## Developer persona
An accessibility-aware front-end developer wrote the alts by asking "what does this link/button
do?" rather than "what is in the picture?" — so the globe link's alt is its destination
("International Travel") and the printer button's alt is its action ("Print this page"). The
visible card captions are decorative (`aria-hidden="true"`) so they don't double up on the
already-correct accessible names.

## Element / selector carrying the issue
`a[href="/international"] > img[alt="International Travel"]` (the globe), and
`header button[onclick] > img[alt="Print this page"]` (the printer). Both are functional images
whose alt serves the purpose of the element they belong to. No defect is present.

## Exact accessibility mechanism
The globe `<img>` is the only content of its `<a>`, so the image's alt becomes the link's
accessible name: "International Travel" — which is precisely the link's purpose. A
screen-reader user hears "International Travel, link" and knows where it goes. The printer
button's accessible name comes from its child image alt, "Print this page," which names the
action. In both cases the alternative *serves the same purpose* as the non-text content even
though it does not describe the depiction (a globe, a printer) — the G94/H30 ideal.

## Expected ACT-style outcome
**passed** (SC 1.1.1). Each functional image's text alternative serves the same purpose as the
element it belongs to (link destination / control action). This is the boundary case proving
the aspect is about purpose-fit, not mere presence: it has the same surface signal (non-empty
alt on a linked image and an icon button) as the failing cases, yet it passes because the
alternatives are purpose-correct.

## Why automated tools miss it
This is the flip side of the aspect: an automated tool sees the same signal it sees on the
failing pages — a non-empty alt / accessible name on a linked image and on an icon button —
and would report "no violation" here, just as it (incorrectly) does on case-01 through case-06.
The tool cannot distinguish a purpose-correct alternative ("International Travel") from a
purpose-wrong one ("globe" / "inkjet printer"); only a human comparing the alternative against
the element's purpose-in-context can confirm this page is actually correct.

## Citation
**Reference:** WCAG Technique G94 (`wcag-techniques/general/G94.html`)
> "This text alternative should not necessarily describe the non-text content.  It should serve the same purpose and convey the same information.  This may sometimes result in a text alternative that looks like a description of the non-text content.  But this would only be true if that was the best way to serve the same purpose."

**Reference:** WCAG 2.2 Understanding Non-text Content (`wcag-understanding/non-text-content.html`)
> "An image of the world that is used on a travel site as a link to the International Travel section has the text alternative \"International Travel\"."
