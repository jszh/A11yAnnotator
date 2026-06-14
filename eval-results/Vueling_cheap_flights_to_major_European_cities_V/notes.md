# Evaluation notes — Vueling cheap flights page

## Collector / driver observations

- `collect.json`: 21 elements sampled, 0 collector problems. `collectedAt` is null (minor).
- `drive.json`: 21 elements driven, 0 driver problems. `vsr:true`, `scriptsDisabled:false`. tabWalk capped at 50 stops (maxTab:50).

## Screenshot quality issues

- Most element shots are very small crops (element bounding box only) — many show only a few pixels of the header's dark blue background or a partial letter. Focus-diff comparisons for el4, el5, el6, el8, el10, el12, el13, el14, el16, el18, el20 all show `visibleDiffPct:0` despite `indicatorPresent:true`. This is likely because the crop area for these elements falls entirely within a uniform-color region (dark blue header background, or large black text area) where the white outline + dark shadow is rendered but the quantized crop shows no diff. Focus verdicts for these elements are PARTIAL rather than definitive.
- el17 (carousel button 1) was the only element with a non-zero `visibleDiffPct` (3.38%) — focus ring confirmed visually.
- el17_focus.png shows a white square appearing at the bottom of the circular dot — this is the genuine focus indicator.

## Logical / structural notes

- **Skip link in French**: The skip link text is "Aller au contenu principal" on an English-language page (lang="en"). The href also points to `https://www.vueling.com/#main-content` (absolute URL with the production domain, not a fragment anchor on the saved page) — meaning the skip link would navigate away from the saved page rather than scrolling to main content. Not sampled as an element but noted.
- **Logo link zero-width**: The Vueling logo `<a>` has `getBoundingClientRect().width = 0` in both the collect and driver runs. The visual logo is rendered via a child SVG element at different coordinates. The `<a>` wrapper collapses to zero width. Focus lands on this element (inViewport:false in tabWalk).
- **"Search Search" in tabWalk for VIEW OFFER buttons**: During the tabWalk run, two "VIEW OFFER" promo buttons showed `speech:'button, Search Search'` rather than their correct labels. This is likely a timing artifact — the carousel was rotating during the tabWalk and the search widget's aria-labelled text bled into the button name capture. Direct DOM verification showed the promo buttons have correct aria-labelledby pointing to 'VIEW OFFER' / 'View offer'. Not treated as a definite issue.
- **forms[] is empty**: No `<form>` elements were detected by the driver for the error-on-submit probe. The flight search form uses Angular CDK without a native `<form>` tag, so the forms probe could not exercise error handling.
- **Nav landmark i18n keys**: Both `<nav aria-label="ds.header.main_menu.main_menu">` elements use an untranslated Angular i18n key as the accessible name. This is a real issue — AT users hear the key string, not a meaningful label.
- **Carousel control button (prev/next)**: The `.vy-carousel_control--button` button found in axe (`button-name` critical) is not in the 21 sampled elements but appears in the global tabWalk as `speech:'button'` with no name. Included in the summary issues.
- **Cookie panel headings**: The cookie consent panel (OneTrust) introduces h3 and h4 headings that duplicate at both h3 and h4 levels ('Your Privacy', 'Technical cookies', etc.) within the same panel. This is a heading-order structural concern but within the third-party consent layer.
- **meta-viewport user-scalable=no**: axe flags this as a critical violation (wcag2aa, wcag144 = 1.4.4). Added to page-level reflow issues.
