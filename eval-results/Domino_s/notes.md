# Domino's evaluation notes

## Driver / shot fidelity issues

- **el3.png / el3_focus.png (logo link)** — Both driver screenshots appear blank/white despite the element being at x:600, y:12 on the blue nav bar. A separate `verify-finding.js --shot` confirmed the logo renders correctly (red/blue domino icon on blue background). The blank crop is a driver rendering artifact (sticky header positioning at scroll-top may have produced a transparent crop). `visibleDiffPct:0` is therefore unreliable for this element; focus-visibility verdict set to PARTIAL using computed-only evidence.

- **el12.png ($6.99 span)** — Driver crop captured the sticky nav bar ("MENU DEALS") at scroll-top rather than the element at y:752. Wrong region captured.

- **el15.png (Loaded Tots link)** — Driver crop showed bottom edge of a card and footer text rather than the element at y:2123.

- **el16.png (Browse Menu h2)** — Driver crop showed a red "ADD DEAL" button rather than the h2 at y:1927.

- **el18.png (CA Transparency link)** — Driver crop showed bottom edge of a red button rather than the footer link at y:3753.

- **el21.png (p[1] disclaimer)** — Driver crop showed the hero area ("START YOUR ORDER" heading) rather than the disclaimer at y:3073.

- **Multiple below-fold elements** — 9 of 21 elements had `method:computed-only` for focus-visibility because they were off-screen in the drive tab walk. The global tabWalk reached them and reported `outlineOrShadow:true` for most but the focused screenshot comparison was unavailable.

## vsrAnnouncement artifact

- Every activated element (all buttons tested) returned `vsrAnnouncement:"heading, Offer Details, level 2"`. This appears to be a persistent SR state from a prior activation in the same drive session (the "Offer details" button was activated, and its content announcement persisted in the SR log). The vsrAnnouncement value should not be interpreted as element-specific for buttons other than the Offer details button itself.

## Skip link localTabWalk false-negative

- `el0.localTabWalk.reachedByTab:false` is a driver artifact: the skip link is `targetIndexInFocusables:0` (first focusable), so the local walk cannot position 5 stops before it and reach it by tabbing forward. The global `tabWalk.stops[0]` confirms the skip link IS the first Tab stop and is `inViewport:true` when focused (CSS `focus:right:auto` moves it on-screen).

## srWalk targetSpeech for skip link

- `srWalk.targetSpeech:"end of document"` — The SR cursor wrapped around from end-of-document to reach the skip link. The first `isTarget:true` stop was the wrap-point ("end of document"), not the link text. The link itself is correctly voiced as "link, Skip to main content" in the subsequent stop. No real finding here.

## Forms

- `drive.forms:[]` — No `<form>` elements found on the page to drive error-on-submit probes. The page's sign-in and join-now flows are button-triggered overlays (not static forms in the snapshot). No 3.3.1/3.3.3 findings were possible.

## Carousel aria-roledescription

- The axe finding targets `.no-scrollbar` (a `<SECTION>` without aria-label and no explicit role). The separately identified `<DIV role="group" aria-label="Deals" aria-roledescription="carousel">` is correctly formed and is NOT the axe violation target.

## List-style:none count

- `structure.listStyleNone:12` confirmed via `verify-finding.js` eval. These are VoiceOver/Safari-specific — Chrome AX tree still reports list semantics. Filed as 1.3.1 best-practice/REPRODUCED for WebKit AT.

## Offer details button — target size

- box h:16 px < 24 px minimum for WCAG 2.2 SC 2.5.8 (AA). Noted in reflow-and-pointer-affordances evidence but not separately listed in issues since 2.5.8 is WCAG 2.2 and the eval's primary focus is WCAG 2.1 AA unless noted.
