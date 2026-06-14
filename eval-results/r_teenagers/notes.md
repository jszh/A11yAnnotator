# Evaluation notes — r_teenagers

## Driver / capture issues

- **trapDetected:True but no trapEl** — The tabWalk reported a trap but `trapEl` was not populated. Examining the 26 stops reveals repeated xpaths: the `community-highlight-carousel` element appears twice, `shreddit-async-loader/reddit-skip-to-sidebar` appears twice, and the Flair link appears 3–4 times. This looks like duplicate Web Component shadow DOM registration rather than a true keyboard trap. The global walk stopped at 26/50 stops. The driver cap may have been hit but tabWalk.count shows 26 while maxTab is 50, so stops were not capped — the repetition caused the trap detection heuristic to fire. NOT a 2.1.2 trap in the classical sense; flagged as a fidelity ambiguity.

- **No focusShot for elements 14, 15, 16** (deep-page author links and post link) — `method:computed-only`, `diffPct:None`. The localTabWalk placed these correctly (`reachedByTab:True`) but did not capture a focus screenshot. Focus-visibility verdicts for these elements are PARTIAL.

- **No appearance shot for el4** (skip link) — The element is off-screen at y=-900 and the driver didn't capture a standalone crop. Noted as blank in the element record.

- **Elements 19, 20 not reached by keyboard** — `reachedByTab:False` for rule summary #3 (el19) and 'Learn More' sidebar link (el20). These are at focusable indices 126 and 136 respectively — well beyond the 26 stops captured in the global walk. The localTabWalk couldn't bridge the gap. This may reflect many unlisted focusable elements in the sidebar and feed (posts, vote buttons, etc.) between the last captured stop and these elements. Keyboard-operability is REPRODUCED for the driver's scope; annotator should note these elements require extended Tab exploration.

- **srWalk for el4 returns 'end of document'** — The SR cursor walk couldn't find the skip link in reading order; it's placed as `body > a` before the app shell, but the SR walk anchors on the app content and finds the skip link outside its scan range.

- **el5 (hamburger button) and el8/el9 (Get App, Log In) have very dark shots** — Header is near-black (#0E1113); all shots appear black/nearly black. Focus rings at 1px on this background are below visual detection threshold even if technically present.

## Snapshot fidelity

- Page is scripted (noscript:false); JS hydrated. Activation of 'Create Post' button showed no dialog opening (navTo:null, dialogOpened:false) — the button likely requires login to trigger a real action, which the snapshot can't complete. Dynamic-announcement for el11 is PARTIAL for this reason.

- The `aria-prohibited-attr` axe violation on `reddit-search-large` could not be located via DOM query (`#search-input-remove-filter` not found) — likely inside Shadow DOM. Noted but not fully verifiable.

## Ambiguities

- **Focus visibility diffPct:0 with indicatorPresent:True** — The driver's real-tab-diff detects a 0% pixel change but marks `indicatorPresent:True`. This appears to be a false positive from the computed outline check fallback. Visual inspection of all shot pairs (el1/el1_focus, el2/el2_focus, el3/el3_focus, el7/el7_focus, el8/el8_focus, el9/el9_focus, el18/el18_focus) confirms shots appear identical. Overriding all diffPct:0 cases to REPRODUCED (2.4.7) based on visual evidence.

- **Log In button contrast 4.63:1** — Exactly passes AA at 4.5 threshold. At 14px/600 weight this is normal text (not large text). 4.63 > 4.5, so NOT REPRODUCED. Very close to the boundary.

- **Author link label-content-name-mismatch** — axe flags as 2.5.3 (wcag21a) but the visible text IS contained in the accessible name ('u/X' is a substring of 'Author: u/X'). Strictly 2.5.3 may pass; flagged as a quality/consistency issue. Verdicts marked REPRODUCED citing 2.5.3 with the nuance noted.
