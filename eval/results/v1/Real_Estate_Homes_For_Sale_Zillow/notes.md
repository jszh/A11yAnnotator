# Evaluation Notes — Real_Estate_Homes_For_Sale_Zillow

## Collector / Driver Issues

- **noscript=true**: Page served in noscript mode. All dynamic-announcement verdicts are PARTIAL for interaction-triggered state changes. Button click handlers (Save, filter buttons, Sort menu, clear search) cannot execute.
- **tabWalk trapDetected=true**: The global tab walk hit the Google Maps iframe (li[3]) and cycled within it 3 times before the walk capped out at 33 stops. The trap prevented the global walk from reaching elements beyond the Maps iframe in DOM order. All sampled elements were still reached via localTabWalk (element-level local walks) which start 5 stops before the target.
- **noOutlineStops=4**: Three are the Maps iframe (no outline on iframe itself, expected), plus one other stop. The iframe lack of outline is a Maps rendering issue, not a page-level failure.
- **el2 focus shot missing**: el2 (Popular Searches link) was off-screen during the real-tab-diff phase; focusShot=null, method=computed-only. Indicator inferred from computedOutline and localTabWalk outlineOrShadow=true.
- **el14 carousel dot (4x4px)**: Tab walk confirmed reachedByTab=false for this element; managed-tabindex pattern is correct for a tablist but the 4x4px dot size makes any interaction impractical.
- **el15 photo link**: tabindex=-1 confirmed in collect.json. The link is intentionally excluded from tab order — presumably Zillow considers the address link the keyboard equivalent. Still flagged as 2.1.1 concern.
- **Presentation-role-conflict (axe)**: 9 `<article>` property card elements flagged. These articles have a conflict between implicit article role and presentational role usage. Minor axe finding — not escalated to results as a full element issue since cards themselves have adequate structure.
- **label-content-name-mismatch (axe)**: Sort button (#:R3ajapak9sqbd6H1:) not in sampled elements but captured via axe. Verified via verify-finding.js: visible text='Sort: Homes for You', aria-label='Sort options, Homes for You selected'. Escalated to summary issues as 2.5.3 violation.
- **Google Maps drag interaction**: Known per AGENT-PLAN.md note for this page. 2.5.7 Dragging is marked PARTIAL (cannot test map drag without real interaction). The iframe trap is separately reported as 2.1.2.
- **listStyleNone=33**: High count. Affects all major list groups on the page. Chrome AX still reports list role; VoiceOver/Safari users are the affected population (1.3.1 WebKit-specific).
- **Dynamic announcement**: All 13 interactive elements get PARTIAL for dynamic-announcement because scriptsDisabled=true. This is expected behavior for a noscript page — no individual element failures.
- **el13 (b tag)**: Sampled as a `<b>` element with axRole=none, inTree=false. Non-exposed decorative bedroom count. All skills N/A.
- **el7, el10, el20**: Non-interactive, 1x1px or invisible elements. All skills N/A — correctly pruned from AX tree.
