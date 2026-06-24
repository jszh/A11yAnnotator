# case-04 — Live inline validation: red outline on "Confirm password" mismatch, static hint never changes

## Scenario
A "Change password" panel with **live (on-type) inline validation**. While the user types the "Confirm new password" field, JS compares it to "New password" and, on a mismatch, adds a class that paints a **red 2px outline** (`box-shadow + border-color #d31f2f`) on the confirm field. The hint below the field reads "Must match the new password above." — but that is a **permanent instruction**, present and identical whether or not the values match; it is not an error message and its wording never changes when the mismatch occurs. So the only signal that the two passwords currently disagree is the red outline. The page is pre-rendered in the mismatch state (`#cp` value differs from `#np`), so an evaluator lands directly on the failing condition.

## Attribute tuple
- **content-domain:** consumer webmail account-security settings
- **UI-component / pattern:** live inline-validation password-confirmation field (dynamic-state: "async/inline form validation")
- **host-language construct:** `input.mismatch` toggled by an `input` event listener; outline via `box-shadow`; a static `aria-describedby` hint
- **locale / i18n:** en-US
- **failure-mechanism:** F81 — error field identified by a color outline only; the "hint" is unconditional instruction text, so it does not serve as the required non-color error cue

## Developer persona
A product engineer added "instant" password-match feedback to reduce failed submits. They reused the field's existing describedby hint as if it were the error message ("it already says it must match"), and toggled a red outline class on mismatch. Because the hint text was already on screen, they reasoned the field "has a message" — missing that an always-present instruction does not tell the user the *current* value is wrong; only the red box does.

## Element / selector carrying the issue
`#cp.mismatch` — the Confirm-new-password input. On mismatch its only state change is the red outline (`box-shadow:0 0 0 2px #d31f2f`). The describedby `#cphint` is static instruction text that does not change to signal the error.

## Exact accessibility mechanism (what AT experiences / why it fails)
- **Sighted, full-color user:** sees the red outline appear as they type a non-matching value and corrects it.
- **Sighted color-blind / low-vision user:** the only thing that changes on mismatch is the outline hue (and a faint box-shadow). With color removed, a 2px gray-ish shadow is easily mistaken for ordinary focus/elevation; nothing in words tells them the values differ. The static hint reads the same in the matching and mismatching states, so it offers no live signal. This user cannot perceive that confirmation currently fails.
- **Screen-reader user:** the class toggle is silent (no `aria-invalid`, no live region, hint unchanged), so AT announces nothing on mismatch — a 3.3.1/4.1.3 gap; 1.4.1's specific failure is the absence of a **visible** non-color cue for the sighted color-blind user.

## Expected ACT-style outcome
**failed** (SC 1.4.1 — F81: a live error state conveyed by a red field outline only; the accompanying text is a static instruction, not a non-color error indicator).

## Why automated tools miss it
The error is reachable only by typing, and even then the field has a label, a describedby hint, and a CSS outline meeting contrast — automated checkers find nothing to flag. No rule classifies the live red outline as the *sole* error indicator, and no rule reasons that the describedby text is an unconditional instruction rather than a dynamic error message. Determining that the on-mismatch change is hue-only — and that the "hint" does not double as the non-color cue — requires a human to drive the live validation and judge the meaning of the unchanged text.

## Citation
> "In both examples, the color could be used without failure if the text was sufficiently different in visual presentation (e.g. bold or in a different font) that it would be easily differentiated from the surrounding text if the color were removed."
— wcag-techniques/failures/F81.html (Examples, note) — here the only on-mismatch change is hue, with no presentation/lightness difference.

> "If content relies on the user's ability to accurately perceive or differentiate a particular color an additional visual indicator will be required regardless of the contrast ratio between those colors. For example, knowing whether an outline is green for valid or red for invalid."
— wcag-understanding/use-of-color.html (Intent, note) — exactly the red-invalid-outline case.

> "Alternate text that appears on mouse-over of a visual element is not considered \"onscreen text.\""
— refs/trusted-tester/sc-1.4.1-use-of-color.md (Notes) — the page provides no qualifying onscreen non-color error text at all.
