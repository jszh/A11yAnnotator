# case-02 — fixed top nav + non-dismissible fixed cookie bar sandwich content into a 68px strip

## Scenario
"The Copper Kettle", a Ludlow restaurant, ships an allergen-aware lunch menu. The page has a
`position: fixed` top navigation bar (brand + four nav links, `min-height: 92px`) and a
`position: fixed` bottom cookie-consent bar (`min-height: 96px`) with "Accept all" and "Manage
preferences" buttons. Each bar is individually reasonable. Together they are fixed to *both*
edges, so at the 256px-tall reflow viewport they consume **243px of 256px (95%)** combined,
sandwiching the entire menu — including the critical allergen lines diners actually need — into
a ~13px strip between them. Crucially the cookie bar's "Accept all" only sets a data flag; there
is **no control that removes the bar**, so the space is never recovered.

## Attribute tuple
- **Content domain:** restaurant menu & ordering
- **UI component / pattern:** fixed top nav + fixed bottom cookie/consent bar (two-edge fixed chrome)
- **Host-language construct:** `header.topbar { position: fixed; top: 0 }` and `div.consent { position: fixed; bottom: 0 }`
- **Locale / i18n:** en-GB
- **Failure mechanism:** two fixed bars on opposite edges sandwich content; the consent bar is non-dismissible so the squeeze is permanent

## Developer persona
An agency built the site on a generic restaurant theme. The fixed top nav came with the theme;
a separate marketing team later pasted in a cookie-consent snippet from a tag manager that pins
itself to the bottom of the viewport. Neither team rendered the combination at a zoomed-in
height, and the consent snippet's "Accept" handler was wired to set a cookie, not to remove the
banner element — a common copy-paste oversight. Each change looked fine in isolation on a tall
desktop screen.

## Element / selector carrying the issue
`header.topbar` (`position: fixed; top: 0; min-height: 92px`) **and** `div.consent`
(`position: fixed; bottom: 0; min-height: 96px`). The `.consent .ok` button only sets
`dataset.accepted` — it does not remove `.consent`.

## Exact accessibility mechanism
A reader who zooms to read the allergen list finds the menu trapped in a ~13px band between two
fixed bars: at most one line of text is visible at a time, and scrolling does not help because
both bars are pinned. The reader cannot scan a dish against its allergen line — the exact
"read without scrolling in two dimensions" function the SC protects — and cannot reclaim the
space because "Accept all" never dismisses the bar (verified: the bar persists in the DOM after
activation). This is the SC's "without loss of information or functionality" limb interacting
with the Focus-Not-Obscured overlap: the obscuring author content has *no* dismiss path.

## Expected ACT-style outcome
**failed** (SC 1.4.10). At the 256px reflow viewport, combined fixed chrome consumes ~95% of the
height, leaving non-excepted reading content unreadable, and the obscuring consent region cannot
be dismissed to recover the viewport.

## Why automated tools miss it
Both `position: fixed` bars are standard. The cookie bar's buttons have accessible names, good
contrast, and are keyboard-focusable, so axe/WAVE find nothing. Lighthouse's viewport audit
passes (zoom allowed). No tool sums the two fixed bars' heights against a 256px viewport, and no
tool reasons that "Accept all" fails to free the space because it never removes the element.
Verified empirically: at 320×256 the two bars render 98px + 145px = 243px (95%) of the height.
Recognising the unreadable sandwich — and that there is no dismiss path — is a human
visual-proportion plus functional judgment at the reflow viewport.

## Citation
**Reference:** WCAG 2.2 Understanding — Reflow, "Overlap with other success criteria → Focus Not Obscured (Minimum)" note (`wcag-understanding/reflow.html`)
> "It is strongly suggested that at smaller viewport sizes that such components are modified to have static positioning, or their display can be toggled by the user. Doing so will help ensure the zoomed in content can be read by users, as the sticky components will no longer obstruct the view of the web page's content."

**Reference:** WCAG 2.2 Understanding — Reflow, Focus Not Obscured overlap (`wcag-understanding/reflow.html`)
> "authors need to ensure such sticky content does not fully obscure the element which has user keyboard focus, or in the case author created content does obscure content, there is a way for a user to dismiss the obscuring content without requiring the advancement of keyboard focus."

**Reference:** EN 301 549 Annex C, clause C.9.1.4.10 Reflow (`docs/analysis/en301549/EN301549-ANNEX-C-RELEVANT-CLAUSES.md`)
> "Check that the web page does not fail WCAG 2.2 Success Criterion 1.4.10 Reflow according to WCAG Conformance Requirements stated in clause 9.6."
