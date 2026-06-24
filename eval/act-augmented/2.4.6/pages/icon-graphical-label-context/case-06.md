# case-06 — E-commerce: same magnifier glyph as "Search" (field) and "Zoom image" (photo) — PASS control

## Scenario
A product page ("Trailhead 30L Backpack" on Summit Outfitters) uses the **same magnifying-glass
glyph in two places**, each correctly. In the header, a loupe trails a text field with accessible
name "Search" and submits a product query. On the product photo, the same loupe (with a small "+"
inside) sits in the corner with accessible name "Zoom image" and opens an enlarged lightbox. This
is the canonical, commonly-understood reuse the SC 2.4.6 Understanding doc describes verbatim — so
the graphical labels are descriptive and the page **passes**. It is included to sharpen the aspect:
a judge must distinguish appropriate same-icon reuse (here) from the misuse in case-01..05.

## Attribute tuple
- **content-domain:** e-commerce product detail page
- **UI-component/pattern:** `role="search"` field button + image "zoom" lightbox trigger
- **host-language construct:** two `<button aria-label="…"><svg aria-hidden>…loupe…</svg></button>` in different contexts
- **locale/i18n:** en-US
- **failure-mechanism:** none — correct, commonly-understood context-appropriate reuse (boundary PASS variant)

## Developer persona
A front-end developer followed the SC 2.4.6 Understanding example deliberately: a loupe by the
search field named "Search," and the same loupe on the gallery image named "Zoom image" with a "+"
detail to reinforce magnification. Each control's accessible name describes its function, and each
control does what it says.

## Element / selector carrying the issue
- `form[role="search"] button.go[aria-label="Search"]` — loupe next to a text field; submits a query. **Appropriate.**
- `.gallery button.zoom[aria-label="Zoom image"]` — loupe-with-plus on the photo; opens an enlarged lightbox. **Appropriate.**

## Exact accessibility mechanism
Both buttons expose role `button` with a non-empty accessible name (loupe SVGs are `aria-hidden`).
The first, accompanying a text field and named "Search," is the commonly-understood query
affordance; the second, placed on an image and named "Zoom image," is the commonly-understood
magnify affordance. In each placement the glyph's conventional meaning matches the context, and the
accessible name names the function (not the glyph). Each control performs exactly what its label
states. The graphical labels are therefore descriptive, satisfying the 2.4.6 label limb.

## Expected ACT-style outcome
**passed** (SC 2.4.6 Headings and Labels — label limb, TT 5.B). Both icon labels are
commonly-understood cues for their respective functions in their respective contexts.

## Why automated tools miss it
Automated tools also pass this page — but here the pass verdict is *correct*, and that is the
point. A tool only confirms both buttons have non-empty names; it cannot tell that this is the
*appropriate* reuse the Understanding doc endorses while case-01..05 are *inappropriate* misuse,
because that distinction is a human judgment about whether each glyph's conventional meaning fits
its context. The aspect requires a human to ratify good reuse as confidently as they flag bad reuse.

## Citation
> **Reference:** WCAG 2.2 Understanding — Headings and Labels (`wcag-understanding/headings-and-labels.html`)
>
> **Quote (verbatim):** "Placed on or near another image, a loupe or magnifying glass icon is commonly interpreted as a means to view a magnified version of the image (for instance, acting as a mechanism to zoom into the image, or opening a full-sized image in a new window)."
>
> **Reference:** WCAG 2.2 Understanding — Headings and Labels, "Examples" (`wcag-understanding/headings-and-labels.html`)
>
> **Quote (verbatim):** "A search text input is followed by a button containing a magnifying glass icon that activates the search function. The icon has the string "search" as programmatically determinable label."
