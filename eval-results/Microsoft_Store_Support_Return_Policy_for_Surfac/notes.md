# Evaluation notes — Microsoft Store Support & Return Policy for Surface, Xbox & More

## Prior run interruption
- `collect.json`, `drive.json`, and `shots/` were reused as instructed; neither `eval-page.js` nor `drive-page.js` was re-run.
- Reflow check (`verify-finding.js --viewport 320x900`) was NOT run; all reflow verdicts are PARTIAL.

## Shot quality issues
- Most element crops are very small (icon-sized) or blank/white, because the driver crops to the element's bounding box and many elements (particularly footer links at 12–16px height) produce near-empty crops.
- Shots for el1/el1_focus, el2/el2_focus: cropped to a tiny colorful icon rather than the link text — cannot visually confirm focus ring from shots.
- el3.png, el8.png, el10.png, el18.png, el19.png, el20.png: blank/white — element at extreme page bottom or crop missed text area.
- el9.png, el9_focus.png: tiny text crop 'pa...re...' — element at y=3278.
- el12.png: nearly blank.
- Consequence: focus-visibility for 8 elements rated PARTIAL because pixel-diff=0 contradicts outlineOrShadow=true or because shots are unhelpful for visual confirmation.

## el3 localTabWalk anomaly
- Local walk for el3 ('Learn more about Flexible payment') returned the tabpanel container as the positioned stop (stopsToReach=0, stop xpath=tabpanel div) rather than the link itself.
- The global tabWalk DOES find the link with outlineOrShadow=true — confirming it is reachable.
- The focusIndicator method was computed-only (no diff shot) because the local walk hit the tabpanel.
- This is a driver positioning artifact; keyboard-operability is NOT REPRODUCED based on global walk evidence.

## el7 srWalk anomaly
- el7 (Microsoft logo link) srWalk.targetSpeech='end of document' — the SR walk reached end-of-document before finding the element (likely because el7 is near the start and the walk went backwards past the top). Not a content finding.

## el10 keyboard reachability uncertainty
- el10 (Privacy link, tabIndex position 76) was not reached by the local tab walk. The walk cap is 50 (maxTab:50 for global). The local walk for el10 shows stopsToReach=-1 (never reached within the extended local walk). Other footer links at higher positions (el18 at index 81, el19 at index 80) ARE reached. This may reflect el10 being in a different tab-order path that the local walk starting from the header doesn't traverse before hitting its cap. Flagged REPRODUCED for keyboard-operability but warrants re-verification with `verify-finding.js`.

## el17 not found
- el17 (h3 'Can we help you?' in div[12], the live chat widget) has `notFound:true` in drive.json — the widget did not appear during the drive-page.js session. All driver-dependent skills are PARTIAL for this element.

## Forms
- `drive.forms` shows two forms: (1) search form — 2 fields, hasRequired=true, nativeValidationOnly=true, no ariaInvalidSet, no errorAnnouncedLive. (2) newsletter signup form — 1 field, nativeValidationOnly=true. No form field elements were sampled in the element set, so forms-instructions-errors skill is N/A for all 20 elements. The native-validation-only pattern on the search form (hasRequired=true, no aria-invalid, no error announced live) is a 3.3.1/3.3.3 candidate worth noting but not assessed per-element here.

## Skip link focus indicator
- The skip-to-main-content link (first tabWalk stop) has outlineOrShadow=false — it is the sole noOutlineStop in the global walk (noOutlineStops=1). This is a definite 2.4.7 failure but the skip link was not in the sampled 20 elements; it is captured as a page-level issue in the summary issues list.

## Duplicate h1
- The heading structure shows two identical <h1> 'Why buy from Microsoft Store' entries. One is likely inside the 'For business' tab panel that is hidden by default. The duplicate in the AX tree is a 1.3.1 issue.

## Footer link name concatenation
- Footer links in the 'What's new', 'Microsoft Store', 'Education', etc. columns have their accessible names computed with the column heading appended (e.g. 'Surface Pro What's new', 'Account profile Microsoft Store'). This is because the `<div role="heading">` column label is adjacent to the `<ul>` and gets included in the link's computed name via DOM text. This affects all footer navigation links, not just el9. Warrants a broader fix.

## label-content-name-mismatch (axe)
- 3 nodes flagged. The third node is `a[aria-label="Learn about Microsoft Complete"]` (el1). The first two nodes are additional 'Learn more' links under 'Free 60-day returns' and '60-day price protection' sections — these are NOT in the sampled 20 elements but share the same 2.5.3 pattern.
