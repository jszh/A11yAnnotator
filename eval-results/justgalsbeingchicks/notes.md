# Evaluation notes — justgalsbeingchicks

## Driver / collection issues

- **tabWalk trapped in shreddit-player**: The global tabWalk (cap 22) was consumed by the embedded video player (`shreddit-player` custom element). Stops [20]-[22] all land on the same xpath with `outlineOrShadow=False`, and the walk never escaped. This meant many main-feed links and all sidebar disclosure summaries (el13, el14, el17, el19) were not reached by the global walk. LocalTabWalk probes compensated partially for some elements.

- **trapDetected=True**: The `tabWalk.trapDetected` flag is set. Based on the stop sequence the trap is the shreddit-player video component, not a modal or dialog. It is a real 2.1.2 defect.

- **Focus shots missing for most elements**: Only el1, el2, el3, el6, el7, el8, el11, el18 have `_focus.png` shots. All others show `method=computed-only`. Most shots of dark-background elements (el1, el2, el3, el7, el8) show near-black crops — the elements are at the very bottom/periphery of the page or are icon-only controls; the focus indicator (1px auto outline) is not visible in the small crops even where `computedOutline=auto 1px rgb(153,200,255)` is set. This makes the 2.4.7 REPRODUCED verdict evidence-backed by diffPct=0, not a rendering artifact.

- **el6 srWalk targetSpeech anomaly**: `targetSpeech='navigation, Primary'` — the SR cursor landed on the landmark boundary rather than the link itself. The link's speech is confirmed in the `stops[]` array as 'link, Reddit, Inc. © 2026. All rights reserved.'. Not a data error, just srWalk cursor position.

- **el4 skip link localTabWalk reachedByTab=false**: The local walk started from `targetIndexInFocusables=0` but the walk did not wrap around to confirm the skip link was stop [1]. However, the global tabWalk stop [1] is confirmed as `/html/body/a[1]` with `outlineOrShadow=True` and speech='link, Skip to main content'. The element IS reachable; localTabWalk positioning is the issue.

- **el15 flair link**: `reachedByTab=true` in localTabWalk (stopsToReach=17) but `method=computed-only` with no focusShot — the shot was not captured even though the element was reached. Treated as PARTIAL for focus-visibility.

- **axe aria-allowed-attr / aria-valid-attr-value on shreddit-progress-bar**: These are on the video player progress bars (aria-valuemax set to time string "1:32" instead of a number). These elements are not in the sampled set but are relevant to the 2.1.2 video player trap finding — the player component has invalid ARIA that likely contributes to its focus trap behavior.

- **axe label-content-name-mismatch** on author links (`a[aria-label="Author: u/KimJongFunk"]`): The visible text inside these links is the username only, but the aria-label includes "Author: " prefix. WCAG 2.5.3 (Label in Name) requires the visible label text to be part of the accessible name. The visible text 'u/KimJongFunk' IS contained within 'Author: u/KimJongFunk', so this passes 2.5.3. Not a finding.

- **axe link-name on ad overlay links**: Three `shreddit-dynamic-ad-link` elements with unnamed overlay `<a>` elements (role=link, no text). These are not in the sampled elements set. They represent ad-overlay link-name failures (4.1.2) but were not sampled.

- **Reflow check bodyLen=809**: Page rendered minimally at 320px (only 809 chars of body text), suggesting most content is JS-deferred and did not render in the 320px load. The ratio=1.0 result is valid for what rendered; the minimal render means the reflow check is best-effort for the static shell.

## Ambiguities

- **Focus ring visibility at diffPct=0**: For elements with `method=real-tab-diff` and `diffPct=0`, the dark background and tiny crop size (many elements are at y>800 or very small) make it possible that a 1px outline exists but is not captured. The verdict REPRODUCED for 2.4.7 is based on: (a) outlineStyle=none in computed CSS for most links, (b) zero pixel diff in the shot pair, and (c) visual inspection of the shots showing no ring. The Create Post button (el11, diffPct=3.39) is the exception and correctly passes.
