---
name: focus-management
description: Drive Tab / Shift+Tab / Escape and record the focus trajectory to detect keyboard traps, illogical focus order, off-screen focusables, and missing focus return.
covers: cat_5 (primary, traps); cat_2 (modal focus), cat_8 (menu focus)
wcag: 2.1.2 No Keyboard Trap (A); 2.4.3 Focus Order (A); related 2.4.11 Focus Not Obscured (Minimum) (AA, WCAG 2.2)
instruments: Tab driver (/sr-drive — to wire), DOM geometry (--eval), AX tree (/ax-node)
behavioral: yes (requires a scripted serve)
---


> **SC by sub-check.** A *trap* (focus can't leave) is **2.1.2** (A). *Illogical
> sequence* is **2.4.3** (A). *Off-screen / hidden focusable items* are a **2.4.3**
> problem (they're in the tab order but shouldn't be) and, because focus lands
> where the user can't see it, also touch **2.4.7** and **2.4.11 Focus Not
> Obscured (Minimum)** (AA, new in WCAG 2.2) — cite 2.4.11 with its level.

# focus-management

## When to run
Findings about focus traps (cookie banner, search field, modal), focus order that
jumps around, off-screen carousel/overlay items still in the tab order, or focus
not moving into/returning from a dialog.

## Procedure
1. **Trajectory walk** — from a chosen start, press Tab N times (cap ~200),
   recording each `activeElement` (xpath + `getBoundingClientRect`). Then
   Shift+Tab back the same count.
2. **Trap (2.1.2)** — if, once focus enters a container (banner/modal/search),
   subsequent Tab/Shift+Tab cycle only within that container and **Escape doesn't
   release** it, that's a trap → **REPRODUCED**. The signature: the trajectory's
   element set stops growing and revisits the same nodes.
3. **Order (2.4.3)** — compare the Tab trajectory's reading sequence to visual
   left-to-right / top-to-bottom order (bounding boxes). Large divergence
   (focus leaps to the far right then back) = **REPRODUCED**.
4. **Hidden-but-focusable "ghost" stops** — reachable controls the user can't see.
   Off-screen rect is only **one** way to hide them; check the others too, or you'll
   miss real cases:
   - rect fully outside the viewport (Rotten Tomatoes carousel; Reebok cart Close at x=1767);
   - `opacity:0`, `visibility:hidden`'s cousins, **`clip`/`clip-path:inset(...)`**
     (the Notion billing toggle hides its radios with `clip-path:inset(50%)` yet
     they stay `tabindex=0`), `transform:translate(-9999px)`, or 0×0 / `overflow:hidden` clamped size.
   `--eval`: for each `tabIndex>=0` element not in `[aria-hidden=true]`/`[inert]`,
   flag it if `getBoundingClientRect()` is off-viewport **OR** its computed style is
   `opacity:0` / `clip-path` not `none` / `width|height ≈ 0`. Any such element that
   still takes focus → **REPRODUCED**. (Note: `display:none` and `visibility:hidden`
   *do* remove it from the tab order — those are safe.)
5. **Dialog focus** — open a dialog (via act); assert focus moves into it and,
   on close, returns to the trigger.

## Classify
- **REPRODUCED** — focus cannot escape a region, order diverges from visual, or off-screen/hidden focusables exist.
- **PARTIAL** — the static precondition (e.g. `tabindex=-1` inputs, fixed banner with no Escape handler) is present but the trap needs live JS that the snapshot won't run.
- **NOT REPRODUCED** — focus flows logically and escapes every container.

## Limits
A genuine trap is JS-driven; a `noscript` serve removes the very handlers that
trap. Off-screen-focusable and DOM-order checks are static and always valid;
the trap/Escape behavior needs a faithful scripted serve.
