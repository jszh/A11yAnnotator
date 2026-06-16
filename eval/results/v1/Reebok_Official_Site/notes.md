# Evaluation notes — Reebok_Official_Site

## Shot quality issues
- Many footer shots (el2, el17, el19, el20, el21) and several header shots (el7) are very dark / near-black — the driver cropped the element region but the rendered background was dark or behind content. Contrast and focus-ring confirmation from these shots is not possible.
- el16.png and el16_focus.png are both entirely black — the 'Join' button shot did not capture visible content. Focus diff yields visibleDiffPct:0 but this is a shot-framing issue, not necessarily a true absence of indicator (computedOutline:auto 5px is present).
- el5.png and el5_focus.png both show partial header area with 'Skip to content' text rather than the logo link bounding box — diff is 0% but element likely has the standard browser :focus-visible ring due to computedOutline:auto 5px.
- el14.png shows the hero announcement overlay text rather than the carousel image below it — useful for documenting the contrast failures but does not show the img element itself.

## Off-screen tab stops
- Stops [3]–[6] and [9]–[12] are off-screen (inViewport:false) in the global tabWalk — these are 'Skip to content' links and 'SHOP THE EVENT' links inside announcement bar carousel slides that are duplicated (2 sets of 4 slides each). These stops have outlineOrShadow:true so they are not 2.4.11 violations per se, but the duplication of 8 off-screen stops before reaching the main page nav is worth noting.

## Tab walk cap
- Global tabWalk capped at maxTab:50. The walk exhausted itself inside the expanded 'NEW' nav mega-menu sub-links after stop ~16 (logo link). Cart link (tabIndex ~25), SALE (index ~22), SPORT (index ~20) were not reached. The local tab walk for each of these also exhausted itself walking through the same expanded flyout. This is the root cause of the keyboard-operability and focus-management reproductions for el6, el8, el10.

## Accessibe widget
- div[24] (.acsb-trigger) has box h=0 in both collect.json and verify — rendered at zero height. It does appear in the tab walk (localTabWalk reached it). No screenshot was generated for it.

## Hidden input flagged by axe
- axe 'label' and 'region' both flag `<input style="width:0px;height:0px;opacity:0;position:absolute;bottom:0px;right:0px;z-index:-1">` — this is a zero-size hidden input with no label. It is explicitly hidden (opacity:0, z-index:-1, 0×0px) and effectively aria-hidden by obscurity. Not included as a sampled element since it is not visible or operable. Axe's label violation here is a false positive for the element's intended use (honeypot/hidden).

## CART nav landmark
- nav[aria-label='CART'] has h=0 in the snapshot (the cart panel is closed). This is a dynamic region that expands when the cart link is activated. Assessed in the closed state.

## Driver forms probe
- 4 forms detected. Forms [0]–[2] have 0 fields — likely cookie/modal forms or hidden forms. Form [3] (footer newsletter) has 1 field. nativeValidationOnly:true across all forms.

## Heading duplication
- The heading tree in collect.json shows a large block of H2 headings for repeated product cards: 'Workout Plus Shoes' ×3, 'DMX Series 3000 Shoes' ×8, 'Angel Reese 1 Basketball Shoes' ×2. These appear to be product cards in recommendation carousels — using H2 for product names in carousels creates a cluttered, flat outline that would be disorienting in heading navigation. This is a best-practice concern (2.4.6 descriptiveness) beyond the empty h4 and heading-skip violations already reproduced.
