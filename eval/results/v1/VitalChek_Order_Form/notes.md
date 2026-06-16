# Evaluation Notes — VitalChek Order Form

## Collector / Driver issues

- **iframe title axe violation**: The chat widget `<iframe>` (class `f9ChatWidget`, Five9 ngchat-app) has an empty `title` attribute — axe `frame-title` flagged it as serious (4.1.2). The iframe is not sampled as one of the 20 elements but is present in the global tabWalk as a stop with `outlineOrShadow:false` (the one `noOutlineStops` entry in the tabWalk). This unfocused iframe is the chat widget embedded at the bottom of the page.

- **iframe tab stop without focus indicator**: The global tabWalk includes `/html/body/div[3]/iframe[1]` (speech: "link, Business Seals") at stop 18 with `outlineOrShadow:false` — this is a second unfocused iframe in the tab sequence with no visible focus ring. This is a separate 2.4.7 issue not captured in the sampled elements.

- **Pixel contrast estimator confusion on gradient buttons**: For the Back button, the pixel estimator selected `[192,192,192]` as "text" (gray shadows/antialiasing) vs the actual white text `(255,255,255)`. Manual contrast verification was used instead: white on mid-blue 3.65:1, white on light-blue top 1.31:1, pixel `worstOverBackground=1.22` corroborates. The estimator palette confusion is a known limitation on gradient buttons.

- **Continue button contrast ambiguity**: Same gradient class as Back button. Pixel estimator picked a darker region giving 6.13:1 — but the gradient's light-blue top (same as Back) would also be low. The two buttons are visually identical in appearance shots. Back button is definitively flagged REPRODUCED for 1.4.3; Continue is noted with same risk but not separately reproduced as the pixel estimator selected a darker region.

- **`ctl00_stepHeader` reference is broken**: The fieldset `#WhosCertificate` has `aria-labelledby="ctl00_stepHeader"` but no element with that id exists in the saved page. The question text ("Whose Birth certificate are you ordering?") is in an h1 with no id. This appears to be a server-side rendering artifact where the master-page id prefix (`ctl00_`) was added to the labelledby value but the h1 element lost its id in the saved HTML.

- **Second radio (input[2]) not reachable by Tab**: Expected — native radio groups use arrow keys for within-group navigation. The driver's `localTabWalk` reports `reachedByTab:false` and `stopsToReach:-1`, which is correct behaviour, not a keyboard access failure.

- **listStyleNone count=4**: All 4 lists with `list-style:none` are risk items for Safari+VoiceOver. This is a static precondition finding only — not directly verified in Chrome AT.

- **Saved-page link resolution**: Most footer links resolve to `vitalchek.com/order_main.aspx?eventtype=BIRTH#` (same-page anchor) due to saved-page link interception — not a real navigation failure.

## Snapshot fidelity gaps

- The page is a mid-flow step of a multi-step order form. The radio group represents Step 1 ("Who is this for?"). The `drive.forms[]` data covers the visible form (`fields:6`) which likely includes hidden fields from the larger form rather than just the 2 radio inputs visible. The form submit did not visibly advance to a next step (saved page limitation) but the native validation behaviour was captured.

- The chat widget iframe (Five9) and CrazyEgg tracking iframe are present but their content is external/restricted in the saved page.
