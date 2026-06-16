# GrazeMate — Evaluation Notes

## Driver / Collector issues
- `appearanceShot` was populated for only 3 elements (el17, el18, el20) — elements where `appearanceOffScreen=false`. All others had empty `appearanceShot` paths. This is expected: the driver only saves shots for in-viewport elements.
- `focusShot` was null for ALL 21 elements. All focusable elements were off-screen when the driver attempted to capture focus shots (method=computed-only for all). No real-tab-diff comparisons were possible; all focus-visibility verdicts rely on computed outline + CSS analysis.
- el17.png shows a very dark textured background — the LinkedIn element. Shot is usable but dark.
- el18.png shows "AI DRONES FOR CATTLE MAN" text overlay on a dark image — this appears to be a broader page section crop, not specifically the phone number element alone. The phone number element appears to be below the el18 crop area. Shot may have been captured at a different scroll position.
- el20.png shows a sky/cloud background — appears to be a background image crop near the subscribe heading, not the heading text itself.

## Snapshot fidelity
- Page has two duplicate header structures: a primary header (div[1]) and a sticky/clone header (div[2]). The second header's nav items are off-screen ghost stops (stops 7-12 in tabWalk, inViewport:false). This creates 6 duplicate off-screen focusable ghost stops.
- 15 carousel swiper slides are all tab-reachable: 2 off-screen (off to the left in x) and 13 reported inViewport:true by tabWalk (though their actual x positions range from -1145 to +positive values in collect.json, suggesting the carousel may have scrolled during the walk).

## Ambiguities
- Element [5] (header nav "What GrazeMate Does") has `appearanceOffScreen=true` in drive.json, but collect.json shows box.y=31 (in viewport). The driver appears to have sampled the second header instance (which is off-screen) rather than the first (visible) one. Pixel-contrast results for this element are unreliable (estimator returned grey crop, not the actual text).
- The CSS `:focus` rule `outline: none !important` is global and removes all outlines. However a separate rule sets `border-color: var(--verdaagro-header-font-color); border-width: 0px 0px 1px` on `:focus/:active` for inputs and textareas. This bottom-border indicator for form fields could not be visually confirmed (all form fields off-screen, no focusShots). Marked PARTIAL for form inputs.
- The `wgl-infobox_subtitle` elements ("01", "02", "03", "04") had axe color-contrast flags. Pixel contrast for "01" returned contrastTextVsBg=2.75 — the text is 20px (large text, 3:1 threshold). 2.75:1 fails even for large text. These elements were not in the sampled 21 elements list, so they're noted here for follow-up.
- The "Send an Email" / "Call Us Daily" button links in the contact info section had pixel contrast of ~3:1 at 16px bold (which is large text at 14px+ bold, so 3:1 threshold applies). 3:1 is at the boundary — these are borderline passes, not clear failures.
- The footer subscribe form's email input (tab stop 47, speech: "textbox, not invalid, placeholder Get news & updates, required") has only placeholder as its accessible name — this is a 3.3.2/4.1.2 violation not captured in the 21 sampled elements but flagged in summary issues.

## Page-level observations not in sampled elements
- Search form submit buttons (2 instances) have no text/aria-label — button-name violations.
- The `<ul id='menu-grazemate-menu'>` list violation: the ul contains `<div>` direct children (the lavalamp animation elements) alongside `<li>` elements — technically invalid HTML structure per WCAG 1.3.1.
- 3 `<h1>` elements on a single page (though WCAG does not prohibit multiple H1s; it's an axe best-practice only).
- `maximum-scale=1` in viewport meta disables pinch-zoom — this is a 1.4.4 Resize Text violation per axe meta-viewport (critical).
