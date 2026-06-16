# Eval notes — Reacher (index 34)

## Appearance shots — nav link crop artifact
- `el1.png`, `el2.png`, `el6.png`, `el9.png`, `el13.png` all appear blank/white.
  - Root cause: the sticky nav container (`div.framer-r5ccev-container`, `position:fixed, y=-1`) sits just 1px above the viewport top edge. The crop at `y=-1, h=58` produces a region mostly above the rendered viewport, yielding blank screenshots.
  - The `visibleDiffPct=0` for those nav links is a consequence of the same blank-crop artifact, NOT evidence of missing focus indicators.
  - Resolution: tabWalk `outlineOrShadow=True` for all nav stops, and the Blog link (`el4_focus.png`) directly confirms the browser-default blue outline ring on an identically-styled nav link. Focus indicators are present.

## Hero text span elements (El14–El16, El18–El19 in drive = el15–el17, el19–el20 shots)
- Elements 14, 15, 16, 18, 19 are sub-character `<span>` nodes inside animated 64px hero heading text.
- All shots appear as narrow white slivers (w=14–35px, h=71px) — expected; these are single-character crops from large animated text.
- None are interactive; sampled as non-interactive static elements. No issues found.

## "Start your free trial*" contrast — false positive from computed color
- `collect.json` reports `color: rgb(0,0,238)` on `effBg: rgb(53,89,233)` = 1.68:1 for El9 and El13.
- Pixel-contrast analysis (`--pixel-contrast`) reveals actual rendered text is `[240,240,240]` (light gray/white) on `[48,80,224]` (blue) = **5.5:1** — passes 1.4.3.
- The `rgb(0,0,238)` was the browser UA default link color, not the real Framer-styled text color. This was a confirmed false positive from the static collector.

## h4 "Retain" contrast computation
- Computed `color: rgba(53,89,233,0.59)` on `background-color: rgb(241,245,253)`.
- Alpha-composited manually: `rgb(130,152,241)` on `rgb(241,245,253)` = **2.49:1** (below 3:1 large-text threshold). Confirmed via Python calculation.

## Tab widget keyboard non-operability
- The three Framer-generated tab buttons (Outreach/Retain/Optimize) use `tabindex=0` on `<div>` with no ARIA role, no `aria-selected`, no `aria-controls`.
- Driver confirmed: `respondedToEnter=False`, `respondedToSpace=False`, `respondedToKeyboard=False`.
- These are interactive controls that cannot be activated by keyboard — a compound 2.1.1 + 4.1.2 + 4.1.3 failure.

## Focus indicators — "computed-only" method for El2, El6, El10
- Three elements have `method=computed-only, focusShot=null`: the driver couldn't reach them for real-keyboard diff.
- El2 (Retain tab) and El6 (Outreach tab) are at y=752 — within main viewport; the computed-only result is likely due to the tab position during the driver's local tab walk. Focus visibility for these is PARTIAL.
- El10 (Rated 4.9/5 link) is at y=642 — also in viewport; similarly PARTIAL.

## Off-screen tabWalk stops
- Stop 12 (`inViewport=False`): a testimonial carousel item link (ul/li in a carousel, likely partially scrolled off). Not a sampled element, noted as 2.4.11 risk but not assessed per-element.
- Stop 31 (`inViewport=False`): a "Start your free trial*" link inside a features section (div[7]) — likely rendered with `opacity:0` or off-screen animation state. Same note.

## No forms on page
- `drive.forms=[]` — page has no `<form>` elements. forms-instructions-errors skill is N/A for all elements.

## Reading order — fixed nav DOM position
- Confirmed: `div.framer-r5ccev-container` is DOM child index 2 of the root Framer wrapper, AFTER `div.framer-jx0221` (main content with 9 sections). No skip link exists. All 50 tab walk stops traverse content before nav — structural finding, not ambiguous.

## Heading hierarchy
- Page starts with `H2` (no preceding H1). First H1 appears at heading index 9 ("Trusted by top brands"). H5/H4 appear at indices 3-5 without a parent H3/H2 context within that widget. Multiple H1s appear mid-page. Axe `heading-order` flags two concrete instances. The hierarchy is decorative/presentational in the Framer build, not semantic.

## listStyleNone
- One `<ul>` with `list-style:none` and no `role="list"` found (testimonial carousel, 12 items). VoiceOver/Safari strips list semantics. Chrome/axe does not flag this — WebKit-only risk.
