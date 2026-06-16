# Evaluation Notes — Vanguard_S_P_500_ETF

## Driver / Collector Issues

- **el1 (navbar-brand logo link)**: `localTabWalk.reachedByTab=false`, `stopsToReach=-1`. The local Tab walk could not reach the logo link. The global tabWalk stop 1 is an unnamed link (`speech='link'`, `outline=True`) which is likely this element, but the local walk failure means no focus shot was captured. Focus verdict is PARTIAL (computed-only).

- **el21 (Highcharts fund-flows chart)**: `box=0×0`, `ignoredReasons=['notRendered']`. The chart container is a zero-size div at page load. No appearance shot (el21.png missing). Skills assessed as PARTIAL or N/A. Chart may render after JS interaction — not capturable in static/initial load.

- **el9_focus.png, el7_focus.png, el10_focus.png, el13_focus.png, el14_focus.png**: All show identical crops to unfocused shots (visibleDiffPct=0). The driver reports `indicatorPresent=true` for el7/el10/el13/el14 (positive from computed outline `auto 5px`), but vision confirms zero pixel change. These were overridden to REPRODUCED.

- **el1.png, el9.png**: Blank/white crops — the navbar area was captured as a white rectangle, consistent with the element's crop position at the very top of the page where the nav background is white.

- **el4.png, el6.png**: Very faint/thin strip crops — table rows that are only 1-2px tall in the cropped region.

## Snapshot Fidelity

- The page has 107 lists with `list-style:none`. Safari+VoiceOver stripping confirmed as a structural risk (Chrome AX still reports list semantics).
- The `object` element (VPAID Flash video tester) and the up-arrow `<img>` in the stock price display both lack accessible names, but only the img is sampled (el — not in the 21 sampled elements; captured via axe violations).
- Forms 0–3 all use `nativeValidationOnly=true` — no ARIA error handling. Form 3 (financial advisor signup) has `required=true` fields with no programmatic label (placeholder-only), which is not among the 21 sampled elements but flagged by forms[] data.
- The `aria-allowed-attr` axe violation on `#etf-ticker-profile_tab` (`<div aria-expanded="true">` with no button/disclosure role) is a structural ARIA misuse but the element is not sampled.
- No focus traps detected. No off-screen focusable stops.
- tabWalk capped at 50 stops (maxTab); page may have more focusable elements beyond stop 50.
