# Evaluation notes — Wayfair_com_Online_Home_Store_for_Furniture_Deco

## Driver / collection issues

- **noscript=true**: All `dynamic-announcement` verdicts are PARTIAL. JS app handlers cannot fire; `activate` events complete clicks but state changes (expand/collapse, form validation, live region updates) do not trigger. This is expected per plan.
- **axRole/axName missing in drive.json**: Every element in drive.json has `axRole: undefined` and `axName: null` — the driver does not populate these fields. All role/name data sourced from collect.json instead.
- **box undefined in drive.json**: All `box` fields in drive.json elements are `undefined`. Box coordinates sourced from collect.json only.
- **Appearance shots are often badly cropped**: Many element shots (el1, el2, el3, el13, el15, el16, el18, el20) show large promotional banner/background graphics rather than the target element. Elements at large y-coordinates are not scrolled into view before screenshotting. This affects visual verification of focus rings for deep-page elements — conclusions rely on CSS computed values where shots are uninformative.
- **el6 appearance shot missing**: No shot captured for el6 (off-screen span at x=-8961). Expected given off-screen position.
- **el10 appearance shot missing**: No shot for el10 (button at x=-9999). Expected.
- **el5 focus visibility**: visibleDiffPct=0 yet indicatorPresent=true (from computed box-shadow). Visual inspection of el5.png vs el5_focus.png confirms images are identical — box-shadow on purple background produces no perceptible pixel difference. Overrode driver's indicatorPresent=true to REPRODUCED based on visual evidence.
- **el1 focus visibility**: Same pattern — visibleDiffPct=0, indicatorPresent=true (computed box-shadow), shots cropped to large promotional text. Cannot visually confirm or deny. Marked PARTIAL.

## Snapshot fidelity gaps

- **label-content-name-mismatch (129 nodes)**: Axe reports 129 violations of this WCAG 2.5.3 rule across product listing links — aria-labels contain full product names while visible text shows promotional copy. This is a systemic issue across all carousel product cards. Only the page-level summary issue is recorded; individual cards not separately enumerated.
- **Unnamed button (axe: button-name)**: A small inline button (1em×1em, SVG icon only, no aria-label) exists in the page. Not in the 20 sampled elements but captured by axe. Added as page-level note — maps to element with `.hapmhkf.hapmhkl._6o3atz12h > ._1pmvkjd6._1pmvkjdw._1pmvkjd2`.
- **aria-hidden-focus (axe)**: A `<ul aria-hidden="true">` contains focusable elements (inside `.mtsvz50[data-hb-id="VisuallyHidden"]`). This is a 4.1.2 violation — focusable content inside aria-hidden. Not in the 20 sampled elements.
- **Sitewide banner contrast**: Axe flags `div[data-enzyme-id="SitewideBannerLongText"]` for color-contrast. Pixel-contrast confirms: white text (#F0F0F0) on red/orange background (#F03020), ratio=3.58:1, below the 4.5:1 AA threshold. This element is not in the 20 sampled elements but is a confirmed contrast failure.
- **tabWalk capped at 50 stops**: The global tab walk captured only 50 of the page's many hundreds of interactive elements. Product listing links (carousels) are not reached. The local walk cap (300 stops attempted) also failed to reach el13 at index 315.
- **el7 (span) as tab stop**: A 1×1px `<span>` inside the search form is a tab stop. This is likely a hidden visually-hidden implementation detail. Not a meaningful user issue but adds noise to the tab order.
- **Forms probe**: drive.json forms[] has 2 form records. Form[0] (search, hasRequired=true) and Form[1] (email subscribe, hasRequired=false). Both show nativeValidationOnly=true with no ARIA error identification.
