# case-05 — Multi-select listbox: "selected" shown only by a 4px left accent bar at 1.89:1 against the row background (the sole selection cue fails its adjacent surface)

## Scenario
An applicant-tracking system shows a candidate shortlist as a multi-select listbox. Two rows are
**selected** (added to the interview panel). The only visual cue that a row is selected is a 4px
left accent bar painted `#9FB4CF`. Selected rows are pinned to the `#EEF2F7` surface (so the only
thing that changes versus an unselected row is the painted bar), and the bar is **1.89:1** against
that surface — well under 3:1. A low-vision recruiter scanning the list cannot tell which two candidates are on the panel,
so the selected-state indicator fails 1.4.11, even though every text label and the avatar circles
have ample contrast.

## Attribute tuple
- **Content domain:** job board / ATS (recruiter candidate shortlist)
- **UI component / pattern:** multi-select listbox (APG listbox, `aria-multiselectable`) with a left-edge accent bar as the selected cue
- **Host-language construct:** `li.cand[aria-selected="true"] { border-left-color:#9FB4CF }` over row `background:#EEF2F7`
- **Locale / i18n:** en (international candidate roster; IST/CET/GCP context only)
- **Failure mechanism:** selected-state indicator (accent bar) vs adjacent surface (row background) at 1.89:1

## Developer persona
A dev cloned a "selected row" pattern from a Material-style table demo where selection was a
strong-colored left border plus a tinted row. To fit HirePath's airy, low-chroma brand, the
designer desaturated everything: the selected row tint was dropped entirely and the accent bar
softened to a pale `#9FB4CF` so it "wouldn't fight the content." They verified `aria-selected`
toggled correctly (it does) and that screen readers announced "selected," and considered selection
"accessible." Nobody checked the only remaining *visual* cue — the pale bar — against the pale rows.

## Element / selector carrying the issue
`li.cand[aria-selected="true"]` sets `border-left-color:#9FB4CF` and pins the row
`background:#EEF2F7`. The accent bar is the selection mark; its adjacent surface is the row
background it abuts (`#EEF2F7`), giving **1.89:1**. There is no other visual selected cue — no
checkmark, no extra background change, no bold.

## Exact accessibility mechanism
Screen-reader users are fine: each row is `role="option"` with `aria-selected="true"/"false"` in an
`aria-multiselectable` listbox, so "selected" is announced. The failure is visual and affects a
sighted low-vision recruiter: the 1.89:1 bar is nearly indistinguishable from the row edge, so the
*selected state* — which rows are on the interview panel — cannot be perceived. Per the
Understanding, "any visual information necessary to indicate state... whether a component is
selected" must meet 3:1 against the adjacent colors; here the adjacent color is the row background,
and 1.89:1 fails. This is distinct from Use of Color (1.4.1) because the bar is a position/shape
mark, not merely a hue swap of existing content — the problem is its *contrast*, which lands it
squarely in 1.4.11.

## Expected ACT-style outcome
**failed** (SC 1.4.11). The selected-state indicator (left accent bar) does not meet 3:1 against its
adjacent surface (the row background). Correct `aria-selected` exposure does not satisfy the visual
contrast requirement.

## Why automated tools miss it
`aria-selected` is present and correct, so state-exposure checks pass. axe/WAVE/Lighthouse measure
text contrast (all the row text passes) and have no rule that treats a `border-left-color` as a
selection indicator and tests it against the row fill. There is no foreground/background text pair
to flag. Recognizing that the thin left bar is the *only* selected cue, and that its adjacent color
is the row background, is human visual judgment. The DOM is clean, well-formed APG listbox markup.

## Citation
**Reference:** WCAG 2.2 Understanding SC 1.4.11 Non-text Contrast (`wcag-understanding/non-text-contrast.html`)
> "any visual information necessary to indicate state, such as whether a component is selected or focused must also ensure that the information used to identify the control in that state has a minimum 3:1 contrast ratio."

**Reference:** WCAG 2.2 Understanding SC 1.4.11 Non-text Contrast (`wcag-understanding/non-text-contrast.html`)
> "Identify the visual (non-text) indicators of the component that are required to identify that a control exists, and indicate the current state. In the default (on page load) state, test the contrast ratio against the adjacent colors."

**Reference:** WCAG 2.2 Understanding SC 1.4.11 Non-text Contrast (`wcag-understanding/non-text-contrast.html`)
> "For user interface components 'adjacent colors' means the colors adjacent to the component."
