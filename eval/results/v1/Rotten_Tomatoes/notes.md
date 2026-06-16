# Evaluation notes — Rotten_Tomatoes

## Driver / collector issues

- **Ad-unit iframe keyboard trap blocks global tabWalk.** `tabWalk.trapDetected=true`, count=4. After the skip link (stop 1), Tab enters an `<ad-unit>` iframe and cycles there indefinitely. The global walk never reaches the header nav links (El1/El2/El5, targetIndex 10–12) or any content beyond stop 4. `localTabWalk` correctly works around this for individual elements by starting 5 focusables before the target, so per-element reachability is tested accurately. This trap is itself a 2.1.2 finding.

- **El1/El2/El5/El3 focus shots missing.** These elements could not be reached by real keyboard during the global walk (trapped) or by localTabWalk (stopsToReach=-1 for indexes 10–12; El3 skip link is at index 0, before all others). focusIndicator method=computed-only for these four elements; no focusShot produced.

- **El3 computed-only focusIndicator inaccurate.** The driver's computed-only check reported outline="none" for the skip link, but `verify-finding --eval el.focus()` confirmed the link expands to 178×42px with `outlineStyle:auto` on keyboard focus. The computed-only check evaluated unfocused state. True focus visibility is NOT REPRODUCED (the skip link correctly reveals on focus).

- **diffPct=0 on 9 elements despite outline:auto.** El9, El10, El12, El13, El16, El17, El18, El19 all have `focusIndicator.present=true`, `visibleDiffPct=0`, `computedOutline=auto 1px`. The browser-default focus ring renders 1–2px outside the element's bounding box; the crop captures only the element's exact box, missing the ring. These are all marked PARTIAL for focus-visibility. The outline:auto evidence indicates rings are likely present per 2.4.7.

- **El8 inTree=false.** media-info-tile at x=1323 (off-screen right), `inTree=false`. AX tree correctly prunes it as presentational. Not an issue.

- **El14 box x=3237.** Off-screen right carousel tile (rt-text element showing "W."). Element will be in-viewport when user scrolls the carousel; contrast issue applies to all in-carousel instances of this text style.

- **El17 collector contrast discrepancy.** Collector computed contrastSolid=3.24 (color=rgb(117,122,132), effBg=rgb(42,44,50)) but this was incorrect because the element's own `background` is `rgba(0,0,0,0)` — the collector picked up an ancestor's bg incorrectly. Pixel contrast gives 14.06:1. Used pixel result; marked NOT REPRODUCED.

- **forms[] is empty.** No `<form>` elements with required fields detected. No error-identification probe ran. Consistent with a content page with no forms in viewport.

- **El6 "Trending on RT" pixel worst=1.12:1.** The extreme worst-case is over very bright image areas in the carousel. The `worstOverBackground` result reflects the minimum across all background colours sampled, which includes near-white image highlights. The average contrast (3.63:1) and the worst-case both fail the 4.5:1 threshold.

- **El4 srWalk speech='navigation bar'.** The search input's srWalk targetSpeech was captured as 'navigation bar' rather than the field's own speech — the SR cursor landed on a parent landmark. The field itself is confirmed adequate via axRole=textbox, axName='Search'.

## Snapshot fidelity

- Page hydrates fully with JS (noscript=false). Scripts run correctly — the skip link reveal-on-focus CSS is active. Ad iframe content loads and accepts focus as expected in the saved snapshot.

## Coverage gaps

- **128 unnamed button nodes** (axe button-name): carousel prev/next buttons and ~126 play-button shadow-DOM `<button class="wrap">` elements with unnamed icon-only buttons. These were not sampled as individual elements but the axe finding is page-wide and critical (4.1.2). The outer `<play-button>` custom element carries the aria-label but the inner `<button>` in shadow DOM does not — this is the source of the button-name axe violation.
- **119 aria-prohibited-attr nodes**: custom elements (rt-link, play-button) use aria-label on non-interactive host elements. The inner shadow-DOM `<button>` lacks the label propagation.
- **42 color-contrast axe nodes**: includes header nav links, masthead buttons, and various content elements beyond the 5 sampled. The white-on-red contrast issue (El1/El2/El5) likely affects all header nav items.
- **Social media icon links** (axe target-size): Facebook, X, Instagram, TikTok, Bluesky social links at 14px size — all below 24px target size minimum. Not sampled as individual elements.
- **Carousel prev/next buttons** (button-name, critical): `<button slot="btnPrev">` and `<button slot="btnNext">` have no accessible names. Not individually sampled.
