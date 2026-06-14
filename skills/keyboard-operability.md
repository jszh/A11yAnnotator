---
name: keyboard-operability
description: Determine whether an interactive element can be reached AND operated with the keyboard, by driving Tab to it and act()/press to exercise it — not just inspecting tabindex.
covers: cat_4 (primary); cat_5 (focus order)
wcag: 2.1.1 Keyboard (A); 4.1.2 Name, Role, Value (A); for drag/gesture controls also 2.5.7 Dragging Movements (AA, WCAG 2.2) and 2.5.1 Pointer Gestures (A)
instruments: DOM (--eval), Tab driver (/sr-drive — to wire), VSR act()/press (/sr-act — to wire), AX tree (/ax-node), vision
behavioral: yes (requires a scripted serve; results only hold where the snapshot hydrates)
---

# keyboard-operability

## When to run
Findings about pointer-only controls, custom widgets that don't respond to keys,
charts/maps with no keyboard path, or `<div>`/`<span>` "buttons".

## Procedure
1. **Looks-interactive check (vision)** — screenshot; confirm the thing presents
   as a control. If it looks like a button/link, it must be operable.
2. **Reachability (Tab driver)** — from the top, press Tab repeatedly (cap ~200),
   recording `document.activeElement` each step. Does focus ever land on the
   target? A control that never appears in the Tab sequence (the Openroll
   "Login" `<div>`: `role/tabindex/href` all null) = **REPRODUCED** (unreachable).
3. **Semantics** — `/ax-node`: a reachable-but-roleless element (`role:generic`,
   no name) still fails 4.1.2. axe `nested-interactive` for `<button>`-in-`<a>` /
   `<a>`-in-`<button>` (o11 Excel toggle).
4. **Operability (act/press) — test the *role-expected* keys.** "Operable" is
   role-specific (ARIA Authoring Practices): a `menu` / `tablist` / `listbox` /
   `radiogroup` / `slider` is driven by **arrow keys** (+ Home/End/Esc), not just
   Enter/Space; a `dialog` needs Esc. Tab to the control, identify its role
   (`/ax-node`), then press the keys that role *should* honor and observe the
   effect. Testing only Enter/Space on an arrow-driven widget gives a false
   verdict. A focusable element that ignores its expected keys = **REPRODUCED**.
   For data viz, confirm whether data points are focusable at all (Yahoo chart:
   435 `<path>`, 0 focusable).
5. **Pointer-only affordances** — hover-only menus and **drag operations**
   (Zillow draw-to-select). No keyboard path to initiate → **REPRODUCED**. Note
   the SC: a **drag** that has no single-pointer alternative also fails **2.5.7
   Dragging Movements** (AA, WCAG 2.2); a path/multipoint **gesture** fails **2.5.1
   Pointer Gestures** (A) — cite these alongside 2.1.1, with their levels. If the
   control isn't in the snapshot, **NOT FOUND**.

## Classify
- **REPRODUCED** — target unreachable by Tab, or reachable but unresponsive to keys, or roleless custom control.
- **PARTIAL** — reachable + has handlers, but the snapshot's JS won't run faithfully to confirm the key response.
- **NOT REPRODUCED** — reachable, properly-roled, and responds to keys.
- **NOT FOUND** — control rendered only at runtime / not captured.

## Limits
Key responses depend on the page's JS executing. On `noscript`-served SPAs the
handlers are inert — fall back to the semantic/reachability checks and mark PARTIAL
for the operability half.
