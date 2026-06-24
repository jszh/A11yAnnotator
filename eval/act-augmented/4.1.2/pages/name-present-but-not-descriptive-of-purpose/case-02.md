# case-02 — Image submit button named with the SVG asset filename

## Scenario
A money-transfer review screen in an online-banking dashboard (Northgate). The form is
submitted by an `<input type="image">` styled as a green "Confirm transfer" pill bearing a
forward-arrow glyph. The image button's accessible name is taken from its `alt`, which the
build pipeline left as the asset's filename: `alt="icon_arrow_forward_24dp.svg"`. The name is
non-empty and machine-valid, but it is a file path, not a description of what the control
does. For a control that moves $1,450 instantly and irreversibly, the announced name
"icon_arrow_forward_24dp.svg, button" identifies nothing.

## Attribute tuple
- **Content domain:** online banking / fintech dashboard
- **UI component / pattern:** transfer-review confirmation form with an image submit button
- **Host-language construct:** `<input type="image" alt="...">` (alt supplies the accessible name)
- **Locale / i18n:** en
- **Failure mechanism:** asset-filename string used as the accessible name (non-empty, non-descriptive)

## Developer persona
A designer exported the arrow icon from Figma as `icon_arrow_forward_24dp.svg`; an SVG-to-
image-button helper in the design-system tooling auto-populated `alt` with the file's
basename "so it's never empty," intending engineers to override it. On this screen nobody did.
The visible "Confirm transfer" caption is painted with an absolutely-positioned CSS span
(`aria-hidden="true"`), so QA saw a correct-looking button and the linter saw a non-empty alt.

## Element / selector carrying the issue
`form.actions input.confirm[type="image"]` — its `alt="icon_arrow_forward_24dp.svg"` is the
sole source of the accessible name. The real purpose ("Confirm transfer of $1,450 to M.
Okafor") lives in the surrounding `dl.review`, the visible caption span, and the arrow glyph,
none of which contribute to the name.

## Exact accessibility mechanism
For `<input type="image">`, the accessible name is computed from `alt`. AccName therefore =
"icon_arrow_forward_24dp.svg". A screen reader announces "icon_arrow_forward_24dp.svg, button";
a Braille user reads a filename; a voice-control user cannot guess the command target. The
role (button) is correct and the control is keyboard-operable — the defect is purely that the
name is a developer/asset string conveying no purpose, on a high-consequence action.

## Expected ACT-style outcome
**failed** (SC 4.1.2). The image button has a non-empty accessible name, so ACT rule
"Image button has non-empty accessible name" PASSES. The page fails 4.1.2 because the name is
not "important and appropriate information" identifying the control and does not communicate
its purpose.

## Why automated tools miss it
axe-core / WAVE / Lighthouse require only that `<input type="image">` have a non-empty `alt`;
a filename satisfies that, so they pass it. No automated rule recognizes that a string ending
in ".svg" is a path rather than a purpose, and none can read the transfer context to know the
button confirms a $1,450 transfer. Determining the name is meaningless requires understanding
the screen and the arrow icon — human semantic/visual judgment.

## Citation
**Reference:** WCAG Technique ARIA14 (`wcag-techniques/aria/ARIA14.html`)
> "users with assistive technologies rely on accessible names that clearly communicate the purpose of components, in this case “Close”."

**Reference:** WCAG 2.2 Understanding Name, Role, Value (`wcag-understanding/name-role-value.html`)
> "The intent of this success criterion is to ensure that Assistive Technologies (AT) can gather appropriate information about, activate (or set) and keep up to date on the status of user interface controls in the content."
