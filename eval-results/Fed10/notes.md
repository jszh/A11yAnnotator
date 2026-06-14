# Fed10 evaluation notes

## Driver / screenshot issues

- **El10_focus.png offset**: el10 (WA-HB-2089 button, box y=714) and el10_focus.png shots show the "Get Started" / "Backed by Y Combinator" area at the top of the page — the driver crop is misaligned for this element. focusIndicator verdict was based on computedOutline (solid 2px black), not visual diff. Recommend re-checking with a targeted verify-finding shot.

- **El18 shot offset**: el18 (footer "Try Fed10 Now" link, y=6752) appearanceShot shows what appears to be the bill-detail panel rather than the footer CTA. Same crop-alignment issue for deep-page elements.

- **El16 shot (Last sync span)**: el16.png shows very faint text — the 10px text at this crop size is extremely small but the low contrast is confirmed by computed math (2.07:1), not purely by visual read.

- **El1 focusIndicator method=computed-only**: Nav logo link is at tab-order index 0; the local tab walk starts from ~5 steps before the target, wraps around, and doesn't reach it. Global tabWalk confirms it IS reachable (stop[0]) with outlineOrShadow:true. Verified separately that `a:focus` receives `outline: solid 2px black`. Not a real focus-visibility failure.

- **Many shots blank/white**: El2, el3, el4, el5, el6, el7, el9, el11-el15 all appear blank or near-white in the 1:1 PNG crops. These elements are either very small or positioned where the crop clips into the page background. For SVG path elements at y=570-800, the unfocused background is white (rgb(250,250,250)) — matching the blank appearance.

## Noscript note

- `scriptsDisabled=true` confirmed. All `dynamic-announcement` sub-verdicts are PARTIAL. The `activate` probes for buttons (WA-HB-2089 button, etc.) show clicked=true but viewChanged=false — JS handlers disabled, no state changes observed.

## Scrollable regions

- Axe flagged two scrollable divs (overflow-y-auto without tabindex): the bill-list panel (scrollH=859, clientH=544) and the detail panel (scrollH=873, clientH=620). Keyboard users cannot scroll these panels. This is a significant usability barrier for the core product interface.

## Contrast failures scope

- Axe `color-contrast` flags 27 nodes. Only el16 is in the sampled element set. The page uses Tailwind opacity-modifier classes (`text-[#1D1D1F]/60`, `text-[#1D1D1F]/40`, `text-gray-400`) extensively for decorative and UI text. Many of these fail: the /60 opacity on white gives ~4.33:1 (below 4.5 for normal-weight text), /40 gives ~2.46:1, gray-400 (156,163,175) on near-white gives 2.07–2.43:1.

## SVG map paths

- 56 `<path tabindex="0">` elements in the US map SVG. The SVG uses the `react-simple-maps` library (class `rsm-geography`). All paths lack aria-label, title, and role. Tab walk consumes 36 stops (hit the cap of 50 total) navigating through these unnamed map regions. This is both a 4.1.2 (no name) and a 2.4.7 (no focus indicator) failure at scale, plus creates a severe keyboard navigation burden — users must Tab through dozens of meaningless stops.

## Heading order

- Axe `heading-order` flagged the H3 immediately after H1 (the "Financial Data Sharing Limits" heading inside the demo widget). The page has H1 → H3 before any H2 appears. Later H2s follow H3s making the outline non-hierarchical.

## List-style:none

- collect.json reports listStyleNone=1. One list uses `list-style:none` without `role="list"`. In Safari/VoiceOver, this strips list semantics.
