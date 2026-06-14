# Evaluation notes — Southern Airways Express

## Collector / driver issues

- **No appearance shots for many elements**: 12 of 21 elements had `appearanceShot: null` because they were off-screen at page load (below fold or x>viewport). Only shots for el7, el8, el9, el9_focus, el10, el10_focus, el13, el14, el15, el17, el19, el20 were captured.

- **el1 (skip link) localTabWalk miss**: `localTabWalk.reachedByTab=false` with `targetIndexInFocusables=0`, but the global tabWalk correctly shows the skip link at stop index 2. The local walk started after the element (positioning issue when index=0). Classified as PARTIAL for keyboard-operability rather than definitive REPRODUCED.

- **el6 (logo link) and el7 (Manage Flight) — offScreen in local walk**: Both show `appearanceOffScreen=true` in driver but their box coordinates (y≈237) place them in the header which should be in-viewport at page load. Likely a driver scroll state issue.

- **el7 appearance shot (el7.png) is blank/white**: Despite box coordinates placing the link in the visible header, the shot is blank. Fidelity gap in the crop.

- **Contrast data in collect.json was unreliable for elements with transparent backgrounds**: Several nav links showed contrastSolid=1.19:1 (white-on-white assumption) but pixel-contrast confirmed actual dark navy background → 10.34:1. Always run pixel-contrast for `needsPixelContrast=false` elements with `ownBg: rgba(0,0,0,0)` on dark-background pages.

- **el8 color-and-visual-text verdict has a duplicate key**: The `results.json` entry for el8 accidentally has two `verdict` keys in the `color-and-visual-text` skill (one "REPRODUCED" from the analysis note, one "NOT REPRODUCED" from the correction). The intended final verdict is **NOT REPRODUCED** (contrast 11.98:1 passes; only the font size is a concern, not an SC violation).

- **Two access-widget-ui custom elements** appear at the top of the tabWalk (stops 0-1) with `outlineOrShadow=false` — these are AccessiBe widget elements and are outside the sampled set. They precede the skip link in tab order.

- **26 off-screen tabWalk stops**: The carousel/slider items at x>1280 and footer items below y=5000 account for most of the 38 noOutlineStops. The global outline suppression (`a:focus{outline:none}`) applies uniformly across the page.

- **forms[] drive data**: Only the first form (newsletter email, fields=2) had any fields. Three other forms had 0 fields — these are likely the flight booking widget forms (JS-rendered comboboxes, not standard inputs picked up by the form probe).

- **#myTab tablist + aria-required-children**: axe flags `aria-required-children` on `#myTab` and `#myTab3`. The `#myTab` uses `<li>` wrappers with the `role=tab` on the `<a>` inside (not the `<li>`). The `#myTab3` uses `<a role=tab>` as direct children of a `<div role=tablist>` with `aria-controls` pointing to non-existent `map-1-tab` id (the actual target panes have id `map-1-tab-pane`). These are structural ARIA violations.

- **`departReturn` date range input**: Has no label (`id=departReturn`, no `<label for=departReturn>`). axe `label` rule confirmed. This element was not in the sampled 21 elements but is flagged in axe output as a separate defect (same category as el15).

- **Social media links in footer** (Instagram, Twitter, Facebook): All have icon-only `<i class="bi bi-...">` with no text and no aria-label — axe `link-name` flags all three. These are not in the sampled 21 elements.

- **Multiple unnamed modal-trigger links**: axe `link-name` flags numerous `<a data-bs-toggle="modal">` links wrapping images with alt="" and no text. These modal triggers are unnamed links. Not in the 21-element sample but documented in axe output.
