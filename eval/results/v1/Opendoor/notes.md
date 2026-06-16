# Opendoor eval notes

## Collector / driver issues

- **el2.png / el2_focus.png blank**: The appearance shot and focus shot for element 1 (li[3]/a[1] — "Agents" nav link, collect index 1) rendered as blank white. The link sits on the white header bar and the crop is very small. The tabWalk confirms outlineOrShadow=true for the third nav link (stop[4]), so focus ring presence was settled from the walk rather than the shots.

- **el12.png / el12_focus.png wrong crop**: Shots for the address combobox (drive el11 / collect el11) captured the surrounding paragraph text ("Get a cash offer...") rather than the input field itself. The combobox is small (359×24 at y=545) and the shot captured a larger region above it. Focus indicator judgment for this element falls back to computedOutline + tabWalk (outlineOrShadow=false).

- **el13.png / el13_focus.png wrong crop**: "See reviews" button (box w:88, h:20, y:738) shots captured house siding — the crop was offset to the larger hero image region. visibleDiffPct=0 despite indicatorPresent=true in driver; tabWalk stop[8] outlineOrShadow=true. Logged as PARTIAL for focus-visibility because the shot pair cannot confirm ring quality.

- **El0 (skip button) localTabWalk.reachedByTab=false**: The local walk started 5 stops before the target index 0, but there are no stops before 0. The button IS the first global tab stop (tabWalk stop[0]). This is a localTabWalk limitation for index-0 elements, not a real keyboard-operability defect.

- **Drive el12 focus shot name conflict**: Drive file names shots as el12.png / el12_focus.png for the combobox (drive element index 11), but this corresponds to collect element index 11 (combobox). The indexing offset (drive uses 1-based filenames: el1=index0) was tracked carefully; no data was misread.

- **"More options" menu focus after activation**: activate.focusMovedTo points to the `main` region rather than the menu itself after expansion. This may indicate focus returned to main rather than entering the menu. However, no trap was detected and the page did not enter an error state. The expansion announcement failure (vsrAnnouncement=null) was recorded as 4.1.3 REPRODUCED.

- **Hero image offer bubbles (el17 / collect index 17, role=none)**: The shot clearly shows offer price bubbles ($452K, $446K, $449K) overlaid on the house photo. These were marked role=none / inTree=false by the collector. If these bubbles are rasterized into the image, the price information is not accessible to AT — this was flagged PARTIAL pending deeper DOM investigation of child element accessibility.

## Ambiguities

- **Nav links "View link" aria-label**: All three top-level nav links (Buy/Sell/Agents) share aria-label="View link". This was confirmed by both the AX tree (axName='View link' for all three) and direct DOM inspection. Fails 2.4.4 and 2.5.3. The sub-menu links inside each dropdown have proper distinct aria-labels ("Navigate to ...").

- **listitem axe violation context**: The axe `listitem` rule fires on the nav `<li>` elements because their parent UL has `list-style:none` without `role=list`, which some parsers treat as removing the UL from the list structure. In Chrome AX the list semantics are still present (SR voices "listitem, level 1, position N, set size 3"), but in Safari/VoiceOver `list-style:none` without `role=list` strips this. Recorded under grouping-and-reading-order 1.3.1.
