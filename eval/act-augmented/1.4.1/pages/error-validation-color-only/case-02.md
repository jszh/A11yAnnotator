# case-02 — Patient intake: invalid field LABELS turn red on submit (valid labels stay black)

## Scenario
A new-patient intake form for a family health clinic. On pressing **Submit intake form**, an inline script checks the required fields; for each empty one it turns that field's `<label>` **text red** (`#c01818`) while satisfied fields keep their **black** label. There is no inline error message per field, no error icon, no "(required)" / "(error)" word appended to any label — the label's hue is the only signal. A generic summary line ("Some required information is still missing.") appears but never names the failing fields. The page pre-fires the submit on load so an evaluator lands directly in the post-submit error state: here **Date of birth** and **Member ID** are empty, so their labels are red and the other five labels are black.

## Attribute tuple
- **content-domain:** healthcare / patient portal intake
- **UI-component / pattern:** multi-fieldset registration form, inline-on-submit validation
- **host-language construct:** `<label for>` correctly associated; error state applied by toggling `label.err { color:#c01818 }` only; small inline `submit` handler (no network)
- **locale / i18n:** en-US
- **failure-mechanism:** F81 — error fields identified by **label color** difference only (the first F81 example: required/error label color with no other indication)

## Developer persona
A clinic's part-time webmaster (a nurse who maintains the site) copied a "highlight invalid fields in red" snippet from a forum answer. The snippet toggled a `.err` class that only set `color:red` on the label. It looked correct in their test, where they could plainly see the two red labels, so they never added the accompanying icon or message the snippet's author had assumed would also be present.

## Element / selector carrying the issue
`label[for="dob"].err` and `label[for="member"].err` — the two labels whose only post-submit difference from the valid labels is `color:#c01818` (red) vs `#222b32` (near-black).

## Exact accessibility mechanism (what AT experiences / why it fails)
- **Sighted, full-color user:** spots the two red labels and corrects Date of birth + Member ID.
- **Sighted color-blind / low-vision user:** red (#c01818, L\* ≈ 39 on white) vs near-black (#222b32, L\* ≈ 22) — but the cue relies on *recognising the color as red = error*, and the labels are otherwise identical in weight, size, and content. Per the Understanding note, "knowing whether an outline is green for valid or red for invalid" relies on accurately perceiving a particular color and therefore needs an additional visual indicator regardless of contrast ratio. With seven visually-identical bold labels and no marker, this user cannot tell which two errored. The generic summary does not name them.
- **Screen-reader user:** hears the same `<label>` text regardless of the `.err` class (color is not announced) and gets the un-named summary — a parallel 3.3.1 gap, but 1.4.1's concern is the missing **visible** non-color cue for the sighted color-blind user.

## Expected ACT-style outcome
**failed** (SC 1.4.1 — F81: required/error fields identified using color differences only, applied to the label text with no non-color cue).

## Why automated tools miss it
The error state does not exist until the form is submitted, so a static page scan never sees it. Even after submit, every `<label>` is correctly associated via `for`, all label text exceeds contrast minimums, and a visible summary with `role="alert"` is present — axe/WAVE/Lighthouse report clean. No rule decides that a red label means "this field errored," and none verifies that a non-color cue accompanies it. Catching this requires triggering submit, observing that the only per-field distinction is hue, and applying F81 — human reasoning.

## Citation
> "A user is completing an online form, and the phone number field is required. To indicate that the phone number field is required, the label \"Phone Number\" is displayed in a color different from the color used for optional fields, without any other indication that \"Phone Number\" is a required field."
— wcag-techniques/failures/F81.html (Examples)

> "However, if content relies on the user's ability to accurately perceive or differentiate a particular color an additional visual indicator will be required regardless of the contrast ratio between those colors. For example, knowing whether an outline is green for valid or red for invalid."
— wcag-understanding/use-of-color.html (Intent, note)

> "The cue \"(required)\" is included within the label element."
— wcag-techniques/general/G205.html (Examples) — the sufficient technique this page omits: a text/character cue inside the label.
