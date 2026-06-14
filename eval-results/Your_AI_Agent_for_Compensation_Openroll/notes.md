# Evaluation notes — Your_AI_Agent_for_Compensation_Openroll

## Collector / driver issues

- **Nearly all appearance shots are near-blank.** Most element crops render as white or black strips with no visible content. This is because the Framer-built page uses very small elements (12px nav links, tiny pagination dots) and the crop window captures only a few pixels of a mostly-transparent or off-screen region. The shots are not fidelity failures per se — the driver cropped to the correct bounding box coordinates, but the visual content at those coordinates is minimal (transparent nav over background, dark footer slivers). The el15.png shot (testimonials section) is the only shot with meaningful visible content.

- **el10 (off-screen Book demo) has no appearance shot.** The element bounding box is x=-867 (off-screen left, carousel slide 1). The driver noted `appearanceShot:null`. The pixel-contrast crop for this element incorrectly rendered the logo area instead (the page scrolled/positioned to a different region). Focus diff was method:computed-only for the same reason.

- **el12 focus shot shows wrong content.** The unfocused and focused crops for the footer 'Testimonials' link (el12) both show body text "licia, how c" from the testimonials section in the background rather than the link itself. The crop coordinates appear to have shifted. diffPct=0.01 is noise. Focus ring verdict relies on computedOutline and tabStop outlineOrShadow.

- **el18 (Book a demo, bottom CTA) is computed-only for focus.** Element at y=5597 — the driver reached it by Tab but could not produce a pixel diff (focusShot:null). Verdict PARTIAL on focus-visibility.

- **contrast.json contrastSolid=1.31 for el10 (Book demo)** is a false alarm: the collector sampled the `<a>` element's inherited CSS color (blue, rgb(0,0,238)) rather than the child `<p>` text color (white, rgb(255,255,255)). Actual contrast is 7.18:1. Noted in element evidence.

## Snapshot fidelity

- Page is Framer-generated with multiple SSR variant divs (class `ssr-variant hidden-7ernil hidden-nn75as`). The static snapshot preserves all variants; axe and the driver see them. Multiple carousel slides are present in DOM but 6 of 8 H1s are inside `aria-hidden=true` li elements (not visible to AT).

- The `li[1]` carousel slide has `aria-hidden="false"` but its content renders off-screen (x=-867), creating the 2.4.11 defect. The active slide appears to be a different li (the driver's tabWalk shows `li[2]` and `li[3]` also at inViewport:true for their Book demo links).

- No forms on this page (`forms: []`), no live regions (`liveRegions: []`). Scripts are enabled (`scriptsDisabled:false`).

## Ambiguities

- The `"Login"` div visually looks like a nav item but has no interactive semantics whatsoever in the saved snapshot. It may be a Framer design artifact (an anchor point wrapped elsewhere) or a genuine bug. It has no parent link/button. Reported as 4.1.2 + 2.1.1 REPRODUCED.

- The `support@openroll.` link name is genuinely truncated in both the DOM text and the accessible name — it ends with a period and the domain suffix is missing. The href resolves to `mailto: support@compensara.io` (note: the href also has a spurious space after "mailto:"). Reported as 2.4.4 REPRODUCED.
