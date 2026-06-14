# Evaluation notes — Chicago_Hotels_05_10_05_11_Spirit_Airlines

## Collector/driver issues

- **el1 screenshot mismatch**: The sampled `el1` (View Map button at xpath `.../div[5]/div[1]/div[1]/div[3]/div[1]/button[1]`) captures a different crop than expected — the shot shows the filter panel rather than the button itself. The sampled button is a floating/duplicate View Map instance distinct from the keyboard-reachable one at `.../div[1]/div[1]/button[1]`. No focus shot exists for el1 (element never tabbed to).

- **el8, el10 screenshot mismatch**: Both shots show a tiny slice of "ghbor" text (edge of "Neighborhoods" label) rather than the 32×32px star/rating buttons. The buttons are within the filter panel and the crop position misaligned. Focus comparison was still valid (both shots identical, confirming no ring).

- **el17, el18, el20, el21 screenshot mismatch**: These footer elements (y > 8395) produce shots capturing content from higher up the page rather than the footer itself. The scroll position for cropping did not reach the footer. Focus shots for el17/el18/el19 show same mismatched content.

- **noscript page**: `scriptsDisabled:true` — all activation/keyboard-response verdicts for interactive elements are PARTIAL. This affects el1, el2, el8, el10 (filter buttons), el9 (search input), el12 (Submit), el13 (carousel dots), el14 (confirmation input). Tab-walk, SR-walk, and focus-indicator tests were still operational.

- **el3, el4, el11, el15, el16, el20, el21**: Non-interactive sampled elements — `srWalk.reachedBySR:false` for several. These are text/container nodes; the SR cursor walk started nearby but did not land on the node itself (expected for non-interactive generic elements).

- **axe `page-has-heading-one` false positive**: axe reports missing h1, but `structure.headings` confirms an h1 ("Filter 195 Total Hotels") is present. This is a noscript rendering artifact where axe may see the page before h1 injection. Treated as false positive; h1 is present.

- **Two unnamed logo links in tab walk**: `speech:"link"` at two xpaths (header logo and secondary logo). These correspond to the axe `link-name` and `image-alt` failures. The logo `<img>` elements have `title=""` (empty title) and no non-empty alt, making the parent `<a>` links unnamed. These links were not in the sampled elements list but were caught by axe — flagged here as a note. REPRODUCED at page level per axe (link-name, image-alt critical violations).

## Ambiguities

- **Focus visibility for filter toggle buttons (el8, el10)**: `visibleDiffPct:0` with `indicatorPresent:true` based on `computedOutline:'auto 1px'`. The pixel diff found nothing; visual inspection confirms identical shots. Verdict overridden to REPRODUCED (2.4.7). Multiple buttons of this type throughout the filter panel are likely affected (not just the two sampled).

- **Footer link focus visibility (el17, el18, el19)**: `computedOutline:none 3px rgb(255,255,255)` with `computedBoxShadow:none`. The outline color (white on black footer) would be somewhat visible, but the outline-style is `none`. These links appear to have no focus indicator. Marked PARTIAL due to off-screen shot; classified as likely REPRODUCED.

- **`$173` price button (el2)**: Custom `div[role=button]`. SR speech correctly says "has popup dialog" — the button should open a rate-selection dialog. On noscript page this cannot fire. Keyboard non-response (respondedToKeyboard:false) is expected under noscript. Keyboard operability marked PARTIAL.
