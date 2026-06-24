# case-04 — Patient-portal segmented "appointment type" control where the focus border is identical to the selected-state border, so a focused-but-unselected segment is indistinguishable from the selected one (FAIL)

## Scenario
Northvale Health's MyChart appointment scheduler uses a three-option segmented control (a `radiogroup`
of "In-person / Video / Phone"). The selected option is shown with a `3px solid #0f8a8a` (teal) border.
The author reused that exact same `3px solid #0f8a8a` border as the `:focus` indicator and set
`outline:none`. The page renders with the *Video visit* segment selected and keyboard focus on the
*In-person visit* segment, which is NOT selected. Both segments now display the identical 3px teal
border. A sighted keyboard user sees two teal-bordered segments and cannot tell which is the chosen
value versus which merely has focus; as they arrow across, the moving focus border is indistinguishable
from the persistent selected border.

## Attribute tuple
- **Content domain:** healthcare / patient portal (appointment scheduling)
- **UI component / pattern:** segmented control implemented as an APG radio group (`role="radiogroup"` + `role="radio"` buttons with `aria-checked`)
- **Host-language construct:** identical `border: 3px solid #0f8a8a` on `[aria-checked="true"]` and on `:focus` (with `outline:none`); `autofocus` on an unselected option to render the collision
- **Locale / i18n:** en-US
- **Failure mechanism:** F78 (a/b hybrid) — the focus indicator is visually identical to a different state indicator (selection), so focus is not distinguishable and cannot be told apart from selection

## Developer persona
A developer building the segmented control first styled the selected state with a bold 3px teal border.
When asked to "add keyboard focus styling," they reused the existing selected-state border rule for
`:focus` because "it already looks like the highlighted state, so it's obviously focus too," and added
`outline:none` to suppress the default ring they considered redundant. In manual testing they only ever
clicked options (which both selects AND focuses the same element), so they never saw the case where
focus is on one segment while a *different* segment is the selected value.

## Element / selector carrying the issue
`.seg[aria-checked="true"]` (selected) and `.seg:focus` (focus) — both apply `border: 3px solid #0f8a8a`.
The focused element at load is the unselected *In-person visit* radio; the selected element is the
*Video visit* radio.

## Exact accessibility mechanism
A focus indicator IS rendered — the 3px teal border appears on the focused *In-person visit* segment.
But that exact treatment is also the selection indicator on the *Video visit* segment, so two segments
look identical and the user cannot determine (a) which option is currently chosen, nor (b) that focus is
distinct from selection. The "visual information necessary to indicate state" collapses two different
states into one appearance, so neither the focus state nor the selection state is reliably perceivable.
Crucially, both treatments have acceptable standalone contrast (teal #0f8a8a on white ~3.3:1), so this
is not a contrast-ratio shortfall — it is a state-distinguishability failure of the focus indicator,
exactly the F78 "outline that looks the same as the focus outline" mode applied to a selection outline.

## Expected ACT-style outcome
**failed** (SC 1.4.11, also implicates 2.4.7 / F78). The focus indicator is present but not perceivably
distinct from the selected-state indicator, so the focused control's state cannot be identified.

## Why automated tools miss it
The markup is exemplary: `role="radiogroup"`, `role="radio"`, `aria-checked` correctly exposed, and a
real author focus style present (so even an `outline:none`-with-replacement linter passes). The focus
border has fine contrast in isolation. axe-core / WAVE / Lighthouse cannot reason that the focus
treatment is byte-for-byte identical to the selection treatment and therefore fails to distinguish
"focused" from "selected." That requires rendering the live state (one segment selected, another
focused) and making the human judgment that two distinct states are visually indistinguishable — no
static rule performs this state-collision comparison.

## Citation
**Reference:** WCAG Technique F78 — Examples (`wcag-techniques/failures/F78.html`)
> "The following CSS example will create an outline around links that looks the same as the focus indicator. This makes it impossible for users to determine which one in fact has the focus, even though the user agent does draw the focus indicator."

**Reference:** WCAG 2.2 Understanding 1.4.11 — User Interface Components (`wcag-understanding/non-text-contrast.html`)
> "any visual information necessary to indicate state, such as whether a component is selected or focused must also ensure that the information used to identify the control in that state has a minimum 3:1 contrast ratio."
