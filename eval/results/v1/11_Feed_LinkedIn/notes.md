# Evaluation Notes — 11_Feed_LinkedIn

## Driver problems
- drive.json `problems[]` lists 14 "recovered (reloaded) before N" entries (elements 1, 2, 4, 5, 6, 8, 9, 11, 12, 14, 15, 16, 18, 19). The driver frequently had to reload the page before probing each element — this is a page-stability/navigation-suppression issue. Results appear valid (all elements were eventually reached), but re-activating elements caused repeated reloads that may have prevented full state observation.

## Screenshot crop artifacts (zero-diff focus shots)
- **el8 / el9** (video player Playback speed / Unmute buttons): Both `el8.png` and `el8_focus.png` are entirely black — the video was paused on a black frame at capture time. The `visibleDiffPct=0` is a black-on-black crop artifact, not evidence of missing indicator. The computed box-shadow (white glow) and driver `outlineOrShadow=true` suggest an indicator exists, but visual confirmation is impossible from these shots.
- **el12** (1 comment button, 71x18px): Both shots are very dark. `visibleDiffPct=0` but `outlineOrShadow=true` in localTabWalk. Crop may be capturing a dark portion of the post engagement bar.
- **el16, el18, el19** (puzzle link, footer About/Ad Choices links): `visibleDiffPct=0` but `outlineOrShadow=true` and `computedOutline=auto 1px rgb(0,95,204)`. The crop appears to capture adjacent content rather than the element's own boundary, so the 1px blue outline falls outside the cropped region. NOT a genuine focus-visibility failure.

## Off-screen tab stop
- `tabWalk` shows 1 off-screen stop: Volume slider (`slider, Volume, orientated horizontally`) — `inViewport:false`. This element appears in the video player controls and is functionally off-screen (hidden volume slider). It is reachable by keyboard but the user cannot see it. This is a potential 2.4.11 (Focus Not Obscured, WCAG 2.2 AA) issue — not captured in the sampled 21 elements but noted here.

## Axe label-content-name-mismatch (16 nodes — not individually sampled)
- Reactions buttons (e.g., "Savvas Petridis and 51 others", "207 others"): aria-label names only the top reactors but the visible text is the reaction count number. The visible text is NOT part of the accessible name — this is a WCAG 2.5.3 Label in Name failure for these button types. These were not individually sampled but the axe finding covers 16 nodes across the feed.
- Article link elements: aria-label encodes the full article headline but visible text is truncated. Same 2.5.3 pattern.

## Axe target-size (2 sampled nodes)
- Two "see more" buttons in post descriptions flagged by axe target-size. Not individually in the 21 sampled elements but confirms the pattern seen in el12 (comment button) and el15 (info icon).

## Heading structure anomaly
- The h1 "feed updates" appears third in DOM order (after h2 and h3 in the sidebar). This is an unusual structural choice — assistive technology users doing heading navigation will encounter "0 notifications total" (h2) and "Ajit Mallavarapu" (h3) before the main h1. The repeated h2 "Skip to LinkedIn News" headings (7+ instances) appear to be skip-link headings embedded in each feed post, which pollutes the heading outline.

## Snapshot fidelity
- `noscript:false`, `scriptsDisabled:false` — full scripted mode. JS ran but the saved page did not fully hydrate dynamic content (many activate calls returned `vsrAnnouncement='document'` without specific state changes), suggesting navigation suppression prevented full interaction loops.
- No forms found on the page (`forms:[]`) — no form error testing applicable.
