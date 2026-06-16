# Evaluation Notes — Macy's Homepage

## Driver / Collector Issues

- **EL8 (Sign In link)** has no corresponding entry in `drive.json` elements array (drive element 7 has empty srWalk and no activation data). The element appears in the global tabWalk (stop 10, outlineOrShadow:true, inViewport:true), so keyboard data was recovered from there. No appearance shot was taken for this element.

- **EL1, EL2 xpaths truncated in drive.json** (`d.elements[0].xpath` and `d.elements[1].xpath` are shown truncated in the raw output at 80 chars; full xpaths were recovered from collect.json).

- **EL3 (non-native div link)** — `localTabWalk.reachedByTab:true` but `focusIndicator.method:'computed-only'` with no focusShot, suggesting the driver could not diff because the element scrolled out of shot area. The `keyboard` block confirms non-native with Enter/Space unresponsive — definite 2.1.1 fail.

- **Focus shot cropping artifacts**: EL4, EL15, EL16, EL17, EL18 all show `visibleDiffPct:0` with `indicatorPresent:true` and `method:real-tab-diff`. These elements are at the boundary of the crop; the 1px browser default outline appears outside the bounding-box crop area. Evidence from `localTabWalk.outlineOrShadow:true` and `computedOutline:'auto 1px rgb(0,95,204)'` confirms the outline is genuinely present. Verdicts set to NOT REPRODUCED for focus-visibility.

- **Search input (EL14)** focus diff 2.41% attributed to text cursor only (not a focus ring). tabWalk outlineOrShadow:false and computedOutline:none confirm 2.4.7 fail.

## Snapshot Fidelity

- The page is a JavaScript-rendered SPA; `noscript:false` and `scriptsDisabled:false`. Forms probe found 1 form (search), `nativeValidationOnly:true`. The page hydrated successfully — `bodyLen:7763` at 320px, `tabWalk.count:50`, `elements.count:21`.

- Promotional slideshow (hero banner) has 4 aria-hidden slide panels (`slide-beauty`, `slide-starrewards`, `slide-easter` ×2) that still contain focusable links. This is an axe `aria-hidden-focus` violation at critical/serious severity.

- The Gift Registry dialog (`drive.json` element 10 modal): `closedByEscapeOrButton:false` and `focusReturnedToTrigger:false`. This is a confirmed 2.4.3 failure, not a snapshot fidelity gap — the dialog opened but Escape produced no close event.

## Ambiguities

- **Duplicate product card links**: Each product card has two links to the same URL — the image link and the product-info div link. The info div is a non-native element with keyboard operability failure (EL3). The image link is native and operable. This creates redundancy in the tab order.

- **label-content-name-mismatch (axe)**: Fires on 12 product card links where the `title` attribute value doesn't exactly match the visible text (e.g. truncated product names). These are not in the sampled elements set but are a page-wide pattern.

- **page-has-heading-one**: Axe best-practice rule only; not a WCAG SC. Recorded in page-structure evidence but not cited as a WCAG violation.

- **2.5.8 Target Size**: Women nav button (EL7) at h:14px is below 24px minimum. Not the primary finding scope but noted.
