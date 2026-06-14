# Temu evaluation notes

## Collector / driver issues

- `collectedAt` is null in collect.json (minor collector metadata gap, doesn't affect data).
- Many appearance shots show only the red header background (solid red rectangle) because the element's crop falls entirely within the red navbar area. Affected: el3, el11, el12, el13, el16, el17, el18. This makes visual focus confirmation PARTIAL for those elements. Computed outlines were used as the fallback.
- el19 (Google Play link) and el20 (Terms of use link) appearance shots show product card content rather than the footer area — likely a viewport scroll positioning issue; the shots were taken without scrolling to the element's position (y=4533, y=4880). Focus confirmation is PARTIAL for these.
- el21 (Twitter icon link) shot shows a nearly black rectangle — lazy-loaded image didn't render in the screenshot. Contrast check for the icon itself is inconclusive.
- el10 ('13K+sold' span) has box 1×1px — rendered as essentially invisible. Not a driver error; the element itself is collapsed.
- el5 (skip-nav element) has no appearance shot (element is at x=-9999999, y=-9999999).
- Focus diff algorithm marked el1, el2, el9, el11, el12, el19, el20, el21 as `indicatorPresent:true` despite `visibleDiffPct:0` — this appears to be because the driver detects a computed outline and falls back to indicating presence; the diffPct=0 means the pixel diff didn't confirm it visually. Treated as PARTIAL for those elements unless shot evidence was available.
- el1_focus.png and el1.png both show the same flag-like image strip (green/red/white) — no visible focus ring in the crop.
- el8 (product image link): tabWalk records `outlineOrShadow:false` and both el8.png / el8_focus.png are identical product card images — confirms no focus ring. REPRODUCED.
- el16 (search input): tabWalk records `outlineOrShadow:false`; el16.png and el16_focus.png are identical red rectangles; computedOutline is 'none 0px'. REPRODUCED.

## Snapshot fidelity gaps

- Many custom div[role=button] elements did not respond to keyboard Enter/Space in the driver (keyboard.respondedToEnter=false). This may be because JS click handlers for navigation/cart actions cannot fire on the saved page (network-blocked). However, the structural issue (no native element, custom role) remains a valid 2.1.1 concern regardless.
- Categories button did not expand its menu in the driver (activate.expandedChanged=null). Dynamic announcement and focus-management for the dropdown are PARTIAL.
- The tab widget (category tabs row) is rendered with tabindex=-1 on non-selected tabs, with arrow key navigation expected — but arrowKeys.respondsToArrows=false in the driver (possibly JS-dependent). Tab keyboard operability is REPRODUCED; arrow key confirmation is PARTIAL.

## Axe-flagged items outside sampled elements

- `aria-command-name` (serious): Two additional role=button elements not in the sample set — #bg-chat-entry (Messages floating button, no name) and ._2e0jpr6E (Feedback floating button, no name). Included in summary issues.
- `color-contrast` (serious): ~20+ orange price spans (`rgb(251,119,1)` on white) flagged by axe but have `aria-hidden:true` — these are presentational price displays where the accessible price is elsewhere. The aria-hidden attribute may exempt them from 1.4.3 if hidden from AT, but the sighted user sees low-contrast text.
- `label-content-name-mismatch` (2.5.3): BONUS COUPONS floating button — aria-label matches visible text but visible text is rendered twice (CSS duplication artifact).
- `target-size`: 15 BillboardTag tooltip buttons at 12×12px or smaller, well below 24px minimum. These are "i" info buttons on product price tags.
- `region`: Two elements flagged as outside landmarks — a floating div and the sidebar filter list.
- `list`: ul._1Gb2wLJQ contains a DIV child alongside LI children — malformed list (1.3.1).
- `page-has-heading-one`: H1 exists but has `visibility:hidden` — the axe rule fires because the visible heading-one is hidden. Best-practice note (not a WCAG SC failure).
- `landmark-unique`: nav and ._33LMUpZn region without distinguishing labels.
