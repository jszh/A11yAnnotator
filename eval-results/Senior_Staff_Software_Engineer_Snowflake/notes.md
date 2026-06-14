# Evaluation notes — Senior_Staff_Software_Engineer_Snowflake

## Driver / screenshot issues

- **Focus shot crop errors (multiple elements):** el1, el4, el6, el15, el16, el17, el18 focus shots show wrong page area (e.g. el4_focus.png shows "Full Name*" field at y≈509 instead of the YES button at y=1561). This is a driver scroll/crop synchronisation issue — the screenshot is taken before the viewport scrolls to the newly-focused element. visibleDiffPct is 0 for all these. Verdicts for those elements are PARTIAL on focus-visibility where the computed outline is the only evidence.

- **el2, el3 — no focus shot (computed-only):** These inputs were off-screen during the local tab walk diff (localTabWalk.stopsToReach indicates they were reached, but the diff engine couldn't capture). computedOutline was used instead.

- **el19, el20 shots blank:** Footer SVG and span shots are blank white — crop lands outside the visible page area (y=6952, near page bottom). Not an error in the element itself.

- **el9, el10 shots misaligned:** Show "Full Name*" area instead of the label/div at y≈2651/5269.

## Noscript limitations

- `scriptsDisabled:true` confirmed by driver. All `dynamic-announcement` sub-verdicts are PARTIAL (no JS = no live region mutations, no state changes to observe).
- `forms[]` empty — no native `<form>` elements; the application form is entirely React-driven without a `<form>` tag. Error-on-submit cannot be probed even with scripts. Error identification (3.3.1/3.3.3) cannot be confirmed or refuted.
- Yes/No button selection state changes (expandedChanged/pressedChanged) all null — handlers inert.
- Tab widget (Overview/Application) arrow-key navigation untestable.

## Ambiguities

- **Yes/No button focus visibility:** computedOutline is 'auto 1px rgb(36,158,220)' — browser default ring. Whether this is perceptibly visible against the light grey button background (246,249,250) at only 1px auto is uncertain without a valid focus shot. Marked PARTIAL.

- **Chevron button (el6) focus contrast:** Blue auto outline on blue background (rgb(36,158,220) on rgb(36,158,220)) — outline colour matches button background; indicator could be invisible. Marked PARTIAL due to crop error on focus shot.

- **"Application" tab / Upload File / Submit Application / Snowflake link contrast:** All share rgb(36,158,220) as either text colour or button background. White-on-blue (buttons) = 3.0:1 exactly. This is the minimum for non-text contrast (1.4.11) but fails for normal text in buttons (1.4.3 needs 4.5:1 for 16px normal weight). axe flags 7 nodes under color-contrast.

- **Heading level:** h3 "Autofill from resume" in the Application tab section with no h2 parent in that section. The h2s (Location, Employment Type, Department, Compensation) are on the Overview tab panel. The heading tree is technically h1→h2→h3 but cross-tab context makes the skip ambiguous.

## Data quality

- collect.json: 0 problems reported. elementCount:20. All 20 elements parsed successfully.
- drive.json: scriptsDisabled:true. 40 tabWalk stops, trapDetected:false. 20 elements processed.
- axe: 6 rules flagged (button-name, color-contrast×7 nodes, label-content-name-mismatch, label, landmark-one-main, region×3 nodes).
