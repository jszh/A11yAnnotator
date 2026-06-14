# Reddit evaluation — collector/driver notes

## Focus shot quality issues (multiple elements)
- **el1, el10, el17** — focus shots exist but visibleDiffPct=0 and both unfocused/focused shots are near-black thumbnails (very small crops). Cannot visually distinguish the 1px auto outline from background. All overridden to 2.4.7 REPRODUCED.
- **el3** (Collapse Navigation) — focus shot (el3_focus.png) captures a different, nearly black viewport region — the page scrolled during the diff. diffPct=4.65 likely reflects layout shift not a focus ring. PARTIAL verdict used.
- **el9** (copyright link) — focus shot captures nav links "News/Explore" — completely different page region. Viewport scrolled during focus capture. PARTIAL verdict.
- **el19** (r/DnD link) — diffPct=0; both shots show same community list rows with no visible ring change. Overridden to REPRODUCED.

## Elements with computed-only focus indicator and no focus shot despite reachedByTab=True
- **el16** (r/videos) — reachedByTab=true but method=computed-only, focusShot=null. The diff did not execute even though the element was reached. Could be a driver timing issue. Verdict left as PARTIAL.

## Appearance shot viewport mismatches
- **el12** appearance shot shows post action bar; **el13** shows post body text; **el14** shows Microsoft ad unit; **el15** shows post body text excerpt; **el18** shows carousel card image; **el20** shows face crop from background image. The driver captures the viewport at the time of the element walk, which can differ from the element's actual on-screen position for off-viewport elements.

## Ghost tab stops at search bar
- `reddit-search-large` custom element generates 2 Tab stops (indices 2 and 3 in the global tabWalk) both with `outlineOrShadow=false` and `speech='link, Home'` (stale SR announcement from prior stop). These appear to be focus events consumed internally by the web component's shadow DOM without surfacing a visible or correctly-announced focus state.

## Keyboard trap (shreddit-post)
- `tabWalk.trapDetected=true`: after stop 21 (post text body link), stops 22-24 all resolve to `article[1]/shreddit-post[1]` in an apparent cycle. The shreddit-post custom element holds Tab focus internally without releasing, making all subsequent focusable elements (post links in articles 2-3, Popular Communities sidebar links below the trap) unreachable by keyboard.

## Search form validation
- `drive.forms[0]`: 1 field, nativeValidationOnly=true, alertAppeared=false, errorAnnouncedLive=false, ariaInvalidSet=false. The search form submits but only relies on browser native validation. No custom error identification.

## axe violations not in sampled elements
- `aria-allowed-attr` + `aria-valid-attr-value`: two `shreddit-progress-bar` elements with `aria-valuemax="0:15"` / `"0:08"` (time format strings, not numeric). These video player progress bars are critical axe failures (4.1.2) but were not sampled — not in results.json element list. Noted here.
- `nested-interactive`: `<span role="button">` inside shreddit-gallery-carousel (the carousel next arrow) — not sampled but flagged by axe.
- `link-name`: 3 unnamed ad links (absolute-positioned `<a>` elements for ad click tracking with no text/aria-label). These are 1.1.1/4.1.2 failures but not in the sampled set.

## SR walk anomaly (el18)
- `srWalk.targetSpeech='list'` for el18 (r/NoStupidQuestions link). The SR cursor positioned itself on the `<ul>` container rather than the `<a>` link element when using `/sr-order` walk targeting that xpath. Likely the SR cursor resolves to the list node in this broken list structure.

## Hover data incomplete
- el3 and el7 have `hover={}` (empty object) — the driver did not exercise hover on `rpl-tooltip`-wrapped elements. Tooltip text exists in DOM ("Open navigation", "Open settings menu") but 1.4.13 three-conditions could not be verified.
