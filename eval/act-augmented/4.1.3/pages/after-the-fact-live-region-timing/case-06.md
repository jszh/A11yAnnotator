# case-06 — PASS control: persistent empty role=status snackbar at load, only textContent written later (coffee shop add-to-cart)

## Scenario
Cellar Door is a single-origin coffee shop. A snackbar `<div id="snackbar" role="status" aria-live="polite">` ships
in the markup **at page load as an empty, registered live region**. Adding any product to the cart writes ONLY
`textContent` into that pre-existing region ("Yirgacheffe added to your cart. 1 item.") and toggles a CSS class to
slide it in. The resting DOM after an add looks identical to the failing cases — a valid `role="status"` region with
a status message — but here the region existed and was empty when the AT registered it, so the later text mutation
**is** announced. This is the correct ARIA19/ARIA22 step-1 timing and the deliberate boundary control that sharpens
the aspect: the failure is never the end-state markup, it is whether the region pre-existed the content.

## Attribute tuple
- **content-domain:** e-commerce / specialty coffee storefront
- **UI-component/pattern:** add-to-cart snackbar / toast confirmation
- **host-language construct:** persistent `<div role="status" aria-live="polite">` in the markup at load; `snackbar.textContent = …` writes only text on action
- **locale/i18n:** en
- **failure-mechanism:** NONE — this is the correctly-timed counterpart (empty live region present at load, content written into it later)

## Developer persona
A careful e-commerce developer who read the ARIA live-region guidance — "create an empty element first, then update
its content." They shipped one persistent empty `role="status"` snackbar in the markup and only ever write
`textContent` into it. This is the PASS control: same final DOM as the failing cases, but the region pre-existed
empty at load, so it announces.

## Element / selector carrying the issue
`#snackbar[role="status"][aria-live="polite"]` — present and empty in the markup at load, marked
`data-region-preexisting-empty="true"`. The add-to-cart handler mutates only its `textContent`.

## Exact accessibility mechanism (what AT experiences, why it passes)
Because the `role="status"` (implicit `aria-live="polite"`) region is in the DOM and empty at page load, the
browser/AT registers it as a live region up front and monitors it. When `textContent` is later set to "Yirgacheffe
added to your cart. 1 item.", the AT observes a content mutation of an already-registered region and announces it.
A screen-reader user hears the cart confirmation just as a sighted user sees the snackbar slide in. This satisfies
ARIA19 (empty container present at load → content injected) and ARIA22 (role present *before* the status message
occurs). It is the exact inverse of case-01–case-05, which produce the same resting markup but create the region
together with its content (born-with-content → silent).

## Expected ACT-style outcome
**passed**

## Why automated tools miss it (i.e., why this is a useful control)
Automated tools would also "pass" this page — but for the wrong reason: they pass it because the end-state markup is
a valid live region, the very same end state they pass in the failing cases. A static checker cannot tell case-06
(genuinely correct: region pre-existed empty) apart from case-01–05 (genuinely broken: region born with content),
because the distinguishing fact is temporal and absent from any single snapshot. This control demonstrates that the
PASS/FAIL boundary for this aspect lives entirely in the ORDER of DOM operations, which is exactly what a human or
AT — not axe/WAVE/Lighthouse — must reason about.

## Citation
> **WCAG Technique ARIA19, `wcag-techniques/aria/ARIA19.html` (Examples):**
> "The error container must be present in the DOM on page load for the error message to be spoken by most screen
> readers."

> **WCAG Technique ARIA22, `wcag-techniques/aria/ARIA22.html` (Tests, Procedure step 1):**
> "Check that the container destined to hold the status message has a `role` attribute with a value of `status`
> *before* the status message occurs."
