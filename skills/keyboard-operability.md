---
name: keyboard-operability
description: Determine whether an interactive element can be reached AND operated with the keyboard, by driving Tab to it and act()/press to exercise it — not just inspecting tabindex.
covers: cat_4 (primary); cat_5 (focus order)
wcag: 2.1.1 Keyboard (A); 4.1.2 Name, Role, Value (A); for drag/gesture controls also 2.5.7 Dragging Movements (AA, WCAG 2.2) and 2.5.1 Pointer Gestures (A)
instruments: DOM (--eval), Tab driver (/sr-drive — to wire), VSR act()/press (/sr-act — to wire), AX tree (/ax-node), vision
behavioral: yes (requires a scripted serve; results only hold where the snapshot hydrates)
---


# keyboard-operability

## v3.2 division of labor
In Harness v3.2 you do NOT investigate or drive tools. The collector and the deterministic
runners already measured the page — they ran the Tab walk, queried the AX tree, exercised the
role-expected keys, and probed drag/gesture affordances — and they HAND you their signals + the
(realism-corrected) VSR transcript + the declared vision crops. Your job is to **JUDGE MEANING**
over that handed evidence, not to re-run `--eval`/`/ax-node`, not to "drive a submit", not to
"Reproduce" anything yourself.

**Defer to the runner.** Where a deterministic probe already disposed an obligation (a CLAIM
exists — the synthetic Tab/key/drag probe reached a verdict on its own), you are NOT asked about
it; do not re-litigate what the runner owns (e.g. do not re-judge 1.4.3 contrast — a different
runner owns it). What reaches you is the **auto-PARTIAL residue**: the keyboard-operability
obligations the synthetic probes could *not* confirm on this snapshot (handlers inert under a
`noscript` serve, a control rendered only at runtime, a key-response that needs live JS). You
judge that residue and nothing else. Every WCAG soundness caveat below is kept verbatim — they are
what STOP a false clear or a false barrier.

## What you JUDGE
Scope: the **auto-PARTIAL residue only** — keyboard operability the synthetic probes could not
confirm. You are deciding *meaning* over evidence the runner could not turn into a clean verdict:

- **Does it even need to be operable?** From the vision crop, judge whether the thing *presents as
  a control* (button/link/widget affordance). If it looks like a button or link, it must be
  reachable and operable; a purely decorative graphic carries no 2.1.1 obligation.
- **What keys *should* this role honor?** "Operable" is role-specific (ARIA Authoring Practices):
  a `menu` / `tablist` / `listbox` / `radiogroup` / `slider` is driven by **arrow keys** (+
  Home/End/Esc), not just Enter/Space; a `dialog` needs Esc. Judge the residue against the keys
  the handed role *should* honor — a transcript showing only Enter/Space tried on an arrow-driven
  widget is an **incomplete probe**, not evidence of operability.
- **Is the missing confirmation a real barrier or just an inert-snapshot artifact?** A control
  that is reachable, properly-roled, and carries handlers but whose key response could not fire
  (snapshot JS didn't run faithfully) is the residue you mark **PARTIAL** — say *what* is missing.
  An unreachable target, a roleless custom control, or a pointer-only affordance with no keyboard
  path is a real barrier even on a frozen snapshot — judge it **REPRODUCED**.

## Evidence you are handed
You judge over these; you do not collect them.

1. **Precomputed a11y-eval signals (DOM + AX + axe).**
   - The **Tab walk**: the focus trajectory the Tab driver recorded from the top (cap ~200),
     each step's `document.activeElement`. Whether the target ever appears tells you
     reachability. A control that never enters the Tab sequence (the Openroll "Login" `<div>`:
     `role`/`tabindex`/`href` all null) is unreachable.
   - **Semantics from the AX node** (`role`, `name`, state, ignored reasons): a
     reachable-but-roleless element (`role:generic`, no name) still fails 4.1.2. axe
     `nested-interactive` flags `<button>`-in-`<a>` / `<a>`-in-`<button>` (the o11 Excel toggle).
   - **Focusability of data-viz points**: for charts/maps, whether data points are focusable at
     all (the Yahoo chart: 435 `<path>`, 0 focusable).
   - **Pointer-only / drag affordances**: whether a keyboard path exists to *initiate* a hover-only
     menu or a **drag operation** (the Zillow draw-to-select).
2. **VSR announcement / transcript (realism-corrected).** The result of the act()/press probe —
   which keys were exercised and what the control did (or that the transcript is silent). Read it
   as *what the probe could exercise*; a silent or Enter/Space-only transcript on an arrow-driven
   widget is a probe limit, not a clear.
3. **The declared vision crops.** The screenshot(s) of the target in the relevant state — your
   evidence for the looks-interactive judgment (does it present as a control) and for confirming a
   visible affordance the keyboard probe could not exercise.

## WCAG soundness caveats (these STOP a false clear or false barrier)
- **Role-expected keys, not Enter/Space everywhere.** Judging an arrow-driven widget (`menu` /
  `tablist` / `listbox` / `radiogroup` / `slider`) only against Enter/Space gives a false verdict.
  Require the keys the role *should* honor (arrows + Home/End/Esc; `dialog` → Esc).
- **Roleless ≠ operable.** A reachable element with `role:generic` and no name still fails **4.1.2
  Name, Role, Value (A)** even if a click handler exists.
- **Drag and gesture carry their own SCs — cite them with levels.** A **drag** operation that has
  no single-pointer alternative also fails **2.5.7 Dragging Movements (AA, WCAG 2.2)**; a
  path/multipoint **gesture** fails **2.5.1 Pointer Gestures (A)** — cite these alongside **2.1.1
  Keyboard (A)**, each with its level, rather than collapsing everything into 2.1.1.
- **Inert snapshot ≠ operable.** Key responses depend on the page's JS executing. On a
  `noscript`-served SPA the handlers are inert — a silent key probe there is **not** evidence the
  control works. Lean on the static reachability/semantics signals and mark the operability half
  **PARTIAL** rather than clearing it.
- **Absent ≠ passing.** If the control isn't in the snapshot (rendered only at runtime / not
  captured), that is **N/A** (a capture-fidelity gap), not a clear and not a barrier.

## Output
One verdict: **REPRODUCED** (unreachable, roleless, or pointer-only with no keyboard path) /
**NOT REPRODUCED** (reachable, properly-roled, responds to its role-expected keys) / **PARTIAL**
(reachable + handlers present but the key response couldn't fire on this snapshot — name what's
missing) / **N/A** (control absent from the snapshot). For drag/gesture barriers, cite 2.1.1 plus
2.5.7 / 2.5.1 with their levels.
