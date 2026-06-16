# Evaluation Notes — New York Magazine

## Collector / Driver Issues

- **Tab walk trapped immediately**: `tabWalk.trapDetected:true` with only 3 stops, all cycling on the ad iframe (`/html/body/div[2]/div[1]/aside[1]/div[1]/div[1]/div[1]/iframe[1]`, the Google Ads iframe at y:0). The global tab walk reached the iframe (stop 1), entered it, and could not escape (stops 2 and 3 are the same xpath). `maxTab:50` was set — the trap consumed all available steps. As a result, the global tab walk covers only the first portion of the tab order; all per-element `localTabWalk` probes used a separate local walk that started 5 focusables before each target and did successfully reach the majority of elements.

- **Many elements have visibleDiffPct:0 despite indicatorPresent:true**: Section-header links (el6, el12, el13, el14, el16, el17, el18) all report `indicatorPresent:true` from computed CSS (`dotted 1px rgb(0,0,0)` or `dotted 1px rgb(219,40,0)`) but `visibleDiffPct:0`. This is because their bounding boxes are very small (some 1x1px for hidden text nodes, others ~35–103px wide but at large y-offsets outside the diff viewport). The computed outline is trusted as evidence of a focus indicator being applied.

- **Appearance shots for deep elements show wrong content**: Several appearance shots (el1, el3, el8, el9, el11) appear to show portions of the NY Magazine italic logo watermark rather than the actual element. This is a viewport/crop offset artifact — the shot crops at the element's bounding box coordinates but the screenshot appears to be taken at page top. This is noted but does not affect skill verdicts (pixel contrast was verified separately via `--pixel-contrast`).

- **el15 and el20 have 1x1 bounding boxes**: Both elements are intentionally CSS-hidden (visually replaced by SVG). Their appearance shots are blank. Pixel contrast returns 1:1 (trivial — no pixels sampled). These elements are not visually rendered; their text provides AT name via parent link. No scoring impact.

- **forms[] results**: Both forms are search inputs with `aria-label="Search"` — properly labeled. `nativeValidationOnly:true` for both, but these are simple search forms with no required fields, so 3.3.1/3.3.3 does not apply. No form-error issues to report.

- **OneTrust button (el18) did not open dialog in saved snapshot**: `activate.dialogOpened:false`. The OneTrust JS appears to be partially loaded in the saved file but the modal panel did not render. `dynamic-announcement` for this element is PARTIAL.

- **Ad iframe inner content**: Axe flagged `button-name` (2 nodes) and `label` (2 nodes) violations inside `#google_ads_iframe_/172968584/nym.nymag/homepage_2`. These violations are inside a third-party ad frame and are out of scope for the site evaluation, but noted here for completeness.

- **`landmark-unique` axe violation**: `.ad_static` (aside) and `.dropdown-body` (nav) appear multiple times without distinguishing labels. Multiple unlabeled nav landmarks (7 of 8 navs have no aria-label) are a usability concern for screen reader navigation but not a hard WCAG failure at AA.

- **No skip/bypass link found**: `document.querySelectorAll('a[href^="#"]')` returned empty. The page has no mechanism to skip the navigation (2.4.1). This was not in the sampled elements so not formally scored, but is a notable omission.
