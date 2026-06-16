# Evaluation notes — boohooman_new_season

## Collector artefacts

- **contrastSolid=1 for els 5 and 6 (KLARNA, DOWNLOAD THE APP links):** The collector's `color` and `effBg` fields both resolved to `rgb(0,0,0)` for these elements because the computed `color` was inherited from an ancestor (`color:inherit`) while the actual text colour is set via an inline `style="color: rgb(255, 255, 255)"` on a deeper child `<div>` — not on the `<a>` element itself. Pixel contrast sampling confirmed the real ratio is ~18.43:1 (white text on black). Overridden in results: NOT REPRODUCED.

- **el3 collect.json shows axRole=generic, axName='' :** The sampled XPath in collect.json resolved to an element that the AX tree reported as generic/unnamed, but direct DOM evaluation shows the `<a>` at that XPath has `aria-label="View product Oversized Grunge Varsity Mesh Raglan Sport T-Shirt"` and `tabIndex=0`. Likely a timing/serialisation artefact in the collector. Treated as adequate name.

- **focusIndicator.indicatorPresent=true but visibleDiffPct=0 for several elements:** Occurs for el2 (product card link 300×639px) and el3 (22px colour swatch). For el2 the shots are visually identical. This appears to be a threshold/algorithm artefact in the diff engine. Both cases recorded as PARTIAL rather than REPRODUCED since shot evidence is inconclusive.

- **el20 (Maestro payment icon): box w=0, h=36** — image loaded as zero-width. Likely a lazy-load or missing asset in the saved snapshot. Alt text still present in DOM.

## Driver / coverage gaps

- **tab-walk cap reached at 50 stops:** The page has many more focusables beyond the product grid. Elements at el3/el4 (xpath el4 in collect — zero-size filter panel div) and elements deep in the footer were not reached by the global tab walk. localTabWalk was NULL for el3 in drive (the generic non-interactive div, expected), and for el4 (zero-size). Product card links in the lower grid (y > 4700) had localTabWalk performed but no focus shots.

- **Footer elements (y > 7800):** Facebook link, family-of-brands link, Investor Relations link all have method='computed-only' or blank focus shots. Focus indicators for these cannot be visually confirmed from the driver output.

- **srWalk for el9 (search textbox) reports targetSpeech='form'** — SR cursor landed on the form container rather than the textbox itself. Minor SR walk scoping issue; does not indicate a defect.

## Other observations

- **33 lists with list-style:none and no role='list':** This is a large-scale 1.3.1/VoiceOver issue. The primary navigation `<ul>` inside `<nav>` has 240 `<li>` items and list-style:none without role='list'. The product grid lists, filter lists, footer columns, and social icon rows are all affected.

- **Newsletter email input (`data-test-id="subscription-email-input"`):** Not wrapped in a `<form>` element — only a bare `<div>` parent. The forms probe therefore did not capture it (forms probe detected 2 fields: the search textbox + a hidden `type=file` input). The email input is labelled by placeholder only.

- **Forms probe result:** `fields=2, hasRequired=false, nativeValidationOnly=true, alertAppeared=false, errorAnnouncedLive=false`. The probed form is the search form (not the newsletter form). The search form uses native browser validation only — no custom error announcement.

- **Accessibility toolbar (INDshortcutBtn):** Three buttons at tabindex=1 (tabindex>0 axe violation) that appear off-screen in the tab walk (inViewport=false). These are third-party widget buttons; the 'Accessibility' trigger button (stop [3]) has no visible focus indicator.
