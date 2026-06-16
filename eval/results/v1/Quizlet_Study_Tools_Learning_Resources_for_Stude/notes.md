# Evaluation Notes — Quizlet Home Page

## Driver / Snapshot Fidelity

- `adaptiveScripted=true`, `scriptsDisabled=false`: The page served in scripted mode with hydration. Dynamic behavior (clicks, keyboard, SR walk) is real.
- Global tabWalk capped at 50 stops; the page has at least 182 focusable elements (mobile menu button is at index 182). Many footer links and flashcard card links beyond stop 50 were not captured in the global walk.

## Off-Screen / Missing Shots

- **el3 (mobile menu button)**: No appearance shot (`appearanceShot=null`). Box x=-264 from collect.json confirms it is off-screen in desktop viewport. LocalTabWalk still reached it (index 182). Drive's `inViewport=true` at that stop appears to reflect that the element was scrolled into the OS viewport during the walk, but its static position is off-screen.
- **el16 (Math span, mobile sidebar)**: No appearance shot. Off-screen mobile nav child span.
- **el13, el14, el15, el17, el18, el19, el20** (footer links): All appear as near-blank white shots because the footer elements are at y > 3500 and the screenshot crop captured only a small region. The blank shots confirmed no focus ring was visible but also could not verify appearance context.
- **el10, el10_focus** (caret left button): Shots show a near-blank light-blue area — the button is at y=649 and the shot captured surrounding background rather than the button itself. This limited visual verification of the actual indicator but the real-tab-diff (visibleDiffPct=0) is authoritative.

## Driver Anomaly — caret left indicatorPresent override

- `el9` (caret left): `indicatorPresent=true` in drive.json because the driver detected a non-none `computedBoxShadow`. However, `visibleDiffPct=0` and visual inspection of el10.png vs el10_focus.png shows zero change. The box-shadow (`rgba(40,46,62,0.1)`) is a default card shadow present in the UNFOCUSED state — not a focus indicator. This is a driver false-positive; verdict overridden to REPRODUCED for 2.4.7.

## Axe Findings Not Reproduced / Clarified

- **color-contrast on `.AssemblyLink--large > span`** ("See how teachers use Quizlet"): Axe flagged as a violation. Verified: text is 20px bold (large text), effective background is rgb(219,223,255). Contrast = 4.03:1 which PASSES the 3:1 large-text threshold (WCAG 1.4.3). Axe did not account for large-text threshold. NOT REPRODUCED.
- **label-content-name-mismatch on `button[aria-label="Create"]`**: Axe flagged this as `serious`. Verified: the button has `aria-label="Create"` and a visible `<span>Create</span>`. The accessible name is "Create" and visible text is "Create" — they match. The SVG with `aria-label="add"` is a child, but the button's own `aria-label` takes precedence. WCAG 2.5.3 passes (visible text is contained in accessible name). NOT REPRODUCED (axe false positive).

## Sign-Up Form (forms[1]) Notes

- 5 fields: Month, Day, Year (selects), Email, Password. All have `aria-label` — labels pass 3.3.2.
- Empty `<label for="email">` and `<label for="password1">` elements exist (no text content). These are empty associated labels but do not override `aria-label`. Cosmetic issue, not a WCAG 3.3.2 failure.
- `data-req-fields` custom attribute used instead of `required`/`aria-required` — required state not conveyed to AT. However, since the scope of evaluation did not include the sign-up form as a sampled element for the sign-up flow, this is noted here rather than in a per-element record.
- `nativeValidationOnly=true` for both forms: error messages rely on browser native validation. No `aria-invalid`, no live error announcements. For the search form this is acceptable; for sign-up it may mean 3.3.1/3.3.3 defects on real submission (cannot verify without live backend).

## aria-required-children Violation

- Axe (critical): 4 `role="menu"` elements contain plain `DIV` children rather than `role="menuitem"`. Two menus are in the off-screen mobile sidebar (x=-264), two are 0×0 (collapsed desktop dropdowns). This is a real 4.1.2/1.3.1 violation in the DOM, but the affected menus are hidden/off-screen in desktop view and not sampled as elements. Captured at page-level in grouping-and-reading-order.

## aria-allowed-attr Violation  

- Axe (critical): 3 `<div type="button" aria-expanded>` elements (NavigationTabs + RightNavigationItem). These are role-less divs with `aria-expanded` which is only allowed on certain ARIA roles. These are wrapper/hidden divs; the actual focusable buttons in the nav are `<button>` elements without `aria-expanded`. The divs are likely event-delegation targets. Real 4.1.2 issue but on hidden/non-focusable divs.

## Focus Visibility Summary

- 41 of 50 global tabWalk stops have no outline/shadow. The 9 with outline/shadow include: Quizlet logo link, Learn/Study Guides/Flashcards/Practice Tests nav links, caret left/right buttons (but visibleDiffPct=0 on the carets), iOS/Android app buttons.
- The search input (el6/el7) and combobox wrapper have clear visible focus rings (blue/purple outline). These are the positive examples.
- Widespread 2.4.7 failure across interactive elements on the page: buttons, links, and icon links show no visible change when focused.
