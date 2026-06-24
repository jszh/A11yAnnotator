# case-06 — Stop-sign "Cancel order" button whose name describes the octagon shape

## Scenario
An order-confirmation screen in a food-delivery web app (Fork & Field) lets the user cancel
while the kitchen hasn't started. The cancel control is a red stop-sign graphic (an octagon
with a white bar) rendered as an inline `<svg role="img">`. The SVG's accessible name, set via
`<title>Red octagon</title>`, is a literally correct description of the depicted shape. The
button's purpose is to cancel the order, but its name describes the geometry. A second control
("Track driver") is correctly purpose-named for contrast. Sighted users read the stop sign as
"cancel"; a screen-reader user hears "Red octagon, button" and cannot tell it cancels the order.

## Attribute tuple
- **Content domain:** food delivery / e-commerce order management
- **UI component / pattern:** icon action button using an inline SVG with a `<title>` accessible name
- **Host-language construct:** `<button>` containing `<svg role="img" aria-labelledby>` + an `aria-hidden` text label
- **Locale / i18n:** en
- **Failure mechanism:** the SVG `<title>` (the control's accessible name) names the depicted shape ("Red octagon") instead of the action ("Cancel order")

## Developer persona
A designer-developer built the control from a shared SVG asset whose `<title>` was authored
for the design-system library as "Red octagon" (a neutral, reusable shape name). When they
dropped it into the cancel button they left the SVG title intact and made the visible "Cancel"
caption decorative (`aria-hidden="true"`) to avoid "double reading." The result: the button
relies on the shape-name title for its accessible name, so it announces "Red octagon."

## Element / selector carrying the issue
`button[data-action="cancel-order"] svg[role="img"] > title#stoptitle` (text "Red octagon").
Because the button's text caption is `aria-hidden`, the button's accessible name is computed
from the SVG's `aria-labelledby` title — so the cancel control announces "Red octagon".

## Exact accessibility mechanism
The button's only name-contributing content is the SVG, whose accessible name is its
`<title>` ("Red octagon") via `aria-labelledby`. The visible "Cancel" text is
`aria-hidden="true"` and contributes nothing. So AccName(button) = "Red octagon". A
screen-reader user hears "Red octagon, button" with no hint that it cancels the order — and
may avoid an unexplained control out of caution. The octagon genuinely is a red octagon, so
the name is *accurate about the depiction and wrong for the function*. The "Track driver"
control shows a purpose-named sibling.

## Expected ACT-style outcome
**failed** (SC 1.1.1, control-purpose limb). The non-text content is a control; its name must
describe its purpose ("Cancel order"), but "Red octagon" describes the image, so the
alternative does not serve the equivalent purpose. The control has a non-empty accessible name
and is keyboard-operable, so name/role checks pass.

## Why automated tools miss it
axe-core/WAVE/Lighthouse see a focusable control with a non-empty accessible name ("Red
octagon" via the SVG title) and report no violation. They do not interpret the
`data-action="cancel-order"` handler and cannot judge that "Red octagon" describes the shape
rather than naming the cancel action. Understanding that the stop-sign metaphor means "cancel"
and that the name should say so is a human semantic judgment.

## Citation
**Reference:** WCAG 2.2 Understanding Non-text Content (`wcag-understanding/non-text-content.html`)
> "For non-text content that is a control or accepts user input, such as images used as submit buttons, image maps or complex animations, a name is provided to describe the purpose of the non-text content so that the person at least knows what the non-text content is and why it is there."

**Reference:** WCAG Technique G94 (`wcag-techniques/general/G94.html`)
> "In deciding what text to include in the alternative, it is often a good idea to consider the following questions: Why is this non-text content here? What information is it presenting? What purpose does it fulfill? If I could not use the non-text content, what words would I use to convey the same function and/or information?"
