# case-02 — Nav "Menu ▾" flyout rendered last in the DOM, focus not moved

## Scenario
A single-location restaurant ordering site (Saffron & Smoke). The top bar has a "Menu ▾" button at
the right. Activating it reveals a navigation flyout (Full Menu, Reservations, Order Online, …)
positioned visually directly under the button. The flyout's markup is the **last element in the
`<body>`**, and the click handler only flips a `.open` class and `aria-expanded`; it never moves
focus into the menu.

## Attribute tuple
- **content-domain:** restaurant menu & online ordering
- **UI-component/pattern:** menu button (`aria-haspopup`) revealing a `role="menu"` flyout
- **host-language construct:** vanilla JS `classList.toggle` (ported from a jQuery dropdown snippet); flyout at end of `<body>`, `position:fixed`
- **locale/i18n:** en
- **failure-mechanism:** F85 open branch / TT 4.F step 2b — revealed menu not next in sequential navigation order, no focus move

## Developer persona
A restaurant owner's nephew "who knows a bit of code" wired up the navigation from a jQuery
"responsive dropdown menu" tutorial. The tutorial appended the menu markup at the bottom of the body
and `.fadeToggle()`'d it on click. He correctly added `aria-haspopup`, `aria-expanded`, and
`role="menuitem"` (he read that ARIA is good), which makes the markup *look* accessible — but he
never added the APG-required focus move into the menu, and only ever clicked it with a trackpad.

## Element / selector carrying the issue
`#menuToggle` (trigger in the top bar) and `#navFlyout` (the `role="menu"` block immediately before
`</body>`). The defect is that the menu is not adjacent to the trigger in the tab order and the
handler performs no focus move.

## Exact accessibility mechanism (what AT experiences, why it fails)
A keyboard user Tabs to "Menu ▾" and presses Enter/Space. The flyout fades in below the button.
`aria-expanded` flips to `true`, so a screen reader even announces "expanded" — reinforcing the
illusion that things are working. But focus is still on the button, and the menu is the *last* node
in the DOM. Per F85 step 1: focus was not set to the menu or a `menuitem`, **and** moving focus
forward once does not enter the menu — the next Tab jumps to "Start your order" (the first link in
source order), then through every dish's "Add to order" link and the footer. The six menu items the
user just summoned are unreachable until the very end of the tab sequence. Both step-1 checks are
false; the failure applies. (A proper menu button per APG would focus the first `menuitem` on open
and trap arrow/Tab navigation within the menu.)

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
The flyout is *more* correct on paper than most: real `role="menu"`/`role="menuitem"`, working
`aria-haspopup`, and `aria-expanded` that actually updates. Nothing is missing or empty, so axe,
WAVE, and Lighthouse pass. Crucially, `aria-expanded="true"` would even nudge a naive heuristic
toward "this is fine." The real failure — that activating the trigger leaves focus stranded and the
revealed menu sits at the end of the tab order rather than adjacent to its trigger — is a runtime,
multi-state keyboard behavior. A static scanner sees a hidden `role="menu"` div somewhere in the DOM
and has no way to know it should be the user's next Tab stop.

## Citation
> **WCAG Technique F85, Description:**
> "When the user opens the dialog or menu embedded on the page by activating a button or link, their next action will be to interact with the dialog or menu. If focus is not set to the dialog or menu, or a logical focusable descendent of these widgets, and the widget or a focusable descendent is not next in the sequential navigation order, it will be difficult for the keyboard user to operate the dialog or menu."

(Verbatim from `wcag-techniques/failures/F85.html`.)

> **Trusted Tester v5.1.3, Test 4.F — How to Test, step 2b:**
> "It may be necessary to use the keyboard to **activate trigger controls that reveal hidden content** with focusable elements (menus, dialogs, modal dialog boxes, expandable tree list) to check the focus order to, from, and within the revealed content."

(Verbatim from `refs/trusted-tester/sc-2.4.3-focus-order.md`. Activating "Menu ▾" and checking the
focus order to the revealed flyout is exactly this manual step; the flyout is not next in order.)
