# Notes — o11_The_AI_Agent_Inside_Every_App

## Collector / Driver Issues

- **Element 1 (YC banner link) localTabWalk.reachedByTab=false**: Element is at focusable index 0; localTabWalk cannot position 5 stops before index 0. Global tabWalk stop 0 confirms the element IS reached (inViewport=true). Not a real failure — false negative from local walk positioning. Focus-visibility PARTIAL for this element.

- **Appearance shots missing for 12 of 21 elements**: elements 1, 10, 11, 12, 13, 15, 17, 18, 19 have no appearanceShot. The driver may not have captured screenshots for elements at extreme page offsets or non-focusable elements. Not a script error (no problems[] entries).

- **Focus shots (elN_focus.png) only available for elements 4, 5, 6** (nav links reached by global tabWalk with real-tab-diff). All other elements use method=computed-only. Elements 3, 8, 11 (bits-s1..6 tooltip buttons) are in-viewport but focused state was not diffed — possibly because the global tabWalk cap (50 stops) didn't cover all paths.

- **Element 15 div[role=button] axName="Unable to play media."**: This name comes from the browser's built-in video error shadow DOM message when the video src cannot load in headless Puppeteer. It is not an author-supplied name. Other carousel slide div[role=button] elements in the tabWalk appear with speech='button' (no name) — the sampled element happened to pick up the video error text. Both variants are failures.

- **tabWalk capped at 50 stops (maxTab=50)**: Page has more focusable elements beyond stop 49. Footer links, pricing section links, and other deep-page controls are not in the global walk. Local tab walk compensates for sampled elements. The 24 off-screen stops (stops 26-49) are all carousel controls from sections 3-5.

- **bits-s1..s6 not individually sampled**: Axe found 6 tooltip-trigger buttons with nested-interactive + button-name + link-name violations. Collector sampled 3 of them (elements 3, 8, 11 mapped to bits-s2, bits-s3, bits-s5 by x-coordinate). bits-s1, bits-s4, bits-s6 are in the tabWalk (stops 12, 19, 22) but not in the element sample array.

- **No forms on page**: forms[] array is empty. forms-instructions-errors skill is N/A for all elements.

- **Reflow overflow items**: The specific overflowing elements at 320px include carousel containers (DIV.overflow-hidden, DIV.flex.-ms-4) and feature sections (SECTION.py-20.mx-6). These are general layout elements, not exempt data tables or maps.

- **role=img SVGs (19+ instances)**: Axe svg-img-alt found 19 SVG elements with role=img and no alt text. These appear to be decorative icon SVGs in the pricing cards (checkmark icons, etc.) that use role=img incorrectly — they should use aria-hidden="true" if decorative, or role=img with aria-label if meaningful. Only 4 div[role=img] elements are listed in the axe violation for role-img-alt. The pricing card SVG icons are functional visual indicators (checkmarks for feature availability) and should be made accessible.

## Ambiguities

- **"listitem" vs "list" in srWalk**: Element 4 (Pricing link) targetSpeech='listitem, level 1, position 3, set size 6' — Chrome AX is reporting list semantics correctly. Element 5 (Features link) targetSpeech='list' suggesting SR positioned at the list element itself. The discrepancy is likely due to cursor positioning difference in the local walk. list-style:none risk is VoiceOver-specific (WebKit) and does not affect Chrome's AX reporting.

- **Get Pro link focus ring**: computedOutline='none 2px' but class includes 'focus-visible:ring-[3px]'. The driver reports indicatorPresent=true but used computed-only method (element below fold). The Tailwind focus-visible ring should appear on keyboard focus — PARTIAL verdict is appropriate since no pixel diff was performed.
