# Evaluation Notes — Home_Panera_Bread

## Data Reuse
- collect.json and drive.json reused from prior interrupted run; no re-execution of eval-page.js or drive-page.js.

## Collector / Driver Issues

- **el1 (skip link) localTabWalk miss**: `reachedByTab=false` in the local walk because the element is at index 0 — the local walk starts 5 focusables before index 0 which wraps. The global tabWalk confirms it IS stop #1. Verdict adjusted to NOT REPRODUCED for keyboard-operability based on global evidence.

- **el8 (silo-button span)**: Sampled as `isInteractive:false` (the `<span>` child, not the `<silo-button>` host). The host custom element IS in the tabWalk but has no drive `elements[]` record. All interaction evidence for silo-buttons comes from the global tabWalk only.

- **Multiple silo-button name mismatches**: 7 silo-button tab stops in the global tabWalk all announce the name of the previously-focused element rather than their own label. This is a systematic 4.1.2 failure across the custom element type. Stops affected: 13 ("Start an Order" → "Search Our Menu"), 16 ("Build Your Meal" → "Delivery"), 17+18 ("Start an Order" → "Delivery"), 19 ("Explore Menu" → "Delivery"), 24+25 ("Join Now"/"Or, Sign In" → "Sandwiches").

- **Focus visibility — footer links**: el15, el16, el17, el19 all show `visibleDiffPct=0` with method `real-tab-diff`. The shots (el15.png/el16.png/el17.png/el19.png) appear as background photography with no discernible focus outline. A 1px computed outline is insufficient over these backgrounds. This is a consistent pattern for all footer/navigation links over image or dark-green backgrounds.

- **el2 (hidden h1)**: `appearanceZeroSize:true`. The element is styled with `class="text-transparent"`, `fontSize:0px`, `height:0` — it exists in the DOM and AX tree as h1 "Panera Bread" but is completely invisible. Also flagged by axe `region` rule (outside landmark).

- **el4 (Sign In button)**: `activate.focusMoved:false` but `focusMovedTo` is set to a nav element — likely a driver inconsistency where focus moved to a menu that was already open from a prior activation in the session. The Sign In action did not produce a dialog or announcement, which is expected on a static snapshot (auth flow is backend-dependent).

- **el12 (Delivery button) srWalk**: `targetSpeech=null` in drive.json. The SR walk for el12 did not capture a target speech. This may indicate the SR cursor landed on the element but no speech was recorded. The global tabWalk confirms the element speech as "button, Delivery".

- **Reflow not tested**: Per instructions, verify-finding.js was not re-run. The reflow verdict is marked PARTIAL due to missing data.

- **listStyleNone=3**: Three lists with `list-style:none` detected. In Safari/VoiceOver these lose list semantics. Our Chrome driver cannot reproduce this condition — flagged as a known gap.

## Snapshot Fidelity Gaps

- Social icon links (el17 Instagram, and the Facebook link visible in tabWalk) have `text=''` and rely entirely on `aria-label`. The contrast issue (1.1:1) is computed from element colors vs background — the actual icon rendering is SVG/image and the contrast instrument measures element bounding-box colors, not the rendered icon pixels. The direction of failure is confirmed (both colors are in similar green hues) but pixel-contrast confirmation was not performed.

- The `silo-button` custom element is a web component; its shadow DOM internals are not inspected by the collector. The name-announcement bug observed in tabWalk appears to be a shadow-DOM name-computation issue where the accessible name falls through to a cached value.
