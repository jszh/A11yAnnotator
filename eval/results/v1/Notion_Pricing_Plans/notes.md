# Evaluation notes — Notion_Pricing_Plans

## Driver / collector problems

- **el1 (Request a demo) and el5 (Partner programs):** `visibleDiffPct=0` reported for both `real-tab-diff` shots, but pixel analysis confirms the crops are blank/uniform white — the nav element scrolled out of the driver's crop window at focus time. Not an indicator absence; confirmed NOT REPRODUCED via `computedOutline` and `tabWalk.outlineOrShadow=true`.

- **35 of 50 tabWalk stops are `inViewport:false`:** This is a long pricing page (7000px+). All off-screen stops are below the fold in natural reading order. Not a 2.4.11 issue — they are not obscured/hidden, just below the fold.

- **el2, el3, el8, el9, el10, el11, el15, el16, el21 — no appearance shot generated:** `appearanceOffScreen:true` means the driver could not take a crop. Evaluated using computed styles and tabWalk/srWalk data only.

- **Radio group focus diff:** el8 and el9 are `method=computed-only` because the 1×1px clipped inputs are off-screen for diffing purposes. The near-transparent and fully-transparent outline values (`rgba(0,117,222,0.165)` and `rgba(0,0,0,0)`) were read from CSS at element level — confirmed as effectively invisible focus indicators.

- **tabWalk.outlineOrShadow=true for summaries with transparent CSS outlines:** The tabWalk driver checks `computedStyle.outline || computedStyle.boxShadow` at the moment of focus. Chrome's browser-default `<summary>` focus ring appears to be a UA-level painting that registers as non-empty outline at computed style read time even when the authored CSS alpha is 0. Trusted `tabWalk.outlineOrShadow=true` as the authoritative signal for 2.4.7 on summary elements.

- **`forms[]` is empty:** No `<form>` elements on this page. All CTAs are links navigating to signup/contact flows. No forms-on-submit analysis was possible or needed.

- **Billing toggle activation:** `activate.viewChanged=false` and `liveRegionChanged=false` when clicking the Pay yearly radio. The price update JS may require the full Notion app context (not available in the saved page). Marked dynamic-announcement PARTIAL.

## Snapshot fidelity

- **nav dropdown menus (Product, AI, Solutions, Resources):** The four nav buttons expand menus in the live site. In the saved page the menus exist in DOM (`outlineOrShadow:true` and aria states present) but the mega-menu flyout panels were not exercised. Focus cannot enter the menu content in this snapshot.

- **"Recommended" badge background:** axe reports the badge background as `rgb(255,255,255)` but the Business plan card has a light blue tint background. Pixel contrast check confirmed `4.19:1` (quantized), computed as `4.03:1` via exact math on the reported color values. REPRODUCED.

## Ambiguities

- **`rgba(0,0,0,0.54)` 'help center' / muted text contrast:** Exact WCAG ratio depends on background compositing. Computed as ~4.48:1 on white — 0.02 below the 4.5:1 threshold. Within measurement rounding margin (±0.1). Reported as borderline REPRODUCED; should be verified with pixel sampling in a full audit.

- **Multiple "Get started" links:** Judged as 2.4.4 REPRODUCED (same name, same href, no aria-label). The heading context is in a sibling article, not an ancestor of the link — so "programmatically determinable context" exception does not apply cleanly.
