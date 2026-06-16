# Evaluation Notes — Apple_Inc_AAPL_Stock_Price_News_Quote_History_Ya

## Collector / driver issues

- **el1 focusShot missing**: element 1 (View More link) uses `method:"computed-only"` — element was off-screen during the focus diff, so no `el1_focus.png` was generated. Focus verdict is PARTIAL.
- **el22 shot missing**: `el22.png` does not exist in the shots directory. The canvas element has `box:{w:0,h:0}` — it is zero-sized and was not rendered at capture time. No visual to assess.
- **el5 / el6 shots near-black**: The search input (el5) and its label (el6) shots are near-black — the header region at the capture scroll position is almost entirely dark. The focus diff is inconclusive visually even though computed outline `solid 4px rgb(100,137,198)` is strong. Left as PARTIAL.
- **el7, el8 shots very dark/small**: The two nav menu item shots (el7, el8) are too small/dark to confirm visual context. Verdicts rely on driver data.
- **Multiple focus pairs pixel-identical (visibleDiffPct:0)**: el2, el4, el13, el14, el17, el18, el20, el21 all show 0% pixel difference between unfocused and focused shots, confirmed by visual inspection — focus ring consistently absent across the site. The pattern is systemic.

## Snapshot fidelity

- **Tab walk capped at 50**: `maxTab:50` means only the first 50 tab stops were walked globally. The page has many more focusable elements (el4 at index 188, el20 at a high index). The `localTabWalk` (per-element, uncapped) fills in coverage for all elements.
- **ariaRequiredChildren axe violation**: `.menu-container[role=menu]` lacks required `menuitem` children per axe — may indicate that the market-tabs menu widget (el10 area) is structurally malformed.
- **label-content-name-mismatch (axe, 16 nodes)**: Multiple ticker links and at least one button (`#accsumm-4563`) have accessible names that differ from visible text. Not all 16 nodes were individually sampled — only the sampled elements were evaluated.
- **No forms drive errors**: Both form probes returned `nativeValidationOnly:true` with no ARIA error wiring — these are search/lookup forms without required-field validation, so no 3.3.1/3.3.3 issue expected.
- **SR walk for el4 targets the aside/dialog wrapper**, not the input directly — the dock panel appears to use `role=dialog` semantics. This doesn't cause a functional issue but means the SR walk targetSpeech is `"end of dialog, Dock, modal"` rather than the input speech.
