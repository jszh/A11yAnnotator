# Gymshark evaluation notes

## Driver / capture issues

- **Many appearance shots missing**: Only 9 elements produced appearance shots (el6, el7, el8, el9, el12, el17, el18, el19, el20). The other 12 elements have `appearanceShot: null`. This is likely because those elements fall outside the initial viewport or the driver didn't scroll to them before screenshotting.

- **Focus shots with visibleDiffPct=0**: Elements el6 (wishlist icon) and el17 (youtube), el18 (discord) returned `visibleDiffPct=0` on `method=real-tab-diff`. Their focus shots appear blank/white or near-identical to the unfocused shots — the crop area likely captured empty whitespace rather than the element. The computed outline confirms an indicator exists, but visual verification is blocked. Marked PARTIAL for focus-visibility.

- **Off-screen shot rendering**: el17 and el18 shots show partial/truncated content (text fragment "wards d" visible in el18 — appears to be a crop from the "Rewards" section label, not the discord icon). el19 (Apple Pay) and el20 (Pages heading) also rendered as blank/near-blank — footer elements not scrolled into view before crop.

- **el6 (wishlist icon in header)**: Both el6.png and el6_focus.png are blank white — the icon-only link is invisible in the crop (perhaps the SVG icon didn't render in the saved page, or the crop captured adjacent whitespace).

## Static analysis ambiguities

- **Element [0] axRole=button axName='add to wishlist'**: The collect.json sampled the article element but the driver identified it as a button (the 'add to wishlist' second button inside). The first unnamed button (`quick-add_mobile-button__8ATn3` with `icon-bag-plus`) is the real unnamed element. The localTabWalk.reachedByTab=false likely refers to the article-level sampling not matching the actual interactive children.

- **Element [3] and [9]**: Drive.json shows `localTabWalk: null` for both — these are non-interactive elements (paragraph, heading) so no tab walk was attempted. Not an error.

- **Element [12] (Klarna link)**: Drive.json shows all null fields — the driver could not locate this element. Likely because the `section[4]` in the DOM doesn't contain this link at drive time (dynamic rendering). Keyboard/focus skills marked PARTIAL.

- **Add to Bag button not found by text "ADD TO BAG"** in scripted mode: The button text was "Add to bag" (mixed case) at runtime despite collect.json showing "ADD TO BAG  ". This is a CSS `text-transform: uppercase` display difference. The unicode PUA chars in the axName are still a real issue.

## Heading structure complexity

- The heading tree is extremely non-sequential: the page begins with h5s (nav mega-menu subheadings) before the h1. This is because the mega-menu items are `<h5>` elements inside `<nav>`, followed by the product h1. This heading order (h5 → h3 → h1) fails heading-order conventions but the nav h5s are inside dropdown panels that are visually/structurally separate from the main content outline.

## Forms

- `drive.forms[]` is empty — no `<form>` elements were detected/probed. The size selectors use custom combobox role, not native select/form elements, so the forms-probe didn't fire. The broken aria-labelledby on the size dropdowns is captured via axe (aria-input-field-name SERIOUS) and in the summary.

## Snapshot fidelity

- Page is served scripted (adaptiveScripted=true, scriptsDisabled=false). The Add to Bag activation produced no announcement — this may reflect genuine absence of live-region wiring on the frozen snapshot, or it may be that the add-to-cart API call fails on the saved page (no real backend). The static live-region infrastructure IS present but the specific add-to-bag live region mutation did not fire. Filed as REPRODUCED (4.1.3) since the driver confirmed activation occurred with zero announcement.

- The cookie consent dialog ('Your Privacy') appears to be closed (live region shows 'dialog closed'). The cookie banner is not blocking the evaluation.
