---
name: focus-management
description: Drive Tab / Shift+Tab / Escape and record the focus trajectory to detect keyboard traps, illogical focus order, off-screen focusables, and missing focus return.
covers: cat_5 (primary, traps); cat_2 (modal focus), cat_8 (menu focus)
wcag: 2.1.2 No Keyboard Trap (A); 2.4.3 Focus Order (A); related 2.4.11 Focus Not Obscured (Minimum) (AA, WCAG 2.2)
instruments: Tab driver (/sr-drive — to wire), DOM geometry (--eval), AX tree (/ax-node)
behavioral: yes (requires a scripted serve)
---

## v3.2 division of labor

In Harness v3.2 you do NOT investigate or drive tools. The collector and the deterministic
runners already measured the page and HAND you their signals + the (realism-corrected) VSR
transcript + vision crops. Your job is to JUDGE MEANING over that evidence, not to re-run
`--eval`/`/ax-node`, walk the tab order yourself, or drive a submit.

- **Defer to the runner.** Where a deterministic runner already disposed an obligation (a CLAIM
  exists) you are NOT asked about it. The trajectory walk, the trap/Escape probe, and the
  hidden-but-focusable geometry scan are all RUNNER work now — when the runner has CLAIMED a
  trap (2.1.2), a confirmed DOM-vs-visual order divergence, or a ghost-stop disposition, that
  obligation is settled. Do not re-litigate it, and never re-judge an SC the runner owns (e.g.
  do not re-judge 1.4.3 contrast).
- **You only get the auto-PARTIAL residue.** The builder hands you the cases the runner could
  measure but could not *decide* — where deciding requires judging human meaning over the
  evidence rather than re-measuring it. That residue is the focus-order-meaningfulness and
  focus-not-obscured-adequacy questions below.
- KEEP every WCAG soundness caveat in this file: they are what STOP a false clear or a false
  barrier.

> **SC by sub-check.** A *trap* (focus can't leave) is **2.1.2** (A). *Illogical
> sequence* is **2.4.3** (A). *Off-screen / hidden focusable items* are a **2.4.3**
> problem (they're in the tab order but shouldn't be) and, because focus lands
> where the user can't see it, also touch **2.4.7** and **2.4.11 Focus Not
> Obscured (Minimum)** (AA, new in WCAG 2.2) — cite 2.4.11 with its level.

# focus-management

## When to run
Residue findings about focus order that jumps around relative to the visual layout, off-screen
carousel/overlay items still in the tab order, focus not moving into/returning from a dialog,
or a focused control that ends up covered by a sticky header/footer. The trap (2.1.2) and the
raw geometry scan are runner-owned; you are handed their output, you do not reproduce them.

## What you JUDGE
The runner measured *where focus goes* and *what occludes it*; you decide what that **means**
for two SCs it could not adjudicate on its own.

1. **Focus order meaningfulness (2.4.3, A).** The runner hands you the tab trajectory (spoken /
   DOM sequence) alongside the per-stop visual rects. A numeric divergence is not automatically
   a failure — 2.4.3 fails only when the sequence **affects meaning or operability**. Judge:
   does the handed order preserve the relationships and operability a sighted user relies on, or
   does it scramble them (focus leaps to the far right then back; nav reached after the main
   content it should precede; a multi-step form whose Tab order crosses steps)?
   - A divergence that is *meaning-preserving* (e.g. a visually two-column layout read column-
     by-column in a sensible order) is **NOT REPRODUCED**, even though the rects don't read
     strictly left-to-right / top-to-bottom.
   - A divergence that *breaks* meaning or operability (you can't complete the task in the order
     focus moves, or the sequence misrepresents the relationships) → **REPRODUCED**.
   - If the divergence is a *hidden-but-focusable ghost stop* the runner flagged (a control the
     user can't see still taking focus), the obligation is that the stop exists; your judgment is
     only whether landing there is meaningful to a user who can't see it — invisible focus stops
     are a 2.4.3 problem (in the tab order but shouldn't be).

2. **Focus-not-obscured adequacy (2.4.11, AA, WCAG 2.2).** The runner hands you the focused-state
   crop and the occluder geometry (sticky header/footer, cookie bar, overlay). 2.4.11 (Minimum)
   fails only when the focused element is **entirely** hidden by author-created content. Judge
   the *adequacy* of what remains visible:
   - The focused control is **wholly** covered by the occluder → **REPRODUCED** (2.4.11 AA).
   - Even a sliver of the focused control (or its focus indicator) remains visible → 2.4.11
     (Minimum) is **NOT REPRODUCED**. A *partly* obscured control is the AAA bar (2.4.12 Focus
     Not Obscured (Enhanced)), not the AA one — do not over-claim a partial occlusion as a
     2.4.11 (Minimum) failure.

## Evidence you are handed
You judge over exactly what the collector + runners supply — you do not gather more.

- **Precomputed a11y-eval signals (from `--eval`/`/ax-node`, already run):**
  - The **focus trajectory**: for each Tab / Shift+Tab stop, the `activeElement` xpath + its
    `getBoundingClientRect`, in sequence — both the DOM/spoken order and the per-stop visual
    rects. Use this for the 2.4.3 order judgment; do not re-walk it.
  - **Trap disposition (2.1.2):** the runner's verdict on whether, once focus enters a container
    (banner/modal/search), Tab/Shift+Tab cycle only within it and Escape fails to release. If the
    runner CLAIMED a trap, it is disposed — defer.
  - **Hidden-but-focusable "ghost" stops:** the geometry scan already classified every
    `tabIndex>=0` element not in `[aria-hidden=true]`/`[inert]`. It flagged any whose rect is
    off-viewport **OR** whose computed style is `opacity:0` / `clip-path` not `none` /
    `width|height ≈ 0` (e.g. a `clip-path:inset(50%)` toggle that stays `tabindex=0`, a
    `transform:translate(-9999px)` control, or an off-viewport carousel/cart-Close button). It
    also already knows `display:none` and `visibility:hidden` **remove** an element from the tab
    order — those are safe and are not flagged. You are handed the flag list; you do not re-scan.
  - **Occluder geometry for 2.4.11:** the rects of sticky / fixed / overlay author content
    relative to the focused control.
- **VSR announcement (realism-corrected transcript):** what the virtual screen reader voiced as
  focus moved through the trajectory and into/out of any dialog — including whether focus moved
  into an opened dialog and returned to the trigger on close. Read it; do not re-drive the act.
- **Declared vision crops:** the focused-state screenshot(s) the collector declared — the
  focused control with its indicator, and the occluding overlay/header where 2.4.11 is in play.
  Judge "wholly vs partly obscured" from these pixels, not from a re-render.

## Soundness caveats (these STOP a false clear or a false barrier)
- **2.4.3 is meaning-scoped, not geometry-scoped.** A rect ordering that diverges from strict
  left-to-right / top-to-bottom is NOT a failure unless it changes meaning or operability. Do
  not convert a numeric divergence into a 2.4.3 finding on its own.
- **Ghost-stop hiding has many forms.** Off-screen rect is only *one*; `opacity:0`,
  `clip`/`clip-path:inset(...)`, `transform:translate(-9999px)`, and 0×0 / `overflow:hidden`
  clamped sizes all hide a still-focusable control. But `display:none` and `visibility:hidden`
  *do* remove it from the tab order — treating those as ghost stops is a false barrier.
- **2.4.11 (Minimum) = ENTIRELY obscured.** A partially-covered focused control passes 2.4.11
  (Minimum); the partial bar is 2.4.12 (AAA). Cite 2.4.11 with its level (AA, WCAG 2.2) and do
  not promote a partial occlusion to an AA failure.
- **The trap behavior is JS-driven; the runner owns its reproduction.** A `noscript` serve
  removes the very handlers that trap, so a missing trap in a static snapshot is not a clear —
  that is exactly why trap disposition is RUNNER-owned and handed to you, not re-judged here.

## Output
One line: verdict **REPRODUCED** / **NOT REPRODUCED** / **PARTIAL** / **N/A**, with the SC cited
(2.4.3 A and/or 2.4.11 Minimum AA) and the handed evidence you relied on.
- **REPRODUCED** — focus order breaks meaning/operability, a flagged ghost stop takes focus, or a
  focused control is wholly obscured.
- **NOT REPRODUCED** — order is meaning-preserving and every focused control stays at least
  partly visible.
- **PARTIAL** — the auto-PARTIAL residue you can't fully decide from the handed evidence (e.g. the
  meaning-divergence needs a live open the snapshot couldn't produce); report the static signal.
- **N/A** — the runner already disposed the obligation (a trap CLAIM exists), or the SC routes
  elsewhere; defer and do not re-litigate.
