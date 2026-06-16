# Evaluation Notes — Blue Apron (noscript)

## Screenshot quality
- Most appearance shots (el1–el6, el21) are blank/near-white — elements are rendered at
  viewport coordinates but the crop area captures off-page whitespace. Shots el7, el10–el15,
  el19 capture nearby background/image content rather than the target element itself.
- Only el7.png (Blue Apron text on card), el10.png (product card text), el12.png (kitchen photo),
  el14.png (footer orange bg fragment), el15.png (partial product text) show recognizable content.
- Focus shots el1_focus.png, el3_focus.png, el4_focus.png are all blank — elements were off the
  visible crop at the moment of focus capture. visibleDiffPct:0 for all three, so pixel diff
  couldn't detect the outline. Browser-default ring reported via computedOutline:'auto' and
  tabWalk outlineOrShadow:true is used as the fallback.

## Driver / tabWalk behavior
- scriptsDisabled:true / noscriptFlagged:true — JS handlers inert for all activation checks.
  All dynamic-announcement sub-verdicts are PARTIAL.
- tabWalk capped at 50 stops; offScreenStops:42. The vast majority of tab stops are below the
  fold. Focus-visibility visual checks are PARTIAL for all off-screen elements.
- el2 (nav Menu link, targetIndexInFocusables:0): local tab walk cannot position 5 before
  index 0, so localTabWalk.reachedByTab:false. Global tabWalk confirms it IS the first stop
  and shows outlineOrShadow:true. Keyboard-operability and focus-visibility treated as
  NOT REPRODUCED based on global walk.

## axe notes
- axe color-contrast nodes reference CSS selectors that match BOTH nav and footer elements
  sharing the same class names. The nav versions render on white (contrast passes); the footer
  versions render on orange (contrast fails). Axe correctly identified the footer instances.
- The promo banner "Terms & Conditions apply." contrast failure (2.53:1) was NOT in the axe
  color-contrast violations list in collect.json — it was discovered by manual eval. The banner
  element (._1u9me6tz) may have been treated as incomplete by axe due to the dark blue
  background being a gradient or composited layer, but direct eval confirmed solid bg rgb(20,23,81).
- axe button-name shows 12 button violations. Of the sampled elements, el8 and el9 are
  confirmed unnamed Add-to-cart buttons. The logo button (nav button[1]) and disabled
  carousel buttons (._1xn5xoee) are also confirmed unnamed.
- meta-viewport axe violation (maximum-scale=1) implies 1.4.4 Resize Text failure on mobile —
  recorded in page-level page-structure issues (cited as 1.4.4 AA).

## Heading structure
- No h1 on the page (best-practice, not a WCAG SC). Main content starts at h3.
- The h2 "Privacy Preference Center" belongs to the cookie-consent banner (not in main
  content flow), so cannot serve as the missing structure for main content headings.

## Nested-interactive pattern
- Three div[role=button] + inner <button> pairs create 6 tab stops for 3 actions.
  The label-content-name-mismatch is confirmed: "Shop Meal Kits" vs visible "Meal Kits" etc.
  Both 4.1.2 (nested interactive) and 2.5.3 (label-content-name-mismatch) are reproduced.

## Not sampled but notable
- The unnamed logo button (/html/body/main[1]/div[1]/header[1]/nav[1]/button[1]) appears in
  tabWalk with speech:"button" (no name) but was not in the 21 sampled collect.json elements.
  Reported at page level in issues list.
- Disabled carousel buttons (._1xn5xoee) are technically exempt from name requirements when
  disabled, but axe flagged them. Not counted as reproduced failures.
- The screen-reader assistance paragraph at bottom of footer has the worst irony: its text
  fails contrast at 4.35:1 on the orange background.
