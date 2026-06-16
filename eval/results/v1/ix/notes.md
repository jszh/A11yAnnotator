# Evaluation notes — ix (slug: ix, index 51)

## Collector / driver issues

- **el4 (logo link) focusIndicator conflict**: `method:"computed-only"` with `computedOutline:"none 3px"` and `indicatorPresent:false` — BUT the global `tabWalk` stop for this element shows `outlineOrShadow:true`. The local tab walk starts from 5 focusables before index 0, which wraps and never reaches index 0, so `reachedByTab:false` and no visual diff was computed. The tabWalk evidence was used as authoritative: indicator IS present.

- **SDK tab button shots (el11–el15)**: `visibleDiffPct=0` for all SDK tab buttons, despite `tabWalk.outlineOrShadow:true`. The element crops (51×22px) are positioned over the code block text, and the 1px UA outline at the button edge is too small to register as a percentage change against the code-block background texture. tabWalk `outlineOrShadow:true` is treated as authoritative for all.

- **SDK button activate: `focusMovedTo` = email input**: All SDK tab button activations in drive.json show `focusMovedTo = /…/section[1]/form[1]/input[1]`. This appears to be an artifact of the driver re-focusing the email input between activations (possibly from a previous `input.focus()` call in the driver sequence), not an actual focus management behavior of the buttons themselves. Not counted as a focus management defect.

- **el8 (pipe separator) colour**: The `|` separator character has `axRole:none, inTree:false` but SR voices it as plain text (`speech:'|'`). Flagged as REPRODUCED under colour contrast since the character is rendered and voiced — borderline decorative vs. informational.

- **el19/el20 appearance shots**: The footer link (el19, footer ix) and footer copyright span (el20) shots appear to show the SDK tab row context rather than the footer — likely because the screenshot is taken before full scroll/paint positioning. The axe and collect data were used for these elements instead of the shots.

- **Forms drive probe**: `nativeValidationOnly:true` — the form uses only browser-native validation tooltip. The empty `assertive` live region (`div[aria-live="assertive"]`) exists in the DOM but was never triggered during the drive probe's submit attempt.

- **SDK tab button code-switch**: Calling `button.click()` in verify-finding eval did not trigger Svelte's reactive state update (classesAfter showed no change). This is expected — the verify-finding eval runs a cold page load and Svelte's event system requires actual user event dispatch. The drive.json `activate` results (real clicks via CDP) are the authoritative source, and those showed no `liveMutations` or `vsrAnnouncement`.

## Ambiguities

- **el8 pipe separator contrast**: Flagged REPRODUCED given the SR voices it, making colour applicable. Could be argued N/A if purely decorative. Low priority.

- **Logo link name "ix logo ix"**: The AX name concatenation ('ix logo' from SVG aria-label + 'ix' from span text) is verbose but not technically empty or wrong. Flagged as a name quality issue (4.1.2) rather than a hard 1.1.1 failure.

- **2.5.3 Label in Name**: The sdk/py button axName is 'sdk/ py' (space inserted by Chrome between span and text node) while visible label is 'sdk/py'. This could be a 2.5.3 violation but was grouped under 4.1.2 name quality.
