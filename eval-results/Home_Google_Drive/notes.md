# Evaluation notes — Home_Google_Drive

## Driver / collector observations
- `drive.json` generated cleanly; `problems: []`; `scriptsDisabled: false`.
- `noscriptFlagged: false` — page served with scripts enabled; all dynamic checks are authoritative.
- 21 elements sampled; 28 tabWalk stops captured; 8 noOutlineStops.

## Focus-shot coverage gaps
- el14 (span[role=heading], zero-size): not rendered, no shot produced. Appearance shot filepath listed but the element has box {w:0, h:0}; screenshot content actually showed a nearby element's text.
- el17 / el18 (gridcells): no `_focus.png` shots — driver did not run `localTabWalk` for these elements (localTabWalk.reachedByTab=N/A). Focus diff PARTIAL for both.
- el19 (View more button): `focusIndicator.method=computed-only`, no `_focus.png`. Button was apparently off-screen or below fold when driver attempted diff. Verdict based on computed outline style only.
- el20 / el21 (side panel tabs): `computed-only`, no focus shots. Consistent with `reachedByTab=false`.

## Contrast ambiguity — View more button (el19)
- Computed CSS `color: rgb(0,0,0)` on `effBg rgb(19,19,20)` = 1.13:1 (catastrophic fail).
- However, el19.png shot shows 'View more' text rendered as a light blue/teal color visually.
- The discrepancy suggests the actual text color is carried by a child `<span>` or `::before` pseudo-element with a different color than the computed color on the `<button>` itself.
- A `--pixel-contrast` verification was not run; the current REPRODUCED verdict is conservative based on computed CSS.

## aria-valid-attr-value on search input
- `aria-haspopup="true"` on the search text input. In ARIA 1.1 the valid token for a suggestion listbox should be `"listbox"` not `"true"`. The input also has `aria-owns="gs_sbt50"` pointing at an autocomplete list.

## meta-viewport
- `<meta name="viewport" content="width=1000, user-scalable=no">` — axe flags this as `meta-viewport` (critical, 1.4.4). Not evaluated separately as it overlaps with the 1.4.10 reflow finding.

## Tablist / aria-required-children
- axe flags `aria-required-children` on `.Kk7lMc-Ku9FSb-Yb-Il[role=tablist]`. Manual check shows this tablist has `tabindex=0` but 7 direct `[role=tab]` children. The violation may relate to an incorrect tablist structure or missing `aria-selected` on tabs. Side panel tabs (el20/el21) confirmed not keyboard reachable and not announcing selection.

## aria-hidden-focus
- axe flags two `.goen0e[aria-hidden=true]` containers with focusable children. Confirmed by driver eval: 5+ DIV elements with `tabIndex=0` inside `aria-hidden` containers — these are ghost focusable stops invisible to AT.

## Reading-order note
- tabWalk stops #23 and #24 both report the same xpath suffix pattern and same speech ('gridcell, Generative Controls for Controlling LLM outputs...') — possible duplicate stop or selector collision in the driver for dynamically-repeated grid cells.

## No traps detected
- `trapDetected: false`; `offScreenStops: 0`. Focus management issues are order/reachability, not traps.
