# case-01 — `role="menu"` roving-tabindex dropdown that also `preventDefault()`s Tab (no exit)

## Scenario
A restaurant online-ordering site ("Saffron & Sage Kitchen") with a "Browse menu" dropdown built as an APG-style `role="menu"` with `role="menuitem"` children. Arrow keys move among the dishes (roving tabindex: one item `tabindex="0"`, the rest `-1`). The keydown handler ALSO captures `Tab` and `Shift+Tab` with `preventDefault()` and remaps them to item-to-item movement, so once focus enters the open menu it can never leave to the promo-code field or the "Apply & continue to checkout" button. There is no `Esc` handler and no documented escape.

## Attribute tuple
- **content-domain:** restaurant menu & online ordering
- **UI-component / pattern:** APG `menu` / `menuitem` dropdown with roving tabindex
- **host-language construct:** `addEventListener('keydown')` calling `e.preventDefault()` on the `Tab` key
- **locale / i18n:** en-US
- **failure-mechanism:** composite-widget arrow capture extended to Tab — arrows move within, but Tab is swallowed so focus cannot exit the subsection

## Developer persona
A junior developer adapted a "fully keyboard-accessible dropdown menu" snippet found on a blog. The snippet handled arrows correctly, but they added a `case 'Tab'` branch themselves because during testing the focus ring would "fall out of the dropdown unexpectedly" when tabbing; blocking the browser default felt like the tidy fix. They never tested whether anything came *after* the menu in the tab order.

## Element / selector carrying the issue
`ul#orderMenu[role="menu"]` — specifically its `keydown` listener's `case 'Tab': e.preventDefault();` branch. The roving items are `li[role="menuitem"]`.

## Exact accessibility mechanism (what AT experiences, why it fails)
- The menu is structurally correct: `role="menu"`, five `role="menuitem"` children, a valid roving tabindex, an accessible name via `aria-labelledby`, and a correct `aria-expanded` toggle on the trigger button.
- A keyboard user opens the menu (Enter on "Browse menu") and lands on "Wood-fired flatbreads". Arrow keys cycle through the dishes — exactly the expected composite-widget interaction.
- Pressing `Tab` (or `Shift+Tab`) does NOT advance to the promo field or checkout button: the handler intercepts it and just moves to the next/previous menu item. Focus is confined to the five items forever.
- A screen-reader user in focus/forms mode is stuck on the menu; there is no `Esc` close and no on-screen instruction naming any alternate exit key, so the SC's "advised of the method" escape hatch is also absent.
- Verified with Puppeteer: after opening the menu, 6 consecutive `Tab` presses keep `document.activeElement` on `role="menuitem"` and never reach `#promo` or `#applyBtn` (`tabExitsToAfter: false`).

## Expected ACT-style outcome
**failed** — SC 2.1.2. Focus can be moved *to* the menu but not *away* from it using the keyboard; arrows and Tab are both confined to the widget, and no alternate exit method is advised.

## Why automated tools miss it
axe-core reports zero violations on this page (verified). The DOM is a valid, named, structurally complete ARIA menu with a correct roving tabindex — there is no missing/empty attribute or bad role to flag. The trap exists only at runtime, when the `keydown` handler calls `preventDefault()` on the `Tab` key. No static analyzer dispatches a real `Tab` keypress inside the open menu and then checks whether `document.activeElement` advanced past the last item. Distinguishing a menu that captures only arrows (perfectly fine) from one that *also* swallows Tab (a trap) requires driving both key classes and understanding the widget's intended interaction model — human judgment, not markup analysis.

## Citation
> "Keyboard focus is not considered trapped when the user can navigate away from a component using only a keyboard interface, and if it only requires unmodified arrow or `Tab` keys or other "standard exit methods"."
— wcag-understanding/no-keyboard-trap.html (Intent)

> "If untrapping focus requires a different method (rather than unmodified arrow keys, the `Tab` key, or other "standard exit methods"), content can still pass this criterion provided that the user is advised how they can untrap focus using their keyboard interface."
— wcag-understanding/no-keyboard-trap.html (Intent)

> "Ensuring that the keyboard function for advancing focus within content (commonly the tab key) exits the subset of the content after it reaches the final navigation location."
— wcag-techniques/general/G21.html (Description — the sufficient technique this page violates)
