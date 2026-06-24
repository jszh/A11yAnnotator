# case-05 — Four near-identical row-action menus; three return focus to their trigger (PASS), the visually-identical twin resets focus to `<body>` (FAIL)

## Scenario
A seller console shows an orders table where every row has an *Actions ▾* menu button. The menus are
markup-for-markup identical (button with `aria-haspopup`/`aria-expanded`, `role="menu"` with
`role="menuitem"` children, accessible names, correct on-open focus into the first item). Three of the
menus (rows 1, 3, 4) close correctly: selecting an item or pressing Escape returns focus to the *Actions*
trigger. The fourth menu (row 2, order #LG-90411) is a near-twin whose close handler calls
`document.activeElement.blur()` instead of returning focus to the trigger — so closing it drops focus to
`document.body` and the next Tab restarts from the sidebar navigation. The page as a whole **fails**
because of that one broken menu, which is indistinguishable from the others by sight or by static markup.

## Attribute tuple
- **Content domain:** e-commerce / seller order management console
- **UI component / pattern:** menu button (`aria-haspopup`) per table row — a paired PASS/FAIL near-twin
- **Host-language construct:** `role="menu"`/`role="menuitem"`, per-row IIFE handlers, `blur()` vs `trg.focus()`
- **Locale / i18n:** en-US, USD
- **Failure mechanism:** F85 close branch — one menu's close path blurs to `<body>` instead of returning to its trigger

## Developer persona
A team refactored row menus into a shared helper, but one engineer hand-edited the "On hold" row's menu
during a hotfix (to add the "Release hold" item) and, in the process, replaced `trg.focus()` with a
stray `document.activeElement.blur()` they had copied from a "close the menu on outside click" snippet.
Code review diffed the new menu item, not the focus-management one-liner, and every menu still *looked*
identical in QA, so the regression shipped on a single row.

## Element / selector carrying the issue
`#menu-2` / `#trg-2` close handler (row #LG-90411): on close it calls `document.activeElement.blur()`,
dropping focus to `document.body`. The correct sibling behavior is in `#trg-1`, `#trg-3`, `#trg-4`, whose
close paths call `trg.focus()`.

## Exact accessibility mechanism
For the passing menus, after a menuitem is chosen or Escape is pressed, `close(true)` runs `trg.focus()`,
returning the user to the *Actions* button they opened — the natural place to continue. For the failing
twin, `close()` runs `document.activeElement.blur()`; with no element focused, the browser falls back to
`document.body`. A screen-reader user who acts on order #LG-90411 is silently dumped at the document root;
a keyboard user sees the focus ring vanish and the next Tab lands on the first sidebar link ("Dashboard"),
far above the table row they were working on. This is F85 step 2's failure: keyboard focus is not "put
back on the trigger control" when the dialog/menu is dismissed. Because the meaning and operability of
the table is broken for that row, the page fails SC 2.4.3.

## Expected ACT-style outcome
**failed** (SC 2.4.3 — at least one menu, indistinguishable by markup from its passing siblings, drops
focus to `document.body` on dismissal instead of returning it to the trigger).

## Why automated tools miss it
All four menus are structurally identical and structurally valid; nothing in any DOM snapshot
distinguishes the broken one. The only difference is a single line in a JavaScript close handler that
runs at dismissal time. axe-core, WAVE, and Lighthouse never open each menu, select an item, and observe
where focus goes — and even if a tool checked one menu, it could not infer that a sibling with identical
markup behaves differently at runtime. Catching the broken twin requires a human to operate each menu by
keyboard and notice that closing row 2 throws focus to the top of the page while the others restore it
to the trigger.

## Citation
**Reference:** WCAG Technique F85 — Tests, step 2 (`wcag-techniques/failures/F85.html`)
> "Activate a control in the menu or dialog that causes it to close. … Check whether keyboard focus is put back on the trigger control"

**Reference:** WCAG 2.2 Understanding — Focus Order (`wcag-understanding/focus-order.html`)
> "When the dialog is dismissed, focus returns to the button or the element following the button."
