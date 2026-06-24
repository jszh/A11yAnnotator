# case-06 — Embedded ARIA grid that captures Tab/Shift+Tab and never releases focus (F10 trap, FAIL)

## Scenario
A fitness training-log web app (Cadence). The "Build your weekly plan" page embeds an interactive
session grid (`role="grid"` / `role="gridcell"`, roving `tabindex`) inline on an ordinary page —
**not** a modal dialog. Below the grid sit a **Save plan** button, a "Skip to dashboard" link, and a
footer nav (Help / Privacy / Sign out). Arrow keys move between cells and Enter/Space toggle a
session — all correct APG grid behaviour. The defect: the keydown handler intercepts **Tab and
Shift+Tab** at the grid's edges and *wraps focus back into the cells* instead of letting it leave.
Because there is no standard exit method out of the grid, every control after it is unreachable from
the keyboard. The only release is an undocumented, non-standard combo (**Ctrl+Shift+ArrowDown**),
named nowhere — so no advice is owed-and-given. A keyboard user who tabs into the grid is trapped.

## Attribute tuple
- **Content domain:** fitness / training-tracker SaaS (weekly session planner)
- **UI component / pattern:** inline ARIA data grid (`role=grid`/`role=gridcell`, roving tabindex) — NOT a dialog
- **Host-language construct:** `table[role=grid]` with a keydown handler that `preventDefault()`s Tab/Shift+Tab and re-focuses cells
- **Locale / i18n:** en
- **Failure mechanism:** Tab (the canonical standard exit method) is captured and wrapped inside a non-modal embedded widget, so focus cannot leave it; the only escape is a non-standard, unadvised combo — the F10 "focus stuck in an embedded widget" trap

## Developer persona
A front-end developer built the planner grid from an APG grid example. Beta testers complained that
"Tab jumps out of the grid before you finish editing the week," so the developer added a tweak to
"keep the grid keyboard-self-contained": Tab and Shift+Tab now cycle the cells instead of leaving.
They wired a private Ctrl+Shift+ArrowDown shortcut to jump to Save for their own testing and never
documented it. Because they only ever drove the grid with arrows and that shortcut, they never
noticed that an ordinary keyboard user can no longer Tab past the grid to Save plan or anything
below it. Mouse users are unaffected, so it shipped.

## Element / selector carrying the issue
`#plan` (`table[role=grid]`) — the FAILING widget. Its `keydown` listener calls
`e.preventDefault()` for both Tab and Shift+Tab and re-focuses a grid cell, so focus never escapes.
The controls stranded behind the trap are `#saveBtn` (Save plan), `#dashLink` (Skip to dashboard),
and the footer links `#helpLink` / `#privacyLink` / `#signoutLink`.

## Exact accessibility mechanism
A keyboard/AT user tabs to the grid (one Tab stop, roving tabindex — correct). Inside, arrows move
cell-to-cell and Enter/Space toggle sessions. When they press **Tab** to continue to Save plan,
the handler suppresses it and moves focus to the next *cell*; at the last cell Tab wraps to the
first cell, and Shift+Tab wraps the other way — focus orbits inside the grid forever. No unmodified
arrow or Tab key, and no other standard exit method, releases focus from this region, and the grid
is **not** a modal, so it has no legitimate reason to contain focus. The Save plan button, the
dashboard link, and the entire account footer are now keyboard-unreachable. The only way out is the
undocumented Ctrl+Shift+ArrowDown, a non-standard method the page never advises — so the SC's
conditional-pass clause is not satisfied either. This is exactly the F10 failure: the user can enter
the content with the keyboard but cannot exit it. The page fails.

## Expected ACT-style outcome
**failed** (SC 2.1.2). Keyboard focus can be moved *to* the grid but cannot be moved *away* from it
using a standard exit method: unmodified Tab/Shift+Tab are intercepted and wrap focus back into the
grid, and the only working escape (Ctrl+Shift+ArrowDown) is a non-standard combo that is not advised
to the user.

## Why automated tools miss it
The grid is structurally exemplary — `role=grid`, `role=gridcell`, a single Tab stop with roving
`tabindex`, an accessible name (`aria-label="Weekly session plan"`), header cells with `scope`, and
proper arrow-key/Enter/Space handling. axe-core, WAVE and Lighthouse parse the DOM and see a valid,
well-formed grid; nothing in the static markup is wrong. The trap exists only in the runtime keydown
logic and only manifests when Tab is pressed repeatedly: a static scanner never presses Tab, never
observes that focus fails to advance past the grid, and cannot judge that a *non-modal* widget has
no right to contain focus. Catching it requires driving Tab/Shift+Tab through the page, noticing that
focus is stuck inside the grid, recognising that the live arrow-key movement is a red herring (only
Tab determines whether focus can leave), and confirming the controls below the grid are unreachable.

## Citation
**Reference:** WCAG 2.2 Understanding — No Keyboard Trap (`wcag-understanding/no-keyboard-trap.html`)
> "Keyboard focus is not considered trapped when the user can navigate away from a component using only a keyboard interface, and if it only requires unmodified arrow or Tab keys or other \"standard exit methods\"."

**Reference:** WCAG Techniques — F10 (`wcag-techniques/failures/F10.html`)
> "Applies when content creates a situation where the user can enter the content using the keyboard, but cannot exit the content using the keyboard."

**Reference:** Trusted Tester v5.1.3, Test 4.C — How to Test (`refs/trusted-tester/sc-2.1.2-no-keyboard-trap.md`)
> "Use standard navigation keys (e.g., TAB, SHIFT+TAB, arrow keys, CTRL+TAB, etc.) to navigate through all keyboard focusable elements on the page. ... Determine whether there are any instances where keyboard navigation becomes trapped."
