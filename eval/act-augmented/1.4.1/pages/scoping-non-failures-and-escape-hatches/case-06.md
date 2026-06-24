# case-06 — Cinema showtime picker: selected pill distinguished by inverting foreground/background (inversion escape hatch)

## Scenario
A cinema booking widget lets the user pick a showtime from a row of pill buttons. The chosen showtime is indicated by INVERTING the pill's foreground and background (unselected pills are dark text on white; the selected pill is white text on a dark background). The inversion is an additional visual distinction with very high contrast — the selected pill's dark fill differs from the white unselected pills by ~15.7:1 in lightness — so it survives greyscale and colour-vision deficiency, and passes 1.4.1.

## Attribute tuple
- **content-domain:** events / ticketing (cinema showtime selection)
- **UI-component / pattern:** radio group rendered as selectable pills (APG radio pattern)
- **host-language construct:** native `<input type="radio">` + `<label>`; `input:checked + label` inverts colours
- **locale / i18n:** en-GB (24-hour times)
- **failure-mechanism:** NONE — selected state distinguished by foreground/background inversion (limb a, inversion example) = PASS

## Developer persona
A front-end developer built an accessible radio-as-pills control using real radio inputs and `<label>`s. For the "selected" look they reversed the pill's colours (dark fill, light text) rather than just tinting it, because reversal "stays obvious even in dark mode and for colour-blind users." That instinct is exactly the inversion escape hatch; the choice also keeps the selection programmatically exposed via the native radio's checked state.

## Element / selector carrying the issue
`.pill input:checked + label` — the selected `15:30` pill (white text `#fff` on dark background `#1d2330`), versus the unselected pills (dark text `#1d2330` on white `#fff`).

## Exact accessibility mechanism (what AT experiences / why it passes)
- The selected state is conveyed by reversing the pill's foreground and background colours. This is not a hue cue: in greyscale (or for any colour-vision deficiency) the selected pill is a DARK block among LIGHT blocks — the selected fill differs from the unselected fills by ~15.7:1 in lightness, so it is unmistakable without relying on colour perception.
- The Understanding note says distinguishing content by inverting an element's foreground and background colours passes 1.4.1, assuming the foreground and background have sufficient contrast — here both states are ~15.7:1, far above any threshold.
- Selection is additionally exposed programmatically through the native radio's checked state, and sold-out times carry a strikethrough + grey, but the inversion alone discharges the 1.4.1 obligation for the selected-state cue.

Verified by rendering (the selected 15:30 pill is clearly a reversed dark block among white pills) and contrast computation: selected fill vs unselected fill = 15.73:1; text/bg in each state = 15.73:1.

## Expected ACT-style outcome
**passed** (SC 1.4.1 — selected state distinguished by foreground/background inversion with sufficient contrast; the inversion is an additional visual distinction).

## Why automated tools miss it
An over-eager "selected state shown by a colour change = use-of-colour failure" heuristic — the classic swatch/chip anti-pattern that real audit tools and naive LLMs flag — would false-positive on this selected pill. Distinguishing a genuine colour-only state cue from an INVERSION that carries an inherent large lightness difference requires comparing the selected and unselected backgrounds and reasoning that the swap survives greyscale. No automated checker compares two component states' fills and luminances to make that call; it is a visual judgement.

## Citation
> "Similarly, if content is distinguished by inverting an element's foreground and background colors, this would pass (again, assuming that the foreground and background colors have a sufficient contrast)."
— wcag-understanding/use-of-color.html (Intent note — inversion escape hatch)

> "This should not in any way discourage the use of color on a page, or even color coding if it is complemented by other visual indication."
— wcag-understanding/use-of-color.html (Intent note)
