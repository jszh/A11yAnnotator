# case-04 — custom `<div role="slider">` that captures ArrowUp/Down AND Tab "to prevent value loss"

## Scenario
An e-commerce headphones store ("Lumen Audio") with a faceted-search sidebar. The "Max price" filter is a custom slider: `<div role="slider" tabindex="0">` with a correct accessible name and complete `aria-valuemin`/`aria-valuemax`/`aria-valuenow`/`aria-valuetext`. Arrow keys (and PageUp/Down, Home/End) adjust the price exactly as a slider should. The defect: the thumb's keydown handler ALSO captures `Tab` (and therefore `Shift+Tab`) with `preventDefault()` — "to prevent accidental value loss when you tab away mid-drag" — and exposes no `Esc` exit or instruction. Once focus lands on the thumb, the user can change the price but can never reach "Apply price filter", the brand checkboxes, or the product links.

## Attribute tuple
- **content-domain:** e-commerce product filtering (headphones)
- **UI-component / pattern:** custom `div[role="slider"]` (APG slider) with full ARIA value semantics
- **host-language construct:** `keydown` handler `preventDefault()`ing the `Tab` key on the slider thumb
- **locale / i18n:** en-US
- **failure-mechanism:** a single-element composite widget that owns the arrow keys legitimately but also confiscates Tab, leaving no standard exit and no advised alternate

## Developer persona
A front-end developer hand-rolled the slider from an APG example (which is why the ARIA value pattern is flawless). They later got a bug report that "tabbing while dragging snaps the value back to default," and "fixed" it by blocking Tab on the thumb entirely (`case 'Tab': e.preventDefault()`), not realizing this removes the only standard way off the slider. They never added an Esc handler or any "press X to leave the slider" text.

## Element / selector carrying the issue
`div#thumb[role="slider"]` — its `keydown` listener's `case 'Tab': e.preventDefault();` branch. The arrow/Page/Home/End value handling and the ARIA value attributes are all correct.

## Exact accessibility mechanism (what AT experiences, why it fails)
- The slider is a valid custom widget: `role="slider"`, focusable (`tabindex="0"`), named "Maximum price", with live `aria-valuenow`/`aria-valuetext`. Arrows raise and lower the price; a screen reader announces the new value. This is correct, expected slider behavior.
- A keyboard user tabs to the thumb and adjusts the price. Pressing `Tab` to continue to "Apply price filter" does nothing — the handler swallows it. `Shift+Tab` back to anything earlier is likewise blocked. There is no `Esc` exit and no instruction.
- Net: focus enters the slider, the arrows work, but the user is stranded on the thumb — the rest of the filter form and the product list are unreachable by keyboard. A screen-reader user is stuck on "Maximum price, slider".
- Verified with Puppeteer: `ArrowUp` changes `aria-valuenow` (arrows work — `arrowChangesValue: true`), while 6 consecutive `Tab` presses keep `document.activeElement` on `#thumb` and never reach `#applyPrice` or the checkboxes (`tabExitsToAfter: false`).

## Expected ACT-style outcome
**failed** — SC 2.1.2. Focus can be moved to the slider but not away from it by keyboard; arrows are legitimately captured but Tab is also confiscated, and no exit method is advised.

## Why automated tools miss it
axe-core reports zero violations (verified). The slider has complete, valid ARIA value semantics and an accessible name — a static checker actively *approves* it as a correctly built slider. The trap is the `preventDefault()` on Tab, observable only by pressing Tab on the thumb at runtime and confirming focus does not advance. Tools cannot distinguish a slider that captures only arrows (the correct, compliant behavior) from one that also swallows Tab (a trap), because both look identical in the DOM; telling them apart requires driving both arrows and Tab and knowing that a slider is supposed to release Tab even though it owns the arrows.

## Citation
> "There may be times when it's appropriate for a web page to restrict focus to a subsection of the content ... This does not fail the requirements of this criterion, as long as the user knows how to "untrap" the focus and leave that component."
— wcag-understanding/no-keyboard-trap.html (Intent — the slider restricts focus AND fails to tell the user how to leave)

> "If untrapping focus requires a different method (rather than unmodified arrow keys, the `Tab` key, or other "standard exit methods"), content can still pass this criterion provided that the user is advised how they can untrap focus using their keyboard interface."
— wcag-understanding/no-keyboard-trap.html (Intent — no such advice is provided here)

> "Providing a keyboard function to move the focus out of the subset of the content. Be sure to document the feature in an accessible manner within the subset."
— wcag-techniques/general/G21.html (Description — the documented-exit option that this page omits)
