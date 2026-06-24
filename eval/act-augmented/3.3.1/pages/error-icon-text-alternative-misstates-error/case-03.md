# case-03 — Out-of-range donation amount, icon-font ligature `aria-label="error_outline"` (describes the picture)

## Scenario
A nonprofit one-time-gift form ("Riverkeeper Trust"). Single online gifts are capped at $10,000; the donor typed `25000`, a genuine out-of-range error. The error indicator is a Material-Icons-style icon-font glyph (`role=img`). Its accessible name is the literal ligature key the developer copied from the icon set: `aria-label="error_outline"` — the *name of the glyph*, which describes the picture (an outlined error symbol), not the donation error.

## Attribute tuple + developer persona
- **content-domain:** nonprofit / charitable donation
- **UI-component / pattern:** icon-font glyph (`span[role=img]`) as the error indicator
- **host-language construct:** `aria-label` populated from the icon-font ligature name
- **locale / i18n:** en-US
- **failure-mechanism:** text alternative describes the picture / icon identity ("error_outline"), not the error's cause or field
- **developer persona:** A junior dev integrating an icon font wired the accessible name straight from the ligature string they pasted (`<span class="material-icons">error_outline</span>`), then "added accessibility" by copying that same token into `aria-label`. They thought naming the icon was enough; they didn't realise "error_outline" is the asset's filename, not a description of the donation problem.

## Element / selector carrying the issue
`span#amount-icon[role="img"]` (`aria-label="error_outline"`) beside `input#amount` (value `25000`, `aria-invalid="true"`), which exceeds the stated $10,000 online maximum.

## Exact accessibility mechanism (what AT experiences, why it fails)
- The glyph exposes a valid `role=img` with a non-empty accessible name, associated to the amount field via `aria-describedby`.
- A screen-reader user hears "error_outline" — a glyph identifier. It conveys neither the cause (amount exceeds the $10,000 single-gift maximum) nor even that this concerns the amount field. It is an appearance/identity string, not an error description.
- The visible state (25000, red border, the "$5 to $10,000" note) makes the real error unambiguous to sighted users; the text alternative encodes none of it.
- CDP accessibility tree confirms `name="error_outline"` (rendered, not ignored).

## Expected ACT-style outcome
**failed** — the indicator carries a text alternative, but it describes the icon (its ligature/appearance) rather than identifying and describing the input error.

## Why automated tools miss it
The element has `role=img` and a non-empty accessible name, so axe/WAVE/Lighthouse treat it as a properly-labelled graphic — there is no empty-name or missing-role finding. Tools cannot know that "error_outline" is an icon-set token rather than a meaningful error description, nor that the value 25000 exceeds the range. Distinguishing a describes-the-picture alternative from a describes-the-error alternative is a semantic judgment.

## Citation
> "The "in text" portion of the success criterion underscores that it is not sufficient simply to indicate that a field has an error by putting an asterisk on its label or turning the label red. A text description of the problem should be provided."
— wcag-techniques/general/G84.html (Description)

> "the user enters a bid that is below the previous bid or the minimum bid increment."
— wcag-understanding/error-identification.html (Intent — example of an out-of-range/allowed-value input error, analogous to the over-maximum donation here)
