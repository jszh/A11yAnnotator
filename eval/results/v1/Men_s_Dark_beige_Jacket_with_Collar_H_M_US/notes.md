# Evaluation Notes — Men's Dark beige Jacket with Collar | H&M US

## Driver/Collector Issues

- **Filename encoding**: First `drive-page.js` run used the shell `$'...'` form of the curly-apostrophe filename and returned 0 elements (tabWalk count=0, elements=[]). Second run with correct quoting worked correctly (adaptiveScripted=true, 21 elements, 50 tab stops).

- **verify-finding.js unusable**: `verify-finding.js` could not render the page in either scripted or noscript mode (body.innerText returned 'Not found' / empty eval results). The curly-apostrophe in the filename breaks URL encoding in the verify-finding.js serve path. All follow-up probes via verify-finding.js returned empty/unusable results. Reflow was the one exception that worked (`--viewport 320x900`).

- **adaptiveScripted=true confirmed**: Driver served the page scripted (scriptsDisabled=false), proving H&M's saved HTM survives scripted hydration. Page had 50 tab stops and 21 element records.

- **8 elements with no drive data** (isInteractive=null, localTabWalk=null, srWalk=null): el3, el4, el8, el11, el14, el15, el16, el17. These are elements the driver could not instrument — either because they were too far off-screen horizontally (el14 at x=2557, el17 at x=3191), or were non-interactive elements the driver skipped (el3/el4 banner, el8 nav span, el11 Reviews button). All skills for these elements are marked PARTIAL where applicable.

- **All appearance shots blank/white**: The offline HTM snapshot does not load external images (product photos, CSS backgrounds). All shot PNGs show blank white content. el10_focus.png shows a broken image icon with alt text — the only visual evidence of a focus-induced change. el1.png shows the H&M logo text and skip-link area. All other product area shots are blank.

- **Focus shots blank**: All focus shots (el5_focus, el7_focus, el18_focus, el19_focus, el20_focus) are blank/white due to offline rendering. visibleDiffPct=0 for most focus diffs as a result. Focus indicators were confirmed via computedOutline (browser default 'auto 1px rgb(0,95,204)') rather than pixel confirmation.

- **el2 Add to bag: appearanceZeroSize=true**: During the scripted drive, the Add to bag button was found to be zero-size (likely all sizes out-of-stock → button may have been hidden/replaced during the scripted hydration state). No appearance shot produced.

## Ambiguities

- **el1 Skip to content focus-visibility**: Global tabWalk outlineOrShadow=true for this stop, but the element is positioned at x=-1, y=-1 (off-screen). The outlineOrShadow flag may reflect the computed-only indicator, not a visual one. Cannot resolve without a focus screenshot.

- **Primary nav focus visibility (10 stops)**: tabWalk shows outlineOrShadow=false for all 5 main nav links and their 5 "Open menu" buttons. These elements were not individually sampled, so no per-element focus shots exist. The issue is flagged in the summary issues list under GLOBAL-TABWALK.

- **Social icon link naming**: The pattern of 'ICONNAMEText' accessible names (FacebookIcon Facebook, TikTokLogo TikTok, etc.) appears systematic across all 6 social links. Only el20 (Facebook) was sampled, but the same defect applies to Instagram, TikTok, Spotify, YouTube, and Pinterest.

- **H&M logo link name doubling**: axe label-content-name-mismatch violation for `aria-label="H&M"` on the logo link. The AX name comes out 'H&M H&M' from both the SVG title and the hidden span.

## No Forms Found

- `drive.forms = []` — no `<form>` elements were detected. The page has no form fields in the sampled set (no search field, no newsletter signup in the sampled elements). cat_9 / forms-instructions-errors is N/A for all elements.
