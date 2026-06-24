# case-05 — Civic mega-menu submenu dismissible only by clicking elsewhere (no Esc, no toggle-close)

## Scenario
A city government site has a primary nav with a "Residents & Services" submenu. The submenu
opens on hover and on activation/focus of its toggle button, then **covers the page banner
and intro text**. The component looks careful — it has `aria-haspopup`, `aria-expanded`, and
`aria-controls`. But the **only** way it ever closes is a document-level *click* outside the
menu (pointer-only). There is **no Escape handler**, and clicking/activating the toggle only
*opens* it (no toggle-to-close). A keyboard or magnifier user who has opened the panel has no
way to dismiss the obscuring content without moving focus away from the trigger.

## Attribute tuple
- **content-domain**: government / civic services portal
- **UI-component/pattern**: mega-menu / dropdown nav submenu (WordPress-style)
- **host-language construct**: `document` *click*-outside dismiss with no `keydown`
- **locale/i18n**: en
- **failure-mechanism**: dismissible only by clicking elsewhere (moving the pointer off); no keyboard/Esc path

## Developer persona
An agency themed a WordPress/Divi-style nav for the city. They added the "right" ARIA
attributes from a checklist and a familiar "click outside to close" handler — the pattern
their CMS theme shipped. They never added an Escape handler because the menu "closed fine"
in their mouse testing, and `aria-expanded` toggling made the automated audit look complete.
The click-outside dismiss is invisible to keyboard users and forces magnifier users to move
the pointer.

## Element / selector carrying the issue
- FAIL: `button#svcToggle` + submenu `#svcMenu` — opens on focus/hover/activation, obscures
  the banner, and the only dismissal is a pointer click outside; no `keydown`/Escape and the
  toggle never closes it.

## Exact accessibility mechanism
A keyboard-only or low-vision magnifier user activates "Residents & Services." The submenu
expands and covers the "Residents & Services" banner and intro paragraph. SCR39 says they
should be able to press Escape (or activate the trigger again) to clear it while keeping
focus on the toggle. Here Escape is completely unhandled, and activating the toggle only
re-opens — so the only documented dismiss is a mouse click on empty page area, which a
keyboard user cannot perform and which forces a magnifier user to move the pointer away,
re-panning the viewport. The obscuring panel therefore cannot be dismissed without moving
focus/pointer away from the trigger. (The submenu is keyboard-reachable here, so this is
specifically a Dismissible failure, not a 2.1.1 operability failure.)

## Expected ACT-style outcome
**failed** — obscuring content on focus/hover whose only dismiss path is a pointer click
elsewhere; no keyboard/Esc mechanism that keeps focus on the trigger.

## Why automated tools miss it
The component carries all the ARIA a scanner checks for — `aria-haspopup`, `aria-controls`,
and an `aria-expanded` that actually toggles — so automated audits report it as a
well-formed, "accessible" menu. No tool exercises the open panel, presses Escape, and
verifies the obscuring content clears while focus stays on the toggle; nor can a tool tell
that the sole dismiss handler is a *click*-outside (pointer) with no keyboard equivalent.
Detecting this needs a human to open the menu by keyboard, try Escape and re-activation
(both fail), and reason that the only working dismiss requires the mouse. That is
interaction tracing across handler types, not a static attribute check.

## Citation
> **WCAG Technique SCR39 — Tests, Procedure (content that appears on focus)**
> "The content can be closed without moving the focus way from the trigger. Either by
> pressing Esc, by  pressing another other documented keyboard shortcut, or by activating
> the trigger."

> **WCAG 2.2 Understanding 1.4.13 — Dismissible**
> "Mouse users frequently move the pointer to pan the magnified viewport and display another
> portion of the screen. However, almost the entire portion of the page visible in this
> restricted viewport may trigger the additional content, making it difficult for a user to
> pan without re-triggering the content. A keyboard means of dismissing the additional
> content provides a workaround."
