# case-02 — Supplemental faint-grey hover wash on a black-bordered checkbox (NA / Pass)

## Scenario
A cookie/telemetry preferences panel on a developer-docs site. Each preference is a custom
checkbox identified AT REST by a 2px solid black border (`#111` on white = 18.8:1). When the
pointer hovers a row, the whole row gains a faint grey wash (`#ededed`, ~1.17:1 against white).
A naive scanner that samples the `:hover` state computes that ~1.17:1 wash and reports a 1.4.11
failure. The correct verdict is the opposite: the hover wash is supplemental and exempt, and the
control passes.

## Attribute tuple
- **Content domain:** developer docs / API reference
- **UI component / pattern:** custom checkbox (APG checkbox pattern) with a row-level hover treatment
- **Host-language construct:** visually-hidden native `<input type=checkbox>` + styled `.box`; `:hover` background on the wrapper
- **Locale / i18n:** en
- **Failure mechanism:** false positive — a supplemental low-contrast hover wash is mistaken for a state indicator that must reach 3:1

## Developer persona
A docs-platform engineer wanted hover feedback "like GitHub's settings rows," so they added
`.pref:hover { background: #ededed }` for a subtle highlight. They kept the resting checkbox
indicator strong (a crisp black border and check) but deliberately made the hover wash whisper-
faint so it would not distract while reading code. They are unaware that an auditor's scanner may
sample the hover state and flag the faint wash as a contrast failure.

## Element / selector carrying the issue
`.pref:hover` (the faint `#ededed` row background, ~1.17:1 vs white) is what a scanner would flag.
The actual identifying indicator is `.box` (2px `#111` border, 18.8:1), which never drops below
3:1 — it stays ~16:1 even against the grey wash.

## Exact accessibility mechanism
The SC's hover-states section is explicit: HTML controls do not by default show hover effects, so
the pointer's own position is the hover indicator. Author-supplied hover treatments are therefore
"supplemental" and "do not themselves need to contrast 3:1 against the background." For an AT/low-
vision user, the checkbox is fully perceivable at rest via its 18.8:1 black border; the hover wash
adds nothing required. The key constraint — that the hover effect must not cause the control to
lose contrast — is satisfied because the black border keeps ~16:1 against the `#ededed` wash. So
the surface PASSES; the faint wash is out of scope.

## Expected ACT-style outcome
**passed** (SC 1.4.11). The supplemental hover wash is exempt, and the resting indicator and check
both exceed 3:1.

## Why automated tools miss it
Automated checkers cannot tell a *required* state indicator from a *supplemental* hover
decoration. A scanner instructed to evaluate the `:hover` pseudo-state will simply measure the
new `#ededed` background's ~1.17:1 ratio and emit a 1.4.11 violation, producing a false positive.
Knowing that the pointer position already conveys "hover," that the resting black border already
identifies the control, and that the wash is therefore non-required, all require reading the
designer's intent and the SC carve-out — semantic judgement, not pixel measurement.

## Citation
**Reference:** WCAG 2.2 Understanding Non-text Contrast (`wcag-understanding/non-text-contrast.html`)
> "The pointer itself, via its location, is the indicator of whether the user is hovering on a component. Therefore, additional author-supplied visual treatments for hover are not \"required to identify\" the hover state. Those treatments can be considered supplemental and do not themselves need to contrast 3:1 against the background."

**Reference:** WCAG 2.2 Understanding Non-text Contrast (`wcag-understanding/non-text-contrast.html`)
> "A checkbox is visually identified by its black border against a white background, but when the mouse pointer hovers on the checkbox, a subtle grey background is added (#DEDEDE). The black border has a 15:1 contrast ratio with the grey background, so the checkbox continues to have good contrast. Note that the grey hover effect does not itself need to contrast 3:1 with the page background, since the pointer position is the primary indicator of the hover state."
